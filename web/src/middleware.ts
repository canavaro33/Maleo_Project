import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  const adminPaths = [
    '/dashboard', '/teachers', '/students', '/subjects',
    '/schedules', '/grades', '/attendances', '/announcements',
    '/academic-years', '/guardians', '/scores',
    '/principal', '/principal-dashboard',
  ];

  const isAdminPath = adminPaths.some(p => pathname.startsWith(p));
  const isHubPath = pathname.startsWith('/hub');
  const isConnectPath = pathname.startsWith('/connect');
  const isSettingsPath = pathname.startsWith('/settings');
  const isProtected = isAdminPath || isHubPath || isConnectPath || isSettingsPath ||
                      pathname === '/force-change-password';

  // Belum login → redirect ke /login
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && role) {
    // Sudah login → jangan bisa akses /login lagi
    if (pathname === '/login') {
      if (role === 'admin')
        return NextResponse.redirect(new URL('/dashboard', request.url));
      if (role === 'kepala_sekolah')
        return NextResponse.redirect(new URL('/principal-dashboard', request.url));
      if (role === 'teacher' || role === 'student')
        return NextResponse.redirect(new URL('/hub/dashboard', request.url));
      if (role === 'guardian')
        return NextResponse.redirect(new URL('/connect/dashboard', request.url));
    }

    // Admin paths → hanya admin & kepala_sekolah
    if (isAdminPath) {
      if (role !== 'admin' && role !== 'kepala_sekolah') {
        return NextResponse.redirect(new URL('/hub/dashboard', request.url));
      }
    }

    // principal & principal-dashboard → hanya kepala_sekolah & admin
    if (pathname.startsWith('/principal')) {
      if (role !== 'kepala_sekolah' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Halaman yang HANYA admin yang boleh akses (kepala_sekolah tidak boleh)
    const adminOnlyWritePaths = [
      '/teachers',
      '/students',
      '/subjects',
      '/schedules',
      '/academic-years',
      '/guardians',
      '/principal',   // /principal CRUD — bukan /principal-dashboard
      '/scores',
      '/grades',
      '/attendances',
      '/announcements',
    ];

    // Redirect kepala_sekolah jika mencoba akses halaman admin-only
    // (kecuali /principal-dashboard yang memang miliknya)
    if (role === 'kepala_sekolah') {
      const isAdminWrite = adminOnlyWritePaths.some(
        p => pathname.startsWith(p) && !pathname.startsWith('/principal-dashboard')
      );
      if (isAdminWrite) {
        return NextResponse.redirect(new URL('/principal-dashboard', request.url));
      }
    }

    // Hub → teacher & student saja
    if (isHubPath) {
      if (role === 'admin' || role === 'kepala_sekolah') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Connect → guardian saja
    if (isConnectPath) {
      if (role !== 'guardian') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    '/dashboard/:path*',
    '/principal-dashboard/:path*',
    '/principal/:path*',
    '/teachers/:path*',
    '/students/:path*',
    '/subjects/:path*',
    '/schedules/:path*',
    '/grades/:path*',
    '/attendances/:path*',
    '/announcements/:path*',
    '/academic-years/:path*',
    '/guardians/:path*',
    '/scores/:path*',
    '/hub/:path*',
    '/connect/:path*',
    '/settings/:path*',
    '/force-change-password',
    '/login',
  ],
};
