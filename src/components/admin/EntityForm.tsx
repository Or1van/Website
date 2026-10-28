"use client";

import { useActionState } from "react";
import { deleteEntityAction, saveEntityAction } from "@/app/actions/admin";
import type { FormState } from "@/lib/validation";
import styles from "./admin.module.css";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "lines" | "image";
  hint?: string;
};

type Props = {
  entity: "character" | "edition" | "location" | "trailer";
  fields: Field[];
  values?: Record<string, unknown> & { id?: string };
  images: string[];
};

function asText(value: unknown) {
  if (Array.isArray(value)) return value.join("\n");
  if (value === null || value === undefined) return "";
  return String(value);
}

export function EntityForm({ entity, fields, values, images }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveEntityAction, {});
  const err = state.errors ?? {};
  const submitted = state.values;
  const prefix = `${entity}-${values?.id ?? "new"}`;

  return (
    <div className={styles.formWrap}>
      <form action={action} className={styles.form}>
        <input type="hidden" name="entity" value={entity} />
        {values?.id && <input type="hidden" name="id" value={values.id} />}

        {fields.map((f) => {
          const id = `${prefix}-${f.name}`;
          const value = submitted ? submitted[f.name] : values?.[f.name];
          if (f.type === "checkbox") {
            const checked = submitted ? f.name in submitted : values ? Boolean(value) : true;
            return (
              <label key={f.name} className={styles.check} htmlFor={id}>
                <input id={id} type="checkbox" name={f.name} defaultChecked={checked} />
                {f.label}
              </label>
            );
          }
          return (
            <div key={f.name} className={`field ${f.type === "textarea" || f.type === "lines" ? styles.wide : ""}`}>
              <label htmlFor={id}>{f.label}</label>
              {f.type === "textarea" || f.type === "lines" ? (
                <textarea id={id} name={f.name} className="input" defaultValue={asText(value)} rows={f.type === "lines" ? 5 : 4} />
              ) : f.type === "image" ? (
                <select id={id} name={f.name} className="input" defaultValue={asText(value) || images[0]}>
                  {images.map((img) => (
                    <option key={img} value={img}>
                      {img}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={f.name}
                  type={f.type}
                  className="input"
                  defaultValue={asText(value) || (f.name === "focus" ? "50% 50%" : f.name === "sortOrder" ? "0" : "")}
                />
              )}
              {f.hint && !err[f.name] && <p className={styles.hint}>{f.hint}</p>}
              {err[f.name] && <p className="field-error">{err[f.name]}</p>}
            </div>
          );
        })}

        <div className={styles.formActions}>
          <button className="btn btn--small btn--solid" disabled={pending}>
            {pending ? "Збереження…" : values?.id ? "Зберегти" : "Створити"}
          </button>
          {(state.message || err.form) && (
            <span className="form-message" data-ok={Boolean(state.ok)} role="status">
              {state.message ?? err.form}
            </span>
          )}
        </div>
      </form>

      {values?.id && (
        <form
          action={deleteEntityAction}
          className={styles.deleteForm}
          onSubmit={(e) => {
            if (!confirm("Видалити цей запис назавжди?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="entity" value={entity} />
          <input type="hidden" name="id" value={values.id} />
          <button className={styles.delete}>Видалити</button>
        </form>
      )}
    </div>
  );
}
