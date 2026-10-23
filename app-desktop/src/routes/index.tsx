import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  Code2,
  Columns,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  Filter,
  Key,
  Layers,
  Menu,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Table as TableIcon,
  Terminal,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  type DiagnosticStage,
  type Profile,
  passwordActionSchema,
  profileSchema,
} from "@/types/connection";
import { cn } from "@/utils/tailwind";

// Mock dataset profil koneksi tersimpan
const INITIAL_PROFILES: Profile[] = [
  {
    connection_revision: 2,
    created_at: "2026-10-22T10:00:00.000000Z",
    database: "ecommerce_core",
    environment: "Production",
    favorite: true,
    has_saved_password: true,
    host: "db-primary.production.internal",
    id: "e4a1b2c3-1111-4444-8888-123456789abc",
    last_used_at: "2026-10-23T23:15:00.000000Z",
    method: "direct",
    name: "Production Ecommerce Cluster",
    port: 3306,
    ssh: null,
    tls: {
      ca: "/etc/ssl/certs/prod-ca.pem",
      cert: null,
      enabled: true,
      key: null,
      verify: true,
    },
    updated_at: "2026-10-23T14:30:00.000000Z",
    username: "app_admin",
  },
  {
    connection_revision: 1,
    created_at: "2026-10-21T08:00:00.000000Z",
    database: "auth_v2",
    environment: "Staging",
    favorite: true,
    has_saved_password: false,
    host: "10.0.4.15",
    id: "f5b2c3d4-2222-4444-8888-23456789abcd",
    last_used_at: "2026-10-23T20:45:00.000000Z",
    method: "ssh",
    name: "Staging API & Auth Database",
    port: 3306,
    ssh: {
      host: "bastion.staging.dev",
      key: "~/.ssh/id_ed25519",
      port: 22,
      username: "ubuntu",
    },
    tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
    updated_at: "2026-10-22T11:20:00.000000Z",
    username: "staging_user",
  },
  {
    connection_revision: 1,
    created_at: "2026-10-20T09:00:00.000000Z",
    database: "local_dev",
    environment: "Local",
    favorite: false,
    has_saved_password: true,
    host: "127.0.0.1",
    id: "a1c3d4e5-3333-4444-8888-3456789abcde",
    last_used_at: "2026-10-24T00:50:00.000000Z",
    method: "direct",
    name: "Localhost Docker MariaDB 11.4",
    port: 3307,
    ssh: null,
    tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
    updated_at: "2026-10-20T09:00:00.000000Z",
    username: "root",
  },
  {
    connection_revision: 1,
    created_at: "2026-10-19T14:00:00.000000Z",
    database: "data_warehouse",
    environment: "Other",
    favorite: false,
    has_saved_password: false,
    host: "analytics-replica.internal",
    id: "b2d4e5f6-4444-4444-8888-456789abcdef",
    last_used_at: null,
    method: "direct",
    name: "Analytics Replica (Read-Only)",
    port: 3306,
    ssh: null,
    tls: { ca: null, cert: null, enabled: true, key: null, verify: true },
    updated_at: "2026-10-21T16:10:00.000000Z",
    username: "bi_analyst",
  },
];

// Mock Schema Tables untuk Workspace Tab Aktif
const MOCK_TABLES = [
  { name: "orders", rows: 84200, size: "14.2 MB" },
  { name: "order_items", rows: 215800, size: "28.5 MB" },
  { name: "users", rows: 12450, size: "3.1 MB" },
  { name: "products", rows: 1420, size: "1.8 MB" },
  { name: "payments", rows: 63100, size: "11.4 MB" },
  { name: "migrations", rows: 42, size: "16 KB" },
];

const MOCK_ROWS_ORDERS = [
  {
    id: 10482,
    order_no: "ORD-2026-9921",
    customer: "Ahmad Fauzi",
    total: "Rp 1.450.000",
    status: "PAID",
    created_at: "2026-10-24 01:30:12",
  },
  {
    id: 10481,
    order_no: "ORD-2026-9920",
    customer: "Siti Rahma",
    total: "Rp 320.000",
    status: "PAID",
    created_at: "2026-10-24 01:25:05",
  },
  {
    id: 10480,
    order_no: "ORD-2026-9919",
    customer: "Budi Santoso",
    total: "Rp 850.000",
    status: "PENDING",
    created_at: "2026-10-24 01:14:40",
  },
  {
    id: 10479,
    order_no: "ORD-2026-9918",
    customer: "Dewi Lestari",
    total: "Rp 2.100.000",
    status: "PAID",
    created_at: "2026-10-24 00:58:33",
  },
  {
    id: 10478,
    order_no: "ORD-2026-9917",
    customer: "Eko Prasetyo",
    total: "Rp 475.000",
    status: "FAILED",
    created_at: "2026-10-24 00:42:19",
  },
  {
    id: 10477,
    order_no: "ORD-2026-9916",
    customer: "Rina Kusuma",
    total: "Rp 1.250.000",
    status: "PAID",
    created_at: "2026-10-24 00:15:02",
  },
];

