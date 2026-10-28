export type WorkspaceTabId =
  | "databases"
  | "structure"
  | "sql"
  | "search"
  | "operations"
  | "status"
  | "users"
  | "export"
  | "import"
  | "routines"
  | "variables"
  | "charsets"
  | "engines"
  | "plugins";

export interface ActiveTabItem {
  env: string;
  id: string;
  name: string;
  profileId?: string;
}

export interface TableItem {
  collation?: string;
  comment?: string;
  dataFree?: number;
  dataLength?: number;
  engine?: string;
  indexLength?: number;
  name: string;
  rows: number;
  size: string;
}

export interface QueryResultData {
  columns: string[];
  error?: string;
  executionTimeMs: number;
  ok: boolean;
  rowCount: number;
  rows: any[];
}

export interface ServerStatusProcess {
  command: string;
  db: string;
  host: string;
  id: number;
  info: string;
  state: string;
  time: number;
  user: string;
}

export interface ServerStatusData {
  bytesReceived: number;
  bytesSent: number;
  connections: number;
  ok: boolean;
  processes: ServerStatusProcess[];
  questions: number;
  threadsConnected: number;
  threadsRunning: number;
  uptimeSeconds: number;
}

export interface UserAccountItem {
  accountLocked: boolean;
  host: string;
  passwordExpired: boolean;
  plugin: string;
  user: string;
}

export interface ServerVariableItem {
  name: string;
  value: string;
}

export interface ServerEngineItem {
  comment: string;
  engine: string;
  savepoints: string;
  support: string;
  transactions: string;
  xa: string;
}

export interface ServerCharsetItem {
  charset: string;
  defaultCollation: string;
  description: string;
  maxlen: number;
}

export interface ServerPluginItem {
  library: string;
  license: string;
  name: string;
  status: string;
  type: string;
}

export interface ImportFileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
}

export interface RoutineItem {
  comment?: string;
  created?: string;
  definer?: string;
  modified?: string;
  name: string;
  securityType?: string;
  type: "PROCEDURE" | "FUNCTION";
}

export interface TriggerItem {
  actionOrder?: number;
  event: string;
  name: string;
  statement?: string;
  table: string;
  timing: string;
}

export interface DatabaseSearchResult {
  count: number;
  table: string;
}
