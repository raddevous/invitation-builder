"use client";

import { useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import ClassicEnvelope from "./ClassicEnvelope";
import FullEnvelope from "./FullEnvelope";
import Curtain from "./Curtain";
import Bloom from "./Bloom";

interface WelcomeScreenManagerProps {
  data: InvitationData;
  onOpen: () => void;
}

function NoneScreen({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    onOpen();
  }, [onOpen]);
  return null;
}

export default function WelcomeScreenManager({ data, onOpen }: WelcomeScreenManagerProps) {
  const type = data.welcomeScreenType ?? "classic-envelope";

  if (type === "none") return <NoneScreen onOpen={onOpen} />;
  if (type === "full-envelope") return <FullEnvelope data={data} onOpen={onOpen} />;
  if (type === "curtain") return <Curtain data={data} onOpen={onOpen} />;
  if (type === "bloom") return <Bloom data={data} onOpen={onOpen} />;
  return <ClassicEnvelope data={data} onOpen={onOpen} />;
}
