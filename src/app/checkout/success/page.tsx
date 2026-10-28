import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { idSchema } from "@/lib/validation";
import styles from "../../pages.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).t.meta.success };
}

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const user = await requireUser("/account");
  const { locale, t } = await getDictionary();
  const id = idSchema.safeParse((await searchParams).order);
  if (!id.success) notFound();

  // Scoped to the signed-in user: someone else's order id is just a 404.
  const order = await db.order.findFirst({
    where: { id: id.data, userId: user.id },
    select: { id: true, status: true, totalCents: true, currency: true, items: { select: { id: true, name: true, quantity: true, edition: { select: { nameEn: true } } } } },
  });
  if (!order) notFound();

  return (
    <main className="page">
      <div className={`container ${styles.success}`}>
        <p className="eyebrow">{fmt(t.success.eyebrow, { id: order.id.slice(-8).toUpperCase() })}</p>
        <h1 className="page-title">{order.status === "PAID" ? t.success.paidTitle : t.success.pendingTitle}</h1>
        <p className={styles.lead}>
          {order.status === "PAID" ? t.success.paidLead : t.success.pendingLead}
        </p>
        <ul className={styles.successList}>
          {order.items.map((i) => (
            <li key={i.id}>
              {(locale === "en" && i.edition?.nameEn) || i.name} × {i.quantity}
            </li>
          ))}
        </ul>
        <p className={styles.total}>{formatPrice(order.totalCents, order.currency, locale)}</p>
        <div className={styles.row}>
          <Link href="/account" className="btn btn--gold">
            {t.success.myOrders}
          </Link>
          <Link href="/" className="btn">
            {t.success.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
