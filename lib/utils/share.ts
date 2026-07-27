import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export async function shareInviteLink(url: string, title = "Invitation"): Promise<"shared" | "copied" | "cancelled"> {
  // If running inside Capacitor (native app), use the native share sheet
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title,
        url,
        dialogTitle: "Share Invitation",
      });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  // If browser supports Web Share API, use it (mobile browsers show native sheet)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "cancelled";
  }
}
