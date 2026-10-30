import { CLOUD_ENDPOINTS, LOCAL_STORAGE_KEYS } from "@/constants";
import type {
  BillingCycle,
  CloudSyncConfig,
  CloudSyncMetadata,
  CloudSyncPreferences,
  CloudSyncSnapshot,
  ErBackendPullResponse,
  ErBackendPushPayload,
  QueryHistoryEntry,
  SavedSnippet,
  SubscriptionTier,
  UserActionEntry,
} from "@/types/cloud-sync";
import { cloudSyncSnapshotSchema } from "@/types/cloud-sync";
import type { Profile } from "@/types/connection";

const MEMORY_STORE: {
  config: CloudSyncConfig;
  journal: UserActionEntry[];
  queryHistory: QueryHistoryEntry[];
  snippets: SavedSnippet[];
} = {
  config: {
    apiEndpoint: CLOUD_ENDPOINTS.SYNC_URL,
    authEndpoint: CLOUD_ENDPOINTS.AUTH_URL,
    autoSync: false,
    billingCycle: "annual",
    maxVaults: 10,
    status: "idle",
    subscriptionTier: "free",
  },
  journal: [],
  queryHistory: [],
  snippets: [],
};

let cachedProfiles: Profile[] = [];

/**
 * Smart merge local profiles with remote profiles.
 * - Non-overlapping profiles from remote are added.
 * - Matching profiles (by id) are resolved using connection_revision or updated_at.
 * - Local-only profiles are preserved.
 */
export function mergeProfilesLists(
  localProfiles: Profile[] = [],
  remoteProfiles: Profile[] = []
): Profile[] {
  if (!remoteProfiles || remoteProfiles.length === 0) {
    return localProfiles;
  }
  if (!localProfiles || localProfiles.length === 0) {
    return remoteProfiles;
  }

  const profileMap = new Map<string, Profile>();

  for (const local of localProfiles) {
    if (local && local.id) {
      profileMap.set(local.id, local);
    }
  }

  for (const remote of remoteProfiles) {
    if (!remote || !remote.id) continue;
    const existing = profileMap.get(remote.id);
    if (!existing) {
      profileMap.set(remote.id, remote);
    } else {
      const remoteRev = remote.connection_revision ?? 1;
      const localRev = existing.connection_revision ?? 1;

      if (remoteRev > localRev) {
        profileMap.set(remote.id, remote);
      } else if (remoteRev === localRev) {
        const remoteTime = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;
        const localTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
        if (remoteTime >= localTime) {
          profileMap.set(remote.id, remote);
        }
      }
    }
  }

  return Array.from(profileMap.values());
}

export function setCachedProfiles(profiles: Profile[]): void {
  if (Array.isArray(profiles)) {
    cachedProfiles = profiles;
  }
}

export function getCachedProfiles(): Profile[] {
  if (cachedProfiles.length > 0) {
    return cachedProfiles;
  }
  if (isStorageAvailable()) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedProfiles = parsed;
          return cachedProfiles;
        }
      }
    } catch {
      // ignore
    }
  }
  return cachedProfiles;
}

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getStoredJournal(): UserActionEntry[] {
  if (!isStorageAvailable()) return MEMORY_STORE.journal;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLOUD_SYNC_JOURNAL);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return MEMORY_STORE.journal;
  }
}

export function recordUserAction(
  entry: Omit<UserActionEntry, "id" | "timestamp" | "syncStatus">
): UserActionEntry {
  const newAction: UserActionEntry = {
    ...entry,
    id: generateId(),
    syncStatus: "pending",
    timestamp: new Date().toISOString(),
  };

  const current = getStoredJournal();
  const updated = [newAction, ...current].slice(0, 1000);

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLOUD_SYNC_JOURNAL,
        JSON.stringify(updated)
      );
    } catch {
      MEMORY_STORE.journal = updated;
    }
  } else {
    MEMORY_STORE.journal = updated;
  }

  return newAction;
}

