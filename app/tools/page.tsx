"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/lib/types/invitation";
import { getStoredItem, setStoredItem, removeStoredItem } from "@/lib/utils/storage";
import HomePreviewStage from "@/components/home/HomePreviewStage";
import { openSignup } from "@/lib/utils/signup";
import { apiUrl } from "@/lib/utils/api";
import { useSystemTheme } from "@/lib/hooks/useSystemTheme";

export default function ToolsLandingPage() {
  const { colors: t, mode, toggle } = useSystemTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-redirect if already logged in (native storage or auth cookie)
  useEffect(() => {
    async function autoLogin() {
      try {
        const stored = await getStoredItem('invitation');
        if (stored) {
          const parsed: Invitation = JSON.parse(stored);
          if (parsed?.slug) {
            router.replace(`/tools/${parsed.slug}`);
            return;
          }
        }
      } catch {
        // ignore invalid stored data
      }

      try {
        const res = await fetch(apiUrl("/api/auth/verify"), { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.invitation?.slug) {
            const { isDarkMode, accentColor, ...invitationData } = data.invitation.data;
            const inv = { ...data.invitation, data: invitationData };
            await setStoredItem("invitation", JSON.stringify(inv));
            if (isDarkMode !== undefined || accentColor !== undefined) {
              localStorage.setItem("appSettings", JSON.stringify({
                isDarkMode: mode === "dark",
                accentColor: accentColor ?? "#6998EE",
              }));
            }
            router.replace(`/tools/${data.invitation.slug}`);
            return;
          }
        }
      } catch {
        // not authenticated
      }

      setChecking(false);
    }
    autoLogin();
  }, [router]);

  const handleLogin = async (inv: Invitation) => {
    const { isDarkMode, accentColor, ...invitationData } = inv.data;
    const invitationToStore = { ...inv, data: invitationData };
    await setStoredItem('invitation', JSON.stringify(invitationToStore));
    localStorage.setItem('appSettings', JSON.stringify({
      isDarkMode: mode === "dark",
      accentColor: accentColor ?? "#6998EE",
    }));
    router.replace(`/tools/${inv.slug}`);
  };

  const handleTryDemo = async () => {
    await removeStoredItem('invitation');
    localStorage.removeItem('appSettings');
    router.push("/demo");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/auth/access-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid access code. Please try again.");
        return;
      }

      await handleLogin(data.invitation);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <main
      className="min-h-screen flex flex-col sm:flex-row sm:items-center sm:justify-center p-0 sm:p-4 lg:p-10 select-none"
      style={{
        backgroundColor: t.bg,
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        data-mobile-fullscreen
        className="relative w-full sm:max-w-6xl sm:rounded-[28px] sm:shadow-2xl sm:overflow-hidden flex flex-col sm:flex-row"
        style={{ minHeight: "min(680px, 90vh)", backgroundColor: t.cardBg }}
      >
        {/* Theme toggle — desktop only, upper right of login panel */}
        <button
          onClick={toggle}
          className="hidden sm:flex absolute top-4 right-4 z-20 w-9 h-9 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: t.hoverBg, color: t.accent }}
          aria-label="Toggle theme"
        >
          {mode === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <style>{`@media (max-width: 639px) { [data-mobile-fullscreen] { min-height: 100dvh !important; } }`}</style>
        {/* Divider — mobile only, absolute overlay */}
        <div className="sm:hidden absolute left-0 right-0 flex items-center justify-center pointer-events-none" style={{ top: "420px", transform: "translateY(-50%)", zIndex: 5 }}>
          <div className="relative" style={{ width: 280, height: 56 }}>
            <img src="/assets/hostline-02.png" alt="" className="w-full h-full object-contain" draggable={false} />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "#6998EE",
                WebkitMaskImage: "url(/assets/hostline-02.png)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: "url(/assets/hostline-02.png)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          </div>
        </div>
        {/* Left panel — interactive envelope preview */}
        <div
          className="relative w-full sm:w-1/2 h-[420px] sm:h-auto"
          style={{ backgroundColor: t.leftPanelBg }}
        >
          <HomePreviewStage externalMode={mode} externalToggle={toggle} />
        </div>

        {/* Right panel — login */}
        <div className="w-full sm:w-1/2 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:px-10 sm:py-12" style={{ background: t.rightPanelGradient }}>
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8" style={{ marginTop: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[24px] sm:h-[24px]">
                <path d="M9 14L14 9C14.5 8.5 15.3 8.5 15.8 9L17 10.2C17.5 10.7 17.5 11.5 17 12L13.5 15.5C12.6 16.4 11.1 16.4 10.2 15.5L9 14Z" />
                <path d="M9 14L6.5 11.5C5.6 10.6 5.6 9.1 6.5 8.2L9 5.7" />
                <circle cx="12" cy="12" r="10" opacity="0.15" />
              </svg>
              <span
                className="text-sm sm:text-lg tracking-[0.15em] uppercase"
                style={{ fontFamily: "Inter, sans-serif", color: t.brandColor, fontWeight: 600 }}
              >
                Instavow
              </span>
            </div>

            <div className="text-center mb-6 sm:mb-8">
              <h1
                className="text-sm sm:text-lg"
                style={{ fontFamily: "Inter, sans-serif", color: t.headingColor, fontWeight: 600 }}
              >
                Login to your account
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <input
                  id="access-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER ACCESS CODE"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl sm:rounded-2xl text-center text-[10px] sm:text-sm font-mono tracking-[0.15em] sm:tracking-[0.3em] focus:outline-none transition-all"
                  style={{
                    borderColor: error ? "#f87171" : t.inputBorder,
                    backgroundColor: t.inputBg,
                    color: t.inputText,
                    fontFamily: "Inter, sans-serif",
                    boxShadow: t.inputShadow,
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = t.inputFocusShadow}
                  onBlur={(e) => e.currentTarget.style.boxShadow = t.inputShadow}
                />
              </div>

              {error && (
                <p className="text-xs sm:text-sm text-red-400 text-center" style={{ fontFamily: "Inter, sans-serif" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-white font-medium tracking-wide transition-all active:scale-95 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-200/50"
                style={{
                  background: t.accentGradient,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.8rem",
                  boxShadow: t.loginBtnShadow,
                }}
              >
                {loading ? "Verifying…" : "LOGIN"}
              </button>

              <div className="relative my-3 sm:my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: t.dividerBorder, opacity: 0.15 }} />
                </div>
                <div className="relative flex justify-center text-[10px] sm:text-xs">
                  <span className="px-3" style={{ color: t.accent, opacity: 0.5, fontFamily: "Inter, sans-serif", background: t.dividerBg }}>
                    or
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openSignup(router)}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium tracking-wide transition-all active:scale-95 border-2 hover:bg-blue-50"
                  style={{
                    borderColor: t.accent,
                    color: t.accent,
                    backgroundColor: "transparent",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8rem",
                  }}
                >
                  SIGN UP
                </button>
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium tracking-wide transition-all active:scale-95 border-2 hover:bg-blue-50"
                  style={{
                    borderColor: t.accent,
                    color: t.accent,
                    backgroundColor: "transparent",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8rem",
                  }}
                >
                  TRY DEMO
                </button>
              </div>
            </form>

            <div className="flex items-start justify-center gap-1.5 mt-6 sm:mt-8">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.footerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: t.footerOpacity, marginTop: 2, flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p
                className="text-center text-[10px] sm:text-xs"
                style={{ color: t.footerColor, opacity: t.footerOpacity, fontFamily: "Inter, sans-serif" }}
              >
                Your access code was provided when you purchased your invitation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
