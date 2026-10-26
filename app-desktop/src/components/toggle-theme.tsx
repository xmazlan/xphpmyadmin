import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toggleTheme } from "@/actions/theme";
import { Button } from "@/components/ui/button";

interface ToggleThemeProps {
  showLabel?: boolean;
}

export default function ToggleTheme({ showLabel = false }: ToggleThemeProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const determineDark = () => !document.documentElement.classList.contains("light");
      setIsDark(determineDark());

      const observer = new MutationObserver(() => {
        setIsDark(determineDark());
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }
  }, []);

  const handleToggle = async () => {
    const nextDark = await toggleTheme();
    setIsDark(nextDark);
    if (typeof document !== "undefined") {
      setIsDark(!document.documentElement.classList.contains("light"));
    }
  };

  if (showLabel) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors cursor-pointer"
        onClick={handleToggle}
        title={
          isDark
            ? "Mode Gelap Aktif (Klik untuk beralih ke Mode Terang)"
            : "Mode Terang Aktif (Klik untuk beralih ke Mode Gelap)"
        }
      >
        <span className="font-medium select-none">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
        <span className="flex size-5 items-center justify-center rounded">
          {isDark ? (
            <Moon className="lucide-moon" size={13} />
          ) : (
            <Sun className="lucide-sun text-amber-500" size={13} />
          )}
        </span>
      </button>
    );
  }

  return (
    <Button
      className="size-7 text-muted-foreground hover:text-foreground"
      onClick={handleToggle}
      size="icon"
      title={
        isDark
          ? "Mode Gelap Aktif (Klik untuk beralih ke Mode Terang)"
          : "Mode Terang Aktif (Klik untuk beralih ke Mode Gelap)"
      }
      variant="ghost"
    >
      {isDark ? (
        <Moon className="lucide-moon" size={14} />
      ) : (
        <Sun className="lucide-sun text-amber-500" size={14} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
