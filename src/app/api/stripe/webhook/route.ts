import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Stripe calls this endpoint directly; authenticity comes from the signature,
// verified against the raw request body.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Stripe is not configured", { status: 404 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const order = await db.order.findUnique({
        where: { stripeSessionId: session.id },
        select: { id: true, userId: true, status: true, totalCents: true },
      });
      // Only settle when Stripe charged what we asked for.
      if (order && order.status === "PENDING" && session.amount_total === order.totalCents) {
        await db.$transaction([
          db.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
          db.cartItem.deleteMany({ where: { userId: order.userId } }),
        ]);
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    await db.order.updateMany({
      where: { stripeSessionId: event.data.object.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  return Response.json({ received: true });
}
