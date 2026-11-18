import type { Metadata } from 'next';
import { Embed3D } from '@/components/three/embed-3d';

export const metadata: Metadata = { title: '3D preview', robots: { index: false, follow: false } };

/** Bare page the admin panel embeds to preview a product's 3D view (no header or footer). */
export default function Embed3DPage() {
  return <Embed3D />;
}
