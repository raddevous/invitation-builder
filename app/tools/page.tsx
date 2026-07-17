"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/lib/types/invitation";
import EditorLogin from "@/components/editor/EditorLogin";

export default function ToolsLandingPage() {
  const router = useRouter();

  const handleLogin = (inv: Invitation) => {
    // Store invitation in localStorage to preserve data (persists across sessions)
    // Don't include settings in invitation data
    const { isDarkMode, accentColor, ...invitationData } = inv.data;
    const invitationToStore = { ...inv, data: invitationData };
    localStorage.setItem('invitation', JSON.stringify(invitationToStore));
    
    // Store settings separately
    localStorage.setItem('appSettings', JSON.stringify({
      isDarkMode: isDarkMode ?? true,
      accentColor: accentColor ?? "#2563EB",
    }));
    
    router.push(`/tools/${inv.slug}`);
  };

  return <EditorLogin onLogin={handleLogin} />;
}
