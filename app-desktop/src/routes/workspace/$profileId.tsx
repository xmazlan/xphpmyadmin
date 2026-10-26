import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
} from "@/actions/database";
import { FALLBACK_TABLES } from "@/components/workspace/constants";
import { ExplorerSidebar } from "@/components/workspace/explorer/explorer-sidebar";
import { ConfirmDialog } from "@/components/workspace/modals/confirm-dialog";
import { CreateDatabaseModal } from "@/components/workspace/modals/create-database-modal";
import { ExportModal } from "@/components/workspace/modals/export-modal";
import { ImportModal } from "@/components/workspace/modals/import-modal";
import { InsertRowModal } from "@/components/workspace/modals/insert-row-modal";
import { TableStructureModal } from "@/components/workspace/modals/table-structure-modal";
import { CharsetsTab } from "@/components/workspace/tabs/charsets-tab";
import { DatabasesTab } from "@/components/workspace/tabs/databases-tab";
import { EnginesTab } from "@/components/workspace/tabs/engines-tab";
import { ExportTab } from "@/components/workspace/tabs/export-tab";
import { ImportTab } from "@/components/workspace/tabs/import-tab";
import { OperationsTab } from "@/components/workspace/tabs/operations-tab";
import { PluginsTab } from "@/components/workspace/tabs/plugins-tab";
import { SqlTab } from "@/components/workspace/tabs/sql-tab";
import { StatusTab } from "@/components/workspace/tabs/status-tab";
import { StructureTab } from "@/components/workspace/tabs/structure-tab";
import { UsersTab } from "@/components/workspace/tabs/users-tab";
import { VariablesTab } from "@/components/workspace/tabs/variables-tab";
import type { TableItem, WorkspaceTabId } from "@/components/workspace/types";
import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import { useConnection } from "@/context/connection-context";

