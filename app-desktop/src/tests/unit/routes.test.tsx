import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { LOCAL_STORAGE_KEYS } from "@/constants";
import { ConnectionProvider, useConnection } from "@/context/connection-context";
import { mergeProfilesLists } from "@/services/cloud-sync";
import type { Profile } from "@/types/connection";

const defaultTls = {
  ca: null,
  cert: null,
  enabled: true,
  key: null,
  verify: true as const,
};

describe("ConnectionContext & Multi-tab Navigation", () => {
  it("provides initial profiles and default tab", () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PROFILES);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConnectionProvider>{children}</ConnectionProvider>
    );

    const { result } = renderHook(() => useConnection(), { wrapper });

    expect(result.current.profiles.length).toBeGreaterThan(0);
    expect(result.current.activeTabId).toBe("tab-home");
    expect(result.current.activeTabs).toHaveLength(1);
    expect(result.current.activeTabs[0].id).toBe("tab-home");
  });

  it("adds and closes connection tabs smoothly", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConnectionProvider>{children}</ConnectionProvider>
    );

    const { result } = renderHook(() => useConnection(), { wrapper });

    act(() => {
      result.current.addTab({
        env: "Production",
        id: "tab-prod",
        name: "Prod Database",
        profileId: "prod-1",
      });
    });

    expect(result.current.activeTabs).toHaveLength(2);
    expect(result.current.activeTabId).toBe("tab-prod");

    act(() => {
      result.current.closeTab("tab-prod");
    });

    expect(result.current.activeTabs).toHaveLength(1);
  });

  it("loads profiles from localStorage and saves updates", () => {
    const customProfile: Profile = {
      connection_revision: 3,
      created_at: "2026-10-25T10:00:00Z",
      db_type: "mysql",
      environment: "Production",
      favorite: true,
      has_saved_password: true,
      host: "db.company.com",
      id: "b2c3d4e5-9999-4444-8888-000000000001",
      method: "direct",
      name: "Remote Company Cluster",
      port: 3306,
      tls: defaultTls,
      updated_at: "2026-10-26T12:00:00Z",
      username: "admin",
    };

    localStorage.setItem(
      LOCAL_STORAGE_KEYS.PROFILES,
      JSON.stringify([customProfile])
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConnectionProvider>{children}</ConnectionProvider>
    );

    const { result } = renderHook(() => useConnection(), { wrapper });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe("Remote Company Cluster");
  });

  it("merges remote incoming profiles smoothly", () => {
    const initialProfile: Profile = {
      connection_revision: 1,
      created_at: "2026-10-20T09:00:00Z",
      db_type: "mariadb",
      environment: "Local",
      favorite: false,
      has_saved_password: false,
      host: "127.0.0.1",
      id: "a1a1a1a1-0000-0000-0000-000000000001",
      method: "direct",
      name: "Local MariaDB",
      port: 3306,
      tls: defaultTls,
      updated_at: "2026-10-20T09:00:00Z",
      username: "root",
    };

    localStorage.setItem(
      LOCAL_STORAGE_KEYS.PROFILES,
      JSON.stringify([initialProfile])
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConnectionProvider>{children}</ConnectionProvider>
    );

    const { result } = renderHook(() => useConnection(), { wrapper });

    const remoteProfile: Profile = {
      connection_revision: 1,
      created_at: "2026-10-28T12:00:00Z",
      db_type: "mysql",
      environment: "Staging",
      favorite: true,
      has_saved_password: false,
      host: "staging.internal",
      id: "b2b2b2b2-0000-0000-0000-000000000002",
      method: "direct",
      name: "Staging Database",
      port: 3306,
      tls: defaultTls,
      updated_at: "2026-10-28T12:00:00Z",
      username: "staging",
    };

    act(() => {
      result.current.mergeProfiles([remoteProfile]);
    });

    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.profiles.map((p) => p.name)).toContain("Staging Database");
    expect(result.current.profiles.map((p) => p.name)).toContain("Local MariaDB");
  });

  it("mergeProfilesLists resolves higher revisions and combines profiles correctly", () => {
    const localList: Profile[] = [
      {
        connection_revision: 1,
        created_at: "2026-10-20T09:00:00Z",
        db_type: "mariadb",
        environment: "Local",
        favorite: false,
        has_saved_password: false,
        host: "127.0.0.1",
        id: "p-1",
        method: "direct",
        name: "Old Local Name",
        port: 3306,
        tls: defaultTls,
        updated_at: "2026-10-20T09:00:00Z",
        username: "root",
      },
    ];

    const remoteList: Profile[] = [
      {
        connection_revision: 2,
        created_at: "2026-10-20T09:00:00Z",
        db_type: "mariadb",
        environment: "Local",
        favorite: true,
        has_saved_password: false,
        host: "127.0.0.1",
        id: "p-1",
        method: "direct",
        name: "Updated Remote Name",
        port: 3306,
        tls: defaultTls,
        updated_at: "2026-10-29T10:00:00Z",
        username: "root",
      },
      {
        connection_revision: 1,
        created_at: "2026-10-29T10:00:00Z",
        db_type: "mysql",
        environment: "Production",
        favorite: false,
        has_saved_password: false,
        host: "remote.mysql",
        id: "p-2",
        method: "direct",
        name: "Brand New Laptop Host",
        port: 3306,
        tls: defaultTls,
        updated_at: "2026-10-29T10:00:00Z",
        username: "admin",
      },
    ];

    const merged = mergeProfilesLists(localList, remoteList);

    expect(merged).toHaveLength(2);
    const p1 = merged.find((p) => p.id === "p-1");
    expect(p1?.name).toBe("Updated Remote Name");
    expect(p1?.connection_revision).toBe(2);

    const p2 = merged.find((p) => p.id === "p-2");
    expect(p2?.name).toBe("Brand New Laptop Host");
  });
});
