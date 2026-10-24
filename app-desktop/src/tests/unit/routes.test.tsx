import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { ConnectionProvider, useConnection } from "@/context/connection-context";

describe("ConnectionContext & Multi-tab Navigation", () => {
  it("provides initial profiles and default tab", () => {
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
});
