"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface Announcement {
  id: number;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "latest"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Announcement[] }>(
        "/notifications/latest"
      );
      return response.data.data;
    },
    refetchInterval: 120000,
  });

  const calculateUnreadCount = useCallback(() => {
    if (!notifications) return;
    
    const readIds = JSON.parse(localStorage.getItem("readAnnouncements") || "[]");
    const unread = notifications.filter((n) => !readIds.includes(n.id));
    setUnreadCount(unread.length);
  }, [notifications]);

  useEffect(() => {
    calculateUnreadCount();
  }, [calculateUnreadCount, notifications]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 5 ? "5+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onReadUpdate={calculateUnreadCount}
      />
    </div>
  );
};

