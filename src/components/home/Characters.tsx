"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/client";
import styles from "./characters.module.css";

gsap.registerPlugin(ScrollTrigger);

export type CharacterData = {
  id: string;
  name: string;
  title: string;
  bio: string;
  quote: string;
  image: string;
  focus: string;
};

const AUTOPLAY_SEC = 9;
const RING = 2 * Math.PI * 34;

export function Characters({ characters }: { characters: CharacterData[] }) {
  const [active, setActive] = useState(0);
  const { t } = useI18n();
  const [dossierOpen, setDossierOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const portraits = useRef<(HTMLDivElement | null)[]>([]);
  const backdrops = useRef<(HTMLDivElement | null)[]>([]);
  const rings = useRef<(SVGCircleElement | null)[]>([]);
  const displacement = useRef<SVGFEDisplacementMapElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const firstRender = useRef(true);
  const autoplay = useRef<gsap.core.Tween | null>(null);
  const paused = useRef({ hover: false, offscreen: true, dialog: false });

  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const count = characters.length;
  const current = characters[active];

  const go = useCallback(
    (next: number) => {
      if (busy.current || next === active || !characters[next]) return;
      const from = portraits.current[active];
      const to = portraits.current[next];
      if (!from || !to) return;

      if (reduced.current) {
        gsap.set(from, { opacity: 0 });
        gsap.set(to, { opacity: 1, clipPath: "none" });
        gsap.set(backdrops.current[active], { opacity: 0 });
        gsap.set(backdrops.current[next], { opacity: 1 });
        setActive(next);
        return;
      }

      busy.current = true;
      autoplay.current?.kill();
      const lines = text.current?.querySelectorAll("[data-line]") ?? [];

      // Out: the portrait dissolves into smoke while the text sinks away.
      from.style.filter = "url(#hm-smoke)";
      gsap
        .timeline({
          onComplete: () => {
            from.style.filter = "";
            gsap.set(displacement.current, { attr: { scale: 0 } });
            busy.current = false;
          },
        })
        .to(displacement.current, { attr: { scale: 120 }, duration: 0.9, ease: "power2.in" }, 0)
        .to(from, { opacity: 0, scale: 1.04, duration: 0.9, ease: "power2.in" }, 0)
        .to(lines, { y: -26, opacity: 0, filter: "blur(6px)", duration: 0.45, stagger: 0.035, ease: "power2.in" }, 0)
        .to(backdrops.current[active], { opacity: 0, duration: 1.4 }, 0)
        .to(backdrops.current[next], { opacity: 1, duration: 1.4 }, 0)
        .add(() => setActive(next), 0.5)
        // In: candle-flash reveal rising from the floor.
        .fromTo(
          to,
          { opacity: 1, clipPath: "inset(100% 0% 0% 0%)", scale: 1.14, filter: "brightness(2.6) blur(8px)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            filter: "brightness(1) blur(0px)",
            duration: 1.5,
            ease: "expo.out",
            clearProps: "filter",
          },
          0.55,
        );
    },
    [active, characters],
  );

  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  // Text entrance after each change (and on the first scroll into view).
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reduced.current || !text.current) return;
    gsap.fromTo(
      text.current.querySelectorAll("[data-line]"),
      { y: 30, opacity: 0, filter: "blur(6px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.15 },
    );
    gsap.fromTo(
      text.current.querySelectorAll("[data-char]"),
      { opacity: 0 },
      { opacity: 1, duration: 0.05, stagger: { each: 0.035, from: "random" }, delay: 0.2 },
    );
  }, [active]);

  // Autoplay with a progress ring on the active thumbnail.
  const startAutoplay = useCallback(() => {
    autoplay.current?.kill();
    const ring = rings.current[active];
    if (!ring || reduced.current || count < 2) return;
    autoplay.current = gsap.fromTo(
      ring,
      { strokeDashoffset: RING },
      {
        strokeDashoffset: 0,
        duration: AUTOPLAY_SEC,
        ease: "none",
        onComplete: () => goRef.current((active + 1) % count),
      },
    );
    const p = paused.current;
    if (p.hover || p.offscreen || p.dialog) autoplay.current.pause();
  }, [active, count]);

  useEffect(() => {
    startAutoplay();
    return () => {
      autoplay.current?.kill();
    };
  }, [startAutoplay]);

  const syncPause = useCallback(() => {
    const p = paused.current;
    if (p.hover || p.offscreen || p.dialog) autoplay.current?.pause();
    else autoplay.current?.resume();
  }, []);

  // Section entrance + pause autoplay while off screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        end: "bottom 20%",
        onToggle: (self) => {
          paused.current.offscreen = !self.isActive;
          syncPause();
        },
      });
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(el.querySelectorAll("[data-enter]"), {
        y: 50,
        opacity: 0,
        duration: 1.4,
        stagger: 0.1,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 65%" },
      });
      gsap.from(el.querySelector("[data-stage]"), {
        clipPath: "inset(100% 0% 0% 0%)",
        duration: 1.8,
        ease: "expo.inOut",
        scrollTrigger: { trigger: el, start: "top 65%" },
      });
    }, el);
    return () => ctx.revert();
  }, [syncPause]);

  // Keyboard: arrows switch characters while focus is inside the section.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go((active + 1) % count);
    if (e.key === "ArrowLeft") go((active - 1 + count) % count);
  };

  const openDossier = () => {
    dialog.current?.showModal();
    setDossierOpen(true);
    paused.current.dialog = true;
    syncPause();
    window.__lenis?.stop();
  };
  const onDialogClose = () => {
    setDossierOpen(false);
    paused.current.dialog = false;
    syncPause();
    window.__lenis?.start();
  };

  if (!current) return null;

  return (
    <section
      id="characters"
      ref={root}
      className={styles.section}
      onKeyDown={onKeyDown}
      onPointerEnter={() => {
        paused.current.hover = true;
        syncPause();
      }}
      onPointerLeave={() => {
        paused.current.hover = false;
        syncPause();
      }}
      aria-roledescription={t.characters.carousel}
      aria-label={t.characters.label}
    >
      <svg className={styles.filters} aria-hidden="true">
        <filter id="hm-smoke" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.035" numOctaves="3" seed="7" />
          <feDisplacementMap ref={displacement} in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className={styles.backdrops} aria-hidden="true">
        {characters.map((c, i) => (
          <div
            key={c.id}
            ref={(node) => {
              backdrops.current[i] = node;
            }}
            className={styles.backdrop}
            data-active={i === active}
          >
            <Image src={c.image} alt="" fill sizes="40vw" quality={60} style={{ objectFit: "cover", objectPosition: c.focus }} />
          </div>
        ))}
      </div>

      <div className={`container ${styles.grid}`}>
        <span className={styles.bigIndex} aria-hidden="true">
          {String(active + 1).padStart(2, "0")}
        </span>

        <div className={styles.text} ref={text} aria-live="polite">
          <p className="eyebrow" data-enter>
            <span data-line>{t.characters.label} · {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          </p>
          <h2 className={styles.name} data-enter>
            <span data-line>
              {current.name.split("").map((ch, i) => (
                <span key={`${active}-${i}`} data-char>
                  {ch}
                </span>
              ))}
            </span>
          </h2>
          <p className={styles.role} data-enter>
            <span data-line>{current.title}</span>
          </p>
          <p className={styles.bio} data-enter>
            <span data-line>{current.bio}</span>
          </p>
          <div data-enter>
            <button type="button" className="btn btn--small" data-line onClick={openDossier}>
              {t.characters.openDossier}
            </button>
          </div>
        </div>

        <div className={styles.stage} data-stage>
          <div className={styles.arch} aria-hidden="true" />
          {characters.map((c, i) => (
            <div
              key={c.id}
              ref={(node) => {
                portraits.current[i] = node;
              }}
              className={styles.portrait}
              data-active={i === active}
              aria-hidden={i !== active}
            >
              <Image
                src={c.image}
                alt={`${c.name} — ${c.title}`}
                fill
                sizes="(max-width: 900px) 90vw, 36vw"
                quality={90}
                preload={i === 0}
                style={{ objectFit: "cover", objectPosition: c.focus }}
              />
            </div>
          ))}
          <div className={styles.candle} aria-hidden="true" />
        </div>

        <figure className={styles.quote} data-enter>
          <blockquote data-line>{current.quote}</blockquote>
          <figcaption data-line>— {current.name}</figcaption>
        </figure>
      </div>

      <div className={styles.thumbs} role="tablist" aria-label={t.characters.choose} data-enter>
        {characters.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={c.name}
            className={styles.thumb}
            data-active={i === active}
            onClick={() => go(i)}
          >
            <Image src={c.image} alt="" fill sizes="72px" quality={60} style={{ objectFit: "cover", objectPosition: c.focus }} />
            <svg viewBox="0 0 76 76" aria-hidden="true">
              <circle cx="38" cy="38" r="34" className={styles.ringTrack} />
              <circle
                ref={(node) => {
                  rings.current[i] = node;
                }}
                cx="38"
                cy="38"
                r="34"
                className={styles.ring}
                strokeDasharray={RING}
                strokeDashoffset={RING}
              />
            </svg>
          </button>
        ))}
      </div>

      <dialog ref={dialog} className={styles.dossier} onClose={onDialogClose} aria-label={fmt(t.characters.dossier, { name: current.name })}>
        {dossierOpen && (
          <div className={styles.dossierInner}>
            <div className={styles.dossierArt}>
              <Image src={current.image} alt={current.name} fill sizes="(max-width: 900px) 90vw, 45vw" quality={90} style={{ objectFit: "contain" }} />
            </div>
            <div className={styles.dossierText}>
              <p className="eyebrow">{fmt(t.characters.dossierNo, { n: String(active + 1).padStart(3, "0") })}</p>
              <h3 className="serif">{current.name}</h3>
              <p className={styles.role}>{current.title}</p>
              <p>{current.bio}</p>
              <blockquote>
                {t.common.lq}
                {current.quote}
                {t.common.rq}
              </blockquote>
              <form method="dialog">
                <button className="btn btn--small" autoFocus>
                  {t.common.close}
                </button>
              </form>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
