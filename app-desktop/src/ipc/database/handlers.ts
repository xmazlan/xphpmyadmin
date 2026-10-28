import fs from "node:fs/promises";
import path from "node:path";
import { os } from "@orpc/server";
import { dialog } from "electron";
import type mysql from "mysql2/promise";
import { ipcContext } from "../context";
import {
  createDatabaseConnection,
  inspectSshConnection,
} from "./connection-helper";
import {
  createDatabaseSchema,
  databaseConnectionSchema,
  dropDatabaseSchema,
  executeQuerySchema,
  exportDatabaseSchema,
  getTablesSchema,
  importDatabaseSchema,
  promptSqlFileSchema,
  sshConnectionSchema,
} from "./schemas";

export const testConnection = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 10000,
      });

      const [rows] = await conn.query("SELECT VERSION() as version");
      const latencyMs = Date.now() - startTime;
      const versionRaw =
        Array.isArray(rows) && rows[0] && (rows[0] as any).version
          ? String((rows[0] as any).version)
          : "Unknown";

      // Detect database type from version string
      const isMariaDB = versionRaw.toLowerCase().includes("mariadb");
      const dbType = isMariaDB ? "MariaDB" : "MySQL";
      const version = `${dbType} ${versionRaw}`;

      await close();

      return {
        dbType,
        latencyMs,
        ok: true,
        version,
      };
    } catch (err: any) {
      return {
        error: err?.message || String(err),
        latencyMs: Date.now() - startTime,
        ok: false,
      };
    }
  });

export const testSshTunnel = os
  .input(sshConnectionSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    try {
      const res = await inspectSshConnection(input, 10000);
      return {
        fingerprint: res.fingerprint,
        keyAlgorithm: res.keyAlgorithm,
        latencyMs: Date.now() - startTime,
        ok: true,
      };
    } catch (err: any) {
      return {
        error: err?.message || String(err),
        fingerprint: "",
        keyAlgorithm: "",
        latencyMs: Date.now() - startTime,
        ok: false,
      };
    }
  });

export const getDatabases = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 10000,
      });

      const [rows] = await conn.query("SHOW DATABASES;");
      await close();

      const databases: string[] = [];
      if (Array.isArray(rows)) {
        for (const row of rows as any[]) {
          const dbName = row.Database || row.database || Object.values(row)[0];
          if (dbName) {
            databases.push(String(dbName));
          }
        }
      }

      return { databases, ok: true };
    } catch (err: any) {
      return { databases: [], error: err?.message || String(err), ok: false };
    }
  });

