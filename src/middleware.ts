import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() verifies the JWT's cryptographic signature (never trusts the
  // cookie blindly, unlike getSession()). When this project's access tokens
  // are signed with an asymmetric key (ES256/RS256 — see Settings > Auth > JWT
  // Signing Keys in the Supabase dashboard), verification happens locally
  // against a cached JWKS, avoiding the network round trip to the Auth server
  // that getUser() always makes. If the project is still on the legacy HS256
  // shared secret, this automatically falls back to the same network call
  // getUser() makes, so there's no regression either way.
  // Trade-off (per Supabase's own docs): unlike getUser(), this does NOT ask
  // the Auth server whether the session was revoked server-side (logout on
  // another device, ban, etc.) — it only checks signature + expiry. A revoked
  // session stays valid here until the access token's natural expiry
  // (default 1h). Acceptable for this app; revisit if that changes.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

  const isPublicPath =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.sub)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|manifest\\.json).*)"],
};
