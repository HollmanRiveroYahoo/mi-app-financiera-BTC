import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  // Beskytt /dashboard og underliggende sider
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_123');
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      // Token er ugyldig eller utl?pt
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