export const getTables = os
  .input(getTablesSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(
        {
          ...input.connection,
          database: input.database,
        },
        { timeoutMs: 12000 }
      );

      let rows: any[] = [];
      try {
        const [statusRows] = await conn.query("SHOW TABLE STATUS;");
        if (Array.isArray(statusRows) && statusRows.length > 0) {
          rows = statusRows;
        }
      } catch {
        // Fallback jika SHOW TABLE STATUS gagal (misal broken view)
      }

      // Jika SHOW TABLE STATUS kosong atau gagal, gunakan SHOW FULL TABLES
      if (rows.length === 0) {
        try {
          const [ftRows] = await conn.query("SHOW FULL TABLES;");
          if (Array.isArray(ftRows) && ftRows.length > 0) {
            rows = (ftRows as any[]).map((r) => {
              const vals = Object.values(r);
              const tblType = vals[1] === "VIEW" ? "VIEW" : "InnoDB";
              return {
                Collation: "utf8mb4_general_ci",
                Comment: vals[1] === "VIEW" ? "VIEW" : "",
                Data_free: 0,
                Data_length: 0,
                Engine: tblType,
                Index_length: 0,
                Name: vals[0],
                Rows: 0,
              };
            });
          }
        } catch {
          // Fallback kedua dengan SHOW TABLES
          try {
            const [stRows] = await conn.query("SHOW TABLES;");
            if (Array.isArray(stRows)) {
              rows = (stRows as any[]).map((r) => {
                const vals = Object.values(r);
                return {
                  Collation: "utf8mb4_general_ci",
                  Comment: "",
                  Data_free: 0,
                  Data_length: 0,
                  Engine: "InnoDB",
                  Index_length: 0,
                  Name: vals[0],
                  Rows: 0,
                };
              });
            }
          } catch {
            // ignore
          }
        }
      }

      await close();

      const tables: Array<{
        collation: string;
        comment: string;
        dataFree: number;
        dataLength: number;
        engine: string;
        indexLength: number;
        name: string;
        rows: number;
        size: string;
      }> = [];

      if (Array.isArray(rows)) {
        for (const row of rows as any[]) {
          const name = row.Name || row.name;
          if (!name) continue;
          const numRows = Number(row.Rows ?? row.rows ?? 0) || 0;
          const dataLength = Number(row.Data_length || 0);
          const indexLength = Number(row.Index_length || 0);
          const dataFree = Number(row.Data_free || 0);
          const totalBytes = dataLength + indexLength;
          const size =
            totalBytes > 1_048_576
              ? `${(totalBytes / 1_048_576).toFixed(1)} MB`
              : `${Math.round(totalBytes / 1024)} KB`;

          tables.push({
            collation: String(row.Collation || "utf8mb4_general_ci"),
            comment: String(row.Comment || ""),
            dataFree,
            dataLength,
            engine: String(
              row.Engine || (row.Comment === "VIEW" ? "VIEW" : "InnoDB")
            ),
            indexLength,
            name: String(name),
            rows: numRows,
            size,
          });
        }
      }

      return { ok: true, tables };
    } catch (err: any) {
      return { error: err?.message || String(err), ok: false, tables: [] };
    }
  });

export const executeQuery = os
  .input(executeQuerySchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    try {
      const { conn, close } = await createDatabaseConnection(
        {
          ...input.connection,
          database: input.database || input.connection.database || undefined,
        },
        { timeoutMs: 15000 }
      );

      const [result, fields] = await conn.query(input.query);
      const executionTimeMs = Date.now() - startTime;
      await close();

      if (Array.isArray(result)) {
        const columns = fields
          ? fields.map((f: any) => f.name)
          : result[0]
            ? Object.keys(result[0] as object)
            : [];
        return {
          columns,
          executionTimeMs,
          ok: true,
          rowCount: result.length,
          rows: result,
        };
      }

      const headerInfo = result as mysql.ResultSetHeader;
      return {
        columns: ["affectedRows", "insertId", "warningStatus"],
        executionTimeMs,
        ok: true,
        rowCount: headerInfo.affectedRows || 0,
        rows: [
          {
            affectedRows: headerInfo.affectedRows,
            insertId: headerInfo.insertId,
            warningStatus: headerInfo.warningStatus,
          },
        ],
      };
    } catch (err: any) {
      return {
        columns: [],
        error: err?.message || String(err),
        executionTimeMs: Date.now() - startTime,
        ok: false,
        rowCount: 0,
        rows: [],
      };
    }
  });

function escapeSqlValue(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `0x${val.toString("hex")}`;
  }
  if (typeof val === "object") {
    val = JSON.stringify(val);
  }
  const str = String(val);
  return `'${str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\0/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\x1a/g, "\\Z")}'`;
}

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return "";
  let str = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(val: any): string {
  if (val === null || val === undefined) return "";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentField);
        currentField = "";
        lines.push(currentRow);
        currentRow = [];
        i++;
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentField);
        currentField = "";
        lines.push(currentRow);
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    lines.push(currentRow);
  }

  return lines.filter((r) => r.some((c) => c.trim().length > 0));
}

