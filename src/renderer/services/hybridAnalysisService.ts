// src/renderer/services/hybridAnalysisService.ts

import { staticAnalysisService, StaticAnalysisResult } from './staticAnalysisService';
import { analysisService } from './analysisService';

export interface HybridAnalysisOptions {
  forceDynamic?: boolean; // Force dynamic even if static says benign
  skipDynamicIfBenign?: boolean; // Skip dynamic completely if benign
}

export interface HybridAnalysisResult {
  staticResult: StaticAnalysisResult | null;
  dynamicResult: any | null;
  finalVerdict: 'malicious' | 'benign' | 'suspicious' | 'error';
  finalConfidence: number;
  analysisFlow: 'static_only' | 'static_then_dynamic' | 'dynamic_only' | 'error';
  recommendations: string[];
}

class HybridAnalysisService {
  
  /**
   * Main entry point for file analysis
   * Step 1: Run static analysis (ML model)
   * Step 2: Decide if dynamic analysis is needed
   */
  async analyzeFile(
    file: File,
    filePath: string,
    options: HybridAnalysisOptions = {}
  ): Promise<HybridAnalysisResult> {
    
    console.log('Starting hybrid analysis for:', file.name);
    
    // Step 1: Static Analysis
    console.log('Step 1: Running static analysis (ML model)...');
    const staticResult = await staticAnalysisService.analyzeFileStatic(file);
    
    if (!staticResult.success) {
      // If static analysis fails, ask user if they want to proceed with dynamic
      const shouldProceed = await this.showStaticFailureDialog(staticResult.error);
      if (!shouldProceed) {
        return {
          staticResult,
          dynamicResult: null,
          finalVerdict: 'error',
          finalConfidence: 0,
          analysisFlow: 'error',
          recommendations: ['Static analysis server unavailable. Please check connection.']
        };
      }
      // User wants to proceed with dynamic only
      return await this.runDynamicOnly(filePath);
    }
    
    // Step 2: Decision based on static result
    const decision = this.makeAnalysisDecision(staticResult, options);
    
    console.log('Analysis decision:', decision);
    
    let dynamicResult = null;
    let finalVerdict = staticResult.prediction as 'malicious' | 'benign' | 'suspicious';
    let finalConfidence = staticResult.confidence;
    let recommendations: string[] = [];
    
    // Step 3: Run dynamic analysis if needed
    if (decision.runDynamic) {
      console.log('Step 2: Running dynamic analysis (VM)...');
      const shouldRunDynamic = await this.confirmDynamicAnalysis(decision.reason, decision.isForced);
      
      if (shouldRunDynamic) {
        dynamicResult = await this.runDynamicAnalysis(filePath);
        
        // Combine static and dynamic results
        const combined = this.combineResults(staticResult, dynamicResult);
        finalVerdict = combined.verdict;
        finalConfidence = combined.confidence;
        recommendations = combined.recommendations;
      } else {
        recommendations.push('Dynamic analysis was skipped by user. Static analysis results only.');
      }
    } else {
      recommendations.push('Static analysis determined the file is safe. No dynamic analysis performed.');
      recommendations.push(staticResult.message || 'File appears benign based on ML classification.');
    }
    
    return {
      staticResult,
      dynamicResult,
      finalVerdict,
      finalConfidence,
      analysisFlow: decision.runDynamic ? 'static_then_dynamic' : 'static_only',
      recommendations
    };
  }
  
  /**
   * Make decision about whether to run dynamic analysis
   */
  private makeAnalysisDecision(
    staticResult: StaticAnalysisResult,
    options: HybridAnalysisOptions
  ): { runDynamic: boolean; reason: string; isForced: boolean } {
    
    // Force dynamic if explicitly requested
    if (options.forceDynamic) {
      return { runDynamic: true, reason: 'User requested full dynamic analysis', isForced: true };
    }
    
    // Skip dynamic if benign and configured to skip
    if (options.skipDynamicIfBenign && !staticResult.isMalicious) {
      return { runDynamic: false, reason: 'File appears benign, skipping dynamic analysis', isForced: false };
    }
    
    // File is malicious - ALWAYS force dynamic analysis
    if (staticResult.isMalicious) {
      return { 
        runDynamic: true, 
        reason: `Static analysis detected MALICIOUS behavior (${staticResult.confidence.toFixed(1)}% confidence). Dynamic analysis REQUIRED for detailed report.`, 
        isForced: true 
      };
    }
    
    // Suspicious case (high confidence benign but not 100%)
    if (staticResult.confidence < 80 && staticResult.confidence > 50) {
      return { 
        runDynamic: true, 
        reason: `Static analysis shows SUSPICIOUS indicators (${staticResult.confidence.toFixed(1)}% confidence). Recommended to run dynamic analysis.`, 
        isForced: false 
      };
    }
    
    // Benign - give user choice
    return { 
      runDynamic: false, 
      reason: 'Static analysis shows BENIGN. Dynamic analysis is optional.', 
      isForced: false 
    };
  }
  
