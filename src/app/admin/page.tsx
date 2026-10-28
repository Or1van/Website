import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { EntityForm, type Field } from "@/components/admin/EntityForm";
import styles from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Адмін-панель", robots: { index: false, follow: false } };

const common = {
  slug: { name: "slug", label: "Slug", type: "text", hint: "латиниця, цифри, дефіс" },
  image: { name: "image", label: "Зображення", type: "image" },
  focus: { name: "focus", label: "Фокус кадру", type: "text", hint: "напр. 50% 30% (x y)" },
  sortOrder: { name: "sortOrder", label: "Порядок", type: "number" },
  published: { name: "published", label: "Опубліковано", type: "checkbox" },
} satisfies Record<string, Field>;

const FIELDS: Record<"character" | "edition" | "location" | "trailer", Field[]> = {
  character: [
    common.slug,
    { name: "name", label: "Ім'я", type: "text" },
    { name: "title", label: "Роль", type: "text" },
    { name: "bio", label: "Біографія", type: "textarea" },
    { name: "quote", label: "Цитата", type: "textarea" },
    { name: "nameEn", label: "Name (EN)", type: "text" },
    { name: "titleEn", label: "Role (EN)", type: "text" },
    { name: "bioEn", label: "Biography (EN)", type: "textarea" },
    { name: "quoteEn", label: "Quote (EN)", type: "textarea" },
    common.image,
    common.focus,
    common.sortOrder,
    common.published,
  ],
  edition: [
    common.slug,
    { name: "name", label: "Назва", type: "text" },
    { name: "tagline", label: "Підзаголовок", type: "text" },
    { name: "priceCents", label: "Ціна (центи)", type: "number", hint: "4900 = $49.00" },
    { name: "features", label: "Що входить (по рядку)", type: "lines" },
    { name: "nameEn", label: "Name (EN)", type: "text" },
    { name: "taglineEn", label: "Tagline (EN)", type: "text" },
    { name: "featuresEn", label: "Features (EN, one per line)", type: "lines" },
    common.image,
    common.focus,
    common.sortOrder,
    { name: "active", label: "У продажу", type: "checkbox" },
  ],
  location: [
    common.slug,
    { name: "name", label: "Назва", type: "text" },
    { name: "kind", label: "Тип", type: "text" },
    { name: "description", label: "Опис", type: "textarea" },
    { name: "nameEn", label: "Name (EN)", type: "text" },
    { name: "kindEn", label: "Type (EN)", type: "text" },
    { name: "descriptionEn", label: "Description (EN)", type: "textarea" },
    common.image,
    common.focus,
    common.sortOrder,
    common.published,
  ],
  trailer: [
    { name: "title", label: "Назва", type: "text" },
    { name: "description", label: "Опис", type: "textarea" },
    { name: "titleEn", label: "Title (EN)", type: "text" },
    { name: "descriptionEn", label: "Description (EN)", type: "textarea" },
    common.image,
    { name: "youtubeId", label: "YouTube ID", type: "text", hint: "11 символів після watch?v= · порожньо = «незабаром»" },
    common.sortOrder,
    common.published,
  ],
};

const TABS = [
  { key: "characters", label: "Персонажі" },
  { key: "editions", label: "Видання" },
  { key: "locations", label: "Локації" },
  { key: "trailers", label: "Трейлери" },
  { key: "orders", label: "Замовлення" },
  { key: "subscribers", label: "Підписники" },
] as const;
type Tab = (typeof TABS)[number]["key"];

async function listImages() {
  const files = await readdir(join(process.cwd(), "public", "images"));
  return files.filter((f) => /^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/.test(f)).map((f) => `/images/${f}`);
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const requested = (await searchParams).tab;
  const tab: Tab = TABS.some((t) => t.key === requested) ? (requested as Tab) : "characters";

  return (
    <main className="page">
      <div className="container">
        <p className="eyebrow">Вітаємо, {admin.name}</p>
        <p className={styles.empty}>Поля з позначкою (EN) — англійська версія сайту. Порожнє поле = показується український текст.</p>
        <h1 className="page-title">Адмін-панель</h1>

        <nav className={styles.tabs} aria-label="Розділи">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin?tab=${t.key}`} aria-current={t.key === tab ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "orders" ? <Orders /> : tab === "subscribers" ? <Subscribers /> : <Content tab={tab} />}
      </div>
    </main>
  );
}

async function Content({ tab }: { tab: "characters" | "editions" | "locations" | "trailers" }) {
  const images = await listImages();
  const orderBy = { sortOrder: "asc" } as const;
  const [entity, rows, titleKey]: [keyof typeof FIELDS, Record<string, unknown>[], string] =
    tab === "characters"
      ? ["character", await db.character.findMany({ orderBy }), "name"]
      : tab === "editions"
        ? ["edition", await db.edition.findMany({ orderBy }), "name"]
        : tab === "locations"
          ? ["location", await db.location.findMany({ orderBy }), "name"]
          : ["trailer", await db.trailer.findMany({ orderBy }), "title"];

  return (
    <div className={styles.list}>
      {rows.map((row) => (
        <details key={String(row.id)} className={styles.item}>
          <summary>
            <span>{String(row[titleKey])}</span>
            {(row.published === false || row.active === false) && <em>приховано</em>}
          </summary>
          <EntityForm entity={entity} fields={FIELDS[entity]} values={row as Record<string, unknown> & { id: string }} images={images} />
        </details>
      ))}
      <details className={`${styles.item} ${styles.new}`}>
        <summary>
          <span>+ Додати запис</span>
        </summary>
        <EntityForm entity={entity} fields={FIELDS[entity]} images={images} />
      </details>
    </div>
  );
}

async function Orders() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      totalCents: true,
      currency: true,
      createdAt: true,
      user: { select: { email: true } },
      items: { select: { id: true, name: true, quantity: true } },
    },
  });
  if (orders.length === 0) return <p className={styles.empty}>Замовлень ще немає.</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>№</th>
            <th>Дата</th>
            <th>Покупець</th>
            <th>Склад</th>
            <th>Статус</th>
            <th>Сума</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id.slice(-8).toUpperCase()}</td>
              <td>{formatDate(o.createdAt)}</td>
              <td>{o.user.email}</td>
              <td>{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</td>
              <td data-status={o.status}>{o.status}</td>
              <td>{formatPrice(o.totalCents, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Subscribers() {
  const [count, subscribers] = await Promise.all([
    db.subscriber.count(),
    db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return (
    <div>
      <p className={styles.empty}>Усього підписників: {count}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
