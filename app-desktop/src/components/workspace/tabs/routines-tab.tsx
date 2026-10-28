import {
  Code2,
  FileCode2,
  Play,
  RefreshCw,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoutineItem, TriggerItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface RoutinesTabProps {
  currentSelectedDatabase: string;
  isLoadingRoutines: boolean;
  onDropRoutine?: (name: string, type: "PROCEDURE" | "FUNCTION") => void;
  onDropTrigger?: (triggerName: string) => void;
  onExecuteRoutine?: (routineName: string) => void;
  onLoadRoutines: () => void;
  onViewRoutineCode?: (
    name: string,
    type: "PROCEDURE" | "FUNCTION" | "TRIGGER"
  ) => void;
  routinesData: RoutineItem[];
  triggersData: TriggerItem[];
}

export function RoutinesTab({
  currentSelectedDatabase,
  isLoadingRoutines,
  onDropRoutine,
  onDropTrigger,
  onExecuteRoutine,
  onLoadRoutines,
  onViewRoutineCode,
  routinesData,
  triggersData,
}: RoutinesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"routines" | "triggers">(
    "routines"
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <Workflow className="text-primary" size={20} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Rutin & Pemicu (Routines & Triggers) —{" "}
                <span className="font-mono text-primary">
                  {currentSelectedDatabase}
                </span>
              </h2>
              <p className="text-muted-foreground text-xs">
                Daftar Stored Procedures, Functions, serta Triggers database.
              </p>
            </div>
          </div>
          <Button
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            disabled={isLoadingRoutines}
            onClick={onLoadRoutines}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("mr-1.5", isLoadingRoutines && "animate-spin")}
              size={12}
            />
            <span>Segarkan</span>
          </Button>
        </div>

        {/* Sub Navigation */}
        <div className="flex rounded-md border-border border-b bg-muted/40 p-1">
          <button
            className={cn(
              "flex-1 rounded py-1.5 font-medium text-xs transition-all",
              activeSubTab === "routines"
                ? "bg-accent font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSubTab("routines")}
            type="button"
          >
            Prosedur & Fungsi ({routinesData.length})
          </button>
          <button
            className={cn(
              "flex-1 rounded py-1.5 font-medium text-xs transition-all",
              activeSubTab === "triggers"
                ? "bg-accent font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSubTab("triggers")}
            type="button"
          >
            Pemicu Database / Triggers ({triggersData.length})
          </button>
        </div>

        {/* Routines Table */}
        {activeSubTab === "routines" ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-border border-b bg-muted/40 text-muted-foreground">
                  <th className="px-3 py-2.5 font-semibold">Nama Rutin</th>
                  <th className="px-3 py-2.5 font-semibold">Tipe</th>
                  <th className="px-3 py-2.5 font-semibold">Definer</th>
                  <th className="px-3 py-2.5 font-semibold">Keamanan</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {routinesData.map((r) => (
                  <tr className="transition-colors hover:bg-muted" key={r.name}>
                    <td className="px-3 py-2 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="text-primary" size={13} />
                        <span>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className={cn(
                          "px-1.5 py-0 text-[9px]",
                          r.type === "PROCEDURE"
                            ? "border-emerald-500/30 text-emerald-500"
                            : "border-primary/30 text-primary"
                        )}
                        variant="outline"
                      >
                        {r.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.definer || "root@localhost"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.securityType || "DEFINER"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          className="h-6 px-1.5 text-[10px] text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => onExecuteRoutine?.(r.name)}
                          size="sm"
                          title="Jalankan Rutin (CALL)"
                          variant="ghost"
                        >
                          <Play className="mr-1 fill-current" size={10} />
                          Eksekusi
                        </Button>
                        <Button
                          className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                          onClick={() => onViewRoutineCode?.(r.name, r.type)}
                          size="sm"
                          title="Lihat Definisi SQL DDL"
                          variant="ghost"
                        >
                          <Code2 className="mr-1" size={10} />
                          Definisi
                        </Button>
                        <Button
                          className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={() => onDropRoutine?.(r.name, r.type)}
                          size="sm"
                          title="Hapus Rutin (DROP)"
                          variant="ghost"
                        >
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {routinesData.length === 0 && (
                  <tr>
                    <td
                      className="py-8 text-center text-muted-foreground/70 text-xs italic"
                      colSpan={5}
                    >
                      {isLoadingRoutines
                        ? "Memuat daftar prosedur & fungsi..."
                        : "Tidak ada Stored Procedure atau Function pada basis data ini."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Triggers Table */
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-border border-b bg-muted/40 text-muted-foreground">
                  <th className="px-3 py-2.5 font-semibold">Nama Pemicu</th>
                  <th className="px-3 py-2.5 font-semibold">Tabel</th>
                  <th className="px-3 py-2.5 font-semibold">Timing</th>
                  <th className="px-3 py-2.5 font-semibold">Event</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {triggersData.map((t) => (
                  <tr className="transition-colors hover:bg-muted" key={t.name}>
                    <td className="px-3 py-2 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Zap className="text-amber-500" size={13} />
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-primary">
                      {t.table}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className="border-border px-1.5 py-0 text-[9px] text-muted-foreground"
                        variant="outline"
                      >
                        {t.timing}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className="border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-500"
                        variant="outline"
                      >
                        {t.event}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                          onClick={() =>
                            onViewRoutineCode?.(t.name, "TRIGGER")
                          }
                          size="sm"
                          title="Lihat Definisi Trigger"
                          variant="ghost"
                        >
                          <Code2 className="mr-1" size={10} />
                          Definisi
                        </Button>
                        <Button
                          className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={() => onDropTrigger?.(t.name)}
                          size="sm"
                          title="Hapus Trigger (DROP TRIGGER)"
                          variant="ghost"
                        >
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {triggersData.length === 0 && (
                  <tr>
                    <td
                      className="py-8 text-center text-muted-foreground/70 text-xs italic"
                      colSpan={5}
                    >
                      {isLoadingRoutines
                        ? "Memuat pemicu database..."
                        : "Tidak ada Trigger yang terdaftar pada basis data ini."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
