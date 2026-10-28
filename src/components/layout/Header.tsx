import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const user = await getCurrentUser();
  const cartCount = user
    ? ((await db.cartItem.aggregate({ where: { userId: user.id }, _sum: { quantity: true } }))._sum.quantity ?? 0)
    : 0;

  return (
    <HeaderClient
      user={user ? { name: user.name, isAdmin: user.role === "ADMIN" } : null}
      cartCount={cartCount}
    />
  );
}
