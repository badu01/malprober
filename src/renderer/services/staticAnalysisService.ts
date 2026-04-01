// src/renderer/services/staticAnalysisService.ts

import axios from 'axios';

export interface StaticAnalysisResult {
  success: boolean;
  isMalicious: boolean;
  confidence: number;
  prediction: string; // 'malicious' | 'benign' | 'suspicious'
  probabilities?: {
    benign: number;
    malicious: number;
  };
  message?: string;
  error?: string;
}

class StaticAnalysisService {
  private staticApiUrl: string = '';

  constructor() {
    // This URL will come from your teammate's ngrok tunnel
    // You can also make this configurable in Settings
    this.staticApiUrl = localStorage.getItem('static_api_url') || 'http://localhost:5001';
  }

  setApiUrl(url: string) {
    this.staticApiUrl = url;
    localStorage.setItem('static_api_url', url);
  }

  /**
   * Send file to teammate's ML model for static analysis
   */
  async analyzeFileStatic(file: File): Promise<StaticAnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending file for static analysis to:', `${this.staticApiUrl}/analyze`);

      const response = await axios.post(`${this.staticApiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for ML inference
      });

      // Parse response based on your teammate's API format
      // You'll need to adjust this based on her actual response structure
      const data = response.data;
      
      // Assuming her API returns something like:
      // { status: "malicious", confidence: 0.95, message: "..." }
      // OR
      // { prediction: "benign", probability: 0.92 }
      
      const isMalicious = data.status === 'malicious' || 
                          data.prediction === 'malicious' ||
                          data.is_malicious === true;
      
      const confidence = data.confidence || data.probability || 0;
      
      return {
        success: true,
        isMalicious: isMalicious,
        confidence: typeof confidence === 'number' ? confidence * 100 : confidence,
        prediction: isMalicious ? 'malicious' : 'benign',
        probabilities: data.probabilities,
        message: data.message || (isMalicious ? 'Static analysis indicates malicious behavior' : 'Static analysis indicates benign file')
      };
      
    } catch (error: any) {
      console.error('Static analysis failed:', error);
      
      let errorMessage = 'Failed to connect to static analysis server';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot reach ML analysis server. Please check if ngrok tunnel is active.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return {
        success: false,
        isMalicious: false,
        confidence: 0,
        prediction: 'unknown',
        error: errorMessage
      };
    }
  }

  /**
   * Check if static analysis server is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      await axios.get(`${this.staticApiUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export const staticAnalysisService = new StaticAnalysisService();