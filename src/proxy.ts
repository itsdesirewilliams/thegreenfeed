import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/admin/session";

/**
 * Edge guard for the admin area.
 *
 * Cache Components/PPR renders the admin pages as a streamed shell, so a
 * `redirect()` inside the page is not enough on its own: the unauthenticated
 * request still receives a 200 whose body contains the rendered admin data, and
 * (in production) that response can be cached and served to everyone. This
 * proxy runs before any admin route renders and rejects unauthenticated
 * requests outright, and it marks authenticated admin responses `no-store` so
 * they are never placed in a shared cache.
 */
const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Cache-Control", "private, no-store, max-age=0");
    return redirect;
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
