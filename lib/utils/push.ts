import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

let currentToken: string | null = null;

export async function registerPushNotifications(invitationId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") return;

    // Create notification channel for foreground notifications
    await LocalNotifications.createChannel({
      id: "rsvp-notifications",
      name: "RSVP Notifications",
      description: "Notifications for new RSVP responses",
      importance: 5,
      visibility: 1,
      sound: "default",
    });

    PushNotifications.addListener("registration", async (token: Token) => {
      currentToken = token.value;
      try {
        await fetch("/api/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ invitationId, token: token.value }),
        });
      } catch {
        // best-effort
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] Registration error:", err);
    });

    await PushNotifications.register();
  } catch {
    // best-effort
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (currentToken) {
      await fetch("/api/push-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: currentToken }),
      }).catch(() => {});
      currentToken = null;
    }
    await PushNotifications.unregister();
  } catch {
    // best-effort
  }
}
