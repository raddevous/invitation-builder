import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

let listenerRegistered = false;
let backHandlers: (() => void)[] = [];
let lastBackPress = 0;
let exitToast: HTMLElement | null = null;

function showExitToast(): void {
  if (exitToast) return;

  exitToast = document.createElement("div");
  exitToast.textContent = "Press back again to exit";
  exitToast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 14px;
    font-family: Inter, sans-serif;
    z-index: 99999;
    pointer-events: none;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(exitToast);

  setTimeout(() => {
    if (exitToast) {
      exitToast.style.opacity = "0";
      setTimeout(() => {
        exitToast?.remove();
        exitToast = null;
      }, 300);
    }
  }, 2000);
}

export function pushBackHandler(handler: () => void): void {
  backHandlers.push(handler);
}

export function popBackHandler(): void {
  backHandlers.pop();
}

export function setupBackButtonHandler(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (listenerRegistered) return;
  listenerRegistered = true;

  App.addListener("backButton", () => {
    // If there are registered back handlers (sub-views open), close the top one
    if (backHandlers.length > 0) {
      const handler = backHandlers.pop()!;
      handler();
      return;
    }

    // No sub-views open — double-press to exit
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      lastBackPress = 0;
      App.minimizeApp();
    } else {
      lastBackPress = now;
      showExitToast();
    }
  });
}
