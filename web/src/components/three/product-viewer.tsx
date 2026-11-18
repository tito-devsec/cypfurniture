'use client';

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Combine, Maximize2, Minimize2, RotateCcw, Ungroup, X } from 'lucide-react';
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/gsap';
import { MATERIALS, swatchColor, visibleComponents } from '@/lib/model3d';
import type { Component3D, ExplodeDirection, MaterialKind } from '@/lib/types';
import { cn, resolveAsset } from '@/lib/utils';

/*
 * Interactive 3D viewer for a product.
 *
 * - "Assembled": the main model (or the component files put together) with orbit and zoom.
 * - "Components": the furniture splits apart. Components are either their own uploaded .glb files
 *   or named parts of the main model. Visitors can hover / click a component to see what it is made
 *   of, or filter by material (fabric, wood, metal ...).
 *
 * Models are normalised to a 2-unit box sitting on the floor, so any unit system works.
 */

/** Draco decoder files are served from /public/draco (no third-party CDN). */
const DRACO_PATH = '/draco/';
/** Highlight colour for hovered and selected components (CYP orange). */
const HIGHLIGHT = new THREE.Color('#F7941D');
/** Default camera direction: front-right, slightly above. */
const HOME_DIRECTION = new THREE.Vector3(0.62, 0.36, 1).normalize();
const DIRECTIONS: Record<Exclude<ExplodeDirection, 'auto' | 'none'>, THREE.Vector3> = {
  up: new THREE.Vector3(0, 1, 0),
  down: new THREE.Vector3(0, -1, 0),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
};

type Mode = 'assembled' | 'components';
type Look = 'normal' | 'hover' | 'selected' | 'dim';
type Controls = { target: THREE.Vector3; update: () => void; minDistance: number; maxDistance: number };
type Timeline = ReturnType<typeof gsap.timeline>;

export type ViewerStatus = { error: string | null; parts: string[]; missingParts: string[] };

export type ProductViewerProps = {
  /** Assembled model (.glb url); empty when the product only has component files */
  model: string;
  components: Component3D[];
  name: string;
  className?: string;
  /** Shows a close button (product gallery) */
  onClose?: () => void;
  /** Reports load errors and the part names found in the main model (admin preview) */
  onStatus?: (status: ViewerStatus) => void;
};

type Part = {
  id: string;
  kind: 'file' | 'part';
  object: THREE.Object3D;
  origin: THREE.Vector3;
  target: THREE.Vector3;
  /** Offset in model space, used to frame the split view */
  offset: THREE.Vector3;
  meshes: THREE.Mesh[];
};

type Assembly = {
  root: THREE.Group;
  main: THREE.Object3D | null;
  files: THREE.Group;
  parts: Part[];
  /** Meshes of the main model that are not components (stay in place, dim when something is selected) */
  body: THREE.Mesh[];
  /** mesh uuid -> component id */
  owner: Map<string, string>;
  partNames: string[];
  missing: string[];
  /** In "components" mode the main model stays visible only when parts move out of it */
  mainInComponents: boolean;
  assembled: THREE.Sphere;
  exploded: THREE.Sphere;
};

type BuiltInfo = { ids: string[]; parts: string[]; missing: string[] };

/* ------------------------------------------------------------------ helpers (plain three.js) */

/** Unique files to load: the main model first, then the component files. */
function modelSources(model: string, components: Component3D[]): string[] {
  return [...new Set([model, ...components.filter((c) => c.source === 'file').map((c) => c.file)].filter(Boolean))];
}

/** Clones a loaded scene with its own materials, so highlighting never touches the loader cache. */
function cloneWithOwnMaterials(source: THREE.Object3D) {
  const clone = source.clone(true);
  const meshes: THREE.Mesh[] = [];
  clone.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
    meshes.push(mesh);
  });
  return { clone, meshes };
}

function namesIn(object: THREE.Object3D): string[] {
  const seen = new Set<string>();
  object.traverse((o) => {
    if (o !== object && o.name && seen.size < 300) seen.add(o.name);
  });
  return [...seen];
}

function boxOf(objects: THREE.Object3D[]) {
  const box = new THREE.Box3();
  objects.forEach((o) => box.expandByObject(o));
  return box;
}

