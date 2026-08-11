import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { apiUrl } from "./api";
import { getStoredItem } from "./storage";

let currentToken: string | null = null;
let foregroundListenerRegistered = false;

const NOTIFICATION_CHANNEL_ID = "rsvp-notifications";

export interface NotifPrefs {
  enabled: boolean;
  rsvpAttending: boolean;
  rsvpNotAttending: boolean;
}

export async function getNotifPrefs(): Promise<NotifPrefs> {
  try {
    const stored = await getStoredItem('notifPrefs');
    if (stored) {
      const prefs = JSON.parse(stored);
      return {
        enabled: prefs.enabled !== false,
        rsvpAttending: prefs.rsvpAttending !== false,
        rsvpNotAttending: prefs.rsvpNotAttending !== false,
      };
    }
  } catch {}
  return { enabled: true, rsvpAttending: true, rsvpNotAttending: true };
}

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
      const prefs = await getNotifPrefs();
      if (!prefs.enabled) return;
      // Check sub-toggles based on notification data
      const data = notification.data || {};
      const type = data.type || data.event || "";
      const attendance = data.attendance || "";
      if (attendance === "attending" && !prefs.rsvpAttending) return;
      if (attendance === "not-attending" && !prefs.rsvpNotAttending) return;

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

  // Check if user has disabled notifications
  const prefs = await getNotifPrefs();
  if (!prefs.enabled) return;

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
        await fetch(apiUrl("/api/push-token"), {
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
      await fetch(apiUrl("/api/push-token"), {
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
