import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Null when STRIPE_SECRET_KEY is unset — checkout then runs in demo mode. */
export function getStripe() {
  if (client === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    client = key ? new Stripe(key) : null;
  }
  return client;
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
