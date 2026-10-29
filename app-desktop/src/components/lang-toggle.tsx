import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/actions/language";
import langs from "@/localization/langs";
import { cn } from "@/utils/tailwind";

interface LangToggleProps {
  className?: string;
}

export default function LangToggle({ className }: LangToggleProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("id") ? "id" : "en";

  return (
    <div
      className={cn(
        "flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs font-mono select-none",
        className
      )}
    >
      {langs.map((lang) => {
        const isActive = currentLang === lang.key;
        return (
          <button
            key={lang.key}
            className={cn(
              "cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setAppLanguage(lang.key, i18n)}
            title={lang.nativeName}
            type="button"
          >
            {lang.prefix}
          </button>
        );
      })}
    </div>
  );
}
