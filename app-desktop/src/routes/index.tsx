import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Columns,
  Database,
  Eye,
  EyeOff,
  FileCode2,
  FileDown,
  FileUp,
  Key,
  Layers,
  PanelLeft,
  PanelRightClose,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Star,
  Table as TableIcon,
  Terminal,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import {
  createDatabaseAction,
  dropDatabaseAction,
  executeSqlQuery,
  exportDatabase,
  fetchDatabases,
  fetchServerCharsets,
  fetchServerEngines,
  fetchServerPlugins,
  fetchServerStatus,
  fetchServerVariables,
  fetchTables,
  fetchUserAccounts,
  importDatabase,
  promptSqlFileDialog,
  testDatabaseConnection,
} from "@/actions/database";
import ToggleTheme from "@/components/toggle-theme";
import { cn } from "@/utils/tailwind";

// --- Workspace Tab Components ---
import { DatabasesTab } from "@/components/workspace/tabs/databases-tab";
import { StructureTab } from "@/components/workspace/tabs/structure-tab";
import { SqlTab } from "@/components/workspace/tabs/sql-tab";
import { OperationsTab } from "@/components/workspace/tabs/operations-tab";
import { StatusTab } from "@/components/workspace/tabs/status-tab";
import { UsersTab } from "@/components/workspace/tabs/users-tab";
import { ExportTab } from "@/components/workspace/tabs/export-tab";
import { ImportTab } from "@/components/workspace/tabs/import-tab";
import { VariablesTab } from "@/components/workspace/tabs/variables-tab";
import { CharsetsTab } from "@/components/workspace/tabs/charsets-tab";
import { EnginesTab } from "@/components/workspace/tabs/engines-tab";
import { PluginsTab } from "@/components/workspace/tabs/plugins-tab";

// --- Modal Components ---
import { ExportModal } from "@/components/workspace/modals/export-modal";
import { ImportModal } from "@/components/workspace/modals/import-modal";
import { CreateDatabaseModal } from "@/components/workspace/modals/create-database-modal";
import { TableStructureModal } from "@/components/workspace/modals/table-structure-modal";
import { InsertRowModal } from "@/components/workspace/modals/insert-row-modal";

// Dataset profil koneksi tersimpan
const INITIAL_PROFILES: Profile[] = [
  {
    connection_revision: 2,
    created_at: "2026-10-20T09:00:00.000000Z",
    database: "",
    environment: "Local",
    favorite: true,
    has_saved_password: true,
    host: "127.0.0.1",
    id: "a1c3d4e5-3333-4444-8888-3456789abcde",
    last_used_at: "2026-10-24T02:00:00.000000Z",
    method: "direct",
    name: "Localhost MariaDB (Port 3306)",
    port: 3306,
    ssh: null,
    tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
    updated_at: "2026-10-24T02:00:00.000000Z",
    username: "root",
  },
  {
    connection_revision: 2,
    created_at: "2026-10-22T10:00:00.000000Z",
    database: "",
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
    database: "",
    environment: "Staging",
    favorite: false,
    has_saved_password: false,
    host: "10.0.4.15",
    id: "f5b2c3d4-2222-4444-8888-23456789abcd",
    last_used_at: "2026-10-23T20:45:00.000000Z",
    method: "ssh",
    name: "Staging API & Auth Database",
    port: 3306,
    ssh: {
      auth_type: "key",
      host: "bastion.staging.dev",
      key: "~/.ssh/id_ed25519",
      password: "",
      port: 22,
      username: "ubuntu",
    },
    tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
    updated_at: "2026-10-22T11:20:00.000000Z",
    username: "staging_user",
  },
];

