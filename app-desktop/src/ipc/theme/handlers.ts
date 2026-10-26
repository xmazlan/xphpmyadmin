import { os } from "@orpc/server";
import { nativeTheme } from "electron";
import { setThemeModeInputSchema } from "./schemas";

export const getCurrentThemeMode = os.handler(() => {
  if (nativeTheme.themeSource === "system") {
    return nativeTheme.shouldUseDarkColors ? "dark" : "light";
  }
  return nativeTheme.themeSource;
});

export const toggleThemeMode = os.handler(() => {
  const currentIsDark =
    nativeTheme.themeSource === "system"
      ? nativeTheme.shouldUseDarkColors
      : nativeTheme.themeSource === "dark";

  const nextMode = currentIsDark ? "light" : "dark";
  nativeTheme.themeSource = nextMode;

  return nextMode === "dark";
});

export const setThemeMode = os
  .input(setThemeModeInputSchema)
  .handler(({ input }) => {
    switch (input as "light" | "dark" | "system") {
      case "light":
        nativeTheme.themeSource = "light";
        break;
      case "dark":
        nativeTheme.themeSource = "dark";
        break;
      case "system":
        nativeTheme.themeSource = "system";
        break;
      default:
        nativeTheme.themeSource = "system";
        break;
    }

    return nativeTheme.themeSource;
  });
