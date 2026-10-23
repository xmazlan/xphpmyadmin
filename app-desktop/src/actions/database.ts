import { ipc } from "@/ipc/manager";
import type {
  CreateDatabaseInput,
  DatabaseConnectionInput,
  DropDatabaseInput,
  ExportDatabaseInput,
  ImportDatabaseInput,
  PromptSqlFileInput,
} from "@/ipc/database/schemas";

export async function testDatabaseConnection(params: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.testConnection(params);
  } catch (error: any) {
    return {
      latencyMs: 0,
      ok: false,
      error: error?.message || "Gagal memanggil IPC database.testConnection",
    };
  }
}

export async function fetchDatabases(params: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getDatabases(params);
  } catch (error: any) {
    return {
      databases: [],
      ok: false,
      error: error?.message || "Gagal memanggil IPC database.getDatabases",
    };
  }
}

export async function fetchTables(
  connection: DatabaseConnectionInput,
  database: string
) {
  try {
    return await ipc.client.database.getTables({ connection, database });
  } catch (error: any) {
    return {
      ok: false,
      tables: [],
      error: error?.message || "Gagal memanggil IPC database.getTables",
    };
  }
}

export async function executeSqlQuery(
  connection: DatabaseConnectionInput,
  query: string,
  database?: string
) {
  try {
    return await ipc.client.database.executeQuery({
      connection,
      database,
      query,
    });
  } catch (error: any) {
    return {
      columns: [],
      executionTimeMs: 0,
      ok: false,
      rowCount: 0,
      rows: [],
      error: error?.message || "Gagal mengeksekusi query via IPC",
    };
  }
}

export interface PromptSqlFileResult {
  canceled: boolean;
  error?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
}

export async function promptSqlFileDialog(
  params: PromptSqlFileInput
): Promise<PromptSqlFileResult> {
  try {
    return (await ipc.client.database.promptSqlFileDialog(params)) as PromptSqlFileResult;
  } catch (error: any) {
    return {
      canceled: true,
      error: error?.message || "Gagal membuka dialog berkas",
    };
  }
}

export async function exportDatabase(params: ExportDatabaseInput) {
  try {
    return await ipc.client.database.exportDatabase(params);
  } catch (error: any) {
    return {
      durationMs: 0,
      error: error?.message || "Gagal mengekspor database via IPC",
      ok: false,
      rowCount: 0,
      sizeBytes: 0,
      tableCount: 0,
    };
  }
}

export async function importDatabase(params: ImportDatabaseInput) {
  try {
    return await ipc.client.database.importDatabase(params);
  } catch (error: any) {
    return {
      durationMs: 0,
      error: error?.message || "Gagal mengimpor database via IPC",
      ok: false,
      statementsExecuted: 0,
    };
  }
}

export async function fetchServerStatus(connection: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getServerStatus(connection);
  } catch (error: any) {
    return {
      bytesReceived: 0,
      bytesSent: 0,
      connections: 0,
      error: error?.message || "Gagal mengambil status server",
      ok: false,
      processes: [],
      questions: 0,
      threadsConnected: 0,
      threadsRunning: 0,
      uptimeSeconds: 0,
    };
  }
}

export async function fetchUserAccounts(connection: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getUserAccounts(connection);
  } catch (error: any) {
    return {
      error: error?.message || "Gagal mengambil daftar pengguna database",
      ok: false,
      users: [],
    };
  }
}

export async function fetchServerVariables(connection: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getServerVariables(connection);
  } catch (error: any) {
    return {
      error: error?.message || "Gagal mengambil variabel server",
      ok: false,
      variables: [],
    };
  }
}

export async function fetchServerEngines(connection: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getServerEngines(connection);
  } catch (error: any) {
    return {
      engines: [],
      error: error?.message || "Gagal mengambil daftar mesin penyimpanan",
      ok: false,
    };
  }
}

export async function fetchServerCharsets(connection: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getServerCharsets(connection);
  } catch (error: any) {
    return {
      charsets: [],
      error: error?.message || "Gagal mengambil daftar set karakter",
      ok: false,
    };
  }
}

export async function fetchServerPlugins(connection: DatabaseConnectionInput) {
  try {
    return await ipc.client.database.getServerPlugins(connection);
  } catch (error: any) {
    return {
      error: error?.message || "Gagal mengambil daftar plugin server",
      ok: false,
      plugins: [],
    };
  }
}

export async function createDatabaseAction(params: CreateDatabaseInput) {
  try {
    return await ipc.client.database.createDatabase(params);
  } catch (error: any) {
    return {
      error: error?.message || "Gagal membuat database baru",
      name: params.name,
      ok: false,
    };
  }
}

export async function dropDatabaseAction(params: DropDatabaseInput) {
  try {
    return await ipc.client.database.dropDatabase(params);
  } catch (error: any) {
    return {
      error: error?.message || "Gagal menghapus database",
      name: params.name,
      ok: false,
    };
  }
}
