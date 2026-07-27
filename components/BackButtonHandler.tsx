"use client";

import { useEffect } from "react";
import { setupBackButtonHandler } from "@/lib/utils/back-button";

export default function BackButtonHandler() {
  useEffect(() => {
    setupBackButtonHandler();
  }, []);

  return null;
}