export const promptSqlFileDialog = os
  .input(promptSqlFileSchema)
  .handler(async ({ input }) => {
    const window = ipcContext.mainWindow;
    const filterList = [
      { extensions: ["sql"], name: "SQL Dump (*.sql)" },
      { extensions: ["csv"], name: "Berkas CSV (*.csv)" },
      { extensions: ["json"], name: "JSON Data (*.json)" },
      { extensions: ["xml"], name: "XML Data (*.xml)" },
      { extensions: ["*"], name: "Semua Berkas (*.*)" },
    ];

    if (input.type === "save") {
      const res = window
        ? await dialog.showSaveDialog(window, {
            defaultPath: input.defaultFileName || "database_backup.sql",
            filters: filterList,
            title: "Simpan Berkas Ekspor Database",
          })
        : await dialog.showSaveDialog({
            defaultPath: input.defaultFileName || "database_backup.sql",
            filters: filterList,
            title: "Simpan Berkas Ekspor Database",
          });
      return {
        canceled: res.canceled,
        filePath: res.filePath,
      };
    }

    const res = window
      ? await dialog.showOpenDialog(window, {
          filters: filterList,
          properties: ["openFile"],
          title: "Pilih Berkas untuk Diimpor (SQL, CSV, JSON, XML)",
        })
      : await dialog.showOpenDialog({
          filters: filterList,
          properties: ["openFile"],
          title: "Pilih Berkas untuk Diimpor (SQL, CSV, JSON, XML)",
        });
    if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
      return { canceled: true };
    }
    const selectedPath = res.filePaths[0];
    const stats = await fs.stat(selectedPath);
    return {
      canceled: false,
      fileName: path.basename(selectedPath),
      filePath: selectedPath,
      fileSize: stats.size,
    };
  });

