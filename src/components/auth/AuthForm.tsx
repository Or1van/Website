"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/validation";
import { useI18n } from "@/i18n/client";
import styles from "./auth.module.css";

type Props = { mode: "login" | "register"; next: string };

export function AuthForm({ mode, next }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "login" ? loginAction : registerAction,
    {},
  );
  const err = state.errors ?? {};
  const { t } = useI18n();
  const values = state.values ?? {};
  const suffix = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="next" value={next} />

      {mode === "register" && (
        <div className="field">
          <label htmlFor="name">{t.auth.name}</label>
          <input
            id="name"
            name="name"
            className="input"
            autoComplete="name"
            defaultValue={values.name}
            required
            maxLength={60}
            aria-invalid={Boolean(err.name)}
            aria-describedby={err.name ? "name-error" : undefined}
          />
          {err.name && (
            <p id="name-error" className="field-error">
              {err.name}
            </p>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="email">{t.auth.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          defaultValue={values.email}
          required
          maxLength={254}
          aria-invalid={Boolean(err.email)}
          aria-describedby={err.email ? "email-error" : undefined}
        />
        {err.email && (
          <p id="email-error" className="field-error">
            {err.email}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="password">{t.auth.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 10 : undefined}
          maxLength={128}
          aria-invalid={Boolean(err.password)}
          aria-describedby={err.password ? "password-error" : mode === "register" ? "password-hint" : undefined}
        />
        {err.password ? (
          <p id="password-error" className="field-error">
            {err.password}
          </p>
        ) : (
          mode === "register" && (
            <p id="password-hint" className={styles.hint}>
              {t.auth.passwordHint}
            </p>
          )
        )}
      </div>

      {state.message && (
        <p className="form-message" data-ok="false" role="alert">
          {state.message}
        </p>
      )}

      <button className="btn btn--solid" disabled={pending}>
        {pending ? t.auth.wait : mode === "login" ? t.auth.submitLogin : t.auth.submitRegister}
      </button>

      <p className={styles.switch}>
        {mode === "login" ? (
          <>
            {t.auth.newHere} <Link href={`/register${suffix}`}>{t.auth.createAccount}</Link>
          </>
        ) : (
          <>
            {t.auth.haveAccount} <Link href={`/login${suffix}`}>{t.auth.signIn}</Link>
          </>
        )}
      </p>
    </form>
  );
}