export function WorkspaceStudioPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const { profiles, savedPasswords, setActiveTabId } = useConnection();

  const profile = useMemo(
    () => profiles.find((p) => p.id === profileId) || profiles[0],
    [profiles, profileId]
  );

  // Set active tab ID in top header bar
  useEffect(() => {
    setActiveTabId(`tab-${profileId}`);
  }, [profileId, setActiveTabId]);

  // Sidebar states
  const [isWorkspaceSidebarOpen, setIsWorkspaceSidebarOpen] = useState(true);
  const [isSqlConsoleExpanded, setIsSqlConsoleExpanded] = useState(true);

  // Workspace active database state
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [databaseSearch, setDatabaseSearch] = useState("");
  const [currentSelectedDatabase, setCurrentSelectedDatabase] = useState(
    profile?.database || ""
  );
  const [databaseTables, setDatabaseTables] = useState<TableItem[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState("");
  const [sqlQuery, setSqlQuery] = useState(
    "SELECT * FROM `pma__users` LIMIT 25;"
  );
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [queryResults, setQueryResults] = useState<{
    columns: string[];
    error?: string;
    executionTimeMs: number;
    ok: boolean;
    rowCount: number;
    rows: any[];
  } | null>(null);

  // Workspace tab
  const [currentWorkspaceTab, setCurrentWorkspaceTab] =
    useState<WorkspaceTabId>("databases");

  // State Ekspor & Impor Database
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<"full" | "structure" | "data">(
    "full"
  );
  const [exportAddDropTable, setExportAddDropTable] = useState(true);
  const [exportDisableFk, setExportDisableFk] = useState(true);
  const [exportPreviewSql, setExportPreviewSql] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [selectedImportFile, setSelectedImportFile] = useState<{
    fileName: string;
    filePath: string;
    fileSize: number;
  } | null>(null);
  const [importSqlContent, setImportSqlContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // State untuk Tab Structure
  const [selectedTableCheckboxes, setSelectedTableCheckboxes] = useState<
    string[]
  >([]);
  const [bulkAction, setBulkAction] = useState<string>("empty");
  const [newTableNameInput, setNewTableNameInput] = useState("");
  const [newTableColumnsInput, setNewTableColumnsInput] = useState(4);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  // Generic Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    cancelText?: string;
    confirmText?: string;
    description: React.ReactNode;
    isOpen: boolean;
    onConfirm: () => void | Promise<void>;
    title: string;
    variant?: "destructive" | "default";
  }>({
    cancelText: "Batal",
    confirmText: "Hapus",
    description: "",
    isOpen: false,
    onConfirm: () => {},
    title: "",
    variant: "destructive",
  });

  // State untuk Modal Struktur Kolom
  const [selectedTableForStructure, setSelectedTableForStructure] = useState<
    string | null
  >(null);
  const [tableStructureColumns, setTableStructureColumns] = useState<any[]>([]);
  const [tableStructureIndexes, setTableStructureIndexes] = useState<any[]>([]);
  const [isLoadingTableStructure, setIsLoadingTableStructure] = useState(false);
  const [isTableStructureModalOpen, setIsTableStructureModalOpen] =
    useState(false);

  // State untuk Modal Insert Row
  const [selectedTableForInsert, setSelectedTableForInsert] = useState<
    string | null
  >(null);
  const [insertColumnValues, setInsertColumnValues] = useState<
    Record<string, string>
  >({});
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [isInsertingRow, setIsInsertingRow] = useState(false);

  // State untuk Tab Status Server
  const [serverStatusData, setServerStatusData] = useState<{
    bytesReceived: number;
    bytesSent: number;
    connections: number;
    ok: boolean;
    processes: Array<{
      command: string;
      db: string;
      host: string;
      id: number;
      info: string;
      state: string;
      time: number;
      user: string;
    }>;
    questions: number;
    threadsConnected: number;
    threadsRunning: number;
    uptimeSeconds: number;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // State untuk Tab User Accounts
  const [userAccountsData, setUserAccountsData] = useState<
    Array<{
      accountLocked: boolean;
      host: string;
      passwordExpired: boolean;
      plugin: string;
      user: string;
    }>
  >([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State untuk Tab Variables
  const [serverVariablesData, setServerVariablesData] = useState<
    Array<{ name: string; value: string }>
  >([]);
  const [variablesSearch, setVariablesSearch] = useState("");
  const [isLoadingVariables, setIsLoadingVariables] = useState(false);

  // State untuk Tab Engines
  const [serverEnginesData, setServerEnginesData] = useState<
    Array<{
      comment: string;
      engine: string;
      savepoints: string;
      support: string;
      transactions: string;
      xa: string;
    }>
  >([]);
  const [isLoadingEngines, setIsLoadingEngines] = useState(false);

  // State untuk Tab Charsets
  const [serverCharsetsData, setServerCharsetsData] = useState<
    Array<{
      charset: string;
      defaultCollation: string;
      description: string;
      maxlen: number;
    }>
  >([]);
  const [charsetsSearch, setCharsetsSearch] = useState("");
  const [isLoadingCharsets, setIsLoadingCharsets] = useState(false);

  // State untuk Tab Plugins
  const [serverPluginsData, setServerPluginsData] = useState<
    Array<{
      library: string;
      license: string;
      name: string;
      status: string;
      type: string;
    }>
  >([]);
  const [pluginsSearch, setPluginsSearch] = useState("");
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);

  // State untuk Dialog Buat Database Baru
  const [isCreateDbModalOpen, setIsCreateDbModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newDbCollation, setNewDbCollation] = useState("utf8mb4_general_ci");
  const [isCreatingDb, setIsCreatingDb] = useState(false);

  // Connection parameters
  const getConnParams = (db?: string) => {
    const activePass = savedPasswords[profile.id] || "123";
    return {
      database: db,
      host: profile.host,
      password: activePass,
      port: Number(profile.port),
      user: profile.username,
    };
  };

  // Initial load on mount
  useEffect(() => {
    async function initDatabases() {
      const connParams = getConnParams();
      const dbRes = await fetchDatabases(connParams);
      if (dbRes.ok && dbRes.databases.length > 0) {
        setAvailableDatabases(dbRes.databases);
        const targetDb =
          dbRes.databases.find(
            (d) =>
              ![
                "information_schema",
                "performance_schema",
                "sys",
                "mysql",
              ].includes(d)
          ) || dbRes.databases[0];
        setCurrentSelectedDatabase(targetDb);
        const tablesRes = await fetchTables(connParams, targetDb);
        if (tablesRes.ok && tablesRes.tables.length > 0) {
          setDatabaseTables(tablesRes.tables);
          const firstTbl = tablesRes.tables[0].name;
          setSelectedTable(firstTbl);
          const q = `SELECT * FROM \`${firstTbl}\` LIMIT 25;`;
          setSqlQuery(q);
          const qRes = await executeSqlQuery(connParams, q, targetDb);
          if (qRes.ok) {
            setQueryResults(qRes);
          }
        }
      }
    }
    initDatabases();
  }, [profile.id]);

  // Handlers
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
        if (qRes.ok) {
          setQueryResults(qRes);
        }
      } else {
        setSelectedTable("");
        setQueryResults(null);
      }
      toast.info(`Beralih ke database: ${dbName}`, {
        description: `${tablesRes.tables.length} tabel dimuat.`,
      });
    } else {
      toast.error(`Gagal memuat tabel database: ${dbName}`, {
        description: tablesRes.error,
      });
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
    if (qRes.ok) {
      setQueryResults(qRes);
    }
  };

  const handleViewTableStructure = async (tableName: string) => {
    setSelectedTableForStructure(tableName);
    setIsTableStructureModalOpen(true);
    setIsLoadingTableStructure(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const [colRes, idxRes] = await Promise.all([
      executeSqlQuery(
        connParams,
        `SHOW FULL COLUMNS FROM \`${tableName}\`;`,
        currentSelectedDatabase
      ),
      executeSqlQuery(
        connParams,
        `SHOW INDEX FROM \`${tableName}\`;`,
        currentSelectedDatabase
      ),
    ]);
    setIsLoadingTableStructure(false);
    if (colRes.ok) {
      setTableStructureColumns(colRes.rows);
    }
    if (idxRes.ok) {
      setTableStructureIndexes(idxRes.rows);
    }
  };

  const handleEmptyTable = (tableName: string) => {
    setConfirmDialog({
      confirmText: "Kosongkan Tabel",
      description: (
        <span>
          PERINGATAN: Apakah Anda yakin ingin <strong>MENGOSONGKAN</strong>{" "}
          tabel{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-destructive">
            {tableName}
          </code>
          ? Seluruh baris data di dalam tabel ini akan dihapus secara permanen!
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const res = await executeSqlQuery(
          getConnParams(currentSelectedDatabase),
          `TRUNCATE TABLE \`${tableName}\`;`,
          currentSelectedDatabase
        );
        if (res.ok) {
          toast.success(`Tabel \`${tableName}\` berhasil dikosongkan.`);
          handleSelectDatabase(currentSelectedDatabase);
        } else {
          toast.error(`Gagal mengosongkan tabel \`${tableName}\``, {
            description: res.error,
          });
        }
      },
      title: "Kosongkan Tabel (TRUNCATE)",
      variant: "destructive",
    });
  };

  const handleDropTable = (tableName: string) => {
    setConfirmDialog({
      confirmText: "Hapus Tabel",
      description: (
        <span>
          PERINGATAN TINGGI: Apakah Anda yakin ingin menghapus (
          <strong>DROP</strong>) tabel{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-destructive">
            {tableName}
          </code>{" "}
          beserta seluruh struktur, indeks, dan datanya secara permanen?
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const res = await executeSqlQuery(
          getConnParams(currentSelectedDatabase),
          `DROP TABLE \`${tableName}\`;`,
          currentSelectedDatabase
        );
        if (res.ok) {
          toast.success(`Tabel \`${tableName}\` berhasil dihapus.`);
          handleSelectDatabase(currentSelectedDatabase);
        } else {
          toast.error(`Gagal menghapus tabel \`${tableName}\``, {
            description: res.error,
          });
        }
      },
      title: "Hapus Tabel (DROP)",
      variant: "destructive",
    });
  };

  const handleCreateTable = async () => {
    if (!newTableNameInput.trim()) {
      toast.warning("Masukkan nama tabel terlebih dahulu.");
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    setIsCreatingTable(true);
    const q = `CREATE TABLE \`${newTableNameInput.trim()}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    setIsCreatingTable(false);
    if (res.ok) {
      toast.success(`Tabel \`${newTableNameInput.trim()}\` berhasil dibuat!`);
      setNewTableNameInput("");
      handleSelectDatabase(currentSelectedDatabase);
    } else {
      toast.error("Gagal membuat tabel", { description: res.error });
    }
  };

  const handleOpenInsertModal = async (tableName: string) => {
    setSelectedTableForInsert(tableName);
    setIsInsertModalOpen(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const colRes = await executeSqlQuery(
      connParams,
      `SHOW FULL COLUMNS FROM \`${tableName}\`;`,
      currentSelectedDatabase
    );
    if (colRes.ok) {
      setTableStructureColumns(colRes.rows);
      const initialVals: Record<string, string> = {};
      colRes.rows.forEach((r: any) => {
        initialVals[r.Field] = r.Default || "";
      });
      setInsertColumnValues(initialVals);
    }
  };

  const handleExecuteInsertRow = async () => {
    if (!(selectedTableForInsert && currentSelectedDatabase)) {
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    const entries = Object.entries(insertColumnValues).filter(
      ([, val]) => val !== undefined && val !== ""
    );
    if (entries.length === 0) {
      toast.warning("Isi setidaknya satu kolom untuk disisipkan.");
      return;
    }
    const cols = entries.map(([k]) => `\`${k}\``).join(", ");
    const vals = entries
      .map(([, v]) => `'${String(v).replace(/'/g, "''")}'`)
      .join(", ");
    const insertQuery = `INSERT INTO \`${selectedTableForInsert}\` (${cols}) VALUES (${vals});`;
    setIsInsertingRow(true);
    const res = await executeSqlQuery(
      connParams,
      insertQuery,
      currentSelectedDatabase
    );
    setIsInsertingRow(false);
    if (res.ok) {
      toast.success(
        `Baris berhasil disisipkan ke tabel \`${selectedTableForInsert}\`!`
      );
      setIsInsertModalOpen(false);
      handleBrowseTable(selectedTableForInsert);
    } else {
      toast.error("Gagal menyisipkan baris", { description: res.error });
    }
  };

  const handleExecuteBulkAction = async () => {
    if (selectedTableCheckboxes.length === 0) {
      toast.warning(
        "Pilih setidaknya satu tabel untuk menjalankan aksi massal."
      );
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    if (bulkAction === "drop") {
      setConfirmDialog({
        confirmText: `Hapus ${selectedTableCheckboxes.length} Tabel`,
        description: (
          <span>
            PERINGATAN: Apakah Anda yakin ingin menghapus permanen{" "}
            <strong>{selectedTableCheckboxes.length} tabel terpilih</strong> (
            {selectedTableCheckboxes.join(", ")}) beserta seluruh struktur dan
            datanya?
          </span>
        ),
        isOpen: true,
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const q = `DROP TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
          const res = await executeSqlQuery(
            connParams,
            q,
            currentSelectedDatabase
          );
          if (res.ok) {
            toast.success(
              `${selectedTableCheckboxes.length} tabel berhasil dihapus!`
            );
            setSelectedTableCheckboxes([]);
            handleSelectDatabase(currentSelectedDatabase);
          } else {
            toast.error("Gagal menghapus tabel", { description: res.error });
          }
        },
        title: "Hapus Tabel Terpilih Massal (DROP)",
        variant: "destructive",
      });
    } else if (bulkAction === "truncate" || bulkAction === "empty") {
      setConfirmDialog({
        confirmText: `Kosongkan ${selectedTableCheckboxes.length} Tabel`,
        description: (
          <span>
            Apakah Anda yakin ingin mengosongkan seluruh baris data dari{" "}
            <strong>{selectedTableCheckboxes.length} tabel terpilih</strong> (
            {selectedTableCheckboxes.join(", ")})?
          </span>
        ),
        isOpen: true,
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          for (const tbl of selectedTableCheckboxes) {
            await executeSqlQuery(
              connParams,
              `TRUNCATE TABLE \`${tbl}\`;`,
              currentSelectedDatabase
            );
          }
          toast.success(
            `${selectedTableCheckboxes.length} tabel berhasil dikosongkan!`
          );
          setSelectedTableCheckboxes([]);
          handleSelectDatabase(currentSelectedDatabase);
        },
        title: "Kosongkan Tabel Terpilih Massal (TRUNCATE)",
        variant: "destructive",
      });
    } else if (bulkAction === "optimize") {
      setSelectedTableCheckboxes([]);
      handleSelectDatabase(currentSelectedDatabase);
    } else if (bulkAction === "optimize") {
      const q = `OPTIMIZE TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) {
        toast.success(
          `Optimasi ${selectedTableCheckboxes.length} tabel berhasil!`
        );
      } else {
        toast.error("Gagal mengoptimasi tabel", { description: res.error });
      }
    } else if (bulkAction === "check") {
      const q = `CHECK TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) {
        toast.success(
          `Pemeriksaan ${selectedTableCheckboxes.length} tabel selesai!`
        );
      } else {
        toast.error("Gagal memeriksa tabel", { description: res.error });
      }
    }
  };

  const handleRefreshDatabases = async () => {
    const connParams = getConnParams();
    toast.loading("Memperbarui daftar basis data...", { id: "refresh-db" });
    const dbRes = await fetchDatabases(connParams);
    toast.dismiss("refresh-db");
    if (dbRes.ok && dbRes.databases.length > 0) {
      setAvailableDatabases(dbRes.databases);
      toast.success(
        `Daftar basis data diperbarui (${dbRes.databases.length} database ditemukan)`
      );
    } else {
      toast.error("Gagal memperbarui daftar database", {
        description: dbRes.error || "Gagal menghubungi server MariaDB",
      });
    }
  };

  const handleProcessChosenFile = async (file: File) => {
    try {
      const text = await file.text();
      const filePath = (file as any).path || file.name;
      setSelectedImportFile({
        fileName: file.name,
        filePath,
        fileSize: file.size,
      });
      setImportSqlContent(text);
      toast.success(`Berkas siap diimpor: ${file.name}`, {
        description: `Ukuran: ${(file.size / 1024).toFixed(1)} KB`,
      });
    } catch (err: any) {
      toast.error("Gagal membaca berkas SQL", {
        description: err?.message || String(err),
      });
    }
  };

  const handlePickImportFile = async (isModal = false) => {
    try {
      const res = await promptSqlFileDialog({ type: "open" });
      if (!res.canceled && res.filePath) {
        setSelectedImportFile({
          fileName: res.fileName || "database.sql",
          filePath: res.filePath,
          fileSize: res.fileSize || 0,
        });
        toast.info(`Berkas dipilih: ${res.fileName}`, {
          description: `Ukuran: ${((res.fileSize || 0) / 1024).toFixed(1)} KB`,
        });
        return;
      }
      if (res.canceled) {
        return;
      }
    } catch {
      /* fallback to HTML input */
    }
    if (isModal) {
      modalFileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleExecuteImport = async () => {
    const targetDb = currentSelectedDatabase || availableDatabases[0] || "";
    if (!targetDb) {
      toast.warning(
        "Pilih basis data target terlebih dahulu sebelum mengimpor."
      );
      return;
    }
    if (importTab === "file" && !selectedImportFile) {
      toast.warning(
        "Silakan pilih berkas .sql terlebih dahulu untuk diimpor.",
        {
          description: "Membuka dialog pemilihan berkas...",
        }
      );
      handlePickImportFile(isImportModalOpen);
      return;
    }
    if (importTab === "paste" && !importSqlContent.trim()) {
      toast.warning(
        "Silakan ketik atau tempel perintah SQL yang ingin diimpor."
      );
      return;
    }
    const connParams = getConnParams(targetDb);
    setIsImporting(true);
    toast.loading(`Sedang mengeksekusi impor SQL ke \`${targetDb}\`...`, {
      id: "import-toast",
    });
    const res = await importDatabase({
      connection: connParams,
      database: targetDb,
      filePath: importTab === "file" ? selectedImportFile?.filePath : undefined,
      sqlContent:
        importTab === "paste"
          ? importSqlContent
          : importSqlContent || undefined,
    });
    setIsImporting(false);
    toast.dismiss("import-toast");
    if (res.ok) {
      toast.success("Impor Database Berhasil!", {
        description: `${res.statementsExecuted} perintah SQL dieksekusi dalam ${res.durationMs}ms ke basis data \`${targetDb}\`.`,
      });
      setIsImportModalOpen(false);
      setSelectedImportFile(null);
      setImportSqlContent("");
      handleSelectDatabase(targetDb);
      handleRefreshDatabases();
    } else {
      toast.error("Gagal Mengimpor Database", {
        description: res.error || "Terjadi kesalahan saat mengeksekusi SQL.",
      });
    }
  };

  const handleExecuteExport = async (saveToFile = true) => {
    if (!currentSelectedDatabase) {
      toast.error("Pilih database terlebih dahulu untuk diekspor.");
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    let targetFilePath: string | undefined;
    if (saveToFile) {
      const defaultName = `${currentSelectedDatabase}_${new Date().toISOString().slice(0, 10)}.sql`;
      const fileRes = await promptSqlFileDialog({
        defaultFileName: defaultName,
        type: "save",
      });
      if (fileRes.canceled || !fileRes.filePath) {
        return;
      }
      targetFilePath = fileRes.filePath;
    }
    setIsExporting(true);
    toast.loading(`Mengekspor basis data \`${currentSelectedDatabase}\`...`, {
      id: "export-toast",
    });
    const res = await exportDatabase({
      connection: connParams,
      database: currentSelectedDatabase,
      filePath: targetFilePath,
      options: {
        addDropTable: exportAddDropTable,
        disableForeignKeyChecks: exportDisableFk,
        includeData: exportMode === "full" || exportMode === "data",
        includeStructure: exportMode === "full" || exportMode === "structure",
      },
    });
    setIsExporting(false);
    toast.dismiss("export-toast");
    if (res.ok) {
      if (saveToFile && res.filePath) {
        toast.success("Ekspor Database Berhasil Disimpan!", {
          description: `${res.tableCount} tabel (${res.rowCount} baris) disimpan ke ${res.filePath}`,
        });
        setIsExportModalOpen(false);
      } else if (res.sqlDump) {
        setExportPreviewSql(res.sqlDump);
        navigator.clipboard.writeText(res.sqlDump);
        toast.success("SQL Dump Berhasil Dihasilkan & Disalin!", {
          description: `${res.tableCount} tabel (${(res.sizeBytes / 1024).toFixed(1)} KB) disalin ke clipboard.`,
        });
      }
    } else {
      toast.error("Gagal Mengekspor Database", {
        description: res.error || "Gagal menghasilkan SQL dump.",
      });
    }
  };

  const handleLoadServerStatus = async () => {
    const connParams = getConnParams();
    setIsLoadingStatus(true);
    const res = await fetchServerStatus(connParams);
    setIsLoadingStatus(false);
    if (res.ok) {
      setServerStatusData(res);
    } else {
      toast.error("Gagal mengambil status server", { description: res.error });
    }
  };

  const handleLoadUserAccounts = async () => {
    const connParams = getConnParams();
    setIsLoadingUsers(true);
    const res = await fetchUserAccounts(connParams);
    setIsLoadingUsers(false);
    if (res.ok) {
      setUserAccountsData(res.users);
    } else {
      toast.error("Gagal mengambil daftar pengguna database", {
        description: res.error,
      });
    }
  };

  const handleLoadVariables = async () => {
    const connParams = getConnParams();
    setIsLoadingVariables(true);
    const res = await fetchServerVariables(connParams);
    setIsLoadingVariables(false);
    if (res.ok) {
      setServerVariablesData(res.variables);
    } else {
      toast.error("Gagal mengambil variabel server", {
        description: res.error,
      });
    }
  };

  const handleLoadEngines = async () => {
    const connParams = getConnParams();
    setIsLoadingEngines(true);
    const res = await fetchServerEngines(connParams);
    setIsLoadingEngines(false);
    if (res.ok) {
      setServerEnginesData(res.engines);
    } else {
      toast.error("Gagal mengambil mesin penyimpanan", {
        description: res.error,
      });
    }
  };

  const handleLoadCharsets = async () => {
    const connParams = getConnParams();
    setIsLoadingCharsets(true);
    const res = await fetchServerCharsets(connParams);
    setIsLoadingCharsets(false);
    if (res.ok) {
      setServerCharsetsData(res.charsets);
    } else {
      toast.error("Gagal mengambil set karakter", { description: res.error });
    }
  };

  const handleLoadPlugins = async () => {
    const connParams = getConnParams();
    setIsLoadingPlugins(true);
    const res = await fetchServerPlugins(connParams);
    setIsLoadingPlugins(false);
    if (res.ok) {
      setServerPluginsData(res.plugins);
    } else {
      toast.error("Gagal mengambil plugin server", { description: res.error });
    }
  };

  const handleSwitchWorkspaceTab = (tabId: WorkspaceTabId) => {
    setCurrentWorkspaceTab(tabId);
    if (tabId === "databases") {
      handleRefreshDatabases();
    } else if (tabId === "structure" && currentSelectedDatabase) {
      handleSelectDatabase(currentSelectedDatabase);
    } else if (tabId === "status") {
      handleLoadServerStatus();
    } else if (tabId === "users") {
      handleLoadUserAccounts();
    } else if (tabId === "variables") {
      handleLoadVariables();
    } else if (tabId === "engines") {
      handleLoadEngines();
    } else if (tabId === "charsets") {
      handleLoadCharsets();
    } else if (tabId === "plugins") {
      handleLoadPlugins();
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) {
      toast.error("Nama basis data tidak boleh kosong.");
      return;
    }
    const activePass = savedPasswords[profile.id] || "123";
    setIsCreatingDb(true);
    const res = await createDatabaseAction({
      collation: newDbCollation || undefined,
      connection: {
        host: profile.host,
        password: activePass,
        port: Number(profile.port),
        user: profile.username,
      },
      name: newDbName.trim(),
    });
    setIsCreatingDb(false);
    if (res.ok) {
      toast.success(`Basis data \`${res.name}\` berhasil dibuat!`);
      setIsCreateDbModalOpen(false);
      setNewDbName("");
      handleRefreshDatabases();
    } else {
      toast.error("Gagal membuat basis data", { description: res.error });
    }
  };

  const handleDropDatabase = (dbName: string) => {
    if (
      ["mysql", "information_schema", "performance_schema", "sys"].includes(
        dbName.toLowerCase()
      )
    ) {
      toast.error("Database sistem tidak dapat dihapus demi keamanan.");
      return;
    }
    setConfirmDialog({
      confirmText: "Hapus Basis Data",
      description: (
        <span>
          PERINGATAN KRITIKAL: Apakah Anda yakin ingin menghapus basis data{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-destructive">
            {dbName}
          </code>
          ? Seluruh tabel, relasi, dan data di dalamnya akan dimusnahkan secara
          permanen!
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const activePass = savedPasswords[profile.id] || "123";
        const res = await dropDatabaseAction({
          connection: {
            host: profile.host,
            password: activePass,
            port: Number(profile.port),
            user: profile.username,
          },
          name: dbName,
        });
        if (res.ok) {
          toast.success(`Basis data \`${dbName}\` berhasil dihapus.`);
          if (currentSelectedDatabase === dbName) {
            setCurrentSelectedDatabase("");
          }
          handleRefreshDatabases();
        } else {
          toast.error(`Gagal menghapus basis data \`${dbName}\``, {
            description: res.error,
          });
        }
      },
      title: "Hapus Basis Data (DROP DATABASE)",
      variant: "destructive",
    });
  };

  const handleSelectTable = async (tableName: string) => {
    setSelectedTable(tableName);
    const q = `SELECT * FROM \`${tableName}\` LIMIT 25;`;
    setSqlQuery(q);
    const connParams = getConnParams(currentSelectedDatabase);
    setIsExecutingQuery(true);
    const qRes = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    setIsExecutingQuery(false);
    if (qRes.ok) {
      setQueryResults(qRes);
    } else {
      toast.error("Gagal membaca tabel", { description: qRes.error });
    }
  };

  const handleExecuteQuery = async () => {
    setIsExecutingQuery(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const qRes = await executeSqlQuery(
      connParams,
      sqlQuery,
      currentSelectedDatabase
    );
    setIsExecutingQuery(false);
    if (qRes.ok) {
      setQueryResults(qRes);
      toast.success("Query Berhasil Dieksekusi!", {
        description: `${qRes.rowCount} baris dikembalikan dalam ${qRes.executionTimeMs}ms.`,
      });
    } else {
      toast.error("Query Error", {
        description: qRes.error || "Gagal mengeksekusi SQL.",
      });
    }
  };

  const handleChangeCollation = async () => {
    const activePass = savedPasswords[profile.id] || "123";
    const res = await executeSqlQuery(
      {
        database: currentSelectedDatabase,
        host: profile.host,
        password: activePass,
        port: Number(profile.port),
        user: profile.username,
      },
      `ALTER DATABASE \`${currentSelectedDatabase}\` COLLATE ${newDbCollation};`,
      currentSelectedDatabase
    );
    if (res.ok) {
      toast.success("Collation basis data berhasil diubah!");
    } else {
      toast.error("Gagal mengubah collation", { description: res.error });
    }
  };

  // Filtered computed values
  const filteredDatabases = useMemo(() => {
    if (!databaseSearch.trim()) {
      return availableDatabases;
    }
    const q = databaseSearch.toLowerCase();
    return availableDatabases.filter((db) => db.toLowerCase().includes(q));
  }, [availableDatabases, databaseSearch]);

  const displayTables = profile ? databaseTables : FALLBACK_TABLES;
  const filteredDisplayTables = displayTables.filter((t) =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );
  const totalDatabaseRows = useMemo(
    () => databaseTables.reduce((acc, curr) => acc + (curr.rows || 0), 0),
    [databaseTables]
  );

  const filteredVariables = useMemo(() => {
    if (!variablesSearch.trim()) {
      return serverVariablesData;
    }
    const q = variablesSearch.toLowerCase();
    return serverVariablesData.filter(
      (v) =>
        v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)
    );
  }, [serverVariablesData, variablesSearch]);

  const filteredCharsets = useMemo(() => {
    if (!charsetsSearch.trim()) {
      return serverCharsetsData;
    }
    const q = charsetsSearch.toLowerCase();
    return serverCharsetsData.filter(
      (c) =>
        c.charset.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.defaultCollation.toLowerCase().includes(q)
    );
  }, [serverCharsetsData, charsetsSearch]);

  const filteredPlugins = useMemo(() => {
    if (!pluginsSearch.trim()) {
      return serverPluginsData;
    }
    const q = pluginsSearch.toLowerCase();
    return serverPluginsData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [serverPluginsData, pluginsSearch]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Hidden file inputs for browser fallback */}
      <input
        accept=".sql"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleProcessChosenFile(file);
          }
        }}
        ref={fileInputRef}
        type="file"
      />
      <input
        accept=".sql"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleProcessChosenFile(file);
          }
        }}
        ref={modalFileInputRef}
        type="file"
      />

      {/* Explorer Sidebar */}
      <ExplorerSidebar
        activeConnectedProfile={profile}
        availableDatabases={availableDatabases}
        currentSelectedDatabase={currentSelectedDatabase}
        databaseSearch={databaseSearch}
        filteredDatabases={filteredDatabases}
        filteredDisplayTables={filteredDisplayTables}
        isLoadingTables={isLoadingTables}
        isOpen={isWorkspaceSidebarOpen}
        onClose={() => setIsWorkspaceSidebarOpen(false)}
        onOpenCreateDbModal={() => {
          setNewDbName("");
          setIsCreateDbModalOpen(true);
        }}
        onOpenDatabase={handleOpenDatabase}
        onRefreshDatabases={handleRefreshDatabases}
        onSelectTable={handleSelectTable}
        onSwitchToHub={() => navigate({ to: "/" })}
        selectedTable={selectedTable}
        setDatabaseSearch={setDatabaseSearch}
        setTableSearch={setTableSearch}
        tableSearch={tableSearch}
      />

      {/* Main Studio Viewport */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <WorkspaceNav
          activeConnectedProfile={profile}
          availableDatabasesCount={availableDatabases.length}
          currentSelectedDatabase={currentSelectedDatabase}
          currentWorkspaceTab={currentWorkspaceTab}
          isWorkspaceSidebarOpen={isWorkspaceSidebarOpen}
          onOpenWorkspaceSidebar={() => setIsWorkspaceSidebarOpen(true)}
          onSwitchWorkspaceTab={handleSwitchWorkspaceTab}
          selectedTable={selectedTable}
        />

        {/* Tab Contents */}
        {currentWorkspaceTab === "databases" && (
          <DatabasesTab
            availableDatabases={availableDatabases}
            currentSelectedDatabase={currentSelectedDatabase}
            databaseSearch={databaseSearch}
            filteredDatabases={filteredDatabases}
            onDropDatabase={handleDropDatabase}
            onOpenDatabase={handleOpenDatabase}
            onOpenExportModal={(db) => {
              setCurrentSelectedDatabase(db);
              setIsExportModalOpen(true);
            }}
            onRefreshDatabases={handleRefreshDatabases}
            onStartCreateDb={() => {
              setNewDbName("");
              setIsCreateDbModalOpen(true);
            }}
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
            onRefreshTables={() =>
              handleSelectDatabase(currentSelectedDatabase)
            }
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
            activeConnectedProfile={profile}
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

      {/* Workspace Modals */}
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
        serverHost={profile.host}
        serverPort={profile.port}
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

      <ConfirmDialog
        cancelText={confirmDialog.cancelText}
        confirmText={confirmDialog.confirmText}
        description={confirmDialog.description}
        isOpen={confirmDialog.isOpen}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        variant={confirmDialog.variant}
      />
    </div>
  );
}

export const Route = createFileRoute("/workspace/$profileId")({
  component: WorkspaceStudioPage,
});
