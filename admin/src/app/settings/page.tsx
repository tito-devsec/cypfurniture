'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, RotateCcw, Save } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { apiFetch } from '@/lib/api';
import { BODY_FONTS, HEADING_FONTS } from '@/lib/fonts';
import type { Banner, BodyFont, HeadingFont, NavLink, SiteSettings } from '@/lib/types';
import { mapEmbedUrl, mapViewUrl, parseCoordinates } from '@/lib/maps';
import { formatDateTime } from '@/lib/utils';
import { FEATURE_ICON_NAMES, FeatureIcon } from '@/components/icons';
import { ImageField } from '@/components/admin/image-field';
import { ListEditor } from '@/components/admin/list-editor';
import { MarkdownField } from '@/components/admin/markdown-field';
import { useToast } from '@/components/admin/toast';
import { errorMessage } from '@/components/admin/use-admin-query';
import { invalidateSettings } from '@/components/admin/use-settings';
import { AdminButton, Card, ConfirmDialog, Field, FormGrid, Input, LoadingBlock, PageHeader, Select, Tabs, Textarea, Toggle } from '@/components/admin/ui';

type Tab = 'brand' | 'contact' | 'hero' | 'home' | 'about' | 'footer' | 'commerce' | 'seo';

const TABS: { id: Tab; label: string }[] = [
  { id: 'brand', label: 'Brand & theme' },
  { id: 'contact', label: 'Contact & social' },
  { id: 'hero', label: 'Announcement & hero' },
  { id: 'home', label: 'Home page' },
  { id: 'about', label: 'About page' },
  { id: 'footer', label: 'Footer & menu' },
  { id: 'commerce', label: 'Orders & currency' },
  { id: 'seo', label: 'SEO' },
];

const newLink = (): NavLink => ({ label: '', href: '/', external: false });

function LinkFields({ link, update }: { link: NavLink; update: (patch: Partial<NavLink>) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <Field label="Label">
        <Input value={link.label} onChange={(e) => update({ label: e.target.value })} />
      </Field>
      <Field label="Link" hint="Internal (/shop, /blog, /p/faq) or full https:// url">
        <Input value={link.href} onChange={(e) => update({ href: e.target.value })} />
      </Field>
      <div className="pb-6">
        <Toggle checked={link.external} onChange={(external) => update({ external })} label="New tab" />
      </div>
    </div>
  );
}

