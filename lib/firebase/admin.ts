import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

let initialized = false;

function initFirebase() {
  if (initialized) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    initialized = true;
  }
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  initFirebase();
  if (!initialized) return;

  await getMessaging().send({
    token,
    notification: { title, body },
    data: data || {},
    android: {
      notification: { sound: "default" },
    },
  });
}
