import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_123');
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ authenticated: true, user: payload });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
