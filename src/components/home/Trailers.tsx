"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import styles from "./trailers.module.css";
import { SplitText } from "@/components/fx/SplitText";

export type TrailerData = {
  id: string;
  title: string;
  description: string;
  image: string;
  youtubeId: string | null;
};

export function Trailers({ trailers }: { trailers: TrailerData[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { t: dict } = useI18n();
  const [current, setCurrent] = useState<TrailerData | null>(null);

  const open = (t: TrailerData) => {
    setCurrent(t);
    dialog.current?.showModal();
    window.__lenis?.stop();
  };
  const onClose = () => {
    // Unmount the iframe so the video stops.
    setCurrent(null);
    window.__lenis?.start();
  };

  return (
    <section id="trailers" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2 className={styles.title} data-reveal="title">
            <SplitText text={dict.trailers.title} />
          </h2>
          <p className={styles.lead} data-reveal>
            {dict.trailers.lead}
          </p>
        </div>

        <div className={styles.grid}>
          {trailers.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={styles.card}
              data-reveal="card"
              data-cursor={t.youtubeId ? dict.trailers.watch : dict.trailers.soonCursor}
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => open(t)}
            >
              <Image src={t.image} alt="" fill sizes="(max-width: 860px) 92vw, 45vw" quality={75} style={{ objectFit: "cover" }} />
              <span className={styles.play} aria-hidden="true">
                <svg width="16" height="18" viewBox="0 0 16 18">
                  <path d="M0 0l16 9-16 9z" fill="currentColor" />
                </svg>
              </span>
              <span className={styles.meta}>
                <span className={styles.badge}>{t.youtubeId ? dict.trailers.video : dict.trailers.soon}</span>
                <span className={styles.cardTitle}>{t.title}</span>
                <span className={styles.cardDesc}>{t.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <dialog ref={dialog} className={styles.dialog} onClose={onClose} aria-label={current?.title ?? dict.trailers.fallback}>
        {current && (
          <>
            {current.youtubeId ? (
              <div className={styles.video}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1&rel=0`}
                  title={current.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>
            ) : (
              <div className={styles.soon}>
                <p className="eyebrow">{dict.trailers.soon}</p>
                <h3>{current.title}</h3>
                <p>
                  {current.description} {dict.trailers.soonText}
                </p>
              </div>
            )}
            <form method="dialog" className={styles.close}>
              <button className="btn btn--small" autoFocus>
                {dict.common.close}
              </button>
            </form>
          </>
        )}
      </dialog>
    </section>
  );
}
