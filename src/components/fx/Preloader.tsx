"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import styles from "./fx.module.css";

declare global {
  interface Window {
    __hmReady?: boolean;
  }
}

const TITLE = "HOLLOWMERE";

/** Announces that the intro can play. Hero animations wait for this. */
function markReady() {
  window.__hmReady = true;
  window.dispatchEvent(new Event("hm:ready"));
}

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("hm-intro") === "1";
    } catch {}

    if (seen || reduced) {
      gsap.to(el, {
        autoAlpha: 0,
        duration: 0.4,
        onStart: markReady,
        onComplete: () => setGone(true),
      });
      return;
    }

    const counter = { value: 0 };
    const number = el.querySelector<HTMLElement>("[data-count]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;

    // Real progress: fonts plus the images already in the document, capped by a minimum duration.
    const images = Array.from(document.images).filter((img) => img.loading !== "lazy");
    const waits = [
      document.fonts.ready,
      ...images.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
    ];
    let loaded = 0;
    const target = { value: 0 };
    waits.forEach((p) =>
      Promise.resolve(p).then(() => {
        loaded++;
        target.value = loaded / waits.length;
      }),
    );

    const tl = gsap.timeline();
    tl.from(el.querySelectorAll("[data-letter]"), {
      opacity: 0,
      filter: "blur(12px)",
      duration: 1.2,
      stagger: { each: 0.07, from: "random" },
      ease: "power2.out",
    });

    const minEnd = performance.now() + 1800;
    const tick = () => {
      const goal = Math.min(target.value, performance.now() >= minEnd ? 1 : 0.92);
      counter.value += (goal - counter.value) * 0.08;
      if (goal === 1 && counter.value > 0.995) counter.value = 1;
      number.textContent = String(Math.round(counter.value * 100)).padStart(3, "0");
      bar.style.transform = `scaleX(${counter.value})`;
      if (counter.value === 1) {
        gsap.ticker.remove(tick);
        finish();
      }
    };
    gsap.ticker.add(tick);

    const finish = () => {
      try {
        sessionStorage.setItem("hm-intro", "1");
      } catch {}
      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(el.querySelectorAll("[data-letter]"), {
          opacity: 0,
          y: -30,
          filter: "blur(8px)",
          duration: 0.6,
          stagger: 0.03,
          ease: "power2.in",
        })
        .to(el.querySelector("[data-meta]"), { opacity: 0, duration: 0.3 }, "<")
        .to(el.querySelectorAll("[data-curtain]"), {
          yPercent: (i) => (i === 0 ? -100 : 100),
          duration: 1.1,
          ease: "expo.inOut",
          onStart: markReady,
        });
    };

    return () => {
      gsap.ticker.remove(tick);
      tl.kill();
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className={styles.preloader} role="status" aria-label={t.preloader.label}>
      <div className={styles.curtain} data-curtain />
      <div className={styles.curtain} data-curtain />
      <div className={styles.preloaderInner}>
        <p className={styles.preloaderTitle} aria-hidden="true">
          {TITLE.split("").map((ch, i) => (
            <span key={i} data-letter>
              {ch}
            </span>
          ))}
        </p>
        <div className={styles.preloaderMeta} data-meta>
          <span>{t.preloader.line}</span>
          <span data-count>000</span>
        </div>
        <div className={styles.preloaderBar}>
          <span data-bar />
        </div>
      </div>
    </div>
  );
}