export function getStoredQueryHistory(): QueryHistoryEntry[] {
  if (!isStorageAvailable()) return MEMORY_STORE.queryHistory;
  try {
    const raw = localStorage.getItem(
      LOCAL_STORAGE_KEYS.CLOUD_SYNC_QUERY_HISTORY
    );
    return raw ? JSON.parse(raw) : [];
  } catch {
    return MEMORY_STORE.queryHistory;
  }
}

export function recordQueryHistory(
  entry: Omit<QueryHistoryEntry, "id" | "timestamp">
): QueryHistoryEntry {
  const newQuery: QueryHistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  const current = getStoredQueryHistory();
  const updated = [newQuery, ...current].slice(0, 500);

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLOUD_SYNC_QUERY_HISTORY,
        JSON.stringify(updated)
      );
    } catch {
      MEMORY_STORE.queryHistory = updated;
    }
  } else {
    MEMORY_STORE.queryHistory = updated;
  }

  return newQuery;
}

export function getStoredSnippets(): SavedSnippet[] {
  if (!isStorageAvailable()) return MEMORY_STORE.snippets;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLOUD_SYNC_SNIPPETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return MEMORY_STORE.snippets;
  }
}

export function saveSnippet(
  snippet: Omit<SavedSnippet, "id" | "createdAt" | "updatedAt">
): SavedSnippet {
  const now = new Date().toISOString();
  const newSnippet: SavedSnippet = {
    ...snippet,
    createdAt: now,
    id: generateId(),
    updatedAt: now,
  };

  const current = getStoredSnippets();
  const updated = [newSnippet, ...current];

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLOUD_SYNC_SNIPPETS,
        JSON.stringify(updated)
      );
    } catch {
      MEMORY_STORE.snippets = updated;
    }
  } else {
    MEMORY_STORE.snippets = updated;
  }

  return newSnippet;
}

export function deleteSnippet(id: string): void {
  const current = getStoredSnippets();
  const updated = current.filter((s) => s.id !== id);

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLOUD_SYNC_SNIPPETS,
        JSON.stringify(updated)
      );
    } catch {
      MEMORY_STORE.snippets = updated;
    }
  } else {
    MEMORY_STORE.snippets = updated;
  }
}

export function normalizeCloudEndpoint(url?: string): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return cleaned;
  if (cleaned.startsWith('https://er-service.duckdns.org')) {
    cleaned = cleaned.replace('https://er-service.duckdns.org', 'https://www.er-service.duckdns.org');
  } else if (cleaned.startsWith('http://er-service.duckdns.org')) {
    cleaned = cleaned.replace('http://er-service.duckdns.org', 'https://www.er-service.duckdns.org');
  }
  return cleaned;
}

export function getCloudSyncConfig(): CloudSyncConfig {
  let baseConfig = MEMORY_STORE.config;
  if (isStorageAvailable()) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLOUD_SYNC_CONFIG);
      if (raw) {
        baseConfig = { ...MEMORY_STORE.config, ...JSON.parse(raw) };
      }
    } catch {
      baseConfig = MEMORY_STORE.config;
    }
  }
  if (baseConfig.apiEndpoint) {
    baseConfig.apiEndpoint = normalizeCloudEndpoint(baseConfig.apiEndpoint);
  }
  if (baseConfig.authEndpoint) {
    baseConfig.authEndpoint = normalizeCloudEndpoint(baseConfig.authEndpoint);
  }
  const isNonFree = baseConfig.subscriptionTier !== "free";
  // Non-free tiers (Pro, Team, Business) aktif sinkronisasi otomatis secara default
  const autoSync = baseConfig.autoSync !== undefined ? baseConfig.autoSync : isNonFree;
  return {
    ...baseConfig,
    autoSync,
  };
}

