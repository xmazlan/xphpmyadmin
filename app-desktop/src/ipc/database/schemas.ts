import { z } from "zod";

export const databaseConnectionSchema = z.object({
  database: z.string().optional(),
  host: z.string().default("127.0.0.1"),
  password: z.string().default(""),
  port: z.number().int().default(3306),
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

