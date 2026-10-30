import { type ReactNode, useEffect, useState } from "react";
import { getPlatform } from "@/actions/app";
import { closeWindow, minimizeWindow } from "@/actions/window";
import { AppIcon } from "@/components/app-logo";
import { useResponsiveWindow } from "@/hooks/use-responsive";

interface DragWindowRegionProps {
  title?: ReactNode;
}

export default function DragWindowRegion({ title }: DragWindowRegionProps) {
  const [platform, setPlatform] = useState<string | null>(() => {
    if (typeof navigator !== "undefined" && typeof navigator.userAgent === "string") {
      if (navigator.userAgent.includes("Macintosh") || navigator.userAgent.includes("Mac OS")) {
        return "darwin";
      }
      if (navigator.userAgent.includes("Windows")) {
        return "win32";
      }
      if (navigator.userAgent.includes("Linux")) {
        return "linux";
      }
    }
    return null;
  });
  const { isMaximized, isNarrow, toggleMaximize } = useResponsiveWindow();

  useEffect(() => {
    let active = true;

    getPlatform()
      .then((value) => {
        if (!active) {
          return;
        }

        setPlatform(value);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  const isMacOS = platform === "darwin";

  const defaultTitle = isNarrow
    ? "xphpMyAdmin"
    : "xphpMyAdmin Desktop";

  return (
    <div className="flex h-9 w-full items-center justify-between border-b border-border/40 bg-background/95 select-none">
      <div
        className="draglayer flex h-full min-w-0 flex-1 items-center cursor-default"
        onDoubleClick={toggleMaximize}
      >
        {!isMacOS && (
          <div className="flex h-full items-center gap-2 px-3 text-muted-foreground/80 text-xs font-medium truncate">
            <AppIcon size={14} className="shrink-0" />
            <span className="truncate">{title || defaultTitle}</span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground/50 border border-border/40 rounded px-1.5 py-0.2">
              {isMaximized ? "Mode Penuh" : "Mode Window"}
            </span>
          </div>
        )}
        {isMacOS && (
          <div className="flex h-full flex-1 items-center justify-center px-20 text-xs font-medium text-muted-foreground/80">
            <div className="flex items-center gap-1.5 truncate">
              <AppIcon size={14} className="shrink-0" />
              <span className="truncate">{title || defaultTitle}</span>
            </div>
          </div>
        )}
      </div>

      {!isMacOS && (
        <div className="flex h-full items-center">
          <button
            className="flex h-full w-9 items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={minimizeWindow}
            title="Minimalkan (Minimize)"
            type="button"
          >
            <svg
              aria-hidden="true"
              height="11"
              role="img"
              viewBox="0 0 11 11"
              width="11"
            >
              <path d="m11 5.5v1h-11v-1z" fill="currentColor" />
            </svg>
          </button>

          <button
            className="flex h-full w-9 items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={toggleMaximize}
            title={isMaximized ? "Pulihkan Ukuran (Restore)" : "Maksimalkan (Maximize)"}
            type="button"
          >
            {isMaximized ? (
              /* Restore icon: two overlapping squares */
              <svg
                aria-hidden="true"
                height="11"
                role="img"
                viewBox="0 0 11 11"
                width="11"
              >
                {/* Back square */}
                <path
                  d="M3 1h7v7H8v-1h1V2H4v1H3V1z"
                  fill="currentColor"
                />
                {/* Front square */}
                <rect
                  fill="none"
                  height="7"
                  stroke="currentColor"
                  strokeWidth="1"
                  width="7"
                  x="1"
                  y="3"
                />
              </svg>
            ) : (
              /* Maximize icon: single square */
              <svg
                aria-hidden="true"
                height="11"
                role="img"
                viewBox="0 0 11 11"
                width="11"
              >
                <rect
                  fill="none"
                  height="9"
                  stroke="currentColor"
                  strokeWidth="1"
                  width="9"
                  x="1.5"
                  y="1.5"
                />
              </svg>
            )}
          </button>

          <button
            className="flex h-full w-9 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
            onClick={closeWindow}
            title="Tutup (Close)"
            type="button"
          >
            <svg
              aria-hidden="true"
              height="12"
              role="img"
              viewBox="0 0 12 12"
              width="12"
            >
              <polygon
                fill="currentColor"
                fillRule="evenodd"
                points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
