import Link from "next/link";
import { getDictionary } from "@/i18n/server";
import styles from "./footer.module.css";

export async function Footer() {
  const { t } = await getDictionary();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>HOLLOWMERE</span>
          <span className={styles.sub}>{t.brand.subtitle}</span>
          <p className={styles.note}>{t.footer.note}</p>
        </div>
        <nav className={styles.cols} aria-label={t.footer.aria}>
          <div>
            <p className={styles.head}>{t.footer.game}</p>
            <Link href="/#characters">{t.nav.characters}</Link>
            <Link href="/#editions">{t.nav.editions}</Link>
            <Link href="/#locations">{t.nav.locations}</Link>
            <Link href="/#trailers">{t.nav.trailers}</Link>
          </div>
          <div>
            <p className={styles.head}>{t.footer.account}</p>
            <Link href="/account">{t.nav.account}</Link>
            <Link href="/cart">{t.footer.cart}</Link>
            <Link href="/credits">{t.footer.credits}</Link>
          </div>
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} Hollowmere</span>
        <span>{t.footer.age}</span>
      </div>
    </footer>
  );
}
