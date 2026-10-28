import Link from "next/link";
import { getDictionary } from "@/i18n/server";
import styles from "./pages.module.css";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <main className="page">
      <div className={`container ${styles.success}`}>
        <p className="eyebrow">404</p>
        <h1 className="page-title">{t.notFound.title}</h1>
        <p className={styles.lead}>{t.notFound.lead}</p>
        <div className={styles.row}>
          <Link href="/" className="btn btn--gold">
            {t.notFound.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