function buildAssembly(mainScene: THREE.Object3D | null, scenes: Map<string, THREE.Object3D>, components: Component3D[]): Assembly {
  const root = new THREE.Group();
  const files = new THREE.Group();
  const owner = new Map<string, string>();
  const parts: Part[] = [];
  const missing: string[] = [];

  const main = mainScene ? cloneWithOwnMaterials(mainScene) : null;
  main?.clone.updateMatrixWorld(true);

  for (const c of components) {
    if (c.source === 'part') {
      const node = main?.clone.getObjectByName(c.part);
      if (!node) {
        missing.push(c.part);
        continue;
      }
      const meshes: THREE.Mesh[] = [];
      node.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && !owner.has(mesh.uuid)) meshes.push(mesh);
      });
      if (!meshes.length) continue;
      meshes.forEach((m) => owner.set(m.uuid, c.id));
      parts.push({ id: c.id, kind: 'part', object: node, origin: node.position.clone(), target: node.position.clone(), offset: new THREE.Vector3(), meshes });
    } else {
      const scene = scenes.get(c.file);
      if (!scene) continue;
      const { clone, meshes } = cloneWithOwnMaterials(scene);
      const group = new THREE.Group();
      group.add(clone);
      files.add(group);
      meshes.forEach((m) => owner.set(m.uuid, c.id));
      parts.push({ id: c.id, kind: 'file', object: group, origin: new THREE.Vector3(), target: new THREE.Vector3(), offset: new THREE.Vector3(), meshes });
    }
  }
  files.updateMatrixWorld(true);

  const body = main ? main.meshes.filter((m) => !owner.has(m.uuid)) : [];
  const hasFiles = files.children.length > 0;
  const mainInComponents = Boolean(main) && (parts.some((p) => p.kind === 'part') || !hasFiles);

  // Size and position everything from the main model (or from the component files when there is none)
  const base = main ? new THREE.Box3().setFromObject(main.clone) : new THREE.Box3().setFromObject(files);
  if (base.isEmpty()) base.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 1, 1));
  const size = base.getSize(new THREE.Vector3());
  const center = base.getCenter(new THREE.Vector3());
  const scale = 2 / (Math.max(size.x, size.y, size.z) || 1);

  // Where each component goes when the model splits apart
  const everything = base.clone();
  if (main && hasFiles) everything.union(new THREE.Box3().setFromObject(files));
  const middle = everything.getCenter(new THREE.Vector3());
  const span = Math.max(...everything.getSize(new THREE.Vector3()).toArray()) || 1;
  const distance = span * 0.42;
  const explodeOf = new Map(components.map((c) => [c.id, c.explode]));
  const place = (p: Part, offset: THREE.Vector3) => {
    p.offset.copy(offset);
    const local = offset.clone();
    const parent = p.object.parent;
    if (parent) local.applyMatrix3(new THREE.Matrix3().setFromMatrix4(parent.matrixWorld.clone().invert()));
    p.target.copy(p.origin).add(local);
  };
  const central: Part[] = [];
  for (const p of parts) {
    const explode = explodeOf.get(p.id) ?? 'auto';
    if (explode === 'none') continue;
    if (explode !== 'auto') {
      place(p, DIRECTIONS[explode].clone().multiplyScalar(distance));
      continue;
    }
    const away = new THREE.Box3().setFromObject(p.object).getCenter(new THREE.Vector3()).sub(middle);
    if (away.length() < span * 0.06) central.push(p);
    else place(p, away.normalize().multiplyScalar(distance));
  }
  // Parts in the middle: a single one stays as the core, several fan out around it
  if (central.length > 1) {
    central.forEach((p, i) => {
      const a = (i / central.length) * Math.PI * 2;
      place(p, new THREE.Vector3(Math.sin(a), 0.25, Math.cos(a)).multiplyScalar(distance));
    });
  }

  // Bounds of the split view (model space)
  const explodedBox = new THREE.Box3();
  if (mainInComponents && body.length) explodedBox.union(boxOf(body));
  for (const p of parts) explodedBox.union(new THREE.Box3().setFromObject(p.object).translate(p.offset));
  if (explodedBox.isEmpty()) explodedBox.copy(base);

  // Normalise: 2 units across, standing on the floor (y = 0), centred
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -base.min.y * scale, -center.z * scale);
  root.updateMatrix();
  const toView = (box: THREE.Box3) => box.clone().applyMatrix4(root.matrix).getBoundingSphere(new THREE.Sphere());
  const assembled = toView(base);
  const exploded = toView(explodedBox);

  if (main) root.add(main.clone);
  root.add(files);
  files.visible = !main;

  return { root, main: main?.clone ?? null, files, parts, body, owner, partNames: main ? namesIn(main.clone) : [], missing, mainInComponents, assembled, exploded };
}