export const exportDatabase = os
  .input(exportDatabaseSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    try {
      const { conn, close } = await createDatabaseConnection(
        {
          ...input.connection,
          database: input.database,
        },
        { timeoutMs: 30000 }
      );

      const [vRows] = await conn.query("SELECT VERSION() as v");
      const srvVerRaw =
        Array.isArray(vRows) && vRows[0]
          ? (vRows[0] as any).v
          : "Unknown";

      // Detect database type from version string
      const isMariaDB = String(srvVerRaw).toLowerCase().includes("mariadb");
      const dbType = isMariaDB ? "MariaDB" : "MySQL";
      const srvVer = `${dbType} ${srvVerRaw}`;

      const [tRows] = await conn.query(
        "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';"
      );
      const allTables: string[] = [];
      if (Array.isArray(tRows)) {
        for (const r of tRows as any[]) {
          const vals = Object.values(r);
          if (vals[0]) allTables.push(String(vals[0]));
        }
      }

      // Filter tables if specified
      const tablesToExport =
        input.tables && input.tables.length > 0
          ? allTables.filter((t) => input.tables!.includes(t))
          : allTables;

      const format = input.format || "sql";
      const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19);
      let dump = "";
      let totalRowsExported = 0;

      if (format === "csv") {
        for (const tbl of tablesToExport) {
          const [dRows] = await conn.query(`SELECT * FROM \`${tbl}\`;`);
          if (Array.isArray(dRows) && dRows.length > 0) {
            totalRowsExported += dRows.length;
            if (tablesToExport.length > 1) {
              dump += `# Table: ${tbl}\n`;
            }
            const cols = Object.keys(dRows[0]);
            dump += cols.map(escapeCsvValue).join(",") + "\n";
            for (const row of dRows as any[]) {
              dump += cols.map((c) => escapeCsvValue(row[c])).join(",") + "\n";
            }
            dump += "\n";
          }
        }
      } else if (format === "json") {
        const jsonExport: Record<string, any> = {
          database: input.database,
          exported_at: nowStr,
          format: "json",
          server: `${input.connection.host}:${input.connection.port}`,
          server_version: srvVer,
          tables: {},
        };
        for (const tbl of tablesToExport) {
          const [dRows] = await conn.query(`SELECT * FROM \`${tbl}\`;`);
          if (Array.isArray(dRows)) {
            totalRowsExported += dRows.length;
            jsonExport.tables[tbl] = dRows;
          }
        }
        dump = JSON.stringify(jsonExport, null, 2);
      } else if (format === "xml") {
        dump += `<?xml version="1.0" encoding="utf-8"?>\n`;
        dump += `<pma:phpmyadmin export_version="1.0" database="${escapeXml(input.database)}" exported_at="${nowStr}">\n`;
        for (const tbl of tablesToExport) {
          const [dRows] = await conn.query(`SELECT * FROM \`${tbl}\`;`);
          if (Array.isArray(dRows)) {
            totalRowsExported += dRows.length;
            dump += `  <pma:table name="${escapeXml(tbl)}">\n`;
            for (const row of dRows as any[]) {
              dump += `    <pma:row>\n`;
              for (const [k, v] of Object.entries(row)) {
                dump += `      <pma:column name="${escapeXml(k)}">${escapeXml(v)}</pma:column>\n`;
              }
              dump += `    </pma:row>\n`;
            }
            dump += `  </pma:table>\n`;
          }
        }
        dump += `</pma:phpmyadmin>\n`;
      } else {
        // Standar SQL Dump
        dump += `-- ==========================================================\n`;
        dump += `-- xphpMyAdmin Desktop Database Export\n`;
        dump += `-- Host: ${input.connection.host}:${input.connection.port}\n`;
        dump += `-- Database: \`${input.database}\`\n`;
        dump += `-- Server Version: ${srvVer}\n`;
        dump += `-- Waktu Ekspor: ${nowStr}\n`;
        dump += `-- ==========================================================\n\n`;
        dump += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
        dump += `START TRANSACTION;\n`;
        dump += `SET time_zone = "+00:00";\n`;
        if (input.options.disableForeignKeyChecks) {
          dump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
        }

        for (const tbl of tablesToExport) {
          dump += `-- --------------------------------------------------------\n`;
          dump += `-- Struktur tabel untuk \`${tbl}\`\n`;
          dump += `-- --------------------------------------------------------\n`;

          if (input.options.includeStructure) {
            if (input.options.addDropTable) {
              dump += `DROP TABLE IF EXISTS \`${tbl}\`;\n`;
            }
            const [cRows] = await conn.query(`SHOW CREATE TABLE \`${tbl}\`;`);
            if (Array.isArray(cRows) && cRows[0]) {
              const createSql = (cRows[0] as any)["Create Table"];
              dump += `${createSql};\n\n`;
            }
          }

          if (input.options.includeData) {
            const [dRows] = await conn.query(`SELECT * FROM \`${tbl}\`;`);
            if (Array.isArray(dRows) && dRows.length > 0) {
              dump += `-- Dumping data untuk tabel \`${tbl}\` (${dRows.length} baris)\n`;
              totalRowsExported += dRows.length;

              const cols = Object.keys(dRows[0]);
              const colsEscaped = cols.map((c) => `\`${c}\``).join(", ");

              const chunkSize = 200;
              for (let i = 0; i < dRows.length; i += chunkSize) {
                const chunk = dRows.slice(i, i + chunkSize);
                dump += `INSERT INTO \`${tbl}\` (${colsEscaped}) VALUES\n`;
                const valueLines = chunk.map((row: any) => {
                  const vals = cols.map((c) => escapeSqlValue(row[c]));
                  return `(${vals.join(", ")})`;
                });
                dump += valueLines.join(",\n") + `;\n\n`;
              }
            }
          }
        }

        if (input.options.disableForeignKeyChecks) {
          dump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
        }
        dump += `COMMIT;\n`;
        dump += `-- Ekspor selesai: ${tablesToExport.length} tabel, ${totalRowsExported} baris.\n`;
      }

      await close();

      const durationMs = Date.now() - startTime;
      const sizeBytes = Buffer.byteLength(dump, "utf-8");

      if (input.filePath) {
        await fs.writeFile(input.filePath, dump, "utf-8");
        return {
          durationMs,
          filePath: input.filePath,
          ok: true,
          rowCount: totalRowsExported,
          sizeBytes,
          sqlDump:
            dump.length > 100000
              ? dump.slice(0, 100000) + "\n-- [Truncated for preview]"
              : dump,
          tableCount: tablesToExport.length,
        };
      }

      return {
        durationMs,
        ok: true,
        rowCount: totalRowsExported,
        sizeBytes,
        sqlDump: dump,
        tableCount: tablesToExport.length,
      };
    } catch (err: any) {
      return {
        durationMs: Date.now() - startTime,
        error: err?.message || String(err),
        ok: false,
        rowCount: 0,
        sizeBytes: 0,
        tableCount: 0,
      };
    }
  });

