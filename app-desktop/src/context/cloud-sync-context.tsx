import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  clearJournal as clearStoredJournal,
  deleteSnippet as deleteStoredSnippet,
  exportCloudBackupJson,
  getCloudSyncConfig,
  getStoredJournal,
  getStoredQueryHistory,
  getStoredSnippets,
  importCloudBackupJson,
  loginToCloudBackend,
  logoutCloudBackend,
  mergeWithCloudBackend,
  pullFromCloudBackend,
  recordQueryHistory as storeQueryHistory,
  recordUserAction as storeUserAction,
  registerToCloudBackend,
  saveSnippet as storeSnippet,
  syncWithCloudBackend,
  updateCloudSyncConfig,
  upgradeSubscriptionPlan,
  oauthLoginCloudBackend,
  saveAuthSession,
} from "@/services/cloud-sync";
import type {
  BillingCycle,
  CloudSyncConfig,
  CloudSyncSnapshot,
  QueryHistoryEntry,
  SavedSnippet,
  SubscriptionTier,
  UserActionEntry,
} from "@/types/cloud-sync";
import type { Profile } from "@/types/connection";

interface CloudSyncContextValue {
  clearJournal: () => void;
  config: CloudSyncConfig;
  deleteSnippet: (id: string) => void;
  exportJson: (profiles: Profile[]) => string;
  importJson: (jsonString: string) => {
    data?: CloudSyncSnapshot;
    error?: string;
    success: boolean;
  };
  isAuthenticated: boolean;
  isSyncing: boolean;
  journal: UserActionEntry[];
  login: (
    email: string,
    pass: string
  ) => Promise<{ error?: string; success: boolean; user?: any }>;
  logout: () => void;
  oauthLogin: (
    provider: "google" | "github",
    email: string,
    name?: string,
    image?: string
  ) => Promise<{ error?: string; success: boolean; user?: any }>;
  mergeWithCloud: (
    profiles: Profile[],
    tokenOverride?: string
  ) => Promise<{ data?: any; error?: string; message?: string; success: boolean }>;
  pullFromCloud: (
    tokenOverride?: string
  ) => Promise<{
    data?: CloudSyncSnapshot;
    error?: string;
    lastDevice?: string;
    success: boolean;
    updatedAt?: number;
  }>;
  queryHistory: QueryHistoryEntry[];
  recordAction: (
    action: Omit<UserActionEntry, "id" | "timestamp" | "syncStatus">
  ) => UserActionEntry;
  recordQuery: (
    query: Omit<QueryHistoryEntry, "id" | "timestamp">
  ) => QueryHistoryEntry;
  setSessionFromOAuth: (token: string, user: any, provider?: string) => void;
  refreshState: () => void;
  register: (
    name: string,
    email: string,
    pass: string,
    plan?: SubscriptionTier,
    billingCycle?: BillingCycle
  ) => Promise<{ error?: string; success: boolean; user?: any }>;
  saveSnippet: (
    snippet: Omit<SavedSnippet, "id" | "createdAt" | "updatedAt">
  ) => SavedSnippet;
  snippets: SavedSnippet[];
  syncNow: (
    profiles: Profile[],
    tokenOverride?: string
  ) => Promise<{ error?: string; message?: string; success: boolean; syncedItems: number }>;
  updateConfig: (updates: Partial<CloudSyncConfig>) => void;
  upgradePlan: (
    plan: SubscriptionTier,
    billingCycle: BillingCycle
  ) => Promise<{ error?: string; success: boolean; user?: any }>;
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

export function CloudSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [journal, setJournal] = useState<UserActionEntry[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [config, setConfig] = useState<CloudSyncConfig>(getCloudSyncConfig());
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshState = () => {
    setJournal(getStoredJournal());
    setQueryHistory(getStoredQueryHistory());
    setSnippets(getStoredSnippets());
    setConfig(getCloudSyncConfig());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleRecordAction = (
    action: Omit<UserActionEntry, "id" | "timestamp" | "syncStatus">
  ) => {
    const newEntry = storeUserAction(action);
    setJournal((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const handleRecordQuery = (
    query: Omit<QueryHistoryEntry, "id" | "timestamp">
  ) => {
    const newEntry = storeQueryHistory(query);
    setQueryHistory((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const handleSaveSnippet = (
    snippet: Omit<SavedSnippet, "id" | "createdAt" | "updatedAt">
  ) => {
    const newEntry = storeSnippet(snippet);
    setSnippets((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const handleDeleteSnippet = (id: string) => {
    deleteStoredSnippet(id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateConfig = (updates: Partial<CloudSyncConfig>) => {
    const updated = updateCloudSyncConfig(updates);
    setConfig(updated);
  };

  const handleSyncNow = async (profiles: Profile[], tokenOverride?: string) => {
    setIsSyncing(true);
    try {
      const result = await syncWithCloudBackend(profiles, tokenOverride);
      refreshState();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async (tokenOverride?: string) => {
    setIsSyncing(true);
    try {
      const result = await pullFromCloudBackend(tokenOverride);
      refreshState();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMergeWithCloud = async (profiles: Profile[], tokenOverride?: string) => {
    setIsSyncing(true);
    try {
      const result = await mergeWithCloudBackend(profiles, tokenOverride);
      refreshState();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const res = await loginToCloudBackend(email, pass);
    refreshState();
    return res;
  };

  const handleRegister = async (
    name: string,
    email: string,
    pass: string,
    plan?: SubscriptionTier,
    billingCycle?: BillingCycle
  ) => {
    const res = await registerToCloudBackend(name, email, pass, plan, billingCycle);
    refreshState();
    return res;
  };

  const handleSetSessionFromOAuth = (
    token: string,
    user: any,
    provider?: string
  ) => {
    saveAuthSession(token, user, provider);
    refreshState();
  };

  const handleOAuthLogin = async (
    provider: "google" | "github",
    email: string,
    name?: string,
    image?: string
  ) => {
    const res = await oauthLoginCloudBackend(provider, email, name, image);
    refreshState();
    return res;
  };

  const handleUpgradePlan = async (
    plan: SubscriptionTier,
    billingCycle: BillingCycle
  ) => {
    const res = await upgradeSubscriptionPlan(plan, billingCycle);
    refreshState();
    return res;
  };

  const handleLogout = () => {
    logoutCloudBackend();
    refreshState();
  };

  const handleClearJournal = () => {
    clearStoredJournal();
    setJournal([]);
  };

  return (
    <CloudSyncContext.Provider
      value={{
        clearJournal: handleClearJournal,
        config,
        deleteSnippet: handleDeleteSnippet,
        exportJson: exportCloudBackupJson,
        importJson: importCloudBackupJson,
        isAuthenticated: Boolean(config.apiToken && config.userEmail),
        isSyncing,
        journal,
        login: handleLogin,
        logout: handleLogout,
        oauthLogin: handleOAuthLogin,
        setSessionFromOAuth: handleSetSessionFromOAuth,
        mergeWithCloud: handleMergeWithCloud,
        pullFromCloud: handlePullFromCloud,
        queryHistory,
        recordAction: handleRecordAction,
        recordQuery: handleRecordQuery,
        refreshState,
        register: handleRegister,
        saveSnippet: handleSaveSnippet,
        snippets,
        syncNow: handleSyncNow,
        updateConfig: handleUpdateConfig,
        upgradePlan: handleUpgradePlan,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) {
    throw new Error("useCloudSync must be used within a CloudSyncProvider");
  }
  return ctx;
}
