import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SIGN_UP_PATH_PREFIXES = ["/handler/sign-up", "/handler/sign-up/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SIGN_UP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = "/handler/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/handler/:path*"],
};
