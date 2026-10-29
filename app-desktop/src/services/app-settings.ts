import { LOCAL_STORAGE_KEYS } from "@/constants";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_APP_SETTINGS } from "@/types/settings";

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getStoredAppSettings(): AppSettings {
  if (!isStorageAvailable()) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.APP_SETTINGS);
    if (!raw) {
      // Sync initial language & theme from existing storage keys if present
      const existingLang = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) as "en" | "id" | null;
      const existingTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as "dark" | "light" | "system" | null;

      const initial: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        language: existingLang || DEFAULT_APP_SETTINGS.language,
        theme: existingTheme || DEFAULT_APP_SETTINGS.theme,
      };
      saveAppSettings(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
    };
  } catch (err) {
    console.warn("Failed to parse app settings from localStorage:", err);
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): AppSettings {
  if (isStorageAvailable()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (err) {
      console.warn("Failed to save app settings to localStorage:", err);
    }
  }
  return settings;
}

export function updateAppSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getStoredAppSettings();
  const next: AppSettings = {
    ...current,
    ...updates,
  };
  return saveAppSettings(next);
}

export function resetAppSettings(): AppSettings {
  return saveAppSettings({ ...DEFAULT_APP_SETTINGS });
}

export function exportAppSettingsJson(): string {
  const settings = getStoredAppSettings();
  return JSON.stringify(settings, null, 2);
}

export function importAppSettingsJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== "object" || parsed === null) {
      return false;
    }
    updateAppSettings(parsed);
    return true;
  } catch {
    return false;
  }
}
