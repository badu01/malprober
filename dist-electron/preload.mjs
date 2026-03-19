"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("backend", {
  // Example: scanUrl function
  scanUrl: (url) => electron.ipcRenderer.invoke("scan-url", url),
  uploadFile: (filePath) => electron.ipcRenderer.invoke("analysis:upload-file", filePath),
  startAnalysis: (filePath) => electron.ipcRenderer.invoke("analysis:start", filePath),
  getAnalysisStatus: (analysisId) => electron.ipcRenderer.invoke("analysis:status", analysisId),
  getAnalysisResults: (analysisId) => electron.ipcRenderer.invoke("analysis:results", analysisId),
  getVmStatus: () => electron.ipcRenderer.invoke("vm:status"),
  checkBackendHealth: () => electron.ipcRenderer.invoke("backend:health")
});
