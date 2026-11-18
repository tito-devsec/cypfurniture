'use client';

import { useCallback, useEffect, useState } from 'react';
import { has3dView } from '@/lib/model3d';
import type { Component3D } from '@/lib/types';
import { Product3D, type ViewerStatus } from './product-3d';

/**
 * Live 3D preview for the admin panel. The admin embeds /embed/3d in an iframe and sends the
 * unsaved model and components with postMessage; the page answers with the part names it finds
 * in the model and any loading problem. Only the admin origin may talk to it.
 */
const ADMIN_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002').origin;
  } catch {
    return 'http://localhost:3002';
  }
})();

type Config = { model3d: string; components3d: Component3D[]; name: string };

function post(message: Record<string, unknown>) {
  window.parent?.postMessage({ source: 'cyp-3d', ...message }, ADMIN_ORIGIN);
}

export function Embed3D() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ADMIN_ORIGIN) return;
      const d = e.data as (Partial<Config> & { source?: string; type?: string }) | null;
      if (!d || d.source !== 'cyp-admin' || d.type !== 'config') return;
      setConfig({
        model3d: typeof d.model3d === 'string' ? d.model3d : '',
        components3d: Array.isArray(d.components3d) ? d.components3d : [],
        name: typeof d.name === 'string' && d.name ? d.name : 'Product',
      });
    };
    window.addEventListener('message', onMessage);
    post({ type: 'ready' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onStatus = useCallback((status: ViewerStatus) => post({ type: 'status', ...status }), []);

  if (!config) return <Message text="Waiting for the admin panel" />;
  if (!has3dView(config.model3d, config.components3d)) return <Message text="Add a 3D model (.glb) or component files to see the preview." />;
  return <Product3D model={config.model3d} components={config.components3d} name={config.name} className="h-dvh" onStatus={onStatus} />;
}

function Message({ text }: { text: string }) {
  return <div className="flex h-dvh items-center justify-center bg-surface p-6 text-center text-sm text-muted">{text}</div>;
}
