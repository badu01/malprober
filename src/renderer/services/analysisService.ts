// src/renderer/services/analysisService.ts

import {
  UploadResponse,
  StartAnalysisResponse,
  AnalysisStatusResponse,
  AnalysisResultsResponse,
  VmStatusResponse,
  BackendHealthResponse
} from '../../types/analysis.types';

// Service to handle all malware analysis API calls
class AnalysisService {
  
  /**
   * Upload a file for analysis
   * Usage: const uploadResult = await window.electronAPI.uploadFile(filePath);
   */
  async uploadFile(filePath: string): Promise<UploadResponse> {
    if (!window.electronAPI?.uploadFile) {
      throw new Error('Electron API not available');
    }
    console.log('AnalysisService.uploadFile called with:', filePath); // Debug log
    return await window.electronAPI.uploadFile(filePath);
  }

  /**
   * Start analysis on an uploaded file
   * Usage: const analysis = await window.electronAPI.startAnalysis(filePath);
   */
  async startAnalysis(filePath: string): Promise<StartAnalysisResponse> {
    if (!window.electronAPI?.startAnalysis) {
      throw new Error('Electron API not available');
    }
    console.log('AnalysisService.startAnalysis called with:', filePath); // Debug log
    return await window.electronAPI.startAnalysis(filePath);
  }

  /**
   * Get current status of an analysis
   * Usage: const status = await window.electronAPI.getAnalysisStatus(analysisId);
   */
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
    if (!window.electronAPI?.getAnalysisStatus) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.getAnalysisStatus(analysisId);
  }

  /**
   * Get complete results of an analysis
   * Usage: const results = await window.electronAPI.getAnalysisResults(analysisId);
   */
  async getAnalysisResults(analysisId: string): Promise<AnalysisResultsResponse> {
    if (!window.electronAPI?.getAnalysisResults) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.getAnalysisResults(analysisId);
  }

  /**
   * Get current VM status
   * Usage: const vmStatus = await window.electronAPI.getVmStatus();
   */
  async getVmStatus(): Promise<VmStatusResponse> {
    if (!window.electronAPI?.getVmStatus) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.getVmStatus();
  }

  /**
   * Check if backend is healthy and reachable
   * Usage: const health = await window.electronAPI.checkBackendHealth();
   */
  async checkBackendHealth(): Promise<BackendHealthResponse> {
    if (!window.electronAPI?.checkBackendHealth) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.checkBackendHealth();
  }

  /**
   * Poll analysis status until completion
   * Usage: const results = await analysisService.pollAnalysisStatus(analysisId);
   */
  async pollAnalysisStatus(
    analysisId: string, 
    onProgress?: (status: AnalysisStatusResponse) => void,
    intervalMs: number = 2000
  ): Promise<AnalysisResultsResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getAnalysisStatus(analysisId);
          
          // Call progress callback
          if (onProgress) {
            onProgress(status);
          }

          // Check if analysis is complete or failed
          if (status.found && status.analysis) {
            if (status.analysis.status === 'completed') {
              // Get final results
              const results = await this.getAnalysisResults(analysisId);
              resolve(results);
              return;
            } else if (status.analysis.status === 'failed') {
              reject(new Error(status.analysis.error || 'Analysis failed'));
              return;
            }
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const analysisService = new AnalysisService();