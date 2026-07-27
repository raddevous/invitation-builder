import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

let currentToken: string | null = null;
let foregroundListenerRegistered = false;

const NOTIFICATION_CHANNEL_ID = "rsvp-notifications";

async function ensureNotificationChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: "RSVP Notifications",
      importance: 5,
      visibility: 1,
    });
  } catch {
    // best-effort
  }
}

function registerForegroundListener(): void {
  if (foregroundListenerRegistered) return;
  foregroundListenerRegistered = true;

  PushNotifications.addListener("pushNotificationReceived", async (notification: PushNotificationSchema) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 2147483647),
            title: notification.title || "New RSVP",
            body: notification.body || "",
            channelId: NOTIFICATION_CHANNEL_ID,
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#6998EE",
          },
        ],
      });
    } catch {
      // best-effort
    }
  });
}

export async function registerPushNotifications(invitationId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") return;

    await LocalNotifications.requestPermissions();
    await ensureNotificationChannel();
    registerForegroundListener();

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
