import { NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "mail",
  "ftp",
  "localhost",
  "demo",
  "editor",
  "tools",
  "signup",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  // Handle localhost subdomains (e.g., slug.localhost:3000)
  if (hostname.endsWith(".localhost") || hostname.endsWith(".127.0.0.1") || hostname === "localhost" || hostname === "127.0.0.1") {
    const hostParts = hostname.split(".");
    if (hostParts.length >= 2 && hostParts[0] !== "localhost" && hostParts[0] !== "127") {
      const subdomain = hostParts[0];
      if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
        const url = request.nextUrl.clone();
        url.pathname = `/invite/${subdomain}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  // Generic subdomain detection: if hostname has more than 2 parts,
  // the first part is a subdomain (e.g., slug.instavow.com → slug)
  const parts = hostname.split(".");
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      const url = request.nextUrl.clone();
      url.pathname = `/invite/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /_next/ (Next.js internals)
     * - /api/ (API routes)
     * - /_vercel (Vercel internals)
     * - Static files (favicon, images, etc.)
     */
    "/((?!_next/|api/|_vercel|.*\\..*).*)",
  ],
};
