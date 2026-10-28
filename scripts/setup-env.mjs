// Creates .env from .env.example with freshly generated secrets. Never overwrites an existing .env.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env")) {
  console.log(".env already exists — leaving it untouched.");
  process.exit(0);
}

const secret = (bytes) => randomBytes(bytes).toString("base64url");
const env = readFileSync(".env.example", "utf8")
  .replace("__PG_PASSWORD__", secret(18))
  .replace("__ADMIN_PASSWORD__", secret(12))
  .replace("__ACTIONS_KEY__", randomBytes(32).toString("base64"));

writeFileSync(".env", env, { mode: 0o600 });
const admin = env.match(/^ADMIN_EMAIL="(.*)"$/m)?.[1];
const pass = env.match(/^ADMIN_PASSWORD="(.*)"$/m)?.[1];
console.log(`.env created. Admin login: ${admin} / ${pass}`);