export function updateCloudSyncConfig(
  updates: Partial<CloudSyncConfig>
): CloudSyncConfig {
  const current = getCloudSyncConfig();
  const nextTier = updates.subscriptionTier ?? current.subscriptionTier;
  const isNonFree = nextTier !== "free";

  let resolvedAutoSync = current.autoSync;
  if (updates.autoSync !== undefined) {
    resolvedAutoSync = updates.autoSync;
  } else if (
    updates.subscriptionTier !== undefined &&
    updates.subscriptionTier !== current.subscriptionTier
  ) {
    resolvedAutoSync = isNonFree;
  }

  const sanitizedUpdates = { ...updates };
  if (sanitizedUpdates.apiEndpoint) {
    sanitizedUpdates.apiEndpoint = normalizeCloudEndpoint(sanitizedUpdates.apiEndpoint);
  }
  if (sanitizedUpdates.authEndpoint) {
    sanitizedUpdates.authEndpoint = normalizeCloudEndpoint(sanitizedUpdates.authEndpoint);
  }

  const updated: CloudSyncConfig = {
    ...current,
    ...sanitizedUpdates,
    autoSync: resolvedAutoSync,
  };

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLOUD_SYNC_CONFIG,
        JSON.stringify(updated)
      );
    } catch {
      MEMORY_STORE.config = updated;
    }
  } else {
    MEMORY_STORE.config = updated;
  }

  return updated;
}

export function buildCloudSyncSnapshot(
  profiles?: Profile[],
  preferencesOverride?: Partial<CloudSyncPreferences>
): CloudSyncSnapshot {
  const resolvedProfiles =
    profiles && profiles.length > 0 ? profiles : getCachedProfiles();
  const journal = getStoredJournal();
  const queryHistory = getStoredQueryHistory();
  const snippets = getStoredSnippets();
  const config = getCloudSyncConfig();

  let appSettings: any = null;
  if (isStorageAvailable()) {
    try {
      const rawSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.APP_SETTINGS);
      if (rawSettings) {
        appSettings = JSON.parse(rawSettings);
      }
    } catch {
      // ignore
    }
  }

  const preferences: CloudSyncPreferences = {
    autoSyncEnabled: config.autoSync,
    defaultCollation: appSettings?.defaultCollation || "utf8mb4_general_ci",
    language: appSettings?.language || (isStorageAvailable() && localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE)) || "en",
    recordQueries: true,
    syncIntervalMinutes: 5,
    theme: (appSettings?.theme || (isStorageAvailable() && localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)) || "dark") as any,
    ...preferencesOverride,
  };

  const metadata: CloudSyncMetadata = {
    billingCycle: config.billingCycle || "annual",
    clientId: "xphpmyadmin-client-" + generateId().slice(0, 8),
    deviceName:
      typeof navigator !== "undefined"
        ? `${navigator.userAgent.slice(0, 30)}`
        : "Linux Desktop Client",
    generatedAt: new Date().toISOString(),
    maxVaults: config.maxVaults || (config.subscriptionTier === "business" ? 50 : (config.subscriptionTier === "team" ? 20 : 10)),
    platform: typeof process !== "undefined" ? process.platform : "linux",
    revision: Date.now(),
    subscriptionTier: config.subscriptionTier,
    totalActions: journal.length,
    totalProfiles: resolvedProfiles.length,
    totalQueries: queryHistory.length,
    userEmail: config.userEmail,
    userId: config.userId,
    version: "1.0.0",
  };

  return {
    journal,
    metadata,
    preferences,
    profiles: resolvedProfiles,
    queryHistory,
    snippets,
  };
}

export function exportCloudBackupJson(
  profiles: Profile[],
  preferencesOverride?: Partial<CloudSyncPreferences>
): string {
  const snapshot = buildCloudSyncSnapshot(profiles, preferencesOverride);
  return JSON.stringify(snapshot, null, 2);
}

