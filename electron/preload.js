const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectDataset: () => ipcRenderer.invoke("select-dataset"),
  launchExperiment: (config) => ipcRenderer.invoke("launch-experiment", config),
  syncResults: () => ipcRenderer.invoke("sync-results"),
  generateInsights: (experimentId) => ipcRenderer.invoke("generate-insights", experimentId),
  onExperimentLog: (callback) => ipcRenderer.on("experiment-log", (_event, data) => callback(data)),
  onExperimentError: (callback) =>
    ipcRenderer.on("experiment-error", (_event, data) => callback(data)),
});
