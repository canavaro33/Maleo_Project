"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForceChangePasswordModal = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ForceChangePasswordModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password baru minimal 8 karakter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password baru harus mengandung minimal 1 huruf besar";
    }
    if (!/\d/.test(password)) {
      return "Password baru harus mengandung minimal 1 angka";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Konfirmasi password tidak sama dengan password baru");
      setLoading(false);
      return;
    }

    try {
      // Placeholder for API call
      console.log("Password changed:", formData.newPassword);
    onSuccess();
      // Reset form
      setFormData({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError("Gagal mengganti password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Ganti Password Default"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 text-sm bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg">
          Untuk keamanan akun, Anda wajib mengganti password default sebelum melanjutkan.
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Password Baru"
          type={showNewPassword ? "text" : "password"}
          placeholder="Min. 8 karakter, 1 huruf besar, 1 angka"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          icon={null}
          iconRight={
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="inline-flex items-center justify-center opacity-40 text-muted-foreground hover:opacity-100 hover:text-foreground transition-all duration-200 focus:outline-none"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          required
        />

        <Input
          label="Konfirmasi Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Ulangi password baru"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          icon={null}
          iconRight={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="inline-flex items-center justify-center opacity-40 text-muted-foreground hover:opacity-100 hover:text-foreground transition-all duration-200 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          required
        />

        <div className="pt-4 flex justify-end gap-3 border-t">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Ganti Password"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};