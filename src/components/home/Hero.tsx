"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/client";
import styles from "./hero.module.css";

gsap.registerPlugin(ScrollTrigger);

const TITLE = "HOLLOWMERE";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      if (reduced) return;

      gsap.set(q("[data-letter]"), { yPercent: 110, opacity: 0, filter: "blur(10px)" });
      gsap.set(q("[data-intro]"), { opacity: 0, y: 24 });
      gsap.set(q("[data-bg]"), { scale: 1.18, filter: "brightness(0.2)" });

      const intro = () =>
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .to(q("[data-bg]"), { scale: 1.06, filter: "brightness(1)", duration: 3.2, ease: "power2.out" })
          .to(
            q("[data-letter]"),
            { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.8, stagger: { each: 0.06, from: "center" } },
            0.3,
          )
          .to(q("[data-intro]"), { opacity: 1, y: 0, duration: 1.4, stagger: 0.12 }, 0.9);

      if (window.__hmReady) intro();
      else window.addEventListener("hm:ready", intro, { once: true });

      // Scroll: the painting sinks back while the title lifts away.
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } })
        .to(q("[data-bg-wrap]"), { yPercent: 18, scale: 1.08, ease: "none" }, 0)
        .to(q("[data-title]"), { yPercent: -40, opacity: 0, ease: "none" }, 0)
        .to(q("[data-content]"), { y: -80, ease: "none" }, 0)
        .to(q("[data-bottom]"), { opacity: 0, y: 30, ease: "none" }, 0);

      // Pointer parallax on the painting.
      const x = gsap.quickTo(q("[data-bg-wrap]")[0], "x", { duration: 1.6, ease: "power3" });
      const y = gsap.quickTo(q("[data-bg-wrap]")[0], "y", { duration: 1.6, ease: "power3" });
      const onMove = (e: PointerEvent) => {
        x((e.clientX / window.innerWidth - 0.5) * -26);
        y((e.clientY / window.innerHeight - 0.5) * -16);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={root} className={styles.hero}>
      <div className={styles.bgWrap} data-bg-wrap>
        <div className={styles.bg} data-bg>
          <Image
            src="/images/hero-abbey.jpg"
            alt={t.hero.alt}
            fill
            preload
            sizes="100vw"
            quality={90}
            style={{ objectFit: "cover", objectPosition: "50% 62%" }}
          />
        </div>
      </div>
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.content} data-content>
        <p className={`eyebrow ${styles.kicker}`} data-intro>
          {t.hero.kicker}
        </p>
        <h1 className={styles.title} data-title aria-label="Hollowmere">
          {TITLE.split("").map((ch, i) => (
            <span key={i} className={styles.letterMask} aria-hidden="true">
              <span data-letter>{ch}</span>
            </span>
          ))}
        </h1>
        <p className={styles.subtitle} data-intro>
          <span />
          {t.hero.subtitle}
          <span />
        </p>
        <p className={styles.release} data-intro>
          {t.hero.release}
        </p>
        <div className={styles.ctas} data-intro>
          <a href="#editions" className="btn btn--gold" data-cursor={t.hero.orderCursor}>
            {t.hero.order}
          </a>
          <a href="#trailers" className="btn">
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
              <path d="M0 0l10 6-10 6z" fill="currentColor" />
            </svg>
            {t.hero.trailer}
          </a>
        </div>
      </div>

      <div className={styles.bottom} data-bottom>
        <div className={styles.bottomInner} data-intro>
          <a href="#characters" className={styles.scrollHint}>
            <span className={styles.scrollLine} />
            {t.hero.scroll}
          </a>
          <p className={styles.platforms}>PC · PlayStation 5 · Xbox Series X|S</p>
          <div className={styles.rating} title={t.hero.ratingTitle}>
            <strong>18+</strong>
            <span>
              {t.hero.rating1}
              <br />
              {t.hero.rating2}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
