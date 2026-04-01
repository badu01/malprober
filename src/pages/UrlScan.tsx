// src/renderer/pages/UrlScan.tsx
import React, { useState } from 'react'
import {
  FiGlobe,
  FiLink,
  FiShield,
  FiAlertTriangle,
  FiLock,
  FiUnlock,
  FiExternalLink,
  FiSearch,
  FiLoader
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import UrlScanResults from '../components/UrlScanResults'
import { useAuth } from '../contexts/AuthContext'
import { scanHistoryService, type CreateScanRecord } from '../renderer/firebase/scanHistoryService'

const UrlScan: React.FC = () => {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const validateUrl = (input: string) => {
    try {
      const urlObj = new URL(input)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    if (!validateUrl(url)) {
      toast.error('Please enter a valid URL (http:// or https://)')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResults(null)

    try {
      const result = await window.backend.scanUrl(url.trim())
      console.log('URL Scan Result:', result)
      setAnalysisResults(result)

      // Extract verdict from result
      const verdictData = result?.verdicts?.overall || result?.verdicts?.engines || {}
      const isMalicious = verdictData?.malicious || false
      const confidence = verdictData?.score || 0
      const verdict: 'malicious' | 'suspicious' | 'safe' = isMalicious ? 'malicious' : confidence > 30 ? 'suspicious' : 'safe'

      // Extract URL-specific info
      const page = result?.page || {}
      const stats = result?.stats || {}
      const lists = result?.lists || {}
      const task = result?.task || {}

      // Save to Firebase with generalized structure
      if (user && result) {
        const explanations = result?.verdicts?.engines?.maliciousVerdicts || []
        const tags = result?.verdicts?.engines?.tags || []

        const scanRecord: CreateScanRecord = {
          type: 'url' as const,
          target: url,
          confidence: confidence,
          verdict: verdict,
          scanData: {
            engines: result?.verdicts?.engines?.enginesTotal || 72,
            detections: stats?.malicious || 0,
            anomalies: [...explanations, ...tags],
            explanations: explanations,
            statistics: {
              total_requests: stats?.totalLinks || 0,
              secure_percentage: stats?.securePercentage || 0,
              ipv6_percentage: stats?.IPv6Percentage || 0,
              total_size: stats?.encodedSize || 0,
              domains: lists?.domains?.length || 0,
              ips: lists?.ips?.length || 0,
              countries: lists?.countries?.length || 0
            },
            urlInfo: {
              domain: page?.domain || task?.domain || new URL(url).hostname,
              protocol: new URL(url).protocol,
              path: new URL(url).pathname,
              ip: page?.ip,
              country: page?.country,
              server: page?.server,
              statusCode: page?.status
            }
          },
          analysisFlow: 'static_only',
          rawResults: JSON.parse(JSON.stringify(result)),
          reportUrl: task?.reportURL || null
        }

        await scanHistoryService.saveScan(scanRecord)
        toast.success('Results saved to history')
      }

      toast.success('URL analysis complete!')

      // Show notification
      if (window.electronAPI) {
        window.electronAPI.showNotification(
          'URL Analysis Complete',
          `Analysis of ${url} completed. Verdict: ${verdict.toUpperCase()}`
        )
      }

    } catch (error: any) {
      console.error('URL scan failed:', error)
      toast.error(error.message || 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const openUrl = () => {
    if (validateUrl(url)) {
      if (window.electronAPI) {
        window.electronAPI.openExternal(url)
      } else {
        window.open(url, '_blank')
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="glass-effect rounded-2xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-[#a5f54a] bg-clip-text text-transparent">
                URL Safety Analysis
              </h1>
              <p className="text-gray-400 mt-2">
                Check websites for malware, phishing, and security threats
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiShield className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-medium">Safe Browsing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - URL Input */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Enter URL to Analyze</h2>
                <p className="text-gray-400">
                  Check websites for security threats before visiting
                </p>
              </div>

              <div className="space-y-6">
                {/* URL Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <FiLink className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-12 pr-4 py-4 bg-black-primary border border-black-secondary rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#a5f54a] focus:ring-2 focus:ring-[#a5f54a]/20"
                    disabled={isAnalyzing}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {url && validateUrl(url) ? (
                      <FiLock className="w-5 h-5 text-[#a5f54a]" />
                    ) : (
                      <FiUnlock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Security Tips */}
                <div className="p-4 bg-black-primary/50 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-400">Security Warning</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Do not visit suspicious URLs. This analysis tool checks for known threats
                        but cannot guarantee complete safety. Always exercise caution when
                        browsing unknown websites.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !url.trim()}
                    className={`flex-1 py-4 px-6 rounded-xl font-medium text-black-primary transition-all flex items-center justify-center space-x-3
                      ${isAnalyzing || !url.trim()
                        ? 'bg-black-primary/50 text-gray-300 border border-black-secondary cursor-not-allowed'
                        : 'bg-[#a5f54a] hover:opacity-90'
                      }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Analyzing URL...</span>
                      </>
                    ) : (
                      <>
                        <FiSearch className="w-5 h-5" />
                        <span>Start Security Analysis</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={openUrl}
                    disabled={!validateUrl(url) || isAnalyzing}
                    className={`py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center space-x-3
                      ${!validateUrl(url) || isAnalyzing
                        ? 'bg-black-primary/50 text-gray-300 cursor-not-allowed'
                        : 'bg-black/60 text-[#a5f54a] hover:bg-black-primary border border-green-main cursor-pointer'
                      }`}
                  >
                    <FiExternalLink className="w-5 h-5" />
                    <span>Open in Browser</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Safety Tips */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Safety Tips</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <FiShield className="w-4 h-4 text-[#a5f54a] mt-0.5 shrink-0" />
                  <span>Check URL before clicking suspicious links</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiLock className="w-4 h-4 text-[#a5f54a] mt-0.5 shrink-0" />
                  <span>Look for HTTPS in sensitive websites</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                  <span>Avoid entering credentials on flagged sites</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiGlobe className="w-4 h-4 text-[#a5f54a] mt-0.5 shrink-0" />
                  <span>Verify domain names for typosquatting</span>
                </li>
              </ul>
            </div>

            {/* Info Card */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>• Checks against threat intelligence databases</p>
                <p>• Analyzes domain reputation and age</p>
                <p>• Scans for known malicious patterns</p>
                <p>• Verifies SSL certificate validity</p>
                <p>• Checks for phishing indicators</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {analysisResults && !isAnalyzing && (
          <div className="mt-8">
            <UrlScanResults results={analysisResults} />
          </div>
        )}
      </div>
    </div>
  )
}

export default UrlScan