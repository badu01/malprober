// src/renderer/components/UrlScanResults.tsx
import React, { useState } from 'react'
import {
  FiGlobe,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiServer,
  FiMapPin,
  FiLink,
  FiClock,
  FiLock,
  FiDownload,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiActivity,
  FiCpu,
  FiDatabase
} from 'react-icons/fi'
import { toast } from 'react-toastify'

interface UrlScanResultsProps {
  results: any
}

const UrlScanResults: React.FC<UrlScanResultsProps> = ({ results }) => {
  const [showRawData, setShowRawData] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    page: true,
    requests: false,
    security: false,
    verdicts: true
  })

  const page = results?.page || {}
  const verdicts = results?.verdicts || {}
  const stats = results?.stats || {}
  const lists = results?.lists || {}
  const meta = results?.meta || {}
  const task = results?.task || {}
  const timing = results?.timing || {}

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleCopyResults = () => {
    const text = JSON.stringify(results, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `urlscan-${task?.uuid || Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Results exported')
  }

  const getVerdictColor = () => {
    const isMalicious = verdicts?.overall?.malicious || verdicts?.engines?.malicious
    if (isMalicious) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'MALICIOUS' }
    if (verdicts?.overall?.score > 30) return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'SUSPICIOUS' }
    return { text: 'text-[#a5f54a]', bg: 'bg-[#a5f54a]/10', border: 'border-[#a5f54a]/20', label: 'CLEAN' }
  }

  const verdictStyle = getVerdictColor()
  const isMalicious = verdicts?.overall?.malicious || verdicts?.engines?.malicious

  const formatDate = (timestamp: string) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Header with Verdict */}
      <div className={`rounded-xl border ${verdictStyle.border} bg-[#141414] p-5`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${verdictStyle.bg}`}>
              {isMalicious ? (
                <FiAlertTriangle className={`w-6 h-6 ${verdictStyle.text}`} />
              ) : (
                <FiShield className={`w-6 h-6 ${verdictStyle.text}`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">URL Analysis Complete</h2>
              <div className="flex items-center gap-2 mt-1">
                <FiLink className="w-3 h-3 text-gray-500" />
                <span className="text-sm text-gray-400 truncate max-w-md">{page?.url || task?.url}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg border ${verdictStyle.border} ${verdictStyle.bg}`}>
              <span className={`font-semibold ${verdictStyle.text}`}>{verdictStyle.label}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-white">{verdicts?.overall?.score || 0}</div>
              <div className="text-xs text-gray-500">Security Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportResults}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-gray-300 rounded-lg text-sm transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleCopyResults}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-gray-300 rounded-lg text-sm transition-colors"
          >
            <FiCopy className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-gray-300 rounded-lg text-sm transition-colors"
          >
            {showRawData ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            <span>{showRawData ? 'Hide Raw' : 'Raw Data'}</span>
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FiInfo className="w-5 h-5 text-[#a5f54a]" />
            <h3 className="font-medium text-white">Analysis Summary</h3>
          </div>
          {expandedSections.summary ? <FiChevronUp className="w-4 h-4 text-gray-500" /> : <FiChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.summary && (
          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Title</div>
              <div className="text-sm text-white truncate">{page?.title || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Domain</div>
              <div className="text-sm text-white">{page?.domain || task?.domain || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="text-sm text-white">{page?.status || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Server</div>
              <div className="text-sm text-white">{page?.server || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">IP Address</div>
              <div className="text-sm font-mono text-white">{page?.ip || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Country</div>
              <div className="text-sm text-white">{page?.country || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">ASN</div>
              <div className="text-sm text-white truncate">{page?.asnname?.split('-')[0] || page?.asn || 'N/A'}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Scan Time</div>
              <div className="text-sm text-white">{formatDate(task?.time)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Page Information */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <button
          onClick={() => toggleSection('page')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FiGlobe className="w-5 h-5 text-[#a5f54a]" />
            <h3 className="font-medium text-white">Page Information</h3>
          </div>
          {expandedSections.page ? <FiChevronUp className="w-4 h-4 text-gray-500" /> : <FiChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.page && (
          <div className="p-4 pt-0 space-y-3">
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Full URL</div>
              <div className="text-sm text-white break-all font-mono">{page?.url || task?.url}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">MIME Type</div>
                <div className="text-sm text-white">{page?.mimeType || 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Language</div>
                <div className="text-sm text-white">{page?.language || 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">PTR Record</div>
                <div className="text-sm text-white truncate">{page?.ptr || 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">TLS Valid Until</div>
                <div className="text-sm text-white">{page?.tlsValidDays ? `${page.tlsValidDays} days` : 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Certificates */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <button
          onClick={() => toggleSection('security')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FiLock className="w-5 h-5 text-[#a5f54a]" />
            <h3 className="font-medium text-white">Security Details</h3>
          </div>
          {expandedSections.security ? <FiChevronUp className="w-4 h-4 text-gray-500" /> : <FiChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.security && (
          <div className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Protocol</div>
                <div className="text-sm text-white">{page?.tlsValidFrom ? 'TLS 1.3' : 'Unknown'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Issuer</div>
                <div className="text-sm text-white">{page?.tlsIssuer || 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Valid From</div>
                <div className="text-sm text-white">{page?.tlsValidFrom ? new Date(page.tlsValidFrom).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Valid To</div>
                <div className="text-sm text-white">{page?.tlsValidTo ? new Date(page.tlsValidTo).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
            {lists?.certificates && lists.certificates.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2">Certificate Chain</div>
                <div className="space-y-2">
                  {lists.certificates.map((cert: any, idx: number) => (
                    <div key={idx} className="text-xs font-mono text-gray-400 break-all">
                      {cert.subjectName} ({cert.issuer})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verdicts */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <button
          onClick={() => toggleSection('verdicts')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-5 h-5 text-[#a5f54a]" />
            <h3 className="font-medium text-white">Detection Results</h3>
          </div>
          {expandedSections.verdicts ? <FiChevronUp className="w-4 h-4 text-gray-500" /> : <FiChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.verdicts && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-2xl font-semibold text-white">{stats?.malicious || 0}</div>
                <div className="text-xs text-gray-500">Malicious Detections</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-2xl font-semibold text-white">{verdicts?.engines?.enginesTotal || 0}</div>
                <div className="text-xs text-gray-500">Engines Checked</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-2xl font-semibold text-white">{verdicts?.overall?.score || 0}</div>
                <div className="text-xs text-gray-500">Risk Score</div>
              </div>
            </div>

            {verdicts?.engines?.maliciousVerdicts?.length > 0 && (
              <div className="bg-red-500/5 rounded-lg border border-red-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Threat Intelligence Matches</span>
                </div>
                <div className="space-y-1">
                  {verdicts.engines.maliciousVerdicts.map((v: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-400">{v}</div>
                  ))}
                </div>
              </div>
            )}

            {verdicts?.engines?.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {verdicts.engines.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 text-xs rounded-full bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Statistics */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <button
          onClick={() => toggleSection('requests')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FiActivity className="w-5 h-5 text-[#a5f54a]" />
            <h3 className="font-medium text-white">Network Activity</h3>
            <span className="text-xs text-gray-500">{stats?.securePercentage || 0}% Secure</span>
          </div>
          {expandedSections.requests ? <FiChevronUp className="w-4 h-4 text-gray-500" /> : <FiChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.requests && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">{stats?.totalLinks || 0}</div>
                <div className="text-xs text-gray-500">Total Links</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">{stats?.secureRequests || 0}</div>
                <div className="text-xs text-gray-500">Secure Requests</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">{stats?.IPv6Percentage || 0}%</div>
                <div className="text-xs text-gray-500">IPv6</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">{formatBytes(stats?.encodedSize || 0)}</div>
                <div className="text-xs text-gray-500">Total Size</div>
              </div>
            </div>

            {/* Domains */}
            {lists?.domains && lists.domains.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiServer className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-400">Domains Contacted ({lists.domains.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lists.domains.map((domain: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs rounded bg-[#0f0f0f] text-gray-400 font-mono">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* IPs */}
            {lists?.ips && lists.ips.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-400">IP Addresses ({lists.ips.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lists.ips.map((ip: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs rounded bg-[#0f0f0f] text-gray-400 font-mono">
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Countries */}
            {lists?.countries && lists.countries.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiGlobe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-400">Server Locations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lists.countries.map((country: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs rounded bg-[#0f0f0f] text-gray-400">
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resource Breakdown */}
      {stats?.resourceStats && stats.resourceStats.length > 0 && (
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-3 mb-3">
            <FiDatabase className="w-5 h-5 text-[#a5f54a]" />
            <h3 className="font-medium text-white">Resource Breakdown</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.resourceStats.map((resource: any, idx: number) => (
              <div key={idx} className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{resource.type || 'Other'}</div>
                <div className="text-lg font-semibold text-white">{resource.count}</div>
                <div className="text-xs text-gray-500">{formatBytes(resource.size)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data */}
      {showRawData && (
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
            <h3 className="font-medium text-white">Raw Scan Data</h3>
            <button
              onClick={() => setShowRawData(false)}
              className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <FiEyeOff className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="p-4">
            <pre className="text-xs text-gray-400 overflow-auto max-h-96 font-mono bg-[#0f0f0f] p-3 rounded-lg">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default UrlScanResults