import { app, shell, BrowserWindow, ipcMain, Notification } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import log from "electron-log/main";
import { loadSettings, saveSettings } from "./store";

log.initialize();
log.info("PXmer starting...");

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 560,
    height: 400,
    resizable: false,
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

  // IPC handlers
  ipcMain.handle("get-settings", () => loadSettings());
  ipcMain.handle("save-settings", (_, settings) => saveSettings(settings));
  ipcMain.handle("show-notification", (_, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    log.info("All windows closed, quitting");
    app.quit();
  }
});
