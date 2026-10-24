'use client';

import { useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { gsap, useGSAP, ScrollTrigger, smoothScrollTo } from '@/lib/gsap';
import { whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { useSettings } from './site-provider';

/** Floating WhatsApp chat button + scroll-to-top, animated with GSAP. */
export function FloatingActions() {
  const { contact } = useSettings();
  const root = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLButtonElement>(null);
  const [showTop, setShowTop] = useState(false);

  useGSAP(
    () => {
      const wa = root.current?.querySelector('.fa-wa');
      if (wa) gsap.fromTo(wa, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, delay: 1.2, ease: 'back.out(1.8)' });
      ScrollTrigger.create({ start: 'top -600', onToggle: (self) => setShowTop(self.isActive) });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!topRef.current) return;
      gsap.to(topRef.current, { autoAlpha: showTop ? 1 : 0, y: showTop ? 0 : 12, duration: 0.35 });
    },
    { dependencies: [showTop], scope: root },
  );

  return (
    <div ref={root} className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <button
        ref={topRef}
        type="button"
        onClick={() => smoothScrollTo(0, 0)}
        className="pointer-events-auto invisible flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink opacity-0 shadow-soft transition-colors hover:bg-ink hover:text-white"
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>
      {contact.whatsapp && (
        <a
          href={whatsappLink(contact.whatsapp, contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="fa-wa group pointer-events-auto flex h-14 items-center gap-0 overflow-hidden rounded-full bg-whatsapp pl-0 text-white shadow-soft transition-all duration-500 hover:pl-5"
          aria-label="Chat with us on WhatsApp"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.16em] transition-[max-width] duration-500 group-hover:max-w-[160px]">Chat with us</span>
          <span className="flex h-14 w-14 items-center justify-center">
            <WhatsAppIcon size={28} />
          </span>
        </a>
      )}
    </div>
  );
}
