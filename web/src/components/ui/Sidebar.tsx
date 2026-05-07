"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  BookOpen,
  School,
  Clock,
  ClipboardCheck,
  Award,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const menuItems = [
  {
    label: "Menu Utama",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Data Master",
    items: [
      { name: "Data Kepala Sekolah", href: "/admin/data-master/principal", icon: ShieldCheck },
    ],
  },
  {
    label: "Data Pengguna",
    items: [
      { name: "Siswa", href: "/students", icon: Users },
      { name: "Guru", href: "/teachers", icon: GraduationCap },
      { name: "Wali Murid", href: "/guardians", icon: UserCheck },
    ],
  },
  {
    label: "Akademik",
    items: [
      { name: "Tahun Ajaran", href: "/academic-years", icon: Calendar },
      { name: "Kelas", href: "/grades", icon: School },
      { name: "Mata Pelajaran", href: "/subjects", icon: BookOpen },
      { name: "Jadwal", href: "/schedules", icon: Clock },
    ],
  },
  {
    label: "Aktivitas",
    items: [
      { name: "Kehadiran", href: "/attendances", icon: ClipboardCheck },
      { name: "Nilai", href: "/scores", icon: Award },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { name: "Pengumuman", href: "/announcements", icon: Megaphone },
      { name: "Profil Saya", href: "/settings/profile", icon: UserCircle },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      Cookies.remove("jwt_token");
      Cookies.remove("user_role");
      router.push("/login");
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/30">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">
                Maleo
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">
                SIAKAD
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {menuItems.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        "shrink-0",
                        isActive ? "text-white" : "text-slate-400"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout & Collapse */}
      <div className="border-t border-white/10 p-3 space-y-1 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
