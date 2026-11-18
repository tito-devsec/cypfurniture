'use client';

import dynamic from 'next/dynamic';
import type { ProductViewerProps } from './product-viewer';

export type { ProductViewerProps, ViewerStatus } from './product-viewer';

// three.js is large, so the viewer is only downloaded when a visitor opens the 3D view
const Viewer = dynamic(() => import('./product-viewer').then((m) => m.ProductViewer), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-surface text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Loading 3D viewer</div>,
});

export function Product3D(props: ProductViewerProps) {
  return <Viewer {...props} />;
}
