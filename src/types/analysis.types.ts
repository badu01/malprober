// src/types/analysis.types.ts
// Create this new file for type definitions

export interface UploadResponse {
  success: boolean;
  message: string;
  fileInfo: {
    success: boolean;
    original_name: string;
    saved_name: string;
    file_path: string;
    file_hash: string;
    file_size: number;
    file_extension: string;
  };
}

export interface StartAnalysisResponse {
  success: boolean;
  message: string;
  analysisId: string;
  fileInfo: {
    name: string;
    path: string;
    size: number;
    hash: string;
  };
}

export interface AnalysisEvent {
  status: string;
  message: string;
  timestamp: string;
  data?: any;
}

export interface AnalysisStatusResponse {
  found: boolean;
  analysis?: {
    id: string;
    status: 'starting' | 'restoring' | 'starting_vm' | 'booting' | 
            'copying' | 'executing' | 'monitoring' | 'shutting_down' | 
            'collecting_logs' | 'completed' | 'failed';
    file_info: any;
    events: AnalysisEvent[];
    start_time?: number;
    end_time?: number;
    current_step?: number;
    total_steps?: number;
    error?: string;
  };
}

export interface AnalysisResultsResponse {
  found: boolean;
  summary?: {
    analysis_id: string;
    file_name: string;
    file_hash: string;
    file_size: number;
    analysis_start: number;
    analysis_end: number;
    status: string;
    vm_name: string;
    analysis_duration: number;
    logs: any[];
  };
  log_files?: string[];
  log_directory?: string;
}

export interface VmStatusResponse {
  vmName: string;
  state: string;
  running: boolean;
  timestamp: string;
}

export interface BackendHealthResponse {
  healthy: boolean;
  status?: string;
  service?: string;
  timestamp?: string;
  vm_configured?: boolean;
  snapshot_configured?: boolean;
  error?: string;
}