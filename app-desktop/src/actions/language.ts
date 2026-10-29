import type { i18n } from "i18next";
import { LOCAL_STORAGE_KEYS } from "@/constants";

export function setAppLanguage(lang: string, i18: i18n) {
  const chosenLang = lang === "id" ? "id" : "en";
  localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, chosenLang);
  i18.changeLanguage(chosenLang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = chosenLang;
  }
}

export function updateAppLanguage(i18: i18n) {
  const localLang =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE)) ||
    "en";
  const finalLang = localLang === "id" ? "id" : "en";
  i18.changeLanguage(finalLang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = finalLang;
  }
}
