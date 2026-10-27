'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { Category, Product, ProductColor, ProductOption, ProductSpec } from '@/lib/types';
import { siteUrl, slugify } from '@/lib/utils';
import { ImageListField, type ImageItem } from './image-field';
import { ListEditor } from './list-editor';
import { MarkdownField } from './markdown-field';
import { useToast } from './toast';
import { useAdminQuery, errorMessage } from './use-admin-query';
import { useSiteSettings } from './use-settings';
import { AdminButton, Card, Field, FormGrid, Input, Select, Textarea, Toggle } from './ui';

export type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  shortDescription: string;
  description: string;
  materials: string;
  dimensions: string;
  tags: string;
  images: ImageItem[];
  colors: ProductColor[];
  options: { name: string; values: string }[];
  specs: ProductSpec[];
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isActive: boolean;
};

export function toFormValues(p?: Product): ProductFormValues {
  return {
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    sku: p?.sku ?? '',
    categoryId: p?.categoryId ? String(p.categoryId) : '',
    price: p ? String(p.price) : '',
    compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : '',
    stock: p ? String(p.stock) : '10',
    shortDescription: p?.shortDescription ?? '',
    description: p?.description ?? '',
    materials: p?.materials ?? '',
    dimensions: p?.dimensions ?? '',
    tags: p?.tags.join(', ') ?? '',
    images: p?.images.map((i) => ({ url: i.url, alt: i.alt })) ?? [],
    colors: p?.colors ?? [],
    options: p?.options.map((o) => ({ name: o.name, values: o.values.join(', ') })) ?? [],
    specs: p?.specs ?? [],
    isFeatured: p?.isFeatured ?? false,
    isNew: p?.isNew ?? false,
    isBestSeller: p?.isBestSeller ?? false,
    isActive: p?.isActive ?? true,
  };
}

