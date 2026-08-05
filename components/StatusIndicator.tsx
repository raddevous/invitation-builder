"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { openSignup } from "@/lib/utils/signup";

export default function StatusIndicator() {
  const isOnline = useOnlineStatus();
  const pathname = usePathname();
  const router = useRouter();
  const isDemoMode = pathname === "/demo" || pathname === "/invite/demo";
  const [expanded, setExpanded] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Read invitation's expiresAt from localStorage (populated on login)
  useEffect(() => {
    const checkExpiry = () => {
      try {
        const stored = localStorage.getItem("invitation");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.expiresAt) {
            setExpiresAt(parsed.expiresAt);
          } else {
            setExpiresAt(null);
          }
        } else {
          setExpiresAt(null);
        }
      } catch {
        setExpiresAt(null);
      }
    };
    checkExpiry();
    // Re-check on route changes (covers navigating between tools pages)
    window.addEventListener("storage", checkExpiry);
    return () => window.removeEventListener("storage", checkExpiry);
  }, [pathname]);

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  if (isOnline && !isDemoMode && !isExpired) return null;

  const items: { label: string; expandedLabel?: string; color: string; detail?: string; isSignup?: boolean }[] = [];

  if (!isOnline) {
    items.push({
      label: "Offline",
      color: "#F5315F",
      detail: "You're offline. Some features may be unavailable. Changes are saved locally and will sync when you reconnect.",
    });
  }

  if (isDemoMode) {
    items.push({
      label: "Demo",
      expandedLabel: "Demo Mode",
      color: "#F59E30",
      detail: "Changes are saved locally only. Sign up to publish your invitation.",
      isSignup: true,
    });
  }

  if (isExpired && expiresAt) {
    const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    items.push({
      label: "Editing Expired",
      expandedLabel: "Editing Expired",
      color: "#F5315F",
      detail: `Editing expired on ${expiryDate}. You can still view everything, but saving is disabled. Your invitation link still works for guests.`,
    });
  }

  return (
    <div
      className="fixed top-2 left-2 z-[90] no-print"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm cursor-pointer select-none transition-opacity hover:bg-black/70"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-white/30 text-xs">•</span>}
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white text-xs font-medium whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {expanded && (
        <div
          className="absolute top-full left-0 mt-2 min-w-[240px] max-w-[300px] rounded-xl bg-black/80 backdrop-blur-md p-3 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <div key={i} className={i > 0 ? "mt-2 pt-2 border-t border-white/10" : ""}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white text-xs font-semibold">{item.expandedLabel || item.label}</span>
              </div>
              {item.detail && (
                <p className="text-white/70 text-xs leading-relaxed ml-4">{item.detail}</p>
              )}
              {item.isSignup && (
                <button
                  className="ml-4 mt-1.5 text-xs font-semibold text-[#F59E30] underline"
                  onClick={() => openSignup(router)}
                >
                  Sign up
                </button>
              )}
            </div>
          ))}
          <button
            className="absolute top-2 right-2 text-white/50 hover:text-white text-xs"
            onClick={() => setExpanded(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
