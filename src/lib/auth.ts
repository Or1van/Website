import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "./session";

// Data Access Layer: every page, Server Action and Route Handler that touches user data
// goes through these helpers instead of trusting what the UI rendered.

export const getCurrentUser = getSessionUser;

export async function requireUser(next = "/") {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Non-admins get a 404 so the admin area does not advertise itself. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") notFound();
  return user;
}
