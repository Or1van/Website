"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./fx.module.css";

/** Full-page WebGL layer: falling snow everywhere, drifting fog over the hero. */
export function Atmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  // Read by the render loop every frame; fog belongs to the landing hero only.
  const controls = useRef({ fog: pathname === "/" });

  useEffect(() => {
    controls.current.fog = pathname === "/";
  }, [pathname]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    // Three.js is loaded on demand so it never blocks first paint.
    import("./atmosphere-scene").then(({ createAtmosphere }) => {
      if (cancelled) return;
      try {
        dispose = createAtmosphere(el, controls.current);
      } catch {
        // No WebGL: the static paintings carry the mood on their own.
        el.style.display = "none";
      }
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return <canvas ref={canvas} className={styles.atmosphere} aria-hidden="true" />;
}
