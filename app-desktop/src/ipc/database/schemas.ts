import { z } from "zod";

export const sshConnectionSchema = z.object({
  auth_type: z.enum(["password", "key"]).default("password").optional(),
  host: z.string().min(1).max(253),
  key: z.string().max(4096).nullable().optional(),
  password: z.string().max(65_536).nullable().optional(),
  port: z.number().int().min(1).max(65_535).default(22),
  username: z.string().min(1).max(128).default("root"),
});
export type SshConnectionInput = z.infer<typeof sshConnectionSchema>;

export const databaseConnectionSchema = z.object({
  database: z.string().optional(),
  host: z.string().default("127.0.0.1"),
  method: z.enum(["direct", "ssh"]).default("direct").optional(),
  password: z.string().default(""),
  port: z.number().int().default(3306),
  ssh: sshConnectionSchema.nullable().optional(),
  user: z.string().default("root"),
});
export type DatabaseConnectionInput = z.infer<typeof databaseConnectionSchema>;

export const getTablesSchema = z.object({
  connection: databaseConnectionSchema,
  database: z.string(),
});

export const executeQuerySchema = z.object({
  connection: databaseConnectionSchema,
  database: z.string().optional(),
  query: z.string().min(1),
});

export const exportDatabaseSchema = z.object({
  connection: databaseConnectionSchema,
  database: z.string(),
  filePath: z.string().optional(),
  options: z.object({
    addDropTable: z.boolean().default(true),
    disableForeignKeyChecks: z.boolean().default(true),
    includeData: z.boolean().default(true),
    includeStructure: z.boolean().default(true),
  }),
});
export type ExportDatabaseInput = z.infer<typeof exportDatabaseSchema>;

export const importDatabaseSchema = z.object({
  connection: databaseConnectionSchema,
  database: z.string().optional(),
  filePath: z.string().optional(),
  sqlContent: z.string().optional(),
});
export type ImportDatabaseInput = z.infer<typeof importDatabaseSchema>;

export const promptSqlFileSchema = z.object({
  defaultFileName: z.string().optional(),
  type: z.enum(["open", "save"]),
});
export type PromptSqlFileInput = z.infer<typeof promptSqlFileSchema>;

export const createDatabaseSchema = z.object({
  collation: z.string().optional(),
  connection: databaseConnectionSchema,
  name: z.string().min(1),
});
export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;

export const dropDatabaseSchema = z.object({
  connection: databaseConnectionSchema,
  name: z.string().min(1),
});
export type DropDatabaseInput = z.infer<typeof dropDatabaseSchema>;

