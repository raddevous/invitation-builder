"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/lib/types/invitation";
import EditorLogin from "@/components/editor/EditorLogin";
import { getStoredItem, setStoredItem, removeStoredItem } from "@/lib/utils/storage";

export default function ToolsLandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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
        const res = await fetch("/api/auth/verify", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.invitation?.slug) {
            const { isDarkMode, accentColor, ...invitationData } = data.invitation.data;
            const inv = { ...data.invitation, data: invitationData };
            await setStoredItem("invitation", JSON.stringify(inv));
            if (isDarkMode !== undefined || accentColor !== undefined) {
              await setStoredItem("appSettings", JSON.stringify({
                isDarkMode: isDarkMode ?? true,
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

  const handleTryDemo = async () => {
    await removeStoredItem('invitation');
    await removeStoredItem('appSettings');
    router.push("/demo");
  };

  const handleLogin = async (inv: Invitation) => {
    // Store invitation to preserve data (persists across sessions)
    // Don't include settings in invitation data
    const { isDarkMode, accentColor, ...invitationData } = inv.data;
    const invitationToStore = { ...inv, data: invitationData };
    await setStoredItem('invitation', JSON.stringify(invitationToStore));

    // Store settings separately
    await setStoredItem('appSettings', JSON.stringify({
      isDarkMode: isDarkMode ?? true,
      accentColor: accentColor ?? "#6998EE",
    }));

    router.replace(`/tools/${inv.slug}`);
  };

  if (checking) return null;

  return <EditorLogin onLogin={handleLogin} onTryDemo={handleTryDemo} />;
}
