import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/actions/language";
import { setTheme } from "@/actions/theme";
import {
  getStoredAppSettings,
  resetAppSettings as resetStoredAppSettings,
  updateAppSettings as updateStoredAppSettings,
} from "@/services/app-settings";
import { useCloudSync } from "@/context/cloud-sync-context";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_APP_SETTINGS } from "@/types/settings";

interface SettingsContextValue {
  closeSettings: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  resetSettings: () => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { recordAction } = useCloudSync();

  useEffect(() => {
    const initial = getStoredAppSettings();
    setSettings(initial);
  }, []);

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const updated = updateStoredAppSettings(updates);
    setSettings(updated);

    if (updates.language && updates.language !== i18n.language) {
      setAppLanguage(updates.language, i18n);
    }

    if (updates.theme) {
      setTheme(updates.theme);
    }

    // Catat ke action journal & otomatis sinkronkan ke cloud untuk pengguna berlangganan
    try {
      recordAction({
        action: "settings_update",
        category: "settings",
        details: {
          density: updated.density,
          editorFontSize: updated.editorFontSize,
          language: updated.language,
          theme: updated.theme,
          updatedKeys: Object.keys(updates),
        },
      });
    } catch (e) {
      console.warn("Failed to record settings_update action:", e);
    }
  };

  const handleResetSettings = () => {
    const reset = resetStoredAppSettings();
    setSettings(reset);
    setAppLanguage(reset.language, i18n);
    setTheme(reset.theme);

    try {
      recordAction({
        action: "settings_update",
        category: "settings",
        details: {
          action: "reset_to_default",
        },
      });
    } catch (e) {
      console.warn("Failed to record settings reset action:", e);
    }
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <SettingsContext.Provider
      value={{
        closeSettings,
        isSettingsOpen,
        openSettings,
        resetSettings: handleResetSettings,
        settings,
        updateSettings: handleUpdateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