export function importCloudBackupJson(jsonString: string): {
  data?: CloudSyncSnapshot;
  error?: string;
  success: boolean;
} {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = cloudSyncSnapshotSchema.safeParse(parsed);

    if (!validated.success) {
      const issues = validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return {
        error: `Format JSON tidak valid: ${issues}`,
        success: false,
      };
    }

    const snapshot = validated.data;

    if (isStorageAvailable()) {
      try {
        if (snapshot.profiles?.length) {
          let mergedProfiles = snapshot.profiles;
          try {
            const rawStored = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILES);
            if (rawStored) {
              const currentLocal = JSON.parse(rawStored);
              if (Array.isArray(currentLocal) && currentLocal.length > 0) {
                mergedProfiles = mergeProfilesLists(currentLocal, snapshot.profiles);
              }
            }
          } catch {
            // fallback
          }
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.PROFILES,
            JSON.stringify(mergedProfiles)
          );
          setCachedProfiles(mergedProfiles);
        }
        if (snapshot.journal?.length) {
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.CLOUD_SYNC_JOURNAL,
            JSON.stringify(snapshot.journal)
          );
        }
        if (snapshot.queryHistory?.length) {
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.CLOUD_SYNC_QUERY_HISTORY,
            JSON.stringify(snapshot.queryHistory)
          );
        }
        if (snapshot.snippets?.length) {
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.CLOUD_SYNC_SNIPPETS,
            JSON.stringify(snapshot.snippets)
          );
        }
      } catch (err: any) {
        return {
          error: `Gagal menyimpan ke penyimpanan lokal: ${err?.message || err}`,
          success: false,
        };
      }
    }

    return {
      data: snapshot,
      success: true,
    };
  } catch (err: any) {
    return {
      error: `Gagal mem-parsing JSON: ${err?.message || err}`,
      success: false,
    };
  }
}

// -------------------------------------------------------------
// er-backend Integration: PUSH (/api/sync/push)
// -------------------------------------------------------------
export async function syncWithCloudBackend(
  profiles?: Profile[],
  tokenOverride?: string,
  endpointOverride?: string
): Promise<{
  error?: string;
  message?: string;
  success: boolean;
  syncedItems: number;
}> {
  const config = getCloudSyncConfig();
  if (config.subscriptionTier === "free") {
    return {
      error: "Paket gratis hanya memiliki brankas lokal. Silakan berlangganan (Pro, Team, atau Business) untuk mengaktifkan sinkronisasi cloud.",
      success: false,
      syncedItems: 0,
    };
  }
  const resolvedProfiles =
    profiles && profiles.length > 0 ? profiles : getCachedProfiles();
  const token = (tokenOverride || config.apiToken || config.userEmail || "user_pro_sync").trim();
  const baseEndpoint = normalizeCloudEndpoint(endpointOverride || config.apiEndpoint);
  const pushUrl = baseEndpoint.endsWith("/push") ? baseEndpoint : `${baseEndpoint}/push`;
  const snapshot = buildCloudSyncSnapshot(resolvedProfiles);

  updateCloudSyncConfig({ lastErrorMessage: undefined, status: "syncing" });

  try {
    const payload: ErBackendPushPayload = {
      data: snapshot,
      device: snapshot.metadata.deviceName,
      syncKey: token,
      timestamp: Date.now(),
    };

    const response = await fetch(pushUrl, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Sync-Key": token,
      },
      method: "POST",
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || resJson.success === false) {
      throw new Error(
        resJson.error || `Server cloud mengembalikan status ${response.status}`
      );
    }

    // Tandai seluruh jurnal sebagai synced
    const journal = getStoredJournal().map((j) => ({
      ...j,
      syncStatus: "synced" as const,
    }));

    if (isStorageAvailable()) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLOUD_SYNC_JOURNAL,
        JSON.stringify(journal)
      );
    } else {
      MEMORY_STORE.journal = journal;
    }

    const now = new Date().toISOString();
    updateCloudSyncConfig({
      lastErrorMessage: undefined,
      lastSyncAt: now,
      status: "success",
    });

    return {
      message: resJson.message || "Data berhasil disinkronkan ke Neon cloud database!",
      success: true,
      syncedItems: snapshot.metadata.totalActions + snapshot.metadata.totalQueries,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    updateCloudSyncConfig({
      lastErrorMessage: msg,
      status: "error",
    });
    return {
      error: msg,
      success: false,
      syncedItems: 0,
    };
  }
}

