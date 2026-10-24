import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminGate } from '@/components/admin/admin-gate';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
