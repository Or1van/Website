import Image from "next/image";
import type { ReactNode } from "react";
import { getDictionary } from "@/i18n/server";
import styles from "./auth.module.css";

type Props = {
  image: string;
  focus: string;
  eyebrow: string;
  title: string;
  quote: string;
  children: ReactNode;
};

export async function AuthShell({ image, focus, eyebrow, title, quote, children }: Props) {
  const { t } = await getDictionary();
  return (
    <main className={styles.shell}>
      <div className={styles.art}>
        <Image src={image} alt="" fill preload sizes="50vw" quality={75} style={{ objectFit: "cover", objectPosition: focus }} />
        <p className={styles.quote}>
          {t.common.lq}
          {quote}
          {t.common.rq}
        </p>
      </div>
      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
