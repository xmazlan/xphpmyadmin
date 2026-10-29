import { useEffect, useState } from "react";
import { isWindowMaximized, maximizeWindow } from "@/actions/window";

export interface ResponsiveWindowState {
  height: number;
  isCompact: boolean;
  isExpanded: boolean;
  isMaximized: boolean;
  isNarrow: boolean;
  isShort: boolean;
  isWide: boolean;
  isWindowed: boolean;
  toggleMaximize: () => Promise<void>;
  width: number;
}

export function useResponsiveWindow(): ResponsiveWindowState {
  const [isMaximized, setIsMaximized] = useState(false);
  const [dimensions, setDimensions] = useState({
    height: typeof window !== "undefined" ? window.innerHeight : 780,
    width: typeof window !== "undefined" ? window.innerWidth : 1240,
  });

  useEffect(() => {
    // 1. Initial check via IPC
    isWindowMaximized()
      .then((max) => {
        setIsMaximized(max);
      })
      .catch(() => {});

    // 2. Listen to IPC window-state-change if available
    const unsubscribe = window.electronWindow?.onWindowStateChange?.(
      (data: { isMaximized: boolean }) => {
        setIsMaximized(data.isMaximized);
      }
    );

    // 3. Native resize listener for window dimensions
    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });

      // Periodic check if IPC is pending
      if (typeof window !== "undefined") {
        isWindowMaximized()
          .then((max) => setIsMaximized(max))
          .catch(() => {});
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribe?.();
    };
  }, []);

  const isWindowed = !isMaximized;
  const isNarrow = dimensions.width < 900;
  const isCompact = dimensions.width < 1120;
  const isShort = dimensions.height < 650;
  const isWide = dimensions.width >= 1440;

  const toggleMaximize = async () => {
    await maximizeWindow();
    const updated = await isWindowMaximized();
    setIsMaximized(updated);
  };

  return {
    height: dimensions.height,
    isCompact,
    isExpanded: isWide,
    isMaximized,
    isNarrow,
    isShort,
    isWide,
    isWindowed,
    toggleMaximize,
    width: dimensions.width,
  };
}
