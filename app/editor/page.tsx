"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/lib/types/invitation";
import EditorLogin from "@/components/editor/EditorLogin";
import EditorPanel from "@/components/editor/EditorPanel";

export default function EditorPage() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const router = useRouter();

  if (!invitation) {
    return (
      <EditorLogin
        onLogin={setInvitation}
        onTryDemo={() => router.push("/demo")}
      />
    );
  }

  return <EditorPanel invitation={invitation} />;
}
