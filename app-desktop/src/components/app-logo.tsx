import type React from "react";
import { cn } from "@/utils/tailwind";

export const APP_VERSION = "1.4.2";

interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  withBackground?: boolean;
}

export function AppIcon({
  size = 24,
  withBackground = false,
  className,
  ...props
}: AppIconProps) {
  if (withBackground) {
    return (
      <svg
        viewBox="0 0 128 128"
        fill="none"
        width={size}
        height={size}
        className={cn("shrink-0 select-none", className)}
        {...props}
      >
        <defs>
          <linearGradient id="app-icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d1821" />
            <stop offset="50%" stopColor="#070c10" />
            <stop offset="100%" stopColor="#030508" />
          </linearGradient>
          <linearGradient id="app-icon-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#0d9488" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#042f2e" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="app-icon-disc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="app-icon-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="app-icon-x" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        <rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="28"
          fill="url(#app-icon-bg)"
          stroke="url(#app-icon-border)"
          strokeWidth="2.5"
        />

        <g transform="translate(18, 22)">
          {/* Bottom Disc */}
          <path d="M12 50 C12 43 52 43 52 50 L52 64 C52 71 12 71 12 64 Z" fill="url(#app-icon-disc)" opacity="0.8" />
          <path d="M12 64 C12 71 52 71 52 64" stroke="#2dd4bf" strokeWidth="1.8" fill="none" opacity="0.5" />

          {/* Middle Disc */}
          <path d="M12 34 C12 27 52 27 52 34 L52 48 C52 55 12 55 12 48 Z" fill="url(#app-icon-disc)" opacity="0.9" />
          <path d="M12 48 C12 55 52 55 52 48" stroke="#2dd4bf" strokeWidth="1.8" fill="none" opacity="0.7" />

          {/* Top Cylinder */}
          <path d="M12 18 C12 11 52 11 52 18 L52 32 C52 39 12 39 12 32 Z" fill="url(#app-icon-disc)" />
          <ellipse cx="32" cy="18" rx="20" ry="8" fill="url(#app-icon-top)" />
        </g>

        {/* X Foreground */}
        <path
          d="M54 36 L66 36 L86 64 L106 36 L118 36 L94 70 L119 104 L107 104 L85 73 L63 104 L51 104 L77 67 Z"
          fill="url(#app-icon-x)"
          stroke="#090d16"
          strokeWidth="1.5"
        />
        <circle cx="118" cy="36" r="3.5" fill="#5eead4" />
      </svg>
    );
  }

  // Bare glyph without squircle container
  return (
    <svg
      viewBox="0 0 100 90"
      fill="none"
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      <defs>
        <linearGradient id="bare-db-disc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="bare-db-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="bare-x" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>

      {/* Database Stack */}
      <g transform="translate(0, 4)">
        {/* Disc 3 */}
        <path d="M8 44 C8 37 44 37 44 44 L44 56 C44 63 8 63 8 56 Z" fill="url(#bare-db-disc)" opacity="0.8" />
        <path d="M8 56 C8 63 44 63 44 56" stroke="#2dd4bf" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* Disc 2 */}
        <path d="M8 28 C8 21 44 21 44 28 L44 40 C44 47 8 47 8 40 Z" fill="url(#bare-db-disc)" opacity="0.9" />
        <path d="M8 40 C8 47 44 47 44 40" stroke="#2dd4bf" strokeWidth="1.5" fill="none" opacity="0.7" />
        {/* Disc 1 */}
        <path d="M8 12 C8 5 44 5 44 12 L44 24 C44 31 8 31 8 24 Z" fill="url(#bare-db-disc)" />
        <ellipse cx="26" cy="12" rx="18" ry="7" fill="url(#bare-db-top)" />
      </g>

      {/* X Glyph */}
      <path
        d="M44 14 L55 14 L71 42 L87 14 L98 14 L78 46 L99 78 L88 78 L69 49 L50 78 L39 78 L62 44 Z"
        fill="url(#bare-x)"
        stroke="#070a0e"
        strokeWidth="1.2"
      />
      <circle cx="98" cy="14" r="3" fill="#5eead4" />
    </svg>
  );
}

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export function AppLogo({
  className,
  size = "md",
  showSubtitle = true,
}: AppLogoProps) {
  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 40,
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const subtitleSizes = {
    sm: "text-[9px] tracking-wider",
    md: "text-[10px] tracking-widest",
    lg: "text-[11px] tracking-[0.2em]",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <AppIcon size={iconSizes[size]} withBackground={size === "lg"} />
      <div className="flex flex-col">
        <div className={cn("font-bold font-sans tracking-tight leading-none text-foreground flex items-center", titleSizes[size])}>
          <span className="text-teal-400 font-extrabold mr-0.5">x</span>
          <span>phpMyAdmin</span>
          <span className="size-1 rounded-full bg-teal-400 inline-block ml-1 shadow-[0_0_6px_#2dd4bf]" />
        </div>
        {showSubtitle && (
          <span className={cn("font-mono font-semibold text-teal-500/80 uppercase mt-0.5 leading-none", subtitleSizes[size])}>
            Desktop Studio
          </span>
        )}
      </div>
    </div>
  );
}
