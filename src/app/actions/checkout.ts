"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { appUrl, getStripe } from "@/lib/stripe";

export async function checkoutAction() {
  const user = await requireUser("/cart");

  const limit = await rateLimit(`checkout:user:${user.id}`, 10, 10 * 60_000);
  const ipLimit = await rateLimit(`checkout:ip:${await clientIp()}`, 30, 10 * 60_000);
  if (!limit.ok || !ipLimit.ok) redirect("/cart?error=rate");

  // Prices always come from the database, never from the client.
  const items = await db.cartItem.findMany({
    where: { userId: user.id, edition: { active: true } },
    select: {
      quantity: true,
      edition: { select: { id: true, name: true, nameEn: true, priceCents: true, currency: true } },
    },
  });
  if (items.length === 0) redirect("/cart");

  const currency = items[0].edition.currency;
  const totalCents = items.reduce((sum, i) => sum + i.edition.priceCents * i.quantity, 0);

  const order = await db.order.create({
    data: {
      userId: user.id,
      totalCents,
      currency,
      items: {
        create: items.map((i) => ({
          editionId: i.edition.id,
          name: i.edition.name,
          unitCents: i.edition.priceCents,
          quantity: i.quantity,
        })),
      },
    },
    select: { id: true },
  });

  const stripe = getStripe();
  if (!stripe) {
    // Demo mode: no payment provider configured.
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
      db.cartItem.deleteMany({ where: { userId: user.id } }),
    ]);
    // The header's cart badge lives in the layout, which survives the redirect.
    revalidatePath("/", "layout");
    redirect(`/checkout/success?order=${order.id}`);
  }

  const { locale } = await getDictionary();
  const session = await stripe.checkout.sessions.create({
    locale: locale === "en" ? "en" : "auto",
    mode: "payment",
    customer_email: user.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, userId: user.id },
    line_items: items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency,
        unit_amount: i.edition.priceCents,
        product_data: { name: `Hollowmere — ${(locale === "en" && i.edition.nameEn) || i.edition.name}` },
      },
    })),
    success_url: `${appUrl()}/checkout/success?order=${order.id}`,
    cancel_url: `${appUrl()}/cart?cancelled=1`,
  });

  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  if (!session.url) redirect("/cart?error=stripe");
  redirect(session.url);
}
