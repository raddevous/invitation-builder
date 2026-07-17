"use client";

import { useState } from "react";
import type { Invitation } from "@/lib/types/invitation";

interface EditorLoginProps {
  onLogin: (invitation: Invitation) => void;
  onTryDemo?: () => void;
}

export default function EditorLogin({ onLogin, onTryDemo }: EditorLoginProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid access code. Please try again.");
        return;
      }

      onLogin(data.invitation);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#fff8f3" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: "#e8cfc3" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b88a78" strokeWidth="1.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <polyline points="16,7 12,11 8,7" />
            </svg>
          </div>
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: "Playfair Display, serif", color: "#5c4a3a" }}
          >
            Edit Invitation
          </h1>
          <p
            className="text-sm"
            style={{ fontFamily: "Cormorant Garamond, serif", color: "#8a6252" }}
          >
            Enter your access code to edit your invitation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="access-code"
              className="block text-xs tracking-[0.2em] uppercase mb-2"
              style={{ color: "#b88a78", fontFamily: "Cormorant Garamond, serif" }}
            >
              Access Code
            </label>
            <input
              id="access-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. RADCHIN2026"
              autoComplete="off"
              autoCapitalize="characters"
              className="w-full px-4 py-4 border rounded-2xl text-center text-lg font-mono tracking-[0.3em] focus:outline-none transition-colors"
              style={{
                borderColor: error ? "#f87171" : "#e8cfc3",
                backgroundColor: "white",
                color: "#5c4a3a",
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-4 rounded-2xl text-white font-medium tracking-wide transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: "#b88a78",
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.1rem",
            }}
          >
            {loading ? "Verifying…" : "Open Editor"}
          </button>

          {onTryDemo && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "#e8cfc3" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2" style={{ backgroundColor: "#fff8f3", color: "#8a6252" }}>
                  or
                </span>
              </div>
            </div>
          )}

          {onTryDemo && (
            <button
              type="button"
              onClick={onTryDemo}
              className="w-full py-4 rounded-2xl font-medium tracking-wide transition-all active:scale-95 border-2"
              style={{
                borderColor: "#b88a78",
                color: "#b88a78",
                backgroundColor: "transparent",
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "1.1rem",
              }}
            >
              Try Demo
            </button>
          )}
        </form>

        <p
          className="text-center text-xs mt-8"
          style={{ color: "#b88a78", opacity: 0.5, fontFamily: "Cormorant Garamond, serif" }}
        >
          Your access code was provided when you purchased your invitation.
        </p>
      </div>
    </div>
  );
}
