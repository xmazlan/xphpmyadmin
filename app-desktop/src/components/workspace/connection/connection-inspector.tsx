import {
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  FolderOpen,
  Key,
  PanelRightClose,
  RefreshCw,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import React, { useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DiagnosticStage, Profile } from "@/types/connection";
import { cn } from "@/utils/tailwind";

interface ConnectionInspectorProps {
  diagnostics: DiagnosticStage[] | null;
  editForm: Profile;
  isOpen: boolean;
  isTesting: boolean;
  onClose: () => void;
  onConnect: () => void;
  onInspectSshKey: () => void;
  onSaveProfile: () => void;
  onTestConnection: () => void;
  passwordAction: "keep" | "replace" | "remove";
  passwordInput: string;
  setEditForm: React.Dispatch<React.SetStateAction<Profile>>;
  setPasswordAction: (val: "keep" | "replace" | "remove") => void;
  setPasswordInput: (val: string) => void;
  setShowPassword: (val: boolean) => void;
  setShowSshPassword: (val: boolean) => void;
  showPassword: boolean;
  showSshPassword: boolean;
}

export function ConnectionInspector({
  diagnostics,
  editForm,
  isOpen,
  isTesting,
  onClose,
  onConnect,
  onInspectSshKey,
  onSaveProfile,
  onTestConnection,
  passwordAction,
  passwordInput,
  setEditForm,
  setPasswordAction,
  setPasswordInput,
  setShowPassword,
  setShowSshPassword,
  showPassword,
  showSshPassword,
}: ConnectionInspectorProps) {
  const sshKeyFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleCopySshCli = () => {
    const localPort = 33306;
    const remoteDbHost = editForm.host || "127.0.0.1";
    const remoteDbPort = editForm.port || 3306;
    const sshUser = editForm.ssh?.username || "root";
    const sshHost = editForm.ssh?.host || "IP_VPS";
    const sshPort = editForm.ssh?.port || 22;
    const keyFlag = editForm.ssh?.key ? ` -i ${editForm.ssh.key}` : "";

    const cliCmd = `ssh${keyFlag} -N -L ${localPort}:${remoteDbHost}:${remoteDbPort} ${sshUser}@${sshHost} -p ${sshPort}`;
    navigator.clipboard.writeText(cliCmd);
    toast.success("Perintah SSH Port Forwarding disalin!", {
      description: cliCmd,
    });
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-border border-l bg-card transition-all duration-200 sm:w-80 lg:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          {editForm.method === "ssh" ? (
            <Terminal className="text-purple-400" size={15} />
          ) : (
            <Database className="text-primary" size={15} />
          )}
          <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">
            {editForm.method === "ssh" ? "SSH Tunnel Details" : "Host Details"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            className={cn(
              "text-[9px] uppercase tracking-wider",
              editForm.environment === "Production" &&
                "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {editForm.environment}
          </Badge>
          <button
            className="cursor-pointer rounded p-1 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            onClick={onClose}
            title="Tutup Panel Inspector"
            type="button"
          >
            <PanelRightClose size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4 text-xs">
        {/* Profile Name & Environment */}
        <div className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">
              Nama Profil
            </Label>
            <Input
              className="mt-1 h-8 border-border bg-muted/40 py-1 text-foreground text-xs"
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              value={editForm.name}
            />
          </div>

          {/* Metode Koneksi Segmented Buttons */}
          <div>
            <Label className="text-[11px] text-muted-foreground">
              Metode Koneksi
            </Label>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/30 p-1">
              <button
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium transition-all",
                  editForm.method === "direct"
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                onClick={() =>
                  setEditForm({ ...editForm, method: "direct", ssh: null })
                }
                type="button"
              >
                <Database size={13} />
                <span>Langsung (Direct)</span>
              </button>
              <button
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium transition-all",
                  editForm.method === "ssh"
                    ? "bg-purple-600 font-semibold text-white shadow-xs ring-1 ring-purple-400/50"
                    : "text-muted-foreground hover:bg-purple-500/10 hover:text-purple-300"
                )}
                onClick={() =>
                  setEditForm({
                    ...editForm,
                    method: "ssh",
                    ssh: editForm.ssh || {
                      auth_type: "password",
                      host: "",
                      key: "",
                      password: "",
                      port: 22,
                      username: "root",
                    },
                  })
                }
                type="button"
              >
                <Terminal size={13} />
                <span>SSH Tunnel (VPS)</span>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">
              Environment
            </Label>
            <Select
              onValueChange={(val: any) =>
                setEditForm({ ...editForm, environment: val })
              }
              value={editForm.environment}
            >
              <SelectTrigger className="mt-1 h-8 border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="Local">Local</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Server Details */}
        <div className="space-y-2.5 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[11px] text-foreground">
              Server Database MySQL / MariaDB
            </h4>
            {editForm.method === "ssh" && (
              <Badge className="border-purple-400/40 bg-purple-500/10 text-[9px] text-purple-300">
                via SSH Tunnel
              </Badge>
            )}
          </div>

          {editForm.method === "ssh" && (
            <p className="rounded bg-purple-950/30 p-1.5 text-[10px] text-purple-200">
              💡 <strong>Tips VPS:</strong> Database Host biasanya diisi{" "}
              <code className="text-purple-100">127.0.0.1</code> karena MySQL
              dihubungi langsung dari dalam VPS via tunnel.
            </p>
          )}

          <div>
            <Label className="text-[10px] text-muted-foreground">
              Tipe Database
            </Label>
            <Select
              onValueChange={(val: "mysql" | "mariadb" | "auto") =>
                setEditForm({ ...editForm, db_type: val })
              }
              value={editForm.db_type || "auto"}
            >
              <SelectTrigger className="mt-1 h-8 border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <span>🔍</span>
                    <span>Auto-Detect (MySQL & MariaDB)</span>
                  </div>
                </SelectItem>
                <SelectItem value="mysql">
                  <div className="flex items-center gap-2">
                    <span>🐬</span>
                    <span>MySQL</span>
                  </div>
                </SelectItem>
                <SelectItem value="mariadb">
                  <div className="flex items-center gap-2">
                    <span>🦭</span>
                    <span>MariaDB</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-[10px] text-muted-foreground">
                Hostname / IP Database
              </Label>
              <Input
                className="mt-1 h-8 border-border bg-background py-0.5 font-mono text-xs leading-normal"
                onChange={(e) =>
                  setEditForm({ ...editForm, host: e.target.value })
                }
                placeholder={editForm.method === "ssh" ? "127.0.0.1" : "localhost"}
                value={editForm.host}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Port</Label>
              <Input
                className="mt-1 h-8 border-border bg-background py-0.5 font-mono text-xs leading-normal"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    port: Number.parseInt(e.target.value, 10) || 3306,
                  })
                }
                type="number"
                value={editForm.port}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">
                Username MySQL
              </Label>
              <Input
                className="mt-1 h-8 border-border bg-muted/40 py-1 text-foreground text-xs"
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                placeholder="root"
                value={editForm.username}
              />
            </div>
            <div>
              <Label className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Password MySQL</span>
                {editForm.has_saved_password && passwordAction === "keep" && (
                  <span className="font-medium text-[9px] text-emerald-500">
                    Tersimpan di Vault
                  </span>
                )}
                {passwordAction === "replace" && (
                  <span className="font-medium text-[9px] text-amber-500">
                    Password Baru
                  </span>
                )}
                {passwordAction === "remove" && (
                  <span className="font-medium text-[9px] text-destructive">
                    Akan Dihapus
                  </span>
                )}
              </Label>
              <div className="relative mt-1">
                <Input
                  className="h-8 border-border bg-background pr-7 py-0.5 font-mono text-xs leading-normal"
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordAction("replace");
                  }}
                  placeholder={
                    editForm.has_saved_password && passwordAction === "keep"
                      ? "•••••••• (Tersimpan - ketik untuk ganti)"
                      : "Ketik password database..."
                  }
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                />
                <button
                  className="absolute top-2 right-2 cursor-pointer text-muted-foreground/70 hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SSH Tunnel Configuration Section */}
        {editForm.method === "ssh" && (
          <div className="flex flex-col gap-2.5 rounded-lg border border-purple-400/40 bg-purple-500/10 p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 font-semibold text-[11px] text-purple-300">
                <Terminal size={13} />
                Konfigurasi SSH Server (VPS / Bastion)
              </h4>
              <div className="flex items-center gap-1">
                <Button
                  className="h-5.5 rounded px-1.5 text-[10px] text-purple-200 hover:bg-purple-500/20"
                  onClick={handleCopySshCli}
                  size="sm"
                  title="Salin perintah CLI ssh -N -L"
                  variant="ghost"
                >
                  <Copy className="mr-1" size={11} />
                  CLI
                </Button>
                <Button
                  className="h-5.5 rounded px-2 text-[10px] text-purple-200 hover:bg-purple-500/20"
                  onClick={onInspectSshKey}
                  size="sm"
                  variant="ghost"
                >
                  Pindai Host Key
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-[10px] text-muted-foreground">
                  IP Publik / Domain VPS
                </Label>
                <Input
                  className="mt-1 h-8 border-border bg-background py-0.5 font-mono text-xs leading-normal"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      ssh: { ...editForm.ssh!, host: e.target.value },
                    })
                  }
                  placeholder="103.xxx.xxx.xxx atau vps.domain.com"
                  value={editForm.ssh?.host || ""}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  SSH Port
                </Label>
                <Input
                  className="mt-1 h-8 border-border bg-background py-0.5 font-mono text-xs leading-normal"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      ssh: {
                        ...editForm.ssh!,
                        port: Number.parseInt(e.target.value, 10) || 22,
                      },
                    })
                  }
                  type="number"
                  value={editForm.ssh?.port || 22}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  User SSH (VPS)
                </Label>
                <Input
                  className="mt-1 h-8 border-border bg-background py-0.5 font-mono text-xs leading-normal"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      ssh: { ...editForm.ssh!, username: e.target.value },
                    })
                  }
                  placeholder="root / ubuntu"
                  value={editForm.ssh?.username ?? ""}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  Metode Auth SSH
                </Label>
                <div className="mt-1 grid grid-cols-2 gap-1 rounded border border-border bg-background p-0.5">
                  <button
                    className={cn(
                      "cursor-pointer rounded py-0.5 text-center text-[10px] font-medium transition-all",
                      (editForm.ssh?.auth_type ?? "password") === "password"
                        ? "bg-purple-600 font-semibold text-white"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        ssh: { ...editForm.ssh!, auth_type: "password" },
                      })
                    }
                    type="button"
                  >
                    Password
                  </button>
                  <button
                    className={cn(
                      "cursor-pointer rounded py-0.5 text-center text-[10px] font-medium transition-all",
                      editForm.ssh?.auth_type === "key"
                        ? "bg-purple-600 font-semibold text-white"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        ssh: { ...editForm.ssh!, auth_type: "key" },
                      })
                    }
                    type="button"
                  >
                    Private Key
                  </button>
                </div>
              </div>
            </div>

            {/* Password SSH Input */}
            {(editForm.ssh?.auth_type ?? "password") === "password" && (
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  Password SSH VPS
                </Label>
                <div className="relative mt-1">
                  <Input
                    className="h-8 border-border bg-background pr-7 py-0.5 font-mono text-xs leading-normal"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ssh: { ...editForm.ssh!, password: e.target.value },
                      })
                    }
                    placeholder="Masukkan password user SSH VPS..."
                    type={showSshPassword ? "text" : "password"}
                    value={editForm.ssh?.password ?? ""}
                  />
                  <button
                    className="absolute top-2 right-2 cursor-pointer text-muted-foreground/70 hover:text-foreground"
                    onClick={() => setShowSshPassword(!showSshPassword)}
                    title={
                      showSshPassword
                        ? "Sembunyikan password SSH"
                        : "Lihat password SSH"
                    }
                    type="button"
                  >
                    {showSshPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
            )}

            {/* Private Key SSH Input */}
            {editForm.ssh?.auth_type === "key" && (
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  Path File SSH Private Key (id_rsa / id_ed25519)
                </Label>
                <div className="mt-1 flex items-center gap-1.5">
                  <Input
                    className="h-8 flex-1 border-border bg-background py-0.5 font-mono text-xs leading-normal"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ssh: { ...editForm.ssh!, key: e.target.value },
                      })
                    }
                    placeholder="~/.ssh/id_ed25519 atau /home/user/.ssh/id_rsa"
                    value={editForm.ssh?.key || ""}
                  />
                  <input
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const pathStr = (file as any).path || file.name;
                        setEditForm({
                          ...editForm,
                          ssh: { ...editForm.ssh!, key: pathStr },
                        });
                      }
                    }}
                    ref={sshKeyFileInputRef}
                    type="file"
                  />
                  <Button
                    className="h-8 shrink-0 px-2.5 text-[10px]"
                    onClick={() => sshKeyFileInputRef.current?.click()}
                    size="sm"
                    title="Pilih Berkas Kunci SSH"
                    type="button"
                    variant="outline"
                  >
                    <FolderOpen size={12} />
                    <span className="hidden sm:inline">Pilih</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password Vault */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 font-semibold text-[11px] text-foreground">
              <Key className="text-primary" size={12} />
              Status Password Vault (Keychain)
            </h4>
            <Badge
              className={cn(
                "py-0 text-[9px]",
                editForm.has_saved_password && passwordAction !== "remove"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-border text-muted-foreground"
              )}
              variant="outline"
            >
              {editForm.has_saved_password && passwordAction !== "remove"
                ? "Tersimpan (AES-256)"
                : "Belum Ada Sandi"}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground/70">
              {passwordAction === "keep" && editForm.has_saved_password
                ? "Sandi terenkripsi aktif. Ketik di kolom Password untuk mengganti."
                : passwordAction === "replace"
                  ? "Sandi baru akan disimpan ke vault saat Anda klik Simpan."
                  : passwordAction === "remove"
                    ? "Sandi akan dihapus dari vault saat Anda klik Simpan."
                    : "Belum ada sandi tersimpan untuk host ini."}
            </span>
            {editForm.has_saved_password && passwordAction !== "remove" && (
              <Button
                className="h-6 border border-destructive/20 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setPasswordAction("remove");
                  setPasswordInput("");
                }}
                size="sm"
                variant="ghost"
              >
                Hapus Sandi
              </Button>
            )}
            {passwordAction === "remove" && (
              <Button
                className="h-6 border border-primary/20 px-2 text-[10px] text-primary hover:bg-primary/10"
                onClick={() => setPasswordAction("keep")}
                size="sm"
                variant="ghost"
              >
                Batal Hapus
              </Button>
            )}
          </div>
        </div>

        {/* SSL/TLS */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-primary" size={13} />
              <Label className="text-[11px] text-foreground">
                Enkripsi SSL/TLS
              </Label>
            </div>
            <Switch
              checked={editForm.tls.enabled}
              onCheckedChange={(checked) =>
                setEditForm({
                  ...editForm,
                  tls: { ...editForm.tls, enabled: checked },
                })
              }
            />
          </div>
        </div>

        {/* Diagnostics */}
        {diagnostics && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
            <h4 className="font-semibold text-[11px] text-foreground">
              Hasil Diagnostik 4-Tahap
            </h4>
            <div className="space-y-1.5">
              {diagnostics.map((d) => (
                <div
                  className="flex items-center justify-between text-[11px]"
                  key={d.stage}
                >
                  <span className="font-mono text-muted-foreground capitalize">
                    {d.stage === "mysql_tls_authentication_initial_database"
                      ? "Otentikasi Server MariaDB / MySQL"
                      : d.stage.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {d.status === "passed" && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Check size={11} /> {d.duration_ms}ms
                      </span>
                    )}
                    {d.status === "running" && (
                      <span className="animate-pulse text-primary">
                        Menguji...
                      </span>
                    )}
                    {d.status === "skipped" && (
                      <span className="text-muted-foreground/70">Dilewati</span>
                    )}
                    {d.status === "failed" && (
                      <span className="text-destructive">Gagal</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 space-y-2 border-border border-t bg-muted/40 p-3.5">
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="h-7.5 border-border bg-transparent text-foreground text-xs hover:bg-muted hover:text-foreground"
            disabled={isTesting}
            onClick={onTestConnection}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("mr-1.5", isTesting && "animate-spin")}
              size={12}
            />
            {isTesting ? "Menguji..." : "Tes Koneksi"}
          </Button>
          <Button
            className="h-7.5 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
            onClick={onSaveProfile}
            size="sm"
          >
            <Check className="mr-1.5" size={12} />
            Simpan Profil
          </Button>
        </div>
        <Button
          className="flex h-8 w-full items-center justify-center gap-1 rounded-md bg-primary font-semibold text-primary-foreground text-xs shadow-sm hover:bg-primary/90"
          onClick={onConnect}
          size="sm"
        >
          <Zap className="fill-current" size={13} />
          <span>Hubungkan ke Database</span>
          <kbd className="ml-1 hidden rounded bg-primary-foreground/15 px-1 py-0.2 font-mono text-[9px] text-primary-foreground sm:inline">
            ⌘↵
          </kbd>
        </Button>
      </div>
    </aside>
  );
}
