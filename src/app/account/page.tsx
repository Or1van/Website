import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import styles from "../pages.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).t.meta.account };
}

export default async function AccountPage() {
  const user = await requireUser("/account");
  const { locale, t } = await getDictionary();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      totalCents: true,
      currency: true,
      createdAt: true,
      items: { select: { id: true, name: true, quantity: true, edition: { select: { nameEn: true } } } },
    },
  });

  return (
    <main className="page">
      <div className="container">
        <p className="eyebrow">{t.account.eyebrow}</p>
        <h1 className="page-title">{user.name}</h1>
        <div className={styles.accountBar}>
          <span className={styles.muted}>{user.email}</span>
          {user.role === "ADMIN" && (
            <Link href="/admin" className="btn btn--small btn--gold">
              {t.account.adminPanel}
            </Link>
          )}
          <form action={logoutAction}>
            <button className="btn btn--small">{t.account.logout}</button>
          </form>
        </div>

        <h2 className={styles.sectionTitle}>{t.account.orders}</h2>
        {orders.length === 0 ? (
          <p className={styles.muted}>
            {t.account.noOrders} <Link href="/#editions">{t.account.pickEdition}</Link>
          </p>
        ) : (
          <ul className={styles.orders}>
            {orders.map((o) => (
              <li key={o.id} className={styles.order}>
                <div>
                  <p className={styles.orderId}>
                    {t.common.no} {o.id.slice(-8).toUpperCase()}
                  </p>
                  <p className={styles.muted}>{formatDate(o.createdAt, locale)}</p>
                </div>
                <p>
                  {o.items
                    .map((i) => `${(locale === "en" && i.edition?.nameEn) || i.name} × ${i.quantity}`)
                    .join(", ")}
                </p>
                <p className={styles.status} data-status={o.status}>
                  {t.account[`status${o.status}`]}
                </p>
                <p className={styles.lineTotal}>{formatPrice(o.totalCents, o.currency, locale)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
