import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define auth pages (pages that require no authentication)
const AUTH_PAGES = ['/login', '/signup'];
const AUTH_PATHS = ['/auth/'];
const AUTH_CALLBACK = '/auth/callback';

// Define protected pages (pages that require authentication)
const PROTECTED_PATHS = [
  '/dashboard',
  '/properties',
  '/reservations',
  '/calendar',
  '/settings',
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // Use getUser() instead of getSession() to validate with auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.search;

  // Check if current path is an auth page (excluding callback)
  const isAuthPage = AUTH_PAGES.includes(path);
  const isAuthPath = AUTH_PATHS.some((authPath) => path.startsWith(authPath));
  const isCallbackPage = path === AUTH_CALLBACK;

  // Check if current path is a protected page
  const isProtectedPage = PROTECTED_PATHS.some((protectedPath) =>
    path.startsWith(protectedPath)
  );

  // If user is authenticated and trying to access auth pages (not callback)
  if (user && (isAuthPage || (isAuthPath && !isCallbackPage))) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is not authenticated and trying to access protected pages
  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/login', request.url);
    // Preserve the intended destination in redirect parameter
    redirectUrl.searchParams.set('redirect', path + searchParams);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
