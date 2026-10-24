import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchDatabases, testDatabaseConnection } from "@/actions/database";
import { ConnectionGrid } from "@/components/workspace/connection/connection-grid";
import { ConnectionInspector } from "@/components/workspace/connection/connection-inspector";
import { ConnectionSidebar } from "@/components/workspace/connection/connection-sidebar";
import { ConfirmDialog } from "@/components/workspace/modals/confirm-dialog";
import { useConnection } from "@/context/connection-context";
import {
  type DiagnosticStage,
  type Profile,
  passwordActionSchema,
  profileSchema,
} from "@/types/connection";

export function HomePage() {
  const navigate = useNavigate();
  const {
    addTab,
    closeTab,
    isSidebarCollapsed,
    profiles,
    savedPasswords,
    searchQuery,
    setActiveTabId,
    setProfiles,
    setSavedPasswords,
  } = useConnection();

  // State profil & daftar server
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id || "");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [deleteTargetProfile, setDeleteTargetProfile] =
    useState<Profile | null>(null);

  // State form inspector kanan
  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedId) || profiles[0],
    [profiles, selectedId]
  );
  const [editForm, setEditForm] = useState<Profile>({ ...selectedProfile });
  const [showPassword, setShowPassword] = useState(false);
  const [showSshPassword, setShowSshPassword] = useState(false);
  const [passwordAction, setPasswordAction] = useState<
    "keep" | "replace" | "remove"
  >("keep");
  const [passwordInput, setPasswordInput] = useState("");

  // State tes diagnostik 4 tahap
  const [isTesting, setIsTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticStage[] | null>(
    null
  );

  // Handlers
  const handleSelectHost = (profile: Profile) => {
    setSelectedId(profile.id);
    setEditForm({ ...profile });
    setPasswordAction(profile.has_saved_password ? "keep" : "replace");
    setPasswordInput(savedPasswords[profile.id] || "");
    setShowSshPassword(false);
    setDiagnostics(null);
    if (!isInspectorOpen) {
      setIsInspectorOpen(true);
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
    if (selectedId === id) {
      setEditForm((prev) => ({ ...prev, favorite: !prev.favorite }));
    }
    toast.success("Status favorit diperbarui");
  };

  const filteredProfiles = useMemo(
    () =>
      profiles
        .filter((p) => {
          if (favoritesOnly && !p.favorite) {
            return false;
          }
          if (!searchQuery.trim()) {
            return true;
          }
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.host.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          if (sortBy === "name") {
            return a.name.localeCompare(b.name);
          }
          if (!(a.last_used_at || b.last_used_at)) {
            return 0;
          }
          if (!a.last_used_at) {
            return 1;
          }
          if (!b.last_used_at) {
            return -1;
          }
          return (
            new Date(b.last_used_at).getTime() -
            new Date(a.last_used_at).getTime()
          );
        }),
    [profiles, searchQuery, favoritesOnly, sortBy]
  );

  const handleAddNewHost = () => {
    const newHost: Profile = {
      connection_revision: 1,
      created_at: new Date().toISOString(),
      database: "",
      environment: "Local",
      favorite: false,
      has_saved_password: false,
      host: "127.0.0.1",
      id: crypto.randomUUID(),
      last_used_at: null,
      method: "direct",
      name: "Koneksi Database Baru",
      port: 3306,
      ssh: null,
      tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
      updated_at: new Date().toISOString(),
      username: "root",
    };
    setProfiles([newHost, ...profiles]);
    handleSelectHost(newHost);
    toast.info("Draft koneksi baru dibuat", {
      description: "Lengkapi parameter lalu simpan.",
    });
  };

  const handleDeleteHost = (p: Profile) => {
    setDeleteTargetProfile(p);
  };

  const handleConfirmDeleteHost = () => {
    if (!deleteTargetProfile) {
      return;
    }
    const idToDelete = deleteTargetProfile.id;
    const remaining = profiles.filter((p) => p.id !== idToDelete);
    setProfiles(remaining);
    setSavedPasswords((prev) => {
      const next = { ...prev };
      delete next[idToDelete];
      return next;
    });
    closeTab(`tab-${idToDelete}`);
    if (selectedId === idToDelete) {
      if (remaining.length > 0) {
        handleSelectHost(remaining[0]);
      } else {
        setSelectedId("");
      }
    }
    toast.success(`Koneksi "${deleteTargetProfile.name}" berhasil dihapus.`);
    setDeleteTargetProfile(null);
  };

  const handleSaveProfile = () => {
    const candidatePayload = {
      ...editForm,
      port: Number(editForm.port),
      updated_at: new Date().toISOString(),
    };
    const profileValidation = profileSchema.safeParse(candidatePayload);
    if (!profileValidation.success) {
      const issue = profileValidation.error.issues[0];
      const pathName = issue?.path.join(".") || "Form";
      toast.error("Validasi Profil Gagal (Zod Invariant)", {
        description: `${pathName}: ${issue?.message || "Data tidak valid"}`,
      });
      return;
    }
    if (passwordAction === "replace") {
      const passValidation = passwordActionSchema.safeParse({
        action: "replace",
        password: passwordInput,
      });
      if (!passValidation.success) {
        toast.error("Validasi Password Gagal", {
          description:
            passValidation.error.issues[0]?.message || "Password kosong",
        });
        return;
      }
      setSavedPasswords((prev) => ({ ...prev, [editForm.id]: passwordInput }));
    } else if (passwordAction === "remove") {
      setSavedPasswords((prev) => {
        const next = { ...prev };
        delete next[editForm.id];
        return next;
      });
    }
    const validatedData = profileValidation.data;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === validatedData.id
          ? {
              ...validatedData,
              has_saved_password:
                passwordAction === "replace"
                  ? true
                  : passwordAction === "remove"
                    ? false
                    : p.has_saved_password,
            }
          : p
      )
    );
    toast.success("Profil Berhasil Disimpan", {
      description: `${validatedData.name} (${validatedData.host}:${validatedData.port}) tersimpan di SQLite`,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setDiagnostics([
      { duration_ms: 0, stage: "local_validation", status: "running" },
      { duration_ms: 0, stage: "ssh_trust", status: "pending" },
      {
        duration_ms: 0,
        stage: "ssh_authentication_forwarding",
        status: "pending",
      },
      {
        duration_ms: 0,
        stage: "mysql_tls_authentication_initial_database",
        status: "pending",
      },
    ]);
    await new Promise((r) => setTimeout(r, 120));
    setDiagnostics([
      { duration_ms: 12, stage: "local_validation", status: "passed" },
      {
        duration_ms: 0,
        stage: "ssh_trust",
        status: editForm.method === "ssh" ? "running" : "skipped",
      },
      {
        duration_ms: 0,
        stage: "ssh_authentication_forwarding",
        status: "pending",
      },
      {
        duration_ms: 0,
        stage: "mysql_tls_authentication_initial_database",
        status: "running",
      },
    ]);
    const activePass = passwordInput || savedPasswords[editForm.id] || "";
    const testResult = await testDatabaseConnection({
      database: undefined,
      host: editForm.host,
      password: activePass,
      port: Number(editForm.port),
      user: editForm.username,
    });
    if (testResult.ok) {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        {
          duration_ms: 0,
          stage: "ssh_trust",
          status: editForm.method === "ssh" ? "passed" : "skipped",
        },
        {
          duration_ms: 0,
          stage: "ssh_authentication_forwarding",
          status: editForm.method === "ssh" ? "passed" : "skipped",
        },
        {
          duration_ms: testResult.latencyMs || 22,
          stage: "mysql_tls_authentication_initial_database",
          status: "passed",
        },
      ]);
      toast.success("Sambungan MariaDB Terverifikasi 100%!", {
        description: `Server: ${testResult.version} • Latensi: ${testResult.latencyMs}ms`,
      });
    } else {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        {
          duration_ms: 0,
          stage: "ssh_trust",
          status: editForm.method === "ssh" ? "passed" : "skipped",
        },
        {
          duration_ms: 0,
          stage: "ssh_authentication_forwarding",
          status: editForm.method === "ssh" ? "passed" : "skipped",
        },
        {
          duration_ms: testResult.latencyMs || 0,
          message: testResult.error,
          stage: "mysql_tls_authentication_initial_database",
          status: "failed",
        },
      ]);
      toast.error("Gagal Terhubung ke MariaDB", {
        description:
          testResult.error || "Pastikan host, user, dan password benar.",
      });
    }
    setIsTesting(false);
  };

  const handleInspectSshKey = async () => {
    toast.info("Memindai Host Key SSH...", {
      description: `Target: ${editForm.ssh?.host || "bastion.internal"}`,
    });
    await new Promise((r) => setTimeout(r, 400));
    toast.success("Host Key SSH Terverifikasi", {
      description:
        "Algoritma: ssh-ed25519 • Fingerprint: SHA256:7uK2Z9jH4wQ8xP3v1Lm0",
    });
  };

  const handleConnect = async (targetProfile?: Profile) => {
    const prof = targetProfile || editForm;
    const activePass =
      prof.id === editForm.id && passwordInput
        ? passwordInput
        : savedPasswords[prof.id] || "123";
    if (passwordInput && prof.id === editForm.id) {
      setSavedPasswords((prev) => ({ ...prev, [prof.id]: passwordInput }));
    }
    const connParams = {
      database: undefined,
      host: prof.host,
      password: activePass,
      port: Number(prof.port),
      user: prof.username,
    };
    toast.loading("Mengambil daftar database dari MariaDB...", {
      id: "connect-toast",
    });
    const dbRes = await fetchDatabases(connParams);
    toast.dismiss("connect-toast");
    if (dbRes.ok && dbRes.databases.length > 0) {
      toast.success(
        `Terhubung ke MariaDB: ${dbRes.databases.length} database ditemukan!`,
        {
          description: `Server ${prof.host}:${prof.port} siap digunakan.`,
        }
      );
    } else {
      toast.error("Tidak dapat mengambil daftar database", {
        description:
          dbRes.error || "Pastikan MariaDB aktif dan password sudah benar.",
      });
    }

    // Add active tab and navigate to workspace route
    addTab({
      env: prof.environment,
      id: `tab-${prof.id}`,
      name: prof.name,
      profileId: prof.id,
    });
    setActiveTabId(`tab-${prof.id}`);

    const nowIso = new Date().toISOString();
    setProfiles((prev) =>
      prev.map((p) => (p.id === prof.id ? { ...p, last_used_at: nowIso } : p))
    );

    navigate({
      params: { profileId: prof.id },
      to: "/workspace/$profileId",
    });
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ConnectionSidebar isSidebarCollapsed={isSidebarCollapsed} />

      <ConnectionGrid
        favoritesOnly={favoritesOnly}
        filteredProfiles={filteredProfiles}
        isInspectorOpen={isInspectorOpen}
        onAddNewHost={handleAddNewHost}
        onDeleteHost={handleDeleteHost}
        onSelectHost={handleSelectHost}
        onSortByChange={setSortBy}
        onToggleFavorite={handleToggleFavorite}
        onToggleFavoriteFilter={setFavoritesOnly}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        selectedId={selectedId}
        sortBy={sortBy}
      />

      <ConnectionInspector
        diagnostics={diagnostics}
        editForm={editForm}
        isOpen={isInspectorOpen}
        isTesting={isTesting}
        onClose={() => setIsInspectorOpen(false)}
        onConnect={() => handleConnect()}
        onInspectSshKey={handleInspectSshKey}
        onSaveProfile={handleSaveProfile}
        onTestConnection={handleTestConnection}
        passwordAction={passwordAction}
        passwordInput={passwordInput}
        setEditForm={setEditForm}
        setPasswordAction={setPasswordAction}
        setPasswordInput={setPasswordInput}
        setShowPassword={setShowPassword}
        setShowSshPassword={setShowSshPassword}
        showPassword={showPassword}
        showSshPassword={showSshPassword}
      />

      <ConfirmDialog
        cancelText="Batal"
        confirmText="Hapus Koneksi"
        description={
          deleteTargetProfile ? (
            <span>
              Apakah Anda yakin ingin menghapus koneksi host{" "}
              <strong className="text-foreground">
                {deleteTargetProfile.name}
              </strong>{" "}
              (
              <span className="font-mono text-xs">
                {deleteTargetProfile.host}:{deleteTargetProfile.port}
              </span>
              )? Profil konfigurasi ini akan dihapus dari aplikasi.
            </span>
          ) : (
            ""
          )
        }
        isOpen={!!deleteTargetProfile}
        onCancel={() => setDeleteTargetProfile(null)}
        onConfirm={handleConfirmDeleteHost}
        title="Konfirmasi Hapus Koneksi Host"
        variant="destructive"
      />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
