import { describe, expect, it } from "vitest";
import {
  createDatabaseSchema,
  databaseConnectionSchema,
  dropDatabaseSchema,
  exportDatabaseSchema,
  importDatabaseSchema,
  promptSqlFileSchema,
} from "../../ipc/database/schemas";
import { sshConfigSchema } from "../../types/connection";

describe("Database Export & Import Schemas", () => {
  it("should validate exportDatabaseSchema with valid defaults", () => {
    const validData = {
      connection: {
        host: "127.0.0.1",
        password: "secret",
        port: 3306,
        user: "root",
      },
      database: "ecommerce_db",
      options: {
        addDropTable: true,
        disableForeignKeyChecks: true,
        includeData: true,
        includeStructure: true,
      },
    };

    const parsed = exportDatabaseSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.database).toBe("ecommerce_db");
      expect(parsed.data.options.includeData).toBe(true);
      expect(parsed.data.options.includeStructure).toBe(true);
    }
  });

  it("should validate exportDatabaseSchema with multi-format and table filtering", () => {
    const csvExport = {
      connection: { host: "127.0.0.1", port: 3306 },
      database: "shop_db",
      format: "csv",
      options: {
        addDropTable: false,
        disableForeignKeyChecks: false,
        includeData: true,
        includeStructure: false,
      },
      tables: ["users", "orders"],
    };
    const parsedCsv = exportDatabaseSchema.safeParse(csvExport);
    expect(parsedCsv.success).toBe(true);
    if (parsedCsv.success) {
      expect(parsedCsv.data.format).toBe("csv");
      expect(parsedCsv.data.tables).toEqual(["users", "orders"]);
    }

    const jsonExport = {
      connection: { host: "127.0.0.1", port: 3306 },
      database: "shop_db",
      format: "json",
      options: {
        addDropTable: true,
        disableForeignKeyChecks: true,
        includeData: true,
        includeStructure: true,
      },
    };
    const parsedJson = exportDatabaseSchema.safeParse(jsonExport);
    expect(parsedJson.success).toBe(true);
  });

  it("should validate importDatabaseSchema with SQL string or filePath", () => {
    const importWithString = {
      connection: {
        host: "localhost",
        port: 3306,
      },
      database: "test_db",
      sqlContent: "CREATE TABLE `users` (id INT PRIMARY KEY);",
    };

    const parsed1 = importDatabaseSchema.safeParse(importWithString);
    expect(parsed1.success).toBe(true);

    const importWithFile = {
      connection: {
        host: "localhost",
        port: 3306,
      },
      filePath: "/path/to/dump.sql",
    };

    const parsed2 = importDatabaseSchema.safeParse(importWithFile);
    expect(parsed2.success).toBe(true);

    const importCsv = {
      connection: { host: "localhost", port: 3306 },
      database: "test_db",
      format: "csv",
      sqlContent: "id,name\n1,Alice\n2,Bob",
      targetTable: "users",
    };
    const parsed3 = importDatabaseSchema.safeParse(importCsv);
    expect(parsed3.success).toBe(true);
    if (parsed3.success) {
      expect(parsed3.data.format).toBe("csv");
      expect(parsed3.data.targetTable).toBe("users");
    }
  });

  it("should validate promptSqlFileSchema for open and save dialogs", () => {
    const openDialog = promptSqlFileSchema.safeParse({ type: "open" });
    expect(openDialog.success).toBe(true);

    const saveDialog = promptSqlFileSchema.safeParse({
      defaultFileName: "backup_2026.sql",
      type: "save",
    });
    expect(saveDialog.success).toBe(true);

    const invalidDialog = promptSqlFileSchema.safeParse({ type: "unknown" });
    expect(invalidDialog.success).toBe(false);
  });

  it("should validate createDatabaseSchema with collation", () => {
    const valid = createDatabaseSchema.safeParse({
      collation: "utf8mb4_general_ci",
      connection: {
        host: "127.0.0.1",
        port: 3306,
        user: "root",
      },
      name: "new_shop_db",
    });
    expect(valid.success).toBe(true);

    const emptyName = createDatabaseSchema.safeParse({
      connection: { host: "127.0.0.1" },
      name: "",
    });
    expect(emptyName.success).toBe(false);
  });

  it("should validate dropDatabaseSchema", () => {
    const valid = dropDatabaseSchema.safeParse({
      connection: {
        host: "127.0.0.1",
        port: 3306,
        user: "root",
      },
      name: "old_db",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate sshConfigSchema with username, password, or private key", () => {
    const validPass = sshConfigSchema.safeParse({
      auth_type: "password",
      host: "192.168.1.100",
      password: "ssh-password",
      port: 22,
      username: "ubuntu",
    });
    expect(validPass.success).toBe(true);

    const validKey = sshConfigSchema.safeParse({
      auth_type: "key",
      host: "ssh.example.com",
      key: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest\n-----END OPENSSH PRIVATE KEY-----",
      port: 2222,
      username: "deploy",
    });
    expect(validKey.success).toBe(true);
  });

  it("should validate databaseConnectionSchema with ssh method and configuration", () => {
    const validSshConn = databaseConnectionSchema.safeParse({
      database: "production_db",
      host: "127.0.0.1",
      method: "ssh",
      port: 3306,
      ssh: {
        auth_type: "password",
        host: "tunnel.server.com",
        password: "secret",
        port: 22,
        username: "root",
      },
      user: "db_user",
    });
    expect(validSshConn.success).toBe(true);
  });
});
