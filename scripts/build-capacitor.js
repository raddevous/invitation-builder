/**
 * Builds a static export of the Next.js app for bundling into the Capacitor
 * native app (Android/iOS), to be used as a local offline fallback.
 *
 * Next.js `output: 'export'` cannot include:
 *  - Dynamic API routes (app/api/**) that use server-only logic (firebase-admin, jsonwebtoken, cookies)
 *  - Dynamic per-user routes (app/invite/[slug]) since arbitrary customer slugs can't be enumerated
 *
 * app/tools/[slug] is patched (not excluded) with generateStaticParams so its JS chunk
 * (including ToolsTab and all editor components) is bundled into the static export.
 *
 * This script temporarily moves API routes and invite/[slug] out of `app/`, patches
 * tools/[slug]/page.tsx, then runs `next build` with CAPACITOR_BUILD=true, and
 * restores everything afterwards.
 *
 * Usage: npm run build:capacitor
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

const moves = [
  { from: path.join(root, "app", "api"), to: path.join(root, "app", "_api.excluded") },
  { from: path.join(root, "app", "invite", "[slug]"), to: path.join(root, "app", "invite", "_slug.excluded") },
];

const toolsSlugDir = path.join(root, "app", "tools", "[slug]");
const toolsSlugLayout = path.join(toolsSlugDir, "layout.tsx");

function moveOut() {
  for (const m of moves) {
    if (fs.existsSync(m.from)) {
      fs.renameSync(m.from, m.to);
      console.log(`[build-capacitor] Excluded: ${path.relative(root, m.from)}`);
    }
  }
}

function patchToolsSlug() {
  if (fs.existsSync(toolsSlugDir)) {
    if (!fs.existsSync(toolsSlugLayout)) {
      fs.writeFileSync(toolsSlugLayout, "export function generateStaticParams() { return [{ slug: 'offline' }]; }\nexport const dynamic = 'force-static';\nexport default function Layout({ children }: { children: React.ReactNode }) { return children; }\n");
      console.log(`[build-capacitor] Created: ${path.relative(root, toolsSlugLayout)}`);
    }
  }
}

function unpatchToolsSlug() {
  if (fs.existsSync(toolsSlugLayout)) {
    fs.unlinkSync(toolsSlugLayout);
    console.log(`[build-capacitor] Removed: ${path.relative(root, toolsSlugLayout)}`);
  }
}

let buildFailed = false;

try {
  moveOut();
  patchToolsSlug();
  execSync("next build", {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, CAPACITOR_BUILD: "true" },
  });
} catch (err) {
  buildFailed = true;
  console.error("[build-capacitor] Build failed:", err.message);
} finally {
  for (const m of moves) {
    if (fs.existsSync(m.to)) {
      fs.renameSync(m.to, m.from);
      console.log(`[build-capacitor] Restored: ${path.relative(root, m.from)}`);
    }
  }
  unpatchToolsSlug();
}

if (buildFailed) {
  process.exit(1);
}

console.log("[build-capacitor] Static export ready in ./out — run `npx cap sync android` next.");
