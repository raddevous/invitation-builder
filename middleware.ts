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

const CAPACITOR_ORIGINS = new Set([
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
]);

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  // Handle CORS for API routes called from the Capacitor native app
  if (request.nextUrl.pathname.startsWith("/api/") && CAPACITOR_ORIGINS.has(origin)) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  // Skip subdomain rewrite for API routes — they should always hit /api/...
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

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
     * - /_vercel (Vercel internals)
     * - Static files (favicon, images, etc.)
     */
    "/((?!_next/|_vercel|.*\\..*).*)",
  ],
};
