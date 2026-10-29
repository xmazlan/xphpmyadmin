import type { Language } from "./language";

export default [
  {
    key: "en",
    nativeName: "English",
    prefix: "EN",
  },
  {
    key: "id",
    nativeName: "Bahasa Indonesia",
    prefix: "ID",
  },
] as const satisfies Language[];
