"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-in animations for anything marked with data-reveal:
 *   data-reveal         fade and rise
 *   data-reveal="title" letters (rendered by <SplitText>) rise out of their masks
 *   data-reveal="card"  staggered by the element's --i custom property
 * Content is fully visible without JavaScript; states are only applied here.
 */
export function Reveals() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const kind = el.dataset.reveal;
        const trigger = { trigger: el, start: "top 88%", once: true };

        if (kind === "title") {
          gsap.from(el.querySelectorAll("[data-split]"), {
            yPercent: 115,
            rotate: 6,
            duration: 1.3,
            stagger: 0.04,
            ease: "expo.out",
            scrollTrigger: trigger,
          });
          return;
        }

        const i = Number(getComputedStyle(el).getPropertyValue("--i")) || 0;
        gsap.from(el, {
          y: kind === "card" ? 70 : 34,
          opacity: 0,
          filter: kind === "card" ? "blur(6px)" : "none",
          duration: 1.3,
          delay: kind === "card" ? i * 0.12 : 0,
          ease: "expo.out",
          clearProps: "filter",
          scrollTrigger: trigger,
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
