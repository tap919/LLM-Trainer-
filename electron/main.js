const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;
let pythonProcess = null;

const rootPath = path.join(__dirname, "..");
const pythonDir = path.join(rootPath, "python");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (pythonProcess) {
    const proc = pythonProcess;
    proc.kill("SIGTERM");
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
    }, 2000).unref();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("select-dataset", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Dataset Files", extensions: ["jsonl", "json", "parquet", "csv"] },
    ],
  });
  return result.filePaths;
});

ipcMain.handle("launch-experiment", async (_event, config) => {
  const configPath = path.join(rootPath, "configs", "experiments.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  const scriptPath = path.join(pythonDir, "experiment_manager.py");
  const args = [scriptPath, "--config", configPath];
  if (config?.experimentId) {
    args.push("--experiment-id", config.experimentId);
  }

  return new Promise((resolve, reject) => {
    pythonProcess = spawn("python3", args, { cwd: pythonDir });

    pythonProcess.stdout.on("data", (data) => {
      mainWindow.webContents.send("experiment-log", data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      mainWindow.webContents.send("experiment-error", data.toString());
    });

    pythonProcess.on("close", (code) => {
      pythonProcess = null;
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject(new Error(`Experiment failed with code ${code}`));
      }
    });
  });
});

ipcMain.handle("sync-results", async () => {
  const scriptPath = path.join(pythonDir, "cloud_orchestrator.py");
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "python3",
      [scriptPath, "--action", "sync", "--source", "../results", "--destination", "../results/synced"],
      { cwd: pythonDir }
    );

    let output = "";
    let err = "";
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, message: output.trim() });
      } else {
        reject(new Error(err || "Sync failed"));
      }
    });
  });
});

ipcMain.handle("generate-insights", async (_event, experimentId) => {
  const scriptPath = path.join(pythonDir, "insights_engine.py");
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", [scriptPath, "--experiment-id", experimentId], {
      cwd: pythonDir,
    });

    let output = "";
    let err = "";
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output.trim() || "{}");
          resolve(parsed);
        } catch (e) {
          resolve({ message: output.trim() });
        }
      } else {
        reject(new Error(err || "Insight generation failed"));
      }
    });
  });
});
