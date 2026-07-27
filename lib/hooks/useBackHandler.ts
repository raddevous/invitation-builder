"use client";

import { useEffect, useRef } from "react";
import { pushBackHandler, popBackHandler } from "@/lib/utils/back-button";

export function useBackHandler(active: boolean, handler: () => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    const fn = () => handlerRef.current();
    pushBackHandler(fn);
    return () => popBackHandler();
  }, [active]);
}
