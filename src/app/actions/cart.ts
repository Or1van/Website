"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { idSchema } from "@/lib/validation";

const MAX_QTY = 5;

export type CartState = { ok?: boolean; message?: string; needsLogin?: boolean };

export async function addToCartAction(_prev: CartState, formData: FormData): Promise<CartState> {
  const user = await getCurrentUser();
  if (!user) return { needsLogin: true };
  const { locale, t } = await getDictionary();

  const editionId = idSchema.safeParse(formData.get("editionId"));
  if (!editionId.success) return { message: t.errors.unknownEdition };

  const edition = await db.edition.findFirst({
    where: { id: editionId.data, active: true },
    select: { id: true, name: true, nameEn: true },
  });
  if (!edition) return { message: t.errors.editionUnavailable };

  const existing = await db.cartItem.findUnique({
    where: { userId_editionId: { userId: user.id, editionId: edition.id } },
    select: { quantity: true },
  });
  if (existing && existing.quantity >= MAX_QTY) {
    return { message: fmt(t.errors.maxQty, { n: MAX_QTY }) };
  }

  await db.cartItem.upsert({
    where: { userId_editionId: { userId: user.id, editionId: edition.id } },
    create: { userId: user.id, editionId: edition.id, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });
  revalidatePath("/", "layout");
  const name = locale === "en" && edition.nameEn ? edition.nameEn : edition.name;
  return { ok: true, message: fmt(t.errors.added, { name }) };
}

const quantitySchema = z.object({
  itemId: idSchema,
  quantity: z.coerce.number().int().min(0).max(MAX_QTY),
});

export async function updateCartItemAction(formData: FormData) {
  const user = await requireUser("/cart");
  const parsed = quantitySchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;

  const { itemId, quantity } = parsed.data;
  // Scoping by userId makes another user's item id a no-op.
  if (quantity === 0) {
    await db.cartItem.deleteMany({ where: { id: itemId, userId: user.id } });
  } else {
    await db.cartItem.updateMany({ where: { id: itemId, userId: user.id }, data: { quantity } });
  }
  revalidatePath("/", "layout");
}
