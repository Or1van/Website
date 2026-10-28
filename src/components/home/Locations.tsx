"use client";

import gsap from "gsap";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import styles from "./locations.module.css";
import { SplitText } from "@/components/fx/SplitText";

export type LocationData = {
  id: string;
  name: string;
  kind: string;
  description: string;
  image: string;
  focus: string;
};

export function Locations({ locations }: { locations: LocationData[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [bounds, setBounds] = useState({ max: 0, step: 1 });

  const measure = useCallback(() => {
    const v = viewport.current;
    const t = track.current;
    if (!v || !t) return;
    const card = t.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    setBounds({
      max: Math.max(0, t.scrollWidth - v.clientWidth),
      step: card ? card.offsetWidth + gap : 1,
    });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    return () => ro.disconnect();
  }, [measure]);

  const moveTo = useCallback(
    (value: number, animate = true) => {
      const clamped = gsap.utils.clamp(-bounds.max, 0, value);
      x.current = clamped;
      setOffset(clamped);
      setIndex(Math.round(-clamped / bounds.step));
      gsap.to(track.current, {
        x: clamped,
        duration: animate ? 1.1 : 0.2,
        ease: animate ? "expo.out" : "power2.out",
        overwrite: true,
      });
    },
    [bounds],
  );

  const lastIndex = Math.round(bounds.max / bounds.step);
  const prev = () => moveTo(-(index - 1) * bounds.step);
  const next = () => moveTo(index + 1 > lastIndex ? -bounds.max : -(index + 1) * bounds.step);

  // Drag to scroll, with a little inertia on release.
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let velocity = 0;
    let dragging = false;
    let moved = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startOffset = x.current;
      velocity = 0;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6 && !moved) {
        moved = true;
        v.setPointerCapture(e.pointerId);
      }
      if (!moved) return;
      velocity = e.clientX - lastX;
      lastX = e.clientX;
      x.current = gsap.utils.clamp(-bounds.max - 80, 80, startOffset + dx);
      gsap.set(track.current, { x: x.current });
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const projected = x.current + velocity * 12;
        moveTo(Math.round(projected / bounds.step) * bounds.step);
      }
    };
    // Swallow the click that ends a drag so cards are not "activated".
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    v.addEventListener("pointerdown", down);
    v.addEventListener("pointermove", move);
    v.addEventListener("pointerup", up);
    v.addEventListener("pointercancel", up);
    v.addEventListener("click", click, true);
    return () => {
      v.removeEventListener("pointerdown", down);
      v.removeEventListener("pointermove", move);
      v.removeEventListener("pointerup", up);
      v.removeEventListener("pointercancel", up);
      v.removeEventListener("click", click, true);
    };
  }, [bounds, moveTo]);

  const total = locations.length;
  const progress = bounds.max ? -offset / bounds.max : 0;

  return (
    <section id="locations" className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.intro}>
          <p className="eyebrow" data-reveal>
            {t.locations.eyebrow}
          </p>
          <h2 className={styles.title} data-reveal="title">
            <SplitText text={t.locations.title} />
          </h2>
          <p className={styles.lead} data-reveal>
            {t.locations.lead}
          </p>
          <div className={styles.controls} data-reveal>
            <button type="button" className={styles.arrow} onClick={prev} disabled={index === 0} aria-label={t.locations.prev}>
              <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
                <path d="M5 1 1 5l4 4M1 5h16" fill="none" stroke="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={next}
              disabled={-offset >= bounds.max - 1}
              aria-label={t.locations.next}
            >
              <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
                <path d="M13 1l4 4-4 4M17 5H1" fill="none" stroke="currentColor" />
              </svg>
            </button>
            <span className={styles.counter}>
              {String(Math.min(index + 1, total)).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className={styles.progress} aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} />
          </div>
        </div>

        <div className={styles.viewport} ref={viewport} data-cursor={t.locations.drag}>
          <div className={styles.track} ref={track}>
            {locations.map((l, i) => (
              <article key={l.id} className={styles.card} data-reveal="card" style={{ "--i": i } as React.CSSProperties}>
                <div className={styles.media}>
                  <Image
                    src={l.image}
                    alt={l.name}
                    fill
                    sizes="(max-width: 760px) 78vw, 340px"
                    quality={75}
                    draggable={false}
                    style={{ objectFit: "cover", objectPosition: l.focus }}
                  />
                </div>
                <div className={styles.caption}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{l.name}</h3>
                  <p className={styles.kind}>{l.kind}</p>
                  <p className={styles.desc}>{l.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
