import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmDialogProps {
  cancelText?: string;
  confirmText?: string;
  description: React.ReactNode;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  cancelText = "Batal",
  confirmText = "Hapus",
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="border-border bg-card text-foreground max-w-md">
        <AlertDialogHeader className="flex flex-col gap-2 sm:text-left">
          <div className="flex items-center gap-2.5">
            {variant === "destructive" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle size={16} />
              </div>
            )}
            <AlertDialogTitle className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-border bg-muted/30 -mx-4 -mb-4 flex flex-row items-center justify-end gap-2 rounded-b-xl border-t p-3">
          <AlertDialogCancel
            onClick={onCancel}
            className="h-7.5 border-border text-xs hover:bg-muted text-foreground cursor-pointer"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            variant={variant}
            className="h-7.5 text-xs font-semibold cursor-pointer"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
