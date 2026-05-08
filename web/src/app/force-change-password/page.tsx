"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ForceChangePasswordModal } from "@/components/modals/ForceChangePasswordModal";
import api from "@/lib/axios";

function ForceChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);
  const isPreview = searchParams.get("preview") === "1";

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token && !isPreview) {
      router.push("/login");
    }
  }, [router, isPreview]);

  // API call — dilempar ke modal sebagai onSubmit prop
  const handleSubmit = async (oldPassword: string, newPassword: string) => {
    // Kirim ke PATCH /api/auth/change-password
    await api.patch("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    // Jika berhasil, update localStorage supaya tidak trigger force-change lagi
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      user.force_change_password = false;
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (user?.role === "admin") {
      router.push("/dashboard");
      return;
    }
    if (user?.role === "kepala_sekolah") {
      router.push("/principal-dashboard");
      return;
    }
    if (user?.role === "teacher" || user?.role === "student") {
      router.push("/hub/dashboard");
      return;
    }
    if (user?.role === "guardian") {
      router.push("/connect/dashboard");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <ForceChangePasswordModal
        isOpen={isOpen}
        onClose={() => {}}
        onSuccess={handleSuccess}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// Wrapped in Suspense because useSearchParams() requires it
export default function ForceChangePasswordPage() {
  return (
    <Suspense>
      <ForceChangePasswordContent />
    </Suspense>
  );
}
