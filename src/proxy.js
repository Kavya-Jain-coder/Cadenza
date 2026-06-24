import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function proxy(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const url = new URL(request.url);
  const path = url.pathname;

  // Protect /studio/* and /dashboard routes
  if (path.startsWith('/studio') || path === '/dashboard') {
    if (!token) {
      const redirectUrl = new URL('/auth', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users trying to access /auth routes
  if (path.startsWith('/auth')) {
    if (token) {
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth.js routes — must not be intercepted)
     * - public files (background_images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|background_images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
