'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  UserCircle,
  X,
} from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { clearSession } from '@/lib/admin-api';
import type { AdminUser } from '@/lib/types';
import { cn, siteUrl } from '@/lib/utils';

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
      { href: '/subscribers', label: 'Subscribers', icon: Mail },
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

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLDivElement>(null);

  // Close the mobile sidebar whenever the route changes (state derived from the route).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useGSAP(
    () => {
      if (!sidebar.current) return;
      gsap.to(sidebar.current, { x: open ? 0 : '-100%', duration: 0.4, ease: 'power3.out' });
    },
    { dependencies: [open], scope: sidebar },
  );

  const logout = () => {
    clearSession();
    router.replace('/login');
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      {open && <button type="button" className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <aside ref={sidebar} className="fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col bg-ink text-white lg:static lg:!translate-x-0">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/" className="flex items-center gap-3 leading-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="CYP" className="h-9 w-auto" />
            <span className="flex flex-col">
              <span className="font-display text-base tracking-[0.2em]">CYP</span>
              <span className="mt-0.5 text-[9px] uppercase tracking-[0.36em] text-white/60">Admin</span>
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="text-white/70 lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {NAV.map((group) => (
            <div key={group.group} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={cn('flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors', active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
                        <item.icon size={16} strokeWidth={1.6} className={cn(active && 'text-accent-soft')} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm">{user.name}</p>
          <p className="truncate text-xs text-white/50">{user.email}</p>
          <div className="mt-3 flex gap-2">
            <a href={siteUrl()} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-white/15 py-1.5 text-xs text-white/80 hover:bg-white/10">
              <ExternalLink size={12} /> View site
            </a>
            <button type="button" onClick={logout} className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-white/15 py-1.5 text-xs text-white/80 hover:bg-white/10">
              <LogOut size={12} /> Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="text-ink lg:hidden" aria-label="Open menu">
              <Menu size={22} />
            </button>
            <p className="text-sm text-muted">
              {NAV.flatMap((g) => g.items).find((i) => isActive(i.href))?.label ?? 'Admin'}
            </p>
          </div>
          <a href={siteUrl()} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 text-xs text-muted hover:text-ink sm:flex">
            <ExternalLink size={13} /> Open storefront
          </a>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
