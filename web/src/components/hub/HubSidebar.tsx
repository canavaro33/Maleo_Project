"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Award,
  ClipboardCheck,
  Clock,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    label: "Menu Utama",
    items: [
      { name: "Dashboard", href: "/hub/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Pembelajaran",
    items: [
      { name: "Materi", href: "/hub/materials", icon: BookOpen },
      { name: "Tugas", href: "/hub/assignments", icon: ClipboardList },
    ],
  },
  {
    label: "Akademik",
    items: [
      { name: "Nilai", href: "/hub/grades", icon: Award },
      { name: "Kehadiran", href: "/hub/attendance", icon: ClipboardCheck },
      { name: "Jadwal", href: "/hub/schedules", icon: Clock },
    ],
  },
  {
    label: "Informasi",
    items: [
      { name: "Pengumuman", href: "/hub/announcements", icon: Megaphone },
    ],
  },
];

export function HubSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-teal-800 to-emerald-900 text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-teal-500/30">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">Maleo Hub</h1>
              <p className="text-[10px] text-teal-300 leading-tight">Portal Guru & Siswa</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuItems.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-teal-400/70 uppercase tracking-wider mb-2 px-3">{group.label}</p>
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
                        ? "bg-teal-500/90 text-white shadow-md shadow-teal-500/30"
                        : "text-teal-100 hover:bg-white/5 hover:text-white"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-teal-300")} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2 text-sm text-teal-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
