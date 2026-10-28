"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SoundToggle } from "@/components/fx/SoundToggle";
import { fmt } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/client";
import { LangSwitch } from "./LangSwitch";
import styles from "./header.module.css";

type Props = {
  user: { name: string; isAdmin: boolean } | null;
  cartCount: number;
};

export function HeaderClient({ user, cartCount }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
  const NAV = [
    { href: "/#top", label: t.nav.home },
    { href: "/#characters", label: t.nav.characters },
    { href: "/#editions", label: t.nav.editions },
    { href: "/#locations", label: t.nav.locations },
    { href: "/#trailers", label: t.nav.trailers },
  ];
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 400 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onNavigate = () => setOpen(false);
    window.addEventListener("hm:navigate", onNavigate);
    return () => window.removeEventListener("hm:navigate", onNavigate);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled || pathname !== "/"}
      data-hidden={hidden && !open}
      data-open={open}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label={t.brand.home} onClick={close}>
          <span className={styles.logoMark}>HOLLOWMERE</span>
          <span className={styles.logoSub}>{t.brand.subtitle}</span>
        </Link>

        <nav className={styles.nav} aria-label={t.nav.main}>
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink} onClick={close}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <LangSwitch className={styles.langDesktop} />
          <SoundToggle />
          <Link href="/cart" className={styles.iconLink} aria-label={fmt(t.nav.cart, { n: cartCount })} onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
          {user ? (
            <Link href={user.isAdmin ? "/admin" : "/account"} className={styles.account} onClick={close}>
              {user.isAdmin ? t.nav.admin : user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/login" className={styles.account} onClick={close}>
              {t.nav.login}
            </Link>
          )}
          <button
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className={styles.mobile} hidden={!open}>
        <nav aria-label={t.nav.mobile}>
          {NAV.map((item, i) => (
            <a key={item.href} href={item.href} onClick={close} style={{ animationDelay: `${80 + i * 50}ms` }}>
              <span>0{i + 1}</span>
              {item.label}
            </a>
          ))}
          {user && (
            <Link href="/account" onClick={close} style={{ animationDelay: "380ms" }}>
              <span>06</span>
              {t.nav.account}
            </Link>
          )}
        </nav>
        <LangSwitch className={styles.langMobile} />
      </div>
    </header>
  );
}
