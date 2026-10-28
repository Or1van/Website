import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hm_session";
const PROTECTED = ["/account", "/cart", "/admin", "/checkout"];

function contentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React style props and GSAP write inline styles; a style-src nonce would disable
    // 'unsafe-inline', so styles stay on 'self' + inline. Scripts remain nonce-only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-src https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    // Checkout redirects the submitted form to Stripe.
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Optimistic gate only (cookie presence). Pages and actions re-check the session in the DB.
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!request.cookies.has(SESSION_COOKIE)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + search);
      return NextResponse.redirect(login);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
