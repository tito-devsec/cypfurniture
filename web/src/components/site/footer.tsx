'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { telLink, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Reveal } from '@/components/ui/reveal';
import { Logo } from './logo';
import { SocialLinks } from './social-links';
import { useSettings } from './site-provider';

function Newsletter() {
  const { home } = useSettings();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  if (!home.newsletter.enabled) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('loading');
    try {
      await apiFetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <section className="border-t border-line bg-surface">
      <div className="container-x grid gap-8 py-14 md:grid-cols-2 md:items-center md:py-16">
        <Reveal>
          <h2 className="text-3xl md:text-4xl">{home.newsletter.title}</h2>
          <p className="mt-3 max-w-md text-muted">{home.newsletter.text}</p>
        </Reveal>
        <Reveal delay={0.1}>
          {state === 'done' ? (
            <p className="font-display text-xl text-accent">Thank you - you are on the list.</p>
          ) : (
            <form onSubmit={submit} className="flex max-w-lg border-b border-ink md:ml-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-14 flex-1 bg-transparent text-base placeholder:text-muted focus:outline-none"
                aria-label="Email address"
              />
              <button type="submit" disabled={state === 'loading'} className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-accent disabled:opacity-50">
                Subscribe <ArrowRight size={16} />
              </button>
            </form>
          )}
          {state === 'error' && <p className="mt-2 text-sm text-sale">Something went wrong. Please try again.</p>}
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const settings = useSettings();
  const { footer, contact, brand } = settings;
  const copyright = (footer.copyright || `© {year} ${brand.siteName}`).replace('{year}', String(new Date().getFullYear()));

  return (
    <footer className="mt-auto">
      <Newsletter />
      <div className="border-t border-line bg-cream">
        <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">{footer.description}</p>
            <SocialLinks settings={settings} className="mt-7" />
          </div>

          {footer.columns.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <h3 className="mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ink">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="link-line text-[15px] text-muted hover:text-ink">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="link-line text-[15px] text-muted hover:text-ink">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h3 className="mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ink">Contact</h3>
            <ul className="space-y-3 text-[15px] text-muted">
              {(contact.address || contact.city) && (
                <li className="flex gap-3">
                  <MapPin size={16} className="mt-1 shrink-0" />
                  <span>
                    {contact.address}
                    {contact.address && (contact.city || contact.country) ? <br /> : null}
                    {[contact.city, contact.country].filter(Boolean).join(', ')}
                  </span>
                </li>
              )}
              {contact.phone && (
                <li className="flex gap-3">
                  <Phone size={16} className="mt-1 shrink-0" />
                  <a href={telLink(contact.phone)} className="hover:text-ink">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.whatsapp && (
                <li className="flex gap-3">
                  <WhatsAppIcon size={16} className="mt-1 shrink-0" />
                  <a href={whatsappLink(contact.whatsapp, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                    WhatsApp us
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex gap-3">
                  <Mail size={16} className="mt-1 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="break-all hover:text-ink">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.workingHours && (
                <li className="flex gap-3">
                  <Clock size={16} className="mt-1 shrink-0" />
                  <span>{contact.workingHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-[12px] tracking-[0.04em] text-muted md:flex-row">
            <p>{copyright}</p>
            <ul className="flex flex-wrap items-center gap-5">
              {footer.bottomLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link href={link.href} className="hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="hover:text-ink">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
