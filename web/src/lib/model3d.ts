import { Briefcase, GlassWater, Grid3x3, Layers, Mountain, Package, Shapes, Shirt, TreeDeciduous, Wrench, type LucideIcon } from 'lucide-react';
import type { Component3D, MaterialKind } from './types';

/** Label, icon and fallback swatch colour for each material a 3D component can be made of. */
export const MATERIALS: Record<MaterialKind, { label: string; icon: LucideIcon; tint: string }> = {
  fabric: { label: 'Fabric', icon: Shirt, tint: '#9AA0A6' },
  leather: { label: 'Leather', icon: Briefcase, tint: '#7A4A2E' },
  wood: { label: 'Wood', icon: TreeDeciduous, tint: '#8B5A2B' },
  metal: { label: 'Metal', icon: Wrench, tint: '#6B6F75' },
  foam: { label: 'Foam', icon: Layers, tint: '#E8DCC8' },
  glass: { label: 'Glass', icon: GlassWater, tint: '#BFD9DE' },
  stone: { label: 'Stone & marble', icon: Mountain, tint: '#CFCAC2' },
  rattan: { label: 'Rattan & cane', icon: Grid3x3, tint: '#C9A46B' },
  plastic: { label: 'Plastic', icon: Package, tint: '#D9D9D9' },
  other: { label: 'Other', icon: Shapes, tint: '#B7B0A6' },
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;

/** The component's swatch colour, or the material's default when the admin left it empty. */
export function swatchColor(c: Pick<Component3D, 'color' | 'material'>): string {
  return HEX.test(c.color) ? c.color : (MATERIALS[c.material] ?? MATERIALS.other).tint;
}

/** Components visitors can see: switched on by the admin and pointing at a file or a part of the model. */
export function visibleComponents(list: Component3D[] | undefined): Component3D[] {
  return (list ?? []).filter((c) => c.visible && ((c.source === 'file' && c.file) || (c.source === 'part' && c.part)));
}

/** True when a product has something to show in 3D (a main model, or component files to assemble). */
export function has3dView(model: string | undefined, components: Component3D[] | undefined): boolean {
  return Boolean(model) || visibleComponents(components).some((c) => c.source === 'file');
}
