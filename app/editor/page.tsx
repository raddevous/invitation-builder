"use client";

import { useState } from "react";
import type { Invitation } from "@/lib/types/invitation";
import EditorLogin from "@/components/editor/EditorLogin";
import EditorPanel from "@/components/editor/EditorPanel";

export default function EditorPage() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  if (!invitation) {
    return <EditorLogin onLogin={setInvitation} />;
  }

  return <EditorPanel invitation={invitation} />;
}
