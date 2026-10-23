import { LOCAL_STORAGE_KEYS } from "@/constants";
import { ipc } from "@/ipc/manager";
import type { ThemeMode } from "@/types/theme-mode";

export interface ThemePreferences {
  local: ThemeMode | null;
  system: ThemeMode;
}

export async function getCurrentTheme(): Promise<ThemePreferences> {
  const currentTheme = await ipc.client.theme.getCurrentThemeMode();
  const localTheme = localStorage.getItem(
    LOCAL_STORAGE_KEYS.THEME
  ) as ThemeMode | null;

  return {
    local: localTheme,
    system: currentTheme,
  };
}

export async function setTheme(newTheme: ThemeMode) {
  let isDarkMode = newTheme === "dark";
  if (newTheme === "system") {
    isDarkMode =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  try {
    await ipc.client?.theme?.setThemeMode?.(newTheme);
  } catch (error) {
    console.warn("IPC theme.setThemeMode unavailable:", error);
  }
  localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
  updateDocumentTheme(isDarkMode);
}

export async function toggleTheme() {
  let isDarkMode: boolean;
  try {
    isDarkMode = await ipc.client.theme.toggleThemeMode();
  } catch {
    isDarkMode = !(typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  }
  const newTheme = isDarkMode ? "dark" : "light";

  updateDocumentTheme(isDarkMode);
  localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
  return isDarkMode;
}

export async function syncWithLocalTheme() {
  try {
    const localTheme = (typeof localStorage !== "undefined"
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)
      : null) as ThemeMode | null;

    if (!localTheme) {
      await setTheme("dark");
      return;
    }

    await setTheme(localTheme);
  } catch {
    updateDocumentTheme(true);
  }
}

function updateDocumentTheme(isDarkMode: boolean) {
  if (typeof document !== "undefined") {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }
}
