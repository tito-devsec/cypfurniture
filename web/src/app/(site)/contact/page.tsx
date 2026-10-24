import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getSettings } from '@/lib/api';
import { telLink, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/ui/reveal';
import { SplitHeading } from '@/components/ui/split-heading';
import { ContactForm } from '@/components/site/contact-form';
import { SocialLinks } from '@/components/site/social-links';

export const metadata: Metadata = { title: 'Contact us' };

export default async function ContactPage() {
  const settings = await getSettings();
  const { contact } = settings;

  const cards = [
    contact.whatsapp
      ? { icon: <WhatsAppIcon size={22} />, title: 'WhatsApp', text: 'Fastest way to reach us', href: whatsappLink(contact.whatsapp, contact.whatsappMessage), external: true, label: 'Start a chat' }
      : null,
    contact.phone ? { icon: <Phone size={22} strokeWidth={1.5} />, title: 'Phone', text: [contact.phone, contact.phoneSecondary].filter(Boolean).join(' · '), href: telLink(contact.phone), label: 'Call us' } : null,
    contact.email ? { icon: <Mail size={22} strokeWidth={1.5} />, title: 'Email', text: contact.email, href: `mailto:${contact.email}`, label: 'Write to us' } : null,
    contact.address || contact.city
      ? {
          icon: <MapPin size={22} strokeWidth={1.5} />,
          title: 'Showroom',
          text: [contact.address, contact.city, contact.country].filter(Boolean).join(', '),
          href: `https://www.google.com/maps/search/${encodeURIComponent([contact.address, contact.city, contact.country].filter(Boolean).join(', '))}`,
          external: true,
          label: 'Get directions',
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; title: string; text: string; href: string; external?: boolean; label: string }[];

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <header className="mt-8 max-w-2xl">
        <p className="eyebrow mb-3">Contact</p>
        <SplitHeading as="h1" text="We would love to hear from you" className="text-4xl leading-[1.05] md:text-6xl" immediate />
        <Reveal delay={0.2}>
          <p className="mt-5 text-lg text-muted">Questions about a product, a custom project or a showroom visit - our team is here to help.</p>
        </Reveal>
      </header>

      {cards.length > 0 && (
        <Reveal stagger={0.08} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <a key={card.title} href={card.href} target={card.external ? '_blank' : undefined} rel={card.external ? 'noopener noreferrer' : undefined} className="group border border-line p-6 transition-colors hover:border-ink">
              <span className="text-accent">{card.icon}</span>
              <h2 className="mt-4 font-display text-xl">{card.title}</h2>
              <p className="mt-1 text-[15px] text-muted">{card.text}</p>
              <span className="link-line mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.18em] text-ink group-hover:link-line-active">{card.label}</span>
            </a>
          ))}
        </Reveal>
      )}

      <div className="mt-16 grid gap-14 lg:mt-20 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <h2 className="mb-7 text-3xl">Send us a message</h2>
          <ContactForm />
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-5">
          <div className="bg-surface p-8">
            {contact.workingHours && (
              <div className="flex gap-4">
                <Clock size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h3 className="font-display text-lg">Opening hours</h3>
                  <p className="mt-1 text-[15px] text-muted">{contact.workingHours}</p>
                </div>
              </div>
            )}
            <div className="mt-8">
              <h3 className="font-display text-lg">Follow us</h3>
              <SocialLinks settings={settings} className="mt-4" />
            </div>
          </div>
          {contact.mapEmbedUrl && (
            <div className="mt-6 aspect-[4/3] overflow-hidden bg-surface">
              <iframe src={contact.mapEmbedUrl} title="Map" className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
