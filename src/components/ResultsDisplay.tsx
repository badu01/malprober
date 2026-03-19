import React, { useState } from 'react'
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiDownload,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronUp,
  FiFile,
  FiServer,
  FiGlobe,
  FiHardDrive,
  FiActivity,
  FiList,
  FiGrid,
  FiCalendar,
  FiHash,
  FiFolder,
  FiCpu,
  FiZap,
  FiClock,
  FiDatabase
} from 'react-icons/fi'

interface ResultsDisplayProps {
  results: any // The complex data structure you provided
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [showRawData, setShowRawData] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    fileInfo: true,
    statistics: true,
    activities: true,
    sysmon: false
  })
  const [activeTab, setActiveTab] = useState<string>('executable_detections')
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({})
  const [itemsPerPage] = useState(10)

  // Extract analysis result from the nested structure
  const analysisResult = results?.analysis_result || {}
  const fileInfo = analysisResult.fileInfo || {}
  const logs = analysisResult.logs || {}
  const statistics = logs.statistics || {}
  const verdict = analysisResult.verdict || results?.verdict || 'unknown'
  const confidence = analysisResult.confidence || statistics.confidence || 0

  // Get explanations array
  const explanations = logs.explanations || [
    analysisResult.message || 'Analysis completed'
  ]

  // Prepare data for tabs
  const activityTabs = [
    { id: 'executable_detections', label: 'Executable Detections', icon: FiFile, count: logs.executable_detections?.length || 0 },
    { id: 'files', label: 'Files', icon: FiFolder, count: logs.files?.length || 0 },
    { id: 'registry_changes', label: 'Registry Changes', icon: FiHardDrive, count: logs.registry_changes?.length || 0 },
    { id: 'dns_queries', label: 'DNS Queries', icon: FiGlobe, count: logs.dns_queries?.length || 0 },
    { id: 'processes', label: 'Processes', icon: FiCpu, count: logs.processes?.length || 0 },
    { id: 'network_activity', label: 'Network', icon: FiServer, count: logs.network_activity?.length || 0 }
  ].filter(tab => tab.count > 0) // Only show tabs with data

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
    link.download = `analysis-result-${analysisResult.analysisId || Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return 'N/A'
    if (typeof timestamp === 'string' && timestamp.startsWith('/Date(')) {
      const ms = parseInt(timestamp.slice(6, -2))
      return new Date(ms).toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return 'text-green-500 border-green-500/30 bg-green-500/10'
      case 'suspicious': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
      case 'malicious': return 'text-red-500 border-red-500/30 bg-red-500/10'
      default: return 'text-gray-400 border-gray-700 bg-gray-800/50'
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return FiCheckCircle
      case 'suspicious': return FiAlertTriangle
      case 'malicious': return FiAlertTriangle
      default: return FiInfo
    }
  }

  const getVerdictText = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return 'CLEAN'
      case 'suspicious': return 'SUSPICIOUS'
      case 'malicious': return 'MALICIOUS'
      default: return 'UNKNOWN'
    }
  }

  const VerdictIcon = getVerdictIcon(verdict)

  // Pagination helpers
  const getPaginatedData = (data: any[] | undefined, tabId: string) => {
    if (!data) return []
    const page = currentPage[tabId] || 1
    const start = (page - 1) * itemsPerPage
    return data.slice(start, start + itemsPerPage)
  }

  const getTotalPages = (data: any[] | undefined) => {
    return data ? Math.ceil(data.length / itemsPerPage) : 0
  }

  const renderPagination = (tabId: string, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (totalPages <= 1) return null

    const currentPageNum = currentPage[tabId] || 1

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          Showing {((currentPageNum - 1) * itemsPerPage) + 1} to {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} entries
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => ({ ...prev, [tabId]: currentPageNum - 1 }))}
            disabled={currentPageNum === 1}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-gray-800 rounded">
            Page {currentPageNum} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => ({ ...prev, [tabId]: currentPageNum + 1 }))}
            disabled={currentPageNum === totalPages}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Verdict */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#292929' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className={`p-4 rounded-lg ${getVerdictColor(verdict)}`}>
              <VerdictIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
              <p className="text-gray-400">ID: {analysisResult.analysisId || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{confidence}%</div>
              <div className="text-sm text-gray-400">Confidence</div>
            </div>
            <div className={`px-4 py-2 rounded-lg border font-bold ${getVerdictColor(verdict)}`}>
              {getVerdictText(verdict)}
            </div>
          </div>
        </div>

        {analysisResult.duration && (
          <div className="mt-4 flex items-center text-sm text-gray-400">
            <FiClock className="w-4 h-4 mr-2" />
            Analysis Duration: {analysisResult.duration.toFixed(2)}ms
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: '#292929' }}>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportResults}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#1f1f1f', color: '#A5F54A' }}
          >
            <FiDownload className="w-4 h-4" />
            <span>Export Results</span>
          </button>

          <button
            onClick={handleCopyResults}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#1f1f1f', color: '#A5F54A' }}
          >
            <FiCopy className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#1f1f1f', color: '#A5F54A' }}
          >
            {showRawData ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            <span>{showRawData ? 'Hide Raw Data' : 'Show Raw Data'}</span>
          </button>
        </div>
      </div>

      {/* File Information */}
      {fileInfo && Object.keys(fileInfo).length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#292929' }}>
          <button
            onClick={() => toggleSection('fileInfo')}
            className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-3">
              <FiFile className="w-5 h-5" style={{ color: '#A5F54A' }} />
              <h3 className="text-lg font-semibold text-white">File Information</h3>
            </div>
            {expandedSections.fileInfo ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.fileInfo && (
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                <div className="text-sm text-gray-400">Original Name</div>
                <div className="text-white font-mono text-sm break-all">{fileInfo.original_name || 'N/A'}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                <div className="text-sm text-gray-400">File Extension</div>
                <div className="text-white">{fileInfo.file_extension || 'N/A'}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                <div className="text-sm text-gray-400">File Size</div>
                <div className="text-white">{formatFileSize(fileInfo.file_size)}</div>
              </div>
              <div className="p-3 rounded-lg col-span-2" style={{ backgroundColor: '#1f1f1f' }}>
                <div className="text-sm text-gray-400">SHA-256 Hash</div>
                <div className="text-white font-mono text-sm break-all">{fileInfo.file_hash || 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {statistics && Object.keys(statistics).length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#292929' }}>
          <button
            onClick={() => toggleSection('statistics')}
            className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-3">
              <FiActivity className="w-5 h-5" style={{ color: '#A5F54A' }} />
              <h3 className="text-lg font-semibold text-white">Analysis Statistics</h3>
            </div>
            {expandedSections.statistics ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.statistics && (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(statistics).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                    <div className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xl font-bold text-white">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanations */}
      {explanations.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#292929' }}>
          <button
            onClick={() => toggleSection('summary')}
            className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-3">
              <FiInfo className="w-5 h-5" style={{ color: '#A5F54A' }} />
              <h3 className="text-lg font-semibold text-white">Analysis Summary</h3>
            </div>
            {expandedSections.summary ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.summary && (
            <div className="p-4 pt-0 space-y-3">
              {explanations.map((explanation: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, index: React.Key | null | undefined) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg"
                  style={{ backgroundColor: '#1f1f1f' }}
                >
                  <FiInfo className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#A5F54A' }} />
                  <span className="text-gray-300">{explanation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activities */}
      {activityTabs.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#292929' }}>
          <button
            onClick={() => toggleSection('activities')}
            className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiList className="w-5 h-5" style={{ color: '#A5F54A' }} />
              <h3 className="text-lg font-semibold text-white">System Activities</h3>
            </div>
            {expandedSections.activities ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.activities && (
            <div className="p-4 pt-0">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {activityTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setCurrentPage(prev => ({ ...prev, [tab.id]: 1 }))
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                      ? ''
                      : 'opacity-70 hover:opacity-100'
                      }`}
                    style={{
                      backgroundColor: activeTab === tab.id ? '#A5F54A' : '#1f1f1f',
                      color: activeTab === tab.id ? '#1f1f1f' : 'white'
                    }}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{
                      backgroundColor: activeTab === tab.id ? '#1f1f1f' : '#292929',
                      color: activeTab === tab.id ? '#A5F54A' : 'white'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-3">
                {activeTab === 'executable_detections' && logs.executable_detections && (
                  <>
                    {getPaginatedData(logs.executable_detections, 'executable_detections').map((item: any, index: number) => (

                      <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex-1">
                            <div className="text-gray-400 text-xs">Source Process</div>
                            <div className="text-white font-mono text-xs break-all whitespace-pre-wrap">
                              {item?.source_process || 'N/A'}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-400 text-xs">Target File</div>
                            <div className="text-white font-mono text-xs break-all">{item.target_file}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Time</div>
                            <div className="text-white text-xs">{formatDate(item.time)}</div>
                          </div>
                        </div>
                        {item.hashes && (
                          <div className="mt-2 pt-2 border-t border-gray-800">
                            <div className="text-gray-400 text-xs mb-1">Hashes</div>
                            <div className="text-white font-mono text-xs break-all">{item.hashes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                    {renderPagination('executable_detections', logs.executable_detections.length)}
                  </>
                )}

                {activeTab === 'files' && logs.files && (
                  <>
                    {getPaginatedData(logs.files, 'files').map((item: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded text-xs ${item.action === 'create' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                            {item.action}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-mono text-xs break-all">{item.path}</div>
                          </div>
                          <div className="text-gray-400 text-xs">{formatDate(item.time)}</div>
                        </div>
                      </div>
                    ))}
                    {renderPagination('files', logs.files.length)}
                  </>
                )}

                {activeTab === 'registry_changes' && logs.registry_changes && (
                  <>
                    {getPaginatedData(logs.registry_changes, 'registry_changes').map((item: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                        <div className="flex items-start space-x-3">
                          <FiHardDrive className="w-4 h-4 mt-1 shrink-0" style={{ color: '#A5F54A' }} />
                          <div className="flex-1">
                            <div className="text-white font-mono text-xs break-all">{item.key}</div>
                          </div>
                          <div className="text-gray-400 text-xs">{formatDate(item.time)}</div>
                        </div>
                      </div>
                    ))}
                    {renderPagination('registry_changes', logs.registry_changes.length)}
                  </>
                )}

                {/* DNS Queries Tab */}
                {activeTab === 'dns_queries' && (
                  <div className="space-y-3">
                    {logs.dns_queries && logs.dns_queries.length > 0 ? (
                      logs.dns_queries.map((query: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: '#1f1f1f' }}
                        >
                          <div className="flex items-start space-x-3">
                            <FiGlobe
                              className="w-4 h-4 mt-1 shrink-0"
                              style={{ color: '#A5F54A' }}
                            />

                            <div className="flex-1">
                              <div className="text-white font-mono text-xs break-all">
                                {query.query || 'N/A'}
                              </div>

                              {query.status && (
                                <div className="text-gray-400 text-xs mt-1">
                                  Status: {query.status}
                                </div>
                              )}
                            </div>

                            <div className="text-gray-400 text-xs">
                              {formatDate(query.time)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="p-3 rounded-lg text-center text-gray-400 text-xs"
                        style={{ backgroundColor: '#1f1f1f' }}
                      >
                        No DNS queries recorded
                      </div>
                    )}
                  </div>
                )}

                {/* Processes Tab */}
                {activeTab === 'processes' && (
                  <div className="space-y-4">
                    {logs.processes && logs.processes.length > 0 ? (
                      logs.processes.map((process: any, index: number) => (
                        <div key={index} className="p-4 bg-black-secondary rounded-lg border border-gray-800">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-lg font-medium text-green-main">{process.name}</p>
                              <p className="text-sm text-gray-400 mt-1">PID: {process.pid}</p>
                              {process.command_line && (
                                <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                                  {process.command_line}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(process.time).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 bg-black-secondary rounded-lg border border-gray-800">
                        <p className="text-lg">⚙️ No processes recorded</p>
                        <p className="text-sm mt-2">The sample did not create any new processes</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Network Activity Tab */}
                {activeTab === 'network_activity' && (
                  <div className="space-y-4">
                    {logs.network_activity && logs.network_activity.length > 0 ? (
                      logs.network_activity.map((network: any, index: number) => (
                        <div key={index} className="p-4 bg-black-secondary rounded-lg border border-gray-800">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-lg font-medium text-green-main">
                                {network.dst_ip}:{network.dst_port}
                              </p>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <p className="text-xs text-gray-500">Protocol</p>
                                  <p className="text-sm text-white">{network.protocol || 'TCP'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Source IP</p>
                                  <p className="text-sm text-white">{network.src_ip || 'Unknown'}</p>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(network.time).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 bg-black-secondary rounded-lg border border-gray-800">
                        <p className="text-lg">🌐 No network activity recorded</p>
                        <p className="text-sm mt-2">The sample did not initiate any network connections</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sysmon Events */}
      {logs.sysmon_events && logs.sysmon_events.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#292929' }}>
          <button
            onClick={() => toggleSection('sysmon')}
            className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiDatabase className="w-5 h-5" style={{ color: '#A5F54A' }} />
              <h3 className="text-lg font-semibold text-white">
                Sysmon Events ({logs.sysmon_events.length})
              </h3>
            </div>
            {expandedSections.sysmon ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.sysmon && (
            <div className="p-4 pt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getPaginatedData(logs.sysmon_events, 'sysmon').map((event: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: '#A5F54A' }}>
                        Event ID: {event.Id} - {event.TaskDisplayName}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(event.TimeCreated)}</span>
                    </div>
                    <p className="text-gray-300 text-xs whitespace-pre-wrap break-all">{event.Message}</p>
                  </div>
                ))}
                {renderPagination('sysmon', logs.sysmon_events.length)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Files */}
      {results.log_files && results.log_files.length > 0 && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#292929' }}>
          <h3 className="text-lg font-semibold text-white mb-3">Log Files</h3>
          <div className="space-y-2">
            {results.log_files.map((file: any, index: number) => (
              <div key={index} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#1f1f1f' }}>
                <div className="flex items-center space-x-3">
                  <FiFile className="w-4 h-4" style={{ color: '#A5F54A' }} />
                  <div>
                    <div className="text-white text-sm">{file.name}</div>
                    <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{file.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data */}
      {showRawData && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#292929' }}>
          <div className="p-4 flex items-center justify-between border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Raw Analysis Data</h3>
            <button
              onClick={() => setShowRawData(false)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#1f1f1f', color: '#A5F54A' }}
            >
              <FiEyeOff className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            <pre className="text-xs text-gray-300 overflow-auto max-h-96 font-mono">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsDisplay