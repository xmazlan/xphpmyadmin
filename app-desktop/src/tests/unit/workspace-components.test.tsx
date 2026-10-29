import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectionGrid } from "@/components/workspace/connection/connection-grid";
import { ConnectionInspector } from "@/components/workspace/connection/connection-inspector";
import { ConnectionSidebar } from "@/components/workspace/connection/connection-sidebar";
import { INITIAL_PROFILES } from "@/components/workspace/constants";
import { ExplorerSidebar } from "@/components/workspace/explorer/explorer-sidebar";
import { ExportTab } from "@/components/workspace/tabs/export-tab";
import { ImportTab } from "@/components/workspace/tabs/import-tab";
import { OperationsTab } from "@/components/workspace/tabs/operations-tab";
import { RoutinesTab } from "@/components/workspace/tabs/routines-tab";
import { SearchTab } from "@/components/workspace/tabs/search-tab";
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
      getByPlaceholderText(/Cari host atau database\.\.\.|Search hosts or databases\.\.\./)
    ).toBeInTheDocument();
    expect(getByText("v1.4.2")).toBeInTheDocument();
  });

  it("handles pending sync badges correctly based on subscription tier", () => {
    // 1. Free tier shows amber pending badge
    const { getByText, queryByText, rerender } = render(
      <WorkspaceHeader
        activeTabId="tab-home"
        activeTabs={[
          { env: "Local", id: "tab-home", name: "Pengelola Koneksi" },
        ]}
        isSidebarCollapsed={false}
        onCloseTab={vi.fn()}
        onOpenCloudSync={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectTab={vi.fn()}
        onToggleSidebar={vi.fn()}
        pendingSyncCount={3}
        searchQuery=""
        userConfig={{
          apiEndpoint: "https://er-service.duckdns.org/api/sync",
          authEndpoint: "https://er-service.duckdns.org/api/auth",
          autoSync: false,
          billingCycle: "annual",
          maxVaults: 1,
          status: "idle",
          subscriptionTier: "free",
        }}
      />
    );

    expect(getByText("3")).toBeInTheDocument();

    // 2. Subscribed user (Pro/Team/Business) suppresses amber warning badge because auto-sync handles it
    rerender(
      <WorkspaceHeader
        activeTabId="tab-home"
        activeTabs={[
          { env: "Local", id: "tab-home", name: "Pengelola Koneksi" },
        ]}
        isSidebarCollapsed={false}
        onCloseTab={vi.fn()}
        onOpenCloudSync={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectTab={vi.fn()}
        onToggleSidebar={vi.fn()}
        pendingSyncCount={3}
        searchQuery=""
        userConfig={{
          apiEndpoint: "https://er-service.duckdns.org/api/sync",
          authEndpoint: "https://er-service.duckdns.org/api/auth",
          autoSync: true,
          billingCycle: "annual",
          maxVaults: 10,
          status: "idle",
          subscriptionTier: "pro",
          userEmail: "pro@example.com",
        }}
      />
    );

    expect(queryByText("3")).toBeNull();
  });

  it("renders ConnectionSidebar correctly and triggers onSelectSection for settings", () => {
    const onSelectMock = vi.fn();
    const { getByText, getByTitle } = render(
      <ConnectionSidebar isSidebarCollapsed={false} onSelectSection={onSelectMock} />
    );
    expect(getByText("Koneksi (Hosts)")).toBeInTheDocument();
    expect(getByText("SSH Tunnels")).toBeInTheDocument();
    const settingsBtn = getByTitle("Pengaturan");
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);
    expect(onSelectMock).toHaveBeenCalledWith("settings");
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

  it("renders ConnectionInspector correctly with SSH Tunnel method", () => {
    const sshProfile = INITIAL_PROFILES.find((p) => p.method === "ssh")!;
    const { getByText } = render(
      <ConnectionInspector
        diagnostics={null}
        editForm={sshProfile}
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

    expect(getByText("SSH Tunnel Details")).toBeInTheDocument();
    expect(getByText("Konfigurasi SSH Server (VPS / Bastion)")).toBeInTheDocument();
    expect(getByText("Standar Tunneling VPS Aktif:")).toBeInTheDocument();
    expect(getByText("Passphrase Kunci Privat (Opsional)")).toBeInTheDocument();
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

  it("renders WorkspaceNav tabs correctly including Search and Routines", () => {
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
    expect(getByText("Search")).toBeInTheDocument();
    expect(getByText("Operations")).toBeInTheDocument();
    expect(getByText("Export")).toBeInTheDocument();
    expect(getByText("Import")).toBeInTheDocument();
    expect(getByText("Routines")).toBeInTheDocument();
    expect(getByText("Status")).toBeInTheDocument();
    expect(getByText("User accounts")).toBeInTheDocument();
  });

  it("renders ExportTab with multi-format and custom table selection", () => {
    const { getByText } = render(
      <ExportTab
        availableTables={[{ name: "users", rows: 5, size: "16 KB" }]}
        currentSelectedDatabase="test_db"
        exportAddDropTable={true}
        exportDisableFk={true}
        exportFormat="sql"
        exportMethod="custom"
        exportMode="full"
        exportPreviewSql=""
        exportSelectedTables={["users"]}
        isExporting={false}
        onExecuteExport={vi.fn()}
        setExportAddDropTable={vi.fn()}
        setExportDisableFk={vi.fn()}
        setExportFormat={vi.fn()}
        setExportMethod={vi.fn()}
        setExportMode={vi.fn()}
        setExportSelectedTables={vi.fn()}
      />
    );

    expect(getByText(/Ekspor Basis Data/i)).toBeInTheDocument();
    expect(getByText("SQL Dump")).toBeInTheDocument();
    expect(getByText("CSV")).toBeInTheDocument();
    expect(getByText("JSON")).toBeInTheDocument();
    expect(getByText("XML")).toBeInTheDocument();
    expect(getByText("Pilih Tabel yang Diekspor")).toBeInTheDocument();
  });

  it("renders ImportTab correctly", () => {
    const { getByText } = render(
      <ImportTab
        availableDatabases={["test_db"]}
        availableTables={[{ name: "users", rows: 5, size: "16 KB" }]}
        currentSelectedDatabase="test_db"
        importSqlContent=""
        importTab="file"
        isImporting={false}
        onExecuteImport={vi.fn()}
        onPickImportFile={vi.fn()}
        onProcessChosenFile={vi.fn()}
        onSelectDatabase={vi.fn()}
        selectedImportFile={null}
        setCurrentSelectedDatabase={vi.fn()}
        setImportSqlContent={vi.fn()}
        setImportTab={vi.fn()}
        setSelectedImportFile={vi.fn()}
      />
    );

    expect(getByText("Pilih Berkas (.sql, .csv, .json)")).toBeInTheDocument();
    expect(getByText("Tempel Script SQL Mentah")).toBeInTheDocument();
    expect(getByText("Basis Data Target:")).toBeInTheDocument();
  });

  it("renders OperationsTab and SearchTab correctly", () => {
    const { getByText: getOpText } = render(
      <OperationsTab
        availableTables={[{ name: "customers", rows: 12, size: "32 KB" }]}
        currentSelectedDatabase="crm_db"
        newDbCollation="utf8mb4_general_ci"
        onChangeCollation={vi.fn()}
        onDropDatabase={vi.fn()}
        setNewDbCollation={vi.fn()}
      />
    );

    expect(
      getOpText("Penyortiran Karakter (Collation)")
    ).toBeInTheDocument();
    expect(getOpText("Ganti Nama Basis Data ke:")).toBeInTheDocument();
    expect(
      getOpText("Salin Basis Data (Copy Database)")
    ).toBeInTheDocument();

    const { getByText: getSearchText } = render(
      <SearchTab
        availableTables={[{ name: "customers", rows: 12, size: "32 KB" }]}
        currentSelectedDatabase="crm_db"
        isSearching={false}
        onBrowseTableMatches={vi.fn()}
        onExecuteSearch={vi.fn()}
        searchResults={[]}
      />
    );

    expect(
      getSearchText("Kata Kunci / Nilai yang Dicari:")
    ).toBeInTheDocument();
    expect(getSearchText("Mengandung Kata (LIKE)")).toBeInTheDocument();
  });

  it("renders RoutinesTab correctly", () => {
    const { getByText } = render(
      <RoutinesTab
        currentSelectedDatabase="store_db"
        isLoadingRoutines={false}
        onLoadRoutines={vi.fn()}
        routinesData={[
          {
            definer: "root@localhost",
            name: "CalculateTotal",
            type: "PROCEDURE",
          },
        ]}
        triggersData={[
          {
            event: "INSERT",
            name: "before_user_insert",
            table: "users",
            timing: "BEFORE",
          },
        ]}
      />
    );

    expect(getByText("Prosedur & Fungsi (1)")).toBeInTheDocument();
    expect(
      getByText("Pemicu Database / Triggers (1)")
    ).toBeInTheDocument();
    expect(getByText("CalculateTotal")).toBeInTheDocument();
  });
});
