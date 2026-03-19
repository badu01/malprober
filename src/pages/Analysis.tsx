// src/renderer/pages/Analysis.tsx
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  FiArrowLeft,
  FiDownload,
  FiShare,
  FiPrinter,
  FiCopy,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiShield,
  FiClock,
  FiFile,
  FiGlobe
} from 'react-icons/fi'
import { useScan } from '../contexts/ScanContext'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { toast } from 'react-toastify'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const Analysis: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { getScan } = useScan()
  const [scan, setScan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const scanData = getScan(id)
      if (scanData) {
        setScan(scanData)
      } else {
        // Try to fetch from localStorage or mock data
        const allScans = localStorage.getItem('malware_analyzer_scans')
        if (allScans) {
          const scans = JSON.parse(allScans)
          const found = scans.find((s: any) => s.id === id)
          if (found) {
            setScan(found)
          }
        }
      }
      setLoading(false)
    }
  }, [id, getScan])

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon')
    // In real app, implement PDF generation
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Analysis Report: ${scan?.filename || scan?.target}`,
        text: `Check out this malware analysis report. Verdict: ${scan?.verdict}, Confidence: ${scan?.confidence}%`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyReport = () => {
    const report = JSON.stringify(scan, null, 2)
    navigator.clipboard.writeText(report)
    toast.success('Report copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading analysis report...</p>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="text-center py-12">
        <FiAlertTriangle className="w-16 h-16 text-yellow-400 mx-auto" />
        <h2 className="text-2xl font-bold mt-4">Analysis Not Found</h2>
        <p className="text-gray-400 mt-2">The requested analysis report could not be found.</p>
        <Link to="/history">
          <button className="mt-6 px-6 py-3 bg-linear-to-r from-green-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity">
            Back to History
          </button>
        </Link>
      </div>
    )
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'safe': return 'from-green-500 to-emerald-500'
      case 'suspicious': return 'from-yellow-500 to-amber-500'
      case 'malicious': return 'from-red-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getVerdictIcon = (verdict: string) => {
    return verdict === 'safe' ? FiCheckCircle : FiAlertTriangle
  }

  const VerdictIcon = getVerdictIcon(scan.verdict)

  // Prepare chart data
  const chartData = {
    labels: ['Safe', 'Suspicious', 'Malicious'],
    datasets: [{
      data: [
        scan.verdict === 'safe' ? 100 : 0,
        scan.verdict === 'suspicious' ? 100 : 0,
        scan.verdict === 'malicious' ? 100 : 0
      ],
      backgroundColor: [
        'rgb(34, 197, 94)',
        'rgb(234, 179, 8)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 0,
    }]
  }

  const timelineSteps = [
    { step: 'File Uploaded', time: '0:00', status: 'completed' },
    { step: 'Initial Analysis', time: '0:15', status: 'completed' },
    { step: 'VirusTotal Scan', time: '0:45', status: 'completed' },
    { step: 'Behavior Analysis', time: '1:30', status: 'completed' },
    { step: 'Report Generated', time: '2:00', status: 'completed' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/history">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <FiArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Analysis Report</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  {scan.type === 'file' ? (
                    <FiFile className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FiGlobe className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-gray-400">{scan.type.toUpperCase()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">
                    {new Date(scan.timestamp).toLocaleDateString()} at{' '}
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiShare className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiPrinter className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiCopy className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Target Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <p className="text-sm text-gray-400">Target</p>
                <p className="font-medium truncate">{scan.filename || scan.target}</p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <p className="text-sm text-gray-400">Analysis Type</p>
                <p className="font-medium">{scan.type === 'file' ? 'File Analysis' : 'URL Analysis'}</p>
              </div>
              {scan.details?.fileInfo && (
                <>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <p className="text-sm text-gray-400">File Size</p>
                    <p className="font-medium">
                      {(scan.details.fileInfo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <p className="text-sm text-gray-400">File Hash (SHA-256)</p>
                    <p className="font-mono text-sm truncate">
                      {scan.details.fileInfo.hash?.substring(0, 32)}...
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Verdict & Confidence */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className={`p-4 rounded-xl bg-linear-to-r ${getVerdictColor(scan.verdict)}`}>
                  <VerdictIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Verdict: {scan.verdict.toUpperCase()}</h3>
                  <p className="text-gray-400">Security assessment result</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold">{scan.confidence}%</div>
                <div className="text-gray-400">Confidence Score</div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
            
            <div className="space-y-6">
              {/* Chart */}
              <div className="h-48">
                <Doughnut 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: '#9ca3af',
                          font: {
                            size: 12
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Engine Results */}
              <div>
                <h3 className="font-medium mb-3">Scan Engine Results</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Engines</span>
                    <span className="font-medium">{scan.details?.engines || 72}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Positive Detections</span>
                    <span className="font-medium text-red-400">
                      {scan.details?.detections || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Detection Rate</span>
                    <span className="font-medium">
                      {scan.details?.engines 
                        ? `${((scan.details?.detections || 0) / scan.details.engines * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanations */}
              <div>
                <h3 className="font-medium mb-3">Key Findings</h3>
                <div className="space-y-2">
                  {scan.details?.explanations?.map((explanation: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg">
                      <FiInfo className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-gray-300">{explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Analysis Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Analysis Timeline</h3>
            <div className="space-y-4">
              {timelineSteps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    step.status === 'completed' 
                      ? 'bg-green-500' 
                      : 'bg-gray-700'
                  }`}>
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.step}</p>
                    <p className="text-sm text-gray-400">{step.time}</p>
                  </div>
                  {step.status === 'completed' && (
                    <FiCheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FiShield className="w-4 h-4 text-green-400" />
                  <span className="font-medium">Immediate Action</span>
                </div>
                <p className="text-sm text-gray-400">
                  {scan.verdict === 'malicious' 
                    ? 'Delete the file immediately and run a full system scan.'
                    : scan.verdict === 'suspicious'
                    ? 'Run the file in a sandboxed environment before execution.'
                    : 'File appears safe for normal use.'
                  }
                </p>
              </div>

              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FiAlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">Preventive Measures</span>
                </div>
                <p className="text-sm text-gray-400">
                  Keep your antivirus updated and avoid downloading files from untrusted sources.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Report ID:</span>
                <span className="font-mono">{scan.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Analysis Duration:</span>
                <span>2 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Data Sources:</span>
                <span>VirusTotal, Hybrid Analysis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Report Version:</span>
                <span>1.0</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Link to={scan.type === 'file' ? '/file-scan' : '/url-scan'}>
                <button className="w-full py-2 px-4 bg-linear-to-r from-green-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity">
                  New Analysis
                </button>
              </Link>
              <Link to="/history">
                <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  Back to History
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">
              This report was generated by SecureScan Pro Malware Analyzer
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Report generated on {new Date().toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <FiShield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Secure Analysis Complete</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analysis