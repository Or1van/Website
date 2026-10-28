// Local development PostgreSQL, using the real Postgres binaries that ship in the
// @embedded-postgres/<platform> npm package. Production should point DATABASE_URL at a
// managed Postgres (Neon, Supabase, RDS…) instead.
//
// Binaries and data are copied to / kept in a plain-ASCII folder outside the project:
// initdb fails on non-ASCII install paths (e.g. Cyrillic folder names), and cloud-sync tools lock
// files while Postgres writes to them.
import "dotenv/config";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import os from "node:os";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  console.error("DATABASE_URL does not point at localhost; refusing to start a local server.");
  process.exit(1);
}
const port = url.port || "5432";
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const database = url.pathname.slice(1);

const platformPkg = {
  win32: "@embedded-postgres/windows-x64",
  darwin: os.arch() === "arm64" ? "@embedded-postgres/darwin-arm64" : "@embedded-postgres/darwin-x64",
  linux: os.arch() === "arm64" ? "@embedded-postgres/linux-arm64" : "@embedded-postgres/linux-x64",
}[process.platform];
// The package entry is <pkg>/dist/index.js; binaries live in <pkg>/native.
const nativeSrc = join(dirname(fileURLToPath(import.meta.resolve(platformPkg))), "..", "native");

const home = process.env.PG_HOME ?? join(process.env.LOCALAPPDATA ?? join(os.homedir(), ".local", "share"), "hollowmere");
const binRoot = join(home, "pg");
const dataDir = join(home, "pgdata");
const logFile = join(home, "postgres.log");
const exe = (name) => join(binRoot, "bin", process.platform === "win32" ? `${name}.exe` : name);

if (!existsSync(exe("pg_ctl"))) {
  console.log(`Copying Postgres binaries to ${binRoot}`);
  cpSync(nativeSrc, binRoot, { recursive: true });
}

const fresh = !existsSync(join(dataDir, "PG_VERSION"));
if (fresh) {
  console.log(`Initialising new cluster in ${dataDir}`);
  const tmp = mkdtempSync(join(os.tmpdir(), "hm-pg-"));
  const pwfile = join(tmp, "pw");
  writeFileSync(pwfile, password, { mode: 0o600 });
  try {
    execFileSync(exe("initdb"), [
      "-D", dataDir, "-U", user, `--pwfile=${pwfile}`,
      "--auth=scram-sha-256", "--encoding=UTF8", "--no-locale",
    ], { stdio: "inherit" });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const start = spawnSync(exe("pg_ctl"), [
  "start", "-w", "-D", dataDir, "-l", logFile,
  "-o", `-p ${port} -c listen_addresses=127.0.0.1`,
], { stdio: "inherit" });
if (start.status !== 0) {
  console.error(`pg_ctl start failed — see ${logFile}`);
  process.exit(1);
}

if (fresh) {
  const client = new pg.Client({ host: "127.0.0.1", port: Number(port), user, password, database: "postgres" });
  await client.connect();
  await client.query(`CREATE DATABASE "${database.replace(/"/g, "")}"`);
  await client.end();
}

console.log(`PostgreSQL ready on 127.0.0.1:${port}/${database}  (Ctrl+C to stop)`);

let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  spawnSync(exe("pg_ctl"), ["stop", "-D", dataDir, "-m", "fast"], { stdio: "inherit" });
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
setInterval(() => {}, 1 << 30);
