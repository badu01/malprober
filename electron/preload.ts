import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...

});

// --------- Expose backend API to the Renderer process ---------
contextBridge.exposeInMainWorld('backend', {
  // Example: scanUrl function
  scanUrl: (url: string) => ipcRenderer.invoke('scan-url', url),
  uploadFile: (filePath: string) => ipcRenderer.invoke('analysis:upload-file', filePath),
  startAnalysis: (filePath: string) => ipcRenderer.invoke('analysis:start', filePath),
  getAnalysisStatus: (analysisId: string) => ipcRenderer.invoke('analysis:status', analysisId),
  getAnalysisResults: (analysisId: string) => ipcRenderer.invoke('analysis:results', analysisId),
  getVmStatus: () => ipcRenderer.invoke('vm:status'),
  checkBackendHealth: () => ipcRenderer.invoke('backend:health')
})
contextBridge.exposeInMainWorld('chatAPI', {
  initializeChat: (sessionId: string, systemPrompt: string, results: any) =>
    ipcRenderer.invoke('chat:initialize', { sessionId, systemPrompt, results }),

  sendMessage: (sessionId: string, message: string, history: any, context: any) =>
    ipcRenderer.invoke('chat:message', { sessionId, message, history, context })
});
