'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Box, FolderOpen, Link2, Trash2, Upload } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { Component3D, ExplodeDirection, MaterialKind } from '@/lib/types';
import { SITE_URL, siteUrl } from '@/lib/utils';
import { MediaPicker } from './image-field';
import { ListEditor } from './list-editor';
import { useToast } from './toast';
import { errorMessage } from './use-admin-query';
import { AdminButton, Field, FormGrid, Input, Select, Textarea, Toggle } from './ui';

const MATERIAL_OPTIONS: { value: MaterialKind; label: string }[] = [
  { value: 'fabric', label: 'Fabric' },
  { value: 'leather', label: 'Leather' },
  { value: 'wood', label: 'Wood' },
  { value: 'metal', label: 'Metal' },
  { value: 'foam', label: 'Foam' },
  { value: 'glass', label: 'Glass' },
  { value: 'stone', label: 'Stone & marble' },
  { value: 'rattan', label: 'Rattan & cane' },
  { value: 'plastic', label: 'Plastic' },
  { value: 'other', label: 'Other' },
];

const EXPLODE_OPTIONS: { value: ExplodeDirection; label: string }[] = [
  { value: 'auto', label: 'Auto (from where it sits)' },
  { value: 'none', label: 'Stay in place' },
  { value: 'up', label: 'Move up' },
  { value: 'down', label: 'Move down' },
  { value: 'front', label: 'Move to the front' },
  { value: 'back', label: 'Move to the back' },
  { value: 'left', label: 'Move left' },
  { value: 'right', label: 'Move right' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));

const newComponent = (): Component3D => ({
  id: newId(),
  name: '',
  material: 'fabric',
  finish: '',
  description: '',
  color: '',
  source: 'file',
  part: '',
  file: '',
  explode: 'auto',
  visible: true,
});

const fileName = (url: string) => decodeURIComponent(url.split('?')[0].split('/').pop() || url);

/** One .glb file: upload, pick from the media library, paste a url or remove. */
export function ModelField({ label, value, onChange, hint }: { label: string; value: string; onChange: (url: string) => void; hint?: string }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');

  const upload = async (files: FileList | File[] | null) => {
    const file = files ? Array.from(files)[0] : undefined;
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast.error('Please choose a .glb file (binary glTF with its textures inside).');
      return;
    }
    setUploading(true);
    try {
      const res = await adminApi.uploadModels([file]);
      onChange(res.files[0].url);
      toast.success('3D model uploaded');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    upload(e.dataTransfer.files);
  };

  return (
    <div>
      <span className="admin-label">{label}</span>
      <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="flex items-center gap-3 rounded-sm border border-dashed border-line-strong bg-surface px-3 py-2.5">
        <Box size={18} strokeWidth={1.6} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate text-sm" title={value || undefined}>
          {uploading ? 'Uploading...' : value ? fileName(value) : <span className="text-muted">No 3D file yet. Drop a .glb here or use the buttons.</span>}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <AdminButton variant="secondary" size="sm" type="button" loading={uploading} onClick={() => input.current?.click()} icon={<Upload size={13} />}>
          Upload .glb
        </AdminButton>
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => setPicker(true)} icon={<FolderOpen size={13} />}>
          Library
        </AdminButton>
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => setUrlMode((v) => !v)} icon={<Link2 size={13} />}>
          URL
        </AdminButton>
        {value && (
          <AdminButton variant="danger" size="sm" type="button" onClick={() => onChange('')} icon={<Trash2 size={13} />}>
            Remove
          </AdminButton>
        )}
      </div>
      {urlMode && (
        <div className="mt-2 flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://... or /uploads/... ending in .glb" />
          <AdminButton
            type="button"
            size="sm"
            onClick={() => {
              if (!url.trim()) return;
              onChange(url.trim());
              setUrl('');
              setUrlMode(false);
            }}
          >
            Use
          </AdminButton>
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <input ref={input} type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={(e) => upload(e.target.files)} />
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={([picked]) => picked && onChange(picked)} kind="model" />
    </div>
  );
}

type PreviewStatus = { parts: string[]; missing: string[]; error: string | null };
type PreviewConfig = { model3d: string; components3d: Component3D[]; name: string };

const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

/**
 * Live preview: the storefront's /embed/3d page in an iframe. It receives the unsaved model and
 * components and reports back the part names it finds in the model.
 */
function Model3DPreview({ config, onStatus }: { config: PreviewConfig; onStatus: (status: PreviewStatus) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(config);
  const [ready, setReady] = useState(false);
  const siteOrigin = useMemo(() => new URL(SITE_URL).origin, []);

  useEffect(() => {
    latest.current = config;
  }, [config]);

  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({ source: 'cyp-admin', type: 'config', ...latest.current }, siteOrigin);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== siteOrigin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { source?: string; type?: string; parts?: unknown; missingParts?: unknown; error?: unknown } | null;
      if (!d || d.source !== 'cyp-3d') return;
      if (d.type === 'ready') {
        setReady(true);
        send();
      }
      if (d.type === 'status') onStatus({ parts: strings(d.parts), missing: strings(d.missingParts), error: typeof d.error === 'string' ? d.error : null });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [siteOrigin, onStatus]);

  // Send changes while editing (debounced so typing does not reload the model on every key)
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => frame.current?.contentWindow?.postMessage({ source: 'cyp-admin', type: 'config', ...config }, siteOrigin), 450);
    return () => clearTimeout(timer);
  }, [ready, config, siteOrigin]);

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-surface">
      <iframe ref={frame} src={siteUrl('/embed/3d')} title="3D preview" className="block aspect-[16/10] w-full" allow="fullscreen" />
    </div>
  );
}

