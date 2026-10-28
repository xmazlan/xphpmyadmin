import {
  Check,
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { useCloudSync } from "@/context/cloud-sync-context";
import { cn } from "@/utils/tailwind";

interface AuthGateProps {
  onBypassLocal?: () => void;
}

export function AuthGate({ onBypassLocal }: AuthGateProps) {
  const { login, oauthLogin, register, setSessionFromOAuth } = useCloudSync();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Social / OAuth dialog state
  const [oauthDialog, setOauthDialog] = useState<"google" | "github" | null>(null);
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthName, setOauthName] = useState("");

  // External browser OAuth state
  const [isWaitingBrowserAuth, setIsWaitingBrowserAuth] = useState(false);
  const [browserAuthProvider, setBrowserAuthProvider] = useState<"google" | "github">("google");

  // Listen for OAuth callback redirected from external browser
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronOAuth?.onOAuthCallback) {
      const unsubscribe = window.electronOAuth.onOAuthCallback((data) => {
        setSessionFromOAuth(data.token, data.user, data.provider);
        setIsWaitingBrowserAuth(false);
        setSuccessMsg(
          `Berhasil masuk via ${data.provider === "github" ? "GitHub" : "Google"}! Mengalihkan ke workspace...`
        );
      });
      return unsubscribe;
    }
  }, [setSessionFromOAuth]);

  const handleOAuthClick = async (provider: "google" | "github") => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (typeof window !== "undefined" && window.electronOAuth?.startOAuth) {
      setIsWaitingBrowserAuth(true);
      setBrowserAuthProvider(provider);
      try {
        const res = await window.electronOAuth.startOAuth(provider);
        if (!res.success) {
          setErrorMsg(res.error || "Gagal membuka peramban web eksternal");
          setIsWaitingBrowserAuth(false);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Gagal membuka peramban web eksternal");
        setIsWaitingBrowserAuth(false);
      }
    } else {
      // Fallback for tests & environments without Electron main IPC
      setOauthEmail(provider === "google" ? "robyfull.dev@gmail.com" : "robyajo@users.noreply.github.com");
      setOauthName(provider === "google" ? "Roby Developer" : "Roby Ajo GitHub");
      setOauthDialog(provider);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Email dan kata sandi wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        const res = await login(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        } else {
          setSuccessMsg("Berhasil masuk! Mengalihkan ke workspace...");
        }
      } else {
        if (!name.trim()) {
          setErrorMsg("Nama lengkap wajib diisi untuk pendaftaran");
          setIsLoading(false);
          return;
        }
        // User starts with free tier (local vault only)
        const res = await register(name.trim(), email.trim(), password, "free", "annual");
        if (!res.success) {
          setErrorMsg(res.error || "Gagal mendaftar. Silakan coba kembali.");
        } else {
          setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke workspace lokal...");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan pada sistem autentikasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSubmit = async (provider: "google" | "github") => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const targetEmail = oauthEmail.trim() || (provider === "google" ? "robyfull.dev@gmail.com" : "robyajo@users.noreply.github.com");
    const targetName = oauthName.trim() || (provider === "google" ? "Roby Developer" : "Roby Ajo GitHub");

    setIsLoading(true);
    try {
      const res = await oauthLogin(provider, targetEmail, targetName);
      if (res.success) {
        setSuccessMsg(`Berhasil login dengan ${provider === "google" ? "Google Workspace" : "GitHub OAuth"}!`);
        setOauthDialog(null);
      } else {
        setErrorMsg(res.error || `Gagal autentikasi via ${provider.toUpperCase()}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Terjadi kendala saat menghubungkan ke ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await login(presetEmail, presetPass);
      if (!res.success) {
        setErrorMsg(res.error || "Akun pengujian gagal diautentikasi");
      } else {
        setSuccessMsg("Autentikasi akun pengujian berhasil!");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal masuk");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-background via-card/60 to-background p-4 sm:p-6">
      {/* Background ambient decorative glow */}
      <div className="-top-32 -left-32 pointer-events-none absolute size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="-bottom-32 -right-32 pointer-events-none absolute size-96 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-inner">
            <Database className="size-7" />
          </div>
          <div className="flex items-center gap-1.5 font-bold font-mono text-xs uppercase tracking-wider text-primary">
            <Sparkles size={13} />
            <span>xphpMyAdmin Desktop</span>
          </div>
          <h1 className="mt-1 font-bold text-2xl tracking-tight text-foreground">
            {mode === "login" ? "Masuk ke Workspace" : "Daftar Akun Baru"}
          </h1>
          <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
            Kelola basis data remote MySQL & MariaDB secara lokal gratis dengan opsi sinkronisasi cloud terpusat.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs leading-snug">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 text-xs">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* External Browser OAuth Waiting Notification */}
        {isWaitingBrowserAuth && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse">
              {browserAuthProvider === "google" ? (
                <SiGoogle size={16} color="#EA4335" />
              ) : (
                <SiGithub size={16} />
              )}
            </div>
            <div className="font-semibold text-foreground text-xs">
              Menunggu Autentikasi di Peramban Web...
            </div>
            <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
              Peramban sistem telah dibuka. Selesaikan proses masuk di halaman web, dan aplikasi ini akan otomatis mendeteksi dan membuka sesi Anda.
            </p>
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <button
                className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 font-medium text-[11px] text-foreground hover:bg-muted"
                onClick={() => handleOAuthClick(browserAuthProvider)}
                type="button"
              >
                <ExternalLink size={11} />
                <span>Buka Peramban Lagi</span>
              </button>
              <button
                className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-medium text-[11px] text-destructive hover:bg-destructive/20"
                onClick={() => setIsWaitingBrowserAuth(false)}
                type="button"
              >
                Batalkan
              </button>
            </div>
          </div>
        )}

        {/* Social / OAuth Buttons (Google & GitHub) */}
        <div className="space-y-2.5">
          <button
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background/80 font-medium text-foreground text-xs shadow-xs transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-60"
            disabled={isLoading || isWaitingBrowserAuth}
            onClick={() => handleOAuthClick("google")}
            type="button"
          >
            <SiGoogle size={15} color="#EA4335" />
            <span>Lanjutkan dengan Google</span>
          </button>

          <button
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background/80 font-medium text-foreground text-xs shadow-xs transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-60"
            disabled={isLoading || isWaitingBrowserAuth}
            onClick={() => handleOAuthClick("github")}
            type="button"
          >
            <SiGithub size={15} />
            <span>Lanjutkan dengan GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-border border-t" />
          <span className="absolute bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-wider">
            atau kredensial email
          </span>
        </div>

        {/* Mode Selector (Login vs Register) */}
        <div className="mb-4 grid grid-cols-2 rounded-lg border border-border bg-muted/40 p-1 text-xs">
          <button
            className={cn(
              "rounded-md py-1.5 font-medium transition-all",
              mode === "login"
                ? "border border-border bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            type="button"
          >
            Masuk
          </button>
          <button
            className={cn(
              "rounded-md py-1.5 font-medium transition-all",
              mode === "register"
                ? "border border-border bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            type="button"
          >
            Daftar Akun Gratis
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div>
              <label className="mb-1 block font-medium text-muted-foreground text-xs">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute top-2.5 left-3 text-muted-foreground/70" size={14} />
                <input
                  className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  required
                  type="text"
                  value={name}
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block font-medium text-muted-foreground text-xs">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute top-2.5 left-3 text-muted-foreground/70" size={14} />
              <input
                className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium text-muted-foreground text-xs">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute top-2.5 left-3 text-muted-foreground/70" size={14} />
              <input
                className="h-9 w-full rounded-lg border border-border bg-background px-9 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                className="absolute top-2.5 right-3 text-muted-foreground/70 hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Registration Information Banner: Free Starter Plan */}
          {mode === "register" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Shield size={13} />
                <span>Paket Starter Gratis (Full Lokal)</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Pendaftaran baru otomatis menikmati brankas koneksi lokal mandiri tanpa batasan waktu. Fitur sinkronisasi cloud dapat diaktifkan kapan saja dengan berlangganan.
              </p>
            </div>
          )}

          <button
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground text-xs shadow-md transition-all hover:bg-primary/90 disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <span>Memproses Autentikasi...</span>
            ) : mode === "login" ? (
              <>
                <KeyRound size={14} />
                <span>Masuk ke Workspace</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>Daftar Akun Gratis (Lokal)</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Accounts Section */}
        <div className="mt-5 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-[11px] text-muted-foreground">
              Akun Uji Coba Cepat
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
              Dev Mode
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <button
              className="flex items-center justify-center rounded-md border border-border bg-card px-2 py-1.5 font-medium text-[10px] text-foreground hover:border-primary hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => handleQuickLogin("business@xphpmyadmin.dev", "Password@123")}
              type="button"
            >
              💼 Business
            </button>
            <button
              className="flex items-center justify-center rounded-md border border-border bg-card px-2 py-1.5 font-medium text-[10px] text-foreground hover:border-primary hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => handleQuickLogin("team@xphpmyadmin.dev", "Password@123")}
              type="button"
            >
              👥 Team
            </button>
            <button
              className="flex items-center justify-center rounded-md border border-border bg-card px-2 py-1.5 font-medium text-[10px] text-foreground hover:border-primary hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => handleQuickLogin("pro@xphpmyadmin.dev", "Password@123")}
              type="button"
            >
              ⚡ Pro
            </button>
            <button
              className="flex items-center justify-center rounded-md border border-border bg-card px-2 py-1.5 font-medium text-[10px] text-foreground hover:border-primary hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => handleQuickLogin("robyfull.dev@gmail.com", "Password@123")}
              type="button"
            >
              👑 Admin
            </button>
          </div>
        </div>

        {/* Footer / Offline Option */}
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          {onBypassLocal && (
            <button
              className="text-[11px] text-muted-foreground underline decoration-dotted transition-colors hover:text-foreground"
              onClick={onBypassLocal}
              type="button"
            >
              Lewati & Lanjut dalam Mode Lokal Mandiri (Offline)
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
            <Globe size={11} />
            <span>Terhubung ke Layanan Backend: </span>
            <span className="font-mono text-primary">er-service.duckdns.org</span>
          </div>
        </div>
      </div>

      {/* OAuth Email/Name Confirmation Modal (Fallback / Development) */}
      {oauthDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              {oauthDialog === "google" ? (
                <SiGoogle size={16} color="#EA4335" />
              ) : (
                <SiGithub size={16} />
              )}
              <span>
                Masuk via {oauthDialog === "google" ? "Google Workspace" : "GitHub OAuth"}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              Konfirmasi akun untuk dihubungkan ke brankas xphpMyAdmin:
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] text-muted-foreground">Email Akun</label>
                <input
                  className="mt-1 h-8 w-full rounded border border-border bg-background px-2.5 text-foreground text-xs focus:border-primary focus:outline-none"
                  onChange={(e) => setOauthEmail(e.target.value)}
                  type="email"
                  value={oauthEmail}
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground">Nama Profil</label>
                <input
                  className="mt-1 h-8 w-full rounded border border-border bg-background px-2.5 text-foreground text-xs focus:border-primary focus:outline-none"
                  onChange={(e) => setOauthName(e.target.value)}
                  type="text"
                  value={oauthName}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs hover:bg-muted"
                onClick={() => setOauthDialog(null)}
                type="button"
              >
                Batal
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs hover:bg-primary/90"
                disabled={isLoading}
                onClick={() => handleOAuthSubmit(oauthDialog)}
                type="button"
              >
                <Check size={13} />
                <span>Konfirmasi & Masuk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
