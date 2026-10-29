export interface AppSettings {
  // General & Appearance
  language: "en" | "id";
  theme: "dark" | "light" | "system";
  density: "compact" | "normal" | "comfortable";
  editorFontSize: number;
  sidebarCollapsedDefault: boolean;

  // Query & Execution
  defaultRowLimit: number;
  queryTimeoutSeconds: number;
  autoAppendLimit: boolean;
  confirmDangerousQueries: boolean;
  highlightNullValues: boolean;
  defaultCollation: string;

  // Connection & Security
  connectionTimeoutSeconds: number;
  sshKeepAliveSeconds: number;
  savePasswordsInKeychain: boolean;
  autoDisconnectIdleMinutes: number;

  // SQL Editor
  sqlWrapLines: boolean;
  sqlAutoComplete: boolean;
  showLineNumbers: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: "en",
  theme: "dark",
  density: "normal",
  editorFontSize: 13,
  sidebarCollapsedDefault: false,

  defaultRowLimit: 100,
  queryTimeoutSeconds: 30,
  autoAppendLimit: true,
  confirmDangerousQueries: true,
  highlightNullValues: true,
  defaultCollation: "utf8mb4_general_ci",

  connectionTimeoutSeconds: 10,
  sshKeepAliveSeconds: 30,
  savePasswordsInKeychain: true,
  autoDisconnectIdleMinutes: 0,

  sqlWrapLines: true,
  sqlAutoComplete: true,
  showLineNumbers: true,
};
