'use client';

import Link from 'next/link';
import { CurrencySelector } from './currency-selector';
import { SocialLinks } from './social-links';
import { useMoney, useSettings } from './site-provider';

/**
 * Thin utility bar above the header: social icons (left), announcement (centre), currency (right).
 */
export function TopBar() {
  const settings = useSettings();
  const { options } = useMoney();
  const { announcement, social, contact } = settings;
  const hasAnnouncement = announcement.enabled && Boolean(announcement.text);
  const hasSocial = Boolean(social.instagram || social.facebook || social.tiktok || social.youtube || social.pinterest || social.x || social.linkedin || contact.whatsapp);
  if (!hasAnnouncement && !hasSocial && options.length === 0) return null;

  return (
    <div className="bg-accent text-white">
      <div className="container-x grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-4 py-1.5 text-[12px] tracking-[0.06em]">
        <SocialLinks
          settings={settings}
          size={13}
          className="hidden gap-0.5 md:flex"
          itemClassName="h-7 w-7 border-0 text-white/85 hover:translate-y-0 hover:bg-white/15 hover:text-white"
        />
        <p className="col-start-2 line-clamp-1 text-center">
          {hasAnnouncement && (
            <>
              <span>{announcement.text}</span>
              {announcement.link && (
                <Link href={announcement.link} className="ml-3 inline-block text-[11px] font-medium uppercase tracking-[0.18em] underline underline-offset-4 transition-opacity hover:opacity-80">
                  {announcement.linkText || 'Shop now'}
                </Link>
              )}
            </>
          )}
        </p>
        <CurrencySelector className="col-start-3 justify-self-end text-white" />
      </div>
    </div>
  );
}
