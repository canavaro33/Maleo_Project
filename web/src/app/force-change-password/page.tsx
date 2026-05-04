"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ForceChangePasswordModal } from "@/components/modals/ForceChangePasswordModal";

export default function ForceChangePasswordPage() {
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

  const handleSuccess = () => {
    setIsOpen(false);
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (user?.role === "super_admin" || user?.role === "admin") {
      router.push("/dashboard");
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
      />
    </div>
  );
}
