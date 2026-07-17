"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  accentColor?: string;
}

export default function LoginDialog({ isOpen, onClose, isDarkMode = false, accentColor = "#b88a78" }: LoginDialogProps) {
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid access code. Please try again.");
        return;
      }

      const { isDarkMode: invDarkMode, accentColor: invAccentColor, ...invitationData } = data.invitation.data;
      const invitationToStore = { ...data.invitation, data: invitationData };
      localStorage.setItem("invitation", JSON.stringify(invitationToStore));
      localStorage.setItem("appSettings", JSON.stringify({
        isDarkMode: invDarkMode ?? true,
        accentColor: invAccentColor ?? "#2563EB",
      }));

      router.push(`/tools/${data.invitation.slug}`);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: isDarkMode ? "#1f2937" : "#fff8f3" }}
      >
        <h2
          className="text-2xl text-center"
          style={{ fontFamily: "Playfair Display, serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}
        >
          Sign In
        </h2>
        <p
          className="text-sm text-center"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          Enter your access code to open your invitation.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="e.g. RADCHIN2026"
            autoCapitalize="characters"
            autoComplete="off"
            className="w-full px-4 py-3 border rounded-2xl text-center text-lg font-mono tracking-[0.3em] focus:outline-none"
            style={{
              borderColor: error ? "#f87171" : isDarkMode ? "#374151" : "#e8cfc3",
              backgroundColor: isDarkMode ? "#374151" : "white",
              color: isDarkMode ? "#e5e5e5" : "#5c4a3a",
            }}
          />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !accessCode.trim()}
            className="w-full py-3 rounded-2xl text-white font-medium tracking-wide transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: accentColor, fontFamily: "Cormorant Garamond, serif", fontSize: "1.1rem" }}
          >
            {loading ? "Verifying…" : "Login"}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: isDarkMode ? "#374151" : "#e8cfc3" }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2" style={{ backgroundColor: isDarkMode ? "#1f2937" : "#fff8f3", color: "#8a6252" }}>
              OR
            </span>
          </div>
        </div>

        <Link
          href="/signup"
          onClick={onClose}
          className="block w-full py-3 rounded-2xl text-center font-medium tracking-wide transition-all active:scale-95 border-2"
          style={{
            borderColor: isDarkMode ? "#e5e5e5" : "#5c4a3a",
            color: isDarkMode ? "#e5e5e5" : "#5c4a3a",
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "1.1rem",
          }}
        >
          SIGN UP
        </Link>
      </div>
    </div>
  );
}
