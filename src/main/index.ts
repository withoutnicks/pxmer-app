import { app, shell, BrowserWindow } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import log from "electron-log/main";
import { registerIpcHandlers } from "./ipc";
import type { SessionController } from "./session";

log.initialize();
log.info("PXmer starting...");

let mainWindow: BrowserWindow | null = null;
// Se asigna en whenReady; antes de eso los handlers aún no existen.
let session: SessionController | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 560,
    height: 400,
    autoHideMenuBar: true,
    backgroundColor: "#0d0d0d",
    title: "",
    icon: join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    log.info("Window ready to show");
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  log.info("Window created");
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.pxmer.app");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  session = registerIpcHandlers(() => mainWindow);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  session?.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    log.info("All windows closed, quitting");
    app.quit();
  }
});
