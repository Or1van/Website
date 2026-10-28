import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { formatPrice } from "@/lib/format";
import { EditionCard } from "./EditionCard";
import styles from "./editions.module.css";
import { SplitText } from "@/components/fx/SplitText";

export type EditionData = {
  id: string;
  name: string;
  tagline: string;
  priceCents: number;
  currency: string;
  features: string[];
  image: string;
  focus: string;
};

export async function Editions({ editions, locale }: { editions: EditionData[]; locale: Locale }) {
  const { t } = await getDictionary();
  return (
    <section id="editions" className={styles.section}>
      <div className={styles.bg} aria-hidden="true">
        <Image src="/images/loc-abbey.jpg" alt="" fill sizes="100vw" quality={60} style={{ objectFit: "cover", objectPosition: "50% 70%" }} />
      </div>

      <div className="container">
        <h2 className={styles.title} data-reveal="title">
          <SplitText text={t.editions.title} />
        </h2>
        <p className={styles.lead} data-reveal>
          {t.editions.lead}
        </p>

        <div className={styles.grid}>
          {editions.map((e, i) => (
            <EditionCard
              key={e.id}
              index={i}
              edition={{ ...e, price: formatPrice(e.priceCents, e.currency, locale) }}
              featured={i === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
