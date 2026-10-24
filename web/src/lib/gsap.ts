'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin, SplitText);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Respect the user's reduced-motion preference. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Smoothly scroll to an element or y position using GSAP's ScrollToPlugin. */
export function smoothScrollTo(target: string | number | Element, offset = 96) {
  gsap.to(window, { duration: 1, ease: 'power3.inOut', scrollTo: { y: target, offsetY: offset, autoKill: true } });
}

export { gsap, useGSAP, ScrollTrigger, SplitText };