function toPayload(v: ProductFormValues) {
  const options: ProductOption[] = v.options
    .map((o) => ({ name: o.name.trim(), values: o.values.split(',').map((s) => s.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length);
  return {
    name: v.name.trim(),
    slug: v.slug.trim() || undefined,
    sku: v.sku.trim(),
    categoryId: v.categoryId ? Number(v.categoryId) : null,
    price: Number(v.price) || 0,
    compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    stock: Number(v.stock) || 0,
    shortDescription: v.shortDescription,
    description: v.description,
    materials: v.materials,
    dimensions: v.dimensions,
    tags: v.tags,
    images: v.images.filter((i) => i.url),
    colors: v.colors.filter((c) => c.name.trim()),
    options,
    specs: v.specs.filter((s) => s.label.trim()),
    isFeatured: v.isFeatured,
    isNew: v.isNew,
    isBestSeller: v.isBestSeller,
    isActive: v.isActive,
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const toast = useToast();
  const { commerce } = useSiteSettings();
  const [v, setV] = useState<ProductFormValues>(() => toFormValues(product));
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const { data: categories } = useAdminQuery<Category[]>('/api/categories?includeInactive=1');

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setV((s) => ({ ...s, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toPayload(v);
      if (product) {
        await adminApi.put<Product>(`/api/products/${product.id}`, payload);
        toast.success('Product saved');
        router.refresh();
      } else {
        const created = await adminApi.post<Product>('/api/products', payload);
        toast.success('Product created');
        router.push(`/products/${created.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const grouped = (categories ?? []).reduce<Record<string, Category[]>>((acc, c) => {
    const key = c.parent ? c.parent.name : c.name;
    (acc[key] ||= []).push(c);
    return acc;
  }, {});

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Basics">
          <div className="space-y-5">
            <Field label="Product name" required>
              <Input
                value={v.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (!slugTouched) set('slug', slugify(e.target.value));
                }}
                required
              />
            </Field>
            <FormGrid>
              <Field label="URL slug" hint="Shown in the address: /products/your-slug">
                <Input
                  value={v.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', e.target.value);
                  }}
                />
              </Field>
              <Field label="SKU">
                <Input value={v.sku} onChange={(e) => set('sku', e.target.value)} placeholder="CYP-1001" />
              </Field>
            </FormGrid>
            <Field label="Short description" hint="One or two sentences shown under the title and in search results.">
              <Textarea value={v.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className="min-h-[70px]" maxLength={500} />
            </Field>
            <MarkdownField label="Full description" value={v.description} onChange={(val) => set('description', val)} rows={10} />
          </div>
        </Card>

        <Card title="Images" description="Drag to the box, upload from your computer or reuse earlier uploads. The first image is the main one.">
          <ImageListField label="" value={v.images} onChange={(images) => set('images', images)} />
        </Card>

        <Card title="Details">
          <FormGrid>
            <Field label="Dimensions" hint="e.g. W 220 × D 95 × H 85 cm">
              <Input value={v.dimensions} onChange={(e) => set('dimensions', e.target.value)} />
            </Field>
            <Field label="Materials">
              <Input value={v.materials} onChange={(e) => set('materials', e.target.value)} />
            </Field>
            <Field label="Tags" hint="Comma separated. Used for search and related items." className="md:col-span-2">
              <Input value={v.tags} onChange={(e) => set('tags', e.target.value)} placeholder="sofa, living room, fabric" />
            </Field>
          </FormGrid>
          <div className="mt-6">
            <span className="admin-label">Specifications</span>
            <ListEditor
              items={v.specs}
              onChange={(specs) => set('specs', specs)}
              create={() => ({ label: '', value: '' })}
              addLabel="Add specification"
              title={(s) => s.label || 'Specification'}
              emptyText="Add rows like Weight / 42 kg, Warranty / 10 years."
              render={(s, update) => (
                <FormGrid>
                  <Input value={s.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label" />
                  <Input value={s.value} onChange={(e) => update({ value: e.target.value })} placeholder="Value" />
                </FormGrid>
              )}
            />
          </div>
        </Card>

        <Card title="Variants" description="Colours and options the customer chooses before adding to cart.">
          <span className="admin-label">Colours</span>
          <ListEditor
            items={v.colors}
            onChange={(colors) => set('colors', colors)}
            create={() => ({ name: '', hex: '#c8a165' })}
            addLabel="Add colour"
            title={(c) => c.name || 'Colour'}
            emptyText="No colour swatches."
            render={(c, update) => (
              <div className="flex items-center gap-3">
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#cccccc'} onChange={(e) => update({ hex: e.target.value })} className="h-10 w-12 cursor-pointer rounded-sm border border-line bg-white p-1" aria-label="Pick colour" />
                <Input value={c.name} onChange={(e) => update({ name: e.target.value })} placeholder="Colour name (e.g. Natural Oak)" />
                <Input value={c.hex} onChange={(e) => update({ hex: e.target.value })} className="w-28 font-mono" placeholder="#hex" />
              </div>
            )}
          />
          <div className="mt-6">
            <span className="admin-label">Options</span>
            <ListEditor
              items={v.options}
              onChange={(options) => set('options', options)}
              create={() => ({ name: '', values: '' })}
              addLabel="Add option"
              title={(o) => o.name || 'Option'}
              emptyText="e.g. Size: 2 Seater, 3 Seater, 4 Seater"
              render={(o, update) => (
                <FormGrid>
                  <Input value={o.name} onChange={(e) => update({ name: e.target.value })} placeholder="Option name (Size, Finish…)" />
                  <Input value={o.values} onChange={(e) => update({ values: e.target.value })} placeholder="Values, comma separated" />
                </FormGrid>
              )}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Visibility">
          <div className="space-y-4">
            <Toggle checked={v.isActive} onChange={(val) => set('isActive', val)} label="Visible in the store" hint="Hidden products are kept but never shown to customers." />
            <Toggle checked={v.isFeatured} onChange={(val) => set('isFeatured', val)} label="Featured on the home page" />
            <Toggle checked={v.isNew} onChange={(val) => set('isNew', val)} label="Mark as new arrival" />
            <Toggle checked={v.isBestSeller} onChange={(val) => set('isBestSeller', val)} label="Mark as best seller" />
          </div>
        </Card>

        <Card title="Organisation">
          <Field label="Category">
            <Select value={v.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">No category</option>
              {Object.entries(grouped).map(([group, list]) => (
                <optgroup key={group} label={group}>
                  {list.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        </Card>

        <Card title="Pricing & stock">
          <div className="space-y-5">
            <Field label={`Price (${commerce.currencyCode})`} required hint={`Enter 0 to show “${commerce.quoteLabel || 'Request a quote'}” instead of a price (bespoke pieces).`}>
              <Input type="number" min={0} step="0.01" value={v.price} onChange={(e) => set('price', e.target.value)} required />
            </Field>
            <Field label="Compare-at price" hint="Shown crossed out to display a discount. Leave empty for none.">
              <Input type="number" min={0} step="0.01" value={v.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} />
            </Field>
            <Field label="Stock quantity" hint="0 shows the product as made to order.">
              <Input type="number" min={0} step="1" value={v.stock} onChange={(e) => set('stock', e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-4 flex gap-2">
          <AdminButton type="submit" loading={saving} icon={<Save size={14} />} className="flex-1">
            {product ? 'Save changes' : 'Create product'}
          </AdminButton>
          {product && (
            <AdminButton variant="secondary" href={siteUrl(`/products/${product.slug}`)} type="button">
              View
            </AdminButton>
          )}
        </div>
      </div>
    </form>
  );
}
