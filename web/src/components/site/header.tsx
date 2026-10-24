'use client';

import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap';
import { selectCount, useCart } from '@/lib/cart-store';
import { cn, resolveImage, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Collapsible } from '@/components/ui/collapsible';
import { useHydrated } from '@/lib/use-hydrated';
import { Logo } from './logo';
import { useSite } from './site-provider';

export type NavChild = { label: string; href: string; count?: number };
export type NavItem = { label: string; href: string; children?: NavChild[]; image?: string; description?: string };

export function useNavItems(): NavItem[] {
  const { settings, categories } = useSite();
  return useMemo(() => {
    const items: NavItem[] = [];
    if (settings.navigation.showShopAll) items.push({ label: 'Shop all', href: '/shop' });
    if (settings.navigation.showCategories) {
      for (const c of categories.filter((c) => c.showInMenu)) {
        items.push({
          label: c.name,
          href: `/category/${c.slug}`,
          image: c.imageUrl,
          description: c.description,
          children: c.children.filter((ch) => ch.showInMenu).map((ch) => ({ label: ch.name, href: `/category/${ch.slug}`, count: ch.productCount })),
        });
      }
    }
    for (const link of settings.navigation.links) items.push({ label: link.label, href: link.href });
    return items;
  }, [settings, categories]);
}

