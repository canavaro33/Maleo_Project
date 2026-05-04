import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Proteksi halaman yang membutuhkan token
  const protectedPaths = [
    '/admin',
    '/kepala-sekolah',
    '/hub',
    '/connect',
    '/force-change-password',
  ];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Role-Based Access Control (RBAC)
  if (token && role) {
    // Jika sudah login dan mencoba ke /login, lempar ke dashboard masing-masing
    if (pathname === '/login') {
      if (role === 'admin' || role === 'super_admin')
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (role === 'kepala_sekolah')
        return NextResponse.redirect(new URL('/kepala-sekolah/principal-dashboard', request.url));
      if (role === 'teacher' || role === 'student')
        return NextResponse.redirect(new URL('/hub/dashboard', request.url));
      if (role === 'guardian')
        return NextResponse.redirect(new URL('/connect/dashboard', request.url));
    }

    // Proteksi area admin — hanya admin, super_admin, kepala_sekolah
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin' && role !== 'super_admin' && role !== 'kepala_sekolah') {
        return NextResponse.redirect(new URL('/hub/dashboard', request.url));
      }
    }

    // Proteksi area kepala sekolah — hanya kepala_sekolah
    if (pathname.startsWith('/kepala-sekolah')) {
      if (role !== 'kepala_sekolah') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }

    // Proteksi area hub — guru & siswa tidak boleh ke admin
    if (pathname.startsWith('/admin') && (role === 'teacher' || role === 'student' || role === 'guardian')) {
      return NextResponse.redirect(new URL('/hub/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/kepala-sekolah/:path*',
    '/hub/:path*',
    '/connect/:path*',
    '/force-change-password',
    '/login',
  ],
};
