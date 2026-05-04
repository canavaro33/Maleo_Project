import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika mencoba mengakses halaman dashboard/admin/hub/connect tanpa token
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/students') || pathname.startsWith('/teachers') || pathname.startsWith('/hub') || pathname.startsWith('/connect'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Role-Based Access Control (RBAC)
  if (token && role) {
    // Siswa/Guru tidak boleh masuk ke area Admin
    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/students') || pathname.startsWith('/teachers')) && 
        (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.redirect(new URL('/hub/dashboard', request.url));
    }

    // Admin tidak boleh masuk ke area Connect (halaman orang tua) secara default jika ingin dipisah
    // (Opsional, tergantung kebutuhan)
    
    // Jika sudah login dan mencoba ke /login, lempar ke dashboard masing-masing
    if (pathname === '/login') {
      if (role === 'admin' || role === 'super_admin') return NextResponse.redirect(new URL('/dashboard', request.url));
      if (role === 'teacher' || role === 'student') return NextResponse.redirect(new URL('/hub/dashboard', request.url));
      if (role === 'guardian') return NextResponse.redirect(new URL('/connect/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Tentukan rute mana saja yang diproses oleh middleware
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/students/:path*', 
    '/teachers/:path*', 
    '/hub/:path*', 
    '/connect/:path*',
    '/login'
  ],
};
