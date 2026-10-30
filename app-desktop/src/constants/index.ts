export const LOCAL_STORAGE_KEYS = {
  APP_SETTINGS: "xphpmyadmin_app_settings",
  CLOUD_SYNC_CONFIG: "xphpmyadmin_cloud_config",
  CLOUD_SYNC_JOURNAL: "xphpmyadmin_cloud_journal",
  CLOUD_SYNC_QUERY_HISTORY: "xphpmyadmin_query_history",
  CLOUD_SYNC_SNIPPETS: "xphpmyadmin_saved_snippets",
  LANGUAGE: "lang",
  PROFILES: "xphpmyadmin_profiles",
  THEME: "theme",
};

export const IPC_CHANNELS = {
  START_ORPC_SERVER: "start-orpc-server",
};

export const CLOUD_ENDPOINTS = {
  AUTH_URL:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_CLOUD_AUTH_URL) ||
    "https://www.er-service.duckdns.org/api/auth",
  BACKEND_URL:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_BACKEND_URL) ||
    "https://www.er-service.duckdns.org",
  SYNC_URL:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_CLOUD_API_URL) ||
    "https://www.er-service.duckdns.org/api/sync",
};

export const ENVIRONMENT_VARIABLES = {
  NODE_ENV: process.env.NODE_ENV,
};

export const inDevelopment = ENVIRONMENT_VARIABLES.NODE_ENV === "development";
