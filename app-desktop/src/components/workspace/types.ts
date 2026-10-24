export type WorkspaceTabId =
  | "databases"
  | "structure"
  | "sql"
  | "operations"
  | "status"
  | "users"
  | "export"
  | "import"
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
