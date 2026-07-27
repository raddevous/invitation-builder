import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";

export async function registerPushNotifications(invitationId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") return;

    PushNotifications.addListener("registration", async (token: Token) => {
      try {
        await fetch("/api/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ invitationId, token: token.value }),
        });
      } catch {
        // silently fail — token registration is best-effort
      }
    });

    await PushNotifications.register();
  } catch {
    // silently fail
  }
}