/** "3D view" section of the product form: main model, components and a live preview. */
export function Model3DEditor({ model3d, components, name, onChange }: { model3d: string; components: Component3D[]; name: string; onChange: (patch: { model3d?: string; components3d?: Component3D[] }) => void }) {
  const [status, setStatus] = useState<PreviewStatus>({ parts: [], missing: [], error: null });
  const handleStatus = useCallback((next: PreviewStatus) => setStatus(next), []);
  const config = useMemo(() => ({ model3d, components3d: components, name }), [model3d, components, name]);
  const shownCount = components.filter((c) => c.visible).length;

  return (
    <div className="space-y-6">
      <div>
        <Model3DPreview config={config} onStatus={handleStatus} />
        <p className="mt-2 text-xs text-muted">
          {status.error ? (
            <span className="text-danger">The 3D file could not be loaded: {status.error}</span>
          ) : model3d ? (
            `${status.parts.length} named parts found in the main model · ${shownCount} of ${components.length} components shown on the website.`
          ) : (
            'Add a main model, or component files that together make the piece. Use "View components" in the preview to test the split view.'
          )}
          {status.missing.length > 0 && <span className="text-danger"> Not found in the model: {status.missing.join(', ')}.</span>}
        </p>
      </div>

      <ModelField
        label="Main 3D model"
        value={model3d}
        onChange={(url) => onChange({ model3d: url })}
        hint="Binary glTF (.glb) with its textures inside, up to 60 MB. Shown when visitors click View in 3D."
      />

      <div>
        <span className="admin-label">Components</span>
        <p className="mb-3 text-xs text-muted">
          The parts visitors see when the furniture splits apart. Each one is either its own .glb file, exported from the same scene as the main model so it lines up, or a named part of the main model. Switch off
          &quot;Show on the website&quot; to hide a component.
        </p>
        <ListEditor
          items={components}
          onChange={(list) => onChange({ components3d: list })}
          create={newComponent}
          addLabel="Add component"
          max={40}
          title={(c) => [c.name || 'Component', MATERIAL_OPTIONS.find((m) => m.value === c.material)?.label, c.visible ? '' : 'hidden'].filter(Boolean).join(' · ')}
          emptyText="Add parts such as Seat cushions (fabric), Frame (wood) or Legs (metal)."
          render={(c, update) => (
            <div className="space-y-4">
              <FormGrid>
                <Field label="Name">
                  <Input value={c.name} onChange={(e) => update({ name: e.target.value })} placeholder="Seat cushions" maxLength={80} />
                </Field>
                <Field label="Material">
                  <Select value={c.material} onChange={(e) => update({ material: e.target.value as MaterialKind })}>
                    {MATERIAL_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Finish" hint="e.g. Velvet, charcoal or Solid mahogany">
                  <Input value={c.finish} onChange={(e) => update({ finish: e.target.value })} maxLength={120} />
                </Field>
                <Field label="Swatch colour (optional)">
                  <div className="flex items-center gap-2">
                    <input type="color" value={HEX.test(c.color) ? c.color : '#cccccc'} onChange={(e) => update({ color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-sm border border-line bg-white p-1" aria-label="Pick swatch colour" />
                    <Input value={c.color} onChange={(e) => update({ color: e.target.value })} placeholder="#hex" className="font-mono" maxLength={20} />
                  </div>
                </Field>
              </FormGrid>
              <Field label="Description">
                <Textarea value={c.description} onChange={(e) => update({ description: e.target.value })} className="min-h-[70px]" maxLength={600} />
              </Field>
              <FormGrid>
                <Field label="3D source">
                  <Select value={c.source} onChange={(e) => update({ source: e.target.value as Component3D['source'] })}>
                    <option value="file">Its own 3D file (.glb)</option>
                    <option value="part">A part of the main model</option>
                  </Select>
                </Field>
                <Field label="When the model splits apart">
                  <Select value={c.explode} onChange={(e) => update({ explode: e.target.value as ExplodeDirection })}>
                    {EXPLODE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormGrid>
              {c.source === 'file' ? (
                <ModelField label="Component file" value={c.file} onChange={(file) => update({ file })} />
              ) : (
                <Field
                  label="Part of the main model"
                  hint={status.parts.length ? `${status.parts.length} parts found in the main model.` : 'Add the main model first; its parts then appear here.'}
                  error={c.part && status.missing.includes(c.part) ? 'This part is not in the main model.' : undefined}
                >
                  {status.parts.length ? (
                    <Select value={c.part} onChange={(e) => update({ part: e.target.value })}>
                      <option value="">Choose a part</option>
                      {status.parts.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      {c.part && !status.parts.includes(c.part) && <option value={c.part}>{c.part} (not found)</option>}
                    </Select>
                  ) : (
                    <Input value={c.part} onChange={(e) => update({ part: e.target.value })} placeholder="Part name in the .glb, e.g. Seat_cushions" />
                  )}
                </Field>
              )}
              <Toggle checked={c.visible} onChange={(visible) => update({ visible })} label="Show on the website" hint="Hidden components stay saved, but visitors do not see them." />
            </div>
          )}
        />
      </div>
    </div>
  );
}
