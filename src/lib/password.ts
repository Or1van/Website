import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Argon2id with OWASP's recommended minimum (19 MiB, 2 iterations).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

// Verified against when the email is unknown, so a login attempt costs the same either way
// and response time does not reveal which emails are registered.
let dummyHash: Promise<string> | undefined;

export async function verifyPassword(storedHash: string | null, password: string) {
  if (!storedHash) {
    dummyHash ??= hash("not-a-real-password", OPTIONS);
    await verify(await dummyHash, password);
    return false;
  }
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