function HomePage() {
  // State profil & daftar server
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_PROFILES[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dynamic Tabs Bar
  const [activeTabs, setActiveTabs] = useState<
    Array<{ id: string; name: string; env: string; profileId?: string }>
  >([{ env: "Local", id: "tab-home", name: "Pengelola Koneksi" }]);
  const [activeTabId, setActiveTabId] = useState("tab-home");

  // State form inspector kanan
  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedId) || profiles[0],
    [profiles, selectedId]
  );
  const [editForm, setEditForm] = useState<Profile>({ ...selectedProfile });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAction, setPasswordAction] = useState<
    "keep" | "replace" | "remove"
  >("keep");
  const [passwordInput, setPasswordInput] = useState("");

  // State tes diagnostik 4 tahap
  const [isTesting, setIsTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticStage[] | null>(
    null
  );
  const [sshTrustStatus, setSshTrustStatus] = useState<
    "trusted" | "unknown" | "changed" | null
  >(null);

  // State workspace database aktif
  const [selectedTable, setSelectedTable] = useState("orders");
  const [sqlQuery, setSqlQuery] = useState(
    "SELECT * FROM `orders` ORDER BY `id` DESC LIMIT 25;"
  );
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [tableSearch, setTableSearch] = useState("");

  // Handler ganti profil terpilih
  const handleSelectHost = (profile: Profile) => {
    setSelectedId(profile.id);
    setEditForm({ ...profile });
    setPasswordAction("keep");
    setPasswordInput("");
    setDiagnostics(null);
  };

  // Toggle bintang favorit
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
    if (selectedId === id) {
      setEditForm((prev) => ({ ...prev, favorite: !prev.favorite }));
    }
    toast.success("Status favorit diperbarui");
  };

  // Filter profil
  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        if (favoritesOnly && !p.favorite) {
          return false;
        }
        if (!searchQuery.trim()) {
          return true;
        }
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.host.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (!(a.last_used_at || b.last_used_at)) {
          return 0;
        }
        if (!a.last_used_at) {
          return 1;
        }
        if (!b.last_used_at) {
          return -1;
        }
        return (
          new Date(b.last_used_at).getTime() -
          new Date(a.last_used_at).getTime()
        );
      });
  }, [profiles, searchQuery, favoritesOnly, sortBy]);

  // Tambah host baru
  const handleAddNewHost = () => {
    const newHost: Profile = {
      connection_revision: 1,
      created_at: new Date().toISOString(),
      database: "",
      environment: "Local",
      favorite: false,
      has_saved_password: false,
      host: "127.0.0.1",
      id: crypto.randomUUID(),
      last_used_at: null,
      method: "direct",
      name: "Koneksi Database Baru",
      port: 3306,
      ssh: null,
      tls: { ca: null, cert: null, enabled: true, key: null, verify: true },
      updated_at: new Date().toISOString(),
      username: "root",
    };
    setProfiles([newHost, ...profiles]);
    handleSelectHost(newHost);
    toast.info("Draft koneksi baru dibuat", {
      description: "Lengkapi parameter lalu simpan.",
    });
  };

  // EKSEKUSI ATURAN: Validasi Zod penuh sebelum menyimpan profil
  const handleSaveProfile = () => {
    const candidatePayload = {
      ...editForm,
      port: Number(editForm.port),
      updated_at: new Date().toISOString(),
    };

    // 1. Validasi Zod Profile Schema
    const profileValidation = profileSchema.safeParse(candidatePayload);
    if (!profileValidation.success) {
      const issue = profileValidation.error.issues[0];
      const pathName = issue?.path.join(".") || "Form";
      toast.error("Validasi Profil Gagal (Zod Invariant)", {
        description: `${pathName}: ${issue?.message || "Data tidak valid"}`,
      });
      return;
    }

    // 2. Validasi Password Lifecycle Schema bila mode replace
    if (passwordAction === "replace") {
      const passValidation = passwordActionSchema.safeParse({
        action: "replace",
        password: passwordInput,
      });
      if (!passValidation.success) {
        toast.error("Validasi Password Gagal", {
          description: passValidation.error.issues[0]?.message || "Password kosong",
        });
        return;
      }
    }

    // Update state profil tervalidasi
    const validatedData = profileValidation.data;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === validatedData.id
          ? {
              ...validatedData,
              has_saved_password:
                passwordAction === "replace"
                  ? true
                  : passwordAction === "remove"
                    ? false
                    : p.has_saved_password,
            }
          : p
      )
    );

    toast.success("Profil Berhasil Divalidasi & Disimpan", {
      description: `${validatedData.name} (${validatedData.host}:${validatedData.port}) tersimpan di SQLite`,
    });
  };

  // EKSEKUSI ATURAN: Tes Diagnostik 4-Tahap
  const handleTestConnection = async () => {
    setIsTesting(true);
    setDiagnostics([
      { duration_ms: 0, stage: "local_validation", status: "running" },
      { duration_ms: 0, stage: "ssh_trust", status: "pending" },
      {
        duration_ms: 0,
        stage: "ssh_authentication_forwarding",
        status: "pending",
      },
      {
        duration_ms: 0,
        stage: "mysql_tls_authentication_initial_database",
        status: "pending",
      },
    ]);

    // Tahap 1: Validasi Lokal
    await new Promise((r) => setTimeout(r, 220));
    setDiagnostics((prev) => [
      { duration_ms: 18, stage: "local_validation", status: "passed" },
      {
        duration_ms: 0,
        stage: "ssh_trust",
        status: editForm.method === "ssh" ? "running" : "skipped",
      },
      {
        duration_ms: 0,
        stage: "ssh_authentication_forwarding",
        status: "pending",
      },
      {
        duration_ms: 0,
        stage: "mysql_tls_authentication_initial_database",
        status: "pending",
      },
    ]);

    // Tahap 2 & 3: SSH (Bila aktif)
    if (editForm.method === "ssh") {
      await new Promise((r) => setTimeout(r, 350));
      setDiagnostics([
        { duration_ms: 18, stage: "local_validation", status: "passed" },
        { duration_ms: 112, stage: "ssh_trust", status: "passed" },
        {
          duration_ms: 0,
          stage: "ssh_authentication_forwarding",
          status: "running",
        },
        {
          duration_ms: 0,
          stage: "mysql_tls_authentication_initial_database",
          status: "pending",
        },
      ]);

      await new Promise((r) => setTimeout(r, 380));
      setDiagnostics([
        { duration_ms: 18, stage: "local_validation", status: "passed" },
        { duration_ms: 112, stage: "ssh_trust", status: "passed" },
        {
          duration_ms: 165,
          stage: "ssh_authentication_forwarding",
          status: "passed",
        },
        {
          duration_ms: 0,
          stage: "mysql_tls_authentication_initial_database",
          status: "running",
        },
      ]);
    }

    // Tahap 4: MySQL TLS & Initial DB
    await new Promise((r) => setTimeout(r, 420));
    setDiagnostics([
      { duration_ms: 18, stage: "local_validation", status: "passed" },
      {
        duration_ms: editForm.method === "ssh" ? 112 : 0,
        stage: "ssh_trust",
        status: editForm.method === "ssh" ? "passed" : "skipped",
      },
      {
        duration_ms: editForm.method === "ssh" ? 165 : 0,
        stage: "ssh_authentication_forwarding",
        status: editForm.method === "ssh" ? "passed" : "skipped",
      },
      {
        duration_ms: 54,
        stage: "mysql_tls_authentication_initial_database",
        status: "passed",
      },
    ]);
    setIsTesting(false);
    toast.success("Diagnostik 4-Tahap Lolos 100%", {
      description: `MySQL 8.4 • Latensi: 24ms • TLS: ${editForm.tls.enabled ? "TLSv1.3 (Cipher: AES_256_GCM)" : "Non-TLS"}`,
    });
  };

  // Periksa SSH Host Key
  const handleInspectSshKey = async () => {
    toast.info("Memindai Host Key SSH...", {
      description: `Target: ${editForm.ssh?.host || "bastion.internal"}`,
    });
    await new Promise((r) => setTimeout(r, 500));
    setSshTrustStatus("trusted");
    toast.success("Host Key SSH Terverifikasi", {
      description: "Algoritma: ssh-ed25519 • Fingerprint: SHA256:7uK2Z9jH4wQ8xP3v1Lm0",
    });
  };

  // EKSEKUSI ATURAN: Buka Sesi Tab Terisolasi
  const handleConnect = (targetProfile?: Profile) => {
    const prof = targetProfile || editForm;
    const newTabId = `tab-${prof.id}`;

    // Cek apakah tab sudah ada
    const existing = activeTabs.find((t) => t.id === newTabId);
    if (existing) {
      setActiveTabId(newTabId);
      toast.info(`Beralih ke tab aktif: ${prof.name}`);
      return;
    }

    const newTab = {
      env: prof.environment,
      id: newTabId,
      name: prof.name,
      profileId: prof.id,
    };
    setActiveTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);

    // Update last_used_at
    const nowIso = new Date().toISOString();
    setProfiles((prev) =>
      prev.map((p) => (p.id === prof.id ? { ...p, last_used_at: nowIso } : p))
    );
    if (prof.id === editForm.id) {
      setEditForm((prev) => ({ ...prev, last_used_at: nowIso }));
    }

    toast.success(`Koneksi Terhubung: ${prof.name}`, {
      description: "Sesi terisolasi aktif. Membuka SQL Studio Workspace.",
    });
  };

  // Tutup Tab
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId === "tab-home") {
      return;
    }
    setActiveTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId("tab-home");
    }
    toast.info("Sesi koneksi tab ditutup");
  };

  // Eksekusi SQL Query
  const handleExecuteQuery = () => {
    setIsExecutingQuery(true);
    setTimeout(() => {
      setIsExecutingQuery(false);
      toast.success("Query Berhasil Dieksekusi", {
        description: "6 baris dikembalikan dalam 14ms.",
      });
    }, 400);
  };

  const activeConnectedProfile = useMemo(() => {
    const currentTab = activeTabs.find((t) => t.id === activeTabId);
    if (!currentTab || !currentTab.profileId) {
      return null;
    }
    return profiles.find((p) => p.id === currentTab.profileId) || null;
  }, [activeTabs, activeTabId, profiles]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#07080a] font-sans text-[#f4f4f6]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: RAYCAST COMMAND BAR & DYNAMIC TABS                        */}
      {/* ========================================================================= */}
      <header className="flex h-11 shrink-0 select-none items-center justify-between border-b border-[#242728] bg-[#0d0d0d] px-3">
        <div className="no-scrollbar flex max-w-[65%] items-center gap-1.5 overflow-x-auto">
          {/* Sidebar Toggle */}
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#9c9c9d] hover:bg-[#121212] hover:text-white transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <Menu size={15} />
          </button>

          {/* Scope Selector */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#242728] bg-[#101111] px-2 py-0.5 font-medium text-[#57c1ff] text-xs">
            <Layers size={12} />
            <span>Personal</span>
            <ChevronDown className="text-[#6a6b6c]" size={10} />
          </div>

          <div className="mx-1 h-3.5 w-[1px] shrink-0 bg-[#242728]" />

          {/* Dynamic Tabs Bar */}
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            {activeTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const isHome = tab.id === "tab-home";
              return (
                <div
                  role="tab"
                  tabIndex={0}
                  className={cn(
                    "flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-all",
                    isActive
                      ? "border-[#57c1ff]/50 bg-[#121212] text-white shadow-sm"
                      : "border-transparent bg-transparent text-[#9c9c9d] hover:bg-[#101111] hover:text-[#cdcdcd]"
                  )}
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveTabId(tab.id);
                    }
                  }}
                >
                  {isHome ? (
                    <Server className="text-[#57c1ff]" size={12} />
                  ) : (
                    <Database className="text-[#59d499]" size={12} />
                  )}
                  <span className="max-w-[130px] truncate font-medium">
                    {tab.name}
                  </span>
                  {!isHome && (
                    <button
                      type="button"
                      className="ml-1 rounded p-0.5 text-[#6a6b6c] hover:bg-[#242728] hover:text-[#ff6161]"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                    >
                      <XCircle size={12} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Tambah Tab Baru */}
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#6a6b6c] hover:bg-[#121212] hover:text-white transition-colors"
              onClick={handleAddNewHost}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Omni-Search Bar (Raycast Style) */}
        <div className="flex w-72 items-center gap-2 lg:w-96">
          <div className="relative flex w-full items-center">
            <Search className="absolute left-2.5 text-[#6a6b6c]" size={13} />
            <Input
              className="h-7.5 rounded-md border-[#242728] bg-[#101111] pr-28 pl-8 text-[#f4f4f6] text-xs placeholder:text-[#6a6b6c] focus-visible:ring-0 focus-visible:border-white/30"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari host atau user@hostname..."
              value={searchQuery}
            />
            {/* Keycap Raycast */}
            <div className="absolute right-1.5 flex items-center gap-1.5">
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-[#121212] border border-[#242728] text-[#9c9c9d] rounded">
                ⌘K
              </kbd>
              <Button
                className="h-5.5 rounded bg-white px-2 text-[10px] font-semibold text-black hover:bg-[#e8e8e8]"
                onClick={() => handleConnect()}
                size="sm"
              >
                Connect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT: TAMPILAN SESUAI TAB AKTIF                                */}
      {/* ========================================================================= */}
      {activeTabId === "tab-home" ? (
        /* ======================================================================= */
        /* MODE 1: PENGELOLA SERVER PROFIL (RAYCAST DESKTOP HUB)                   */
        /* ======================================================================= */
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* SIDEBAR KIRI */}
          <aside
            className={cn(
              "flex shrink-0 flex-col justify-between border-r border-[#242728] bg-[#0d0d0d] py-2.5 transition-all duration-200",
              isSidebarCollapsed ? "w-12 items-center px-1" : "w-44 px-2"
            )}
          >
            <div className="flex flex-col gap-1">
              {[
                {
                  active: true,
                  icon: Server,
                  id: "hosts",
                  label: "Koneksi (Hosts)",
                },
                { active: false, icon: Key, id: "keychain", label: "Keychain" },
                {
                  active: false,
                  icon: Terminal,
                  id: "tunnels",
                  label: "SSH Tunnels",
                },
                {
                  active: false,
                  icon: FileCode2,
                  id: "snippets",
                  label: "SQL Snippets",
                },
                {
                  active: false,
                  icon: ShieldCheck,
                  id: "known",
                  label: "Known Hosts",
                },
                {
                  active: false,
                  icon: Clock,
                  id: "backup",
                  label: "Backup & Logs",
                },
              ].map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left font-medium text-xs transition-colors",
                      nav.active
                        ? "border border-[#242728] bg-[#121212] text-white"
                        : "text-[#9c9c9d] hover:bg-[#101111] hover:text-[#cdcdcd]"
                    )}
                    key={nav.id}
                  >
                    <Icon
                      className={
                        nav.active ? "text-[#57c1ff]" : "text-[#6a6b6c]"
                      }
                      size={14}
                    />
                    {!isSidebarCollapsed && <span>{nav.label}</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom Settings */}
            <div className="border-t border-[#242728] pt-2">
              <button
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[#9c9c9d] text-xs hover:bg-[#101111] hover:text-white"
              >
                <Settings size={14} />
                {!isSidebarCollapsed && <span>Pengaturan</span>}
              </button>
            </div>
          </aside>

          {/* MAIN GRID VIEW */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#07080a]">
            {/* Toolbar Atas */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#242728] bg-[#07080a] px-4">
              <div className="flex items-center gap-2">
                <Button
                  className="flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 font-semibold text-black text-xs hover:bg-[#e8e8e8]"
                  onClick={handleAddNewHost}
                  size="sm"
                >
                  <Plus size={13} />
                  Tambah Koneksi
                </Button>

                <div className="mx-1 h-3.5 w-[1px] bg-[#242728]" />

                <div className="flex items-center gap-1.5 text-[#9c9c9d] text-xs">
                  <input
                    checked={favoritesOnly}
                    className="rounded border-[#242728] bg-[#121212] text-white focus:ring-0"
                    id="fav-filter"
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    type="checkbox"
                  />
                  <label
                    className="cursor-pointer select-none text-[11px]"
                    htmlFor="fav-filter"
                  >
                    Favorit saja
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#6a6b6c] text-[11px]">Urutkan:</span>
                <Select
                  onValueChange={(val: "recent" | "name") => setSortBy(val)}
                  value={sortBy}
                >
                  <SelectTrigger className="h-7 w-32 border-[#242728] bg-[#101111] text-[#cdcdcd] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#242728] bg-[#101111] text-[#cdcdcd] text-xs">
                    <SelectItem value="recent">Terakhir Digunakan</SelectItem>
                    <SelectItem value="name">Nama Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Container Kartu Server */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="flex items-center justify-between text-xs text-[#9c9c9d]">
                <span>{filteredProfiles.length} koneksi tersimpan</span>
                <span className="text-[11px] text-[#6a6b6c]">
                  Tervalidasi Zod & disimpan aman di SQLite
                </span>
              </div>

              {/* Grid Kartu Server */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredProfiles.map((p) => {
                  const isSelected = p.id === selectedId;
                  const isProd = p.environment === "Production";

                  return (
                    <Card
                      className={cn(
                        "group relative cursor-pointer rounded-lg border border-[#242728] bg-[#0d0d0d] p-3.5 transition-all hover:border-white/20 hover:bg-[#101111]",
                        isSelected &&
                          "border-[#57c1ff] shadow-[0_0_12px_rgba(87,193,255,0.15)] ring-1 ring-[#57c1ff]"
                      )}
                      key={p.id}
                      onClick={() => handleSelectHost(p)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md border",
                              isProd
                                ? "border-[#ff6161]/30 bg-[#ff6161]/10 text-[#ff6161]"
                                : "border-[#242728] bg-[#121212] text-[#57c1ff]"
                            )}
                          >
                            <Database size={15} />
                          </div>
                          <div>
                            <h4 className="flex items-center gap-1.5 font-semibold text-white text-xs tracking-tight transition-colors group-hover:text-[#57c1ff]">
                              {p.name}
                              {isProd && (
                                <ShieldAlert className="text-[#ff6161]" size={11} />
                              )}
                            </h4>
                            <p className="font-mono text-[11px] text-[#9c9c9d]">
                              {p.host}:{p.port}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="p-1 text-[#6a6b6c] transition-colors hover:text-[#ffc533]"
                          onClick={(e) => handleToggleFavorite(p.id, e)}
                        >
                          <Star
                            className={cn(
                              p.favorite && "fill-[#ffc533] text-[#ffc533]"
                            )}
                            size={13}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[#242728] pt-2 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn(
                              "px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide",
                              isProd &&
                                "border-[#ff6161]/30 bg-[#ff6161]/10 text-[#ff6161]",
                              p.environment === "Staging" &&
                                "border-[#ffc533]/30 bg-[#ffc533]/10 text-[#ffc533]",
                              p.environment === "Local" &&
                                "border-[#59d499]/30 bg-[#59d499]/10 text-[#59d499]",
                              p.environment === "Other" &&
                                "border-[#242728] text-[#9c9c9d]"
                            )}
                            variant="outline"
                          >
                            {p.environment}
                          </Badge>
                          <span className="text-[#6a6b6c]">
                            {p.method === "ssh" ? "SSH Tunnel" : "Direct"}
                          </span>
                        </div>

                        <span className="text-[#6a6b6c]">
                          {p.last_used_at ? "Aktif baru-baru ini" : "Belum dibuka"}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RIGHT INSPECTOR PANEL (HOST DETAILS) */}
          <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-[#242728] bg-[#0d0d0d] lg:w-96">
            {/* Header Inspector */}
            <div className="flex items-center justify-between border-b border-[#242728] bg-[#101111] p-3.5">
              <div className="flex items-center gap-2">
                <Database className="text-[#57c1ff]" size={15} />
                <h3 className="font-semibold text-white text-xs uppercase tracking-wide">
                  Host Details
                </h3>
              </div>
              <Badge
                className={cn(
                  "text-[9px] uppercase tracking-wider",
                  editForm.environment === "Production" &&
                    "border-[#ff6161]/30 bg-[#ff6161]/10 text-[#ff6161]"
                )}
              >
                {editForm.environment}
              </Badge>
            </div>

            {/* Isi Form Konfigurasi */}
            <div className="flex-1 space-y-4 p-4 text-xs">
              {/* Nama Host & Environment */}
              <div className="space-y-3">
                <div>
                  <Label className="text-[11px] text-[#9c9c9d]">Nama Profil</Label>
                  <Input
                    className="mt-1 h-7.5 border-[#242728] bg-[#101111] text-xs text-white"
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    value={editForm.name}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-[#9c9c9d]">Environment</Label>
                    <Select
                      onValueChange={(val: any) =>
                        setEditForm({ ...editForm, environment: val })
                      }
                      value={editForm.environment}
                    >
                      <SelectTrigger className="mt-1 h-7.5 border-[#242728] bg-[#101111] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#242728] bg-[#101111] text-xs">
                        <SelectItem value="Local">Local</SelectItem>
                        <SelectItem value="Staging">Staging</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-[#9c9c9d]">Metode Koneksi</Label>
                    <Select
                      onValueChange={(val: "direct" | "ssh") =>
                        setEditForm({
                          ...editForm,
                          method: val,
                          ssh:
                            val === "ssh"
                              ? editForm.ssh || {
                                  host: "bastion.internal",
                                  key: "~/.ssh/id_rsa",
                                  port: 22,
                                  username: "ssh_user",
                                }
                              : null,
                        })
                      }
                      value={editForm.method}
                    >
                      <SelectTrigger className="mt-1 h-7.5 border-[#242728] bg-[#101111] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#242728] bg-[#101111] text-xs">
                        <SelectItem value="direct">Direct (Langsung)</SelectItem>
                        <SelectItem value="ssh">SSH Tunnel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Target MySQL Server */}
              <div className="rounded-lg border border-[#242728] bg-[#101111] p-3 space-y-2.5">
                <h4 className="font-semibold text-white text-[11px]">
                  Server Database MySQL
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-[10px] text-[#9c9c9d]">Hostname / IP</Label>
                    <Input
                      className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                      onChange={(e) =>
                        setEditForm({ ...editForm, host: e.target.value })
                      }
                      value={editForm.host}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-[#9c9c9d]">Port</Label>
                    <Input
                      className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          port: parseInt(e.target.value, 10) || 3306,
                        })
                      }
                      type="number"
                      value={editForm.port}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-[#9c9c9d]">Username</Label>
                    <Input
                      className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      value={editForm.username}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-[#9c9c9d]">Database Awal</Label>
                    <Input
                      className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                      onChange={(e) =>
                        setEditForm({ ...editForm, database: e.target.value })
                      }
                      placeholder="(Opsional)"
                      value={editForm.database || ""}
                    />
                  </div>
                </div>
              </div>

              {/* SSH Tunnel Options */}
              {editForm.method === "ssh" && (
                <div className="rounded-lg border border-[#a78bfa]/30 bg-[#a78bfa]/5 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-semibold text-[#a78bfa] text-[11px]">
                      <Terminal size={12} />
                      Bastion SSH Tunnel
                    </h4>
                    <Button
                      className="h-5 rounded px-2 text-[10px] text-white hover:bg-[#a78bfa]/20"
                      onClick={handleInspectSshKey}
                      size="sm"
                      variant="ghost"
                    >
                      Pindai Host Key
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label className="text-[10px] text-[#9c9c9d]">SSH Host</Label>
                      <Input
                        className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            ssh: {
                              ...editForm.ssh!,
                              host: e.target.value,
                            },
                          })
                        }
                        value={editForm.ssh?.host || ""}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#9c9c9d]">SSH Port</Label>
                      <Input
                        className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            ssh: {
                              ...editForm.ssh!,
                              port: parseInt(e.target.value, 10) || 22,
                            },
                          })
                        }
                        type="number"
                        value={editForm.ssh?.port || 22}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] text-[#9c9c9d]">SSH Private Key</Label>
                    <Input
                      className="mt-1 h-7 border-[#242728] bg-[#07080a] text-xs font-mono"
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          ssh: {
                            ...editForm.ssh!,
                            key: e.target.value,
                          },
                        })
                      }
                      value={editForm.ssh?.key || ""}
                    />
                  </div>
                </div>
              )}

              {/* Password Lifecycle Management */}
              <div className="rounded-lg border border-[#242728] bg-[#101111] p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 font-semibold text-white text-[11px]">
                    <Key size={12} className="text-[#57c1ff]" />
                    Siklus Password Vault
                  </h4>
                  <Badge
                    className={cn(
                      "text-[9px] py-0",
                      editForm.has_saved_password
                        ? "border-[#59d499]/30 bg-[#59d499]/10 text-[#59d499]"
                        : "border-[#242728] text-[#9c9c9d]"
                    )}
                    variant="outline"
                  >
                    {editForm.has_saved_password
                      ? "Tersimpan (AES-256)"
                      : "Belum Ada"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(val: any) => setPasswordAction(val)}
                    value={passwordAction}
                  >
                    <SelectTrigger className="h-7 w-32 border-[#242728] bg-[#07080a] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#242728] bg-[#101111] text-xs">
                      <SelectItem value="keep">Pertahankan</SelectItem>
                      <SelectItem value="replace">Ganti Baru</SelectItem>
                      <SelectItem value="remove">Hapus</SelectItem>
                    </SelectContent>
                  </Select>

                  {passwordAction === "replace" ? (
                    <div className="relative flex-1">
                      <Input
                        className="h-7 pr-7 border-[#242728] bg-[#07080a] text-xs"
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Password baru..."
                        type={showPassword ? "text" : "password"}
                        value={passwordInput}
                      />
                      <button
                        className="absolute right-2 top-1.5 text-[#6a6b6c]"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#6a6b6c] italic">
                      {passwordAction === "keep"
                        ? "Password rahasia tersimpan aman di keychain"
                        : "Password akan dihapus dari vault"}
                    </span>
                  )}
                </div>
              </div>

              {/* SSL/TLS Settings */}
              <div className="rounded-lg border border-[#242728] bg-[#101111] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={13} className="text-[#57c1ff]" />
                    <Label className="text-[11px] text-[#cdcdcd]">
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

              {/* Visual Diagnostik 4-Tahap */}
              {diagnostics && (
                <div className="rounded-lg border border-[#242728] bg-[#101111] p-3 space-y-2">
                  <h4 className="font-semibold text-white text-[11px]">
                    Hasil Diagnostik 4-Tahap
                  </h4>
                  <div className="space-y-1.5">
                    {diagnostics.map((d) => (
                      <div
                        className="flex items-center justify-between text-[11px]"
                        key={d.stage}
                      >
                        <span className="text-[#9c9c9d] font-mono capitalize">
                          {d.stage.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {d.status === "passed" && (
                            <span className="text-[#59d499] flex items-center gap-1">
                              <Check size={11} /> {d.duration_ms}ms
                            </span>
                          )}
                          {d.status === "running" && (
                            <span className="text-[#57c1ff] animate-pulse">
                              Menguji...
                            </span>
                          )}
                          {d.status === "skipped" && (
                            <span className="text-[#6a6b6c]">Dilewati</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi Bawah (Raycast High Contrast) */}
            <div className="shrink-0 space-y-2 border-t border-[#242728] bg-[#101111] p-3.5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-7.5 border-[#242728] bg-transparent text-[#cdcdcd] text-xs hover:bg-[#121212] hover:text-white"
                  disabled={isTesting}
                  onClick={handleTestConnection}
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
                  className="h-7.5 bg-white text-black font-semibold text-xs hover:bg-[#e8e8e8]"
                  onClick={handleSaveProfile}
                  size="sm"
                >
                  <Check className="mr-1.5" size={12} />
                  Simpan Profil
                </Button>
              </div>

              <Button
                className="h-8 w-full rounded-md bg-white font-semibold text-black text-xs hover:bg-[#e8e8e8] shadow-sm flex items-center justify-center gap-1"
                onClick={() => handleConnect()}
                size="sm"
              >
                <Zap size={13} className="fill-black" />
                <span>Hubungkan ke Database</span>
                <kbd className="ml-1 px-1 py-0.2 text-[9px] font-mono bg-black/10 rounded">
                  ⌘↵
                </kbd>
              </Button>
            </div>
          </aside>
        </div>
      ) : (
        /* ======================================================================= */
        /* MODE 2: ACTIVE DATABASE WORKSPACE (RAYCAST + SUPABASE SQL STUDIO)       */
        /* ======================================================================= */
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Sub-Sidebar: Schema Explorer & Tabel */}
          <aside className="flex w-60 shrink-0 flex-col border-r border-[#242728] bg-[#0d0d0d]">
            {/* Header Schema Explorer */}
            <div className="flex items-center justify-between border-b border-[#242728] p-3 bg-[#101111]">
              <div className="flex items-center gap-2">
                <Database className="text-[#59d499]" size={14} />
                <span className="font-semibold text-xs text-white truncate">
                  {activeConnectedProfile?.database || "ecommerce_core"}
                </span>
              </div>
              <Badge className="border-[#59d499]/30 bg-[#59d499]/10 text-[#59d499] text-[9px]">
                Active
              </Badge>
            </div>

            {/* Filter Tabel */}
            <div className="p-2 border-b border-[#242728]">
              <div className="relative flex items-center">
                <Search className="absolute left-2 text-[#6a6b6c]" size={11} />
                <Input
                  className="h-6.5 rounded pl-7 pr-2 text-[11px] border-[#242728] bg-[#101111] text-[#cdcdcd] placeholder:text-[#6a6b6c]"
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter tabel..."
                  value={tableSearch}
                />
              </div>
            </div>

            {/* List Tabel */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              <span className="px-2 py-1 text-[10px] font-semibold text-[#6a6b6c] uppercase tracking-wider block">
                Tabel ({MOCK_TABLES.length})
              </span>
              {MOCK_TABLES.filter((t) =>
                t.name.toLowerCase().includes(tableSearch.toLowerCase())
              ).map((tbl) => {
                const isTblSelected = selectedTable === tbl.name;
                return (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                      isTblSelected
                        ? "bg-[#121212] text-white border border-[#242728]"
                        : "text-[#9c9c9d] hover:bg-[#101111] hover:text-[#cdcdcd]"
                    )}
                    key={tbl.name}
                    onClick={() => {
                      setSelectedTable(tbl.name);
                      setSqlQuery(
                        `SELECT * FROM \`${tbl.name}\` ORDER BY \`id\` DESC LIMIT 25;`
                      );
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TableIcon
                        size={13}
                        className={
                          isTblSelected ? "text-[#57c1ff]" : "text-[#6a6b6c]"
                        }
                      />
                      <span className="font-mono text-[11px] truncate">
                        {tbl.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6a6b6c] font-mono">
                      {tbl.rows.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Disconnect Info */}
            <div className="p-2 border-t border-[#242728] bg-[#101111] flex items-center justify-between text-[11px]">
              <span className="text-[#6a6b6c] font-mono">Latensi: 24ms</span>
              <button
                type="button"
                className="text-[#ff6161] hover:underline text-[11px]"
                onClick={() => setActiveTabId("tab-home")}
              >
                Kembali ke Hub
              </button>
            </div>
          </aside>

          {/* Main Studio: SQL Runner + Data Table */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#07080a]">
            {/* Top Workspace Bar */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#242728] bg-[#0d0d0d] px-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-white">
                  {activeConnectedProfile?.name}
                </span>
                <span className="text-[#6a6b6c]">/</span>
                <span className="font-mono text-[#57c1ff]">{selectedTable}</span>
                <Badge
                  className="ml-2 border-[#59d499]/30 bg-[#59d499]/10 text-[#59d499] text-[9px]"
                  variant="outline"
                >
                  MySQL 8.4 TLSv1.3
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="h-6.5 border-[#242728] bg-transparent text-[#cdcdcd] text-[11px] hover:bg-[#121212]"
                  onClick={() => toast.success("Daftar DDL diekspor ke Clipboard")}
                  size="sm"
                  variant="outline"
                >
                  <Copy size={11} className="mr-1" />
                  Salin DDL
                </Button>
                <Button
                  className="h-6.5 border-[#242728] bg-transparent text-[#cdcdcd] text-[11px] hover:bg-[#121212]"
                  onClick={() => toast.success("Mengekspor 6 baris ke CSV")}
                  size="sm"
                  variant="outline"
                >
                  <Download size={11} className="mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* SQL Query Console (Raycast + Supabase Emerald) */}
            <div className="border-b border-[#242728] bg-[#0d0d0d] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#9c9c9d] font-semibold">
                  <Code2 size={13} className="text-[#57c1ff]" />
                  <span>SQL Query Runner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="h-7 bg-[#59d499] text-black font-semibold text-xs hover:bg-[#4bc58c] flex items-center gap-1"
                    disabled={isExecutingQuery}
                    onClick={handleExecuteQuery}
                    size="sm"
                  >
                    <Play size={12} className="fill-black" />
                    <span>{isExecutingQuery ? "Menjalankan..." : "Run Query"}</span>
                    <kbd className="ml-1 px-1 py-0.2 text-[9px] font-mono bg-black/15 rounded">
                      ⌘↵
                    </kbd>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  className="w-full h-18 p-2.5 rounded-md border border-[#242728] bg-[#07080a] text-xs font-mono text-[#57c1ff] focus:outline-none focus:border-white/30 resize-none"
                  onChange={(e) => setSqlQuery(e.target.value)}
                  value={sqlQuery}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6a6b6c]">
                <span>Status: 200 OK • Menampilkan baris dari tabel `{selectedTable}`</span>
                <span className="font-mono">Eksekusi: 14ms</span>
              </div>
            </div>

            {/* Interactive Data Table Grid */}
            <div className="flex-1 overflow-auto bg-[#07080a]">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242728] bg-[#101111] text-[#9c9c9d]">
                    <th className="py-2 px-3 font-medium"># ID</th>
                    <th className="py-2 px-3 font-medium">No. Pesanan</th>
                    <th className="py-2 px-3 font-medium">Pelanggan</th>
                    <th className="py-2 px-3 font-medium">Total Tagihan</th>
                    <th className="py-2 px-3 font-medium">Status Pembayaran</th>
                    <th className="py-2 px-3 font-medium">Waktu Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242728]/50 text-[#cdcdcd]">
                  {MOCK_ROWS_ORDERS.map((row) => (
                    <tr
                      className="hover:bg-[#121212] transition-colors"
                      key={row.id}
                    >
                      <td className="py-2 px-3 text-[#57c1ff] font-semibold">
                        {row.id}
                      </td>
                      <td className="py-2 px-3 text-white">{row.order_no}</td>
                      <td className="py-2 px-3 text-[#cdcdcd]">{row.customer}</td>
                      <td className="py-2 px-3 text-[#f4f4f6] font-semibold">
                        {row.total}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase",
                            row.status === "PAID" &&
                              "bg-[#59d499]/15 text-[#59d499] border border-[#59d499]/25",
                            row.status === "PENDING" &&
                              "bg-[#ffc533]/15 text-[#ffc533] border border-[#ffc533]/25",
                            row.status === "FAILED" &&
                              "bg-[#ff6161]/15 text-[#ff6161] border border-[#ff6161]/25"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#6a6b6c]">{row.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Table Toolbar */}
            <div className="flex h-8 shrink-0 items-center justify-between border-t border-[#242728] bg-[#0d0d0d] px-3 text-[11px] text-[#6a6b6c]">
              <div className="flex items-center gap-3">
                <span>Total 6 baris</span>
                <span>•</span>
                <span>Limit 25 baris</span>
                <span>•</span>
                <span>Charset: utf8mb4_unicode_ci</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-5.5 px-2 text-[10px] border-[#242728] bg-transparent text-[#9c9c9d] hover:bg-[#121212]"
                  size="sm"
                  variant="outline"
                >
                  Halaman 1 dari 1
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
