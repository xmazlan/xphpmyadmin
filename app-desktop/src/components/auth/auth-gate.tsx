import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  User,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { AppLogo } from "@/components/app-logo";
import LangToggle from "@/components/lang-toggle";
import ToggleTheme from "@/components/toggle-theme";
import { useCloudSync } from "@/context/cloud-sync-context";
import { cn } from "@/utils/tailwind";

interface AuthGateProps {
  onBypassLocal?: () => void;
}

export function AuthGate({ onBypassLocal }: AuthGateProps) {
  const { t } = useTranslation();
  const { login, oauthLogin, register, setSessionFromOAuth } = useCloudSync();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Social / OAuth dialog state (fallback / testing)
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
        const provName = data.provider === "github" ? "GitHub" : "Google";
        setSuccessMsg(
          data.provider === "github"
            ? t("auth.oauthSuccess", "Successfully signed in via GitHub! Redirecting...", { provider: "GitHub" })
            : t("auth.oauthSuccess", "Successfully signed in via Google! Redirecting...", { provider: "Google" })
        );
      });
      return unsubscribe;
    }
  }, [setSessionFromOAuth, t]);

  const handleOAuthClick = async (provider: "google" | "github") => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (typeof window !== "undefined" && window.electronOAuth?.startOAuth) {
      setIsWaitingBrowserAuth(true);
      setBrowserAuthProvider(provider);
      try {
        const res = await window.electronOAuth.startOAuth(provider);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to open external browser");
          setIsWaitingBrowserAuth(false);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to open external browser");
        setIsWaitingBrowserAuth(false);
      }
    } else {
      // Fallback for tests & environments without Electron main IPC
      setOauthEmail(
        provider === "google"
          ? "robyfull.dev@gmail.com"
          : "robyajo@users.noreply.github.com"
      );
      setOauthName(
        provider === "google" ? "Roby Developer" : "Roby Ajo GitHub"
      );
      setOauthDialog(provider);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        const res = await login(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || "Sign in failed. Please check your email and password.");
        } else {
          setSuccessMsg(t("auth.welcomeBack", "Successfully signed in! Redirecting to workspace..."));
        }
      } else {
        if (!name.trim()) {
          setErrorMsg("Full name is required for registration");
          setIsLoading(false);
          return;
        }
        // User starts with free tier (local vault only)
        const res = await register(name.trim(), email.trim(), password, "free", "annual");
        if (!res.success) {
          setErrorMsg(res.error || "Registration failed. Please try again.");
        } else {
          setSuccessMsg(t("auth.welcomeBack", "Registration successful! Redirecting to local workspace..."));
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An authentication error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSubmit = async (provider: "google" | "github") => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const targetEmail =
      oauthEmail.trim() ||
      (provider === "google"
        ? "robyfull.dev@gmail.com"
        : "robyajo@users.noreply.github.com");
    const targetName =
      oauthName.trim() ||
      (provider === "google" ? "Roby Developer" : "Roby Ajo GitHub");

    setIsLoading(true);
    try {
      const res = await oauthLogin(provider, targetEmail, targetName);
      if (res.success) {
        setSuccessMsg(
          provider === "google"
            ? "Successfully signed in via Google Workspace!"
            : "Successfully signed in via GitHub OAuth!"
        );
        setOauthDialog(null);
      } else {
        setErrorMsg(res.error || `Failed to authenticate via ${provider.toUpperCase()}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to connect to ${provider}`);
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
        setErrorMsg(res.error || "Demo account authentication failed");
      } else {
        setSuccessMsg("Demo account authentication successful!");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-card/50 to-background p-3 sm:p-4 select-none">
      {/* Top Right Controls: Language Switcher & Theme Toggle */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
        <LangToggle />
        <ToggleTheme />
      </div>

      {/* Background ambient decorative glow */}
      <div className="-top-24 -left-24 pointer-events-none absolute size-72 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="-bottom-24 -right-24 pointer-events-none absolute size-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Main Single Center Card: Compact, Clean & Non-scrollable */}
      <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <AppLogo size="sm" />
          <h1 className="mt-2 font-bold text-base sm:text-lg tracking-tight text-foreground">
            {mode === "login"
              ? t("auth.loginTitle", "Sign in to Workspace")
              : t("auth.registerTitle", "Create Free Account")}
          </h1>
          <p className="mt-0.5 text-muted-foreground text-[11px] leading-tight">
            {mode === "login"
              ? t("auth.loginSubtitle", "Access local database vault & cloud sync")
              : t("auth.registerSubtitle", "Create a free account to manage local & cloud databases")}
          </p>
        </div>

        {/* Mode Selector Tabs (Login vs Register) */}
        <div className="my-2.5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          <button
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1 font-medium transition-all cursor-pointer text-xs",
              mode === "login"
                ? "border border-border bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            type="button"
          >
            <KeyRound size={12} />
            <span>{t("auth.tabLogin", "Sign In")}</span>
          </button>
          <button
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1 font-medium transition-all cursor-pointer text-xs",
              mode === "register"
                ? "border border-border bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            type="button"
          >
            <Zap size={12} />
            <span>{t("auth.tabRegister", "Create Free Account")}</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-destructive text-[11px] leading-tight">
            <span className="font-bold text-xs shrink-0">✕</span>
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-400 text-[11px] leading-tight">
            <CheckCircle2 size={13} className="shrink-0" />
            <span className="truncate">{successMsg}</span>
          </div>
        )}

        {/* External Browser OAuth Waiting Notification */}
        {isWaitingBrowserAuth && (
          <div className="mb-2.5 rounded-lg border border-teal-500/30 bg-teal-500/10 p-2 text-center">
            <div className="font-semibold text-foreground text-[11px] flex items-center justify-center gap-1.5">
              <RefreshCw size={11} className="animate-spin text-teal-400" />
              <span>{t("auth.waitingBrowser", "Waiting for Browser Authentication...")}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <button
                className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 font-medium text-[10px] text-foreground hover:bg-muted cursor-pointer"
                onClick={() => handleOAuthClick(browserAuthProvider)}
                type="button"
              >
                <ExternalLink size={10} />
                <span>{t("auth.reopenBrowser", "Open Browser Again")}</span>
              </button>
              <button
                className="rounded border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-medium text-[10px] text-destructive hover:bg-destructive/20 cursor-pointer"
                onClick={() => setIsWaitingBrowserAuth(false)}
                type="button"
              >
                {t("auth.cancel", "Cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Social / OAuth Buttons (Google & GitHub) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background/80 font-medium text-foreground text-[11px] shadow-xs transition-all hover:border-teal-500/40 hover:bg-muted cursor-pointer disabled:opacity-60"
            disabled={isLoading || isWaitingBrowserAuth}
            onClick={() => handleOAuthClick("google")}
            type="button"
          >
            <SiGoogle size={13} color="#EA4335" />
            <span className="truncate">{t("auth.googleLogin", "Continue with Google")}</span>
          </button>

          <button
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background/80 font-medium text-foreground text-[11px] shadow-xs transition-all hover:border-teal-500/40 hover:bg-muted cursor-pointer disabled:opacity-60"
            disabled={isLoading || isWaitingBrowserAuth}
            onClick={() => handleOAuthClick("github")}
            type="button"
          >
            <SiGithub size={13} />
            <span className="truncate">{t("auth.githubLogin", "Continue with GitHub")}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-2.5 flex items-center justify-center">
          <div className="w-full border-border border-t" />
          <span className="absolute bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            {t("auth.orEmail", "or email credentials")}
          </span>
        </div>

        {/* Credentials Form */}
        <form className="space-y-2" onSubmit={handleCredentialsSubmit}>
          {mode === "register" && (
            <div className="relative">
              <User
                className="absolute top-2 left-2.5 text-muted-foreground/70"
                size={13}
              />
              <input
                className="h-8 w-full rounded-lg border border-border bg-background pr-2.5 pl-8 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.fullNamePlaceholder", "Your full name")}
                required
                type="text"
                value={name}
              />
            </div>
          )}

          <div className="relative">
            <Mail
              className="absolute top-2 left-2.5 text-muted-foreground/70"
              size={13}
            />
            <input
              className="h-8 w-full rounded-lg border border-border bg-background pr-2.5 pl-8 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder", "name@email.com")}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="relative">
            <Lock
              className="absolute top-2 left-2.5 text-muted-foreground/70"
              size={13}
            />
            <input
              className="h-8 w-full rounded-lg border border-border bg-background pr-8 pl-8 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder", "••••••••")}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              className="absolute top-2 right-2.5 text-muted-foreground/70 hover:text-foreground cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {/* Registration Information Banner: Free Starter Plan */}
          {mode === "register" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-teal-500/25 bg-teal-500/5 px-2.5 py-1 text-[11px] text-teal-400">
              <Shield size={12} className="shrink-0" />
              <span className="font-semibold">{t("auth.starterPlanBadge", "Free Starter Plan (Full Local)")}</span>
            </div>
          )}

          <button
            className="flex h-8.5 w-full items-center justify-center gap-1.5 rounded-lg bg-teal-500 font-semibold text-slate-950 text-xs shadow-md shadow-teal-500/20 transition-all hover:bg-teal-400 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <span>{t("auth.authProcessing", "Authenticating...")}</span>
            ) : mode === "login" ? (
              <>
                <KeyRound size={13} />
                <span>{t("auth.loginButton", "Sign in to Workspace")}</span>
              </>
            ) : (
              <>
                <Zap size={13} />
                <span>{t("auth.registerButton", "Create Free Account (Local)")}</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Utilities: Quick Test Accounts & Offline Bypass */}
        <div className="mt-2.5 pt-2 border-t border-border/50 space-y-2">
          {/* Quick Testing Accounts Section */}
          <div className="rounded-lg border border-border/70 bg-muted/20 px-2 py-1.5">
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-muted-foreground">
                {t("auth.devAccountsTitle", "Quick Demo Accounts")}
              </span>
              <span className="rounded bg-teal-500/10 px-1 py-0.2 font-mono text-[9px] text-teal-400 font-semibold">
                Dev
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <button
                className="flex items-center justify-center rounded border border-border/80 bg-card py-0.5 font-medium text-[10px] text-foreground hover:border-teal-500 hover:bg-teal-500/5 transition-colors cursor-pointer text-center"
                disabled={isLoading}
                onClick={() =>
                  handleQuickLogin("business@xphpmyadmin.dev", "Password@123")
                }
                type="button"
              >
                💼 Business
              </button>
              <button
                className="flex items-center justify-center rounded border border-border/80 bg-card py-0.5 font-medium text-[10px] text-foreground hover:border-teal-500 hover:bg-teal-500/5 transition-colors cursor-pointer text-center"
                disabled={isLoading}
                onClick={() =>
                  handleQuickLogin("team@xphpmyadmin.dev", "Password@123")
                }
                type="button"
              >
                👥 Team
              </button>
              <button
                className="flex items-center justify-center rounded border border-border/80 bg-card py-0.5 font-medium text-[10px] text-foreground hover:border-teal-500 hover:bg-teal-500/5 transition-colors cursor-pointer text-center"
                disabled={isLoading}
                onClick={() =>
                  handleQuickLogin("pro@xphpmyadmin.dev", "Password@123")
                }
                type="button"
              >
                ⚡ Pro
              </button>
              <button
                className="flex items-center justify-center rounded border border-border/80 bg-card py-0.5 font-medium text-[10px] text-foreground hover:border-teal-500 hover:bg-teal-500/5 transition-colors cursor-pointer text-center"
                disabled={isLoading}
                onClick={() =>
                  handleQuickLogin("robyfull.dev@gmail.com", "Password@123")
                }
                type="button"
              >
                👑 Admin
              </button>
            </div>
          </div>

          {/* Offline Bypass Option */}
          <div className="flex flex-col items-center gap-0.5 text-center">
            {onBypassLocal && (
              <button
                className="text-[10.5px] text-muted-foreground/90 underline decoration-dotted underline-offset-2 transition-colors hover:text-teal-400 cursor-pointer"
                onClick={onBypassLocal}
                type="button"
              >
                {t("auth.bypassOffline", "Skip & Continue in Local Offline Mode")}
              </button>
            )}
            <div className="flex items-center gap-1 text-[9.5px] text-muted-foreground/60">
              <Globe size={9} />
              <span>{t("auth.backendLabel", "Product:")} </span>
              <span className="font-semibold text-teal-400">ER Suite Cloud Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* OAuth Email/Name Confirmation Modal (Fallback / Development) */}
      {oauthDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-teal-500/30 bg-card p-4 shadow-2xl">
            <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
              {oauthDialog === "google" ? (
                <SiGoogle size={15} color="#EA4335" />
              ) : (
                <SiGithub size={15} />
              )}
              <span>
                {oauthDialog === "google"
                  ? t("auth.oauthModalTitle", "Sign in via Google Workspace", { provider: "Google Workspace" })
                  : t("auth.oauthModalTitle", "Sign in via GitHub OAuth", { provider: "GitHub OAuth" })}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground text-[11px] leading-tight">
              {t("auth.oauthModalSubtitle", "Confirm account to connect to xphpMyAdmin vault:")}
            </p>

            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-[10.5px] font-medium text-muted-foreground">
                  {t("auth.oauthEmail", "Account Email")}
                </label>
                <input
                  className="mt-0.5 h-8 w-full rounded-lg border border-border bg-background px-2.5 text-foreground text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  onChange={(e) => setOauthEmail(e.target.value)}
                  type="email"
                  value={oauthEmail}
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-medium text-muted-foreground">
                  {t("auth.oauthName", "Profile Name")}
                </label>
                <input
                  className="mt-0.5 h-8 w-full rounded-lg border border-border bg-background px-2.5 text-foreground text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  onChange={(e) => setOauthName(e.target.value)}
                  type="text"
                  value={oauthName}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border border-border px-3 py-1 text-muted-foreground text-xs hover:bg-muted cursor-pointer"
                onClick={() => setOauthDialog(null)}
                type="button"
              >
                {t("auth.cancel", "Cancel")}
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1 font-semibold text-slate-950 text-xs hover:bg-teal-400 cursor-pointer shadow-sm"
                disabled={isLoading}
                onClick={() => handleOAuthSubmit(oauthDialog)}
                type="button"
              >
                <Check size={12} />
                <span>{t("auth.confirmAndLogin", "Confirm & Sign In")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
