import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { INITIAL_PROFILES } from "@/components/workspace/constants";
import type { ActiveTabItem } from "@/components/workspace/types";
import { LOCAL_STORAGE_KEYS } from "@/constants";
import { mergeProfilesLists, setCachedProfiles } from "@/services/cloud-sync";
import type { Profile } from "@/types/connection";

interface ConnectionContextValue {
  activeTabId: string;
  activeTabs: ActiveTabItem[];
  addTab: (tab: ActiveTabItem) => void;
  closeTab: (tabId: string) => void;
  isSidebarCollapsed: boolean;
  mergeProfiles: (incoming: Profile[]) => void;
  profiles: Profile[];
  savedPasswords: Record<string, string>;
  searchQuery: string;
  setActiveTabId: (id: string) => void;
  setIsSidebarCollapsed: (
    collapsed: boolean | ((prev: boolean) => boolean)
  ) => void;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  setSavedPasswords: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setSearchQuery: (query: string) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILES);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_PROFILES;
  });

  const [savedPasswords, setSavedPasswords] = useState<Record<string, string>>({
    "a1c3d4e5-3333-4444-8888-3456789abcde": "",
    "e4a1b2c3-1111-4444-8888-123456789abc": "secret",
  });
  const [activeTabs, setActiveTabs] = useState<ActiveTabItem[]>([
    { env: "Local", id: "tab-home", name: "Pengelola Koneksi" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync to localStorage and global cached profiles whenever profiles change
  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.PROFILES,
          JSON.stringify(profiles)
        );
      } catch {
        // ignore storage errors
      }
    }
    setCachedProfiles(profiles);
  }, [profiles]);

  const mergeProfiles = (incoming: Profile[]) => {
    if (!incoming || incoming.length === 0) return;
    setProfiles((prev) => mergeProfilesLists(prev, incoming));
  };

  const addTab = (tab: ActiveTabItem) => {
    setActiveTabs((prev) => {
      if (prev.find((t) => t.id === tab.id)) {
        return prev;
      }
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabId === "tab-home") {
      return;
    }
    setActiveTabs((prev) => prev.filter((t) => t.id !== tabId));
  };

  return (
    <ConnectionContext.Provider
      value={{
        activeTabId,
        activeTabs,
        addTab,
        closeTab,
        isSidebarCollapsed,
        mergeProfiles,
        profiles,
        savedPasswords,
        searchQuery,
        setActiveTabId,
        setIsSidebarCollapsed,
        setProfiles,
        setSavedPasswords,
        setSearchQuery,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return ctx;
}
