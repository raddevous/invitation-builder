"use client";

import { useEffect } from "react";
import { setupBackButtonHandler } from "@/lib/utils/back-button";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

export default function BackButtonHandler() {
  useEffect(() => {
    CapacitorUpdater.notifyAppReady();
    setupBackButtonHandler();
  }, []);

  return null;
}
