import { FacebookIcon, InstagramIcon, LinkedInIcon, PinterestIcon, TikTokIcon, WhatsAppIcon, XIcon, YouTubeIcon } from '@/components/icons';
import type { SiteSettings } from '@/lib/types';
import { cn, whatsappLink } from '@/lib/utils';

type Props = {
  settings: SiteSettings;
  className?: string;
  itemClassName?: string;
  size?: number;
  includeWhatsapp?: boolean;
};

export function SocialLinks({ settings, className, itemClassName, size = 18, includeWhatsapp = true }: Props) {
  const { social, contact } = settings;
  const links: { label: string; href: string; Icon: typeof TikTokIcon }[] = [];
  if (includeWhatsapp && contact.whatsapp) links.push({ label: 'WhatsApp', href: whatsappLink(contact.whatsapp, contact.whatsappMessage), Icon: WhatsAppIcon });
  if (social.tiktok) links.push({ label: 'TikTok', href: social.tiktok, Icon: TikTokIcon });
  if (social.instagram) links.push({ label: 'Instagram', href: social.instagram, Icon: InstagramIcon });
  if (social.facebook) links.push({ label: 'Facebook', href: social.facebook, Icon: FacebookIcon });
  if (social.youtube) links.push({ label: 'YouTube', href: social.youtube, Icon: YouTubeIcon });
  if (social.pinterest) links.push({ label: 'Pinterest', href: social.pinterest, Icon: PinterestIcon });
  if (social.x) links.push({ label: 'X', href: social.x, Icon: XIcon });
  if (social.linkedin) links.push({ label: 'LinkedIn', href: social.linkedin, Icon: LinkedInIcon });
  if (links.length === 0) return null;

  return (
    <ul className={cn('flex items-center gap-2', className)}>
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white',
              itemClassName,
            )}
          >
            <Icon size={size} />
          </a>
        </li>
      ))}
    </ul>
  );
}