export const importDatabase = os
  .input(importDatabaseSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    try {
      let rawContent = input.sqlContent || "";
      let detectedExt = "";
      if (input.filePath) {
        detectedExt = path.extname(input.filePath).toLowerCase();
        try {
          rawContent = await fs.readFile(input.filePath, "utf-8");
        } catch {
          if (!rawContent && input.sqlContent) {
            rawContent = input.sqlContent;
          }
        }
      }

      if (!rawContent.trim()) {
        return {
          durationMs: 0,
          error: "Konten berkas/skrip kosong atau tidak dapat dibaca.",
          ok: false,
          statementsExecuted: 0,
        };
      }

      const format =
        input.format ||
        (detectedExt === ".csv"
          ? "csv"
          : detectedExt === ".json"
            ? "json"
            : detectedExt === ".xml"
              ? "xml"
              : "sql");

      const { conn, close } = await createDatabaseConnection(
        {
          ...input.connection,
          database: input.database || input.connection.database || undefined,
        },
        { multipleStatements: true, timeoutMs: 90000 }
      );

      let statementsExecuted = 0;

      if (format === "csv") {
        const rows = parseCsv(rawContent);
        if (rows.length < 2) {
          await close();
          return {
            durationMs: Date.now() - startTime,
            error: "Format CSV membutuhkan setidaknya baris header dan 1 baris data.",
            ok: false,
            statementsExecuted: 0,
          };
        }

        const headers = rows[0].map((h) =>
          h.trim().replace(/^['"`]|['"`]$/g, "")
        );
        const dataRows = rows.slice(1);
        const targetTbl =
          input.targetTable ||
          (input.filePath
            ? path.basename(input.filePath, path.extname(input.filePath))
            : "imported_table");

        const colsEscaped = headers.map((h) => `\`${h}\``).join(", ");
        const chunkSize = 100;

        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          const valueList = chunk.map((r) => {
            const vals = headers.map((_, colIdx) =>
              escapeSqlValue(r[colIdx] ?? null)
            );
            return `(${vals.join(", ")})`;
          });
          const insertSql = `INSERT INTO \`${targetTbl}\` (${colsEscaped}) VALUES ${valueList.join(", ")};`;
          await conn.query(insertSql);
          statementsExecuted += chunk.length;
        }
      } else if (format === "json") {
        const parsed = JSON.parse(rawContent);
        if (parsed.tables && typeof parsed.tables === "object") {
          for (const [tblName, rows] of Object.entries(parsed.tables)) {
            if (Array.isArray(rows) && rows.length > 0) {
              const cols = Object.keys(rows[0]);
              const colsEscaped = cols.map((c) => `\`${c}\``).join(", ");
              const chunkSize = 100;
              for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                const values = chunk.map((r: any) => {
                  const vals = cols.map((c) => escapeSqlValue(r[c]));
                  return `(${vals.join(", ")})`;
                });
                await conn.query(
                  `INSERT INTO \`${tblName}\` (${colsEscaped}) VALUES ${values.join(", ")};`
                );
                statementsExecuted += chunk.length;
              }
            }
          }
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          const targetTbl =
            input.targetTable ||
            (input.filePath
              ? path.basename(input.filePath, path.extname(input.filePath))
              : "imported_table");
          const cols = Object.keys(parsed[0]);
          const colsEscaped = cols.map((c) => `\`${c}\``).join(", ");
          const chunkSize = 100;
          for (let i = 0; i < parsed.length; i += chunkSize) {
            const chunk = parsed.slice(i, i + chunkSize);
            const values = chunk.map((r: any) => {
              const vals = cols.map((c) => escapeSqlValue(r[c]));
              return `(${vals.join(", ")})`;
            });
            await conn.query(
              `INSERT INTO \`${targetTbl}\` (${colsEscaped}) VALUES ${values.join(", ")};`
            );
            statementsExecuted += chunk.length;
          }
        }
      } else {
        // SQL Execution
        await conn.query(rawContent);
        statementsExecuted = rawContent
          .split(";")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && !s.startsWith("--")).length;
      }

      await close();

      const durationMs = Date.now() - startTime;
      return {
        durationMs,
        ok: true,
        sizeBytes: Buffer.byteLength(rawContent, "utf-8"),
        statementsExecuted,
      };
    } catch (err: any) {
      return {
        durationMs: Date.now() - startTime,
        error: err?.message || String(err),
        ok: false,
        statementsExecuted: 0,
      };
    }
  });

