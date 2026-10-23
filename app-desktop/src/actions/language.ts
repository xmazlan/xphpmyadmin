import type { i18n } from "i18next";
import { LOCAL_STORAGE_KEYS } from "@/constants";

export function setAppLanguage(lang: string, i18: i18n) {
  localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, lang);
  i18.changeLanguage(lang);
  document.documentElement.lang = lang;
}

export function updateAppLanguage(i18: i18n) {
  const localLang = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE);
  if (!localLang) {
    return;
  }

  i18.changeLanguage(localLang);
  document.documentElement.lang = localLang;
}
