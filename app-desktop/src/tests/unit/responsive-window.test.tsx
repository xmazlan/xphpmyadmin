import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DragWindowRegion from "@/components/drag-window-region";
import { ConnectionGrid } from "@/components/workspace/connection/connection-grid";
import { INITIAL_PROFILES } from "@/components/workspace/constants";
import { CloudSyncModal } from "@/components/workspace/modals/cloud-sync-modal";
import { CloudSyncProvider } from "@/context/cloud-sync-context";
import { ConnectionProvider } from "@/context/connection-context";

vi.mock("@/actions/app", () => ({
  getPlatform: vi.fn().mockResolvedValue("linux"),
}));

vi.mock("@/actions/window", () => ({
  closeWindow: vi.fn(),
  isWindowMaximized: vi.fn().mockResolvedValue(false),
  maximizeWindow: vi.fn(),
  minimizeWindow: vi.fn(),
}));

describe("Responsive Window & Layout Modes", () => {
  it("renders DragWindowRegion in windowed mode with maximize button", async () => {
    const { findByTitle, getByText } = render(
      <DragWindowRegion title="xphpMyAdmin Desktop" />
    );

    expect(getByText("xphpMyAdmin Desktop")).toBeInTheDocument();
    const maxBtn = await findByTitle(/Maksimalkan/i);
    expect(maxBtn).toBeInTheDocument();
  });

  it("handles double click on draglayer to toggle window state", async () => {
    const { container } = render(
      <DragWindowRegion title="xphpMyAdmin Desktop" />
    );

    const dragLayer = container.querySelector(".draglayer");
    expect(dragLayer).toBeInTheDocument();
    if (dragLayer) {
      await act(async () => {
        fireEvent.doubleClick(dragLayer);
      });
    }
  });

  it("applies responsive grid classes when inspector is open in windowed vs full mode", () => {
    const { container } = render(
      <ConnectionGrid
        favoritesOnly={false}
        filteredProfiles={INITIAL_PROFILES}
        isInspectorOpen={true}
        onAddNewHost={vi.fn()}
        onDeleteHost={vi.fn()}
        onSelectHost={vi.fn()}
        onSortByChange={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleFavoriteFilter={vi.fn()}
        onToggleInspector={vi.fn()}
        selectedId={INITIAL_PROFILES[0].id}
        sortBy="recent"
      />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-1");
  });

  it("applies multi-column grid classes when inspector is closed", () => {
    const { container } = render(
      <ConnectionGrid
        favoritesOnly={false}
        filteredProfiles={INITIAL_PROFILES}
        isInspectorOpen={false}
        onAddNewHost={vi.fn()}
        onDeleteHost={vi.fn()}
        onSelectHost={vi.fn()}
        onSortByChange={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleFavoriteFilter={vi.fn()}
        onToggleInspector={vi.fn()}
        selectedId={INITIAL_PROFILES[0].id}
        sortBy="recent"
      />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
  });

  it("renders CloudSyncModal with responsive container and tabs layout", () => {
    const { getByRole, getByText } = render(
      <ConnectionProvider>
        <CloudSyncProvider>
          <CloudSyncModal isOpen={true} onClose={vi.fn()} />
        </CloudSyncProvider>
      </ConnectionProvider>
    );

    const dialog = getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.className).toContain("flex");
    expect(dialog.className).toContain("flex-col");
    expect(dialog.className).toContain("w-[96vw]");
    expect(dialog.className).toContain("h-[92vh]");

    expect(getByText("Sinkronisasi Cloud & Vault")).toBeInTheDocument();
    expect(getByText("Upgrade Plan")).toBeInTheDocument();
  });
});
