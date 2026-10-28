"use client";

import gsap from "gsap";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { addToCartAction, type CartState } from "@/app/actions/cart";
import { useI18n } from "@/i18n/client";
import type { EditionData } from "./Editions";
import styles from "./editions.module.css";

type Props = {
  edition: EditionData & { price: string };
  index: number;
  featured?: boolean;
};

export function EditionCard({ edition, index, featured }: Props) {
  const card = useRef<HTMLElement>(null);
  const router = useRouter();
  const { t } = useI18n();
  const [state, action, pending] = useActionState<CartState, FormData>(addToCartAction, {});

  useEffect(() => {
    if (state.needsLogin) router.push("/login?next=%2F%23editions");
  }, [state, router]);

  // Pointer tilt with a moving glare.
  useEffect(() => {
    const el = card.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
    gsap.set(el, { transformPerspective: 900 });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 10);
      rx((0.5 - py) * 8);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <article ref={card} className={styles.card} data-featured={featured} data-reveal="card" style={{ "--i": index } as React.CSSProperties}>
      <div className={styles.cover}>
        <Image
          src={edition.image}
          alt=""
          fill
          sizes="(max-width: 900px) 92vw, 30vw"
          quality={75}
          style={{ objectFit: "cover", objectPosition: edition.focus }}
        />
        <div className={styles.coverText}>
          <span className={styles.coverBrand}>HOLLOWMERE</span>
          <span className={styles.coverSub}>{t.brand.subtitle}</span>
        </div>
        {featured && <span className={styles.flag}>{t.editions.popular}</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{edition.name}</h3>
        <p className={styles.tagline}>{edition.tagline}</p>
        <ul className={styles.features}>
          {edition.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <div className={styles.footer}>
          <span className={styles.price}>{edition.price}</span>
          <form action={action}>
            <input type="hidden" name="editionId" value={edition.id} />
            <button className="btn btn--small btn--gold" disabled={pending} data-cursor={t.editions.add}>
              {pending ? t.editions.adding : t.editions.add}
            </button>
          </form>
        </div>
        <p className={styles.status} role="status" data-ok={state.ok}>
          {state.message}
        </p>
      </div>
      <span className={styles.glare} aria-hidden="true" />
    </article>
  );
}
