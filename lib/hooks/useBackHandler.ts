"use client";

import { useEffect } from "react";
import { pushBackHandler, popBackHandler } from "@/lib/utils/back-button";

export function useBackHandler(active: boolean, handler: () => void): void {
  useEffect(() => {
    if (!active) return;
    pushBackHandler(handler);
    return () => popBackHandler();
  }, [active, handler]);
}
