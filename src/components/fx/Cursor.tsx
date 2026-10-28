"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import styles from "./fx.module.css";

const INTERACTIVE = "a, button, [role='button'], [data-cursor], label, summary";

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    // Enabling after mount keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    document.documentElement.classList.add("has-cursor");

    const dotX = gsap.quickTo(dot.current, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot.current, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ring.current, "x", { duration: 0.55, ease: "power3" });
    const ringY = gsap.quickTo(ring.current, "y", { duration: 0.55, ease: "power3" });
    const ringEl = ring.current;
    const dotEl = dot.current;

    const move = (e: PointerEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      dotEl.dataset.visible = ringEl.dataset.visible = "true";
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as Element).closest<HTMLElement>(INTERACTIVE);
      ringEl.dataset.hover = String(Boolean(target));
      setLabel(target?.dataset.cursor ?? "");
    };
    const leave = () => {
      dotEl.dataset.visible = ringEl.dataset.visible = "false";
    };
    const down = () => (ringEl.dataset.down = "true");
    const up = () => (ringEl.dataset.down = "false");

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className={styles.cursorRing} aria-hidden="true" data-has-label={Boolean(label)}>
        {label && <span>{label}</span>}
      </div>
      <div ref={dot} className={styles.cursorDot} aria-hidden="true" />
    </>
  );
}
