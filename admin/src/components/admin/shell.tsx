'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Tags,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { adminApi, clearSession } from '@/lib/admin-api';
import type { AdminUser, StatsSummary } from '@/lib/types';
import { cn, formatPrice, initials, siteUrl, timeAgo } from '@/lib/utils';
import { useSiteSettings } from './use-settings';

const NAV = [
  { group: 'Overview', items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'Catalogue',
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/categories', label: 'Categories', icon: Tags },
    ],
  },
  {
    group: 'Sales',
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/messages', label: 'Messages', icon: Inbox },
      { href: '/subscribers', label: 'Subscribers', icon: Users },
    ],
  },
  {
    group: 'Content',
    items: [
      { href: '/blog', label: 'Blog', icon: FileText },
      { href: '/pages', label: 'Pages', icon: BookOpen },
      { href: '/media', label: 'Media library', icon: ImageIcon },
    ],
  },
  {
    group: 'Website',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/account', label: 'My account', icon: UserCircle },
    ],
  },
];

const LABELS: Record<string, string> = {
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  messages: 'Messages',
  subscribers: 'Subscribers',
  blog: 'Blog',
  pages: 'Pages',
  media: 'Media library',
  settings: 'Settings',
  account: 'My account',
  new: 'New',
};

function breadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, i) => ({
    label: LABELS[segment] || (/^\d+$/.test(segment) ? 'Edit' : segment),
    href: `/${segments.slice(0, i + 1).join('/')}`,
  }));
}

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { commerce } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const sidebar = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the mobile sidebar and the avatar menu whenever the route changes
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(false);
  }

  // Numbers + latest activity for the sidebar and the top bar (refreshed on navigation)
  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<StatsSummary>('/api/stats/summary')
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Mobile sidebar slide-in (desktop keeps the sidebar static and untransformed)
  useGSAP(
    () => {
      const el = sidebar.current;
      if (!el) return;
      if (window.matchMedia('(min-width: 1024px)').matches) {
        gsap.set(el, { clearProps: 'transform' });
        return;
      }
      gsap.to(el, { x: open ? 0 : '-100%', duration: 0.4, ease: 'power3.out' });
    },
    { dependencies: [open], scope: sidebar },
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches && sidebar.current) gsap.set(sidebar.current, { clearProps: 'transform' });
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Avatar menu: close on outside click
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  const logout = () => {
    clearSession();
    router.replace('/login');
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const crumbs = breadcrumbs(pathname);
  const last = crumbs[crumbs.length - 1];
  // "New" / "Edit" pages show their section name in the top bar (the page itself carries the detailed heading)
  const title = !last ? 'Dashboard' : ['New', 'Edit'].includes(last.label) && crumbs.length > 1 ? crumbs[crumbs.length - 2].label : last.label;

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  type Activity = { key: string; icon: typeof ShoppingCart; title: string; detail: string; href: string; at: string };
  const activity: Activity[] = summary
    ? [
        ...summary.recentOrders.map((o) => ({
          key: `o${o.id}`,
          icon: ShoppingCart,
          title: `${o.customerName} placed order ${o.orderNumber}`,
          detail: formatPrice(o.total, commerce),
          href: `/orders/${o.id}`,
          at: o.createdAt,
        })),
        ...summary.recentMessages.map((m) => ({
          key: `m${m.id}`,
          icon: Mail,
          title: `${m.name} sent a message`,
          detail: m.subject || 'Enquiry',
          href: '/messages',
          at: m.createdAt,
        })),
      ]
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 4)
    : [];

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {open && <button type="button" className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" />}

      {/* ------------------------------------------------------------ sidebar */}
      <aside ref={sidebar} className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-brand text-white max-lg:[transform:translateX(-100%)] lg:static">
        <div className="flex h-16 shrink-0 items-center justify-between bg-brand-dark px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="CYP" className="h-6 w-auto" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] tracking-[0.18em]">CYP</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">Admin panel</span>
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="text-white/70 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-2 text-sm font-bold text-ink ring-2 ring-white/20">{initials(user.name || user.email)}</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-white/65">Administrator</span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
          {NAV.map((group) => (
            <div key={group.group} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                          active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        {active && <span className="absolute inset-y-1.5 -left-3 w-[3px] rounded-r bg-accent-2" aria-hidden="true" />}
                        <item.icon size={17} strokeWidth={1.8} className={cn(active ? 'text-accent-2' : 'text-white/75')} />
                        <span className="flex-1">{item.label}</span>
                        {item.href === '/messages' && summary && summary.unreadMessages > 0 && (
                          <span className="rounded-full bg-accent-2 px-1.5 py-0.5 text-[10px] font-bold text-ink">{summary.unreadMessages}</span>
                        )}
                        {item.href === '/orders' && summary && summary.pendingOrders > 0 && (
                          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">{summary.pendingOrders}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {activity.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Activity</p>
              <ul className="space-y-0.5">
                {activity.map((a) => (
                  <li key={a.key}>
                    <Link href={a.href} className="flex items-start gap-3 rounded-md px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
                        <a.icon size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 leading-snug">{a.title}</span>
                        <span className="block text-[11px] text-white/55">
                          {a.detail} · {timeAgo(a.at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="p-4 pt-0">
          <Link href="/orders" className="block rounded-lg bg-white p-4 text-ink shadow-card transition-transform hover:-translate-y-0.5">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold leading-none">{summary ? summary.orders : '–'}</span>
              {summary && summary.pendingOrders > 0 && <span className="mb-0.5 text-xs font-semibold text-[#c2410c]">{summary.pendingOrders} pending</span>}
            </div>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Total orders</p>
          </Link>
        </div>
      </aside>

      {/* ------------------------------------------------------------ main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-4 lg:px-6">
          <button type="button" onClick={() => setOpen(true)} className="text-ink lg:hidden" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

          <form onSubmit={search} role="search" className="ml-2 hidden h-10 w-72 items-center gap-2 rounded-full bg-canvas px-4 md:flex">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" className="w-full bg-transparent text-sm placeholder:text-muted focus:outline-none" />
            <button type="submit" className="text-muted hover:text-accent" aria-label="Search">
              <Search size={16} />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link href="/messages" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas" aria-label="Messages">
              <Mail size={19} strokeWidth={1.8} />
              {summary && summary.unreadMessages > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{summary.unreadMessages}</span>}
            </Link>
            <Link href="/orders?status=pending" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas" aria-label="Pending orders">
              <Bell size={19} strokeWidth={1.8} />
              {summary && summary.pendingOrders > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-2 px-1 text-[10px] font-bold text-ink">{summary.pendingOrders}</span>}
            </Link>
            <div ref={menuRef} className="relative ml-1">
              <button type="button" onClick={() => setMenu((v) => !v)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-canvas" aria-haspopup="menu" aria-expanded={menu}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{initials(user.name || user.email)}</span>
                <span className="hidden text-sm font-medium sm:block">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={cn('text-muted transition-transform', menu && 'rotate-180')} />
              </button>
              {menu && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-lg border border-line bg-white shadow-soft" role="menu">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-canvas" role="menuitem">
                    <UserCircle size={16} /> My account
                  </Link>
                  <a href={siteUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-canvas" role="menuitem">
                    <ExternalLink size={16} /> View website
                  </a>
                  <button type="button" onClick={logout} className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm text-danger hover:bg-canvas" role="menuitem">
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <nav className="flex items-center gap-1 border-b border-line/70 bg-white/70 px-4 py-2 text-xs text-muted lg:px-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              <ChevronRight size={12} aria-hidden="true" />
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-ink">{c.label}</span>
              ) : (
                <Link href={c.href} className="hover:text-accent">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
