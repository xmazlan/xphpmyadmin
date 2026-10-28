import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCloudSyncSnapshot,
  clearJournal,
  exportCloudBackupJson,
  getCloudSyncConfig,
  getStoredJournal,
  getStoredQueryHistory,
  getStoredSnippets,
  importCloudBackupJson,
  loginToCloudBackend,
  mergeWithCloudBackend,
  pullFromCloudBackend,
  recordQueryHistory,
  recordUserAction,
  saveSnippet,
  syncWithCloudBackend,
  updateCloudSyncConfig,
  upgradeSubscriptionPlan,
} from "@/services/cloud-sync";
import {
  cloudSyncSnapshotSchema,
  SUBSCRIPTION_PLANS,
  userActionEntrySchema,
} from "@/types/cloud-sync";
import type { Profile } from "@/types/connection";

const MOCK_PROFILES: Profile[] = [   {     connection_revision: 1,     created_at: "2026-10-24T00:00:00.000Z",     database: "test_db",     db_type: "mysql",     environment: "Local",     favorite: true,     has_saved_password: true,     host: "127.0.0.1",     id: "a1c3d4e5-3333-4444-8888-3456789abcde",     last_used_at: null,     method: "direct",     name: "Localhost MySQL",     port: 3306,     ssh: null,     tls: { ca: null, cert: null, enabled: true, key: null, verify: true },     updated_at: "2026-10-29T00:00:00.000Z",     username: "root",   }, ];

