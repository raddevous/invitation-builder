/**
 * Builds a static export of the Next.js app for bundling into the Capacitor
 * native app (Android/iOS), to be used as a local offline fallback.
 *
 * Next.js `output: 'export'` cannot include:
 *  - Dynamic API routes (app/api/**) that use server-only logic (firebase-admin, jsonwebtoken, cookies)
 *  - Dynamic per-user routes (app/tools/[slug], app/invite/[slug]) since arbitrary
 *    customer slugs can't be enumerated at build time
 *
 * This script temporarily moves those routes out of `app/` before running
 * `next build` with CAPACITOR_BUILD=true, then restores them afterwards so the
 * normal web deployment (with API routes + dynamic slugs) is unaffected.
 *
 * Usage: npm run build:capacitor
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

const moves = [
  { from: path.join(root, "app", "api"), to: path.join(root, "app", "_api.excluded") },
  { from: path.join(root, "app", "tools", "[slug]"), to: path.join(root, "app", "tools", "_slug.excluded") },
  { from: path.join(root, "app", "invite", "[slug]"), to: path.join(root, "app", "invite", "_slug.excluded") },
];

function moveOut() {
  for (const m of moves) {
    if (fs.existsSync(m.from)) {
      fs.renameSync(m.from, m.to);
      console.log(`[build-capacitor] Excluded: ${path.relative(root, m.from)}`);
    }
  }
}

function restore() {
  for (const m of moves) {
    if (fs.existsSync(m.to)) {
      fs.renameSync(m.to, m.from);
      console.log(`[build-capacitor] Restored: ${path.relative(root, m.from)}`);
    }
  }
}

let buildFailed = false;

try {
  moveOut();
  execSync("next build", {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, CAPACITOR_BUILD: "true" },
  });
} catch (err) {
  buildFailed = true;
  console.error("[build-capacitor] Build failed:", err.message);
} finally {
  restore();
}

if (buildFailed) {
  process.exit(1);
}

console.log("[build-capacitor] Static export ready in ./out — run `npx cap sync android` next.");
