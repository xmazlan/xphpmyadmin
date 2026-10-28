import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthGate } from "@/components/auth/auth-gate";
import { CloudSyncProvider } from "@/context/cloud-sync-context";

describe("AuthGate Component & Authentication Interception", () => {
  it("renders Google, GitHub, and email/password login options", () => {
    const { getByText, getByPlaceholderText } = render(
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
    expect(getByText(/Masuk ke Cloud & Workspace/i)).toBeDefined();

    // Quick test accounts
    expect(getByText(/Akun Uji Coba Cepat/i)).toBeDefined();
    expect(getByText(/💼 Business/i)).toBeDefined();
    expect(getByText(/👥 Team/i)).toBeDefined();
    expect(getByText(/⚡ Pro/i)).toBeDefined();
    expect(getByText(/👑 Admin/i)).toBeDefined();
  });

  it("switches to registration mode with plan selection", () => {
    const { getByText, getByPlaceholderText } = render(
      <CloudSyncProvider>
        <AuthGate />
      </CloudSyncProvider>
    );

    const registerTab = getByText(/Daftar Akun/i);
    fireEvent.click(registerTab);

    // Name input appears
    expect(getByPlaceholderText(/Nama lengkap Anda/i)).toBeDefined();
    expect(getByText(/Pilih Paket/i)).toBeDefined();
    expect(getByText(/Tahunan \(-33%\)/i)).toBeDefined();
    expect(getByText(/Daftar & Aktifkan Paket/i)).toBeDefined();
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

  it("opens OAuth confirmation dialog when clicking Google login", () => {
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

  it("opens OAuth confirmation dialog when clicking GitHub login", () => {
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
});
