import { z } from "zod";
import { profileSchema } from "./connection";

export const userActionTypeSchema = z.enum([
  "database_create",
  "database_drop",
  "database_rename",
  "database_copy",
  "database_collation",
  "table_create",
  "table_drop",
  "table_truncate",
  "table_rename",
  "table_copy",
  "table_maintenance",
  "export",
  "import",
  "routine_create",
  "routine_drop",
  "routine_call",
  "trigger_create",
  "trigger_drop",
  "row_insert",
  "row_update",
  "row_delete",
  "query_execute",
  "profile_create",
  "profile_update",
  "profile_delete",
  "settings_update",
]);
export type UserActionType = z.infer<typeof userActionTypeSchema>;

export const userActionCategorySchema = z.enum([
  "database",
  "table",
  "routine",
  "data",
  "export_import",
  "connection",
  "settings",
]);
export type UserActionCategory = z.infer<typeof userActionCategorySchema>;

export const syncStatusSchema = z.enum(["pending", "synced", "failed"]);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export const userActionEntrySchema = z.object({
  action: userActionTypeSchema,
  category: userActionCategorySchema,
  database: z.string().optional(),
  details: z.record(z.string(), z.any()).default({}),
  id: z.string(),
  profileId: z.string().optional(),
  profileName: z.string().optional(),
  syncStatus: syncStatusSchema.default("pending"),
  table: z.string().optional(),
  timestamp: z.string(),
});
export type UserActionEntry = z.infer<typeof userActionEntrySchema>;

export const queryHistoryEntrySchema = z.object({
  database: z.string().optional(),
  durationMs: z.number().default(0),
  errorMessage: z.string().optional(),
  id: z.string(),
  profileId: z.string(),
  profileName: z.string().optional(),
  query: z.string(),
  rowsAffected: z.number().optional(),
  success: z.boolean().default(true),
  timestamp: z.string(),
});
export type QueryHistoryEntry = z.infer<typeof queryHistoryEntrySchema>;

export const savedSnippetSchema = z.object({
  createdAt: z.string(),
  database: z.string().optional(),
  id: z.string(),
  query: z.string(),
  tags: z.array(z.string()).default([]),
  title: z.string(),
  updatedAt: z.string(),
});
export type SavedSnippet = z.infer<typeof savedSnippetSchema>;

export const subscriptionTierSchema = z.enum(["free", "pro", "team", "business"]);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

export const billingCycleSchema = z.enum(["monthly", "annual"]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export interface PlanPricingInfo {
  annualMonthlyRate: number;
  description: string;
  features: string[];
  id: SubscriptionTier;
  maxVaults: number;
  monthlyRate: number;
  name: string;
  perSeat?: boolean;
  tagline: string;
}

export const SUBSCRIPTION_PLANS: Record<"pro" | "team" | "business", PlanPricingInfo> = {
  pro: {
    annualMonthlyRate: 10,
    description: "Untuk profesional yang membutuhkan sinkronisasi cepat dan catatan log sesi mandiri.",
    features: [
      "Personal cloud vault",
      "Sync across mobile and desktop",
      "Session logs",
      "Snippets automation",
    ],
    id: "pro",
    maxVaults: 10,
    monthlyRate: 15,
    name: "Pro",
    tagline: "Includes:",
  },
  team: {
    annualMonthlyRate: 20,
    description: "Untuk tim engineering yang berbagi konfigurasi koneksi dan riwayat audit kueri.",
    features: [
      "Shared team vault (up to 5 seats)",
      "Role-based connection sharing",
      "Centralized query audit log",
      "Real-time database sync",
    ],
    id: "team",
    maxVaults: 20,
    monthlyRate: 30,
    name: "Team",
    perSeat: true,
    tagline: "Everything in Pro, plus:",
  },
  business: {
    annualMonthlyRate: 30,
    description: "Untuk organisasi skala besar dengan kebutuhan audit kepatuhan dan vault tak terbatas.",
    features: [
      "Unlimited connection profiles",
      "Advanced audit compliance export",
      "Granular access control for vaults",
      "SAML SSO (Enterprise Add-on)",
    ],
    id: "business",
    maxVaults: 50,
    monthlyRate: 45,
    name: "Business",
    perSeat: true,
    tagline: "Everything in Team, plus:",
  },
};

export const cloudSyncMetadataSchema = z.object({
  billingCycle: billingCycleSchema.default("annual"),
  checksum: z.string().optional(),
  clientId: z.string(),
  deviceName: z.string(),
  generatedAt: z.string(),
  maxVaults: z.number().default(10),
  platform: z.string(),
  revision: z.number().int().default(1),
  subscriptionTier: subscriptionTierSchema.default("free"),
  totalActions: z.number().default(0),
  totalProfiles: z.number().default(0),
  totalQueries: z.number().default(0),
  userEmail: z.string().optional(),
  userId: z.string().optional(),
  version: z.string().default("1.0.0"),
});
export type CloudSyncMetadata = z.infer<typeof cloudSyncMetadataSchema>;

export const cloudSyncPreferencesSchema = z.object({
  autoSyncEnabled: z.boolean().default(false),
  defaultCollation: z.string().default("utf8mb4_general_ci"),
  language: z.string().default("id"),
  recordQueries: z.boolean().default(true),
  syncIntervalMinutes: z.number().default(5),
  theme: z.enum(["dark", "light", "system"]).default("dark"),
});
export type CloudSyncPreferences = z.infer<typeof cloudSyncPreferencesSchema>;

export const cloudSyncConfigSchema = z.object({
  apiEndpoint: z.string().default("https://www.er-service.duckdns.org/api/sync"),
  apiToken: z.string().optional(),
  authEndpoint: z.string().default("https://www.er-service.duckdns.org/api/auth"),
  autoSync: z.boolean().default(false),
  billingCycle: billingCycleSchema.default("annual"),
  lastErrorMessage: z.string().optional(),
  lastSyncAt: z.string().optional(),
  maxVaults: z.number().default(10),
  planExpiresAt: z.number().optional(),
  status: z.enum(["idle", "syncing", "success", "error"]).default("idle"),
  subscriptionTier: subscriptionTierSchema.default("free"),
  userEmail: z.string().optional(),
  userId: z.string().optional(),
  userAvatar: z.string().optional(),
  userName: z.string().optional(),
  userProvider: z.enum(["google", "github", "credentials"]).optional(),
});
export type CloudSyncConfig = z.infer<typeof cloudSyncConfigSchema>;

export const cloudSyncSnapshotSchema = z.object({
  journal: z.array(userActionEntrySchema).default([]),
  metadata: cloudSyncMetadataSchema,
  preferences: cloudSyncPreferencesSchema,
  profiles: z.array(profileSchema).default([]),
  queryHistory: z.array(queryHistoryEntrySchema).default([]),
  snippets: z.array(savedSnippetSchema).default([]),
});
export type CloudSyncSnapshot = z.infer<typeof cloudSyncSnapshotSchema>;

// Contract payload for er-backend /api/sync/push, /pull, /merge
export interface ErBackendPushPayload {
  data: CloudSyncSnapshot;
  device: string;
  syncKey: string;
  timestamp: number;
}

export interface ErBackendPullResponse {
  data: CloudSyncSnapshot;
  lastDevice?: string;
  success: boolean;
  updatedAt?: number;
}