function CartButton({ className }: { className?: string }) {
  const count = useCart(selectCount);
  const open = useCart((s) => s.open);
  const mounted = useHydrated();
  return (
    <button type="button" onClick={open} className={cn('relative flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-accent', className)} aria-label="Open cart">
      <ShoppingBag size={21} strokeWidth={1.5} />
      {mounted && count > 0 && (
        <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </button>
  );
}

function SearchForm({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className={cn('flex items-center gap-2 border-b border-line-strong transition-colors focus-within:border-ink', className)}>
      <Search size={16} className="shrink-0 text-muted" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        placeholder="What can we help you find?"
        className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-muted/80 focus:outline-none"
        aria-label="Search products"
      />
    </form>
  );
}

export function Header() {
  const { settings } = useSite();
  const items = useNavItems();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compact header once the page is scrolled (GSAP ScrollTrigger)
  useGSAP(() => {
    ScrollTrigger.create({ start: 'top -24', onToggle: (self) => setScrolled(self.isActive) });
  });

  // Close menus on navigation (state reset derived from the route, no effect needed)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenIndex(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  // Escape closes everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenIndex(null);
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIndex(null), 120);
  }, []);
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  const openMenu = useCallback(
    (i: number) => {
      cancelClose();
      setActiveIndex(i);
      setOpenIndex(i);
    },
    [cancelClose],
  );

  // Mega menu animation
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;
      if (openIndex !== null) {
        gsap.killTweensOf(panel);
        gsap.fromTo(panel, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' });
        gsap.fromTo(panel.querySelectorAll('.mega-item'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.035, ease: 'power3.out', delay: 0.05 });
      } else {
        gsap.to(panel, { autoAlpha: 0, y: -8, duration: 0.22, ease: 'power2.in' });
      }
    },
    { dependencies: [openIndex, activeIndex], scope: headerRef },
  );

  const active = activeIndex !== null ? items[activeIndex] : null;
  const wa = settings.contact.whatsapp ? whatsappLink(settings.contact.whatsapp, settings.contact.whatsappMessage) : null;

  return (
    <header ref={headerRef} className={cn('sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur transition-shadow duration-500', scrolled && 'shadow-soft')}>
      <div className="container-x">
        <div className={cn('flex items-center justify-between gap-4 transition-[height] duration-500', scrolled ? 'h-16 lg:h-[72px]' : 'h-[72px] lg:h-[92px]')}>
          <div className="flex flex-1 items-center gap-1">
            <button type="button" onClick={() => setMobileOpen(true)} className="-ml-2 flex h-11 w-11 items-center justify-center text-ink lg:hidden" aria-label="Open menu">
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <SearchForm className="hidden w-[260px] lg:flex" />
          </div>

          <Logo />

          <div className="flex flex-1 items-center justify-end gap-0.5">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden h-11 w-11 items-center justify-center text-ink transition-colors hover:text-whatsapp md:flex" aria-label="Chat on WhatsApp">
                <WhatsAppIcon size={21} />
              </a>
            )}
            <button type="button" onClick={() => setSearchOpen((v) => !v)} className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-accent lg:hidden" aria-label="Search">
              {searchOpen ? <X size={21} strokeWidth={1.5} /> : <Search size={21} strokeWidth={1.5} />}
            </button>
            <CartButton className="-mr-2" />
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 lg:hidden">
            <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}

        {/* Desktop navigation */}
        <nav className={cn('hidden lg:block transition-[height] duration-500', scrolled ? 'h-11' : 'h-12')} aria-label="Main" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
          <ul className="flex h-full items-center justify-center gap-7 xl:gap-9">
            {items.map((item, i) => {
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
              return (
                <li key={`${item.href}-${i}`} className="h-full" onMouseEnter={() => (hasChildren ? openMenu(i) : setOpenIndex(null))}>
                  <Link
                    href={item.href}
                    className={cn('nav-link flex h-full items-center gap-1.5', (isActive || openIndex === i) && 'text-accent')}
                    aria-expanded={hasChildren ? openIndex === i : undefined}
                  >
                    {item.label}
                    {hasChildren && <ChevronDown size={12} className={cn('transition-transform duration-300', openIndex === i && 'rotate-180')} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mega menu panel */}
      <div
        ref={panelRef}
        className="invisible absolute inset-x-0 top-full z-40 hidden border-b border-line bg-white opacity-0 lg:block"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {active && active.children && (
          <div className="container-x grid grid-cols-12 gap-10 py-10">
            <div className="col-span-3">
              <p className="mega-item eyebrow mb-3">{active.label}</p>
              <p className="mega-item max-w-xs text-sm leading-relaxed text-muted">{active.description}</p>
              <Link href={active.href} className="mega-item group mt-6 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-ink hover:text-accent">
                <span className="link-line group-hover:link-line-active">View all {active.label.toLowerCase()}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <ul className="col-span-5 grid grid-cols-2 gap-x-8 gap-y-1 self-start">
              {active.children.map((child) => (
                <li key={child.href} className="mega-item">
                  <Link href={child.href} className="group flex items-center justify-between border-b border-transparent py-2.5 font-display text-[17px] text-ink transition-colors hover:text-accent">
                    <span className="link-line group-hover:link-line-active">{child.label}</span>
                    {typeof child.count === 'number' && <span className="font-sans text-xs text-muted">{child.count}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="col-span-4">
              <Link href={active.href} className="mega-item group relative block aspect-[16/10] overflow-hidden bg-surface">
                {active.image && <Image src={resolveImage(active.image)} alt={active.label} fill sizes="400px" className="img-zoom object-cover group-hover:scale-105" />}
                <span className="absolute bottom-4 left-4 bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">Explore {active.label}</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} items={items} />
    </header>
  );
}

/* ----------------------------------------------------------------- mobile */

function MobileMenu({ open, onClose, items }: { open: boolean; onClose: () => void; items: NavItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const { settings } = useSite();
  const [expanded, setExpanded] = useState<number | null>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      tl.current = gsap
        .timeline({ paused: true })
        .set(el, { autoAlpha: 1 })
        .fromTo(el.querySelector('.mm-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(el.querySelector('.mm-panel'), { xPercent: -100 }, { xPercent: 0, duration: 0.55, ease: 'power4.out' }, '<')
        .fromTo(el.querySelectorAll('.mm-item'), { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'power3.out' }, '-=0.3');
    },
    { scope: root },
  );

  useEffect(() => {
    if (!tl.current) return;
    if (open) {
      tl.current.play();
      document.body.style.overflow = 'hidden';
    } else {
      tl.current.reverse();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const toggle = (i: number) => {
    const next = expanded === i ? null : i;
    setExpanded(next);
  };

  return (
    <div ref={root} className="invisible fixed inset-0 z-[70] lg:hidden" aria-hidden={!open}>
      <button type="button" className="mm-backdrop absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close menu" />
      <div className="mm-panel absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white">
        <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
          <Logo size="sm" />
          <button type="button" onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center" aria-label="Close menu">
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
          <ul className="divide-y divide-line">
            {items.map((item, i) => {
              const hasChildren = Boolean(item.children && item.children.length);
              return (
                <li key={`${item.href}-${i}`} className="mm-item">
                  <div className="flex items-center justify-between">
                    <Link href={item.href} onClick={onClose} className="block py-4 font-display text-lg text-ink">
                      {item.label}
                    </Link>
                    {hasChildren && (
                      <button type="button" onClick={() => toggle(i)} className="flex h-11 w-11 items-center justify-center text-muted" aria-label={`Toggle ${item.label}`} aria-expanded={expanded === i}>
                        <ChevronDown size={18} className={cn('transition-transform duration-300', expanded === i && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  {hasChildren && (
                    <Collapsible open={expanded === i}>
                      <ul className="pb-4 pl-4">
                        <li>
                          <Link href={item.href} onClick={onClose} className="block py-2 text-[13px] uppercase tracking-[0.14em] text-accent">
                            View all
                          </Link>
                        </li>
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} onClick={onClose} className="flex items-center justify-between py-2 text-[15px] text-ink-soft">
                              {child.label}
                              {typeof child.count === 'number' && <span className="text-xs text-muted">{child.count}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </Collapsible>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mm-item border-t border-line px-5 py-5 text-sm text-muted">
          {settings.contact.phone && <p>{settings.contact.phone}</p>}
          {settings.contact.email && <p>{settings.contact.email}</p>}
          {settings.contact.whatsapp && (
            <a href={whatsappLink(settings.contact.whatsapp, settings.contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-ink">
              <WhatsAppIcon size={18} className="text-whatsapp" /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

