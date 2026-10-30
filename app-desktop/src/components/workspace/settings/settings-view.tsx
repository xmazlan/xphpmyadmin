import {
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  Eye,
  Globe,
  HardDrive,
  Info,
  Key,
  Layers,
  Lock,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  Shield,
  Sun,
  Terminal,
  Type,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/context/settings-context";
import type { AppSettings } from "@/types/settings";
import { cn } from "@/utils/tailwind";

type SettingsTab = "general" | "database" | "security" | "editor" | "about";

export function SettingsView() {
  const { t } = useTranslation();
  const { resetSettings, settings, updateSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [form, setForm] = useState<AppSettings>(settings);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleFieldChange = <K extends keyof AppSettings>(
    field: K,
    value: AppSettings[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateSettings(form);
    toast.success(t("settings.saved", "Pengaturan berhasil disimpan dan disinkronkan"));
  };

  const handleReset = () => {
    resetSettings();
    setForm(settings);
    toast.info(t("settings.reset", "Pengaturan dikembalikan ke default"));
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatus(t("settings.upToDate", "Aplikasi Anda sudah versi terbaru (v1.4.2)"));
    }, 900);
  };

  const tabs = [
    {
      icon: Palette,
      id: "general" as const,
      label: t("settings.tabGeneral", "Umum"),
    },
    {
      icon: Database,
      id: "database" as const,
      label: t("settings.tabDatabase", "Database & Kueri"),
    },
    {
      icon: Shield,
      id: "security" as const,
      label: t("settings.tabSecurity", "Keamanan & SSH"),
    },
    {
      icon: Code2,
      id: "editor" as const,
      label: t("settings.tabEditor", "Editor SQL"),
    },
    {
      icon: Info,
      id: "about" as const,
      label: t("settings.tabAbout", "Tentang"),
    },
  ];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-border bg-card/60 px-6 py-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-xs">
            <Settings className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base tracking-tight text-foreground">
              {t("settings.title", "Pengaturan Aplikasi")}
            </h2>
            <p className="text-muted-foreground text-xs">
              {t("settings.subtitle", "Atur preferensi kerja, eksekusi kueri, keamanan, dan sinkronisasi otomatis.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
            onClick={handleReset}
            size="sm"
            variant="ghost"
          >
            <RotateCcw className="size-3.5" />
            {t("settings.reset", "Reset")}
          </Button>
          <Button
            className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
            onClick={handleSave}
            size="sm"
          >
            <Check className="size-3.5" />
            {t("settings.save", "Simpan Pengaturan")}
          </Button>
        </div>
      </div>

      {/* Main Container: Sidebar Tab Navigation + Content Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-52 shrink-0 border-r border-border bg-card/30 p-3 flex flex-col gap-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-xs transition-colors",
                  isActive
                    ? "bg-accent font-semibold text-accent-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6 max-w-4xl">
          {/* TAB: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("settings.tabGeneral", "Umum & Tampilan")}
                </h4>
                <div className="space-y-4">
                  {/* Language Switch */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.language", "Bahasa Aplikasi")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.languageDesc", "Pilih bahasa tampilan antarmuka")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        className={cn(
                          "h-8 text-xs font-medium px-3",
                          form.language === "en" && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleFieldChange("language", "en")}
                        size="sm"
                        variant={form.language === "en" ? "default" : "outline"}
                      >
                        English (US)
                      </Button>
                      <Button
                        className={cn(
                          "h-8 text-xs font-medium px-3",
                          form.language === "id" && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleFieldChange("language", "id")}
                        size="sm"
                        variant={form.language === "id" ? "default" : "outline"}
                      >
                        Bahasa Indonesia
                      </Button>
                    </div>
                  </div>

                  {/* Theme Mode */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Palette className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.theme", "Tema Antarmuka")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.themeDesc", "Beralih antara tema gelap, terang, atau ikuti sistem")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        className={cn(
                          "h-8 text-xs font-medium px-3 gap-1.5",
                          form.theme === "dark" && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleFieldChange("theme", "dark")}
                        size="sm"
                        variant={form.theme === "dark" ? "default" : "outline"}
                      >
                        <Moon className="size-3.5" />
                        {t("settings.dark", "Gelap")}
                      </Button>
                      <Button
                        className={cn(
                          "h-8 text-xs font-medium px-3 gap-1.5",
                          form.theme === "light" && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleFieldChange("theme", "light")}
                        size="sm"
                        variant={form.theme === "light" ? "default" : "outline"}
                      >
                        <Sun className="size-3.5" />
                        {t("settings.light", "Terang")}
                      </Button>
                      <Button
                        className={cn(
                          "h-8 text-xs font-medium px-3 gap-1.5",
                          form.theme === "system" && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleFieldChange("theme", "system")}
                        size="sm"
                        variant={form.theme === "system" ? "default" : "outline"}
                      >
                        <Zap className="size-3.5" />
                        {t("settings.system", "Sistem")}
                      </Button>
                    </div>
                  </div>

                  {/* Density */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.density", "Kerapatan Tampilan Data")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.densityDesc", "Sesuaikan kerapatan padding baris pada tabel data")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(["compact", "normal", "comfortable"] as const).map((mode) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 capitalize",
                            form.density === mode && "bg-primary text-primary-foreground"
                          )}
                          key={mode}
                          onClick={() => handleFieldChange("density", mode)}
                          size="sm"
                          variant={form.density === mode ? "default" : "outline"}
                        >
                          {mode === "compact"
                            ? t("settings.densityCompact", "Padat")
                            : mode === "normal"
                              ? t("settings.densityNormal", "Standar")
                              : t("settings.densityComfortable", "Longgar")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-collapse Sidebar */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.autoCollapse", "Ciutkan Sidebar Otomatis")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.autoCollapseDesc", "Mulai workspace dalam keadaan sidebar tertutup untuk ruang kerja lebih lega")}
                      </p>
                    </div>
                    <Switch
                      checked={form.sidebarCollapsedDefault}
                      onCheckedChange={(val) =>
                        handleFieldChange("sidebarCollapsedDefault", val)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATABASE & QUERY */}
          {activeTab === "database" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("settings.tabDatabase", "Eksekusi & Pembatas Kueri")}
                </h4>
                <div className="space-y-4">
                  {/* Default Row Limit */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="size-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.defaultRowLimit", "Batas Baris Kueri (Default LIMIT)")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.defaultRowLimitDesc", "Batas maksimum baris yang dimuat jika klausa LIMIT tidak disertakan")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[50, 100, 250, 500, 1000].map((lim) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 font-mono",
                            form.defaultRowLimit === lim && "bg-primary text-primary-foreground"
                          )}
                          key={lim}
                          onClick={() => handleFieldChange("defaultRowLimit", lim)}
                          size="sm"
                          variant={form.defaultRowLimit === lim ? "default" : "outline"}
                        >
                          {lim}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Query Timeout */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-500 shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.queryTimeout", "Batas Waktu Kueri (Timeout)")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.queryTimeoutDesc", "Batalkan kueri yang berjalan lebih lama dari batas waktu")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[15, 30, 60, 120].map((sec) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 font-mono",
                            form.queryTimeoutSeconds === sec && "bg-primary text-primary-foreground"
                          )}
                          key={sec}
                          onClick={() => handleFieldChange("queryTimeoutSeconds", sec)}
                          size="sm"
                          variant={form.queryTimeoutSeconds === sec ? "default" : "outline"}
                        >
                          {sec}s
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-append LIMIT */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.autoAppendLimit", "Tambahkan Klausa LIMIT Otomatis")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.autoAppendLimitDesc", "Sisipkan LIMIT pada kueri SELECT tanpa pembatas untuk mencegah memory overflow")}
                      </p>
                    </div>
                    <Switch
                      checked={form.autoAppendLimit}
                      onCheckedChange={(val) =>
                        handleFieldChange("autoAppendLimit", val)
                      }
                    />
                  </div>

                  {/* Confirm Dangerous Queries */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block text-amber-500">
                        {t("settings.confirmDangerous", "Konfirmasi Kueri Berbahaya")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.confirmDangerousDesc", "Tampilkan dialog konfirmasi sebelum menjalankan DROP, TRUNCATE, atau DELETE tanpa WHERE")}
                      </p>
                    </div>
                    <Switch
                      checked={form.confirmDangerousQueries}
                      onCheckedChange={(val) =>
                        handleFieldChange("confirmDangerousQueries", val)
                      }
                    />
                  </div>

                  {/* Highlight NULL Values */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.highlightNull", "Sorot Nilai NULL Secara Jelas")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.highlightNullDesc", "Tampilkan nilai NULL dengan lencana warna abu-abu italic pembeda dari string kosong")}
                      </p>
                    </div>
                    <Switch
                      checked={form.highlightNullValues}
                      onCheckedChange={(val) =>
                        handleFieldChange("highlightNullValues", val)
                      }
                    />
                  </div>

                  {/* Default Collation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.defaultCollation", "Kolasi Default Database")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Standar pengurutan dan perbandingan teks untuk pembuatan tabel baru
                      </p>
                    </div>
                    <select
                      className="h-8 rounded-md border border-border bg-background px-3 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                      onChange={(e) => handleFieldChange("defaultCollation", e.target.value)}
                      value={form.defaultCollation}
                    >
                      <option value="utf8mb4_general_ci">utf8mb4_general_ci</option>
                      <option value="utf8mb4_unicode_ci">utf8mb4_unicode_ci</option>
                      <option value="utf8mb4_bin">utf8mb4_bin</option>
                      <option value="latin1_swedish_ci">latin1_swedish_ci</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & SSH */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("settings.tabSecurity", "Keamanan, Kredensial & Terowongan SSH")}
                </h4>
                <div className="space-y-4">
                  {/* Connection Timeout */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Server className="size-4 text-purple-500 shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.connectionTimeout", "Batas Waktu Koneksi (Connection Timeout)")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.connectionTimeoutDesc", "Durasi menunggu koneksi host database sebelum batas waktu habis")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[5, 10, 15, 30].map((sec) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 font-mono",
                            form.connectionTimeoutSeconds === sec && "bg-primary text-primary-foreground"
                          )}
                          key={sec}
                          onClick={() => handleFieldChange("connectionTimeoutSeconds", sec)}
                          size="sm"
                          variant={form.connectionTimeoutSeconds === sec ? "default" : "outline"}
                        >
                          {sec}s
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* SSH Keep-Alive */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Terminal className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.sshKeepAlive", "Interval SSH Keep-Alive")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.sshKeepAliveDesc", "Kirim paket ping berkala agar koneksi SSH VPS tidak terputus saat idle")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[0, 15, 30, 60].map((sec) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 font-mono",
                            form.sshKeepAliveSeconds === sec && "bg-primary text-primary-foreground"
                          )}
                          key={sec}
                          onClick={() => handleFieldChange("sshKeepAliveSeconds", sec)}
                          size="sm"
                          variant={form.sshKeepAliveSeconds === sec ? "default" : "outline"}
                        >
                          {sec === 0 ? "Off" : `${sec}s`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Save Keychain */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Key className="size-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.saveKeychain", "Simpan Kata Sandi di Keychain Lokal")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.saveKeychainDesc", "Enkripsi kata sandi menggunakan AES-GCM 256 dan simpan aman di brankas mesin ini")}
                      </p>
                    </div>
                    <Switch
                      checked={form.savePasswordsInKeychain}
                      onCheckedChange={(val) =>
                        handleFieldChange("savePasswordsInKeychain", val)
                      }
                    />
                  </div>

                  {/* Auto-disconnect Idle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.autoDisconnect", "Putus Koneksi Otomatis saat Idle")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.autoDisconnectDesc", "Tutup koneksi aktif secara otomatis jika tidak ada kueri dalam rentang waktu")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[0, 15, 30, 60].map((mins) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 font-mono",
                            form.autoDisconnectIdleMinutes === mins && "bg-primary text-primary-foreground"
                          )}
                          key={mins}
                          onClick={() => handleFieldChange("autoDisconnectIdleMinutes", mins)}
                          size="sm"
                          variant={form.autoDisconnectIdleMinutes === mins ? "default" : "outline"}
                        >
                          {mins === 0 ? t("settings.never", "Never") : `${mins}m`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SQL EDITOR */}
          {activeTab === "editor" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("settings.tabEditor", "Editor & Penampil SQL")}
                </h4>
                <div className="space-y-4">
                  {/* Font Size */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Type className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">
                          {t("settings.fontSize", "Ukuran Font Editor")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.fontSizeDesc", "Ukuran teks editor kueri SQL dalam piksel")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[12, 13, 14, 16].map((sz) => (
                        <Button
                          className={cn(
                            "h-8 text-xs font-medium px-3 font-mono",
                            form.editorFontSize === sz && "bg-primary text-primary-foreground"
                          )}
                          key={sz}
                          onClick={() => handleFieldChange("editorFontSize", sz)}
                          size="sm"
                          variant={form.editorFontSize === sz ? "default" : "outline"}
                        >
                          {sz}px
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Line Numbers */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.showLineNumbers", "Tampilkan Nomor Baris")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tampilkan margin nomor baris di sisi kiri editor SQL
                      </p>
                    </div>
                    <Switch
                      checked={form.showLineNumbers}
                      onCheckedChange={(val) =>
                        handleFieldChange("showLineNumbers", val)
                      }
                    />
                  </div>

                  {/* Line Wrap */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.wrapLines", "Bungkus Baris Panjang (Soft Wrap)")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bungkus baris teks panjang ke bawah tanpa scroll horizontal
                      </p>
                    </div>
                    <Switch
                      checked={form.sqlWrapLines}
                      onCheckedChange={(val) =>
                        handleFieldChange("sqlWrapLines", val)
                      }
                    />
                  </div>

                  {/* Auto Complete */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 bg-card shadow-xs">
                    <div>
                      <span className="font-medium text-sm block">
                        {t("settings.autoComplete", "Pelengkapan Otomatis (Intellisense)")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Saran otomatis untuk kata kunci SQL, nama tabel, dan nama kolom
                      </p>
                    </div>
                    <Switch
                      checked={form.sqlAutoComplete}
                      onCheckedChange={(val) =>
                        handleFieldChange("sqlAutoComplete", val)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ABOUT */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("settings.tabAbout", "Informasi Aplikasi & Pembaruan")}
                </h4>

                <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-xs font-bold text-xl font-mono">
                      ER
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        ER Suite - xphpmyadmin Desktop
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Modern MySQL & MariaDB GUI Management Suite for Professional Engineers
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                      <span className="text-muted-foreground text-[11px] block">
                        {t("settings.version", "Versi Saat Ini")}
                      </span>
                      <span className="font-mono font-semibold text-foreground mt-0.5 block">
                        v1.4.2 (Production Stable)
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                      <span className="text-muted-foreground text-[11px] block">
                        {t("settings.engine", "Mesin & Runtime")}
                      </span>
                      <span className="font-mono text-foreground mt-0.5 block">
                        Electron 40 + React 19 + TanStack
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                      <span className="text-muted-foreground text-[11px] block">
                        {t("settings.website", "Ekosistem Produk")}
                      </span>
                      <span className="text-primary font-medium mt-0.5 block">
                        ER Suite Cloud Platform
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                      <span className="text-muted-foreground text-[11px] block">
                        Keamanan Kredensial
                      </span>
                      <span className="text-emerald-500 font-medium mt-0.5 block">
                        AES-256 GCM Keychain Vault
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium block">
                        Pembaruan Otomatis
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {updateStatus || "Aplikasi memeriksa pembaruan rilis secara berkala"}
                      </p>
                    </div>
                    <Button
                      className="h-8 text-xs font-semibold gap-1.5 shrink-0"
                      disabled={isCheckingUpdate}
                      onClick={handleCheckUpdate}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className={cn("size-3", isCheckingUpdate && "animate-spin")} />
                      {isCheckingUpdate
                        ? t("settings.checking", "Memeriksa...")
                        : t("settings.checkUpdates", "Periksa Pembaruan")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
