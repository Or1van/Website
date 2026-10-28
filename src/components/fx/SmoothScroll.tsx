"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    // Hold the page still while the preloader plays.
    const release = () => lenis.start();
    if (!window.__hmReady) {
      lenis.stop();
      window.addEventListener("hm:ready", release, { once: true });
    }
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("hm:ready", release);
      gsap.ticker.remove(tick);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  // Same-page anchors ("/#editions" while on "/") glide instead of jumping. Capture phase,
  // so this runs before next/link turns the click into an instant router navigation.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href*='#']");
      if (!link) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;

      const target = url.hash === "#top" ? 0 : document.querySelector<HTMLElement>(url.hash);
      if (target === null) return;
      event.preventDefault();
      event.stopPropagation();
      // React handlers never see this click, so tell listeners (e.g. the mobile menu) directly.
      window.dispatchEvent(new Event("hm:navigate"));
      history.replaceState(null, "", url.hash === "#top" ? location.pathname : url.hash);
      if (window.__lenis) {
        window.__lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      } else if (target === 0) {
        window.scrollTo({ top: 0 });
      } else {
        target.scrollIntoView();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Recalculate trigger positions after client navigations.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
