import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

let listenerRegistered = false;

export function setupBackButtonHandler(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (listenerRegistered) return;
  listenerRegistered = true;

  App.addListener("backButton", ({ canGoBack }) => {
    const path = window.location.pathname;

    // Treat these as root pages — minimize instead of going back
    const isRootPage =
      path === "/" ||
      path === "/tools" ||
      /^\/tools\/[^/]+$/.test(path);

    if (canGoBack && !isRootPage) {
      window.history.back();
    } else {
      App.minimizeApp();
    }
  });
}
