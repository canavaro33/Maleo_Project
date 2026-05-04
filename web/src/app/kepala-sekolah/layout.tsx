"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { Topbar } from "@/components/ui/Topbar";
import { cn } from "@/lib/utils";

// Custom Sidebar for Principal to distinguish from Admin
export default function PrincipalPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} />
      
      <div 
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "pl-[72px]" : "pl-64"
        )}
      >
        <Topbar title="Portal Kepala Sekolah" />
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
