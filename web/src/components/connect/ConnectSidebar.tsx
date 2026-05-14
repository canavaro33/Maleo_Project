"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Award,
  ClipboardCheck,
  ClipboardList,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

const menuItems = [
  {
    label: "Menu Utama",
    items: [
      { name: "Dashboard", href: "/connect/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Anak Saya",
    items: [
      { name: "Data Anak", href: "/connect/children", icon: Users },
      { name: "Nilai", href: "/connect/scores", icon: Award },
      { name: "Kehadiran", href: "/connect/attendances", icon: ClipboardCheck },
      { name: "Tugas", href: "/connect/tasks", icon: ClipboardList },
    ],
  },
  {
    label: "Informasi",
    items: [
      { name: "Konsultasi Guru", href: "/connect/consultations", icon: MessageCircle },
      { name: "Pengumuman", href: "/connect/announcements", icon: Megaphone },
    ],
  },
];

export function ConnectSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-amber-800 to-orange-900 text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-amber-500/30">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">Maleo Connect</h1>
              <p className="text-[10px] text-amber-300 leading-tight">Portal Wali Murid</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuItems.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wider mb-2 px-3">{group.label}</p>
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
                        ? "bg-amber-500/90 text-white shadow-md shadow-amber-500/30"
                        : "text-amber-100 hover:bg-white/5 hover:text-white"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-amber-300")} />
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
          className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2 text-sm text-amber-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
