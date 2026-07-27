import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";

export async function registerPushNotifications(invitationId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.log("[Push] Permission not granted");
      return;
    }

    PushNotifications.addListener("registration", async (token: Token) => {
      console.log("[Push] Registration token:", token.value);
      try {
        const res = await fetch("/api/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ invitationId, token: token.value }),
        });
        console.log("[Push] Token save response:", res.status, await res.text());
      } catch (err) {
        console.error("[Push] Token save failed:", err);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] Registration error:", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[Push] Notification received:", notification);
    });

    await PushNotifications.register();
  } catch (err) {
    console.error("[Push] Setup failed:", err);
  }
}
