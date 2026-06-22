import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { validateRegistry } from '@/lib/backgroundRegistry';

export async function middleware(request) {
  // 1. Run Background Image Registry validation in development
  if (process.env.NODE_ENV === 'development') {
    try {
      validateRegistry();
    } catch (e) {
      console.error('Background Registry Validation Error:', e.message);
    }
  }

  // 2. Initialize response and server client
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const path = url.pathname;

  // Protect /studio/* and /dashboard routes
  if (path.startsWith('/studio') || path === '/dashboard') {
    if (!user) {
      const redirectUrl = new URL('/auth', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users trying to access /auth routes
  if (path.startsWith('/auth')) {
    if (user) {
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (background_images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|background_images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
