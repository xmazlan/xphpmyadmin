import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";

export const PROTOCOL_NAME = "xphpmyadmin";

let activeOAuthServer: http.Server | null = null;

export function registerProtocolClient() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME);
  }
}

export function handleProtocolUrl(urlStr: string, mainWindow: BrowserWindow | null) {
  try {
    const parsed = new URL(urlStr);
    const token = parsed.searchParams.get("token") || "";
    const userRaw = parsed.searchParams.get("user") || "";
    const provider = parsed.searchParams.get("provider") || "oauth";

    let user: any = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {
        user = { email: userRaw };
      }
    }

    if (token && mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send("oauth-callback", { token, user, provider });
    }
  } catch (err) {
    console.error("Failed to parse protocol callback URL:", err);
  }
}

export function startOAuthLoopbackServer(
  getMainWindow: () => BrowserWindow | null
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (activeOAuthServer) {
      try {
        activeOAuthServer.close();
      } catch {}
      activeOAuthServer = null;
    }

    const server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = new URL(
        req.url || "",
        `http://${req.headers.host || "127.0.0.1"}`
      );

      if (parsedUrl.pathname === "/callback") {
        const token = parsedUrl.searchParams.get("token") || "";
        const userRaw = parsedUrl.searchParams.get("user") || "";
        const provider = parsedUrl.searchParams.get("provider") || "oauth";

        let user: any = null;
        if (userRaw) {
          try {
            user = JSON.parse(userRaw);
          } catch {
            user = { email: userRaw };
          }
        }

        const mainWindow = getMainWindow();
        if (token && mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("oauth-callback", {
            token,
            user,
            provider,
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Authentication received by xphpMyAdmin Desktop",
            success: true,
          })
        );

        setTimeout(() => {
          try {
            server.close();
          } catch {}
          if (activeOAuthServer === server) {
            activeOAuthServer = null;
          }
        }, 1200);
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });

    server.on("error", (err) => {
      reject(err);
    });

    // Listen on 127.0.0.1 on port 0 to dynamically assign an open port
    server.listen(0, "127.0.0.1", () => {
      activeOAuthServer = server;
      const addr = server.address() as AddressInfo;
      resolve(addr.port);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      try {
        server.close();
      } catch {}
      if (activeOAuthServer === server) {
        activeOAuthServer = null;
      }
    }, 5 * 60 * 1000);
  });
}

export function registerOAuthIpcHandlers(
  getMainWindow: () => BrowserWindow | null
) {
  ipcMain.handle("start-oauth", async (_event, provider: string) => {
    try {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        throw new Error("Jendela aplikasi utama belum siap");
      }

      const port = await startOAuthLoopbackServer(getMainWindow);
      const backendBase =
        process.env.VITE_BACKEND_URL || "https://www.er-service.duckdns.org";
      const targetProvider = provider === "github" ? "github" : "google";
      const authUrl = `${backendBase}/api/auth/oauth-browser?provider=${targetProvider}&port=${port}&protocol=${PROTOCOL_NAME}`;

      await shell.openExternal(authUrl);

      return {
        port,
        success: true,
      };
    } catch (err: any) {
      console.error("Gagal memulai proses OAuth browser:", err);
      return {
        error: err?.message || String(err),
        success: false,
      };
    }
  });
}