export const getServerStatus = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 8000,
      });

      const [statusRows] = await conn.query("SHOW GLOBAL STATUS;");
      const [processRows] = await conn.query("SHOW FULL PROCESSLIST;");
      await close();

      const statusMap: Record<string, string> = {};
      if (Array.isArray(statusRows)) {
        for (const row of statusRows as any[]) {
          const varName = row.Variable_name || row.variable_name;
          const val = row.Value ?? row.value;
          if (varName) statusMap[varName] = String(val);
        }
      }

      const processes = Array.isArray(processRows)
        ? (processRows as any[]).map((p) => ({
            command: String(p.Command || ""),
            db: String(p.db || p.Db || "-"),
            host: String(p.Host || ""),
            id: Number(p.Id || 0),
            info: String(p.Info || ""),
            state: String(p.State || ""),
            time: Number(p.Time || 0),
            user: String(p.User || ""),
          }))
        : [];

      return {
        bytesReceived: Number(statusMap.Bytes_received || 0),
        bytesSent: Number(statusMap.Bytes_sent || 0),
        connections: Number(statusMap.Connections || 0),
        ok: true,
        processes,
        questions: Number(statusMap.Questions || 0),
        threadsConnected: Number(statusMap.Threads_connected || 0),
        threadsRunning: Number(statusMap.Threads_running || 0),
        uptimeSeconds: Number(statusMap.Uptime || 0),
      };
    } catch (err: any) {
      return {
        bytesReceived: 0,
        bytesSent: 0,
        connections: 0,
        error: err?.message || String(err),
        ok: false,
        processes: [],
        questions: 0,
        threadsConnected: 0,
        threadsRunning: 0,
        uptimeSeconds: 0,
      };
    }
  });

export const getUserAccounts = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 8000,
      });

      let users: Array<{
        accountLocked: boolean;
        host: string;
        passwordExpired: boolean;
        plugin: string;
        user: string;
      }> = [];

      try {
        const [rows] = await conn.query(
          "SELECT User, Host, IFNULL(plugin, 'native') as plugin, IFNULL(account_locked, 'N') as account_locked, IFNULL(password_expired, 'N') as password_expired FROM mysql.user ORDER BY User, Host;"
        );
        if (Array.isArray(rows)) {
          users = (rows as any[]).map((r) => ({
            accountLocked: r.account_locked === "Y",
            host: String(r.Host || "%"),
            passwordExpired: r.password_expired === "Y",
            plugin: String(r.plugin || "mysql_native_password"),
            user: String(r.User || ""),
          }));
        }
      } catch {
        const [rows] = await conn.query("SELECT USER() as curUser;");
        if (Array.isArray(rows) && rows[0]) {
          const cur = String((rows[0] as any).curUser || "");
          const [u, h] = cur.split("@");
          users = [
            {
              accountLocked: false,
              host: h || "localhost",
              passwordExpired: false,
              plugin: "default",
              user: u || input.user,
            },
          ];
        }
      }

      await close();
      return { ok: true, users };
    } catch (err: any) {
      return { error: err?.message || String(err), ok: false, users: [] };
    }
  });

