"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/i18n/client";
import styles from "./header.module.css";

export function LangSwitch({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const next = locale === "uk" ? "en" : "uk";

  return (
    <form
      action={(formData) => startTransition(() => setLocaleAction(formData))}
      className={`${styles.lang} ${className}`}
    >
      <input type="hidden" name="locale" value={next} />
      <button
        type="submit"
        aria-label={t.lang.switchTo}
        title={t.lang.switchTo}
        disabled={pending}
        lang={next}
        data-pending={pending}
      >
        <span aria-hidden="true" data-current>
          {t.lang.current}
        </span>
        <span aria-hidden="true" className={styles.langSep}>
          /
        </span>
        <span aria-hidden="true">{t.lang.other}</span>
      </button>
    </form>
  );
}
