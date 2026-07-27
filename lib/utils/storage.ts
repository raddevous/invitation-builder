import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

export async function getStoredItem(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function removeStoredItem(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}