describe("Cloud Sync & State Journaling (er-backend)", () => {
  beforeEach(() => {
    clearJournal();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should record user actions in audit journal with pending sync status", () => {
    const entry = recordUserAction({
      action: "database_create",
      category: "database",
      database: "store_db",
      details: { collation: "utf8mb4_general_ci" },
      profileId: MOCK_PROFILES[0].id,
      profileName: MOCK_PROFILES[0].name,
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe("database_create");
    expect(entry.category).toBe("database");
    expect(entry.syncStatus).toBe("pending");

    const validated = userActionEntrySchema.safeParse(entry);
    expect(validated.success).toBe(true);

    const journal = getStoredJournal();
    expect(journal.length).toBeGreaterThanOrEqual(1);
    expect(journal[0].action).toBe("database_create");
  });

  it("should record query execution history", () => {
    const qEntry = recordQueryHistory({
      database: "store_db",
      durationMs: 14,
      profileId: MOCK_PROFILES[0].id,
      profileName: MOCK_PROFILES[0].name,
      query: "SELECT * FROM orders LIMIT 10;",
      rowsAffected: 10,
      success: true,
    });

    expect(qEntry.id).toBeDefined();
    expect(qEntry.durationMs).toBe(14);
    expect(qEntry.query).toContain("SELECT * FROM orders");

    const history = getStoredQueryHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].query).toBe("SELECT * FROM orders LIMIT 10;");
  });

  it("should save and retrieve snippets", () => {
    const snippet = saveSnippet({
      database: "store_db",
      query: "SELECT COUNT(*) FROM users;",
      tags: ["metrics", "reporting"],
      title: "Hitung Jumlah Pengguna",
    });

    expect(snippet.id).toBeDefined();
    expect(snippet.title).toBe("Hitung Jumlah Pengguna");

    const snippets = getStoredSnippets();
    expect(snippets.some((s) => s.id === snippet.id)).toBe(true);
  });

  it("should generate a complete, valid CloudSyncSnapshot JSON with business tier & billing cycle", () => {
    updateCloudSyncConfig({
      billingCycle: "annual",
      maxVaults: 50,
      subscriptionTier: "business",
      userEmail: "business@xphpmyadmin.dev",
      userId: "usr_tester_business",
    });

    recordUserAction({
      action: "table_maintenance",
      category: "table",
      database: "store_db",
      details: { subAction: "OPTIMIZE" },
      table: "users",
    });

    const snapshot = buildCloudSyncSnapshot(MOCK_PROFILES, {
      theme: "dark",
    });

    expect(snapshot.metadata.version).toBe("1.0.0");
    expect(snapshot.metadata.totalProfiles).toBe(1);
    expect(snapshot.metadata.subscriptionTier).toBe("business");
    expect(snapshot.metadata.billingCycle).toBe("annual");
    expect(snapshot.metadata.maxVaults).toBe(50);
    expect(snapshot.profiles).toHaveLength(1);
    expect(snapshot.journal.length).toBeGreaterThanOrEqual(1);

    const validation = cloudSyncSnapshotSchema.safeParse(snapshot);
    expect(validation.success).toBe(true);

    const exportedString = exportCloudBackupJson(MOCK_PROFILES);
    expect(typeof exportedString).toBe("string");
    expect(exportedString).toContain('"subscriptionTier": "business"');
    expect(exportedString).toContain('"billingCycle": "annual"');
  });

  it("should validate subscription plans rates and features according to design", () => {
    expect(SUBSCRIPTION_PLANS.pro.annualMonthlyRate).toBe(10);
    expect(SUBSCRIPTION_PLANS.pro.monthlyRate).toBe(15);
    expect(SUBSCRIPTION_PLANS.pro.maxVaults).toBe(10);

    expect(SUBSCRIPTION_PLANS.team.annualMonthlyRate).toBe(20);
    expect(SUBSCRIPTION_PLANS.team.monthlyRate).toBe(30);
    expect(SUBSCRIPTION_PLANS.team.maxVaults).toBe(20);

    expect(SUBSCRIPTION_PLANS.business.annualMonthlyRate).toBe(30);
    expect(SUBSCRIPTION_PLANS.business.monthlyRate).toBe(45);
    expect(SUBSCRIPTION_PLANS.business.maxVaults).toBe(50);
  });

  it("should validate and restore data from a valid cloud backup JSON string", () => {
    const validJson = exportCloudBackupJson(MOCK_PROFILES);
    const result = importCloudBackupJson(validJson);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.profiles).toHaveLength(1);
    expect(result.data?.profiles[0].name).toBe("Localhost MySQL");
  });

  it("should reject invalid JSON strings with descriptive errors", () => {
    const invalidJson = JSON.stringify({
      invalid_key: "corrupt_data",
      metadata: "not_an_object",
    });

    const result = importCloudBackupJson(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should upgrade subscription tier and billing cycle", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/plan")) {
        return Promise.resolve({
          json: async () => ({
            message: "Plan updated to business (annual)",
            success: true,
            user: {
              billingCycle: "annual",
              id: "usr_tester_business",
              maxVaults: 50,
              plan: "business",
            },
          }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({ success: true }),
        ok: true,
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    updateCloudSyncConfig({
      apiToken: "mock_jwt_token",
      authEndpoint: "http://127.0.0.1:4000/api/auth",
      subscriptionTier: "pro",
    });

    const upgradeRes = await upgradeSubscriptionPlan("business", "annual");
    expect(upgradeRes.success).toBe(true);

    const cfg = getCloudSyncConfig();
    expect(cfg.subscriptionTier).toBe("business");
    expect(cfg.billingCycle).toBe("annual");
    expect(cfg.maxVaults).toBe(50);
  });

  it("should push, pull, and merge with er-backend API contract", async () => {
    const mockSnapshot = buildCloudSyncSnapshot(MOCK_PROFILES);
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/push")) {
        return Promise.resolve({
          json: async () => ({
            message: "Data successfully synced and saved to Neon cloud database!",
            success: true,
            updatedAt: Date.now(),
          }),
          ok: true,
        });
      }
      if (url.includes("/pull")) {
        return Promise.resolve({
          json: async () => ({
            data: mockSnapshot,
            lastDevice: "Linux Desktop",
            success: true,
            updatedAt: Date.now(),
          }),
          ok: true,
        });
      }
      if (url.includes("/merge")) {
        return Promise.resolve({
          json: async () => ({
            data: mockSnapshot,
            message: "Cloud smart merge completed on Neon!",
            success: true,
            updatedAt: Date.now(),
          }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({ success: true }),
        ok: true,
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    updateCloudSyncConfig({
      apiEndpoint: "http://127.0.0.1:4000/api/sync",
      apiToken: "vitest_test_sync_key",
      subscriptionTier: "business",
    });

    recordUserAction({
      action: "export",
      category: "export_import",
      database: "test_db",
      details: { format: "sql", rowCount: 150 },
    });

    // 1. PUSH to er-backend
    const pushRes = await syncWithCloudBackend(MOCK_PROFILES, "vitest_test_sync_key");
    expect(pushRes.success).toBe(true);
    expect(pushRes.syncedItems).toBeGreaterThan(0);

    const journal = getStoredJournal();
    expect(journal[0].syncStatus).toBe("synced");

    // 2. PULL from er-backend
    const pullRes = await pullFromCloudBackend("vitest_test_sync_key");
    expect(pullRes.success).toBe(true);
    expect(pullRes.data).toBeDefined();

    // 3. MERGE with er-backend
    const mergeRes = await mergeWithCloudBackend(MOCK_PROFILES, "vitest_test_sync_key");
    expect(mergeRes.success).toBe(true);
    expect(mergeRes.success).toBe(true);
  });

  it("should restrict cloud sync for free tier users (local vault only) and require subscription", async () => {
    updateCloudSyncConfig({
      subscriptionTier: "free",
      maxVaults: 1,
    });

    const pushRes = await syncWithCloudBackend(MOCK_PROFILES);
    expect(pushRes.success).toBe(false);
    expect(pushRes.error).toContain("Paket gratis hanya memiliki brankas lokal");

    const pullRes = await pullFromCloudBackend();
    expect(pullRes.success).toBe(false);
    expect(pullRes.error).toContain("Paket gratis hanya memiliki brankas lokal");

    const mergeRes = await mergeWithCloudBackend(MOCK_PROFILES);
    expect(mergeRes.success).toBe(false);
    expect(mergeRes.error).toContain("Paket gratis hanya memiliki brankas lokal");
  });

});
