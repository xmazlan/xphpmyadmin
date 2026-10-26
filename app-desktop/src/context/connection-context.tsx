import type React from "react";
import { createContext, useContext, useState } from "react";
import { INITIAL_PROFILES } from "@/components/workspace/constants";
import type { ActiveTabItem } from "@/components/workspace/types";
import type { Profile } from "@/types/connection";

interface ConnectionContextValue {
  activeTabId: string;
  activeTabs: ActiveTabItem[];
  addTab: (tab: ActiveTabItem) => void;
  closeTab: (tabId: string) => void;
  isSidebarCollapsed: boolean;
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
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [savedPasswords, setSavedPasswords] = useState<Record<string, string>>({
    "a1c3d4e5-3333-4444-8888-3456789abcde": "123",
    "e4a1b2c3-1111-4444-8888-123456789abc": "secret",
  });
  const [activeTabs, setActiveTabs] = useState<ActiveTabItem[]>([
    { env: "Local", id: "tab-home", name: "Pengelola Koneksi" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
