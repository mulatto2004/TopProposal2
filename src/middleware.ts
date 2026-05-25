import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are always public (no auth needed)
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/q/",           // Client-facing quote viewer
  "/_next",
  "/favicon.ico",
  "/api/stripe/webhook", // Stripe webhook must be public
];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Allow public routes through
  if (isPublic) return NextResponse.next();

  // If not authenticated, redirect to sign-in
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated but onboarding not done, redirect to onboarding
  // (except if already heading there)
  const session = req.auth as { user?: { onboardingDone?: boolean } };
  if (
    session?.user &&
    !session.user.onboardingDone &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