function BannerFields({ banner, onChange, imageHint }: { banner: Banner; onChange: (b: Banner) => void; imageHint?: string }) {
  const set = (patch: Partial<Banner>) => onChange({ ...banner, ...patch });
  return (
    <div className="space-y-5">
      <Toggle checked={banner.enabled} onChange={(enabled) => set({ enabled })} label="Show this section" />
      <FormGrid>
        <Field label="Eyebrow (small text above the title)">
          <Input value={banner.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} />
        </Field>
        <Field label="Title">
          <Input value={banner.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
      </FormGrid>
      <Field label="Text">
        <Textarea value={banner.text} onChange={(e) => set({ text: e.target.value })} className="min-h-[80px]" />
      </Field>
      <FormGrid>
        <Field label="Button text">
          <Input value={banner.buttonText} onChange={(e) => set({ buttonText: e.target.value })} />
        </Field>
        <Field label="Button link">
          <Input value={banner.buttonLink} onChange={(e) => set({ buttonLink: e.target.value })} />
        </Field>
      </FormGrid>
      <ImageField label="Image" value={banner.image} onChange={(image) => set({ image })} aspect="aspect-[16/7]" hint={imageHint} />
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line bg-surface text-ink">
        <FeatureIcon name={value} size={20} />
      </span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {FEATURE_ICON_NAMES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-sm border border-line bg-white p-1" aria-label={label} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </Field>
  );
}

/** Live preview of the chosen fonts (loads them from Google Fonts for the admin only). */
function FontPreview({ heading, body, size }: { heading: HeadingFont; body: BodyFont; size: number }) {
  const headingFamily = HEADING_FONTS.find((f) => f.key === heading)?.family ?? 'Marcellus';
  const bodyFamily = BODY_FONTS.find((f) => f.key === body)?.family ?? 'Jost';
  useEffect(() => {
    const id = 'cyp-font-preview';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const fam = (f: string) => encodeURIComponent(f).replace(/%20/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${fam(headingFamily)}:wght@400;700&family=${fam(bodyFamily)}:wght@400;500&display=swap`;
  }, [headingFamily, bodyFamily]);
  return (
    <div className="rounded-sm border border-line bg-cream p-6" style={{ fontSize: `${size}px` }}>
      <p className="eyebrow mb-3" style={{ fontFamily: `'${bodyFamily}', sans-serif` }}>
        Preview
      </p>
      <p className="text-[2.2em] leading-tight text-ink" style={{ fontFamily: `'${headingFamily}', serif` }}>
        Beyond Furniture. Designed for Living.
      </p>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-soft" style={{ fontFamily: `'${bodyFamily}', sans-serif` }}>
        Luxury furniture, bespoke design and interior solutions, handcrafted in Tanzania. Body text, buttons and navigation use this font.
      </p>
    </div>
  );
}

/** Accepts the embed address itself or the whole <iframe> code that Google Maps gives you. */
const embedSrc = (value: string) => value.match(/src="([^"]+)"/)?.[1] ?? value.trim();

function MapPreview({ src }: { src: string }) {
  // Reload the iframe only once typing pauses
  const [shown, setShown] = useState(src);
  useEffect(() => {
    if (shown === src) return;
    const timer = setTimeout(() => setShown(src), 800);
    return () => clearTimeout(timer);
  }, [src, shown]);

  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md border border-line bg-canvas">
      {shown ? (
        <iframe src={shown} title="Map preview" className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">Add coordinates or an address to show the map.</p>
      )}
    </div>
  );
}

function ShowroomMapCard({ contact, onChange }: { contact: SiteSettings['contact']; onChange: (patch: Partial<SiteSettings['contact']>) => void }) {
  const coordsError = contact.mapCoordinates.trim() !== '' && !parseCoordinates(contact.mapCoordinates);
  const embedError = contact.mapEmbedOverride !== '' && !contact.mapEmbedOverride.startsWith('https://');
  const viewUrl = mapViewUrl(contact);
  return (
    <Card title="Showroom map" description="Drives the map on the contact page, the directions links and the location search engines see." className="lg:col-span-2">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Field label="Name on Google Maps" hint="When it matches your Google Maps listing, the map shows the listing card and a labelled pin. Leave empty for a plain pin.">
            <Input value={contact.mapPlaceName} onChange={(e) => onChange({ mapPlaceName: e.target.value })} placeholder="CYP Furniture" />
          </Field>
          <Field
            label="Coordinates (latitude, longitude)"
            hint="In Google Maps, right-click the showroom and click the numbers at the top of the menu to copy them."
            error={coordsError ? 'Use the format latitude, longitude, e.g. -6.781925, 39.239961' : undefined}
          >
            <Input value={contact.mapCoordinates} onChange={(e) => onChange({ mapCoordinates: e.target.value })} placeholder="-6.781925944125291, 39.239961853097746" />
          </Field>
          <Field
            label="Custom map embed (optional)"
            hint="Replaces the generated map. In Google Maps open Share, then Embed a map, copy the HTML and paste it here."
            error={embedError ? 'Paste the https:// address or the whole iframe code from Google Maps.' : undefined}
          >
            <Input value={contact.mapEmbedOverride} onChange={(e) => onChange({ mapEmbedOverride: embedSrc(e.target.value) })} placeholder="https://www.google.com/maps/embed?pb=..." />
          </Field>
          {viewUrl && (
            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
              Check the pin in Google Maps <ExternalLink size={14} />
            </a>
          )}
        </div>
        <MapPreview src={mapEmbedUrl(contact)} />
      </div>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [tab, setTab] = useState<Tab>('brand');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    apiFetch<SiteSettings>('/api/settings')
      .then(setSettings)
      .catch((err) => toast.error(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  if (!settings) return <LoadingBlock />;

  const patch = <K extends keyof SiteSettings>(key: K, value: Partial<SiteSettings[K]>) => {
    setSettings((s) => (s ? { ...s, [key]: { ...(s[key] as object), ...value } } : s));
    setDirty(true);
  };
  const replace = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await adminApi.put<SiteSettings>('/api/settings', settings);
      setSettings(saved);
      invalidateSettings(saved);
      setDirty(false);
      toast.success('Settings saved - the website updates immediately.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    try {
      const fresh = await adminApi.post<SiteSettings>('/api/settings/reset');
      setSettings(fresh);
      invalidateSettings(fresh);
      setDirty(false);
      setConfirmReset(false);
      toast.success('Settings restored to defaults');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const { brand, contact, social, announcement, hero, features, home, about, footer, navigation, seo, commerce, currencies, theme } = settings;

  const refreshRates = async () => {
    setRefreshing(true);
    try {
      const res = await adminApi.post<{ ok: boolean; updatedAt: string; list: SiteSettings['currencies']['list'] }>('/api/currencies/refresh');
      setSettings((s) => (s ? { ...s, currencies: { ...s.currencies, list: res.list, updatedAt: res.updatedAt, ratesBase: s.commerce.currencyCode } } : s));
      invalidateSettings();
      toast.success('Exchange rates updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="pb-24">
      <PageHeader
        title="Website settings"
        description="Everything customers see: branding, contact details, social links, home page sections, footer and checkout rules."
        actions={
          <AdminButton variant="secondary" onClick={() => setConfirmReset(true)} icon={<RotateCcw size={14} />}>
            Restore defaults
          </AdminButton>
        }
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'brand' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Identity">
            <div className="space-y-5">
              <Field label="Company / site name" required>
                <Input value={brand.siteName} onChange={(e) => patch('brand', { siteName: e.target.value })} />
              </Field>
              <Field label="Tagline">
                <Input value={brand.tagline} onChange={(e) => patch('brand', { tagline: e.target.value })} />
              </Field>
              <Field label="Wordmark text" hint="Used as the logo when no image is uploaded (e.g. CYP).">
                <Input value={brand.logoText} onChange={(e) => patch('brand', { logoText: e.target.value })} />
              </Field>
            </div>
          </Card>
          <Card title="Logo & favicon">
            <div className="space-y-6">
              <ImageField label="Logo" value={brand.logoUrl} onChange={(logoUrl) => patch('brand', { logoUrl })} aspect="aspect-[3/1]" hint="PNG or SVG with transparent background works best." />
              <ImageField label="Logo on dark backgrounds (optional)" value={brand.logoOnDarkUrl} onChange={(logoOnDarkUrl) => patch('brand', { logoOnDarkUrl })} aspect="aspect-[3/1]" />
              <ImageField label="Favicon" value={brand.faviconUrl} onChange={(faviconUrl) => patch('brand', { faviconUrl })} aspect="aspect-square max-w-[120px]" hint="Square PNG, ICO or SVG." />
            </div>
          </Card>
          <Card title="Colours" description="Brand colours used as controlled accents across the site (buttons, links, badges, highlights)." className="lg:col-span-2">
            <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-5">
              <ColorInput label="Primary accent (red)" value={theme.accent} onChange={(accent) => patch('theme', { accent })} />
              <ColorInput label="Secondary accent (orange)" value={theme.accentSecondary} onChange={(accentSecondary) => patch('theme', { accentSecondary })} />
              <ColorInput label="Accent (soft background)" value={theme.accentSoft} onChange={(accentSoft) => patch('theme', { accentSoft })} />
              <ColorInput label="Surface (light sections)" value={theme.surface} onChange={(surface) => patch('theme', { surface })} />
              <ColorInput label="Sale / discount colour" value={theme.sale} onChange={(sale) => patch('theme', { sale })} />
            </div>
          </Card>
          <Card title="Typography" description="Choose the heading font, the text font and the overall text size of the website." className="lg:col-span-2">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Heading font">
                <Select value={theme.headingFont} onChange={(e) => patch('theme', { headingFont: e.target.value as HeadingFont })}>
                  {HEADING_FONTS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Text font">
                <Select value={theme.bodyFont} onChange={(e) => patch('theme', { bodyFont: e.target.value as BodyFont })}>
                  {BODY_FONTS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Text size" hint="Scales all text and spacing on the website.">
                <Select value={theme.baseFontSize} onChange={(e) => patch('theme', { baseFontSize: Number(e.target.value) })}>
                  <option value={14}>Smaller (14 px)</option>
                  <option value={15}>Small (15 px)</option>
                  <option value={16}>Default (16 px)</option>
                  <option value={17}>Large (17 px)</option>
                  <option value={18}>Larger (18 px)</option>
                  <option value={20}>Extra large (20 px)</option>
                </Select>
              </Field>
            </div>
            <div className="mt-5">
              <FontPreview heading={theme.headingFont} body={theme.bodyFont} size={theme.baseFontSize} />
            </div>
          </Card>
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Contact details">
            <div className="space-y-5">
              <FormGrid>
                <Field label="Email">
                  <Input type="email" value={contact.email} onChange={(e) => patch('contact', { email: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={contact.phone} onChange={(e) => patch('contact', { phone: e.target.value })} />
                </Field>
                <Field label="Second phone (optional)">
                  <Input value={contact.phoneSecondary} onChange={(e) => patch('contact', { phoneSecondary: e.target.value })} />
                </Field>
                <Field label="WhatsApp number" hint="Digits only with country code, e.g. 971501234567" required>
                  <Input value={contact.whatsapp} onChange={(e) => patch('contact', { whatsapp: e.target.value.replace(/[^\d]/g, '') })} />
                </Field>
              </FormGrid>
              <Field label="WhatsApp pre-filled message">
                <Input value={contact.whatsappMessage} onChange={(e) => patch('contact', { whatsappMessage: e.target.value })} />
              </Field>
              <Field label="Street address">
                <Input value={contact.address} onChange={(e) => patch('contact', { address: e.target.value })} />
              </Field>
              <FormGrid>
                <Field label="City">
                  <Input value={contact.city} onChange={(e) => patch('contact', { city: e.target.value })} />
                </Field>
                <Field label="Country">
                  <Input value={contact.country} onChange={(e) => patch('contact', { country: e.target.value })} />
                </Field>
              </FormGrid>
              <Field label="Opening hours">
                <Input value={contact.workingHours} onChange={(e) => patch('contact', { workingHours: e.target.value })} />
              </Field>
            </div>
          </Card>
          <Card title="Social media" description="Leave a field empty to hide that icon.">
            <div className="space-y-5">
              <Field label="TikTok">
                <Input value={social.tiktok} onChange={(e) => patch('social', { tiktok: e.target.value })} placeholder="https://www.tiktok.com/@yourbrand" />
              </Field>
              <Field label="Instagram">
                <Input value={social.instagram} onChange={(e) => patch('social', { instagram: e.target.value })} placeholder="https://www.instagram.com/yourbrand" />
              </Field>
              <Field label="Facebook">
                <Input value={social.facebook} onChange={(e) => patch('social', { facebook: e.target.value })} placeholder="https://www.facebook.com/yourbrand" />
              </Field>
              <Field label="YouTube">
                <Input value={social.youtube} onChange={(e) => patch('social', { youtube: e.target.value })} />
              </Field>
              <Field label="Pinterest">
                <Input value={social.pinterest} onChange={(e) => patch('social', { pinterest: e.target.value })} />
              </Field>
              <Field label="X (Twitter)">
                <Input value={social.x} onChange={(e) => patch('social', { x: e.target.value })} />
              </Field>
              <Field label="LinkedIn">
                <Input value={social.linkedin} onChange={(e) => patch('social', { linkedin: e.target.value })} />
              </Field>
            </div>
          </Card>
          <ShowroomMapCard contact={contact} onChange={(value) => patch('contact', value)} />
        </div>
      )}

      {tab === 'hero' && (
        <div className="space-y-6">
          <Card title="Announcement bar" description="The thin bar above the header.">
            <div className="space-y-5">
              <Toggle checked={announcement.enabled} onChange={(enabled) => patch('announcement', { enabled })} label="Show announcement bar" />
              <Field label="Text">
                <Input value={announcement.text} onChange={(e) => patch('announcement', { text: e.target.value })} />
              </Field>
              <FormGrid>
                <Field label="Link">
                  <Input value={announcement.link} onChange={(e) => patch('announcement', { link: e.target.value })} />
                </Field>
                <Field label="Link text">
                  <Input value={announcement.linkText} onChange={(e) => patch('announcement', { linkText: e.target.value })} />
                </Field>
              </FormGrid>
            </div>
          </Card>
          <Card title="Hero slides" description="Full-width slides at the top of the home page.">
            <Field label="Autoplay (seconds, 0 = off)" className="mb-6 max-w-xs">
              <Input type="number" min={0} max={60} value={hero.autoplaySeconds} onChange={(e) => patch('hero', { autoplaySeconds: Number(e.target.value) || 0 })} />
            </Field>
            <ListEditor
              items={hero.slides}
              onChange={(slides) => patch('hero', { slides })}
              create={() => ({ id: `slide-${Date.now()}`, eyebrow: '', title: 'New slide', subtitle: '', image: '', ctaText: 'Shop now', ctaLink: '/shop', secondaryText: '', secondaryLink: '', align: 'left' as const, theme: 'dark' as const })}
              addLabel="Add slide"
              max={6}
              title={(s, i) => `Slide ${i + 1}: ${s.title || 'untitled'}`}
              render={(s, update) => (
                <div className="space-y-4">
                  <FormGrid>
                    <Field label="Eyebrow">
                      <Input value={s.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} />
                    </Field>
                    <Field label="Title">
                      <Input value={s.title} onChange={(e) => update({ title: e.target.value })} />
                    </Field>
                  </FormGrid>
                  <Field label="Subtitle">
                    <Textarea value={s.subtitle} onChange={(e) => update({ subtitle: e.target.value })} className="min-h-[70px]" />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Field label="Button text">
                      <Input value={s.ctaText} onChange={(e) => update({ ctaText: e.target.value })} />
                    </Field>
                    <Field label="Button link">
                      <Input value={s.ctaLink} onChange={(e) => update({ ctaLink: e.target.value })} />
                    </Field>
                    <Field label="Second button text">
                      <Input value={s.secondaryText} onChange={(e) => update({ secondaryText: e.target.value })} />
                    </Field>
                    <Field label="Second button link">
                      <Input value={s.secondaryLink} onChange={(e) => update({ secondaryLink: e.target.value })} />
                    </Field>
                  </div>
                  <FormGrid>
                    <Field label="Text alignment">
                      <Select value={s.align} onChange={(e) => update({ align: e.target.value as 'left' | 'center' })}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                      </Select>
                    </Field>
                    <Field label="Text colour" hint="Dark = white text over a dark overlay; Light = dark text over a light overlay.">
                      <Select value={s.theme} onChange={(e) => update({ theme: e.target.value as 'light' | 'dark' })}>
                        <option value="dark">White text (dark overlay)</option>
                        <option value="light">Dark text (light overlay)</option>
                      </Select>
                    </Field>
                  </FormGrid>
                  <ImageField label="Background image" value={s.image} onChange={(image) => update({ image })} aspect="aspect-[16/6]" hint="Recommended 2400 × 1200 px or larger." />
                </div>
              )}
            />
          </Card>
        </div>
      )}

      {tab === 'home' && (
        <div className="space-y-6">
          <Card title="Trust badges" description="The row of icons under the hero. Also shown on product pages.">
            <ListEditor
              items={features}
              onChange={(items) => replace('features', items)}
              create={() => ({ icon: 'truck', title: '', subtitle: '' })}
              addLabel="Add badge"
              max={6}
              title={(f) => f.title || 'Badge'}
              render={(f, update) => (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Icon">
                    <IconSelect value={f.icon} onChange={(icon) => update({ icon })} />
                  </Field>
                  <Field label="Title">
                    <Input value={f.title} onChange={(e) => update({ title: e.target.value })} />
                  </Field>
                  <Field label="Subtitle">
                    <Input value={f.subtitle} onChange={(e) => update({ subtitle: e.target.value })} />
                  </Field>
                </div>
              )}
            />
          </Card>
          <Card title="Section titles">
            <FormGrid>
              <Field label="Categories section title">
                <Input value={home.categoriesTitle} onChange={(e) => patch('home', { categoriesTitle: e.target.value })} />
              </Field>
              <Field label="Categories subtitle">
                <Input value={home.categoriesSubtitle} onChange={(e) => patch('home', { categoriesSubtitle: e.target.value })} />
              </Field>
              <Field label="Featured products title">
                <Input value={home.featuredTitle} onChange={(e) => patch('home', { featuredTitle: e.target.value })} />
              </Field>
              <Field label="Featured products subtitle">
                <Input value={home.featuredSubtitle} onChange={(e) => patch('home', { featuredSubtitle: e.target.value })} />
              </Field>
              <Field label="New arrivals title">
                <Input value={home.newArrivalsTitle} onChange={(e) => patch('home', { newArrivalsTitle: e.target.value })} />
              </Field>
              <Field label="Best sellers title">
                <Input value={home.bestSellersTitle} onChange={(e) => patch('home', { bestSellersTitle: e.target.value })} />
              </Field>
              <Field label="Blog section title">
                <Input value={home.blogTitle} onChange={(e) => patch('home', { blogTitle: e.target.value })} />
              </Field>
              <Field label="Blog section subtitle">
                <Input value={home.blogSubtitle} onChange={(e) => patch('home', { blogSubtitle: e.target.value })} />
              </Field>
            </FormGrid>
          </Card>
          <Card title="Scrolling ticker" description="Brand statements that scroll across the home page. One per line; leave empty to show the trust badge titles instead.">
            <Textarea
              value={home.marquee.join('\n')}
              onChange={(e) => patch('home', { marquee: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12) })}
              className="min-h-[140px]"
              placeholder={'Beyond Furniture. Designed for Living.\nWe create the impossible.'}
            />
          </Card>
          <Card title="Showcase banner" description="Image + text section after the featured products.">
            <BannerFields banner={home.showcase} onChange={(showcase) => patch('home', { showcase })} />
          </Card>
          <Card title="Bottom banner" description="Full-width call to action at the end of the home page.">
            <BannerFields banner={home.banner} onChange={(banner) => patch('home', { banner })} />
          </Card>
          <Card title="Testimonials">
            <div className="space-y-5">
              <Toggle checked={home.testimonials.enabled} onChange={(enabled) => patch('home', { testimonials: { ...home.testimonials, enabled } })} label="Show testimonials" />
              <FormGrid>
                <Field label="Title">
                  <Input value={home.testimonials.title} onChange={(e) => patch('home', { testimonials: { ...home.testimonials, title: e.target.value } })} />
                </Field>
                <Field label="Subtitle">
                  <Input value={home.testimonials.subtitle} onChange={(e) => patch('home', { testimonials: { ...home.testimonials, subtitle: e.target.value } })} />
                </Field>
              </FormGrid>
              <ListEditor
                items={home.testimonials.items}
                onChange={(items) => patch('home', { testimonials: { ...home.testimonials, items } })}
                create={() => ({ name: '', role: '', quote: '', rating: 5 })}
                addLabel="Add testimonial"
                max={9}
                title={(t) => t.name || 'Testimonial'}
                render={(t, update) => (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Name">
                        <Input value={t.name} onChange={(e) => update({ name: e.target.value })} />
                      </Field>
                      <Field label="Role / location">
                        <Input value={t.role} onChange={(e) => update({ role: e.target.value })} />
                      </Field>
                      <Field label="Rating (1-5)">
                        <Input type="number" min={1} max={5} value={t.rating} onChange={(e) => update({ rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })} />
                      </Field>
                    </div>
                    <Field label="Quote">
                      <Textarea value={t.quote} onChange={(e) => update({ quote: e.target.value })} className="min-h-[70px]" />
                    </Field>
                  </div>
                )}
              />
            </div>
          </Card>
          <Card title="Newsletter box">
            <div className="space-y-5">
              <Toggle checked={home.newsletter.enabled} onChange={(enabled) => patch('home', { newsletter: { ...home.newsletter, enabled } })} label="Show newsletter sign-up above the footer" />
              <FormGrid>
                <Field label="Title">
                  <Input value={home.newsletter.title} onChange={(e) => patch('home', { newsletter: { ...home.newsletter, title: e.target.value } })} />
                </Field>
                <Field label="Text">
                  <Input value={home.newsletter.text} onChange={(e) => patch('home', { newsletter: { ...home.newsletter, text: e.target.value } })} />
                </Field>
              </FormGrid>
            </div>
          </Card>
        </div>
      )}

      {tab === 'about' && (
        <div className="space-y-6">
          <Card title="Intro">
            <div className="space-y-5">
              <FormGrid>
                <Field label="Eyebrow">
                  <Input value={about.heroEyebrow} onChange={(e) => patch('about', { heroEyebrow: e.target.value })} />
                </Field>
                <Field label="Title">
                  <Input value={about.heroTitle} onChange={(e) => patch('about', { heroTitle: e.target.value })} />
                </Field>
              </FormGrid>
              <Field label="Intro text">
                <Textarea value={about.heroText} onChange={(e) => patch('about', { heroText: e.target.value })} />
              </Field>
              <ImageField label="Intro image" value={about.heroImage} onChange={(heroImage) => patch('about', { heroImage })} aspect="aspect-[16/6]" />
            </div>
          </Card>
          <Card title="Numbers">
            <ListEditor
              items={about.stats}
              onChange={(stats) => patch('about', { stats })}
              create={() => ({ value: '', label: '' })}
              addLabel="Add number"
              max={4}
              title={(s) => `${s.value} ${s.label}`.trim() || 'Number'}
              render={(s, update) => (
                <FormGrid>
                  <Field label="Value (e.g. 15+ or 2,400+)">
                    <Input value={s.value} onChange={(e) => update({ value: e.target.value })} />
                  </Field>
                  <Field label="Label">
                    <Input value={s.label} onChange={(e) => update({ label: e.target.value })} />
                  </Field>
                </FormGrid>
              )}
            />
          </Card>
          <Card title="Our story">
            <div className="space-y-5">
              <Field label="Title">
                <Input value={about.storyTitle} onChange={(e) => patch('about', { storyTitle: e.target.value })} />
              </Field>
              <MarkdownField label="Story" value={about.story} onChange={(story) => patch('about', { story })} rows={10} />
              <ImageField label="Story image" value={about.storyImage} onChange={(storyImage) => patch('about', { storyImage })} aspect="aspect-[4/3] max-w-md" />
            </div>
          </Card>
          <Card title="Values">
            <Field label="Section title" className="mb-5 max-w-md">
              <Input value={about.valuesTitle} onChange={(e) => patch('about', { valuesTitle: e.target.value })} />
            </Field>
            <ListEditor
              items={about.values}
              onChange={(values) => patch('about', { values })}
              create={() => ({ icon: 'sparkles', title: '', text: '' })}
              addLabel="Add value"
              max={8}
              title={(v) => v.title || 'Value'}
              render={(v, update) => (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Icon">
                    <IconSelect value={v.icon} onChange={(icon) => update({ icon })} />
                  </Field>
                  <Field label="Title">
                    <Input value={v.title} onChange={(e) => update({ title: e.target.value })} />
                  </Field>
                  <Field label="Text">
                    <Input value={v.text} onChange={(e) => update({ text: e.target.value })} />
                  </Field>
                </div>
              )}
            />
          </Card>
          <Card title="Call to action">
            <FormGrid>
              <Field label="Title">
                <Input value={about.ctaTitle} onChange={(e) => patch('about', { ctaTitle: e.target.value })} />
              </Field>
              <Field label="Text">
                <Input value={about.ctaText} onChange={(e) => patch('about', { ctaText: e.target.value })} />
              </Field>
            </FormGrid>
          </Card>
        </div>
      )}

      {tab === 'footer' && (
        <div className="space-y-6">
          <Card title="Main menu">
            <div className="space-y-5">
              <Toggle checked={navigation.showShopAll} onChange={(showShopAll) => patch('navigation', { showShopAll })} label="Show “Shop all” link" />
              <Toggle checked={navigation.showCategories} onChange={(showCategories) => patch('navigation', { showCategories })} label="Show categories with drop-down menus" hint="Which categories appear is controlled per category (Categories → In menu)." />
              <div>
                <span className="admin-label">Extra links (Blog, About, Contact …)</span>
                <ListEditor items={navigation.links} onChange={(links) => patch('navigation', { links })} create={newLink} addLabel="Add link" max={8} title={(l) => l.label || 'Link'} render={(l, update) => <LinkFields link={l} update={update} />} />
              </div>
            </div>
          </Card>
          <Card title="Footer">
            <div className="space-y-5">
              <Field label="Description">
                <Textarea value={footer.description} onChange={(e) => patch('footer', { description: e.target.value })} className="min-h-[80px]" />
              </Field>
              <Field label="Copyright line" hint="{year} is replaced with the current year.">
                <Input value={footer.copyright} onChange={(e) => patch('footer', { copyright: e.target.value })} />
              </Field>
              <div>
                <span className="admin-label">Link columns</span>
                <ListEditor
                  items={footer.columns}
                  onChange={(columns) => patch('footer', { columns })}
                  create={() => ({ title: 'New column', links: [] })}
                  addLabel="Add column"
                  max={4}
                  title={(c) => c.title || 'Column'}
                  render={(c, update) => (
                    <div className="space-y-4">
                      <Field label="Column title">
                        <Input value={c.title} onChange={(e) => update({ title: e.target.value })} />
                      </Field>
                      <ListEditor items={c.links} onChange={(links) => update({ links })} create={newLink} addLabel="Add link" max={10} title={(l) => l.label || 'Link'} render={(l, up) => <LinkFields link={l} update={up} />} />
                    </div>
                  )}
                />
              </div>
              <div>
                <span className="admin-label">Bottom links (terms, privacy …)</span>
                <ListEditor items={footer.bottomLinks} onChange={(bottomLinks) => patch('footer', { bottomLinks })} create={newLink} addLabel="Add link" max={6} title={(l) => l.label || 'Link'} render={(l, update) => <LinkFields link={l} update={update} />} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'commerce' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Currency">
            <div className="space-y-5">
              <FormGrid>
                <Field label="Currency code" hint="USD, AED, EUR …">
                  <Input value={commerce.currencyCode} onChange={(e) => patch('commerce', { currencyCode: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="Symbol" hint="$, AED, € …">
                  <Input value={commerce.currencySymbol} onChange={(e) => patch('commerce', { currencySymbol: e.target.value })} />
                </Field>
                <Field label="Symbol position">
                  <Select value={commerce.currencyPosition} onChange={(e) => patch('commerce', { currencyPosition: e.target.value as 'before' | 'after' })}>
                    <option value="before">Before the amount ($1,299)</option>
                    <option value="after">After the amount (1,299 AED)</option>
                  </Select>
                </Field>
                <Field label="Decimals">
                  <Select value={commerce.decimals} onChange={(e) => patch('commerce', { decimals: Number(e.target.value) })}>
                    <option value={0}>0 (1,299)</option>
                    <option value={2}>2 (1,299.00)</option>
                  </Select>
                </Field>
              </FormGrid>
            </div>
          </Card>
          <Card
            title="Currency converter"
            description="Visitors can switch the displayed currency in the top bar. Orders are always placed in the shop currency above."
            className="lg:col-span-2"
            actions={
              <AdminButton variant="secondary" size="sm" onClick={refreshRates} loading={refreshing} icon={<RefreshCw size={13} />}>
                Refresh rates now
              </AdminButton>
            }
          >
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Toggle checked={currencies.enabled} onChange={(enabled) => patch('currencies', { enabled })} label="Show the currency selector" />
                <Toggle checked={currencies.autoUpdate} onChange={(autoUpdate) => patch('currencies', { autoUpdate })} label="Update rates automatically every day" hint="Uses the free open.er-api.com service. Turn off to manage rates by hand." />
              </div>
              <p className="text-xs text-muted">
                Rates are “1 {commerce.currencyCode} = rate”. {currencies.updatedAt ? `Last updated ${formatDateTime(currencies.updatedAt)}.` : 'Rates have not been refreshed yet.'}
              </p>
              <ListEditor
                items={currencies.list}
                onChange={(list) => patch('currencies', { list })}
                create={() => ({ code: 'USD', symbol: '$', label: 'US Dollar', rate: 0.00038, decimals: 2 })}
                addLabel="Add currency"
                max={40}
                title={(c) => `${c.code}${c.label ? ` · ${c.label}` : ''}`}
                render={(c, update) => (
                  <div className="grid gap-3 md:grid-cols-5">
                    <Field label="Code">
                      <Input value={c.code} onChange={(e) => update({ code: e.target.value.toUpperCase().slice(0, 3) })} maxLength={3} />
                    </Field>
                    <Field label="Symbol">
                      <Input value={c.symbol} onChange={(e) => update({ symbol: e.target.value })} />
                    </Field>
                    <Field label="Name">
                      <Input value={c.label} onChange={(e) => update({ label: e.target.value })} />
                    </Field>
                    <Field label="Rate">
                      <Input type="number" step="any" min={0} value={c.rate} onChange={(e) => update({ rate: Number(e.target.value) || 0 })} />
                    </Field>
                    <Field label="Decimals">
                      <Select value={c.decimals} onChange={(e) => update({ decimals: Number(e.target.value) })}>
                        <option value={0}>0</option>
                        <option value={2}>2</option>
                      </Select>
                    </Field>
                  </div>
                )}
              />
            </div>
          </Card>
          <Card title="Delivery">
            <div className="space-y-5">
              <Field label="Flat delivery fee" hint="Charged per order unless the free-delivery threshold is reached.">
                <Input type="number" min={0} value={commerce.shippingFlatRate} onChange={(e) => patch('commerce', { shippingFlatRate: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="Free delivery from (order subtotal)" hint="0 disables free delivery.">
                <Input type="number" min={0} value={commerce.freeShippingThreshold} onChange={(e) => patch('commerce', { freeShippingThreshold: Number(e.target.value) || 0 })} />
              </Field>
            </div>
          </Card>
          <Card title="Payment & checkout">
            <div className="space-y-5">
              <Toggle checked={commerce.enableCod} onChange={(enableCod) => patch('commerce', { enableCod })} label="Cash on delivery" />
              <Toggle checked={commerce.enableBankTransfer} onChange={(enableBankTransfer) => patch('commerce', { enableBankTransfer })} label="Bank transfer" />
              <Field label="Bank details" hint="Shown to the customer after a bank-transfer order.">
                <Textarea value={commerce.bankDetails} onChange={(e) => patch('commerce', { bankDetails: e.target.value })} />
              </Field>
              <Toggle checked={commerce.orderWhatsappEnabled} onChange={(orderWhatsappEnabled) => patch('commerce', { orderWhatsappEnabled })} label="“Order via WhatsApp” buttons" hint="Uses the WhatsApp number from Contact & social." />
              <Field label="Label for products without a price" hint="Shown instead of a price when a product's price is 0 (bespoke pieces).">
                <Input value={commerce.quoteLabel} onChange={(e) => patch('commerce', { quoteLabel: e.target.value })} />
              </Field>
              <Field label="Checkout note" hint="Shown in the cart, at checkout and on the thank-you page.">
                <Textarea value={commerce.checkoutNote} onChange={(e) => patch('commerce', { checkoutNote: e.target.value })} className="min-h-[70px]" />
              </Field>
            </div>
          </Card>
          <Card title="Stock">
            <div className="space-y-5">
              <Toggle checked={commerce.showStock} onChange={(showStock) => patch('commerce', { showStock })} label="Show stock status on product pages" />
              <Field label="Low-stock warning at or below">
                <Input type="number" min={0} value={commerce.lowStockThreshold} onChange={(e) => patch('commerce', { lowStockThreshold: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="Minimum order quantity per product">
                <Input type="number" min={1} value={commerce.minOrderQuantity} onChange={(e) => patch('commerce', { minOrderQuantity: Math.max(1, Number(e.target.value) || 1) })} />
              </Field>
            </div>
          </Card>
        </div>
      )}

      {tab === 'seo' && (
        <Card title="Search engines & sharing">
          <div className="space-y-5">
            <Field label="Default page title" hint="Shown in the browser tab and Google results for the home page.">
              <Input value={seo.metaTitle} onChange={(e) => patch('seo', { metaTitle: e.target.value })} />
            </Field>
            <Field label="Meta description" hint="150–160 characters is ideal.">
              <Textarea value={seo.metaDescription} onChange={(e) => patch('seo', { metaDescription: e.target.value })} className="min-h-[80px]" maxLength={300} />
            </Field>
            <Field label="Keywords" hint="Comma separated.">
              <Input value={seo.keywords} onChange={(e) => patch('seo', { keywords: e.target.value })} />
            </Field>
            <ImageField label="Social sharing image (Open Graph)" value={seo.ogImage} onChange={(ogImage) => patch('seo', { ogImage })} aspect="aspect-[1200/630] max-w-lg" hint="1200 × 630 px recommended. /og-image.jpg is generated from your logo." />
            <FormGrid>
              <Field label="Google Analytics measurement ID" hint="Looks like G-XXXXXXXXXX. Leave empty to disable analytics.">
                <Input value={seo.googleAnalyticsId} onChange={(e) => patch('seo', { googleAnalyticsId: e.target.value.trim() })} placeholder="G-XXXXXXXXXX" />
              </Field>
              <Field label="Google Search Console verification" hint="The content value of the google-site-verification meta tag.">
                <Input value={seo.googleSiteVerification} onChange={(e) => patch('seo', { googleSiteVerification: e.target.value.trim() })} />
              </Field>
            </FormGrid>
          </div>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <p className="text-sm text-muted">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
          <AdminButton onClick={save} loading={saving} disabled={!dirty} icon={<Save size={14} />}>
            Save settings
          </AdminButton>
        </div>
      </div>

      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={reset} title="Restore default settings?" text="All branding, contact, home page and checkout settings go back to the original demo values. Products, orders and posts are not affected." confirmLabel="Restore defaults" />
    </div>
  );
}
