import path from "node:path";
import { app, BrowserWindow, nativeTheme } from "electron";
import { ipcMain } from "electron/main";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { UpdateSourceType, updateElectronApp } from "update-electron-app";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS, inDevelopment } from "./constants";
import {
  PROTOCOL_NAME,
  handleProtocolUrl,
  registerOAuthIpcHandlers,
  registerProtocolClient,
} from "./main/oauth";
import { getBasePath } from "./utils/path";

let mainWindow: BrowserWindow | null = null;

// Register custom deep link protocol: xphpmyadmin://
registerProtocolClient();

// Ensure single instance lock for deep links
const isPrimaryInstance = app.requestSingleInstanceLock();

if (!isPrimaryInstance) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();

      const urlArg = commandLine.find((arg) =>
        arg.startsWith(`${PROTOCOL_NAME}://`)
      );
      if (urlArg) {
        handleProtocolUrl(urlArg, mainWindow);
      }
    }
  });

  // macOS protocol open-url handler
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      handleProtocolUrl(url, mainWindow);
    }
  });
}

function createWindow() {
  const basePath = getBasePath();
  const preload = path.join(basePath, "preload.js");
  mainWindow = new BrowserWindow({
    backgroundColor: "#07080a",
    height: 780,
    minHeight: 520,
    minWidth: 780,
    title: "xphpMyAdmin Desktop",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
    webPreferences: {
      contextIsolation: true,
      devTools: inDevelopment,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload,
    },
    width: 1240,
  });
  ipcContext.setMainWindow(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(basePath, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Check launch argv for custom protocol deep link
  const urlArg = process.argv.find((arg) =>
    arg.startsWith(`${PROTOCOL_NAME}://`)
  );
  if (urlArg) {
    mainWindow.webContents.once("did-finish-load", () => {
      handleProtocolUrl(urlArg, mainWindow);
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

function checkForUpdates() {
  updateElectronApp({
    updateSource: {
      repo: "LuanRoger/electron-shadcn",
      type: UpdateSourceType.ElectronPublicUpdateService,
    },
  });
}

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

app.whenReady().then(async () => {
  try {
    nativeTheme.themeSource = "dark";
    createWindow();
    registerOAuthIpcHandlers(() => mainWindow);
    await installExtensions();
    checkForUpdates();
    await setupORPC();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
