"use client";

import Image from "next/image";
import { useActionState } from "react";
import { subscribeAction } from "@/app/actions/newsletter";
import type { FormState } from "@/lib/validation";
import { useI18n } from "@/i18n/client";
import styles from "./newsletter.module.css";

export function Newsletter() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeAction, {});
  const { t } = useI18n();

  return (
    <section className={styles.section} aria-labelledby="newsletter-title">
      <div className={styles.bg} aria-hidden="true">
        <Image src="/images/loc-isle.jpg" alt="" fill sizes="100vw" quality={60} style={{ objectFit: "cover", objectPosition: "50% 60%" }} />
      </div>
      <div className={`container ${styles.inner}`}>
        <p className="eyebrow" data-reveal>
          {t.newsletter.eyebrow}
        </p>
        <h2 id="newsletter-title" className={styles.title} data-reveal>
          {t.newsletter.title}
        </h2>
        <p className={styles.lead} data-reveal>
          {t.newsletter.lead}
        </p>

        {state.ok ? (
          <p className={styles.done} role="status">
            {state.message}
          </p>
        ) : (
          <form action={action} className={styles.form} data-reveal noValidate>
            <div className="honeypot" aria-hidden="true">
              <label>
                {t.newsletter.honeypot}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label htmlFor="newsletter-email" className="sr-only">
              {t.newsletter.emailLabel}
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              defaultValue={state.values?.email}
              placeholder={t.newsletter.placeholder}
              className="input"
              aria-invalid={Boolean(state.errors?.email)}
              aria-describedby="newsletter-status"
            />
            <button className="btn btn--solid" disabled={pending}>
              {pending ? t.newsletter.sending : t.newsletter.submit}
            </button>
            <p id="newsletter-status" className={styles.status} role="status">
              {state.errors?.email ?? state.message}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
