"use client";

import { useMemo } from "react";
import type { InvitationData, WelcomeScreenType } from "@/lib/types/invitation";
import ClassicEnvelope from "./ClassicEnvelope";
import FullEnvelope from "./FullEnvelope";
import Curtain from "./Curtain";

interface WelcomeScreenManagerProps {
  data: InvitationData;
  onOpen: () => void;
}

const RANDOM_SCREENS: WelcomeScreenType[] = ["classic-envelope", "full-envelope", "curtain"];

export default function WelcomeScreenManager({ data, onOpen }: WelcomeScreenManagerProps) {
  const type = useMemo(() => {
    if (data.welcomeRandomScreen) {
      const idx = Math.floor(Math.random() * RANDOM_SCREENS.length);
      return RANDOM_SCREENS[idx];
    }
    return data.welcomeScreenType ?? "classic-envelope";
  }, [data.welcomeRandomScreen, data.welcomeScreenType]);

  if (type === "full-envelope") {
    return (
      <>
        <div className="block md:hidden">
          <FullEnvelope data={data} onOpen={onOpen} />
        </div>
        <div className="hidden md:block">
          <ClassicEnvelope data={data} onOpen={onOpen} />
        </div>
      </>
    );
  }
  if (type === "curtain") return <Curtain data={data} onOpen={onOpen} />;
  return <ClassicEnvelope data={data} onOpen={onOpen} />;
}