type SavedLook = { opacity: number; transparent: boolean; depthWrite: boolean; emissive: THREE.Color | null; emissiveIntensity: number };

function applyLook(mesh: THREE.Mesh, look: Look) {
  for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
    const m = material as THREE.MeshStandardMaterial;
    const base: SavedLook = (m.userData.cypBase ??= {
      opacity: m.opacity,
      transparent: m.transparent,
      depthWrite: m.depthWrite,
      emissive: m.emissive ? m.emissive.clone() : null,
      emissiveIntensity: m.emissiveIntensity ?? 1,
    });
    const dim = look === 'dim';
    const transparent = dim || base.transparent;
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
    m.opacity = dim ? Math.min(base.opacity, 0.14) : base.opacity;
    m.depthWrite = dim ? false : base.depthWrite;
    if (m.emissive && base.emissive) {
      const glow = look === 'selected' ? 0.34 : look === 'hover' ? 0.18 : 0;
      if (glow) {
        m.emissive.copy(HIGHLIGHT);
        m.emissiveIntensity = glow;
      } else {
        m.emissive.copy(base.emissive);
        m.emissiveIntensity = base.emissiveIntensity;
      }
    }
  }
}

function applyLooks(a: Assembly, mode: Mode, selectedId: string | null, hoveredId: string | null, filter: MaterialKind | null, materialOf: Map<string, MaterialKind>) {
  const active = mode === 'components';
  for (const p of a.parts) {
    let look: Look = 'normal';
    if (active) {
      if (selectedId) look = p.id === selectedId ? 'selected' : 'dim';
      else if (filter) look = materialOf.get(p.id) === filter ? 'selected' : 'dim';
      else if (hoveredId === p.id) look = 'hover';
    }
    p.meshes.forEach((m) => applyLook(m, look));
  }
  const bodyLook: Look = active && (selectedId || filter) ? 'dim' : 'normal';
  a.body.forEach((m) => applyLook(m, bodyLook));
}

function animateParts(a: Assembly, mode: Mode, duration: number): Timeline {
  const exploding = mode === 'components';
  if (exploding) {
    a.files.visible = true;
    if (a.main) a.main.visible = a.mainInComponents;
  }
  const tl = gsap.timeline({ defaults: { duration, ease: 'power3.inOut' } });
  a.parts.forEach((p, i) => {
    const to = exploding ? p.target : p.origin;
    tl.to(p.object.position, { x: to.x, y: to.y, z: to.z }, i * 0.05 * (duration ? 1 : 0));
  });
  if (!exploding) {
    tl.call(() => {
      if (a.main) a.main.visible = true;
      a.files.visible = !a.main;
    });
  }
  return tl;
}

function fitDistance(camera: THREE.PerspectiveCamera, aspect: number, sphere: THREE.Sphere) {
  const v = THREE.MathUtils.degToRad(camera.fov) / 2;
  const h = Math.atan(Math.tan(v) * aspect);
  return (sphere.radius / Math.sin(Math.min(v, h))) * 1.04;
}

function moveCamera(camera: THREE.PerspectiveCamera, controls: Controls, sphere: THREE.Sphere, direction: THREE.Vector3, aspect: number, duration: number): Timeline | null {
  const to = sphere.center.clone().addScaledVector(direction, fitDistance(camera, aspect, sphere));
  if (!duration) {
    camera.position.copy(to);
    controls.target.copy(sphere.center);
    controls.update();
    return null;
  }
  const tl = gsap.timeline({ defaults: { duration, ease: 'power3.inOut' }, onUpdate: () => controls.update() });
  tl.to(camera.position, { x: to.x, y: to.y, z: to.z }, 0).to(controls.target, { x: sphere.center.x, y: sphere.center.y, z: sphere.center.z }, 0);
  return tl;
}

function setLimits(camera: THREE.PerspectiveCamera, controls: Controls, a: Assembly, aspect: number) {
  controls.minDistance = a.assembled.radius * 1.15;
  controls.maxDistance = fitDistance(camera, aspect, a.exploded) * 2.4;
}

