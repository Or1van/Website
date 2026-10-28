"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";
import { isAmbientOn, setAmbient, subscribeAmbient } from "@/lib/ambient";
import styles from "./fx.module.css";

export function SoundToggle() {
  const on = useSyncExternalStore(subscribeAmbient, isAmbientOn, () => false);
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={styles.sound}
      aria-pressed={on}
      aria-label={on ? t.sound.off : t.sound.on}
      title={on ? t.sound.offShort : t.sound.onShort}
      data-on={on}
      onClick={() => setAmbient(!on)}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ animationDelay: `${i * -0.27}s` }} />
      ))}
    </button>
  );
}
