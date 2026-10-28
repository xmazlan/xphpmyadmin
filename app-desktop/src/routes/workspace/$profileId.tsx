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
import { RoutinesTab } from "@/components/workspace/tabs/routines-tab";
import { SearchTab } from "@/components/workspace/tabs/search-tab";
import { SqlTab } from "@/components/workspace/tabs/sql-tab";
import { StatusTab } from "@/components/workspace/tabs/status-tab";
import { StructureTab } from "@/components/workspace/tabs/structure-tab";
import { UsersTab } from "@/components/workspace/tabs/users-tab";
import { VariablesTab } from "@/components/workspace/tabs/variables-tab";
import type {
  DatabaseSearchResult,
  RoutineItem,
  TableItem,
  TriggerItem,
  WorkspaceTabId,
} from "@/components/workspace/types";
import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import { useConnection } from "@/context/connection-context";
import { useCloudSync } from "@/context/cloud-sync-context";

export function WorkspaceStudioPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const { profiles, savedPasswords, setActiveTabId } = useConnection();
  const { recordAction, recordQuery } = useCloudSync();

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
  const [exportFormat, setExportFormat] = useState<
    "sql" | "csv" | "json" | "xml"
  >("sql");
  const [exportMethod, setExportMethod] = useState<"quick" | "custom">("quick");
  const [exportSelectedTables, setExportSelectedTables] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"full" | "structure" | "data">(
    "full"
  );
  const [exportAddDropTable, setExportAddDropTable] = useState(true);
  const [exportDisableFk, setExportDisableFk] = useState(true);
  const [exportPreviewSql, setExportPreviewSql] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [importTargetTable, setImportTargetTable] = useState("");
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

  // State untuk Search Tab
  const [searchResults, setSearchResults] = useState<DatabaseSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State untuk Routines & Triggers Tab
  const [routinesData, setRoutinesData] = useState<RoutineItem[]>([]);
  const [triggersData, setTriggersData] = useState<TriggerItem[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);

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

  // State untuk Operasi Basis Data
  const [newDbCollation, setNewDbCollation] = useState("utf8mb4_general_ci");
  const [isCreateDbModalOpen, setIsCreateDbModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [isCreatingDb, setIsCreatingDb] = useState(false);

  // Helper koneksi aktif
  const getConnParams = (targetDb?: string) => {
    return {
      database: targetDb || profile?.database || undefined,
      host: profile?.host || "127.0.0.1",
      method: profile?.method || "direct",
      password:
        (profile?.id && savedPasswords[profile.id]) ||
        (profile as any)?.password ||
        "",
      port: profile?.port || 3306,
      ssh: profile?.ssh || null,
      user: profile?.username || "root",
    };
  };

  // Muat basis data saat inisialisasi
  useEffect(() => {
    if (!profile) return;
    const loadDbs = async () => {
      const connParams = getConnParams();
      const res = await fetchDatabases(connParams);
      if (res.ok && res.databases) {
        setAvailableDatabases(res.databases);
        if (res.databases.length > 0 && !currentSelectedDatabase) {
          setCurrentSelectedDatabase(res.databases[0]);
        }
      }
    };
    loadDbs();
  }, [profile]);

  // Muat tabel saat database berubah
  useEffect(() => {
    if (!profile || !currentSelectedDatabase) return;
    const loadTables = async () => {
      setIsLoadingTables(true);
      const connParams = getConnParams(currentSelectedDatabase);
      const res = await fetchTables(connParams, currentSelectedDatabase);
      setIsLoadingTables(false);
      if (res.ok && res.tables) {
        setDatabaseTables(res.tables);
        if (res.tables.length > 0) {
          const firstTbl = res.tables[0].name;
          setSelectedTable(firstTbl);
          setSqlQuery(`SELECT * FROM \`${firstTbl}\` LIMIT 25;`);
          setSelectedTableCheckboxes([]);
          setExportSelectedTables(res.tables.map((t) => t.name));
        } else {
          setSelectedTable("");
          setSqlQuery(`-- Basis data \`${currentSelectedDatabase}\` kosong.`);
          setSelectedTableCheckboxes([]);
          setExportSelectedTables([]);
        }
      } else {
        setDatabaseTables(FALLBACK_TABLES);
      }
    };
    loadTables();
  }, [profile, currentSelectedDatabase]);

  const handleSelectDatabase = async (dbName: string) => {
    setCurrentSelectedDatabase(dbName);
    setIsLoadingTables(true);
    const connParams = getConnParams(dbName);
    const tablesRes = await fetchTables(connParams, dbName);
    setIsLoadingTables(false);
    if (tablesRes.ok && tablesRes.tables) {
      setDatabaseTables(tablesRes.tables);
      setSelectedTableCheckboxes([]);
      setExportSelectedTables(tablesRes.tables.map((t) => t.name));
      if (tablesRes.tables.length > 0) {
        const firstTbl = tablesRes.tables[0].name;
        setSelectedTable(firstTbl);
        setSqlQuery(`SELECT * FROM \`${firstTbl}\` LIMIT 25;`);
      } else {
        setSelectedTable("");
        setSqlQuery(`-- Basis data \`${dbName}\` belum memiliki tabel.`);
      }
    } else {
      setDatabaseTables(FALLBACK_TABLES);
      toast.error(`Gagal memuat daftar tabel dari \`${dbName}\``, {
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
    } else {
      toast.error(`Gagal menjalankan query untuk \`${tableName}\``, {
        description: qRes.error,
      });
    }
  };

  const handleViewTableStructure = async (tableName: string) => {
    setSelectedTableForStructure(tableName);
    setIsLoadingTableStructure(true);
    setIsTableStructureModalOpen(true);
    const connParams = getConnParams(currentSelectedDatabase);
    try {
      const colRes = await executeSqlQuery(
        connParams,
        `SHOW FULL COLUMNS FROM \`${tableName}\`;`,
        currentSelectedDatabase
      );
      const idxRes = await executeSqlQuery(
        connParams,
        `SHOW INDEX FROM \`${tableName}\`;`,
        currentSelectedDatabase
      );
      if (colRes.ok) {
        setTableStructureColumns(colRes.rows);
      } else {
        toast.error("Gagal memuat struktur kolom", {
          description: colRes.error,
        });
      }
      if (idxRes.ok) {
        setTableStructureIndexes(idxRes.rows);
      }
    } catch (err: any) {
      toast.error("Gagal memuat struktur tabel", { description: err?.message });
    } finally {
      setIsLoadingTableStructure(false);
    }
  };

  const handleOpenInsertModal = async (tableName: string) => {
    setSelectedTableForInsert(tableName);
    setInsertColumnValues({});
    setIsInsertModalOpen(true);
    const connParams = getConnParams(currentSelectedDatabase);
    const colRes = await executeSqlQuery(
      connParams,
      `SHOW FULL COLUMNS FROM \`${tableName}\`;`,
      currentSelectedDatabase
    );
    if (colRes.ok) {
      setTableStructureColumns(colRes.rows);
    }
  };

  const handleExecuteInsertRow = async () => {
    if (!selectedTableForInsert) return;
    const filledCols = Object.keys(insertColumnValues).filter(
      (k) => insertColumnValues[k] !== undefined && insertColumnValues[k] !== ""
    );
    if (filledCols.length === 0) {
      toast.warning("Harap isi setidaknya satu kolom nilai.");
      return;
    }
    const colsList = filledCols.map((c) => `\`${c}\``).join(", ");
    const valsList = filledCols
      .map((c) => {
        const val = insertColumnValues[c];
        return `'${String(val).replace(/'/g, "\\'")}'`;
      })
      .join(", ");
    const insertQuery = `INSERT INTO \`${selectedTableForInsert}\` (${colsList}) VALUES (${valsList});`;

    setIsInsertingRow(true);
    const connParams = getConnParams(currentSelectedDatabase);
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

  const handleDeleteRow = (row: any) => {
    if (!selectedTable) {
      toast.error("Pilih tabel terlebih dahulu untuk menghapus baris.");
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    const whereConditions = Object.entries(row)
      .slice(0, 3)
      .map(([k, v]) => {
        if (v === null || v === undefined) return `\`${k}\` IS NULL`;
        return `\`${k}\` = '${String(v).replace(/'/g, "\\'")}'`;
      })
      .join(" AND ");

    setConfirmDialog({
      confirmText: "Hapus Baris",
      description: (
        <span>
          Apakah Anda yakin ingin menghapus baris ini dari tabel{" "}
          <strong>`{selectedTable}`</strong>?
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 font-mono text-[10px]">
            {JSON.stringify(row, null, 2)}
          </pre>
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const delSql = `DELETE FROM \`${selectedTable}\` WHERE ${whereConditions} LIMIT 1;`;
        const res = await executeSqlQuery(
          connParams,
          delSql,
          currentSelectedDatabase
        );
        if (res.ok) {
          recordAction({
            action: "row_delete",
            category: "data",
            database: currentSelectedDatabase,
            details: { whereConditions },
            profileId: profile?.id,
            profileName: profile?.name,
            table: selectedTable,
          });
          toast.success("1 baris berhasil dihapus!");
          handleBrowseTable(selectedTable);
        } else {
          toast.error("Gagal menghapus baris", { description: res.error });
        }
      },
      title: "Hapus Baris Data (DELETE)",
      variant: "destructive",
    });
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
      const q = `OPTIMIZE TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) {
        toast.success(
          `Optimasi ${selectedTableCheckboxes.length} tabel berhasil!`
        );
      } else {
        toast.error("Gagal mengoptimasi tabel", { description: res.error });
      }
      setSelectedTableCheckboxes([]);
      handleSelectDatabase(currentSelectedDatabase);
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
      setSelectedTableCheckboxes([]);
    } else if (bulkAction === "analyze") {
      const q = `ANALYZE TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) {
        toast.success(
          `Analisis ${selectedTableCheckboxes.length} tabel selesai!`
        );
      } else {
        toast.error("Gagal menganalisis tabel", { description: res.error });
      }
      setSelectedTableCheckboxes([]);
    } else if (bulkAction === "repair") {
      const q = `REPAIR TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) {
        toast.success(
          `Perbaikan ${selectedTableCheckboxes.length} tabel selesai!`
        );
      } else {
        toast.error("Gagal memperbaiki tabel", { description: res.error });
      }
      setSelectedTableCheckboxes([]);
    } else if (bulkAction === "checksum") {
      const q = `CHECKSUM TABLE ${selectedTableCheckboxes.map((t) => `\`${t}\``).join(", ")};`;
      const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
      if (res.ok) {
        toast.success(
          `Checksum ${selectedTableCheckboxes.length} tabel selesai!`
        );
      } else {
        toast.error("Gagal menghitung checksum", { description: res.error });
      }
      setSelectedTableCheckboxes([]);
    } else if (bulkAction === "export") {
      setExportSelectedTables([...selectedTableCheckboxes]);
      setExportMethod("custom");
      setCurrentWorkspaceTab("export");
      toast.info(
        `Beralih ke tab Ekspor dengan ${selectedTableCheckboxes.length} tabel terpilih.`
      );
    }
  };

  const handleRefreshDatabases = async () => {
    const connParams = getConnParams();
    const res = await fetchDatabases(connParams);
    if (res.ok && res.databases) {
      setAvailableDatabases(res.databases);
      toast.success("Daftar basis data berhasil diperbarui.");
    } else {
      toast.error("Gagal menyegarkan basis data", { description: res.error });
    }
  };

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.warning("Kueri SQL tidak boleh kosong.");
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    setIsExecutingQuery(true);
    const start = Date.now();
    const res = await executeSqlQuery(
      connParams,
      sqlQuery,
      currentSelectedDatabase
    );
    setIsExecutingQuery(false);
    const duration = Date.now() - start;
    recordQuery({
      database: currentSelectedDatabase,
      durationMs: res.executionTimeMs || duration,
      errorMessage: res.error,
      profileId: profile?.id || "unknown",
      profileName: profile?.name,
      query: sqlQuery,
      rowsAffected: res.rowCount,
      success: res.ok,
    });
    recordAction({
      action: "query_execute",
      category: "data",
      database: currentSelectedDatabase,
      details: {
        durationMs: res.executionTimeMs || duration,
        rowCount: res.rowCount,
        sql: sqlQuery.slice(0, 300),
        success: res.ok,
      },
      profileId: profile?.id,
      profileName: profile?.name,
    });
    if (res.ok) {
      setQueryResults(res);
      toast.success(
        `Eksekusi berhasil (${res.rowCount} baris, ${res.executionTimeMs}ms)`
      );
    } else {
      toast.error("Kueri SQL Gagal Dieksekusi", {
        description: res.error || "Periksa kembali sintaks kueri Anda.",
      });
    }
  };

  const handlePickImportFile = async (isModal: boolean) => {
    const res = await promptSqlFileDialog({ type: "open" });
    if (!res.canceled && res.filePath) {
      setSelectedImportFile({
        fileName: res.fileName || "unknown.sql",
        filePath: res.filePath,
        fileSize: res.fileSize || 0,
      });
      toast.info(`Berkas terpilih: ${res.fileName}`);
    } else if (res.canceled) {
      const inputRef = isModal ? modalFileInputRef : fileInputRef;
      if (inputRef.current) {
        inputRef.current.click();
      }
    }
  };

  const handleProcessChosenFile = (file: File) => {
    setSelectedImportFile({
      fileName: file.name,
      filePath: (file as any).path || file.name,
      fileSize: file.size,
    });
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportSqlContent(text);
        toast.success(`Berkas ${file.name} siap diimpor!`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    const targetDb = currentSelectedDatabase || profile.database;
    if (!targetDb) {
      toast.error("Pilih target basis data terlebih dahulu sebelum mengimpor.");
      return;
    }
    const connParams = getConnParams(targetDb);
    setIsImporting(true);
    toast.loading(`Mengimpor ke basis data \`${targetDb}\`...`, {
      id: "import-toast",
    });
    const res = await importDatabase({
      connection: connParams,
      database: targetDb,
      filePath:
        importTab === "file" && selectedImportFile
          ? selectedImportFile.filePath
          : undefined,
      sqlContent:
        importTab === "paste"
          ? importSqlContent
          : importSqlContent || undefined,
      targetTable: importTargetTable || undefined,
    });
    setIsImporting(false);
    toast.dismiss("import-toast");
    if (res.ok) {
      recordAction({
        action: "import",
        category: "export_import",
        database: targetDb,
        details: {
          durationMs: res.durationMs,
          fileName: selectedImportFile?.fileName,
          statementsExecuted: res.statementsExecuted,
          targetTable: importTargetTable || undefined,
        },
        profileId: profile?.id,
        profileName: profile?.name,
      });
      toast.success("Impor Database Berhasil!", {
        description: `${res.statementsExecuted} perintah/baris dieksekusi dalam ${res.durationMs}ms ke basis data \`${targetDb}\`.`,
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
    const defaultExt =
      exportFormat === "csv"
        ? "csv"
        : exportFormat === "json"
          ? "json"
          : exportFormat === "xml"
            ? "xml"
            : "sql";

    if (saveToFile) {
      const defaultName = `${currentSelectedDatabase}_${new Date().toISOString().slice(0, 10)}.${defaultExt}`;
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
    toast.loading(
      `Mengekspor basis data \`${currentSelectedDatabase}\` (${exportFormat.toUpperCase()})...`,
      {
        id: "export-toast",
      }
    );
    const res = await exportDatabase({
      connection: connParams,
      database: currentSelectedDatabase,
      filePath: targetFilePath,
      format: exportFormat,
      options: {
        addDropTable: exportAddDropTable,
        disableForeignKeyChecks: exportDisableFk,
        includeData: exportMode === "full" || exportMode === "data",
        includeStructure: exportMode === "full" || exportMode === "structure",
      },
      tables:
        exportMethod === "custom" && exportSelectedTables.length > 0
          ? exportSelectedTables
          : undefined,
    });
    setIsExporting(false);
    toast.dismiss("export-toast");
    if (res.ok) {
      recordAction({
        action: "export",
        category: "export_import",
        database: currentSelectedDatabase,
        details: {
          filePath: res.filePath,
          format: exportFormat,
          method: exportMethod,
          rowCount: res.rowCount,
          tableCount: res.tableCount,
        },
        profileId: profile?.id,
        profileName: profile?.name,
      });
      if (saveToFile && res.filePath) {
        toast.success("Ekspor Database Berhasil Disimpan!", {
          description: `${res.tableCount} tabel (${res.rowCount} baris) disimpan ke ${res.filePath}`,
        });
        setIsExportModalOpen(false);
      } else if (res.sqlDump) {
        setExportPreviewSql(res.sqlDump);
        navigator.clipboard.writeText(res.sqlDump);
        toast.success(
          `Hasil Ekspor (${exportFormat.toUpperCase()}) Berhasil Dihasilkan & Disalin!`,
          {
            description: `${res.tableCount} tabel (${(res.sizeBytes / 1024).toFixed(1)} KB) disalin ke clipboard.`,
          }
        );
      }
    } else {
      toast.error("Gagal Mengekspor Database", {
        description: res.error || "Gagal menghasilkan berkas ekspor.",
      });
    }
  };

  // Search Tab Handlers
  const handleExecuteSearch = async (
    searchWord: string,
    searchMode: "like" | "exact" | "regexp",
    targetTables: string[]
  ) => {
    if (!currentSelectedDatabase) return;
    const connParams = getConnParams(currentSelectedDatabase);
    setIsSearching(true);
    const results: DatabaseSearchResult[] = [];

    for (const tbl of targetTables) {
      try {
        const colRes = await executeSqlQuery(
          connParams,
          `SHOW COLUMNS FROM \`${tbl}\`;`,
          currentSelectedDatabase
        );
        if (colRes.ok && colRes.rows.length > 0) {
          const textCols = (colRes.rows as any[])
            .map((r: any) => r.Field)
            .filter(Boolean);

          if (textCols.length === 0) {
            results.push({ count: 0, table: tbl });
            continue;
          }

          const escapedWord = searchWord.replace(/'/g, "\\'");
          let condition = "";
          if (searchMode === "exact") {
            condition = textCols
              .map((c: string) => `\`${c}\` = '${escapedWord}'`)
              .join(" OR ");
          } else if (searchMode === "regexp") {
            condition = textCols
              .map((c: string) => `\`${c}\` REGEXP '${escapedWord}'`)
              .join(" OR ");
          } else {
            condition = textCols
              .map((c: string) => `\`${c}\` LIKE '%${escapedWord}%'`)
              .join(" OR ");
          }

          const countRes = await executeSqlQuery(
            connParams,
            `SELECT COUNT(*) as cnt FROM \`${tbl}\` WHERE ${condition};`,
            currentSelectedDatabase
          );

          const cnt =
            countRes.ok && countRes.rows[0]
              ? Number((countRes.rows[0] as any).cnt ?? 0)
              : 0;
          results.push({ count: cnt, table: tbl });
        } else {
          results.push({ count: 0, table: tbl });
        }
      } catch {
        results.push({ count: 0, table: tbl });
      }
    }

    setIsSearching(false);
    setSearchResults(results);
  };

  const handleBrowseTableMatches = (
    tableName: string,
    searchWord: string,
    searchMode: "like" | "exact" | "regexp"
  ) => {
    setSelectedTable(tableName);
    setCurrentWorkspaceTab("sql");
    const connParams = getConnParams(currentSelectedDatabase);
    executeSqlQuery(
      connParams,
      `SHOW COLUMNS FROM \`${tableName}\`;`,
      currentSelectedDatabase
    ).then((colRes) => {
      const escapedWord = searchWord.replace(/'/g, "\\'");
      let where = "";
      if (colRes.ok && colRes.rows.length > 0) {
        const textCols = (colRes.rows as any[])
          .map((r: any) => r.Field)
          .filter(Boolean);
        if (searchMode === "exact") {
          where = textCols
            .map((c: string) => `\`${c}\` = '${escapedWord}'`)
            .join(" OR ");
        } else if (searchMode === "regexp") {
          where = textCols
            .map((c: string) => `\`${c}\` REGEXP '${escapedWord}'`)
            .join(" OR ");
        } else {
          where = textCols
            .map((c: string) => `\`${c}\` LIKE '%${escapedWord}%'`)
            .join(" OR ");
        }
      }
      const q = where
        ? `SELECT * FROM \`${tableName}\` WHERE ${where} LIMIT 50;`
        : `SELECT * FROM \`${tableName}\` LIMIT 50;`;
      setSqlQuery(q);
      setIsExecutingQuery(true);
      executeSqlQuery(connParams, q, currentSelectedDatabase).then((qRes) => {
        setIsExecutingQuery(false);
        if (qRes.ok) setQueryResults(qRes);
      });
    });
  };

  // Routines & Triggers Handlers
  const handleLoadRoutines = async () => {
    if (!currentSelectedDatabase) return;
    const connParams = getConnParams(currentSelectedDatabase);
    setIsLoadingRoutines(true);
    try {
      const procRes = await executeSqlQuery(
        connParams,
        `SHOW PROCEDURE STATUS WHERE Db = '${currentSelectedDatabase}';`,
        currentSelectedDatabase
      );
      const funcRes = await executeSqlQuery(
        connParams,
        `SHOW FUNCTION STATUS WHERE Db = '${currentSelectedDatabase}';`,
        currentSelectedDatabase
      );
      const trigRes = await executeSqlQuery(
        connParams,
        `SHOW TRIGGERS FROM \`${currentSelectedDatabase}\`;`,
        currentSelectedDatabase
      );

      const routines: RoutineItem[] = [];
      if (procRes.ok && procRes.rows) {
        for (const r of procRes.rows as any[]) {
          routines.push({
            comment: r.Comment,
            created: r.Created,
            definer: r.Definer,
            modified: r.Modified,
            name: r.Name,
            securityType: r.Security_type,
            type: "PROCEDURE",
          });
        }
      }
      if (funcRes.ok && funcRes.rows) {
        for (const r of funcRes.rows as any[]) {
          routines.push({
            comment: r.Comment,
            created: r.Created,
            definer: r.Definer,
            modified: r.Modified,
            name: r.Name,
            securityType: r.Security_type,
            type: "FUNCTION",
          });
        }
      }
      setRoutinesData(routines);

      const triggers: TriggerItem[] = [];
      if (trigRes.ok && trigRes.rows) {
        for (const t of trigRes.rows as any[]) {
          triggers.push({
            actionOrder: t.Action_order,
            event: t.Event,
            name: t.Trigger,
            statement: t.Statement,
            table: t.Table,
            timing: t.Timing,
          });
        }
      }
      setTriggersData(triggers);
    } catch (err: any) {
      toast.error("Gagal memuat rutin dan trigger", {
        description: err?.message,
      });
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  const handleExecuteRoutine = async (routineName: string) => {
    const connParams = getConnParams(currentSelectedDatabase);
    const q = `CALL \`${routineName}\`();`;
    setSqlQuery(q);
    setCurrentWorkspaceTab("sql");
    setIsExecutingQuery(true);
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    setIsExecutingQuery(false);
    if (res.ok) {
      setQueryResults(res);
      toast.success(`Rutin \`${routineName}\` berhasil dieksekusi!`);
    } else {
      toast.error(`Gagal mengeksekusi rutin \`${routineName}\``, {
        description: res.error,
      });
    }
  };

  const handleViewRoutineCode = async (
    name: string,
    type: "PROCEDURE" | "FUNCTION" | "TRIGGER"
  ) => {
    const connParams = getConnParams(currentSelectedDatabase);
    const q =
      type === "TRIGGER"
        ? `SHOW CREATE TRIGGER \`${name}\`;`
        : `SHOW CREATE ${type} \`${name}\`;`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    if (res.ok && res.rows[0]) {
      const row0 = res.rows[0] as any;
      const code =
        row0["SQL Original Statement"] ||
        row0[`Create ${type.charAt(0) + type.slice(1).toLowerCase()}`] ||
        JSON.stringify(row0, null, 2);
      setSqlQuery(code);
      setCurrentWorkspaceTab("sql");
      toast.info(`Definisi ${type} dimuat ke tab SQL Runner.`);
    } else {
      toast.error(`Gagal mengambil definisi ${type}`, {
        description: res.error,
      });
    }
  };

  const handleDropRoutine = (name: string, type: "PROCEDURE" | "FUNCTION") => {
    setConfirmDialog({
      confirmText: `Hapus ${type}`,
      description: `Apakah Anda yakin ingin menghapus ${type} \`${name}\` dari basis data?`,
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const connParams = getConnParams(currentSelectedDatabase);
        const res = await executeSqlQuery(
          connParams,
          `DROP ${type} IF EXISTS \`${name}\`;`,
          currentSelectedDatabase
        );
        if (res.ok) {
          toast.success(`${type} \`${name}\` berhasil dihapus!`);
          handleLoadRoutines();
        } else {
          toast.error(`Gagal menghapus ${type}`, { description: res.error });
        }
      },
      title: `Hapus ${type} (DROP)`,
      variant: "destructive",
    });
  };

  const handleDropTrigger = (triggerName: string) => {
    setConfirmDialog({
      confirmText: "Hapus Trigger",
      description: `Apakah Anda yakin ingin menghapus Trigger \`${triggerName}\`?`,
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const connParams = getConnParams(currentSelectedDatabase);
        const res = await executeSqlQuery(
          connParams,
          `DROP TRIGGER IF EXISTS \`${triggerName}\`;`,
          currentSelectedDatabase
        );
        if (res.ok) {
          toast.success(`Trigger \`${triggerName}\` berhasil dihapus!`);
          handleLoadRoutines();
        } else {
          toast.error("Gagal menghapus trigger", { description: res.error });
        }
      },
      title: "Hapus Trigger (DROP TRIGGER)",
      variant: "destructive",
    });
  };

  // Operations Tab Database Handlers
  const handleRenameDatabase = async (newDbName: string) => {
    if (!currentSelectedDatabase || !newDbName.trim()) return;
    const oldDb = currentSelectedDatabase;
    const newDb = newDbName.trim();
    const connParams = getConnParams();
    toast.loading(`Memindahkan basis data \`${oldDb}\` ke \`${newDb}\`...`, {
      id: "rename-db-toast",
    });
    try {
      const cRes = await executeSqlQuery(
        connParams,
        `CREATE DATABASE \`${newDb}\`;`
      );
      if (!cRes.ok) {
        toast.dismiss("rename-db-toast");
        toast.error("Gagal membuat basis data target", {
          description: cRes.error,
        });
        return;
      }
      for (const t of databaseTables) {
        await executeSqlQuery(
          connParams,
          `RENAME TABLE \`${oldDb}\`.\`${t.name}\` TO \`${newDb}\`.\`${t.name}\`;`
        );
      }
      await executeSqlQuery(connParams, `DROP DATABASE \`${oldDb}\`;`);
      toast.dismiss("rename-db-toast");
      toast.success(`Basis data berhasil diubah namanya menjadi \`${newDb}\`!`);
      await handleRefreshDatabases();
      handleSelectDatabase(newDb);
    } catch (err: any) {
      toast.dismiss("rename-db-toast");
      toast.error("Terjadi kegagalan saat mengubah nama basis data", {
        description: err?.message,
      });
    }
  };

  const handleCopyDatabase = async (
    targetDbName: string,
    includeData: boolean
  ) => {
    if (!currentSelectedDatabase || !targetDbName.trim()) return;
    const targetDb = targetDbName.trim();
    const connParams = getConnParams();
    toast.loading(
      `Menyalin basis data \`${currentSelectedDatabase}\` ke \`${targetDb}\`...`,
      {
        id: "copy-db-toast",
      }
    );
    try {
      const cRes = await executeSqlQuery(
        connParams,
        `CREATE DATABASE \`${targetDb}\`;`
      );
      if (!cRes.ok) {
        toast.dismiss("copy-db-toast");
        toast.error("Gagal membuat basis data salinan", {
          description: cRes.error,
        });
        return;
      }
      for (const t of databaseTables) {
        await executeSqlQuery(
          connParams,
          `CREATE TABLE \`${targetDb}\`.\`${t.name}\` LIKE \`${currentSelectedDatabase}\`.\`${t.name}\`;`
        );
        if (includeData) {
          await executeSqlQuery(
            connParams,
            `INSERT INTO \`${targetDb}\`.\`${t.name}\` SELECT * FROM \`${currentSelectedDatabase}\`.\`${t.name}\`;`
          );
        }
      }
      toast.dismiss("copy-db-toast");
      toast.success(
        `Basis data berhasil disalin ke \`${targetDb}\` (${includeData ? "Struktur & Data" : "Hanya Struktur"})!`
      );
      await handleRefreshDatabases();
    } catch (err: any) {
      toast.dismiss("copy-db-toast");
      toast.error("Gagal menyalin basis data", { description: err?.message });
    }
  };

  const handleRenameTable = async (oldName: string, newName: string) => {
    const connParams = getConnParams(currentSelectedDatabase);
    const q = `RENAME TABLE \`${currentSelectedDatabase}\`.\`${oldName}\` TO \`${currentSelectedDatabase}\`.\`${newName}\`;`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    if (res.ok) {
      toast.success(
        `Tabel \`${oldName}\` berhasil diubah menjadi \`${newName}\`!`
      );
      handleSelectDatabase(currentSelectedDatabase);
    } else {
      toast.error("Gagal mengubah nama tabel", { description: res.error });
    }
  };

  const handleCopyTable = async (
    sourceTable: string,
    targetTable: string,
    includeData: boolean
  ) => {
    const connParams = getConnParams(currentSelectedDatabase);
    const qLike = `CREATE TABLE \`${currentSelectedDatabase}\`.\`${targetTable}\` LIKE \`${currentSelectedDatabase}\`.\`${sourceTable}\`;`;
    const res = await executeSqlQuery(connParams, qLike, currentSelectedDatabase);
    if (res.ok) {
      if (includeData) {
        await executeSqlQuery(
          connParams,
          `INSERT INTO \`${currentSelectedDatabase}\`.\`${targetTable}\` SELECT * FROM \`${currentSelectedDatabase}\`.\`${sourceTable}\`;`,
          currentSelectedDatabase
        );
      }
      toast.success(
        `Tabel \`${sourceTable}\` berhasil disalin ke \`${targetTable}\`!`
      );
      handleSelectDatabase(currentSelectedDatabase);
    } else {
      toast.error("Gagal menyalin tabel", { description: res.error });
    }
  };

  const handleMaintainTable = async (
    tableName: string,
    action: "OPTIMIZE" | "CHECK" | "ANALYZE" | "REPAIR" | "CHECKSUM"
  ) => {
    const connParams = getConnParams(currentSelectedDatabase);
    const q = `${action} TABLE \`${currentSelectedDatabase}\`.\`${tableName}\`;`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    if (res.ok) {
      recordAction({
        action: "table_maintenance",
        category: "table",
        database: currentSelectedDatabase,
        details: { action },
        profileId: profile?.id,
        profileName: profile?.name,
        table: tableName,
      });
      toast.success(`Perintah ${action} TABLE pada \`${tableName}\` berhasil!`);
    } else {
      toast.error(`Gagal menjalankan ${action} TABLE`, {
        description: res.error,
      });
    }
  };

  const handleUpdateTableOptions = async (
    tableName: string,
    options: { autoIncrement?: number; collation?: string; engine?: string }
  ) => {
    const connParams = getConnParams(currentSelectedDatabase);
    const parts: string[] = [];
    if (options.engine) parts.push(`ENGINE = ${options.engine}`);
    if (options.collation) parts.push(`COLLATE = ${options.collation}`);
    if (typeof options.autoIncrement === "number" && options.autoIncrement > 0) {
      parts.push(`AUTO_INCREMENT = ${options.autoIncrement}`);
    }
    if (parts.length === 0) return;
    const q = `ALTER TABLE \`${currentSelectedDatabase}\`.\`${tableName}\` ${parts.join(", ")};`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    if (res.ok) {
      toast.success(`Opsi tabel \`${tableName}\` berhasil diperbarui!`);
      handleSelectDatabase(currentSelectedDatabase);
    } else {
      toast.error("Gagal memperbarui opsi tabel", { description: res.error });
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
    } else if (tabId === "routines" && currentSelectedDatabase) {
      handleLoadRoutines();
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
    setIsCreatingDb(true);
    const res = await createDatabaseAction({
      collation: newDbCollation || undefined,
      connection: getConnParams(),
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
          PERINGATAN: Apakah Anda yakin ingin menghapus permanen basis data{" "}
          <strong>`{dbName}`</strong> beserta seluruh tabel dan data di
          dalamnya? Tindakan ini tidak dapat dibatalkan.
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const res = await dropDatabaseAction({
          connection: getConnParams(),
          name: dbName,
        });
        if (res.ok) {
          toast.success(`Basis data \`${res.name}\` berhasil dihapus!`);
          handleRefreshDatabases();
          if (currentSelectedDatabase === dbName) {
            const nextDb =
              availableDatabases.find((d) => d !== dbName) || "mysql";
            handleSelectDatabase(nextDb);
          }
        } else {
          toast.error("Gagal menghapus basis data", { description: res.error });
        }
      },
      title: `Hapus Basis Data \`${dbName}\``,
      variant: "destructive",
    });
  };

  const handleEmptyTable = (tableName: string) => {
    setConfirmDialog({
      confirmText: "Kosongkan Tabel",
      description: (
        <span>
          Apakah Anda yakin ingin mengosongkan seluruh baris data dari tabel{" "}
          <strong>`{tableName}`</strong>? Seluruh data akan terhapus namun
          struktur tabel tetap dipertahankan.
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const connParams = getConnParams(currentSelectedDatabase);
        const res = await executeSqlQuery(
          connParams,
          `TRUNCATE TABLE \`${tableName}\`;`,
          currentSelectedDatabase
        );
        if (res.ok) {
          toast.success(`Tabel \`${tableName}\` berhasil dikosongkan!`);
          handleSelectDatabase(currentSelectedDatabase);
        } else {
          toast.error("Gagal mengosongkan tabel", { description: res.error });
        }
      },
      title: `Kosongkan Tabel \`${tableName}\` (TRUNCATE)`,
      variant: "destructive",
    });
  };

  const handleDropTable = (tableName: string) => {
    setConfirmDialog({
      confirmText: "Hapus Tabel",
      description: (
        <span>
          PERINGATAN: Apakah Anda yakin ingin menghapus tabel{" "}
          <strong>`{tableName}`</strong> secara permanen? Struktur dan seluruh
          data di dalamnya akan dihancurkan.
        </span>
      ),
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const connParams = getConnParams(currentSelectedDatabase);
        const res = await executeSqlQuery(
          connParams,
          `DROP TABLE \`${tableName}\`;`,
          currentSelectedDatabase
        );
        if (res.ok) {
          toast.success(`Tabel \`${tableName}\` berhasil dihapus!`);
          handleSelectDatabase(currentSelectedDatabase);
        } else {
          toast.error("Gagal menghapus tabel", { description: res.error });
        }
      },
      title: `Hapus Tabel \`${tableName}\` (DROP TABLE)`,
      variant: "destructive",
    });
  };

  const handleChangeCollation = async () => {
    if (!currentSelectedDatabase) return;
    const connParams = getConnParams(currentSelectedDatabase);
    const q = `ALTER DATABASE \`${currentSelectedDatabase}\` CHARACTER SET utf8mb4 COLLATE ${newDbCollation};`;
    const res = await executeSqlQuery(connParams, q, currentSelectedDatabase);
    if (res.ok) {
      toast.success(
        `Collation basis data berhasil diubah ke \`${newDbCollation}\`!`
      );
    } else {
      toast.error("Gagal mengubah collation", { description: res.error });
    }
  };

  const handleCreateTable = async () => {
    if (!newTableNameInput.trim()) {
      toast.error("Nama tabel tidak boleh kosong.");
      return;
    }
    const connParams = getConnParams(currentSelectedDatabase);
    setIsCreatingTable(true);
    const createQuery = `CREATE TABLE \`${newTableNameInput.trim()}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const res = await executeSqlQuery(
      connParams,
      createQuery,
      currentSelectedDatabase
    );
    setIsCreatingTable(false);
    if (res.ok) {
      toast.success(
        `Tabel \`${newTableNameInput.trim()}\` berhasil dibuat dengan ${newTableColumnsInput} kolom awal!`
      );
      setNewTableNameInput("");
      handleSelectDatabase(currentSelectedDatabase);
    } else {
      toast.error("Gagal membuat tabel", { description: res.error });
    }
  };

  const totalDatabaseRows = useMemo(() => {
    return databaseTables.reduce((sum, item) => sum + (item.rows || 0), 0);
  }, [databaseTables]);

  const filteredDisplayTables = useMemo(() => {
    if (!tableSearch) return databaseTables;
    return databaseTables.filter((t) =>
      t.name.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [databaseTables, tableSearch]);

  const filteredDatabases = useMemo(() => {
    if (!databaseSearch) return availableDatabases;
    return availableDatabases.filter((d) =>
      d.toLowerCase().includes(databaseSearch.toLowerCase())
    );
  }, [availableDatabases, databaseSearch]);

  const filteredVariables = useMemo(() => {
    if (!variablesSearch) return serverVariablesData;
    const q = variablesSearch.toLowerCase();
    return serverVariablesData.filter(
      (v) => v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)
    );
  }, [serverVariablesData, variablesSearch]);

  const filteredCharsets = useMemo(() => {
    if (!charsetsSearch) return serverCharsetsData;
    const q = charsetsSearch.toLowerCase();
    return serverCharsetsData.filter(
      (c) =>
        c.charset.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.defaultCollation.toLowerCase().includes(q)
    );
  }, [serverCharsetsData, charsetsSearch]);

  const filteredPlugins = useMemo(() => {
    if (!pluginsSearch) return serverPluginsData;
    const q = pluginsSearch.toLowerCase();
    return serverPluginsData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }, [serverPluginsData, pluginsSearch]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans antialiased">
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

      {/* Main Studio Body */}
      <section className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Tree Explorer */}
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
          onSelectTable={handleBrowseTable}
          onSwitchToHub={() => navigate({ to: "/" })}
          selectedTable={selectedTable}
          setDatabaseSearch={setDatabaseSearch}
          setTableSearch={setTableSearch}
          tableSearch={tableSearch}
        />

        {/* Tab Views */}
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
            onSearchTable={(tblName) => {
              setSelectedTable(tblName);
              setCurrentWorkspaceTab("search");
            }}
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
            onDeleteRow={handleDeleteRow}
            onExecuteQuery={handleExecuteQuery}
            queryResults={queryResults}
            selectedTable={selectedTable}
            setIsSqlConsoleExpanded={setIsSqlConsoleExpanded}
            setSqlQuery={setSqlQuery}
            sqlQuery={sqlQuery}
          />
        )}
        {currentWorkspaceTab === "search" && (
          <SearchTab
            availableTables={databaseTables}
            currentSelectedDatabase={currentSelectedDatabase}
            isSearching={isSearching}
            onBrowseTableMatches={handleBrowseTableMatches}
            onExecuteSearch={handleExecuteSearch}
            searchResults={searchResults}
          />
        )}
        {currentWorkspaceTab === "operations" && (
          <OperationsTab
            availableTables={databaseTables}
            currentSelectedDatabase={currentSelectedDatabase}
            newDbCollation={newDbCollation}
            onChangeCollation={handleChangeCollation}
            onCopyDatabase={handleCopyDatabase}
            onCopyTable={handleCopyTable}
            onDropDatabase={handleDropDatabase}
            onDropTable={handleDropTable}
            onEmptyTable={handleEmptyTable}
            onMaintainTable={handleMaintainTable}
            onRenameDatabase={handleRenameDatabase}
            onRenameTable={handleRenameTable}
            onUpdateTableOptions={handleUpdateTableOptions}
            selectedTable={selectedTable}
            setNewDbCollation={setNewDbCollation}
          />
        )}
        {currentWorkspaceTab === "export" && (
          <ExportTab
            availableTables={databaseTables}
            currentSelectedDatabase={currentSelectedDatabase}
            exportAddDropTable={exportAddDropTable}
            exportDisableFk={exportDisableFk}
            exportFormat={exportFormat}
            exportMethod={exportMethod}
            exportMode={exportMode}
            exportPreviewSql={exportPreviewSql}
            exportSelectedTables={exportSelectedTables}
            isExporting={isExporting}
            onExecuteExport={handleExecuteExport}
            setExportAddDropTable={setExportAddDropTable}
            setExportDisableFk={setExportDisableFk}
            setExportFormat={setExportFormat}
            setExportMethod={setExportMethod}
            setExportMode={setExportMode}
            setExportSelectedTables={setExportSelectedTables}
          />
        )}
        {currentWorkspaceTab === "import" && (
          <ImportTab
            availableDatabases={availableDatabases}
            availableTables={databaseTables}
            currentSelectedDatabase={currentSelectedDatabase}
            importSqlContent={importSqlContent}
            importTab={importTab}
            importTargetTable={importTargetTable}
            isImporting={isImporting}
            onExecuteImport={handleExecuteImport}
            onPickImportFile={handlePickImportFile}
            onProcessChosenFile={handleProcessChosenFile}
            onSelectDatabase={handleSelectDatabase}
            selectedImportFile={selectedImportFile}
            setCurrentSelectedDatabase={setCurrentSelectedDatabase}
            setImportSqlContent={setImportSqlContent}
            setImportTab={setImportTab}
            setImportTargetTable={setImportTargetTable}
            setSelectedImportFile={setSelectedImportFile}
          />
        )}
        {currentWorkspaceTab === "routines" && (
          <RoutinesTab
            currentSelectedDatabase={currentSelectedDatabase}
            isLoadingRoutines={isLoadingRoutines}
            onDropRoutine={handleDropRoutine}
            onDropTrigger={handleDropTrigger}
            onExecuteRoutine={handleExecuteRoutine}
            onLoadRoutines={handleLoadRoutines}
            onViewRoutineCode={handleViewRoutineCode}
            routinesData={routinesData}
            triggersData={triggersData}
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
        exportFormat={exportFormat}
        exportMode={exportMode}
        exportPreviewSql={exportPreviewSql}
        isExporting={isExporting}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExecuteExport={handleExecuteExport}
        setExportAddDropTable={setExportAddDropTable}
        setExportDisableFk={setExportDisableFk}
        setExportFormat={setExportFormat}
        setExportMode={setExportMode}
      />

      <ImportModal
        availableTables={databaseTables}
        currentSelectedDatabase={currentSelectedDatabase}
        importSqlContent={importSqlContent}
        importTab={importTab}
        importTargetTable={importTargetTable}
        isImporting={isImporting}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onExecuteImport={handleExecuteImport}
        onPickImportFile={handlePickImportFile}
        onProcessChosenFile={handleProcessChosenFile}
        selectedImportFile={selectedImportFile}
        setImportSqlContent={setImportSqlContent}
        setImportTab={setImportTab}
        setImportTargetTable={setImportTargetTable}
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
