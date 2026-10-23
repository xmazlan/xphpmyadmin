import type React from "react";
import DragWindowRegion from "@/components/drag-window-region";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#0a0d18] text-slate-100">
      <DragWindowRegion title="xphpMyAdmin Desktop" />
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
