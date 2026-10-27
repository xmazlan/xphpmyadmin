import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mysql from "mysql2/promise";
import { Client as SshClient } from "ssh2";
import type {
  DatabaseConnectionInput,
  SshConnectionInput,
} from "./schemas";

export interface ManagedConnection {
  close: () => Promise<void>;
  conn: mysql.Connection;
}

export interface ConnectionOptions {
  multipleStatements?: boolean;
  timeoutMs?: number;
}

/**
 * Resolves private key content from a file path or direct string.
 */
async function resolvePrivateKey(
  keyInput?: string | null
): Promise<Buffer | string | undefined> {
  if (!keyInput || !keyInput.trim()) {
    return undefined;
  }

  const trimmed = keyInput.trim();
  if (trimmed.includes("-----BEGIN")) {
    return trimmed;
  }

  let resolvedPath = trimmed;
  if (resolvedPath.startsWith("~")) {
    resolvedPath = path.join(os.homedir(), resolvedPath.slice(1));
  }

  try {
    return await fs.readFile(resolvedPath);
  } catch (err: any) {
    throw new Error(
      `Gagal membaca berkas SSH Private Key di "${resolvedPath}": ${err?.message || String(err)}`
    );
  }
}

/**
 * Tests an SSH connection and retrieves host key and fingerprint information.
 */
export function inspectSshConnection(
  ssh: SshConnectionInput,
  timeoutMs = 8000
): Promise<{ fingerprint: string; keyAlgorithm: string }> {
  return new Promise((resolve, reject) => {
    const client = new SshClient();
    let fingerprint = "";
    let keyAlgorithm = "ssh-ed25519";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        client.end();
      } catch {
        // ignore
      }
      reject(
        new Error(
          `Timeout (${timeoutMs}ms) saat menghubungi server SSH ${ssh.host}:${ssh.port || 22}`
        )
      );
    }, timeoutMs);

    client
      .on("handshake", (negotiated: any) => {
        if (negotiated?.serverHostKey) {
          keyAlgorithm = String(negotiated.serverHostKey);
        }
      })
      .on("ready", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          client.end();
        } catch {
          // ignore
        }
        resolve({
          fingerprint: fingerprint || "SHA256:Verified",
          keyAlgorithm,
        });
      })
      .on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });

    (async () => {
      try {
        const privateKey = await resolvePrivateKey(ssh.key);
        client.connect({
          host: ssh.host,
          hostVerifier: (hashedKey: string | Buffer) => {
            fingerprint =
              typeof hashedKey === "string"
                ? hashedKey
                : Buffer.isBuffer(hashedKey)
                  ? `SHA256:${hashedKey.toString("base64")}`
                  : String(hashedKey);
            return true;
          },
          passphrase: ssh.password || undefined,
          password: ssh.password || undefined,
          port: ssh.port || 22,
          privateKey,
          readyTimeout: timeoutMs,
          username: ssh.username || "root",
        });
      } catch (err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    })();
  });
}

/**
 * Connects to MySQL/MariaDB over an SSH tunnel.
 */
async function createSshTunneledConnection(
  input: DatabaseConnectionInput,
  options?: ConnectionOptions
): Promise<ManagedConnection> {
  const ssh = input.ssh!;
  const timeoutMs = options?.timeoutMs || 10000;
  const sshClient = new SshClient();

  const privateKey = await resolvePrivateKey(ssh.key);

  // Connect SSH
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        sshClient.end();
      } catch {
        // ignore
      }
      reject(
        new Error(
          `Koneksi SSH Timeout (${timeoutMs}ms) ke ${ssh.host}:${ssh.port || 22}`
        )
      );
    }, timeoutMs);

    sshClient
      .on("ready", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      })
      .on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(
          new Error(
            `Gagal autentikasi/koneksi SSH ke ${ssh.host}: ${err?.message || String(err)}`
          )
        );
      })
      .connect({
        host: ssh.host,
        passphrase: ssh.password || undefined,
        password: ssh.password || undefined,
        port: ssh.port || 22,
        privateKey,
        readyTimeout: timeoutMs,
        username: ssh.username || "root",
      });
  });

  // Forward connection to target MySQL server
  const targetHost = input.host || "127.0.0.1";
  const targetPort = input.port || 3306;

  const stream = await new Promise<any>((resolve, reject) => {
    sshClient.forwardOut(
      "127.0.0.1",
      0,
      targetHost,
      targetPort,
      (err, forwardStream) => {
        if (err) {
          try {
            sshClient.end();
          } catch {
            // ignore
          }
          return reject(
            new Error(
              `SSH Tunnel forwardOut gagal ke ${targetHost}:${targetPort}: ${err?.message || String(err)}`
            )
          );
        }
        resolve(forwardStream);
      }
    );
  });

  // Create MySQL connection over SSH stream
  try {
    const conn = await mysql.createConnection({
      connectTimeout: timeoutMs,
      database: input.database || undefined,
      multipleStatements: options?.multipleStatements,
      password: input.password,
      stream,
      user: input.user,
    });

    return {
      close: async () => {
        try {
          await conn.end();
        } catch {
          conn.destroy();
        } finally {
          try {
            sshClient.end();
          } catch {
            // ignore
          }
        }
      },
      conn,
    };
  } catch (err) {
    try {
      sshClient.end();
    } catch {
      // ignore
    }
    throw err;
  }
}

/**
 * Creates a managed database connection (either direct or SSH tunneled).
 */
export async function createDatabaseConnection(
  input: DatabaseConnectionInput,
  options?: ConnectionOptions
): Promise<ManagedConnection> {
  if (input.method === "ssh" && input.ssh && input.ssh.host) {
    return await createSshTunneledConnection(input, options);
  }

  const timeoutMs = options?.timeoutMs || 8000;
  const conn = await mysql.createConnection({
    connectTimeout: timeoutMs,
    database: input.database || undefined,
    host: input.host,
    multipleStatements: options?.multipleStatements,
    password: input.password,
    port: input.port,
    user: input.user,
  });

  return {
    close: async () => {
      try {
        await conn.end();
      } catch {
        conn.destroy();
      }
    },
    conn,
  };
}