// -------------------------------------------------------------
// Auto-Sync to Cloud: Debounced Background Trigger
// -------------------------------------------------------------
let autoSyncTimeout: any = null;
let isAutoSyncInProgress = false;
let hasPendingSyncRequest = false;

export function triggerAutoSyncToCloud(
  profiles?: Profile[],
  delayMs = 600
): Promise<{
  error?: string;
  message?: string;
  skipped?: boolean;
  success: boolean;
  syncedItems?: number;
}> {
  if (profiles && profiles.length > 0) {
    setCachedProfiles(profiles);
  }

  const config = getCloudSyncConfig();
  // Status free dibatasi hanya ke brankas lokal, jangan sinkronkan ke backend
  if (config.subscriptionTier === "free" || config.autoSync === false) {
    return Promise.resolve({ skipped: true, success: false });
  }

  if (autoSyncTimeout) {
    clearTimeout(autoSyncTimeout);
  }

  if (delayMs <= 0) {
    if (isAutoSyncInProgress) {
      hasPendingSyncRequest = true;
      return Promise.resolve({ skipped: true, success: false });
    }
    isAutoSyncInProgress = true;
    return syncWithCloudBackend(profiles || getCachedProfiles()).finally(() => {
      isAutoSyncInProgress = false;
      if (hasPendingSyncRequest) {
        hasPendingSyncRequest = false;
        triggerAutoSyncToCloud(getCachedProfiles(), 300);
      }
    });
  }

  return new Promise((resolve) => {
    autoSyncTimeout = setTimeout(async () => {
      autoSyncTimeout = null;
      if (isAutoSyncInProgress) {
        hasPendingSyncRequest = true;
        return resolve({ skipped: true, success: false });
      }
      isAutoSyncInProgress = true;
      try {
        const res = await syncWithCloudBackend(profiles || getCachedProfiles());
        resolve(res);
      } catch (err: any) {
        resolve({ error: err?.message || String(err), success: false });
      } finally {
        isAutoSyncInProgress = false;
        if (hasPendingSyncRequest) {
          hasPendingSyncRequest = false;
          triggerAutoSyncToCloud(getCachedProfiles(), 300);
        }
      }
    }, delayMs);
  });
}

// -------------------------------------------------------------
// er-backend Integration: PULL (/api/sync/pull)
// -------------------------------------------------------------
export async function pullFromCloudBackend(
  tokenOverride?: string,
  endpointOverride?: string
): Promise<{
  data?: CloudSyncSnapshot;
  error?: string;
  lastDevice?: string;
  success: boolean;
  updatedAt?: number;
}> {
  const config = getCloudSyncConfig();
  if (config.subscriptionTier === "free") {
    return {
      error: "Paket gratis hanya memiliki brankas lokal. Silakan berlangganan (Pro, Team, atau Business) untuk mengaktifkan sinkronisasi cloud.",
      success: false,
    };
  }
  const token = (tokenOverride || config.apiToken || config.userEmail || "user_pro_sync").trim();
  const baseEndpoint = normalizeCloudEndpoint(endpointOverride || config.apiEndpoint);
  const pullUrl = baseEndpoint.endsWith("/pull") ? baseEndpoint : `${baseEndpoint}/pull`;

  try {
    const response = await fetch(pullUrl, {
      body: JSON.stringify({ syncKey: token }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Sync-Key": token,
      },
      method: "POST",
    });

    const resJson = (await response.json().catch(() => ({}))) as ErBackendPullResponse & {
      error?: string;
    };

    if (!response.ok || resJson.success === false) {
      throw new Error(
        resJson.error || `Server cloud pull mengembalikan kode status ${response.status}`
      );
    }

    if (resJson.data) {
      const validated = cloudSyncSnapshotSchema.safeParse(resJson.data);
      if (validated.success) {
        importCloudBackupJson(JSON.stringify(validated.data));
        return {
          data: validated.data,
          lastDevice: resJson.lastDevice,
          success: true,
          updatedAt: resJson.updatedAt,
        };
      }
    }

    return {
      data: resJson.data,
      lastDevice: resJson.lastDevice,
      success: true,
      updatedAt: resJson.updatedAt,
    };
  } catch (err: any) {
    return {
      error: err?.message || String(err),
      success: false,
    };
  }
}

