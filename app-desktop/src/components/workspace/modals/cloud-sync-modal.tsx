import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileCode2,
  GitMerge,
  History,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCloudSync } from "@/context/cloud-sync-context";
import { useConnection } from "@/context/connection-context";
import { buildCloudSyncSnapshot } from "@/services/cloud-sync";
import type { BillingCycle, SubscriptionTier } from "@/types/cloud-sync";
import { SUBSCRIPTION_PLANS } from "@/types/cloud-sync";
import { cn } from "@/utils/tailwind";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ENDPOINTS = [
  {
    auth: "https://er-service.duckdns.org/api/auth",
    id: "cloud",
    label: "Cloud Server (Produksi)",
    sync: "https://er-service.duckdns.org/api/sync",
  },
  {
    auth: "http://127.0.0.1:4000/api/auth",
    id: "local",
    label: "Server Lokal (Port 4000)",
    sync: "http://127.0.0.1:4000/api/sync",
  },
];

export function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const { profiles, setProfiles } = useConnection();
  const {
    clearJournal,
    config,
    exportJson,
    importJson,
    isSyncing,
    journal,
    login,
    logout,
    mergeWithCloud,
    pullFromCloud,
    queryHistory,
    refreshState,
    register,
    syncNow,
    updateConfig,
    upgradePlan,
  } = useCloudSync();

  const [activeTab, setActiveTab] = useState<
    "overview" | "pricing" | "auth" | "journal" | "json_snapshot" | "restore"
  >("overview");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tokenInput, setTokenInput] = useState(config.apiToken || "");
  const [endpointInput, setEndpointInput] = useState(config.apiEndpoint);
  const [copied, setCopied] = useState(false);
  const [restoreJsonInput, setRestoreJsonInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  // Pricing & Billing Toggle State
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    config.billingCycle || "annual"
  );
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Form Login / Register Akun Cloud
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Live Snapshot
  const liveSnapshot = useMemo(() => {
    return buildCloudSyncSnapshot(profiles);
  }, [profiles, journal, queryHistory, config]);

  const liveJsonString = useMemo(() => {
    return JSON.stringify(liveSnapshot, null, 2);
  }, [liveSnapshot]);

  // Filtered Journal
  const filteredJournal = useMemo(() => {
    if (categoryFilter === "all") return journal;
    return journal.filter((item) => item.category === categoryFilter);
  }, [journal, categoryFilter]);

  const pendingCount = useMemo(() => {
    return journal.filter((item) => item.syncStatus === "pending").length;
  }, [journal]);

  const activeTier = config.subscriptionTier || "free";

  useEffect(() => {
    if (isOpen && activeTier === "free") {
      setActiveTab("pricing");
    }
  }, [isOpen, activeTier]);
  const activeCycle = config.billingCycle || "annual";

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(liveJsonString);
      setCopied(true);
      toast.success("Snapshot JSON Cloud berhasil disalin ke papan klip");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin ke papan klip");
    }
  };

  const handleDownloadJson = () => {
    try {
      const blob = new Blob([liveJsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `xphpmyadmin-cloud-snapshot-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Berkas JSON Cloud berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh berkas JSON");
    }
  };

  const handleSaveSettings = () => {
    updateConfig({
      apiEndpoint: endpointInput,
      apiToken: tokenInput,
    });
    toast.success("Konfigurasi Cloud Sync berhasil disimpan");
  };

  const handleSelectPreset = (preset: (typeof PRESET_ENDPOINTS)[0]) => {
    setEndpointInput(preset.sync);
    updateConfig({
      apiEndpoint: preset.sync,
      authEndpoint: preset.auth,
    });
    toast.info(`Endpoint dialihkan ke ${preset.label}`);
  };

  // Push Snapshot to Cloud
  const handleTriggerPush = async () => {
    if (activeTier === "free") {
      toast.error(
        "Paket Starter hanya mendukung brankas lokal. Silakan berlangganan untuk sinkronisasi cloud."
      );
      setActiveTab("pricing");
      return;
    }
    const res = await syncNow(profiles, tokenInput);
    if (res.success) {
      toast.success(
        res.message ||
        `Kirim ke Cloud Berhasil! (${res.syncedItems} item disinkronkan ke Neon DB)`
      );
    } else {
      toast.error(`Kirim Cloud Gagal: ${res.error}`);
    }
  };

  // Pull State from Cloud
  const handleTriggerPull = async () => {
    if (activeTier === "free") {
      toast.error(
        "Paket Starter hanya mendukung brankas lokal. Silakan berlangganan untuk sinkronisasi cloud."
      );
      setActiveTab("pricing");
      return;
    }
    const res = await pullFromCloud(tokenInput);
    if (res.success && res.data) {
      if (res.data.profiles && res.data.profiles.length > 0) {
        setProfiles(res.data.profiles);
      }
      toast.success(
        `Tarik dari Cloud Berhasil! (${res.data.profiles.length} profil dimuat dari ${res.lastDevice || "Neon Cloud"})`
      );
    } else {
      toast.error(`Tarik Cloud Gagal: ${res.error}`);
    }
  };

  // Smart Merge with Cloud
  const handleTriggerMerge = async () => {
    if (activeTier === "free") {
      toast.error(
        "Paket Starter hanya mendukung brankas lokal. Silakan berlangganan untuk sinkronisasi cloud."
      );
      setActiveTab("pricing");
      return;
    }
    const res = await mergeWithCloud(profiles, tokenInput);
    if (res.success) {
      toast.success(res.message || "Penggabungan cerdas cloud berhasil!");
    } else {
      toast.error(`Gabung Cerdas Gagal: ${res.error}`);
    }
  };

  // Plan Upgrade / Switch
  const handleSelectPlan = async (tier: SubscriptionTier) => {
    setIsUpgrading(true);
    try {
      const res = await upgradePlan(tier, billingCycle);
      if (res.success) {
        toast.success(
          `Paket berhasil diaktifkan: ${tier.toUpperCase()} (${billingCycle.toUpperCase()})`
        );
      } else {
        toast.error(`Gagal mengubah paket: ${res.error}`);
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  // Quick Seed Login Helper
  const handleQuickLogin = async (email: string, pass = "Password@123") => {
    setAuthEmail(email);
    setAuthPassword(pass);
    setIsAuthLoading(true);
    try {
      const res = await login(email, pass);
      if (res.success) {
        toast.success(
          `Login berhasil sebagai ${res.user?.name || email}! Status: ${res.user?.plan?.toUpperCase() || "PRO"} (${res.user?.billingCycle || "annual"}).`
        );
        setTokenInput(config.apiToken || "");
        setActiveTab("overview");
      } else {
        toast.error(`Login Gagal: ${res.error}`);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Auth Login / Register
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Email dan kata sandi wajib diisi");
      return;
    }

    setIsAuthLoading(true);
    try {
      if (authMode === "login") {
        const res = await login(authEmail, authPassword);
        if (res.success) {
          toast.success(
            `Selamat datang kembali, ${res.user?.name || res.user?.email}! Paket ${res.user?.plan?.toUpperCase() || "PRO"} aktif.`
          );
          setTokenInput(config.apiToken || "");
          setActiveTab("overview");
        } else {
          toast.error(`Login Gagal: ${res.error}`);
        }
      } else {
        const res = await register(
          authName || "User",
          authEmail,
          authPassword,
          "business",
          "annual"
        );
        if (res.success) {
          toast.success(
            `Pendaftaran berhasil! Akun ${res.user?.email} terdaftar di Cloud Server.`
          );
          setTokenInput(config.apiToken || "");
          setActiveTab("overview");
        } else {
          toast.error(`Pendaftaran Gagal: ${res.error}`);
        }
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleApplyRestore = () => {
    if (!restoreJsonInput.trim()) {
      toast.error("Silakan tempel isi JSON Cloud yang valid terlebih dahulu");
      return;
    }

    setIsRestoring(true);
    try {
      const res = importJson(restoreJsonInput);
      if (!res.success || !res.data) {
        toast.error(res.error || "Format berkas JSON Cloud tidak valid");
        return;
      }

      if (res.data.profiles && res.data.profiles.length > 0) {
        setProfiles(res.data.profiles);
      }

      refreshState();
      toast.success(
        `Restorasi Cloud Berhasil! (${res.data.profiles.length} profil, ${res.data.journal.length} riwayat aksi dipulihkan)`
      );
      setRestoreJsonInput("");
      setActiveTab("overview");
    } catch (err: any) {
      toast.error(`Galat restorasi: ${err?.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent
        className="max-w-4xl lg:max-w-5xl rounded-2xl border border-teal-500/20 bg-[#070a0e] p-0 text-foreground shadow-2xl shadow-teal-950/20 overflow-hidden focus:outline-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Cloud Sync & Jurnal Audit Aktivitas
        </DialogTitle>

        {/* Header Modal - Teal Accent Theme */}
        <div className="flex items-center justify-between border-b border-teal-500/15 bg-linear-to-r from-teal-950/25 via-[#0a0f14]/80 to-[#070a0e] px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 items-center justify-center rounded-xl border border-teal-500/30 bg-linear-to-br from-teal-500/20 to-teal-500/5 text-teal-400 shadow-inner shadow-teal-500/10">
              <Cloud className={cn("size-5", isSyncing && "animate-pulse")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm tracking-tight">
                  Sinkronisasi Cloud & Vault
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-bold font-mono text-[10px] tracking-wide uppercase",
                    activeTier === "business"
                      ? "border border-amber-500/40 bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-300"
                      : activeTier === "team"
                        ? "border border-blue-500/40 bg-blue-500/15 text-blue-300"
                        : activeTier === "pro"
                          ? "border border-teal-500/40 bg-teal-500/15 text-teal-300"
                          : "border border-border/70 bg-muted/30 text-muted-foreground"
                  )}
                >
                  {activeTier === "business"
                    ? `BUSINESS • ${activeCycle.toUpperCase()} (${config.maxVaults || 50} VAULTS)`
                    : activeTier === "team"
                      ? `TEAM • ${activeCycle.toUpperCase()} (${config.maxVaults || 20} VAULTS)`
                      : activeTier === "pro"
                        ? `PRO • ${activeCycle.toUpperCase()} (${config.maxVaults || 10} VAULTS)`
                        : "STARTER / LOCAL"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-teal-500" />
                </span>
                <span>Server Endpoint:</span>
                <code className="text-teal-400 font-mono text-[11px] truncate max-w-sm">
                  {endpointInput || "https://er-service.duckdns.org/api/sync"}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-400 text-xs">
                <Clock className="size-3" />
                {pendingCount} antrean
              </span>
            )}
            {activeTier !== "free" && (
              <Button
                className="hidden sm:inline-flex h-7 rounded-lg border-teal-500/40 bg-teal-500/15 text-xs font-semibold text-teal-300 hover:bg-teal-500/25 transition-all"
                disabled={isSyncing}
                onClick={handleTriggerPush}
                size="sm"
                variant="outline"
              >
                <RefreshCw
                  className={cn("mr-1.5 size-3", isSyncing && "animate-spin")}
                />
                Sinkronkan
              </Button>
            )}
            <Button
              className="size-8 rounded-lg text-muted-foreground hover:text-teal-300 hover:bg-teal-500/10 transition-colors"
              onClick={onClose}
              size="icon"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Local Vault Banner for Free Tier */}
        {activeTier === "free" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-teal-500/20 bg-teal-950/20 px-6 py-2.5 text-xs text-teal-200">
            <div className="flex items-center gap-2">
              <Shield className="size-4 shrink-0 text-teal-400" />
              <span>
                <strong>Mode Starter (Hanya Brankas Lokal):</strong> Semua fitur manajemen database remote dapat digunakan penuh secara lokal. Berlangganan cloud untuk mengaktifkan sinkronisasi otomatis antar-perangkat.
              </span>
            </div>
            <button
              onClick={() => setActiveTab("pricing")}
              className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 font-semibold text-white text-xs hover:bg-teal-500 transition-colors shadow-sm shadow-teal-950/50"
              type="button"
            >
              Lihat Paket Langganan
            </button>
          </div>
        )}

        {/* Tab Bar Navigasi - Teal Accent */}
        <div className="flex border-b border-teal-500/15 bg-[#090d13]/90 px-4 py-2 gap-1 overflow-x-auto no-scrollbar">
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap",
              activeTab === "overview"
                ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs shadow-teal-950/40"
                : "text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
            )}
            onClick={() => setActiveTab("overview")}
            type="button"
          >
            <Zap className="size-3.5 text-teal-400" />
            Operasi Cloud
          </button>
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap",
              activeTab === "pricing"
                ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs shadow-teal-950/40"
                : "text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
            )}
            onClick={() => setActiveTab("pricing")}
            type="button"
          >
            <CreditCard className="size-3.5 text-teal-400" />
            Upgrade Plan
            <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 font-bold text-[9px] text-teal-300 border border-teal-500/30">
              -33%
            </span>
          </button>
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap",
              activeTab === "auth"
                ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs shadow-teal-950/40"
                : "text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
            )}
            onClick={() => setActiveTab("auth")}
            type="button"
          >
            <User className="size-3.5 text-teal-400" />
            Akun ({config.userEmail ? "Aktif" : "Login/Daftar"})
          </button>
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap",
              activeTab === "journal"
                ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs shadow-teal-950/40"
                : "text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
            )}
            onClick={() => setActiveTab("journal")}
            type="button"
          >
            <History className="size-3.5 text-teal-400" />
            Jurnal ({journal.length})
          </button>
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap",
              activeTab === "json_snapshot"
                ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs shadow-teal-950/40"
                : "text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
            )}
            onClick={() => setActiveTab("json_snapshot")}
            type="button"
          >
            <FileCode2 className="size-3.5 text-teal-400" />
            JSON Snapshot
          </button>
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap",
              activeTab === "restore"
                ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs shadow-teal-950/40"
                : "text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
            )}
            onClick={() => setActiveTab("restore")}
            type="button"
          >
            <Upload className="size-3.5 text-teal-400" />
            Pulihkan Manual
          </button>
        </div>

        {/* Konten Tab */}
        <div className="max-h-[66vh] min-h-105 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & ACTIONS */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Card Status Cloud */}
              <div className="rounded-xl border border-teal-500/20 bg-linear-to-br from-teal-950/20 via-[#0a0f14]/80 to-[#070a0e] p-4.5 backdrop-blur-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-teal-400" />
                      <h4 className="font-semibold text-foreground text-sm">
                        Basis Data Cloud (Neon PostgreSQL)
                      </h4>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed max-w-xl">
                      Terhubung langsung ke modul sinkronisasi <code>/api/sync</code> Cloud Server. Mengamankan seluruh konfigurasi host, SSH tunnel, dan riwayat query di penyimpanan cloud terenkripsi.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-background/60 p-1 shrink-0">
                    {PRESET_ENDPOINTS.map((preset) => (
                      <button
                        className={cn(
                          "rounded-md px-2.5 py-1 font-medium text-[11px] transition-all",
                          endpointInput === preset.sync
                            ? "bg-teal-600 text-white font-semibold shadow-xs shadow-teal-950/50"
                            : "text-muted-foreground hover:text-teal-300 hover:bg-teal-500/10"
                        )}
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        type="button"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-teal-500/15 pt-3.5">
                  <div className="rounded-lg border border-teal-500/15 bg-background/50 p-3">
                    <span className="text-[11px] text-muted-foreground">
                      Total Host Server
                    </span>
                    <p className="font-semibold text-foreground text-sm mt-0.5">
                      {profiles.length} Host Server
                    </p>
                  </div>
                  <div className="rounded-lg border border-teal-500/15 bg-background/50 p-3">
                    <span className="text-[11px] text-muted-foreground">
                      Riwayat Aksi
                    </span>
                    <p className="font-semibold text-foreground text-sm mt-0.5">
                      {journal.length} Transaksi
                    </p>
                  </div>
                  <div className="rounded-lg border border-teal-500/15 bg-background/50 p-3">
                    <span className="text-[11px] text-muted-foreground">
                      Kapasitas Brankas
                    </span>
                    <p className="font-semibold text-foreground text-sm mt-0.5">
                      {activeTier === "free"
                        ? "1 Vault Lokal"
                        : `${config.maxVaults || 50} Cloud Vaults`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-teal-500/15 bg-background/50 p-3">
                    <span className="text-[11px] text-muted-foreground">
                      Status Koneksi
                    </span>
                    <p className="font-semibold text-teal-400 text-sm mt-0.5 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-teal-400" />
                      {config.status === "success"
                        ? "Terhubung & Sinkron"
                        : "Siap Sinkron"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tiga Aksi Utama: PUSH, PULL, MERGE */}
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                {/* 1. PUSH */}
                <div className="flex flex-col justify-between rounded-xl border border-teal-500/25 bg-linear-to-b from-teal-950/25 via-[#0a0f14]/80 to-[#070a0e] p-4 transition-all hover:border-teal-500/50 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400">
                        <ArrowUpFromLine className="size-3.5" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">
                        Kirim ke Cloud (Push)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Unggah profil server lokal dan snapshot ke brankas cloud terenkripsi.
                    </p>
                  </div>
                  <Button
                    className={cn(
                      "mt-4 w-full text-xs font-semibold transition-all",
                      activeTier === "free"
                        ? "border-border/70 hover:bg-muted/40"
                        : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/50"
                    )}
                    disabled={isSyncing}
                    onClick={handleTriggerPush}
                    size="sm"
                    variant={activeTier === "free" ? "outline" : "default"}
                  >
                    {activeTier === "free" ? (
                      <>
                        <Lock className="mr-1.5 size-3.5 text-amber-400" />
                        <span>Kirim Snapshot (Perlu Langganan)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="mr-1.5 size-3.5" />
                        <span>Kirim Snapshot (Push)</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* 2. PULL */}
                <div className="flex flex-col justify-between rounded-xl border border-teal-500/20 bg-linear-to-b from-teal-950/15 via-[#0a0f14]/80 to-[#070a0e] p-4 transition-all hover:border-teal-500/40 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400">
                        <ArrowDownToLine className="size-3.5" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">
                        Tarik dari Cloud (Pull)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Ambil dan terapkan profil server serta preferensi kerja terbaru dari server cloud.
                    </p>
                  </div>
                  <Button
                    className="mt-4 w-full text-xs font-semibold border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-300 transition-all"
                    disabled={isSyncing}
                    onClick={handleTriggerPull}
                    size="sm"
                    variant="outline"
                  >
                    {activeTier === "free" ? (
                      <>
                        <Lock className="mr-1.5 size-3.5 text-amber-400" />
                        <span>Tarik State (Perlu Langganan)</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="mr-1.5 size-3.5" />
                        <span>Tarik State (Pull)</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* 3. MERGE */}
                <div className="flex flex-col justify-between rounded-xl border border-teal-500/20 bg-linear-to-b from-teal-950/15 via-[#0a0f14]/80 to-[#070a0e] p-4 transition-all hover:border-teal-500/40 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400">
                        <GitMerge className="size-3.5" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">
                        Gabung Cerdas (Merge)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Gabungkan profil cloud dengan profil lokal secara otomatis tanpa menimpa data.
                    </p>
                  </div>
                  <Button
                    className="mt-4 w-full text-xs font-semibold border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-300 transition-all"
                    disabled={isSyncing}
                    onClick={handleTriggerMerge}
                    size="sm"
                    variant="outline"
                  >
                    {activeTier === "free" ? (
                      <>
                        <Lock className="mr-1.5 size-3.5 text-amber-400" />
                        <span>Gabung Data (Perlu Langganan)</span>
                      </>
                    ) : (
                      <>
                        <GitMerge className="mr-1.5 size-3.5" />
                        <span>Gabung Data (Merge)</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Endpoint & Key Form */}
              <div className="space-y-3.5 rounded-xl border border-teal-500/20 bg-[#0a0f14]/70 p-4.5">
                {/* Auto-Sync Setting Switch */}
                <div className="flex items-center justify-between rounded-xl border border-teal-500/20 bg-linear-to-r from-teal-950/20 via-[#0a0f14]/80 to-[#070a0e] p-3.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-3.5 text-teal-400" />
                      <span className="text-xs font-semibold text-foreground">
                        Sinkronisasi Otomatis (Auto-Sync)
                      </span>
                      {activeTier !== "free" ? (
                        <span className="rounded-full bg-teal-500/20 px-2 py-0.5 font-bold font-mono text-[9px] text-teal-300 border border-teal-500/30">
                          AKTIF SECARA DEFAULT
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted/40 px-2 py-0.5 font-mono text-[9px] text-muted-foreground border border-border">
                          PERLU LANGGANAN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {activeTier === "free"
                        ? "Paket Starter hanya menyimpan di brankas lokal. Tingkatkan ke Pro / Team / Business untuk sinkronisasi otomatis ke cloud."
                        : "Setiap aktivitas database (tabel, query, backup, manipulasi) otomatis disinkronkan ke cloud backend Neon secara real-time."}
                    </p>
                  </div>
                  <Switch
                    checked={
                      activeTier !== "free" && Boolean(config.autoSync ?? true)
                    }
                    disabled={activeTier === "free"}
                    onCheckedChange={(checked) => {
                      updateConfig({ autoSync: checked });
                      toast.success(
                        checked
                          ? "Sinkronisasi otomatis (Auto-Sync) diaktifkan."
                          : "Sinkronisasi otomatis dimatikan. Anda dapat menyinkronkan secara manual."
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Endpoint API Sinkronisasi
                    </label>
                    <Input
                      className="border-border/80 bg-background/70 font-mono text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                      onChange={(e) => setEndpointInput(e.target.value)}
                      value={endpointInput}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Token Autentikasi / Sync Key
                    </label>
                    <Input
                      className="border-border/80 bg-background/70 font-mono text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="user_pro_sync atau Token JWT"
                      value={tokenInput}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-teal-500/15 pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Clock className="size-3.5 text-teal-400" />
                    <span>
                      Terakhir disinkronkan:{" "}
                      {config.lastSyncAt
                        ? new Date(config.lastSyncAt).toLocaleString()
                        : "Belum pernah sinkron"}
                    </span>
                  </div>

                  <Button
                    className="border-teal-500/30 hover:bg-teal-500/15 hover:text-teal-300 text-teal-400"
                    onClick={handleSaveSettings}
                    size="sm"
                    variant="outline"
                  >
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & UPGRADE PLAN */}
          {activeTab === "pricing" && (
            <div className="space-y-6 py-2">
              {/* Header Upgrade */}
              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Upgrade your plan
                </h2>
                <p className="text-xs text-muted-foreground">
                  You are currently on a{" "}
                  <span className="font-semibold text-foreground uppercase">
                    {activeTier === "business"
                      ? "Business"
                      : activeTier === "team"
                        ? "Team"
                        : activeTier === "pro"
                          ? "Pro"
                          : "Starter"}
                  </span>{" "}
                  plan.
                </p>
                {activeTier === "free" && (
                  <p className="mx-auto max-w-lg text-[11px] text-muted-foreground/90 pt-1">
                    Paket Starter gratis hanya memiliki akses <strong>Brankas Lokal</strong>. Untuk mulai menyinkronkan data antar-perangkat secara otomatis ke server cloud, silakan pilih paket berlangganan di bawah:
                  </p>
                )}

                {/* Billing Cycle Pill Toggle */}
                <div className="pt-3 flex justify-center">
                  <div className="inline-flex items-center rounded-full bg-[#0a1216] p-1 border border-teal-500/30">
                    <button
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                        billingCycle === "monthly"
                          ? "bg-teal-900/60 text-teal-200 font-semibold shadow-sm border border-teal-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setBillingCycle("monthly")}
                      type="button"
                    >
                      Monthly
                    </button>
                    <button
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5",
                        billingCycle === "annual"
                          ? "bg-teal-900/60 text-teal-200 font-semibold shadow-sm border border-teal-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setBillingCycle("annual")}
                      type="button"
                    >
                      <span>Annual</span>
                      <span className="text-teal-400 font-bold text-[11px]">
                        • up to 33% off
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Pricing Cards (Pro, Team, Business) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. PRO PLAN CARD */}
                <div
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-5 transition-all bg-[#0a0f14]/80 backdrop-blur-sm",
                    activeTier === "pro"
                      ? "border-teal-500 ring-1 ring-teal-500/50 shadow-lg shadow-teal-500/15"
                      : "border-teal-500/20 hover:border-teal-500/40"
                  )}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-base">Pro</h3>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          US${billingCycle === "annual" ? SUBSCRIPTION_PLANS.pro.annualMonthlyRate : SUBSCRIPTION_PLANS.pro.monthlyRate}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {billingCycle === "annual"
                          ? "per month • billed annually"
                          : "per month • billed monthly"}
                      </p>
                    </div>

                    <Button
                      className={cn(
                        "w-full text-xs font-semibold h-9 rounded-lg transition-all",
                        activeTier === "pro"
                          ? "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/40"
                          : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/40"
                      )}
                      disabled={isUpgrading}
                      onClick={() => handleSelectPlan("pro")}
                    >
                      {activeTier === "pro" ? (
                        <>
                          <Check className="mr-1.5 size-3.5" />
                          Active Plan
                        </>
                      ) : (
                        <>
                          Buy Pro <ExternalLink className="ml-1 size-3" />
                        </>
                      )}
                    </Button>

                    <div className="space-y-2 pt-2 border-t border-teal-500/15">
                      <p className="text-xs text-muted-foreground font-medium">Includes:</p>
                      <ul className="space-y-2 text-xs text-foreground/90">
                        {SUBSCRIPTION_PLANS.pro.features.map((feat) => (
                          <li className="flex items-start gap-2" key={feat}>
                            <span className="text-teal-400 text-sm leading-none">•</span>
                            <span className="text-[11px] leading-relaxed">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 2. TEAM PLAN CARD */}
                <div
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-5 transition-all bg-[#0a0f14]/80 backdrop-blur-sm",
                    activeTier === "team"
                      ? "border-teal-500 ring-1 ring-teal-500/50 shadow-lg shadow-teal-500/15"
                      : "border-teal-500/20 hover:border-teal-500/40"
                  )}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-base">Team</h3>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          US${billingCycle === "annual" ? SUBSCRIPTION_PLANS.team.annualMonthlyRate : SUBSCRIPTION_PLANS.team.monthlyRate}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {billingCycle === "annual"
                          ? "per seat/month • billed annually"
                          : "per seat/month • billed monthly"}
                      </p>
                    </div>

                    <Button
                      className={cn(
                        "w-full text-xs font-semibold h-9 rounded-lg transition-all",
                        activeTier === "team"
                          ? "bg-teal-600 hover:bg-teal-500 text-white"
                          : "bg-[#111922] hover:bg-[#1a2530] text-foreground border border-teal-500/20"
                      )}
                      disabled={isUpgrading}
                      onClick={() => handleSelectPlan("team")}
                    >
                      {activeTier === "team" ? (
                        <>
                          <Check className="mr-1.5 size-3.5" />
                          Active Plan
                        </>
                      ) : (
                        "Try free for 14 days"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        className="text-[11px] text-muted-foreground hover:text-teal-300 underline decoration-muted-foreground/50 transition-colors"
                        onClick={() => toast.info("Tim enterprise sales kami siap membantu Anda.")}
                        type="button"
                      >
                        get a quote
                      </button>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-teal-500/15">
                      <p className="text-xs text-muted-foreground font-medium">Everything in Pro, plus:</p>
                      <ul className="space-y-2 text-xs text-foreground/90">
                        {SUBSCRIPTION_PLANS.team.features.map((feat) => (
                          <li className="flex items-start gap-2" key={feat}>
                            <span className="text-teal-400 text-sm leading-none">•</span>
                            <span className="text-[11px] leading-relaxed">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 3. BUSINESS PLAN CARD */}
                <div
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-5 transition-all bg-[#0a0f14]/80 backdrop-blur-sm relative",
                    activeTier === "business"
                      ? "border-amber-500/80 ring-1 ring-amber-500/40 shadow-xl shadow-amber-500/10"
                      : "border-teal-500/20 hover:border-teal-500/40"
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-base">Business</h3>
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                        ENTERPRISE
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          US${billingCycle === "annual" ? SUBSCRIPTION_PLANS.business.annualMonthlyRate : SUBSCRIPTION_PLANS.business.monthlyRate}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {billingCycle === "annual"
                          ? "per seat/month • billed annually"
                          : "per seat/month • billed monthly"}
                      </p>
                    </div>

                    <Button
                      className={cn(
                        "w-full text-xs font-semibold h-9 rounded-lg transition-all",
                        activeTier === "business"
                          ? "bg-teal-600 hover:bg-teal-500 text-white"
                          : "bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-600/20"
                      )}
                      disabled={isUpgrading}
                      onClick={() => handleSelectPlan("business")}
                    >
                      {activeTier === "business" ? (
                        <>
                          <Check className="mr-1.5 size-3.5" />
                          Active Business Plan
                        </>
                      ) : (
                        "Try free for 14 days"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        className="text-[11px] text-muted-foreground hover:text-teal-300 underline decoration-muted-foreground/50 transition-colors"
                        onClick={() => toast.info("Tim enterprise sales kami siap memberikan penawaran khusus.")}
                        type="button"
                      >
                        get a quote
                      </button>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-teal-500/15">
                      <p className="text-xs text-muted-foreground font-medium">Everything in Team, plus:</p>
                      <ul className="space-y-2 text-xs text-foreground/90">
                        {SUBSCRIPTION_PLANS.business.features.slice(0, 2).map((feat) => (
                          <li className="flex items-start gap-2" key={feat}>
                            <span className="text-amber-400 text-sm leading-none">•</span>
                            <span className="text-[11px] leading-relaxed">{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2">
                        <p className="text-[11px] text-muted-foreground font-medium">Available add-ons:</p>
                        <p className="text-[11px] text-foreground/90 flex items-center gap-1.5 mt-1">
                          <span className="text-amber-400">•</span> SAML SSO
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTH AKUN PELANGGAN */}
          {activeTab === "auth" && (
            <div className="space-y-4">
              {config.userEmail ? (
                <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex size-11 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        <User className="size-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {config.userName || "Pelanggan Cloud"}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          {config.userEmail} (ID: {config.userId || "usr_pro"})
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="inline-block rounded bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 font-bold font-mono text-[10px] text-teal-300 uppercase">
                            PLAN: {activeTier} ({activeCycle})
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Maks {config.maxVaults || 50} Vaults Cloud
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      onClick={logout}
                      size="sm"
                      variant="outline"
                    >
                      <LogOut className="mr-1.5 size-3.5" />
                      Keluar (Logout)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick Seeded Accounts Helper */}
                  <div className="rounded-xl border border-teal-500/20 bg-[#0a0f14]/70 p-4.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1.5">
                      <Sparkles className="size-4 text-teal-400" />
                      <span>Akun Uji Coba Cepat (Tersedia di Cloud)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      Klik salah satu akun di bawah ini untuk langsung masuk dengan hak akses cloud:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <button
                        className="flex flex-col text-left p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all text-xs"
                        onClick={() => handleQuickLogin("business@xphpmyadmin.dev")}
                        type="button"
                      >
                        <span className="font-bold text-amber-300">Business Cloud User</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">business@xphpmyadmin.dev</span>
                        <span className="text-[9px] text-amber-400 mt-1.5 font-medium">Status: Business • Annual (50 Vaults)</span>
                      </button>

                      <button
                        className="flex flex-col text-left p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-xs"
                        onClick={() => handleQuickLogin("team@xphpmyadmin.dev")}
                        type="button"
                      >
                        <span className="font-bold text-blue-300">Team Cloud User</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">team@xphpmyadmin.dev</span>
                        <span className="text-[9px] text-blue-400 mt-1.5 font-medium">Status: Team • Monthly (20 Vaults)</span>
                      </button>

                      <button
                        className="flex flex-col text-left p-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 transition-all text-xs"
                        onClick={() => handleQuickLogin("pro@xphpmyadmin.dev")}
                        type="button"
                      >
                        <span className="font-bold text-teal-300">Pro Developer User</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">pro@xphpmyadmin.dev</span>
                        <span className="text-[9px] text-teal-400 mt-1.5 font-medium">Status: Pro • Annual (10 Vaults)</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Login / Register Form */}
                  <div className="mx-auto max-w-md rounded-xl border border-teal-500/20 bg-[#0a0f14]/80 p-5">
                    <div className="flex rounded-lg border border-teal-500/20 bg-background/60 p-1">
                      <button
                        className={cn(
                          "flex-1 rounded-md py-1.5 font-medium text-xs transition-colors",
                          authMode === "login"
                            ? "bg-teal-600 text-white font-semibold shadow-xs shadow-teal-950/50"
                            : "text-muted-foreground hover:text-teal-300"
                        )}
                        onClick={() => setAuthMode("login")}
                        type="button"
                      >
                        Masuk (Login)
                      </button>
                      <button
                        className={cn(
                          "flex-1 rounded-md py-1.5 font-medium text-xs transition-colors",
                          authMode === "register"
                            ? "bg-teal-600 text-white font-semibold shadow-xs shadow-teal-950/50"
                            : "text-muted-foreground hover:text-teal-300"
                        )}
                        onClick={() => setAuthMode("register")}
                        type="button"
                      >
                        Daftar Akun Baru
                      </button>
                    </div>

                    <form className="mt-4 space-y-3.5" onSubmit={handleAuthSubmit}>
                      {authMode === "register" && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Nama Lengkap
                          </label>
                          <Input
                            className="border-border/80 bg-background/80 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Nama Anda"
                            value={authName}
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Alamat Email
                        </label>
                        <Input
                          className="border-border/80 bg-background/80 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="user@example.com"
                          type="email"
                          value={authEmail}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Kata Sandi
                        </label>
                        <Input
                          className="border-border/80 bg-background/80 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          type="password"
                          value={authPassword}
                        />
                      </div>

                      <Button
                        className="mt-2 w-full text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/50"
                        disabled={isAuthLoading}
                        type="submit"
                      >
                        {authMode === "login" ? (
                          <>
                            <LogIn className="mr-1.5 size-3.5" />
                            {isAuthLoading ? "Memverifikasi..." : "Masuk ke Akun Cloud"}
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-1.5 size-3.5" />
                            {isAuthLoading ? "Mendaftarkan..." : "Daftar Akun Cloud Business"}
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: JURNAL AKTIVITAS */}
          {activeTab === "journal" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "Semua" },
                    { id: "database", label: "Database" },
                    { id: "table", label: "Tabel & Pemeliharaan" },
                    { id: "export_import", label: "Ekspor/Impor" },
                    { id: "routine", label: "Rutinitas/Trigger" },
                    { id: "data", label: "Manipulasi Data" },
                  ].map((cat) => (
                    <button
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs transition-colors",
                        categoryFilter === cat.id
                          ? "bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40 shadow-xs shadow-teal-950/40"
                          : "border border-border/70 bg-muted/20 text-muted-foreground hover:text-teal-200 hover:bg-teal-500/5"
                      )}
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      type="button"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {activeTier !== "free" ? (
                    <Button
                      className="h-8 text-xs font-semibold border-teal-500/40 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-all"
                      disabled={isSyncing}
                      onClick={handleTriggerPush}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw
                        className={cn(
                          "mr-1.5 size-3.5",
                          isSyncing && "animate-spin"
                        )}
                      />
                      {pendingCount > 0
                        ? `Sinkronkan Manual (${pendingCount} tertunda)`
                        : "Sinkronkan Manual"}
                    </Button>
                  ) : (
                    <Button
                      className="h-8 text-xs font-medium border-border/70 text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveTab("pricing")}
                      size="sm"
                      variant="ghost"
                    >
                      <Lock className="mr-1.5 size-3 text-amber-400" />
                      Sinkron Cloud (Perlu Langganan)
                    </Button>
                  )}
                  <Button
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={clearJournal}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="mr-1 size-3" />
                    Bersihkan Jurnal
                  </Button>
                </div>
              </div>

              {filteredJournal.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-teal-500/20 border-dashed py-14 text-center">
                  <History className="size-8 text-muted-foreground/40" />
                  <p className="mt-2.5 font-medium text-foreground text-xs">
                    Belum ada riwayat aktivitas tercatat
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Aksi yang Anda lakukan di database akan dicatat otomatis di sini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-teal-500/10 rounded-xl border border-teal-500/20 bg-[#0a0f14]/80">
                  {filteredJournal.slice(0, 50).map((entry) => (
                    <div
                      className="flex flex-col gap-1.5 p-3.5 text-xs"
                      key={entry.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase font-semibold",
                              entry.category === "database" &&
                              "bg-teal-500/15 text-teal-300 border border-teal-500/30",
                              entry.category === "table" &&
                              "bg-blue-500/10 text-blue-400 border border-blue-500/30",
                              entry.category === "export_import" &&
                              "bg-purple-500/10 text-purple-400 border border-purple-500/30",
                              entry.category === "routine" &&
                              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                              entry.category === "data" &&
                              "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            )}
                          >
                            {entry.category}
                          </span>
                          <span className="font-semibold text-foreground">
                            {entry.action}
                          </span>
                          {(entry.database || entry.table) && (
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {entry.database}
                              {entry.table ? `.${entry.table}` : ""}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-mono text-[9px] font-medium",
                              entry.syncStatus === "synced"
                                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                            )}
                          >
                            {entry.syncStatus}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <pre className="overflow-x-auto rounded-lg border border-border/50 bg-[#07080a] p-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: JSON SNAPSHOT */}
          {activeTab === "json_snapshot" && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-foreground text-xs">
                    Snapshot Serialisasi JSON Lengkap (Format Cloud)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Data dikirimkan ke tabel penyimpanan profil melalui endpoint <code>POST /api/sync/push</code>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
                    onClick={handleCopyJson}
                    size="sm"
                    variant="outline"
                  >
                    {copied ? (
                      <Check className="mr-1.5 size-3.5 text-teal-400" />
                    ) : (
                      <Copy className="mr-1.5 size-3.5" />
                    )}
                    {copied ? "Tersalin!" : "Salin JSON"}
                  </Button>
                  <Button
                    className="border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
                    onClick={handleDownloadJson}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Unduh Berkas .json
                  </Button>
                </div>
              </div>

              <div className="relative rounded-xl border border-teal-500/20 bg-[#06090d] p-3.5">
                <pre className="max-h-90 overflow-auto font-mono text-teal-400 text-xs leading-relaxed select-all">
                  {liveJsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 6: RESTORE DARI JSON */}
          {activeTab === "restore" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground text-xs">
                  Pulihkan Profil & Konfigurasi dari Berkas / JSON Cloud
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tempelkan isi JSON snapshot cadangan Anda untuk memulihkan host dan pengaturan secara lokal.
                </p>
              </div>

              <textarea
                className="h-48 w-full rounded-xl border border-teal-500/20 bg-[#06090d] p-3.5 font-mono text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none"
                onChange={(e) => setRestoreJsonInput(e.target.value)}
                placeholder='{"metadata": ..., "profiles": [...], ...}'
                value={restoreJsonInput}
              />

              <div className="flex justify-end">
                <Button
                  className="bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md shadow-teal-950/50"
                  disabled={isRestoring || !restoreJsonInput.trim()}
                  onClick={handleApplyRestore}
                  size="sm"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  {isRestoring
                    ? "Memulihkan..."
                    : "Validasi & Terapkan Pemulihan"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal - Teal Accent Theme */}
        <div className="flex items-center justify-between border-t border-teal-500/15 bg-[#070a0e] px-6 py-3.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Server className="size-3.5 text-teal-400" />
            <span>
              Layanan: <strong className="text-teal-300">xphpMyAdmin Cloud</strong> (Neon Serverless PostgreSQL)
            </span>
          </div>

          <Button
            className="border-teal-500/25 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
            onClick={onClose}
            size="sm"
            variant="outline"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