export const getServerVariables = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 8000,
      });

      const [rows] = await conn.query("SHOW GLOBAL VARIABLES;");
      await close();

      const variables: Array<{ name: string; value: string }> = [];
      if (Array.isArray(rows)) {
        for (const row of rows as any[]) {
          const name = row.Variable_name || row.variable_name;
          const value = row.Value ?? row.value ?? "";
          if (name) {
            variables.push({ name: String(name), value: String(value) });
          }
        }
      }
      return { ok: true, variables };
    } catch (err: any) {
      return { error: err?.message || String(err), ok: false, variables: [] };
    }
  });

export const getServerEngines = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 8000,
      });

      const [rows] = await conn.query("SHOW ENGINES;");
      await close();

      const engines: Array<{
        comment: string;
        engine: string;
        savepoints: string;
        support: string;
        transactions: string;
        xa: string;
      }> = [];

      if (Array.isArray(rows)) {
        for (const r of rows as any[]) {
          engines.push({
            comment: String(r.Comment || ""),
            engine: String(r.Engine || ""),
            savepoints: String(r.Savepoints || "NO"),
            support: String(r.Support || ""),
            transactions: String(r.Transactions || "NO"),
            xa: String(r.XA || "NO"),
          });
        }
      }
      return { engines, ok: true };
    } catch (err: any) {
      return { engines: [], error: err?.message || String(err), ok: false };
    }
  });

export const getServerCharsets = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 8000,
      });

      const [rows] = await conn.query("SHOW CHARACTER SET;");
      await close();

      const charsets: Array<{
        charset: string;
        defaultCollation: string;
        description: string;
        maxlen: number;
      }> = [];

      if (Array.isArray(rows)) {
        for (const r of rows as any[]) {
          charsets.push({
            charset: String(r.Charset || r.charset || ""),
            defaultCollation: String(
              r["Default collation"] || r.default_collation || ""
            ),
            description: String(r.Description || r.description || ""),
            maxlen: Number(r.Maxlen || r.maxlen || 1),
          });
        }
      }
      return { charsets, ok: true };
    } catch (err: any) {
      return { charsets: [], error: err?.message || String(err), ok: false };
    }
  });

export const getServerPlugins = os
  .input(databaseConnectionSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(input, {
        timeoutMs: 8000,
      });

      const [rows] = await conn.query("SHOW PLUGINS;");
      await close();

      const plugins: Array<{
        library: string;
        license: string;
        name: string;
        status: string;
        type: string;
      }> = [];

      if (Array.isArray(rows)) {
        for (const r of rows as any[]) {
          plugins.push({
            library: String(r.Library || "-"),
            license: String(r.License || "-"),
            name: String(r.Name || ""),
            status: String(r.Status || ""),
            type: String(r.Type || ""),
          });
        }
      }
      return { ok: true, plugins };
    } catch (err: any) {
      return { error: err?.message || String(err), ok: false, plugins: [] };
    }
  });

export const createDatabase = os
  .input(createDatabaseSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(
        input.connection,
        { timeoutMs: 8000 }
      );

      const collationClause = input.collation
        ? ` COLLATE ${input.collation}`
        : "";
      await conn.query(`CREATE DATABASE \`${input.name}\`${collationClause};`);
      await close();

      return { name: input.name, ok: true };
    } catch (err: any) {
      return {
        error: err?.message || String(err),
        name: input.name,
        ok: false,
      };
    }
  });

export const dropDatabase = os
  .input(dropDatabaseSchema)
  .handler(async ({ input }) => {
    try {
      const { conn, close } = await createDatabaseConnection(
        input.connection,
        { timeoutMs: 8000 }
      );

      await conn.query(`DROP DATABASE \`${input.name}\`;`);
      await close();

      return { name: input.name, ok: true };
    } catch (err: any) {
      return {
        error: err?.message || String(err),
        name: input.name,
        ok: false,
      };
    }
  });