function ownerOf(a: Assembly, object: THREE.Object3D | null): string | null {
  for (let o = object; o; o = o.parent) {
    const id = a.owner.get(o.uuid);
    if (id) return id;
  }
  return null;
}

function disposeMaterials(a: Assembly) {
  a.root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
  });
}

function setCursor(element: HTMLElement, cursor: string) {
  element.style.cursor = cursor;
}

/** Neutral studio lighting generated in the browser (no HDR download). */
function applyStudioEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.85;
  return () => {
    scene.environment = null;
    env.dispose();
    pmrem.dispose();
  };
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const sameInfo = (a: BuiltInfo, b: BuiltInfo) => sameList(a.ids, b.ids) && sameList(a.parts, b.parts) && sameList(a.missing, b.missing);

function friendlyError(message: string) {
  if (/fetch|network|404|not found|load/i.test(message)) return 'The 3D file could not be downloaded.';
  if (/webgl|context/i.test(message)) return 'This browser could not start the 3D viewer.';
  return 'The 3D model could not be displayed.';
}

/* ------------------------------------------------------------------ scene (inside the canvas) */

class Boundary extends Component<{ onError: (message: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error && error.message ? error.message : 'Unknown error');
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Lighting() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => applyStudioEnvironment(gl, scene), [gl, scene]);
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d8cdc0', 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
    </>
  );
}

type SceneProps = {
  sources: string[];
  model: string;
  components: Component3D[];
  mode: Mode;
  selectedId: string | null;
  hoveredId: string | null;
  filter: MaterialKind | null;
  resetToken: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onBuilt: (info: BuiltInfo) => void;
};

function Scene({ sources, model, components, mode, selectedId, hoveredId, filter, resetToken, onHover, onSelect, onBuilt }: SceneProps) {
  const gltfs = useGLTF(sources.map(resolveAsset), DRACO_PATH);
  const assembly = useMemo(() => {
    const scenes = new Map<string, THREE.Object3D>(sources.map((s, i) => [s, gltfs[i].scene]));
    return buildAssembly(model ? (scenes.get(model) ?? null) : null, scenes, components);
  }, [sources, gltfs, model, components]);
  const materialOf = useMemo(() => new Map(components.map((c) => [c.id, c.material])), [components]);

  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const aspect = size.width / Math.max(1, size.height);
  const placed = useRef(false);
  const lastMode = useRef<Mode>(mode);
  const lastReset = useRef(resetToken);
  const duration = prefersReducedMotion() ? 0 : 0.9;

  useEffect(() => () => disposeMaterials(assembly), [assembly]);

  useEffect(() => {
    onBuilt({ ids: assembly.parts.map((p) => p.id), parts: assembly.partNames, missing: assembly.missing });
  }, [assembly, onBuilt]);

  // Camera: frame the model once, then follow mode changes and "reset view"
  useEffect(() => {
    if (!controls) return;
    setLimits(camera, controls, assembly, aspect);
    const sphere = mode === 'components' ? assembly.exploded : assembly.assembled;
    if (!placed.current) {
      placed.current = true;
      lastMode.current = mode;
      lastReset.current = resetToken;
      moveCamera(camera, controls, sphere, HOME_DIRECTION, aspect, 0);
      return;
    }
    let direction: THREE.Vector3 | null = null;
    if (resetToken !== lastReset.current) direction = HOME_DIRECTION;
    else if (mode !== lastMode.current) direction = camera.position.clone().sub(controls.target).normalize();
    lastMode.current = mode;
    lastReset.current = resetToken;
    if (!direction) return;
    const tl = moveCamera(camera, controls, sphere, direction, aspect, duration);
    return () => {
      tl?.kill();
    };
  }, [assembly, camera, controls, aspect, mode, resetToken, duration]);

  // Split apart / put back together
  useEffect(() => {
    const tl = animateParts(assembly, mode, duration);
    return () => {
      tl.kill();
    };
  }, [assembly, mode, duration]);

  // Highlight the hovered / selected / filtered components and dim the rest
  useEffect(() => {
    applyLooks(assembly, mode, selectedId, hoveredId, filter, materialOf);
  }, [assembly, mode, selectedId, hoveredId, filter, materialOf]);

  useEffect(() => {
    setCursor(gl.domElement, mode === 'components' && hoveredId ? 'pointer' : 'grab');
  }, [gl, mode, hoveredId]);

  const interactive = mode === 'components';
  return (
    <primitive
      object={assembly.root}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (!interactive) return;
        e.stopPropagation();
        onHover(ownerOf(assembly, e.object));
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!interactive) return;
        const id = ownerOf(assembly, e.object);
        if (!id) return;
        e.stopPropagation();
        onSelect(id);
      }}
    />
  );
}

