import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./constants";

window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [serverPort]);
  }
});

contextBridge.exposeInMainWorld("electronOAuth", {
  onOAuthCallback: (
    callback: (data: { provider?: string; token: string; user: any }) => void
  ) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on("oauth-callback", listener);
    return () => {
      ipcRenderer.removeListener("oauth-callback", listener);
    };
  },
  startOAuth: (provider: string) => {
    return ipcRenderer.invoke("start-oauth", provider);
  },
});