  /**
   * Show dialog asking user if they want to run dynamic analysis
   */
  private async confirmDynamicAnalysis(reason: string, isForced: boolean): Promise<boolean> {
    // If forced, no need to ask
    if (isForced) {
      return true;
    }
    
    // In Electron, show a dialog
    if (window.electronAPI) {
      // You'll need to implement a custom dialog or use confirm()
      // For now, using browser confirm (will be replaced with custom modal)
      return new Promise((resolve) => {
        const userConfirmed = confirm(`${reason}\n\nDo you want to run dynamic analysis in VM? This will take 2-5 minutes.`);
        resolve(userConfirmed);
      });
    }
    
    // Fallback to confirm
    return confirm(`${reason}\n\nRun dynamic analysis?`);
  }
  
  /**
   * Show dialog when static analysis fails
   */
  private async showStaticFailureDialog(error?: string): Promise<boolean> {
    const message = `Static analysis server unavailable.\n\n${error || 'Please check if the ML backend is running and ngrok tunnel is active.'}\n\nContinue with dynamic analysis only?`;
    return confirm(message);
  }
  
  /**
   * Run only dynamic analysis (fallback when static fails)
   */
  private async runDynamicOnly(filePath: string): Promise<HybridAnalysisResult> {
    try {
      const dynamicResult = await this.runDynamicAnalysis(filePath);
      return {
        staticResult: null,
        dynamicResult,
        finalVerdict: dynamicResult?.analysis_result?.verdict || 'unknown',
        finalConfidence: dynamicResult?.analysis_result?.confidence || 0,
        analysisFlow: 'dynamic_only',
        recommendations: ['Static analysis was skipped. Results based on dynamic behavior only.']
      };
    } catch (error) {
      return {
        staticResult: null,
        dynamicResult: null,
        finalVerdict: 'error',
        finalConfidence: 0,
        analysisFlow: 'error',
        recommendations: ['Both static and dynamic analysis failed. Please try again.']
      };
    }
  }
  
  /**
   * Run dynamic analysis using existing VM backend
   */
  private async runDynamicAnalysis(filePath: string): Promise<any> {
    // This uses your existing analysisService
    try {
      // Upload file
      const uploadResult = await analysisService.uploadFile(filePath);
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }
      
      // Start analysis
      const analysisResult = await analysisService.startAnalysis(uploadResult.fileInfo.file_path);
      if (!analysisResult.success) {
        throw new Error(analysisResult.message || 'Failed to start analysis');
      }
      
      // Poll for completion
      const results = await analysisService.pollAnalysisStatus(analysisResult.analysisId);
      return results;
      
    } catch (error) {
      console.error('Dynamic analysis failed:', error);
      throw error;
    }
  }
  
  /**
   * Combine static and dynamic results for final verdict
   */
  private combineResults(staticResult: StaticAnalysisResult, dynamicResult: any): {
    verdict: 'malicious' | 'benign' | 'suspicious';
    confidence: number;
    recommendations: string[];
  } {
    const dynamicVerdict = dynamicResult?.analysis_result?.verdict;
    const dynamicConfidence = dynamicResult?.analysis_result?.confidence || 0;
    const staticConfidence = staticResult.confidence;
    const isStaticMalicious = staticResult.isMalicious;
    
    let verdict: 'malicious' | 'benign' | 'suspicious' = 'benign';
    let confidence = 0;
    const recommendations: string[] = [];
    
    // Both agree malicious
    if (isStaticMalicious && dynamicVerdict === 'malicious') {
      verdict = 'malicious';
      confidence = (staticConfidence + dynamicConfidence) / 2;
      recommendations.push('⚠️ CONFIRMED MALICIOUS: Both static ML and dynamic analysis indicate malicious behavior.');
      recommendations.push('Recommended action: Quarantine file immediately and revoke any network access.');
    }
    // Static says malicious, dynamic says benign (possible evasion)
    else if (isStaticMalicious && dynamicVerdict === 'benign') {
      verdict = 'suspicious';
      confidence = staticConfidence * 0.8;
      recommendations.push('⚠️ SUSPICIOUS: Static ML indicates malicious but dynamic analysis shows benign behavior.');
      recommendations.push('Possible evasion techniques detected. Manual review recommended.');
    }
    // Static says benign, dynamic says malicious (possible zero-day)
    else if (!isStaticMalicious && dynamicVerdict === 'malicious') {
      verdict = 'malicious';
      confidence = dynamicConfidence;
      recommendations.push('⚠️ MALICIOUS BEHAVIOR DETECTED: Dynamic analysis revealed malicious activity despite static ML classification.');
      recommendations.push('This may be a zero-day or obfuscated malware. Immediate action required.');
    }
    // Both agree benign
    else if (!isStaticMalicious && dynamicVerdict === 'benign') {
      verdict = 'benign';
      confidence = (staticConfidence + dynamicConfidence) / 2;
      recommendations.push('✓ File appears SAFE: Both static and dynamic analysis show no malicious indicators.');
    }
    // Only static analysis available
    else if (!dynamicResult) {
      verdict = isStaticMalicious ? 'malicious' : 'benign';
      confidence = staticConfidence;
      recommendations.push(`Analysis based on static ML only. ${isStaticMalicious ? 'Exercise caution.' : 'Dynamic analysis was not performed.'}`);
    }
    
    return { verdict, confidence, recommendations };
  }
}

export const hybridAnalysisService = new HybridAnalysisService();