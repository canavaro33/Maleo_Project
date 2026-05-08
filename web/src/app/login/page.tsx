"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LogIn,
  GraduationCap,
  Users,
  BookOpen,
  Shield,
} from "lucide-react";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Email / NIS / NIP dan password harus diisi");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Email atau password salah.");
      }

      // Simpan token ke localStorage & Cookies (untuk Middleware)
      localStorage.setItem("jwt_token", data.data.token);
      Cookies.set("jwt_token", data.data.token, { expires: 7 }); // Simpan selama 7 hari
      
      // Simpan info user & role
      const user = data.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      Cookies.set("user_role", user.role, { expires: 7 });

      // Force Change Password — cek sebelum redirect ke dashboard (Kecuali Admin)
      if (
        user.force_change_password &&
        user.role !== "admin"
      ) {
        router.push("/force-change-password");
        return;
      }

      // Role-based Redirect
      if (user.role === "admin") {
        router.push("/dashboard");
      } else if (user.role === "kepala_sekolah") {
        router.push("/principal-dashboard");
      } else if (user.role === "teacher" || user.role === "student") {
        router.push("/hub/dashboard");
      } else if (user.role === "guardian") {
        router.push("/connect/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-bold text-xl text-white shadow-lg border border-white/10">
              M
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Maleo</h1>
              <p className="text-xs text-indigo-200">
                Sistem Informasi Akademik
              </p>
            </div>
          </div>

          {/* Center content */}
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Kelola Akademik
              <br />
              Sekolah dengan{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
                Mudah
              </span>
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed mb-10">
              Platform digital terpadu untuk mengelola data siswa, guru, jadwal,
              kehadiran, dan penilaian secara efisien.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Users,
                  title: "Data Terpusat",
                  desc: "Siswa, guru, & wali murid",
                },
                {
                  icon: BookOpen,
                  title: "Akademik",
                  desc: "Jadwal, nilai, & kehadiran",
                },
                {
                  icon: GraduationCap,
                  title: "Multi Portal",
                  desc: "Admin, guru, siswa, wali",
                },
                {
                  icon: Shield,
                  title: "Aman",
                  desc: "Akses berbasis peran",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-white/10 shrink-0">
                      <Icon size={18} className="text-indigo-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {feature.title}
                      </p>
                      <p className="text-xs text-indigo-300">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-indigo-300">
            © 2025 Maleo SIAKAD. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Maleo</h1>
              <p className="text-xs text-muted-foreground">SIAKAD</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Selamat Datang 👋
            </h2>
            <p className="text-muted-foreground">
              Masuk menggunakan Email, NIS, atau NIP Anda
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 animate-in fade-in-0 slide-in-from-top-1">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-foreground"
              >
                Email / NIS / NIP
              </label>
              <input
                id="identifier"
                type="text"
                placeholder="Masukkan Email, NIS, atau NIP"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-card px-4 pr-12 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary/50 cursor-pointer"
                disabled={isLoading}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Ingat saya di perangkat ini
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Dengan masuk, Anda menyetujui{" "}
            <span className="text-primary cursor-pointer hover:underline">
              Syarat & Ketentuan
            </span>{" "}
            dan{" "}
            <span className="text-primary cursor-pointer hover:underline">
              Kebijakan Privasi
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
