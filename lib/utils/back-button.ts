import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

let listenerRegistered = false;

export function setupBackButtonHandler(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (listenerRegistered) return;
  listenerRegistered = true;

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // No history to go back to — minimize app instead of exiting
      App.minimizeApp();
    }
  });
}
