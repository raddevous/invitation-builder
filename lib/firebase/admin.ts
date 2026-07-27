import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let initialized = false;

function initFirebase() {
  if (initialized) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  console.log("[Firebase] Init check:", { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey });

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    initialized = true;
    console.log("[Firebase] Initialized successfully");
  } else {
    console.error("[Firebase] Missing env vars — push notifications will not work");
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
