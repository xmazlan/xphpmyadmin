import { z } from "zod";

export const tlsConfigSchema = z.object({
  ca: z.string().nullable().optional(),
  cert: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  key: z.string().nullable().optional(),
  verify: z.literal(true).default(true),
});
export type TLSConfig = z.infer<typeof tlsConfigSchema>;

export const sshConfigSchema = z.object({
  auth_type: z.enum(["password", "key"]).default("password").optional(),
  host: z.string().min(1).max(253),
  key: z.string().max(4096).nullable().optional(),
  password: z.string().max(65_536).nullable().optional(),
  port: z.number().int().min(1).max(65_535).default(22),
  username: z.string().min(1).max(128).default("root"),
});
export type SSHConfig = z.infer<typeof sshConfigSchema>;

export const profileSchema = z.object({
  connection_revision: z.number().int().min(1).default(1),
  created_at: z.string(),
  database: z.string().max(64).nullable().optional(),
  environment: z
    .enum(["Local", "Staging", "Production", "Other"])
    .default("Other"),
  favorite: z.boolean().default(false),
  has_saved_password: z.boolean().default(false),
  host: z.string().min(1).max(253),
  id: z.string().uuid(),
  last_used_at: z.string().nullable().optional(),
  method: z.enum(["direct", "ssh"]).default("direct"),
  name: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65_535).default(3306),
  ssh: sshConfigSchema.nullable().optional(),
  tls: tlsConfigSchema.default({ enabled: true, verify: true }),
  updated_at: z.string(),
  username: z.string().min(1).max(128),
});
export type Profile = z.infer<typeof profileSchema>;

export const passwordActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("keep") }),
  z.object({ action: z.literal("replace"), password: z.string().max(65_536) }),
  z.object({ action: z.literal("remove") }),
]);
export type PasswordAction = z.infer<typeof passwordActionSchema>;

export interface DiagnosticStage {
  duration_ms: number;
  message?: string;
  stage:
    | "local_validation"
    | "ssh_trust"
    | "ssh_authentication_forwarding"
    | "mysql_tls_authentication_initial_database";
  status: "pending" | "running" | "passed" | "failed" | "skipped";
}

export interface ConnectionTestResult {
  database_selected?: boolean;
  diagnostics: DiagnosticStage[];
  error?: {
    category: string;
    message: string;
  };
  ok: boolean;
  tls_active?: boolean;
}
