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
  FiClock,
  FiSearch
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import AnalysisProgress from '../components/AnalysisProgress'
import ResultsDisplay from '../components/ResultsDisplay'

const UrlScan: React.FC = () => {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [recentScans, setRecentScans] = useState([
    { url: 'https://google.com', safe: true, time: '2 hours ago' },
    { url: 'https://suspicious-site.net', safe: false, time: '1 day ago' },
    { url: 'https://github.com', safe: true, time: '3 days ago' },
  ])

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
    setProgress(10)

    const result = await window.backend.scanUrl(url.trim());
    console.log(result);
    

    setProgress(20)

    try {
      // Simulate progress
      // const progressInterval = setInterval(() => {
      //   setProgress(prev => {
      //     if (prev >= 90) {
      //       clearInterval(progressInterval)
      //       return 90
      //     }
      //     return prev + 15
      //   })
      // }, 400)

      // Send to backend API
      // const response = await axios.post('https://urlscan.io/api/v1/scan', {
      //   url: url.trim(),
      //   visibility: 'private',
      // },
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'API-Key': process.env.URLSCAN_API_KEY || ''
      //     }
      //   })

      // console.log('URLScan Response:', response.data)

      // clearInterval(progressInterval)
      // setProgress(100)

      // Simulate results (in real app, use actual response)
      const mockResults = {
        confidence: Math.random() > 0.5 ? 85 : 35,
        verdict: Math.random() > 0.7 ? 'malicious' : Math.random() > 0.4 ? 'suspicious' : 'safe',
        explanations: [
          'Domain registered 1 year ago',
          'Valid SSL certificate detected',
          'No known phishing patterns identified',
          'Low reputation score from web crawlers'
        ],
        details: {
          engines: 72,
          detections: Math.floor(Math.random() * 10),
          urlInfo: {
            domain: new URL(url).hostname,
            protocol: new URL(url).protocol,
            path: new URL(url).pathname
          }
        }
      }

      setAnalysisResults(mockResults)

      // Add to recent scans
      setRecentScans(prev => [{
        url: url,
        safe: mockResults.verdict === 'safe',
        time: 'Just now'
      }, ...prev.slice(0, 2)])

      toast.success('URL analysis complete!')

      // Show notification
      if (window.electronAPI) {
        window.electronAPI.showNotification(
          'URL Analysis Complete',
          `Analysis of ${url} completed. Verdict: ${mockResults.verdict}`
        )
      }

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Analysis failed')
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
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing... {progress}%</span>
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
                    disabled={!validateUrl(url)}
                    className={`py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center space-x-3
                      ${!validateUrl(url)
                        ? 'bg-black-primary/50 text-gray-300s cursor-not-allowed'
                        : 'bg-black/60 text-[#a5f54a] hover:bg-black/80 cursor-pointer'
                      }`}
                  >
                    <FiExternalLink className="w-5 h-5" />
                    <span>Open in Browser</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Analysis Progress */}
            {
              isAnalyzing && (
                <div className="card mt-6">
                  <AnalysisProgress
                    currentStep={Math.floor(progress / 25)}
                    steps={['URL Validation', 'Domain Reputation', 'Threat Database', 'Final Report']}
                    progress={progress}
                    status="Analyzing URL security..."
                  />
                </div>
              )}
          </div>

          {/* Right Column - Recent Scans & Stats */}
          <div className="space-y-6">
            {/* Recent Scans */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent URL Scans</h3>
              <div className="space-y-3">
                {recentScans.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-black-primary rounded-lg hover:bg-black-primary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {scan.safe ? (
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FiShield className="w-4 h-4 text-green-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <FiAlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{scan.url}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <FiClock className="w-3 h-3" />
                          <span>{scan.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-gray-700">
                      {scan.safe ? 'Safe' : 'Risky'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Indicators */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Safety Indicators</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">SSL Certificate</span>
                    <span className="text-green-400 font-medium">Secure</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="w-4/5 bg-green-500 h-2 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Domain Age</span>
                    <span className="text-yellow-400 font-medium">1+ Year</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="w-3/4 bg-yellow-500 h-2 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Phishing Risk</span>
                    <span className="text-red-400 font-medium">Low</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="w-1/4 bg-red-500 h-2 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">URLs Analyzed</p>
                  <p className="text-2xl font-bold mt-1">1,048</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FiGlobe className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {analysisResults && (
          <div className="mt-8">
            <ResultsDisplay results={analysisResults} />
          </div>
        )}
      </div>
    </div>
  )
}

export default UrlScan