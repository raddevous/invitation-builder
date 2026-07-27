import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

let listenerRegistered = false;

export function setupBackButtonHandler(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (listenerRegistered) return;
  listenerRegistered = true;

  App.addListener("backButton", () => {
    const path = window.location.pathname;

    // Treat these as root pages — do nothing (app stays open)
    const isRootPage =
      path === "/" ||
      path === "/tools" ||
      /^\/tools\/[^/]+$/.test(path);

    if (isRootPage) {
      // On root pages, minimize to background instead of closing
      App.minimizeApp();
      return;
    }

    // On non-root pages, navigate back if history exists
    if (window.history.length > 1) {
      window.history.back();
    } else {
      App.minimizeApp();
    }
  });
}
