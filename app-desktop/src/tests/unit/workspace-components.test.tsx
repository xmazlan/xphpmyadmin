import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectionGrid } from "@/components/workspace/connection/connection-grid";
import { ConnectionInspector } from "@/components/workspace/connection/connection-inspector";
import { ConnectionSidebar } from "@/components/workspace/connection/connection-sidebar";
import { INITIAL_PROFILES } from "@/components/workspace/constants";
import { ExplorerSidebar } from "@/components/workspace/explorer/explorer-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceNav } from "@/components/workspace/workspace-nav";

const DELETE_HOST_REGEX = /Hapus koneksi/i;

describe("Workspace Components", () => {
  it("renders WorkspaceHeader correctly", () => {
    const { getByText, getByPlaceholderText } = render(
      <WorkspaceHeader
        activeTabId="tab-home"
        activeTabs={[
          { env: "Local", id: "tab-home", name: "Pengelola Koneksi" },
        ]}
        isSidebarCollapsed={false}
        onCloseTab={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectTab={vi.fn()}
        onToggleSidebar={vi.fn()}
        searchQuery=""
      />
    );

    expect(getByText("Pengelola Koneksi")).toBeInTheDocument();
    expect(
      getByPlaceholderText("Cari host atau database...")
    ).toBeInTheDocument();
  });

  it("renders ConnectionSidebar correctly", () => {
    const { getByText } = render(
      <ConnectionSidebar isSidebarCollapsed={false} />
    );
    expect(getByText("Koneksi (Hosts)")).toBeInTheDocument();
    expect(getByText("SSH Tunnels")).toBeInTheDocument();
    expect(getByText("Pengaturan")).toBeInTheDocument();
  });

  it("renders ConnectionGrid with hosts list and triggers onDeleteHost", () => {
    const onDeleteHostMock = vi.fn();
    const { getByText, getAllByLabelText } = render(
      <ConnectionGrid
        favoritesOnly={false}
        filteredProfiles={INITIAL_PROFILES}
        isInspectorOpen={true}
        onAddNewHost={vi.fn()}
        onDeleteHost={onDeleteHostMock}
        onSelectHost={vi.fn()}
        onSortByChange={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleFavoriteFilter={vi.fn()}
        onToggleInspector={vi.fn()}
        selectedId={INITIAL_PROFILES[0].id}
        sortBy="recent"
      />
    );

    expect(getByText("Tambah Koneksi")).toBeInTheDocument();
    expect(getByText(INITIAL_PROFILES[0].name)).toBeInTheDocument();

    const deleteButtons = getAllByLabelText(DELETE_HOST_REGEX);
    expect(deleteButtons.length).toBeGreaterThan(0);
    deleteButtons[0].click();
    expect(onDeleteHostMock).toHaveBeenCalledWith(INITIAL_PROFILES[0]);
  });

  it("renders ConnectionInspector correctly", () => {
    const { getByText } = render(
      <ConnectionInspector
        diagnostics={null}
        editForm={INITIAL_PROFILES[0]}
        isOpen={true}
        isTesting={false}
        onClose={vi.fn()}
        onConnect={vi.fn()}
        onInspectSshKey={vi.fn()}
        onSaveProfile={vi.fn()}
        onTestConnection={vi.fn()}
        passwordAction="keep"
        passwordInput=""
        setEditForm={vi.fn()}
        setPasswordAction={vi.fn()}
        setPasswordInput={vi.fn()}
        setShowPassword={vi.fn()}
        setShowSshPassword={vi.fn()}
        showPassword={false}
        showSshPassword={false}
      />
    );

    expect(getByText("Host Details")).toBeInTheDocument();
    expect(getByText("Server Database MySQL / MariaDB")).toBeInTheDocument();
    expect(getByText("Hubungkan ke Database")).toBeInTheDocument();
  });

  it("renders ExplorerSidebar correctly", () => {
    const { getByText, getAllByText } = render(
      <ExplorerSidebar
        activeConnectedProfile={INITIAL_PROFILES[0]}
        availableDatabases={["test_db", "production_db"]}
        currentSelectedDatabase="test_db"
        databaseSearch=""
        filteredDatabases={["test_db", "production_db"]}
        filteredDisplayTables={[{ name: "users", rows: 10, size: "1 KB" }]}
        isLoadingTables={false}
        isOpen={true}
        onClose={vi.fn()}
        onOpenCreateDbModal={vi.fn()}
        onOpenDatabase={vi.fn()}
        onRefreshDatabases={vi.fn()}
        onSelectTable={vi.fn()}
        onSwitchToHub={vi.fn()}
        selectedTable="users"
        setDatabaseSearch={vi.fn()}
        setTableSearch={vi.fn()}
        tableSearch=""
      />
    );

    expect(getByText("Databases (2)")).toBeInTheDocument();
    expect(getAllByText("test_db")[0]).toBeInTheDocument();
    expect(getByText("users")).toBeInTheDocument();
    expect(getByText("Ganti Host")).toBeInTheDocument();
  });

  it("renders WorkspaceNav tabs correctly", () => {
    const { getByText } = render(
      <WorkspaceNav
        activeConnectedProfile={INITIAL_PROFILES[0]}
        availableDatabasesCount={2}
        currentSelectedDatabase="test_db"
        currentWorkspaceTab="databases"
        isWorkspaceSidebarOpen={true}
        onOpenWorkspaceSidebar={vi.fn()}
        onSwitchWorkspaceTab={vi.fn()}
        selectedTable="users"
      />
    );

    expect(getByText("Databases")).toBeInTheDocument();
    expect(getByText("Structure (test_db)")).toBeInTheDocument();
    expect(getByText("SQL")).toBeInTheDocument();
    expect(getByText("Operations")).toBeInTheDocument();
    expect(getByText("Status")).toBeInTheDocument();
    expect(getByText("User accounts")).toBeInTheDocument();
    expect(getByText("Export")).toBeInTheDocument();
    expect(getByText("Import")).toBeInTheDocument();
  });
});