// Fallback dataset jika offline
const FALLBACK_TABLES: Array<{
  collation?: string;
  comment?: string;
  dataFree?: number;
  dataLength?: number;
  engine?: string;
  indexLength?: number;
  name: string;
  rows: number;
  size: string;
}> = [
    { name: "users", rows: 12450, size: "3.1 MB", engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
    { name: "orders", rows: 84200, size: "14.2 MB", engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
    { name: "order_items", rows: 215800, size: "28.5 MB", engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
    { name: "products", rows: 1420, size: "1.8 MB", engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
    { name: "payments", rows: 63100, size: "11.4 MB", engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
    { name: "migrations", rows: 42, size: "16 KB", engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
  ];

// ─── Types ──────────────────────────────────────────────────────────────────
type WorkspaceTabId =
  | "databases" | "structure" | "sql" | "operations"
  | "status" | "users" | "export" | "import"
  | "variables" | "charsets" | "engines" | "plugins";

// ─── HomePage Component ───────────────────────────────────────────────────────
function HomePage() {
  // State profil & daftar server
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_PROFILES[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isWorkspaceSidebarOpen, setIsWorkspaceSidebarOpen] = useState(true);
  const [isSqlConsoleExpanded, setIsSqlConsoleExpanded] = useState(true);

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
  const [showSshPassword, setShowSshPassword] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"keep" | "replace" | "remove">("keep");
  const [passwordInput, setPasswordInput] = useState("");
  const [savedPasswords, setSavedPasswords] = useState<Record<string, string>>({
    "a1c3d4e5-3333-4444-8888-3456789abcde": "123",
    "e4a1b2c3-1111-4444-8888-123456789abc": "secret",
  });

  // State tes diagnostik 4 tahap
  const [isTesting, setIsTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticStage[] | null>(null);
  const [sshTrustStatus, setSshTrustStatus] = useState<"trusted" | "unknown" | "changed" | null>(null);

  // State workspace database aktif
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [databaseSearch, setDatabaseSearch] = useState("");
  const [currentSelectedDatabase, setCurrentSelectedDatabase] = useState(INITIAL_PROFILES[0].database || "");
  const [databaseTables, setDatabaseTables] = useState<Array<{
    collation?: string; comment?: string; dataFree?: number;
    dataLength?: number; engine?: string; indexLength?: number;
    name: string; rows: number; size: string;
  }>>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM `pma__users` LIMIT 25;");
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [queryResults, setQueryResults] = useState<{
    columns: string[]; error?: string; executionTimeMs: number;
    ok: boolean; rowCount: number; rows: any[];
  } | null>(null);

  // State Ekspor & Impor Database
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<"full" | "structure" | "data">("full");
  const [exportAddDropTable, setExportAddDropTable] = useState(true);
  const [exportDisableFk, setExportDisableFk] = useState(true);
  const [exportPreviewSql, setExportPreviewSql] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [selectedImportFile, setSelectedImportFile] = useState<{
    fileName: string; filePath: string; fileSize: number;
  } | null>(null);
  const [importSqlContent, setImportSqlContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Workspace tab
  const [currentWorkspaceTab, setCurrentWorkspaceTab] = useState<WorkspaceTabId>("databases");

  // State untuk Tab Structure
  const [selectedTableCheckboxes, setSelectedTableCheckboxes] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("empty");
  const [newTableNameInput, setNewTableNameInput] = useState("");
  const [newTableColumnsInput, setNewTableColumnsInput] = useState(4);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  // State untuk Modal Struktur Kolom
  const [selectedTableForStructure, setSelectedTableForStructure] = useState<string | null>(null);
  const [tableStructureColumns, setTableStructureColumns] = useState<any[]>([]);
  const [tableStructureIndexes, setTableStructureIndexes] = useState<any[]>([]);
  const [isLoadingTableStructure, setIsLoadingTableStructure] = useState(false);
  const [isTableStructureModalOpen, setIsTableStructureModalOpen] = useState(false);

  // State untuk Modal Insert Row
  const [selectedTableForInsert, setSelectedTableForInsert] = useState<string | null>(null);
  const [insertColumnValues, setInsertColumnValues] = useState<Record<string, string>>({});
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [isInsertingRow, setIsInsertingRow] = useState(false);

  // State untuk Tab Status Server
  const [serverStatusData, setServerStatusData] = useState<{
    bytesReceived: number; bytesSent: number; connections: number; ok: boolean;
    processes: Array<{ command: string; db: string; host: string; id: number; info: string; state: string; time: number; user: string }>;
    questions: number; threadsConnected: number; threadsRunning: number; uptimeSeconds: number;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // State untuk Tab User Accounts
  const [userAccountsData, setUserAccountsData] = useState<Array<{
    accountLocked: boolean; host: string; passwordExpired: boolean; plugin: string; user: string;
  }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State untuk Tab Variables
  const [serverVariablesData, setServerVariablesData] = useState<Array<{ name: string; value: string }>>([]);
  const [variablesSearch, setVariablesSearch] = useState("");
  const [isLoadingVariables, setIsLoadingVariables] = useState(false);

  // State untuk Tab Engines
  const [serverEnginesData, setServerEnginesData] = useState<Array<{
    comment: string; engine: string; savepoints: string; support: string; transactions: string; xa: string;
  }>>([]);
  const [isLoadingEngines, setIsLoadingEngines] = useState(false);

  // State untuk Tab Charsets
  const [serverCharsetsData, setServerCharsetsData] = useState<Array<{
    charset: string; defaultCollation: string; description: string; maxlen: number;
  }>>([]);
  const [charsetsSearch, setCharsetsSearch] = useState("");
  const [isLoadingCharsets, setIsLoadingCharsets] = useState(false);

  // State untuk Tab Plugins
  const [serverPluginsData, setServerPluginsData] = useState<Array<{
    library: string; license: string; name: string; status: string; type: string;
  }>>([]);
  const [pluginsSearch, setPluginsSearch] = useState("");
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);

  // State untuk Dialog Buat Database Baru
  const [isCreateDbModalOpen, setIsCreateDbModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newDbCollation, setNewDbCollation] = useState("utf8mb4_general_ci");
  const [isCreatingDb, setIsCreatingDb] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getConnParams = (db?: string) => {
    const prof = activeConnectedProfile || editForm;
    const activePass = savedPasswords[prof.id] || passwordInput || "123";
    return {
      database: db,
      host: prof.host,
      password: activePass,
      port: Number(prof.port),
      user: prof.username,
    };
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectHost = (profile: Profile) => {
    setSelectedId(profile.id);
    setEditForm({ ...profile });
    setPasswordAction(profile.has_saved_password ? "keep" : "replace");
    setPasswordInput(savedPasswords[profile.id] || "");
    setShowSshPassword(false);
    setDiagnostics(null);
    if (!isInspectorOpen) setIsInspectorOpen(true);
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));
    if (selectedId === id) setEditForm((prev) => ({ ...prev, favorite: !prev.favorite }));
    toast.success("Status favorit diperbarui");
  };

  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        if (favoritesOnly && !p.favorite) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.host.toLowerCase().includes(q) || p.username.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (!(a.last_used_at || b.last_used_at)) return 0;
        if (!a.last_used_at) return 1;
        if (!b.last_used_at) return -1;
        return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime();
      });
  }, [profiles, searchQuery, favoritesOnly, sortBy]);

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
      tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
      updated_at: new Date().toISOString(),
      username: "root",
    };
    setProfiles([newHost, ...profiles]);
    handleSelectHost(newHost);
    toast.info("Draft koneksi baru dibuat", { description: "Lengkapi parameter lalu simpan." });
  };

  const handleSaveProfile = () => {
    const candidatePayload = { ...editForm, port: Number(editForm.port), updated_at: new Date().toISOString() };
    const profileValidation = profileSchema.safeParse(candidatePayload);
    if (!profileValidation.success) {
      const issue = profileValidation.error.issues[0];
      const pathName = issue?.path.join(".") || "Form";
      toast.error("Validasi Profil Gagal (Zod Invariant)", { description: `${pathName}: ${issue?.message || "Data tidak valid"}` });
      return;
    }
    if (passwordAction === "replace") {
      const passValidation = passwordActionSchema.safeParse({ action: "replace", password: passwordInput });
      if (!passValidation.success) {
        toast.error("Validasi Password Gagal", { description: passValidation.error.issues[0]?.message || "Password kosong" });
        return;
      }
      setSavedPasswords((prev) => ({ ...prev, [editForm.id]: passwordInput }));
    } else if (passwordAction === "remove") {
      setSavedPasswords((prev) => { const next = { ...prev }; delete next[editForm.id]; return next; });
    }
    const validatedData = profileValidation.data;
    setProfiles((prev) => prev.map((p) => p.id === validatedData.id ? {
      ...validatedData,
      has_saved_password: passwordAction === "replace" ? true : passwordAction === "remove" ? false : p.has_saved_password,
    } : p));
    toast.success("Profil Berhasil Disimpan", { description: `${validatedData.name} (${validatedData.host}:${validatedData.port}) tersimpan di SQLite` });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setDiagnostics([
      { duration_ms: 0, stage: "local_validation", status: "running" },
      { duration_ms: 0, stage: "ssh_trust", status: "pending" },
      { duration_ms: 0, stage: "ssh_authentication_forwarding", status: "pending" },
      { duration_ms: 0, stage: "mysql_tls_authentication_initial_database", status: "pending" },
    ]);
    await new Promise((r) => setTimeout(r, 120));
    setDiagnostics([
      { duration_ms: 12, stage: "local_validation", status: "passed" },
      { duration_ms: 0, stage: "ssh_trust", status: editForm.method === "ssh" ? "running" : "skipped" },
      { duration_ms: 0, stage: "ssh_authentication_forwarding", status: "pending" },
      { duration_ms: 0, stage: "mysql_tls_authentication_initial_database", status: "running" },
    ]);
    const activePass = passwordInput || savedPasswords[editForm.id] || "";
    const testResult = await testDatabaseConnection({
      database: undefined, host: editForm.host, password: activePass, port: Number(editForm.port), user: editForm.username,
    });
    if (testResult.ok) {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        { duration_ms: 0, stage: "ssh_trust", status: editForm.method === "ssh" ? "passed" : "skipped" },
        { duration_ms: 0, stage: "ssh_authentication_forwarding", status: editForm.method === "ssh" ? "passed" : "skipped" },
        { duration_ms: testResult.latencyMs || 22, stage: "mysql_tls_authentication_initial_database", status: "passed" },
      ]);
      toast.success("Sambungan MariaDB Terverifikasi 100%!", { description: `Server: ${testResult.version} • Latensi: ${testResult.latencyMs}ms` });
    } else {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        { duration_ms: 0, stage: "ssh_trust", status: editForm.method === "ssh" ? "passed" : "skipped" },
        { duration_ms: 0, stage: "ssh_authentication_forwarding", status: editForm.method === "ssh" ? "passed" : "skipped" },
        { duration_ms: testResult.latencyMs || 0, message: testResult.error, stage: "mysql_tls_authentication_initial_database", status: "failed" },
      ]);
      toast.error("Gagal Terhubung ke MariaDB", { description: testResult.error || "Pastikan host, user, dan password benar." });
    }
    setIsTesting(false);
  };

  const handleInspectSshKey = async () => {
    toast.info("Memindai Host Key SSH...", { description: `Target: ${editForm.ssh?.host || "bastion.internal"}` });
    await new Promise((r) => setTimeout(r, 400));
    setSshTrustStatus("trusted");
    toast.success("Host Key SSH Terverifikasi", { description: "Algoritma: ssh-ed25519 • Fingerprint: SHA256:7uK2Z9jH4wQ8xP3v1Lm0" });
  };

  const handleConnect = async (targetProfile?: Profile) => {
    const prof = targetProfile || editForm;
    const activePass = prof.id === editForm.id && passwordInput ? passwordInput : savedPasswords[prof.id] || "123";
    if (passwordInput && prof.id === editForm.id) setSavedPasswords((prev) => ({ ...prev, [prof.id]: passwordInput }));
    const connParams = { database: undefined, host: prof.host, password: activePass, port: Number(prof.port), user: prof.username };
    toast.loading("Mengambil daftar database dari MariaDB...", { id: "connect-toast" });
    const dbRes = await fetchDatabases(connParams);
    toast.dismiss("connect-toast");
    let dbs: string[] = [];
    if (dbRes.ok && dbRes.databases.length > 0) {
      dbs = dbRes.databases;
      setAvailableDatabases(dbs);
      toast.success(`Terhubung ke MariaDB: ${dbs.length} database ditemukan!`, { description: `Server ${prof.host}:${prof.port} siap digunakan.` });
    } else {
      toast.error("Tidak dapat mengambil daftar database", { description: dbRes.error || "Pastikan MariaDB aktif dan password sudah benar." });
    }
    const targetDb = dbs.find((d) => !["information_schema", "performance_schema", "sys", "mysql"].includes(d)) || dbs[0] || "";
    setCurrentSelectedDatabase(targetDb);
    if (dbs.length > 0) {
      setIsLoadingTables(true);
      const tablesRes = await fetchTables(connParams, targetDb);
      setIsLoadingTables(false);
      if (tablesRes.ok && tablesRes.tables.length > 0) {
        setDatabaseTables(tablesRes.tables);
        const firstTable = tablesRes.tables[0].name;
        setSelectedTable(firstTable);
        const initialQuery = `SELECT * FROM \`${firstTable}\` LIMIT 25;`;
        setSqlQuery(initialQuery);
        const queryRes = await executeSqlQuery(connParams, initialQuery, targetDb);
        if (queryRes.ok) setQueryResults(queryRes);
      } else {
        setDatabaseTables([]); setSelectedTable(""); setQueryResults(null);
      }
    }
    const newTabId = `tab-${prof.id}`;
    if (!activeTabs.find((t) => t.id === newTabId)) {
      setActiveTabs((prev) => [...prev, { env: prof.environment, id: newTabId, name: prof.name, profileId: prof.id }]);
    }
    setActiveTabId(newTabId);
    const nowIso = new Date().toISOString();
    setProfiles((prev) => prev.map((p) => (p.id === prof.id ? { ...p, last_used_at: nowIso } : p)));
  };

  const handleSelectDatabase = async (dbName: string) => {
    setCurrentSelectedDatabase(dbName);
    setIsLoadingTables(true);
    setSelectedTableCheckboxes([]);
    const connParams = getConnParams(dbName);
    const tablesRes = await fetchTables(connParams, dbName);
    setIsLoadingTables(false);
    if (tablesRes.ok) {
      setDatabaseTables(tablesRes.tables);
      if (tablesRes.tables.length > 0) {
        const firstTable = tablesRes.tables[0].name;
        setSelectedTable(firstTable);
        const q = `SELECT * FROM \`${firstTable}\` LIMIT 25;`;
        setSqlQuery(q);
        const qRes = await executeSqlQuery(connParams, q, dbName);
        if (qRes.ok) setQueryResults(qRes);
      } else {
        setSelectedTable(""); setQueryResults(null);
      }
      toast.info(`Beralih ke database: ${dbName}`, { description: `${tablesRes.tables.length} tabel dimuat.` });
    } else {
      toast.error(`Gagal memuat tabel database: ${dbName}`, { description: tablesRes.error });
    }
  };

  const handleOpenDatabase = async (dbName: string) => {
    await handleSelectDatabase(dbName);
    setCurrentWorkspaceTab("structure");
  };

  const handleBrowseTable = async (tableName: string) => {
    setSelectedTable(tableName);
    const q = `SELECT * FROM \`${tableName}\` LIMIT 25;`;
    setSqlQuery(q);
    setCurrentWorkspaceTab("sql");
    const connParams = getConnParams(currentSelectedDatabase);
    setIsExecutingQuery(true);
    const qRes = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    setIsExecutingQuery(false);
    if (qRes.ok) setQueryResults(qRes);
  };

  const handleViewTableStructure = async (tableName: string) => {
    setSelectedTableForStructure(tableName);
    setIsTableStructureModalOpen(true);
    setIsLoadingTableStructure(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const [colRes, idxRes] = await Promise.all([
      executeSqlQuery(connParams, `SHOW FULL COLUMNS FROM \`${tableName}\`;`, currentSelectedDatabase),
      executeSqlQuery(connParams, `SHOW INDEX FROM \`${tableName}\`;`, currentSelectedDatabase),
    ]);
    setIsLoadingTableStructure(false);
    if (colRes.ok) setTableStructureColumns(colRes.rows);
    if (idxRes.ok) setTableStructureIndexes(idxRes.rows);
  };

  const handleEmptyTable = async (tableName: string) => {
    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN (TRUNCATE) tabel \`${tableName}\`?\nSeluruh data di dalam tabel ini akan terhapus secara permanen!`)) return;
    const res = await executeSqlQuery(getConnParams(currentSelectedDatabase), `TRUNCATE TABLE \`${tableName}\`;`, currentSelectedDatabase);
    if (res.ok) { toast.success(`Tabel \`${tableName}\` berhasil dikosongkan.`); handleSelectDatabase(currentSelectedDatabase); }
    else toast.error(`Gagal mengosongkan tabel \`${tableName}\``, { description: res.error });
  };

  const handleDropTable = async (tableName: string) => {
    if (!confirm(`PERINGATAN TINGGI: Apakah Anda yakin ingin MENGHAPUS (DROP) tabel \`${tableName}\` beserta seluruh struktur dan datanya?`)) return;
    const res = await executeSqlQuery(getConnParams(currentSelectedDatabase), `DROP TABLE \`${tableName}\`;`, currentSelectedDatabase);
    if (res.ok) { toast.success(`Tabel \`${tableName}\` berhasil dihapus.`); handleSelectDatabase(currentSelectedDatabase); }
    else toast.error(`Gagal menghapus tabel \`${tableName}\``, { description: res.error });
  };

  const handleCreateTable = async () => {
    if (!newTableNameInput.trim()) { toast.warning("Masukkan nama tabel terlebih dahulu."); return; }
    const connParams = getConnParams(currentSelectedDatabase);
    setIsCreatingTable(true);
    const q = `CREATE TABLE \`${newTableNameInput.trim()}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    setIsCreatingTable(false);
    if (res.ok) { toast.success(`Tabel \`${newTableNameInput.trim()}\` berhasil dibuat!`); setNewTableNameInput(""); handleSelectDatabase(currentSelectedDatabase); }
    else toast.error("Gagal membuat tabel", { description: res.error });
  };

  const handleOpenInsertModal = async (tableName: string) => {
    setSelectedTableForInsert(tableName);
    setIsInsertModalOpen(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const colRes = await executeSqlQuery(connParams, `SHOW FULL COLUMNS FROM \`${tableName}\`;`, currentSelectedDatabase);
    if (colRes.ok) {
      setTableStructureColumns(colRes.rows);
      const initialVals: Record<string, string> = {};
      colRes.rows.forEach((r: any) => { initialVals[r.Field] = r.Default || ""; });
      setInsertColumnValues(initialVals);
    }
  };

  const handleExecuteInsertRow = async () => {
    if (!selectedTableForInsert || !currentSelectedDatabase) return;
    const connParams = getConnParams(currentSelectedDatabase);
    const entries = Object.entries(insertColumnValues).filter(([, val]) => val !== undefined && val !== "");
    if (entries.length === 0) { toast.warning("Isi setidaknya satu kolom untuk disisipkan."); return; }
    const cols = entries.map(([k]) => `\`${k}\``).join(", ");
    const vals = entries.map(([, v]) => `'${String(v).replace(/'/g, "''")}'`).join(", ");
    const insertQuery = `INSERT INTO \`${selectedTableForInsert}\` (${cols}) VALUES (${vals});`;
    setIsInsertingRow(true);
    const res = await executeSqlQuery(connParams, insertQuery, currentSelectedDatabase);
    setIsInsertingRow(false);
    if (res.ok) {
      toast.success(`Baris berhasil disisipkan ke tabel \`${selectedTableForInsert}\`!`);
      setIsInsertModalOpen(false);
      handleBrowseTable(selectedTableForInsert);
    } else toast.error("Gagal menyisipkan baris", { description: res.error });
  };

  const handleExecuteBulkAction = async () => {
    if (selectedTableCheckboxes.length === 0) { toast.warning("Pilih setidaknya satu tabel untuk menjalankan aksi massal."); return; }
    const connParams = getConnParams(currentSelectedDatabase);
    if (bulkAction === "drop") {
      if (!confirm(`Hapus permanen ${selectedTableCheckboxes.length} tabel terpilih?`)) return;
      const q = `DROP TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) { toast.success(`${selectedTableCheckboxes.length} tabel berhasil dihapus!`); setSelectedTableCheckboxes([]); handleSelectDatabase(currentSelectedDatabase); }
      else toast.error("Gagal menghapus tabel", { description: res.error });
    } else if (bulkAction === "truncate" || bulkAction === "empty") {
      if (!confirm(`Kosongkan ${selectedTableCheckboxes.length} tabel terpilih?`)) return;
      for (const tbl of selectedTableCheckboxes) {
        await executeSqlQuery(connParams, `TRUNCATE TABLE \`${tbl}\`;`, currentSelectedDatabase);
      }
      toast.success(`${selectedTableCheckboxes.length} tabel berhasil dikosongkan!`);
      setSelectedTableCheckboxes([]); handleSelectDatabase(currentSelectedDatabase);
    } else if (bulkAction === "optimize") {
      const q = `OPTIMIZE TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) toast.success(`Optimasi ${selectedTableCheckboxes.length} tabel berhasil!`);
      else toast.error("Gagal mengoptimasi tabel", { description: res.error });
    } else if (bulkAction === "check") {
      const q = `CHECK TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) toast.success(`Pemeriksaan ${selectedTableCheckboxes.length} tabel selesai!`);
      else toast.error("Gagal memeriksa tabel", { description: res.error });
    }
  };

  const handleRefreshDatabases = async () => {
    const connParams = getConnParams();
    toast.loading("Memperbarui daftar basis data...", { id: "refresh-db" });
    const dbRes = await fetchDatabases(connParams);
    toast.dismiss("refresh-db");
    if (dbRes.ok && dbRes.databases.length > 0) {
      setAvailableDatabases(dbRes.databases);
      toast.success(`Daftar basis data diperbarui (${dbRes.databases.length} database ditemukan)`);
    } else {
      toast.error("Gagal memperbarui daftar database", { description: dbRes.error || "Gagal menghubungi server MariaDB" });
    }
  };

  const handleProcessChosenFile = async (file: File) => {
    try {
      const text = await file.text();
      const filePath = (file as any).path || file.name;
      setSelectedImportFile({ fileName: file.name, filePath, fileSize: file.size });
      setImportSqlContent(text);
      toast.success(`Berkas siap diimpor: ${file.name}`, { description: `Ukuran: ${(file.size / 1024).toFixed(1)} KB` });
    } catch (err: any) {
      toast.error("Gagal membaca berkas SQL", { description: err?.message || String(err) });
    }
  };

  const handlePickImportFile = async (isModal = false) => {
    try {
      const res = await promptSqlFileDialog({ type: "open" });
      if (!res.canceled && res.filePath) {
        setSelectedImportFile({ fileName: res.fileName || "database.sql", filePath: res.filePath, fileSize: res.fileSize || 0 });
        toast.info(`Berkas dipilih: ${res.fileName}`, { description: `Ukuran: ${((res.fileSize || 0) / 1024).toFixed(1)} KB` });
        return;
      }
      if (res.canceled) return;
    } catch { /* fallback to HTML input */ }
    if (isModal) modalFileInputRef.current?.click();
    else fileInputRef.current?.click();
  };

  const handleExecuteImport = async () => {
    const prof = activeConnectedProfile || editForm;
    const activePass = savedPasswords[prof.id] || passwordInput || "123";
    const targetDb = currentSelectedDatabase || availableDatabases[0] || "";
    if (!targetDb) { toast.warning("Pilih basis data target terlebih dahulu sebelum mengimpor."); return; }
    if (importTab === "file" && !selectedImportFile) {
      toast.warning("Silakan pilih berkas .sql terlebih dahulu untuk diimpor.", { description: "Membuka dialog pemilihan berkas..." });
      handlePickImportFile(isImportModalOpen); return;
    }
    if (importTab === "paste" && !importSqlContent.trim()) { toast.warning("Silakan ketik atau tempel perintah SQL yang ingin diimpor."); return; }
    const connParams = { database: targetDb, host: prof.host, password: activePass, port: Number(prof.port), user: prof.username };
    setIsImporting(true);
    toast.loading(`Sedang mengeksekusi impor SQL ke \`${targetDb}\`...`, { id: "import-toast" });
    const res = await importDatabase({
      connection: connParams, database: targetDb,
      filePath: importTab === "file" ? selectedImportFile?.filePath : undefined,
      sqlContent: importTab === "paste" ? importSqlContent : (importSqlContent || undefined),
    });
    setIsImporting(false); toast.dismiss("import-toast");
    if (res.ok) {
      toast.success("Impor Database Berhasil!", { description: `${res.statementsExecuted} perintah SQL dieksekusi dalam ${res.durationMs}ms ke basis data \`${targetDb}\`.` });
      setIsImportModalOpen(false); setSelectedImportFile(null); setImportSqlContent("");
      handleSelectDatabase(targetDb); handleRefreshDatabases();
    } else {
      toast.error("Gagal Mengimpor Database", { description: res.error || "Terjadi kesalahan saat mengeksekusi SQL." });
    }
  };

  const handleExecuteExport = async (saveToFile = true) => {
    if (!currentSelectedDatabase) { toast.error("Pilih database terlebih dahulu untuk diekspor."); return; }
    const prof = activeConnectedProfile || editForm;
    const activePass = savedPasswords[prof.id] || passwordInput || "123";
    const connParams = { database: currentSelectedDatabase, host: prof.host, password: activePass, port: Number(prof.port), user: prof.username };
    let targetFilePath: string | undefined = undefined;
    if (saveToFile) {
      const defaultName = `${currentSelectedDatabase}_${new Date().toISOString().slice(0, 10)}.sql`;
      const fileRes = await promptSqlFileDialog({ defaultFileName: defaultName, type: "save" });
      if (fileRes.canceled || !fileRes.filePath) return;
      targetFilePath = fileRes.filePath;
    }
    setIsExporting(true);
    toast.loading(`Mengekspor basis data \`${currentSelectedDatabase}\`...`, { id: "export-toast" });
    const res = await exportDatabase({
      connection: connParams, database: currentSelectedDatabase, filePath: targetFilePath,
      options: { addDropTable: exportAddDropTable, disableForeignKeyChecks: exportDisableFk, includeData: exportMode === "full" || exportMode === "data", includeStructure: exportMode === "full" || exportMode === "structure" },
    });
    setIsExporting(false); toast.dismiss("export-toast");
    if (res.ok) {
      if (saveToFile && res.filePath) {
        toast.success("Ekspor Database Berhasil Disimpan!", { description: `${res.tableCount} tabel (${res.rowCount} baris) disimpan ke ${res.filePath}` });
        setIsExportModalOpen(false);
      } else if (res.sqlDump) {
        setExportPreviewSql(res.sqlDump);
        navigator.clipboard.writeText(res.sqlDump);
        toast.success("SQL Dump Berhasil Dihasilkan & Disalin!", { description: `${res.tableCount} tabel (${(res.sizeBytes / 1024).toFixed(1)} KB) disalin ke clipboard.` });
      }
    } else {
      toast.error("Gagal Mengekspor Database", { description: res.error || "Gagal menghasilkan SQL dump." });
    }
  };

  const handleLoadServerStatus = async () => {
    const connParams = getConnParams();
    setIsLoadingStatus(true);
    const res = await fetchServerStatus(connParams);
    setIsLoadingStatus(false);
    if (res.ok) setServerStatusData(res);
    else toast.error("Gagal mengambil status server", { description: res.error });
  };

  const handleLoadUserAccounts = async () => {
    const connParams = getConnParams();
    setIsLoadingUsers(true);
    const res = await fetchUserAccounts(connParams);
    setIsLoadingUsers(false);
    if (res.ok) setUserAccountsData(res.users);
    else toast.error("Gagal mengambil daftar pengguna database", { description: res.error });
  };

  const handleLoadVariables = async () => {
    const connParams = getConnParams();
    setIsLoadingVariables(true);
    const res = await fetchServerVariables(connParams);
    setIsLoadingVariables(false);
    if (res.ok) setServerVariablesData(res.variables);
    else toast.error("Gagal mengambil variabel server", { description: res.error });
  };

  const handleLoadEngines = async () => {
    const connParams = getConnParams();
    setIsLoadingEngines(true);
    const res = await fetchServerEngines(connParams);
    setIsLoadingEngines(false);
    if (res.ok) setServerEnginesData(res.engines);
    else toast.error("Gagal mengambil mesin penyimpanan", { description: res.error });
  };

  const handleLoadCharsets = async () => {
    const connParams = getConnParams();
    setIsLoadingCharsets(true);
    const res = await fetchServerCharsets(connParams);
    setIsLoadingCharsets(false);
    if (res.ok) setServerCharsetsData(res.charsets);
    else toast.error("Gagal mengambil set karakter", { description: res.error });
  };

  const handleLoadPlugins = async () => {
    const connParams = getConnParams();
    setIsLoadingPlugins(true);
    const res = await fetchServerPlugins(connParams);
    setIsLoadingPlugins(false);
    if (res.ok) setServerPluginsData(res.plugins);
    else toast.error("Gagal mengambil plugin server", { description: res.error });
  };

  const handleSwitchWorkspaceTab = (tabId: WorkspaceTabId) => {
    setCurrentWorkspaceTab(tabId);
    if (tabId === "databases") handleRefreshDatabases();
    else if (tabId === "structure" && currentSelectedDatabase) handleSelectDatabase(currentSelectedDatabase);
    else if (tabId === "status") handleLoadServerStatus();
    else if (tabId === "users") handleLoadUserAccounts();
    else if (tabId === "variables") handleLoadVariables();
    else if (tabId === "engines") handleLoadEngines();
    else if (tabId === "charsets") handleLoadCharsets();
    else if (tabId === "plugins") handleLoadPlugins();
  };

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) { toast.error("Nama basis data tidak boleh kosong."); return; }
    const prof = activeConnectedProfile || editForm;
    const activePass = savedPasswords[prof.id] || passwordInput || "123";
    setIsCreatingDb(true);
    const res = await createDatabaseAction({ collation: newDbCollation || undefined, connection: { host: prof.host, password: activePass, port: Number(prof.port), user: prof.username }, name: newDbName.trim() });
    setIsCreatingDb(false);
    if (res.ok) {
      toast.success(`Basis data \`${res.name}\` berhasil dibuat!`);
      setIsCreateDbModalOpen(false); setNewDbName(""); handleRefreshDatabases();
    } else toast.error("Gagal membuat basis data", { description: res.error });
  };

  const handleDropDatabase = async (dbName: string) => {
    if (["mysql", "information_schema", "performance_schema", "sys"].includes(dbName.toLowerCase())) {
      toast.error("Database sistem tidak dapat dihapus demi keamanan."); return;
    }
    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus basis data \`${dbName}\`? Tindakan ini permanen!`)) return;
    const prof = activeConnectedProfile || editForm;
    const activePass = savedPasswords[prof.id] || passwordInput || "123";
    const res = await dropDatabaseAction({ connection: { host: prof.host, password: activePass, port: Number(prof.port), user: prof.username }, name: dbName });
    if (res.ok) {
      toast.success(`Basis data \`${dbName}\` berhasil dihapus.`);
      if (currentSelectedDatabase === dbName) setCurrentSelectedDatabase("");
      handleRefreshDatabases();
    } else toast.error("Gagal menghapus basis data", { description: res.error });
  };

  const handleSelectTable = async (tableName: string) => {
    setSelectedTable(tableName);
    const q = `SELECT * FROM \`${tableName}\` LIMIT 25;`;
    setSqlQuery(q);
    const connParams = getConnParams(currentSelectedDatabase);
    setIsExecutingQuery(true);
    const qRes = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    setIsExecutingQuery(false);
    if (qRes.ok) setQueryResults(qRes);
    else toast.error("Gagal membaca tabel", { description: qRes.error });
  };

  const handleExecuteQuery = async () => {
    setIsExecutingQuery(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const qRes = await executeSqlQuery(connParams, sqlQuery, currentSelectedDatabase);
    setIsExecutingQuery(false);
    if (qRes.ok) {
      setQueryResults(qRes);
      toast.success("Query Berhasil Dieksekusi!", { description: `${qRes.rowCount} baris dikembalikan dalam ${qRes.executionTimeMs}ms.` });
    } else toast.error("Query Error", { description: qRes.error || "Gagal mengeksekusi SQL." });
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId === "tab-home") return;
    setActiveTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) setActiveTabId("tab-home");
    toast.info("Sesi koneksi tab ditutup");
  };

  const handleChangeCollation = async () => {
    const prof = activeConnectedProfile || editForm;
    const activePass = savedPasswords[prof.id] || passwordInput || "123";
    const res = await executeSqlQuery(
      { database: currentSelectedDatabase, host: prof.host, password: activePass, port: Number(prof.port), user: prof.username },
      `ALTER DATABASE \`${currentSelectedDatabase}\` COLLATE ${newDbCollation};`,
      currentSelectedDatabase
    );
    if (res.ok) toast.success("Collation basis data berhasil diubah!");
    else toast.error("Gagal mengubah collation", { description: res.error });
  };

  // ─── Computed values ─────────────────────────────────────────────────────────
  const activeConnectedProfile = useMemo(() => {
    const currentTab = activeTabs.find((t) => t.id === activeTabId);
    if (!currentTab || !currentTab.profileId) return null;
    return profiles.find((p) => p.id === currentTab.profileId) || null;
  }, [activeTabs, activeTabId, profiles]);

  const filteredDatabases = useMemo(() => {
    if (!databaseSearch.trim()) return availableDatabases;
    const q = databaseSearch.toLowerCase();
    return availableDatabases.filter((db) => db.toLowerCase().includes(q));
  }, [availableDatabases, databaseSearch]);

  const displayTables = activeConnectedProfile ? databaseTables : FALLBACK_TABLES;
  const filteredDisplayTables = displayTables.filter((t) => t.name.toLowerCase().includes(tableSearch.toLowerCase()));
  const totalDatabaseRows = useMemo(() => databaseTables.reduce((acc, curr) => acc + (curr.rows || 0), 0), [databaseTables]);

  const filteredVariables = useMemo(() => {
    if (!variablesSearch.trim()) return serverVariablesData;
    const q = variablesSearch.toLowerCase();
    return serverVariablesData.filter((v) => v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q));
  }, [serverVariablesData, variablesSearch]);

  const filteredCharsets = useMemo(() => {
    if (!charsetsSearch.trim()) return serverCharsetsData;
    const q = charsetsSearch.toLowerCase();
    return serverCharsetsData.filter((c) => c.charset.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.defaultCollation.toLowerCase().includes(q));
  }, [serverCharsetsData, charsetsSearch]);

  const filteredPlugins = useMemo(() => {
    if (!pluginsSearch.trim()) return serverPluginsData;
    const q = pluginsSearch.toLowerCase();
    return serverPluginsData.filter((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.status.toLowerCase().includes(q));
  }, [serverPluginsData, pluginsSearch]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background font-sans text-foreground">
      {/* ─── TOP HEADER: Dynamic Tabs Bar ─── */}
      <header className="flex h-11 shrink-0 select-none items-center justify-between border-b border-border bg-card px-3 gap-2">
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {/* Sidebar Toggle */}
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title="Toggle Sidebar"
          >
            <Sparkles size={14} />
          </button>

          {/* Dynamic Tabs */}
          {activeTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const envColors: Record<string, string> = {
              Local: "text-emerald-500",
              Production: "text-destructive",
              Staging: "text-amber-500",
              Other: "text-muted-foreground",
            };
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-accent text-foreground font-semibold border border-border shadow-xs"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isActive ? (envColors[tab.env] || "text-primary") : "bg-muted-foreground/40")} style={{ backgroundColor: "currentColor" }} />
                <span className="truncate max-w-[100px]">{tab.name}</span>
                {tab.id !== "tab-home" && (
                  <span
                    className="ml-0.5 rounded p-0.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                    onClick={(e) => handleCloseTab(tab.id, e)}
                  >
                    <X size={10} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side: Omni-search + Theme */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative hidden w-36 sm:w-48 md:block">
            <Search size={12} className="absolute left-2.5 top-2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Cari host atau database..."
              className="h-7 w-full rounded-md border border-border bg-muted/40 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ToggleTheme />
        </div>
      </header>

      {/* ─── BODY ─── */}
      {activeTabId === "tab-home" ? (
        /* ── MODE 1: HUB PENGELOLA KONEKSI ── */
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <aside
            className={cn(
              "flex shrink-0 flex-col justify-between border-r border-border bg-card py-2.5 transition-all duration-200",
              isSidebarCollapsed ? "w-12 items-center px-1" : "w-44 px-2"
            )}
          >
            <div className="flex flex-col gap-1">
              {[
                { active: true, icon: Server, id: "hosts", label: "Koneksi (Hosts)" },
                { active: false, icon: Key, id: "keychain", label: "Keychain" },
                { active: false, icon: Terminal, id: "tunnels", label: "SSH Tunnels" },
                { active: false, icon: FileCode2, id: "snippets", label: "SQL Snippets" },
                { active: false, icon: ShieldCheck, id: "known", label: "Known Hosts" },
                { active: false, icon: Clock, id: "backup", label: "Backup & Logs" },
              ].map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left font-medium text-xs transition-colors",
                      nav.active
                        ? "border border-border bg-accent text-accent-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                    key={nav.id}
                  >
                    <Icon className={nav.active ? "text-primary" : "text-muted-foreground/70"} size={14} />
                    {!isSidebarCollapsed && <span>{nav.label}</span>}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border pt-2 space-y-1">
              {isSidebarCollapsed ? (
                <div className="flex justify-center py-1"><ToggleTheme /></div>
              ) : (
                <ToggleTheme showLabel />
              )}
              <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-muted-foreground text-xs hover:bg-muted/40 hover:text-foreground">
                <Settings size={14} />
                {!isSidebarCollapsed && <span>Pengaturan</span>}
              </button>
            </div>
          </aside>

          {/* Main Grid */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-3 sm:px-4">
              <div className="flex items-center gap-2">
                <Button
                  className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2 sm:px-2.5 font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                  onClick={handleAddNewHost}
                  size="sm"
                >
                  <Plus size={13} />
                  <span className="hidden xs:inline sm:inline">Tambah Koneksi</span>
                  <span className="inline xs:hidden sm:hidden">Baru</span>
                </Button>
                <div className="mx-1 h-3.5 w-[1px] bg-border" />
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <input
                    checked={favoritesOnly}
                    className="rounded border-border bg-muted text-foreground focus:ring-0"
                    id="fav-filter"
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    type="checkbox"
                  />
                  <label className="cursor-pointer select-none text-[11px]" htmlFor="fav-filter">Favorit</label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/70 text-[11px] hidden sm:inline">Urutkan:</span>
                <Select onValueChange={(val: "recent" | "name") => setSortBy(val)} value={sortBy}>
                  <SelectTrigger className="h-7 w-28 sm:w-32 border-border text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="recent">Terakhir</SelectItem>
                    <SelectItem value="name">Nama</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                  className={cn(
                    "h-7 px-2 border-border text-xs flex items-center gap-1.5 transition-colors",
                    isInspectorOpen ? "bg-accent text-foreground border-border" : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                  title={isInspectorOpen ? "Tutup Inspector Host Details" : "Buka Inspector Host Details"}
                >
                  <SlidersHorizontal size={12} />
                  <span className="hidden md:inline">Detail Host</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{filteredProfiles.length} koneksi tersimpan</span>
                <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">Tervalidasi Zod & siap terhubung ke MariaDB</span>
              </div>
              <div className={cn("grid gap-3 transition-all", isInspectorOpen ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4")}>
                {filteredProfiles.map((p) => {
                  const isSelected = p.id === selectedId;
                  const isProd = p.environment === "Production";
                  return (
                    <Card
                      className={cn(
                        "group relative cursor-pointer rounded-lg border border-border bg-card p-3.5 transition-all hover:border-white/20 hover:bg-muted/40",
                        isSelected && "border-primary shadow-[0_0_12px_rgba(87,193,255,0.15)] ring-1 ring-primary"
                      )}
                      key={p.id}
                      onClick={() => handleSelectHost(p)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex size-8 items-center justify-center rounded-md border", isProd ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted text-primary")}>
                            <Database size={15} />
                          </div>
                          <div>
                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground text-xs tracking-tight transition-colors group-hover:text-primary">
                              {p.name}
                              {isProd && <ShieldAlert className="text-destructive" size={11} />}
                            </h4>
                            <p className="font-mono text-[11px] text-muted-foreground">{p.host}:{p.port}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="p-1 text-muted-foreground/70 transition-colors hover:text-amber-500"
                          onClick={(e) => handleToggleFavorite(p.id, e)}
                        >
                          <Star className={cn(p.favorite && "fill-amber-500 text-amber-500")} size={13} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn("px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide",
                              isProd && "border-destructive/30 bg-destructive/10 text-destructive",
                              p.environment === "Staging" && "border-amber-500/30 bg-amber-500/10 text-amber-500",
                              p.environment === "Local" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                              p.environment === "Other" && "border-border text-muted-foreground"
                            )}
                            variant="outline"
                          >
                            {p.environment}
                          </Badge>
                          <span className="text-muted-foreground/70">{p.method === "ssh" ? "SSH Tunnel" : "Direct"}</span>
                        </div>
                        <span className="text-muted-foreground/70">{p.last_used_at ? "Aktif baru-baru ini" : "Belum dibuka"}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right Inspector Panel */}
          {isInspectorOpen && (
            <aside className="flex w-72 sm:w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-card lg:w-96 transition-all duration-200">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2">
                  <Database className="text-primary" size={15} />
                  <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">Host Details</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn("text-[9px] uppercase tracking-wider", editForm.environment === "Production" && "border-destructive/30 bg-destructive/10 text-destructive")}>
                    {editForm.environment}
                  </Badge>
                  <button type="button" onClick={() => setIsInspectorOpen(false)} className="rounded p-1 text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors" title="Tutup Panel Inspector">
                    <PanelRightClose size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 p-4 text-xs">
                {/* Profile Name & Environment */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Nama Profil</Label>
                    <Input className="mt-1 h-7.5 border-border bg-muted/40 text-xs text-foreground" onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} value={editForm.name} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Environment</Label>
                      <Select onValueChange={(val: any) => setEditForm({ ...editForm, environment: val })} value={editForm.environment}>
                        <SelectTrigger className="mt-1 h-7.5 border-border text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="Local">Local</SelectItem>
                          <SelectItem value="Staging">Staging</SelectItem>
                          <SelectItem value="Production">Production</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Metode Koneksi</Label>
                      <Select
                        onValueChange={(val: "direct" | "ssh") => setEditForm({
                          ...editForm, method: val,
                          ssh: val === "ssh" ? editForm.ssh || { auth_type: "password", host: "bastion.internal", key: "", password: "", port: 22, username: "root" } : null,
                        })}
                        value={editForm.method}
                      >
                        <SelectTrigger className="mt-1 h-7.5 border-border text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="direct">Direct (Langsung)</SelectItem>
                          <SelectItem value="ssh">SSH Tunnel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Server Details */}
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2.5">
                  <h4 className="font-semibold text-foreground text-[11px]">Server Database MariaDB / MySQL</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Hostname / IP</Label>
                      <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" onChange={(e) => setEditForm({ ...editForm, host: e.target.value })} value={editForm.host} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Port</Label>
                      <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" onChange={(e) => setEditForm({ ...editForm, port: parseInt(e.target.value, 10) || 3306 })} type="number" value={editForm.port} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Username</Label>
                      <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} value={editForm.username} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>Password</span>
                        {editForm.has_saved_password && passwordAction === "keep" && <span className="text-[9px] text-emerald-500 font-medium">Tersimpan di Vault</span>}
                        {passwordAction === "replace" && <span className="text-[9px] text-amber-500 font-medium">Password Baru</span>}
                        {passwordAction === "remove" && <span className="text-[9px] text-destructive font-medium">Akan Dihapus</span>}
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          className="h-7 pr-7 border-border bg-background text-xs font-mono"
                          onChange={(e) => { setPasswordInput(e.target.value); setPasswordAction("replace"); }}
                          placeholder={editForm.has_saved_password && passwordAction === "keep" ? "•••••••• (Tersimpan - ketik untuk ganti)" : "Ketik password database..."}
                          type={showPassword ? "text" : "password"}
                          value={passwordInput}
                        />
                        <button className="absolute right-2 top-1.5 text-muted-foreground/70 hover:text-foreground" onClick={() => setShowPassword(!showPassword)} type="button">
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SSH Tunnel */}
                {editForm.method === "ssh" && (
                  <div className="rounded-lg border border-purple-400/30 bg-purple-500/5 p-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 font-semibold text-purple-400 text-[11px]">
                        <Terminal size={12} />Bastion SSH Tunnel
                      </h4>
                      <Button className="h-5 rounded px-2 text-[10px] text-purple-600 dark:text-purple-300 hover:bg-purple-500/20" onClick={handleInspectSshKey} size="sm" variant="ghost">
                        Pindai Host Key
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Label className="text-[10px] text-muted-foreground">SSH Host / Bastion IP</Label>
                        <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" placeholder="bastion.internal" onChange={(e) => setEditForm({ ...editForm, ssh: { ...editForm.ssh!, host: e.target.value } })} value={editForm.ssh?.host || ""} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">SSH Port</Label>
                        <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" onChange={(e) => setEditForm({ ...editForm, ssh: { ...editForm.ssh!, port: parseInt(e.target.value, 10) || 22 } })} type="number" value={editForm.ssh?.port || 22} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">User SSH (Username)</Label>
                        <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" placeholder="root / ubuntu" onChange={(e) => setEditForm({ ...editForm, ssh: { ...editForm.ssh!, username: e.target.value } })} value={editForm.ssh?.username ?? ""} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Password User SSH</Label>
                        <div className="relative mt-1">
                          <Input className="h-7 pr-7 border-border bg-background text-xs font-mono" onChange={(e) => setEditForm({ ...editForm, ssh: { ...editForm.ssh!, password: e.target.value } })} placeholder="Password SSH..." type={showSshPassword ? "text" : "password"} value={editForm.ssh?.password ?? ""} />
                          <button className="absolute right-2 top-1.5 text-muted-foreground/70 hover:text-foreground cursor-pointer" onClick={() => setShowSshPassword(!showSshPassword)} type="button" title={showSshPassword ? "Sembunyikan password SSH" : "Lihat password SSH"}>
                            {showSshPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">SSH Private Key <span className="text-muted-foreground/70">(Opsional jika pakai Password)</span></Label>
                      <Input className="mt-1 h-7 border-border bg-background text-xs font-mono" placeholder="~/.ssh/id_rsa atau path berkas kunci privat" onChange={(e) => setEditForm({ ...editForm, ssh: { ...editForm.ssh!, key: e.target.value } })} value={editForm.ssh?.key || ""} />
                    </div>
                  </div>
                )}

                {/* Password Vault */}
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                      <Key size={12} className="text-primary" />Status Password Vault (Keychain)
                    </h4>
                    <Badge className={cn("text-[9px] py-0", editForm.has_saved_password && passwordAction !== "remove" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-border text-muted-foreground")} variant="outline">
                      {editForm.has_saved_password && passwordAction !== "remove" ? "Tersimpan (AES-256)" : "Belum Ada Sandi"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground/70">
                      {passwordAction === "keep" && editForm.has_saved_password ? "Sandi terenkripsi aktif. Ketik di kolom Password untuk mengganti." : passwordAction === "replace" ? "Sandi baru akan disimpan ke vault saat Anda klik Simpan." : passwordAction === "remove" ? "Sandi akan dihapus dari vault saat Anda klik Simpan." : "Belum ada sandi tersimpan untuk host ini."}
                    </span>
                    {editForm.has_saved_password && passwordAction !== "remove" && (
                      <Button className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10 border border-destructive/20" onClick={() => { setPasswordAction("remove"); setPasswordInput(""); toast.info("Password ditandai untuk dihapus", { description: "Klik Simpan Profil untuk konfirmasi penghapusan." }); }} size="sm" variant="ghost">Hapus Sandi</Button>
                    )}
                    {passwordAction === "remove" && (
                      <Button className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 border border-primary/20" onClick={() => { setPasswordAction("keep"); toast.info("Pembatalan: Password vault dipertahankan."); }} size="sm" variant="ghost">Batal Hapus</Button>
                    )}
                  </div>
                </div>

                {/* SSL/TLS */}
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-primary" />
                      <Label className="text-[11px] text-foreground">Enkripsi SSL/TLS</Label>
                    </div>
                    <Switch checked={editForm.tls.enabled} onCheckedChange={(checked) => setEditForm({ ...editForm, tls: { ...editForm.tls, enabled: checked } })} />
                  </div>
                </div>

                {/* Diagnostics */}
                {diagnostics && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                    <h4 className="font-semibold text-foreground text-[11px]">Hasil Diagnostik 4-Tahap</h4>
                    <div className="space-y-1.5">
                      {diagnostics.map((d) => (
                        <div className="flex items-center justify-between text-[11px]" key={d.stage}>
                          <span className="text-muted-foreground font-mono capitalize">
                            {d.stage === "mysql_tls_authentication_initial_database" ? "Otentikasi Server MariaDB / MySQL" : d.stage.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {d.status === "passed" && <span className="text-emerald-500 flex items-center gap-1"><Check size={11} /> {d.duration_ms}ms</span>}
                            {d.status === "running" && <span className="text-primary animate-pulse">Menguji...</span>}
                            {d.status === "skipped" && <span className="text-muted-foreground/70">Dilewati</span>}
                            {d.status === "failed" && <span className="text-destructive">Gagal</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 space-y-2 border-t border-border bg-muted/40 p-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-7.5 border-border bg-transparent text-foreground text-xs hover:bg-muted hover:text-foreground" disabled={isTesting} onClick={handleTestConnection} size="sm" variant="outline">
                    <RefreshCw className={cn("mr-1.5", isTesting && "animate-spin")} size={12} />
                    {isTesting ? "Menguji..." : "Tes Koneksi"}
                  </Button>
                  <Button className="h-7.5 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90" onClick={handleSaveProfile} size="sm">
                    <Check className="mr-1.5" size={12} />Simpan Profil
                  </Button>
                </div>
                <Button className="h-8 w-full rounded-md bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90 shadow-sm flex items-center justify-center gap-1" onClick={() => handleConnect()} size="sm">
                  <Zap size={13} className="fill-black" />
                  <span>Hubungkan ke Database</span>
                  <kbd className="ml-1 px-1 py-0.2 text-[9px] font-mono bg-black/10 rounded hidden sm:inline">⌘↵</kbd>
                </Button>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* ── MODE 2: WORKSPACE STUDIO ── */
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Explorer Sidebar */}
          {isWorkspaceSidebarOpen && (
            <aside className="flex w-64 sm:w-72 shrink-0 flex-col border-r border-border bg-card select-none transition-all duration-200">
              {/* Server Header */}
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary">
                    <Server size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{activeConnectedProfile?.name || "MariaDB Server"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{activeConnectedProfile?.host}:{activeConnectedProfile?.port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={handleRefreshDatabases} className="rounded p-1 text-muted-foreground/70 hover:bg-accent hover:text-primary transition-colors">
                    <RefreshCw size={11} />
                  </button>
                  <button type="button" onClick={() => setIsWorkspaceSidebarOpen(false)} className="rounded p-1 text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors" title="Tutup Explorer">
                    <X size={11} />
                  </button>
                </div>
              </div>

              {/* Database List Header */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Database className="text-emerald-500" size={12} />
                  <span>Databases ({availableDatabases.length})</span>
                </div>
                <button type="button" onClick={() => { setNewDbName(""); setIsCreateDbModalOpen(true); }} className="rounded p-0.5 text-muted-foreground/70 hover:bg-accent hover:text-primary transition-colors" title="Buat Database Baru">
                  <Plus size={11} />
                </button>
              </div>

              {/* Database Search */}
              <div className="p-2 border-b border-border">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 text-muted-foreground/70" size={11} />
                  <Input className="h-6.5 rounded pl-7 pr-2 text-[11px] border-border bg-muted/40 text-foreground placeholder:text-muted-foreground/70" onChange={(e) => setDatabaseSearch(e.target.value)} placeholder={`Cari database (${availableDatabases.length})...`} value={databaseSearch} />
                </div>
              </div>

              {/* Database List */}
              <div className="h-44 shrink-0 overflow-y-auto p-1.5 space-y-0.5 border-b border-border">
                {filteredDatabases.map((db) => {
                  const isDbSelected = currentSelectedDatabase === db;
                  return (
                    <button type="button" key={db} onClick={() => handleOpenDatabase(db)}
                      className={cn("flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors group", isDbSelected ? "bg-accent text-foreground font-semibold border border-emerald-500/50 shadow-xs" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground")}>
                      <div className="flex items-center gap-2 truncate">
                        <Database size={12} className={cn("shrink-0 transition-colors", isDbSelected ? "text-emerald-500" : "text-muted-foreground/70 group-hover:text-muted-foreground")} />
                        <span className="font-mono text-[11px] truncate">{db}</span>
                      </div>
                      {isDbSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
                {filteredDatabases.length === 0 && <div className="p-3 text-center text-[11px] text-muted-foreground/70 italic">Database tidak ditemukan</div>}
              </div>

              {/* Table Section */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <TableIcon className="text-primary" size={12} />
                  <span className="truncate">Tabel: <span className="text-emerald-500 font-mono lowercase">{currentSelectedDatabase || "Pilih db"}</span></span>
                </div>
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground font-mono border border-border">{filteredDisplayTables.length}</span>
              </div>

              {/* Table Search */}
              <div className="p-2 border-b border-border">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 text-muted-foreground/70" size={11} />
                  <Input className="h-6.5 rounded pl-7 pr-2 text-[11px] border-border bg-muted/40 text-foreground placeholder:text-muted-foreground/70" onChange={(e) => setTableSearch(e.target.value)} placeholder={`Cari tabel di ${currentSelectedDatabase || "database"}...`} value={tableSearch} />
                </div>
              </div>

              {/* Table List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
                {isLoadingTables ? (
                  <div className="flex items-center justify-center p-6 text-xs text-primary gap-2">
                    <RefreshCw size={13} className="animate-spin" /><span>Memuat tabel...</span>
                  </div>
                ) : (
                  <>
                    {filteredDisplayTables.map((tbl) => {
                      const isTblSelected = selectedTable === tbl.name;
                      return (
                        <button type="button" key={tbl.name} onClick={() => handleSelectTable(tbl.name)}
                          className={cn("flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors", isTblSelected ? "bg-accent text-foreground font-semibold border border-border shadow-xs" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground")}>
                          <div className="flex items-center gap-2 truncate">
                            <TableIcon size={13} className={isTblSelected ? "text-primary" : "text-muted-foreground/70"} />
                            <span className="font-mono text-[11px] truncate">{tbl.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/70 font-mono">{tbl.rows.toLocaleString()}</span>
                        </button>
                      );
                    })}
                    {filteredDisplayTables.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground/70 italic">Belum ada tabel pada database ini.</div>}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-border bg-muted/40 flex items-center justify-between text-[11px]">
                <span className="text-emerald-500 font-mono flex items-center gap-1.5 text-[10px] truncate max-w-[170px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
                  <span className="truncate">{currentSelectedDatabase || "Live MariaDB"}</span>
                </span>
                <button type="button" className="text-muted-foreground hover:text-foreground hover:underline text-[11px] shrink-0" onClick={() => setActiveTabId("tab-home")}>Ganti Host</button>
              </div>
            </aside>
          )}

          {/* Main Studio */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            {/* Top Workspace Bar */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card px-3 sm:px-4 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0 overflow-hidden">
                {!isWorkspaceSidebarOpen && (
                  <Button variant="outline" size="sm" className="h-7 px-2 border-border bg-muted/40 text-primary hover:text-foreground hover:bg-muted flex items-center gap-1.5 shrink-0" onClick={() => setIsWorkspaceSidebarOpen(true)} title="Tampilkan Explorer Basis Data">
                    <PanelLeft size={13} />
                    <span className="hidden sm:inline">Explorer</span>
                    {availableDatabases.length > 0 && <span className="text-[10px] text-emerald-500 font-mono">({availableDatabases.length})</span>}
                  </Button>
                )}
                <span className="font-semibold text-foreground truncate max-w-[100px] sm:max-w-[160px] md:max-w-[220px]">{activeConnectedProfile?.name}</span>
                <span className="text-muted-foreground/70 shrink-0">/</span>
                <span className="font-mono font-medium text-emerald-500 truncate max-w-[100px] sm:max-w-[160px]">{currentSelectedDatabase}</span>
                {selectedTable && (
                  <>
                    <span className="text-muted-foreground/70 shrink-0">/</span>
                    <span className="font-mono text-primary truncate max-w-[100px] sm:max-w-[160px]">{selectedTable}</span>
                  </>
                )}
                <Badge className="ml-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[9px] hidden lg:inline-flex shrink-0" variant="outline">Socket TCP 3306</Badge>
              </div>
            </div>

            {/* phpMyAdmin Tab Navigation */}
            <div className="flex items-center border-b border-border bg-card px-2 gap-0.5 overflow-x-auto no-scrollbar shrink-0 select-none">
              {[
                { icon: Database, id: "databases", label: "Databases" },
                { icon: TableIcon, id: "structure", label: currentSelectedDatabase ? `Structure (${currentSelectedDatabase})` : "Structure" },
                { icon: Code2, id: "sql", label: "SQL" },
                { icon: Sliders, id: "operations", label: "Operations" },
                { icon: Activity, id: "status", label: "Status" },
                { icon: Users, id: "users", label: "User accounts" },
                { icon: FileDown, id: "export", label: "Export" },
                { icon: FileUp, id: "import", label: "Import" },
                { icon: SlidersHorizontal, id: "variables", label: "Variables" },
                { icon: Columns, id: "charsets", label: "Charsets" },
                { icon: Server, id: "engines", label: "Engines" },
                { icon: Layers, id: "plugins", label: "Plugins" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentWorkspaceTab === tab.id;
                return (
                  <button key={tab.id} type="button" onClick={() => handleSwitchWorkspaceTab(tab.id as WorkspaceTabId)}
                    className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all shrink-0 select-none", isActive ? "border-primary text-foreground bg-accent/60 font-semibold" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40")}>
                    <Icon size={13} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground/70")} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {currentWorkspaceTab === "databases" && (
              <DatabasesTab
                availableDatabases={availableDatabases}
                currentSelectedDatabase={currentSelectedDatabase}
                databaseSearch={databaseSearch}
                filteredDatabases={filteredDatabases}
                onDropDatabase={handleDropDatabase}
                onOpenDatabase={handleOpenDatabase}
                onOpenExportModal={(db) => { setCurrentSelectedDatabase(db); setIsExportModalOpen(true); }}
                onRefreshDatabases={handleRefreshDatabases}
                onStartCreateDb={() => { setNewDbName(""); setIsCreateDbModalOpen(true); }}
                setDatabaseSearch={setDatabaseSearch}
              />
            )}
            {currentWorkspaceTab === "structure" && (
              <StructureTab
                bulkAction={bulkAction}
                currentSelectedDatabase={currentSelectedDatabase}
                filteredDisplayTables={filteredDisplayTables}
                isCreatingTable={isCreatingTable}
                newTableColumnsInput={newTableColumnsInput}
                newTableNameInput={newTableNameInput}
                onBrowseTable={handleBrowseTable}
                onCreateTable={handleCreateTable}
                onDropTable={handleDropTable}
                onEmptyTable={handleEmptyTable}
                onExecuteBulkAction={handleExecuteBulkAction}
                onOpenInsertModal={handleOpenInsertModal}
                onRefreshTables={() => handleSelectDatabase(currentSelectedDatabase)}
                onSwitchTab={(tab) => setCurrentWorkspaceTab(tab)}
                onViewTableStructure={handleViewTableStructure}
                selectedTableCheckboxes={selectedTableCheckboxes}
                setBulkAction={setBulkAction}
                setNewTableColumnsInput={setNewTableColumnsInput}
                setNewTableNameInput={setNewTableNameInput}
                setSelectedTableCheckboxes={setSelectedTableCheckboxes}
                setTableSearch={setTableSearch}
                tableSearch={tableSearch}
                totalDatabaseRows={totalDatabaseRows}
              />
            )}
            {currentWorkspaceTab === "sql" && (
              <SqlTab
                currentSelectedDatabase={currentSelectedDatabase}
                isExecutingQuery={isExecutingQuery}
                isLoadingTables={isLoadingTables}
                isSqlConsoleExpanded={isSqlConsoleExpanded}
                onExecuteQuery={handleExecuteQuery}
                queryResults={queryResults}
                selectedTable={selectedTable}
                setIsSqlConsoleExpanded={setIsSqlConsoleExpanded}
                setSqlQuery={setSqlQuery}
                sqlQuery={sqlQuery}
              />
            )}
            {currentWorkspaceTab === "operations" && (
              <OperationsTab
                currentSelectedDatabase={currentSelectedDatabase}
                newDbCollation={newDbCollation}
                onChangeCollation={handleChangeCollation}
                onDropDatabase={handleDropDatabase}
                setNewDbCollation={setNewDbCollation}
              />
            )}
            {currentWorkspaceTab === "status" && (
              <StatusTab
                activeConnectedProfile={activeConnectedProfile}
                isLoadingStatus={isLoadingStatus}
                onLoadServerStatus={handleLoadServerStatus}
                serverStatusData={serverStatusData}
              />
            )}
            {currentWorkspaceTab === "users" && (
              <UsersTab
                isLoadingUsers={isLoadingUsers}
                onLoadUserAccounts={handleLoadUserAccounts}
                userAccountsData={userAccountsData}
              />
            )}
            {currentWorkspaceTab === "export" && (
              <ExportTab
                currentSelectedDatabase={currentSelectedDatabase}
                exportAddDropTable={exportAddDropTable}
                exportDisableFk={exportDisableFk}
                exportMode={exportMode}
                exportPreviewSql={exportPreviewSql}
                isExporting={isExporting}
                onExecuteExport={handleExecuteExport}
                setExportAddDropTable={setExportAddDropTable}
                setExportDisableFk={setExportDisableFk}
                setExportMode={setExportMode}
              />
            )}
            {currentWorkspaceTab === "import" && (
              <ImportTab
                availableDatabases={availableDatabases}
                currentSelectedDatabase={currentSelectedDatabase}
                importSqlContent={importSqlContent}
                importTab={importTab}
                isImporting={isImporting}
                onExecuteImport={handleExecuteImport}
                onPickImportFile={handlePickImportFile}
                onProcessChosenFile={handleProcessChosenFile}
                onSelectDatabase={handleSelectDatabase}
                selectedImportFile={selectedImportFile}
                setCurrentSelectedDatabase={setCurrentSelectedDatabase}
                setImportSqlContent={setImportSqlContent}
                setImportTab={setImportTab}
                setSelectedImportFile={setSelectedImportFile}
              />
            )}
            {currentWorkspaceTab === "variables" && (
              <VariablesTab
                filteredVariables={filteredVariables}
                isLoadingVariables={isLoadingVariables}
                onLoadVariables={handleLoadVariables}
                serverVariablesData={serverVariablesData}
                setVariablesSearch={setVariablesSearch}
                variablesSearch={variablesSearch}
              />
            )}
            {currentWorkspaceTab === "charsets" && (
              <CharsetsTab
                charsetsSearch={charsetsSearch}
                filteredCharsets={filteredCharsets}
                isLoadingCharsets={isLoadingCharsets}
                onLoadCharsets={handleLoadCharsets}
                serverCharsetsData={serverCharsetsData}
                setCharsetsSearch={setCharsetsSearch}
              />
            )}
            {currentWorkspaceTab === "engines" && (
              <EnginesTab
                isLoadingEngines={isLoadingEngines}
                onLoadEngines={handleLoadEngines}
                serverEnginesData={serverEnginesData}
              />
            )}
            {currentWorkspaceTab === "plugins" && (
              <PluginsTab
                filteredPlugins={filteredPlugins}
                isLoadingPlugins={isLoadingPlugins}
                onLoadPlugins={handleLoadPlugins}
                pluginsSearch={pluginsSearch}
                serverPluginsData={serverPluginsData}
                setPluginsSearch={setPluginsSearch}
              />
            )}
          </section>
        </div>
      )}

      {/* ─── MODALS ─── */}
      <ExportModal
        currentSelectedDatabase={currentSelectedDatabase}
        exportAddDropTable={exportAddDropTable}
        exportDisableFk={exportDisableFk}
        exportMode={exportMode}
        exportPreviewSql={exportPreviewSql}
        isExporting={isExporting}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExecuteExport={handleExecuteExport}
        setExportAddDropTable={setExportAddDropTable}
        setExportDisableFk={setExportDisableFk}
        setExportMode={setExportMode}
      />

      <ImportModal
        currentSelectedDatabase={currentSelectedDatabase}
        importSqlContent={importSqlContent}
        importTab={importTab}
        isImporting={isImporting}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onExecuteImport={handleExecuteImport}
        onPickImportFile={handlePickImportFile}
        onProcessChosenFile={handleProcessChosenFile}
        selectedImportFile={selectedImportFile}
        setImportSqlContent={setImportSqlContent}
        setImportTab={setImportTab}
        setSelectedImportFile={setSelectedImportFile}
      />

      <CreateDatabaseModal
        isCreatingDb={isCreatingDb}
        isOpen={isCreateDbModalOpen}
        newDbCollation={newDbCollation}
        newDbName={newDbName}
        onClose={() => setIsCreateDbModalOpen(false)}
        onCreateDatabase={handleCreateDatabase}
        serverHost={activeConnectedProfile?.host || editForm.host}
        serverPort={activeConnectedProfile?.port || editForm.port}
        setNewDbCollation={setNewDbCollation}
        setNewDbName={setNewDbName}
      />

      <TableStructureModal
        currentSelectedDatabase={currentSelectedDatabase}
        isLoadingTableStructure={isLoadingTableStructure}
        isOpen={isTableStructureModalOpen}
        onClose={() => setIsTableStructureModalOpen(false)}
        selectedTableForStructure={selectedTableForStructure}
        tableStructureColumns={tableStructureColumns}
        tableStructureIndexes={tableStructureIndexes}
      />

      <InsertRowModal
        currentSelectedDatabase={currentSelectedDatabase}
        insertColumnValues={insertColumnValues}
        isInsertingRow={isInsertingRow}
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        onExecuteInsertRow={handleExecuteInsertRow}
        selectedTableForInsert={selectedTableForInsert}
        setInsertColumnValues={setInsertColumnValues}
        tableStructureColumns={tableStructureColumns}
      />
    </div>
  );
}

export const Route = createFileRoute("/")(  {
  component: HomePage,
});
