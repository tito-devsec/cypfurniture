'use client';

import Link from 'next/link';
import { useSettings } from './site-provider';

export function AnnouncementBar() {
  const { announcement } = useSettings();
  if (!announcement.enabled || !announcement.text) return null;
  return (
    <div className="bg-accent px-4 py-2.5 text-center text-[12px] tracking-[0.06em] text-white">
      <span>{announcement.text}</span>
      {announcement.link && (
        <Link href={announcement.link} className="ml-3 inline-block text-[11px] font-medium uppercase tracking-[0.18em] underline underline-offset-4 transition-opacity hover:opacity-80">
          {announcement.linkText || 'Shop now'}
        </Link>
      )}
    </div>
  );
}
