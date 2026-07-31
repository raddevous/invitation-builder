import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";
import { API_BASE_URL } from "@/lib/utils/api";

const SystemBrowser = registerPlugin<any>("SystemBrowser");

export async function openSignup(router: { push: (path: string) => void }) {
  if (Capacitor.isNativePlatform()) {
    await SystemBrowser.open({ url: `${API_BASE_URL}/signup` });
  } else {
    router.push("/signup");
  }
}
