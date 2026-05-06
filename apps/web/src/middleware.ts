import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * JWT Payload decoder (Edge-compatible base64url decoding)
 */
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = base64 +
      '='.repeat((4 - base64.length % 4) % 4);
    
    // In Edge Runtime, we use atob and TextDecoder
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

const PLATFORM_DOMAINS = [
  'app.wellbeingmetric.com',
  'localhost',
  '127.0.0.1',
];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? '';

  // White-label Domain Routing
  if (!PLATFORM_DOMAINS.some(d => hostname.includes(d))) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/public/white-label/${hostname}`,
        { next: { revalidate: 3600 } }
      );

      if (res.ok) {
        const config = await res.json();
        if (config) {
          const response = NextResponse.next();
          response.headers.set('x-wl-brand-name',  config.brand_name ?? '');
          response.headers.set('x-wl-brand-color', config.brand_color ?? '');
          response.headers.set('x-wl-logo-url',    config.brand_logo_url ?? '');
          response.headers.set('x-wl-favicon-url', config.brand_favicon_url ?? '');
          response.headers.set('x-wl-active', 'true');
          return response;
        }
      }
    } catch (e) {
      console.error('White-label fetch failed', e);
    }
  }

  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // 1. Public Paths (token olmadan erişilebilir)
  const isPublicPath = pathname === '/login' || 
                       pathname === '/invite' || 
                       pathname === '/reset-password' ||
                       pathname === '/forgot-password' ||
                       pathname === '/demo-request' ||
                       pathname.startsWith('/surveys') || // Token modu anket
                       pathname.startsWith('/track');     // Tracking pixel

  // 2. Token Check
  if (!token) {
    if (isPublicPath) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Decode Token
  const payload = decodeJwtPayload(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    return response;
  }

  // 4. Expiration Check
  const isExpired = payload.exp < Date.now() / 1000;
  if (isExpired) {
    const response = NextResponse.redirect(new URL('/login?token=expired', request.url));
    response.cookies.delete('accessToken');
    return response;
  }

  const role = payload.role;

  // 5. Root Redirect
  if (pathname === '/') {
    if (role === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'consultant') return NextResponse.redirect(new URL('/consultant', request.url));
    if (role === 'hr_admin') return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.redirect(new URL('/me', request.url));
  }

  // 6. Login Page Bypass (if logged in, redirect to dashboard)
  if (pathname === '/login') {
    if (role === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'consultant') return NextResponse.redirect(new URL('/consultant', request.url));
    if (role === 'hr_admin') return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.redirect(new URL('/me', request.url));
  }

  // 7. RBAC RULES (DÜZELTİLMİŞ)
  
  // super_admin.
  if (role === 'super_admin') {
    if (pathname.startsWith('/admin') || pathname.startsWith('/consultant')) return NextResponse.next();
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // consultant.
  if (role === 'consultant') {
    if (pathname.startsWith('/consultant')) return NextResponse.next();
    return NextResponse.redirect(new URL('/consultant', request.url));
  }

  // hr_admin.
  if (role === 'hr_admin') {
    if (pathname.startsWith('/dashboard')) return NextResponse.next();
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // employee.
  if (role === 'employee') {
    if (pathname.startsWith('/me') || pathname.startsWith('/surveys')) return NextResponse.next();
    return NextResponse.redirect(new URL('/me', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
