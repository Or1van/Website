import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { checkoutAction } from "@/app/actions/checkout";
import { updateCartItemAction } from "@/app/actions/cart";
import { localize } from "@/i18n/content";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import styles from "../pages.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).t.meta.cart };
}

export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const user = await requireUser("/cart");
  const params = await searchParams;
  const { locale, t } = await getDictionary();
  const notices: Record<string, string> = { rate: t.cart.noticeRate, stripe: t.cart.noticeStripe };
  const notice = params.cancelled ? t.cart.noticeCancelled : typeof params.error === "string" ? notices[params.error] : undefined;

  const rows = await db.cartItem.findMany({
    where: { userId: user.id, edition: { active: true } },
    orderBy: { edition: { sortOrder: "asc" } },
    select: {
      id: true,
      quantity: true,
      edition: {
        select: {
          name: true,
          tagline: true,
          nameEn: true,
          taglineEn: true,
          priceCents: true,
          currency: true,
          image: true,
          focus: true,
        },
      },
    },
  });
  const items = rows.map((r) => ({ ...r, edition: localize(r.edition, locale, ["name", "tagline"]) }));
  const currency = items[0]?.edition.currency ?? "usd";
  const total = items.reduce((sum, i) => sum + i.edition.priceCents * i.quantity, 0);
  const demo = !process.env.STRIPE_SECRET_KEY;

  return (
    <main className="page">
      <div className="container">
        <p className="eyebrow">{t.cart.eyebrow}</p>
        <h1 className="page-title">{t.cart.title}</h1>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>{t.cart.empty}</p>
            <Link href="/#editions" className="btn btn--gold">
              {t.cart.toEditions}
            </Link>
          </div>
        ) : (
          <div className={styles.cart}>
            <ul className={styles.items}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.thumb}>
                    <Image src={item.edition.image} alt="" fill sizes="120px" style={{ objectFit: "cover", objectPosition: item.edition.focus }} />
                  </div>
                  <div>
                    <h2 className={styles.itemName}>{item.edition.name}</h2>
                    <p className={styles.muted}>{item.edition.tagline}</p>
                    <p className={styles.muted}>
                      {fmt(t.cart.perCopy, { price: formatPrice(item.edition.priceCents, item.edition.currency, locale) })}
                    </p>
                  </div>
                  <form action={updateCartItemAction} className={styles.qty}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button name="quantity" value={item.quantity - 1} aria-label={t.cart.decrease}>
                      −
                    </button>
                    <span aria-label={t.cart.quantity}>{item.quantity}</span>
                    <button name="quantity" value={item.quantity + 1} disabled={item.quantity >= 5} aria-label={t.cart.increase}>
                      +
                    </button>
                  </form>
                  <p className={styles.lineTotal}>{formatPrice(item.edition.priceCents * item.quantity, item.edition.currency, locale)}</p>
                  <form action={updateCartItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button name="quantity" value="0" className={styles.remove}>
                      {t.cart.remove}
                    </button>
                  </form>
                </li>
              ))}
            </ul>

            <aside className={styles.summary}>
              <p className="eyebrow">{t.cart.total}</p>
              <p className={styles.total}>{formatPrice(total, currency, locale)}</p>
              <form action={checkoutAction}>
                <button className="btn btn--solid" style={{ width: "100%" }}>
                  {t.cart.checkout}
                </button>
              </form>
              <p className={styles.muted}>
                {demo ? t.cart.demo : t.cart.stripe}
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
