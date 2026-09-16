import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

// Portal surfaces: the sign-in page, the recovery/MFA flow, and the portal itself.
const PORTAL_PATH = /^\/(?:portal|login|auth)(?:\/|$)/;

// Host separation is enforced only when BOTH hosts are configured (production).
// Locally these are unset, so a single origin (127.0.0.1) serves everything.
const SITE_HOST = process.env.SITE_HOST?.toLowerCase();
const PORTAL_HOST = process.env.PORTAL_HOST?.toLowerCase();
const splitEnabled = Boolean(SITE_HOST && PORTAL_HOST);

function hostname(request: NextRequest): string {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPortalPath = PORTAL_PATH.test(pathname);

  if (splitEnabled) {
    const host = hostname(request);
    // The public apex must never serve portal routes; send them to the portal host.
    if (host === SITE_HOST && isPortalPath) {
      return NextResponse.redirect(`https://${PORTAL_HOST}${pathname}${search}`);
    }
    // The portal host serves only portal routes; anything else goes to sign-in.
    if (host === PORTAL_HOST && !isPortalPath) {
      return NextResponse.redirect(`https://${PORTAL_HOST}/login`);
    }
  }

  // Public routes need no Supabase session refresh and stay cacheable/indexable.
  if (!isPortalPath) return NextResponse.next();

  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Refresh cookies here; authorization is enforced again at the data boundary.
  // On failure, protected pages fail closed through requireEmployee().
  try { await supabase.auth.getClaims(); } catch { /* Service temporarily unavailable. */ }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Run on all routes except static assets, so host routing can also cover the
  // public site. Portal session logic stays gated to portal paths above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)"],
};
