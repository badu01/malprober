// src/renderer/pages/History.tsx (Updated)

import React, { useState, useEffect } from 'react'
import {
  FiDownload,
  FiTrash2,
  FiFile,
  FiGlobe,
  FiCalendar,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiX
} from 'react-icons/fi'
import { LuCopy, LuCopyCheck } from "react-icons/lu";
import { CgDanger } from "react-icons/cg";
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { scanHistoryService, ScanRecord } from '../renderer/firebase/scanHistoryService'
import { useAuth } from '../contexts/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'

const History: React.FC = () => {
  const { user } = useAuth()
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [filteredScans, setFilteredScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    verdict: 'all',
    dateRange: 'all'
  })
  const [selectedScans, setSelectedScans] = useState<string[]>([])
  const [expandedScan, setExpandedScan] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showClearAllModal, setShowClearAllModal] = useState(false)

  // Load scans from Firebase on mount
  useEffect(() => {
    if (user) {
      loadScans()
    }
  }, [user])

  const loadScans = async () => {
    setLoading(true)
    try {
      const userScans = await scanHistoryService.getUserScans(100)
      setScans(userScans)
      console.log('Loaded scans in history page:', userScans)
    } catch (error) {
      console.error('Failed to load scans:', error)
      toast.error('Failed to load scan history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let results = scans

    // Apply search filter
    if (searchTerm) {
      results = results.filter(scan =>
        scan.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.scanData?.fileInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.scanData?.urlInfo?.domain?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filters.type !== 'all') {
      results = results.filter(scan => scan.type === filters.type)
    }

    // Apply verdict filter
    if (filters.verdict !== 'all') {
      results = results.filter(scan => scan.verdict === filters.verdict)
    }

    // Apply date filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()

      switch (filters.dateRange) {
        case 'today':
          cutoff.setDate(now.getDate() - 1)
          break
        case 'week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoff.setMonth(now.getMonth() - 1)
          break
      }

      results = results.filter(scan => new Date(scan.timestamp) >= cutoff)
    }

    setFilteredScans(results)
  }, [scans, searchTerm, filters])

  const handleSelectAll = () => {
    if (selectedScans.length === filteredScans.length) {
      setSelectedScans([])
    } else {
      setSelectedScans(filteredScans.map(scan => scan.id!))
    }
  }

  const handleSelectScan = (id: string) => {
    setSelectedScans(prev =>
      prev.includes(id)
        ? prev.filter(scanId => scanId !== id)
        : [...prev, id]
    )
  }

  const confirmDeleteSelected = async () => {
    try {
      for (const scanId of selectedScans) {
        await scanHistoryService.deleteScan(scanId)
      }
      toast.success(`${selectedScans.length} scan(s) deleted`)
      setSelectedScans([])
      await loadScans()
    } catch (error) {
      console.error('Failed to delete scans:', error)
      toast.error('Failed to delete scans')
    }
  }

  const handleDeleteSelected = () => {
    if (selectedScans.length === 0) {
      toast.error('No scans selected')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmClearAll = async () => {
    try {
      for (const scan of scans) {
        if (scan.id) {
          await scanHistoryService.deleteScan(scan.id)
        }
      }
      toast.success('Scan history cleared')
      await loadScans()
    } catch (error) {
      console.error('Failed to clear history:', error)
      toast.error('Failed to clear history')
    }
  }

  const handleClearAll = () => {
    if (scans.length === 0) {
      toast.error('No scan history to clear')
      return
    }
    setShowClearAllModal(true)
  }

  const handleExportAll = async () => {
    try {
      const exportData = await scanHistoryService.exportScans()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `malprober-history-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('History exported successfully')
    } catch (error) {
      console.error('Failed to export history:', error)
      toast.error('Failed to export history')
    }
  }

  const getVerdictStyle = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return { bg: 'bg-[#a5f54a]/10', text: 'text-[#a5f54a]', dot: 'bg-[#a5f54a]' }
      case 'suspicious': return { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' }
      case 'malicious': return { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' }
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' }
    }
  }

  const formatDate = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({ type: 'all', verdict: 'all', dateRange: 'all' })
  }

  const hasActiveFilters = searchTerm || filters.type !== 'all' || filters.verdict !== 'all' || filters.dateRange !== 'all'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-[#a5f54a] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="border-b border-[#2a2a2a] pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-green-main">Scan History</h1>
              <p className="text-gray-500 text-sm mt-1">View and manage your analysis history</p>
            </div>
            <div className="flex items-center gap-3">
              {scans.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#a5f54a] text-black rounded-lg hover:bg-[#8CBF3B] transition-colors text-sm font-medium"
              >
                <FiDownload className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                <p className="text-xl font-semibold text-white mt-0.5">{scans.length}</p>
              </div>
              <FiCalendar className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Files</p>
                <p className="text-xl font-semibold text-white mt-0.5">{scans.filter(s => s.type === 'file').length}</p>
              </div>
              <FiFile className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">URLs</p>
                <p className="text-xl font-semibold text-white mt-0.5">{scans.filter(s => s.type === 'url').length}</p>
              </div>
              <FiGlobe className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Threats</p>
                <p className="text-xl font-semibold text-red-400 mt-0.5">{scans.filter(s => s.verdict === 'malicious').length}</p>
              </div>
              <CgDanger className="w-5 h-5 text-red-400/60" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by filename, URL or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black-secondary border border-[#2a2a2a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#a5f54a] transition-colors"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 bg-black-secondary border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
            >
              <option value="all">All Types</option>
              <option value="file">File Scans</option>
              <option value="url">URL Scans</option>
            </select>

            {/* Verdict Filter */}
            <select
              value={filters.verdict}
              onChange={(e) => setFilters({ ...filters, verdict: e.target.value })}
              className="px-3 py-2 bg-black-secondary border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
            >
              <option value="all">All Verdicts</option>
              <option value="safe">Safe</option>
              <option value="suspicious">Suspicious</option>
              <option value="malicious">Malicious</option>
            </select>

            {/* Date Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 bg-black-secondary border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-[#a5f54a] hover:text-[#8CBF3B] transition-colors"
                >
                  <FiX className="w-3 h-3" />
                  Clear all
                </button>
              </div>
              <span className="text-xs text-gray-500">{filteredScans.length} results</span>
            </div>
          )}

          {/* Selected Actions */}
          {selectedScans.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {selectedScans.length} scan{selectedScans.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scan History Table */}
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
          {filteredScans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="w-10 py-3 pl-4">
                      <input
                        type="checkbox"
                        checked={selectedScans.length === filteredScans.length && filteredScans.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-[#2a2a2a] bg-black-secondary text-[#a5f54a] focus:ring-[#a5f54a] focus:ring-offset-0"
                      />
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Target</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Verdict</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Confidence</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((scan) => {
                    const verdictStyle = getVerdictStyle(scan.verdict)
                    const isExpanded = expandedScan === scan.id
                    const displayName = scan.type === 'file'
                      ? scan.scanData?.fileInfo?.name || scan.target
                      : scan.target

                    return (
                      <React.Fragment key={scan.id}>
                        <tr className="border-b border-[#2a2a2a]/50 hover:bg-black-secondary transition-colors">
                          <td className="py-3 pl-4">
                            <input
                              type="checkbox"
                              checked={selectedScans.includes(scan.id!)}
                              onChange={() => handleSelectScan(scan.id!)}
                              className="rounded border-[#2a2a2a] bg-black-secondary text-[#a5f54a] focus:ring-[#a5f54a] focus:ring-offset-0"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-black-secondary flex items-center justify-center">
                                {scan.type === 'file' ? (
                                  <FiFile className="w-3.5 h-3.5 text-gray-400" />
                                ) : (
                                  <FiGlobe className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm text-white truncate max-w-[200px]">
                                  {displayName}
                                </div>
                                {scan.type === 'url' && scan.scanData?.urlInfo?.domain && (
                                  <div className="text-xs text-gray-500">
                                    {scan.scanData.urlInfo.domain}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${scan.type === 'file'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-green-500/10 text-green-400'
                              }`}>
                              {scan.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${verdictStyle.dot}`}></div>
                              <span className={`text-sm font-medium ${verdictStyle.text}`}>
                                {scan.verdict.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-black-secondary rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full transition-all ${scan.confidence > 70 ? 'bg-[#a5f54a]' :
                                      scan.confidence > 30 ? 'bg-orange-400' : 'bg-red-400'
                                    }`}
                                  style={{ width: `${scan.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{scan.confidence}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(scan.timestamp)}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedScan(isExpanded ? null : scan.id!)}
                              className="p-1 hover:bg-black-secondary rounded transition-colors"
                            >
                              {isExpanded ? (
                                <FiChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <FiChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <tr className="bg-[#0f0f0f]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {scan.type === 'file' ? (
                                  // File-specific details
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">File Information</h4>
                                    <div className="space-y-1.5 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Name:</span>
                                        <span className="text-gray-300 truncate ml-2">{scan.scanData?.fileInfo?.name || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Size:</span>
                                        <span className="text-gray-300">
                                          {scan.scanData?.fileInfo?.size
                                            ? `${(scan.scanData.fileInfo.size / 1024).toFixed(2)} KB`
                                            : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-gray-500 whitespace-nowrap">Hash:</span>
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          <span className="text-gray-300 font-mono text-xs break-all">
                                            {scan.scanData?.fileInfo?.hash || 'N/A'}
                                          </span>
                                          {scan.scanData?.fileInfo?.hash && (
                                            <button
                                              onClick={() => {
                                                if (scan.scanData?.fileInfo?.hash) {
                                                  navigator.clipboard.writeText(scan.scanData.fileInfo.hash)
                                                  setIsCopiedId(scan.id!)
                                                  toast.success("Hash copied")
                                                }
                                              }}
                                              className="text-[#a5f54a] hover:text-[#8CBF3B] transition-colors shrink-0"
                                              title="Copy hash"
                                            >
                                              {isCopiedId === scan.id! ? <LuCopyCheck className="w-4 h-4 text-green-main" /> : <LuCopy className="w-4 h-4 text-gray-500" />}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  // URL-specific details
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">URL Information</h4>
                                    <div className="space-y-1.5 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Domain:</span>
                                        <span className="text-gray-300">{scan.scanData?.urlInfo?.domain || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">IP Address:</span>
                                        <span className="text-gray-300 font-mono text-xs">{scan.scanData?.urlInfo?.ip || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Server:</span>
                                        <span className="text-gray-300">{scan.scanData?.urlInfo?.server || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Country:</span>
                                        <span className="text-gray-300">{scan.scanData?.urlInfo?.country || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Status Code:</span>
                                        <span className="text-gray-300">{scan.scanData?.urlInfo?.statusCode || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Common analysis details */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Analysis Details</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Engines:</span>
                                      <span className="text-gray-300">{scan.scanData?.engines || 1}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Detections:</span>
                                      <span className={scan.scanData?.detections ? 'text-red-400' : 'text-gray-300'}>
                                        {scan.scanData?.detections || 0}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Analysis:</span>
                                      <span className="text-gray-300 capitalize">{scan.analysisFlow || 'dynamic'}</span>
                                    </div>
                                    {scan.reportUrl && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Report:</span>
                                        <a
                                          href={scan.reportUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#a5f54a] hover:underline text-sm"
                                        >
                                          View Online
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Key Findings */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Findings</h4>
                                  <div className="space-y-1">
                                    {scan.scanData?.anomalies?.slice(0, 3).map((anomaly: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, idx: React.Key | null | undefined) => (
                                      <div key={idx} className="text-xs text-gray-400 flex items-start gap-1.5">
                                        <span className="text-[#a5f54a]">•</span>
                                        <span>{anomaly}</span>
                                      </div>
                                    ))}
                                    {(!scan.scanData?.anomalies || scan.scanData.anomalies.length === 0) &&
                                      (!scan.scanData?.explanations || scan.scanData.explanations.length === 0) && (
                                        <p className="text-xs text-gray-500">No anomalies detected</p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-black-secondary flex items-center justify-center mx-auto mb-3">
                <FiSearch className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">No scan history found</p>
              <p className="text-xs text-gray-600 mt-1">
                {hasActiveFilters ? 'Try changing your filters' : 'Start by analyzing a file or URL'}
              </p>
              {!hasActiveFilters && (
                <div className="flex gap-3 justify-center mt-4">
                  <Link to="/file-scan">
                    <button className="px-4 py-1.5 bg-[#a5f54a] text-black rounded-lg text-sm font-medium hover:bg-[#8CBF3B] transition-colors">
                      Scan File
                    </button>
                  </Link>
                  <Link to="/url-scan">
                    <button className="px-4 py-1.5 bg-black-secondary text-gray-300 rounded-lg text-sm font-medium hover:bg-black-primary transition-colors border border-[#2a2a2a]">
                      Scan URL
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSelected}
        title="Delete Selected Scans"
        message={`Are you sure you want to delete ${selectedScans.length} selected scan(s)? This action cannot be undone.`}
        confirmText={`Delete ${selectedScans.length} Scan${selectedScans.length !== 1 ? 's' : ''}`}
        cancelText="Cancel"
        type="danger"
      />
      
      <ConfirmationModal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        onConfirm={confirmClearAll}
        title="Clear All History"
        message={`Are you sure you want to clear all ${scans.length} scan(s) from your history? This action cannot be undone.`}
        confirmText="Clear All"
        cancelText="Cancel"
        type="danger"
        icon={<FiTrash2 className="w-5 h-5" />}
      />
    </>
  )
}

export default History