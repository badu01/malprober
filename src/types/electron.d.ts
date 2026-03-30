import {
  UploadResponse,
  StartAnalysisResponse,
  AnalysisStatusResponse,
  AnalysisResultsResponse,
  VmStatusResponse,
  BackendHealthResponse
} from './analysis.types';


// src/electron.d.ts
export { };

declare global {
  interface Window {
    electronAPI: {
      // File operations
      openFileDialog: () => Promise<string | null>
      getFileInfo: (filePath: string) => Promise<any>
      saveScanResult: (resultData: any) => Promise<any>
      getScanHistory: () => Promise<any[]>
      clearScanHistory: () => Promise<any>

      // Window operations
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void

      // System operations
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<any>
      getAppVersion: () => Promise<string>
      getPlatform: () => Promise<string>

      // External operations
      openExternal: (url: string) => Promise<any>
      showNotification: (title: string, body: string) => Promise<any>

      // Backend operations
      startPythonBackend: () => Promise<any>
      stopPythonBackend: () => Promise<any>

      // ============ NEW: MALWARE ANALYSIS METHODS ============

      // File analysis operations
      uploadFile: (filePath: string) => Promise<UploadResponse>
      startAnalysis: (filePath: string) => Promise<StartAnalysisResponse>
      getAnalysisStatus: (analysisId: string) => Promise<AnalysisStatusResponse>
      getAnalysisResults: (analysisId: string) => Promise<AnalysisResultsResponse>

      // VM operations
      getVmStatus: () => Promise<VmStatusResponse>

      // Backend operations
      checkBackendHealth: () => Promise<BackendHealthResponse>

      // Event listeners (your existing ones)
      onNewScan: (callback: () => void) => () => void
      onOpenFileDialog: (callback: () => void) => () => void
      onNavigateTo: (callback: (event: any, path: string) => void) => () => void
      onShowAbout: (callback: () => void) => () => void
      removeAllListeners: (channel: string) => void
    },
    backend: {
      scanUrl: (url: string) => Promise<any>
      uploadFile?: (filePath: string) => Promise<UploadResponse>;
      startAnalysis?: (filePath: string) => Promise<StartAnalysisResponse>;
      getAnalysisStatus?: (analysisId: string) => Promise<AnalysisStatusResponse>;
      getAnalysisResults?: (analysisId: string) => Promise<AnalysisResultsResponse>;
      getVmStatus?: () => Promise<VmStatusResponse>;
      checkBackendHealth?: () => Promise<BackendHealthResponse>;
    },
    chatAPI: {
      initializeChat: (
        sessionId: string,
        systemPrompt: string,
        results: any
      ) => Promise<{ success: boolean; message: string }>;

      sendMessage: (
        sessionId: string,
        message: string,
        history: any,
        context: any
      ) => Promise<{ success: boolean; message: string }>;
    };
  }
}

