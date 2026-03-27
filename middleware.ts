import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SIGN_UP_PATH_PREFIXES = ["/handler/sign-up", "/handler/sign-up/"];

function withNoStore(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SIGN_UP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = "/handler/sign-in";
    return withNoStore(NextResponse.redirect(url));
  }

  return withNoStore(NextResponse.next());
}

export const config = {
  matcher: ["/handler/:path*"],
};
