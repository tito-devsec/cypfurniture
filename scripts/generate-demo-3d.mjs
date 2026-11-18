// Builds the demo 3D sofa used on the demo product "Aria 3-Seater Sofa": the assembled model and one
// .glb per component (all in the same coordinates, so they line up exactly). Replace it with real
// models made by a 3D designer; see "3D models" in the README.
//
//   node scripts/generate-demo-3d.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// GLTFExporter reads its output through FileReader, which Node does not have
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'web', 'public', 'models', 'demo');

const material = (name, color, roughness, metalness = 0) => Object.assign(new THREE.MeshStandardMaterial({ color, roughness, metalness }), { name });
const M = {
  frame: material('Slate linen', '#5E646B', 0.92),
  cushion: material('Warm grey linen', '#878D94', 0.95),
  accent: material('Terracotta velvet', '#B5674D', 0.85),
  wood: material('Walnut', '#5B3A29', 0.55),
  metal: material('Black steel', '#1E1E1E', 0.35, 0.8),
};

function box(name, [w, h, d], radius, mat, [x, y, z], [rx, rz] = [0, 0]) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, 0, rz);
  return mesh;
}

function group(name, children) {
  const g = new THREE.Group();
  g.name = name;
  children.forEach((c) => g.add(c));
  return g;
}

// Metres: 2.2 m wide, 0.92 m deep, seat at about 0.42 m
const W = 2.2;
const D = 0.92;
const seatsX = [-0.6, 0, 0.6];

const parts = {
  frame: group('Upholstered_frame', [
    box('Back_panel', [2.16, 0.62, 0.18], 0.05, M.frame, [0, 0.51, -0.37]),
    box('Arm_left', [0.18, 0.42, 0.88], 0.05, M.frame, [-1.0, 0.41, 0]),
    box('Arm_right', [0.18, 0.42, 0.88], 0.05, M.frame, [1.0, 0.41, 0]),
    box('Seat_deck', [1.82, 0.06, 0.7], 0.02, M.frame, [0, 0.23, 0.08]),
  ]),
  seat: group('Seat_cushions', seatsX.map((x, i) => box(`Seat_cushion_${i + 1}`, [0.58, 0.16, 0.66], 0.06, M.cushion, [x, 0.34, 0.09]))),
  back: group('Back_cushions', seatsX.map((x, i) => box(`Back_cushion_${i + 1}`, [0.58, 0.44, 0.16], 0.06, M.cushion, [x, 0.64, -0.17], [-0.12, 0]))),
  scatter: group('Scatter_cushions', [
    box('Scatter_cushion_1', [0.4, 0.4, 0.12], 0.05, M.accent, [-0.7, 0.6, 0], [-0.28, 0.12]),
    box('Scatter_cushion_2', [0.4, 0.4, 0.12], 0.05, M.accent, [0.7, 0.6, 0], [-0.28, -0.12]),
  ]),
  base: group('Hardwood_base', [box('Base_rail', [2.16, 0.08, 0.88], 0.015, M.wood, [0, 0.16, 0])]),
  legs: group(
    'Legs',
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.016, 0.12, 20), M.metal);
      leg.name = `Leg_${i + 1}`;
      leg.position.set(sx * (W / 2 - 0.14), 0.06, sz * (D / 2 - 0.12));
      return leg;
    }),
  ),
};

const sofa = group('Aria_sofa', Object.values(parts));
const exporter = new GLTFExporter();
const write = async (object, file) => {
  const glb = await exporter.parseAsync(object, { binary: true });
  writeFileSync(path.join(OUT, file), Buffer.from(glb));
  return `${file} (${Math.round(glb.byteLength / 1024)} KB)`;
};

mkdirSync(OUT, { recursive: true });
const written = [await write(sofa, 'aria-sofa.glb')];
const files = { frame: 'frame', seat: 'seat-cushions', back: 'back-cushions', scatter: 'scatter-cushions', base: 'base', legs: 'legs' };
for (const [key, suffix] of Object.entries(files)) written.push(await write(parts[key], `aria-sofa-${suffix}.glb`));
console.log(`Demo 3D files written to web/public/models/demo: ${written.join(', ')}`);