// -------------------------------------------------------------
// er-backend Integration: MERGE (/api/sync/merge)
// -------------------------------------------------------------
export async function mergeWithCloudBackend(
  profiles: Profile[],
  tokenOverride?: string,
  endpointOverride?: string
): Promise<{
  data?: any;
  error?: string;
  message?: string;
  success: boolean;
}> {
  const config = getCloudSyncConfig();
  if (config.subscriptionTier === "free") {
    return {
      error: "Paket gratis hanya memiliki brankas lokal. Silakan berlangganan (Pro, Team, atau Business) untuk mengaktifkan sinkronisasi cloud.",
      success: false,
    };
  }
  const token = (tokenOverride || config.apiToken || config.userEmail || "user_pro_sync").trim();
  const baseEndpoint = normalizeCloudEndpoint(endpointOverride || config.apiEndpoint);
  const mergeUrl = baseEndpoint.endsWith("/merge") ? baseEndpoint : `${baseEndpoint}/merge`;
  const snapshot = buildCloudSyncSnapshot(profiles);

  try {
    const response = await fetch(mergeUrl, {
      body: JSON.stringify({
        data: snapshot,
        device: snapshot.metadata.deviceName,
        syncKey: token,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Sync-Key": token,
      },
      method: "POST",
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || resJson.success === false) {
      throw new Error(
        resJson.error || `Server cloud merge status ${response.status}`
      );
    }

    if (resJson.data) {
      const validated = cloudSyncSnapshotSchema.safeParse(resJson.data);
      if (validated.success) {
        importCloudBackupJson(JSON.stringify(validated.data));
      }
    }

    return {
      data: resJson.data,
      message: resJson.message || "Smart merge cloud Neon selesai!",
      success: true,
    };
  } catch (err: any) {
    return {
      error: err?.message || String(err),
      success: false,
    };
  }
}

// -------------------------------------------------------------
// er-backend Integration: AUTH LOGIN (/api/auth/login)
// -------------------------------------------------------------
export async function loginToCloudBackend(
  email: string,
  pass: string,
  authEndpointOverride?: string
): Promise<{ error?: string; success: boolean; user?: any }> {
  const config = getCloudSyncConfig();
  const baseAuth = normalizeCloudEndpoint(authEndpointOverride || config.authEndpoint);
  const loginUrl = baseAuth.endsWith("/login") ? baseAuth : `${baseAuth}/login`;

  try {
    const response = await fetch(loginUrl, {
      body: JSON.stringify({ email: email.trim(), password: pass }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || resJson.success === false) {
      throw new Error(resJson.error || "Email atau password tidak valid");
    }

    const userTier: SubscriptionTier =
      resJson.user?.plan === "business"
        ? "business"
        : resJson.user?.plan === "team"
        ? "team"
        : (resJson.user?.plan === "pro" ? "pro" : "free");
    const userBilling: BillingCycle =
      resJson.user?.billingCycle === "monthly" ? "monthly" : "annual";
    const maxVaults =
      resJson.user?.maxVaults ||
      (userTier === "business" ? 50 : userTier === "team" ? 20 : (userTier === "pro" ? 10 : 1));

    updateCloudSyncConfig({
      apiToken: resJson.token,
      billingCycle: userBilling,
      maxVaults,
      planExpiresAt: resJson.user?.planExpiresAt,
      subscriptionTier: userTier,
      userEmail: resJson.user?.email || email,
      userId: resJson.user?.id ? String(resJson.user.id) : undefined,
      userName: resJson.user?.name,
      userProvider: "credentials",
    });

    return {
      success: true,
      user: resJson.user,
    };
  } catch (err: any) {
    return {
      error: err?.message || String(err),
      success: false,
    };
  }
}

// -------------------------------------------------------------
// er-backend Integration: AUTH REGISTER (/api/auth/register)
// -------------------------------------------------------------
export async function registerToCloudBackend(
  name: string,
  email: string,
  pass: string,
  plan: SubscriptionTier = "free",
  billingCycle: BillingCycle = "annual",
  authEndpointOverride?: string
): Promise<{ error?: string; success: boolean; user?: any }> {
  const config = getCloudSyncConfig();
  const baseAuth = normalizeCloudEndpoint(authEndpointOverride || config.authEndpoint);
  const regUrl = baseAuth.endsWith("/register") ? baseAuth : `${baseAuth}/register`;

  try {
    const response = await fetch(regUrl, {
      body: JSON.stringify({
        billingCycle,
        email: email.trim(),
        name: name.trim(),
        password: pass,
        plan,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || resJson.success === false) {
      throw new Error(resJson.error || "Gagal mendaftar ke server cloud");
    }

    const userTier: SubscriptionTier =
      resJson.user?.plan === "business"
        ? "business"
        : resJson.user?.plan === "team"
        ? "team"
        : (resJson.user?.plan === "pro" ? "pro" : "free");
    const userBilling: BillingCycle =
      resJson.user?.billingCycle === "monthly" ? "monthly" : "annual";
    const maxVaults =
      resJson.user?.maxVaults ||
      (userTier === "business" ? 50 : userTier === "team" ? 20 : (userTier === "pro" ? 10 : 1));

    updateCloudSyncConfig({
      apiToken: resJson.token,
      billingCycle: userBilling,
      maxVaults,
      planExpiresAt: resJson.user?.planExpiresAt,
      subscriptionTier: userTier,
      userEmail: resJson.user?.email || email,
      userId: resJson.user?.id ? String(resJson.user.id) : undefined,
      userName: resJson.user?.name || name,
      userProvider: "credentials",
    });

    return {
      success: true,
      user: resJson.user,
    };
  } catch (err: any) {
    return {
      error: err?.message || String(err),
      success: false,
    };
  }
}

// -------------------------------------------------------------
// er-backend Integration: UPGRADE / CHANGE PLAN (/api/auth/plan)
// -------------------------------------------------------------
export async function upgradeSubscriptionPlan(
  plan: SubscriptionTier,
  billingCycle: BillingCycle
): Promise<{ error?: string; success: boolean; user?: any }> {
  const config = getCloudSyncConfig();
  const maxVaults =
    plan === "business" ? 50 : plan === "team" ? 20 : 10;

  if (!config.apiToken) {
    updateCloudSyncConfig({
      billingCycle,
      maxVaults,
      subscriptionTier: plan,
    });
    return { success: true };
  }

  const baseAuth = normalizeCloudEndpoint(config.authEndpoint);
  const planUrl = `${baseAuth}/plan`;

  try {
    const response = await fetch(planUrl, {
      body: JSON.stringify({ billingCycle, plan }),
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || resJson.success === false) {
      throw new Error(resJson.error || "Gagal memperbarui paket langganan di cloud");
    }

    if (resJson.token) {
      updateCloudSyncConfig({ apiToken: resJson.token });
    }

    updateCloudSyncConfig({
      billingCycle,
      maxVaults: resJson.user?.maxVaults || maxVaults,
      planExpiresAt: resJson.user?.planExpiresAt,
      subscriptionTier: plan,
    });

    return {
      success: true,
      user: resJson.user,
    };
  } catch (err: any) {
    // Fallback locally jika offline
    updateCloudSyncConfig({
      billingCycle,
      maxVaults,
      subscriptionTier: plan,
    });
    return {
      error: err?.message || String(err),
      success: false,
    };
  }
}


// -------------------------------------------------------------
// er-backend Integration: OAUTH SOCIAL LOGIN (/api/auth/oauth)
// -------------------------------------------------------------
export async function oauthLoginCloudBackend(
  provider: "google" | "github",
  email: string,
  name?: string,
  image?: string,
  authEndpointOverride?: string
): Promise<{ error?: string; success: boolean; user?: any }> {
  const config = getCloudSyncConfig();
  const baseAuth = normalizeCloudEndpoint(authEndpointOverride || config.authEndpoint);
  const oauthUrl = baseAuth.endsWith("/oauth") ? baseAuth : `${baseAuth}/oauth`;

  try {
    const response = await fetch(oauthUrl, {
      body: JSON.stringify({
        email: email.trim(),
        image: image || "",
        name: name?.trim(),
        provider,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || resJson.success === false) {
      throw new Error(resJson.error || `Gagal login dengan ${provider.toUpperCase()}`);
    }

    const userTier: SubscriptionTier =
      resJson.user?.plan === "business"
        ? "business"
        : resJson.user?.plan === "team"
        ? "team"
        : (resJson.user?.plan === "pro" ? "pro" : "free");
    const userBilling: BillingCycle =
      resJson.user?.billingCycle === "monthly" ? "monthly" : "annual";
    const maxVaults =
      resJson.user?.maxVaults ||
      (userTier === "business" ? 50 : userTier === "team" ? 20 : (userTier === "pro" ? 10 : 1));

    updateCloudSyncConfig({
      apiToken: resJson.token,
      billingCycle: userBilling,
      maxVaults,
      planExpiresAt: resJson.user?.planExpiresAt,
      subscriptionTier: userTier,
      userAvatar: resJson.user?.image || image,
      userEmail: resJson.user?.email || email,
      userId: resJson.user?.id ? String(resJson.user.id) : undefined,
      userName: resJson.user?.name || name,
      userProvider: provider,
    });

    return {
      success: true,
      user: resJson.user,
    };
  } catch (err: any) {
    // Fallback offline / local mock
    const fallbackTier: SubscriptionTier = "business";
    const fallbackToken = `mock_${provider}_${Date.now()}`;
    updateCloudSyncConfig({
      apiToken: fallbackToken,
      billingCycle: "annual",
      maxVaults: 50,
      subscriptionTier: fallbackTier,
      userAvatar: image,
      userEmail: email,
      userId: `local_${Date.now()}`,
      userName: name || `${provider === "google" ? "Google User" : "GitHub User"}`,
      userProvider: provider,
    });

    return {
      success: true,
      user: {
        billingCycle: "annual",
        email,
        maxVaults: 50,
        name: name || `${provider === "google" ? "Google User" : "GitHub User"}`,
        plan: fallbackTier,
        role: "user",
      },
    };
  }
}

export function saveAuthSession(
  token: string,
  user: any,
  provider?: string
): void {
  const userTier: SubscriptionTier =
    user?.plan === "business"
      ? "business"
      : user?.plan === "team"
      ? "team"
      : user?.plan === "pro"
      ? "pro"
      : "free";

  const userBilling: BillingCycle =
    user?.billingCycle === "monthly" ? "monthly" : "annual";

  const maxVaults =
    user?.maxVaults ||
    (userTier === "business" ? 50 : userTier === "team" ? 20 : userTier === "pro" ? 10 : 1);

  updateCloudSyncConfig({
    apiToken: token,
    billingCycle: userBilling,
    maxVaults,
    planExpiresAt: user?.planExpiresAt,
    subscriptionTier: userTier,
    userAvatar: user?.image,
    userEmail: user?.email,
    userId: user?.id ? String(user.id) : undefined,
    userName: user?.name,
    userProvider: provider || user?.provider || "oauth",
  });
}

export function logoutCloudBackend(): void {
  updateCloudSyncConfig({
    apiToken: undefined,
    billingCycle: "annual",
    maxVaults: 10,
    planExpiresAt: undefined,
    subscriptionTier: "free",
    userAvatar: undefined,
    userEmail: undefined,
    userId: undefined,
    userName: undefined,
    userProvider: undefined,
  });
}

export function clearJournal(): void {
  if (isStorageAvailable()) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CLOUD_SYNC_JOURNAL);
  }
  MEMORY_STORE.journal = [];
}
