import { describe, expect, it } from "vitest";
import {
  createDatabaseSchema,
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
      name: "old_shop_db",
    });
    expect(valid.success).toBe(true);

    const invalid = dropDatabaseSchema.safeParse({
      connection: { host: "127.0.0.1" },
      name: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate sshConfigSchema with username, password, or private key", () => {
    const validWithPassword = sshConfigSchema.safeParse({
      host: "bastion.internal",
      port: 22,
      username: "deploy_user",
      password: "ssh-secret-password",
    });
    expect(validWithPassword.success).toBe(true);
    if (validWithPassword.success) {
      expect(validWithPassword.data.username).toBe("deploy_user");
      expect(validWithPassword.data.password).toBe("ssh-secret-password");
    }

    const validWithKey = sshConfigSchema.safeParse({
      host: "10.0.0.1",
      port: 2222,
      username: "ubuntu",
      key: "~/.ssh/id_rsa",
    });
    expect(validWithKey.success).toBe(true);
  });
});

