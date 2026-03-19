// src/renderer/pages/History.tsx
import React, { useState, useEffect } from 'react'
import { 
  FiFilter, 
  FiDownload, 
  FiTrash2, 
  FiEye,
  FiFile,
  FiGlobe,
  FiCalendar,
  FiSearch,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useScan, ScanResult } from '../contexts/ScanContext'
import { toast } from 'react-toastify'

const History: React.FC = () => {
  const { scans, clearHistory, exportScans } = useScan()
  const [filteredScans, setFilteredScans] = useState<ScanResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    verdict: 'all',
    dateRange: 'all'
  })
  const [selectedScans, setSelectedScans] = useState<string[]>([])
  const [expandedScan, setExpandedScan] = useState<string | null>(null)

  useEffect(() => {
    let results = scans

    // Apply search filter
    if (searchTerm) {
      results = results.filter(scan =>
        scan.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.target.toLowerCase().includes(searchTerm.toLowerCase())
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
      setSelectedScans(filteredScans.map(scan => scan.id))
    }
  }

  const handleSelectScan = (id: string) => {
    setSelectedScans(prev =>
      prev.includes(id)
        ? prev.filter(scanId => scanId !== id)
        : [...prev, id]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedScans.length === 0) {
      toast.error('No scans selected')
      return
    }

    if (window.confirm(`Delete ${selectedScans.length} selected scan(s)?`)) {
      // In real app, call API to delete
      toast.success(`${selectedScans.length} scan(s) deleted`)
      setSelectedScans([])
    }
  }

  const handleClearAll = () => {
    if (scans.length === 0) {
      toast.error('No scan history to clear')
      return
    }

    if (window.confirm('Clear all scan history? This action cannot be undone.')) {
      clearHistory()
      toast.success('Scan history cleared')
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'safe': return 'bg-green-500/20 text-green-400'
      case 'suspicious': return 'bg-yellow-500/20 text-yellow-400'
      case 'malicious': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'file' ? FiFile : FiGlobe
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl ">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-[#a5f54a]">
              Scan History
            </h1>
            <p className="text-gray-400 mt-2">
              View and manage your malware analysis history
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportScans}
              className="flex items-center space-x-2 px-4 py-2 bg-[#a5f54a] hover:bg-[#8ec63f] text-black-primary rounded-lg transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <FiSearch className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search scans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black-primary border border-[#2c2c2c] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a5f54a]"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full px-4 py-2 bg-black-primary border border-[#2c2c2c] rounded-lg text-white focus:outline-none focus:border-[#a5f54a]"
            >
              <option value="all">All Types</option>
              <option value="file">File Scans</option>
              <option value="url">URL Scans</option>
            </select>
          </div>

          {/* Verdict Filter */}
          <div>
            <select
              value={filters.verdict}
              onChange={(e) => setFilters({...filters, verdict: e.target.value})}
              className="w-full px-4 py-2 bg-black-primary border border-[#2c2c2c] rounded-lg text-white focus:outline-none focus:border-[#a5f54a]"
            >
              <option value="all">All Verdicts</option>
              <option value="safe">Safe</option>
              <option value="suspicious">Suspicious</option>
              <option value="malicious">Malicious</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full px-4 py-2 bg-black-primary border border-[#2c2c2c] rounded-lg text-white focus:outline-none focus:border-[#a5f54a]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedScans.length > 0 && (
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {selectedScans.length} scan{selectedScans.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-2 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedScans([])}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Scans</p>
              <p className="text-2xl font-bold mt-1">{scans.length}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">File Scans</p>
              <p className="text-2xl font-bold mt-1">
                {scans.filter(s => s.type === 'file').length}
              </p>
            </div>
            <FiFile className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">URL Scans</p>
              <p className="text-2xl font-bold mt-1">
                {scans.filter(s => s.type === 'url').length}
              </p>
            </div>
            <FiGlobe className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Threats Found</p>
              <p className="text-2xl font-bold mt-1 text-red-400">
                {scans.filter(s => s.verdict === 'malicious').length}
              </p>
            </div>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <FiTrash2 className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Scan History Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedScans.length === filteredScans.length && filteredScans.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Target</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Verdict</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.length > 0 ? (
                filteredScans.map((scan) => {
                  const TypeIcon = getTypeIcon(scan.type)
                  const isExpanded = expandedScan === scan.id
                  
                  return (
                    <React.Fragment key={scan.id}>
                      <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedScans.includes(scan.id)}
                            onChange={() => handleSelectScan(scan.id)}
                            className="rounded border-gray-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-800 rounded-lg">
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate max-w-xs">
                                {scan.filename || scan.target}
                              </div>
                              {scan.details?.fileInfo?.hash && (
                                <div className="text-xs text-gray-400 truncate">
                                  {scan.details.fileInfo.hash.substring(0, 16)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium
                            ${scan.type === 'file' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {scan.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVerdictColor(scan.verdict)}`}>
                            {scan.verdict.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-700 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  scan.confidence > 70 
                                    ? 'bg-green-500' 
                                    : scan.confidence > 30 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${scan.confidence}%` }}
                              ></div>
                            </div>
                            <span>{scan.confidence}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {formatDate(scan.timestamp)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setExpandedScan(isExpanded ? null : scan.id)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <FiChevronUp className="w-4 h-4" />
                              ) : (
                                <FiChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <Link to={`/analysis/${scan.id}`}>
                              <button
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-gray-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">File Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Type:</span>
                                    <span>{scan.type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Size:</span>
                                    <span>
                                      {scan.details?.fileInfo?.size 
                                        ? `${(scan.details.fileInfo.size / 1024).toFixed(2)} KB`
                                        : 'N/A'
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Hash:</span>
                                    <span className="font-mono text-xs truncate">
                                      {scan.details?.fileInfo?.hash?.substring(0, 24)}...
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Analysis Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Engines:</span>
                                    <span>{scan.details?.engines || 72}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Detections:</span>
                                    <span className={scan.details?.detections ? 'text-red-400' : ''}>
                                      {scan.details?.detections || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Scan Time:</span>
                                    <span>{new Date(scan.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Key Findings</h4>
                                <div className="space-y-2">
                                  {scan.details?.anomalies?.slice(0, 3).map((anomaly, idx) => (
                                    <div key={idx} className="text-sm text-gray-300">
                                      • {anomaly}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <FiFilter className="w-12 h-12 text-gray-600" />
                      <div>
                        <p className="text-gray-500">No scan history found</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {searchTerm || filters.type !== 'all' || filters.verdict !== 'all' 
                            ? 'Try changing your filters' 
                            : 'Start by analyzing a file or URL'
                          }
                        </p>
                      </div>
                      {!searchTerm && filters.type === 'all' && filters.verdict === 'all' && (
                        <Link to="/file-scan">
                          <button className="px-4 py-2 bg-[#a5f54a] hover:bg-[#8ec63f] text-black-primary rounded-lg transition-colors">
                            Start Your First Scan
                          </button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear All Button */}
      {scans.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default History