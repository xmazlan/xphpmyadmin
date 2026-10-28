import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthGate } from "@/components/auth/auth-gate";
import { CloudSyncProvider, useCloudSync } from "@/context/cloud-sync-context";

describe("AuthGate Component & Free Tier (Local Vault) Policy", () => {
  it("renders Google, GitHub, and email/password login options", () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(
      <CloudSyncProvider>
        <AuthGate />
      </CloudSyncProvider>
    );

    // Social logins
    expect(getByText(/Lanjutkan dengan Google/i)).toBeDefined();
    expect(getByText(/Lanjutkan dengan GitHub/i)).toBeDefined();

    // Credentials login
    expect(getByPlaceholderText(/nama@email.com/i)).toBeDefined();
    expect(getByPlaceholderText(/••••••••/i)).toBeDefined();
    expect(getAllByText(/Masuk ke Workspace/i).length).toBeGreaterThanOrEqual(1);

    // Quick test accounts
    expect(getByText(/Akun Uji Coba Cepat/i)).toBeDefined();
    expect(getByText(/💼 Business/i)).toBeDefined();
    expect(getByText(/👥 Team/i)).toBeDefined();
    expect(getByText(/⚡ Pro/i)).toBeDefined();
    expect(getByText(/👑 Admin/i)).toBeDefined();
  });

  it("switches to registration mode without plan selection, giving Starter Full Local by default", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <CloudSyncProvider>
        <AuthGate />
      </CloudSyncProvider>
    );

    const registerTab = getByText(/Daftar Akun Gratis/i);
    fireEvent.click(registerTab);

    // Name input appears
    expect(getByPlaceholderText(/Nama lengkap Anda/i)).toBeDefined();

    // Crucial: User does NOT choose a plan when registering!
    expect(queryByText(/Pilih Paket/i)).toBeNull();

    // Informs user of Starter plan (full local)
    expect(getByText(/Paket Starter Gratis \(Full Lokal\)/i)).toBeDefined();
    expect(getByText(/Daftar Akun Gratis \(Lokal\)/i)).toBeDefined();
  });

  it("triggers offline local bypass when clicked", () => {
    const onBypass = vi.fn();
    const { getByText } = render(
      <CloudSyncProvider>
        <AuthGate onBypassLocal={onBypass} />
      </CloudSyncProvider>
    );

    const bypassBtn = getByText(/Lewati & Lanjut dalam Mode Lokal Mandiri/i);
    fireEvent.click(bypassBtn);
    expect(onBypass).toHaveBeenCalledTimes(1);
  });

  it("opens OAuth confirmation dialog when clicking Google login in non-Electron environment", () => {
    const { getByText } = render(
      <CloudSyncProvider>
        <AuthGate />
      </CloudSyncProvider>
    );

    const googleBtn = getByText(/Lanjutkan dengan Google/i);
    fireEvent.click(googleBtn);

    expect(getByText(/Masuk via Google Workspace/i)).toBeDefined();
    expect(getByText(/Konfirmasi & Masuk/i)).toBeDefined();
  });

  it("opens OAuth confirmation dialog when clicking GitHub login in non-Electron environment", () => {
    const { getByText } = render(
      <CloudSyncProvider>
        <AuthGate />
      </CloudSyncProvider>
    );

    const githubBtn = getByText(/Lanjutkan dengan GitHub/i);
    fireEvent.click(githubBtn);

    expect(getByText(/Masuk via GitHub OAuth/i)).toBeDefined();
    expect(getByText(/Konfirmasi & Masuk/i)).toBeDefined();
  });

  it("redirects to external browser when electronOAuth is available and handles auto-reopen callback", async () => {
    let capturedCallback: ((data: any) => void) | null = null;
    const startOAuthMock = vi.fn().mockResolvedValue({ success: true, port: 42100 });
    const onOAuthCallbackMock = vi.fn().mockImplementation((cb) => {
      capturedCallback = cb;
      return () => {
        capturedCallback = null;
      };
    });

    window.electronOAuth = {
      onOAuthCallback: onOAuthCallbackMock,
      startOAuth: startOAuthMock,
    };

    const { getByText, findByText } = render(
      <CloudSyncProvider>
        <AuthGate />
      </CloudSyncProvider>
    );

    // Click Google OAuth
    const googleBtn = getByText(/Lanjutkan dengan Google/i);
    fireEvent.click(googleBtn);

    expect(startOAuthMock).toHaveBeenCalledWith("google");
    expect(await findByText(/Menunggu Autentikasi di Peramban Web\.\.\./i)).toBeDefined();
    expect(getByText(/Buka Peramban Lagi/i)).toBeDefined();
    expect(getByText(/Batalkan/i)).toBeDefined();

    // Simulate callback redirect from browser into desktop app
    expect(capturedCallback).toBeTypeOf("function");
    act(() => {
      capturedCallback!({
        provider: "google",
        token: "jwt_token_google_123",
        user: {
          id: "usr_google_999",
          email: "google_user@gmail.com",
          name: "Google Dev User",
          plan: "business",
          billingCycle: "annual",
          maxVaults: 50,
        },
      });
    });

    // Check successful authentication toast/message
    expect(await findByText(/Berhasil masuk via Google!/i)).toBeDefined();

    // Clean up mock
    delete (window as any).electronOAuth;
  });
});