/* ------------------------------------------------------------------ viewer (canvas + controls) */

const iconButton = 'flex h-9 w-9 items-center justify-center bg-white/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-ink hover:text-white';
const chip = 'inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] shadow-sm backdrop-blur transition-colors';

export function ProductViewer({ model, components, name, className, onClose, onStatus }: ProductViewerProps) {
  // Keyed by content, so a new but identical list (every admin preview update) does not rebuild the scene
  const shownKey = JSON.stringify(visibleComponents(components));
  const shown = useMemo(() => JSON.parse(shownKey) as Component3D[], [shownKey]);
  const sources = useMemo(() => modelSources(model, shown), [model, shown]);
  const [mode, setMode] = useState<Mode>('assembled');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MaterialKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [info, setInfo] = useState<BuiltInfo>({ ids: [], parts: [], missing: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const { active, progress } = useProgress();

  const available = shown.filter((c) => info.ids.includes(c.id));
  const selected = available.find((c) => c.id === selectedId) ?? null;
  const hovered = available.find((c) => c.id === hoveredId) ?? null;
  const kinds = [...new Set(available.map((c) => c.material))];
  const canSplit = available.length > 0;

  const handleBuilt = useCallback((next: BuiltInfo) => setInfo((prev) => (sameInfo(prev, next) ? prev : next)), []);
  const handleSelect = useCallback((id: string) => setSelectedId((current) => (current === id ? null : id)), []);

  useEffect(() => {
    onStatus?.({ error, parts: info.parts, missingParts: info.missing });
  }, [error, info, onStatus]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  // Info card and component chips slide in
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo('[data-c3d-card]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    },
    { dependencies: [selectedId], scope: containerRef },
  );
  useGSAP(
    () => {
      if (mode !== 'components' || prefersReducedMotion()) return;
      gsap.fromTo('[data-c3d-chip]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' });
    },
    { dependencies: [mode], scope: containerRef },
  );

  const toggleMode = () => {
    setSelectedId(null);
    setHoveredId(null);
    setFilter(null);
    setAutoRotate(false);
    setInteracted(true);
    setMode((m) => (m === 'components' ? 'assembled' : 'components'));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else containerRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const retry = () => {
    useGLTF.clear(sources.map(resolveAsset));
    setError(null);
    setAttempt((a) => a + 1);
  };

  const SelectedIcon = selected ? (MATERIALS[selected.material] ?? MATERIALS.other).icon : null;

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden bg-surface', className)}>
      <Boundary onError={setError}>
        <Canvas
          dpr={[1, 2]}
          camera={{ fov: 32, near: 0.05, far: 200, position: [2.4, 1.6, 4] }}
          gl={{ antialias: true, alpha: true }}
          onPointerMissed={() => setSelectedId(null)}
          className="touch-none"
          role="img"
          aria-label={`3D view of ${name}`}
        >
          <Lighting />
          <Boundary key={attempt} onError={setError}>
            <Suspense fallback={null}>
              {sources.length > 0 && (
                <Scene
                  sources={sources}
                  model={model}
                  components={shown}
                  mode={mode}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  filter={filter}
                  resetToken={resetToken}
                  onHover={setHoveredId}
                  onSelect={handleSelect}
                  onBuilt={handleBuilt}
                />
              )}
            </Suspense>
          </Boundary>
          {mode === 'assembled' && <ContactShadows position={[0, 0, 0]} scale={7} far={2.4} blur={2.6} opacity={0.38} resolution={512} />}
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoRotate && mode === 'assembled'}
            autoRotateSpeed={0.7}
            maxPolarAngle={Math.PI * 0.495}
            onStart={() => {
              setInteracted(true);
              setAutoRotate(false);
            }}
          />
        </Canvas>
      </Boundary>

      {active && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 px-5 py-3 text-center shadow-soft">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink">Loading 3D model</p>
            <div className="mt-2 h-0.5 w-40 bg-line">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${Math.round(progress)}%` }} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/95 p-6 text-center">
          <p className="font-display text-xl">{friendlyError(error)}</p>
          <p className="max-w-xs text-xs text-muted">{error}</p>
          <div className="flex gap-2">
            <button type="button" onClick={retry} className="bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-accent">
              Try again
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="border border-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-white">
                Back to photos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top: split / assemble, the material filter and the view buttons */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          {canSplit && (
            <button type="button" onClick={toggleMode} aria-pressed={mode === 'components'} className="inline-flex shrink-0 items-center gap-2 bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white shadow-sm transition-colors hover:bg-accent">
              {mode === 'components' ? <Combine size={15} strokeWidth={1.8} /> : <Ungroup size={15} strokeWidth={1.8} />}
              {mode === 'components' ? 'Assemble' : 'View components'}
            </button>
          )}
          {mode === 'components' &&
            kinds.length > 1 &&
            [null, ...kinds].map((k) => {
              const meta = k ? (MATERIALS[k] ?? MATERIALS.other) : null;
              const Icon = meta?.icon;
              const on = filter === k;
              return (
                <button
                  key={k ?? 'all'}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setFilter(k);
                    setSelectedId(null);
                  }}
                  className={cn(chip, on ? 'bg-ink text-white' : 'bg-white/90 text-ink hover:bg-white')}
                >
                  {Icon && <Icon size={13} strokeWidth={1.8} />}
                  {meta ? meta.label : 'All'}
                </button>
              );
            })}
        </div>
        <div className="pointer-events-auto flex shrink-0 gap-1.5">
          <button type="button" onClick={() => setResetToken((t) => t + 1)} className={iconButton} aria-label="Reset view" title="Reset view">
            <RotateCcw size={16} strokeWidth={1.8} />
          </button>
          <button type="button" onClick={toggleFullscreen} className={iconButton} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} title={fullscreen ? 'Exit full screen' : 'Full screen'}>
            {fullscreen ? <Minimize2 size={16} strokeWidth={1.8} /> : <Maximize2 size={16} strokeWidth={1.8} />}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className={iconButton} aria-label="Close 3D view" title="Back to photos">
              <X size={17} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      {mode === 'components' && !selected && (
        <p className={cn('pointer-events-none absolute bottom-14 left-3 max-w-[calc(100%-24px)] truncate px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em]', hovered ? 'bg-ink text-white' : 'bg-white/80 text-ink-soft backdrop-blur')}>
          {hovered ? hovered.name || (MATERIALS[hovered.material] ?? MATERIALS.other).label : 'Tap a part to see what it is made of'}
        </p>
      )}

      {/* Details of the selected component */}
      {mode === 'components' && selected && (
        <div data-c3d-card className="pointer-events-auto absolute bottom-14 right-3 w-[min(300px,calc(100%-24px))] bg-white/95 p-5 shadow-soft backdrop-blur max-sm:inset-x-3 max-sm:w-auto">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              {SelectedIcon && <SelectedIcon size={14} strokeWidth={1.8} />}
              {(MATERIALS[selected.material] ?? MATERIALS.other).label}
            </p>
            <button type="button" onClick={() => setSelectedId(null)} className="-m-1 p-1 text-muted hover:text-ink" aria-label="Close details">
              <X size={16} />
            </button>
          </div>
          <h3 className="mt-2 font-display text-xl leading-tight">{selected.name || (MATERIALS[selected.material] ?? MATERIALS.other).label}</h3>
          {selected.finish && (
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-ink/10" style={{ background: swatchColor(selected) }} aria-hidden="true" />
              {selected.finish}
            </p>
          )}
          {selected.description && <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{selected.description}</p>}
        </div>
      )}

      {/* Bottom: how to use it, or the list of components */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end">
        {mode === 'assembled' && (
          <p className={cn('bg-white/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-soft backdrop-blur transition-opacity', interacted && 'opacity-0')}>Drag to rotate · Scroll or pinch to zoom</p>
        )}
        {mode === 'components' && (
          <ul className="no-scrollbar pointer-events-auto flex min-w-0 gap-1.5 overflow-x-auto" aria-label="Components">
            {available.map((c) => (
              <li key={c.id} data-c3d-chip>
                <button type="button" onClick={() => handleSelect(c.id)} aria-pressed={selectedId === c.id} className={cn(chip, selectedId === c.id ? 'bg-ink text-white' : 'bg-white/90 text-ink hover:bg-white')}>
                  <span className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/10" style={{ background: swatchColor(c) }} aria-hidden="true" />
                  {c.name || (MATERIALS[c.material] ?? MATERIALS.other).label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
