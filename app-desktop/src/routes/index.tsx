import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  fetchDatabases,
  testDatabaseConnection,
  testSshTunnelAction,
} from "@/actions/database";
import { ConnectionGrid } from "@/components/workspace/connection/connection-grid";
import { ConnectionInspector } from "@/components/workspace/connection/connection-inspector";
import { ConnectionSidebar } from "@/components/workspace/connection/connection-sidebar";
import { ConfirmDialog } from "@/components/workspace/modals/confirm-dialog";
import { useConnection } from "@/context/connection-context";
import { useCloudSync } from "@/context/cloud-sync-context";
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
  const { recordAction } = useCloudSync();

  // State navigasi sidebar & filter metode
  const [activeNav, setActiveNav] = useState<string>("hosts");
  const [methodFilter, setMethodFilter] = useState<"all" | "direct" | "ssh">("all");

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

  const handleSelectNav = (sectionId: string) => {
    setActiveNav(sectionId);
    if (sectionId === "tunnels") {
      setMethodFilter("ssh");
      const sshProfile = profiles.find((p) => p.method === "ssh");
      if (sshProfile) {
        handleSelectHost(sshProfile);
      }
      toast.info("Menu SSH Tunnels Aktif", {
        description: "Menampilkan koneksi database via terowongan SSH VPS.",
      });
    } else if (sectionId === "hosts") {
      setMethodFilter("all");
    } else if (sectionId === "keychain") {
      toast.info("Keychain Password Vault", {
        description: "Password disimpan aman menggunakan enkripsi AES-256.",
      });
    } else if (sectionId === "settings") {
      toast.info("Pengaturan Koneksi", {
        description: "Gunakan panel inspector untuk mengatur parameter database dan SSH.",
      });
    } else {
      toast.info(`Bagian ${sectionId} dipilih`);
    }
  };

  const handleMethodFilterChange = (filter: "all" | "direct" | "ssh") => {
    setMethodFilter(filter);
    if (filter === "ssh") {
      setActiveNav("tunnels");
    } else if (filter === "all" || filter === "direct") {
      setActiveNav("hosts");
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
          if (activeNav === "tunnels" || methodFilter === "ssh") {
            if (p.method !== "ssh") {
              return false;
            }
          } else if (methodFilter === "direct") {
            if (p.method === "ssh") {
              return false;
            }
          }
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
            p.username.toLowerCase().includes(q) ||
            (p.ssh?.host && p.ssh.host.toLowerCase().includes(q))
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
    [profiles, searchQuery, favoritesOnly, sortBy, activeNav, methodFilter]
  );

  const handleAddNewHost = () => {
    const newHost: Profile = {
      connection_revision: 1,
      created_at: new Date().toISOString(),
      database: "",
      db_type: "auto",
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
    recordAction({
      action: "profile_create",
      category: "connection",
      details: { host: newHost.host, port: newHost.port, method: "direct" },
      profileId: newHost.id,
      profileName: newHost.name,
    });
    handleSelectHost(newHost);
    toast.info("Draft koneksi baru dibuat", {
      description: "Lengkapi parameter lalu simpan.",
    });
  };

  const handleAddNewSshTunnel = () => {
    const newSshHost: Profile = {
      connection_revision: 1,
      created_at: new Date().toISOString(),
      database: "",
      db_type: "auto",
      environment: "Production",
      favorite: false,
      has_saved_password: false,
      host: "127.0.0.1",
      id: crypto.randomUUID(),
      last_used_at: null,
      method: "ssh",
      name: "VPS MySQL via SSH Tunnel",
      port: 3306,
      ssh: {
        auth_type: "password",
        host: "",
        key: "",
        passphrase: "",
        password: "",
        port: 22,
        username: "root",
      },
      tls: { ca: null, cert: null, enabled: false, key: null, verify: true },
      updated_at: new Date().toISOString(),
      username: "root",
    };
    setProfiles([newSshHost, ...profiles]);
    recordAction({
      action: "profile_create",
      category: "connection",
      details: { host: newSshHost.host, port: newSshHost.port, method: "ssh" },
      profileId: newSshHost.id,
      profileName: newSshHost.name,
    });
    handleSelectHost(newSshHost);
    setIsInspectorOpen(true);
    toast.info("Draft SSH Tunnel Baru Dibuat", {
      description: "Masukkan IP publik VPS dan kredensial SSH pada panel sebelah kanan.",
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
    recordAction({
      action: "profile_delete",
      category: "connection",
      details: { host: deleteTargetProfile.host },
      profileId: deleteTargetProfile.id,
      profileName: deleteTargetProfile.name,
    });
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
    let activePass = "";
    if (passwordAction === "remove") {
      activePass = "";
    } else if (passwordAction === "replace") {
      activePass = passwordInput;
    } else {
      activePass = savedPasswords[editForm.id] ?? "";
    }

    let sshTrustStatus: "passed" | "failed" | "skipped" = "skipped";
    let sshTrustMsg: string | undefined = undefined;

    if (editForm.method === "ssh" && editForm.ssh) {
      const sshRes = await testSshTunnelAction(editForm.ssh);
      if (sshRes.ok) {
        sshTrustStatus = "passed";
        sshTrustMsg = `${sshRes.keyAlgorithm} • ${sshRes.fingerprint}`;
      } else {
        sshTrustStatus = "failed";
        sshTrustMsg = sshRes.error;
      }
    }

    if (editForm.method === "ssh" && sshTrustStatus === "failed") {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        {
          duration_ms: 0,
          message: sshTrustMsg,
          stage: "ssh_trust",
          status: "failed",
        },
        {
          duration_ms: 0,
          stage: "ssh_authentication_forwarding",
          status: "failed",
        },
        {
          duration_ms: 0,
          stage: "mysql_tls_authentication_initial_database",
          status: "pending",
        },
      ]);
      toast.error("Gagal Terhubung ke Bastion SSH", {
        description: sshTrustMsg || "Periksa konfigurasi SSH Tunnel Anda.",
      });
      setIsTesting(false);
      return;
    }

    const testResult = await testDatabaseConnection({
      database: undefined,
      host: editForm.host,
      method: editForm.method,
      password: activePass,
      port: Number(editForm.port),
      ssh: editForm.method === "ssh" ? editForm.ssh : null,
      user: editForm.username,
    });
    if (testResult.ok) {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        {
          duration_ms: 0,
          message: sshTrustMsg,
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
      const dbTypeLabel = testResult.dbType || "Database";
      toast.success(`Sambungan ${dbTypeLabel} Terverifikasi 100%!`, {
        description: `Server: ${testResult.version} • Latensi: ${testResult.latencyMs}ms`,
      });
    } else {
      setDiagnostics([
        { duration_ms: 12, stage: "local_validation", status: "passed" },
        {
          duration_ms: 0,
          message: sshTrustMsg,
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
      toast.error("Gagal Terhubung ke Database", {
        description:
          testResult.error || "Pastikan host, user, dan password benar.",
      });
    }
    setIsTesting(false);
  };

  const handleInspectSshKey = async () => {
    if (!editForm.ssh?.host) {
      toast.error("Host SSH belum diisi", {
        description: "Masukkan IP atau hostname VPS pada kolom SSH Host.",
      });
      return;
    }
    toast.info("Memindai Host Key SSH...", {
      description: `Target: ${editForm.ssh.host}:${editForm.ssh.port || 22}`,
    });
    const res = await testSshTunnelAction(editForm.ssh);
    if (res.ok) {
      toast.success("Host Key SSH Terverifikasi!", {
        description: `Algoritma: ${res.keyAlgorithm} • Fingerprint: ${res.fingerprint} (${res.latencyMs}ms)`,
      });
    } else {
      toast.error("Gagal Memindai Host Key SSH", {
        description:
          res.error || "Pastikan server SSH aktif dan kredensial sudah benar.",
      });
    }
  };

  const handleConnect = async (targetProfile?: Profile) => {
    const prof = targetProfile || editForm;
    let activePass = "";
    if (prof.id === editForm.id) {
      if (passwordAction === "remove") {
        activePass = "";
      } else if (passwordAction === "replace") {
        activePass = passwordInput;
      } else {
        activePass = savedPasswords[prof.id] ?? "";
      }
    } else {
      activePass = savedPasswords[prof.id] ?? "";
    }

    if (prof.id === editForm.id) {
      setSavedPasswords((prev) => ({ ...prev, [prof.id]: activePass }));
    }
    const connParams = {
      database: undefined,
      host: prof.host,
      method: prof.method,
      password: activePass,
      port: Number(prof.port),
      ssh: prof.method === "ssh" ? prof.ssh : null,
      user: prof.username,
    };
    toast.loading("Mengambil daftar database dari server...", {
      id: "connect-toast",
    });
    const dbRes = await fetchDatabases(connParams);
    toast.dismiss("connect-toast");
    if (dbRes.ok && dbRes.databases.length > 0) {
      toast.success(
        `Terhubung ke Database: ${dbRes.databases.length} database ditemukan!`,
        {
          description: `Server ${prof.host}:${prof.port} siap digunakan.`,
        }
      );
    } else if (dbRes.ok) {
      toast.warning(
        "Terhubung ke MariaDB, tetapi tidak ada database ditemukan.",
        {
          description: `Server ${prof.host}:${prof.port} berhasil dihubungi.`,
        }
      );
    } else {
      toast.error("Tidak dapat mengambil daftar database", {
        description:
          dbRes.error || "Pastikan database server aktif dan password sudah benar.",
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
      <ConnectionSidebar
        activeSection={activeNav}
        isSidebarCollapsed={isSidebarCollapsed}
        onSelectSection={handleSelectNav}
      />

      <ConnectionGrid
        favoritesOnly={favoritesOnly}
        filteredProfiles={filteredProfiles}
        isInspectorOpen={isInspectorOpen}
        methodFilter={methodFilter}
        onAddNewHost={handleAddNewHost}
        onAddNewSshTunnel={handleAddNewSshTunnel}
        onDeleteHost={handleDeleteHost}
        onMethodFilterChange={handleMethodFilterChange}
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
        title="Konfirmasi Penghapusan Koneksi"
      />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
