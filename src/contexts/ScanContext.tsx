// src/contexts/ScanContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react'

export interface ScanResult {
  id: string
  type: 'file' | 'url'
  target: string
  filename?: string
  confidence: number
  verdict: 'safe' | 'suspicious' | 'malicious'
  timestamp: string
  details: {
    engines: number
    detections: number
    anomalies: string[]
    fileInfo?: {
      size: number
      hash: string
      type: string
    }
    explanations: string[]
  }
}

interface ScanContextType {
  scans: ScanResult[]
  addScan: (scan: Omit<ScanResult, 'id' | 'timestamp'>) => void
  getScan: (id: string) => ScanResult | undefined
  clearHistory: () => void
  exportScans: () => void
  loading: boolean
}

const ScanContext = createContext<ScanContextType | undefined>(undefined)

export const useScan = () => {
  const context = useContext(ScanContext)
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider')
  }
  return context
}

interface ScanProviderProps {
  children: ReactNode
}

export const ScanProvider: React.FC<ScanProviderProps> = ({ children }) => {
  const [scans, setScans] = useState<ScanResult[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('malware_analyzer_scans')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(false)

  // Save to localStorage whenever scans change
  React.useEffect(() => {
    localStorage.setItem('malware_analyzer_scans', JSON.stringify(scans))
  }, [scans])

  const addScan = (scanData: Omit<ScanResult, 'id' | 'timestamp'>) => {
    const newScan: ScanResult = {
      ...scanData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    }
    
    setScans(prev => [newScan, ...prev])
    
    // Notify Electron if available
    if (window.electronAPI) {
      window.electronAPI.showNotification(
        'Scan Complete',
        `Analysis of ${scanData.filename || scanData.target} completed`
      )
    }
  }

  const getScan = (id: string) => {
    return scans.find(scan => scan.id === id)
  }

  const clearHistory = () => {
    setScans([])
  }

  const exportScans = () => {
    setLoading(true)
    try {
      const dataStr = JSON.stringify(scans, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      // Create download link
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `scan-history-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    scans,
    addScan,
    getScan,
    clearHistory,
    exportScans,
    loading
  }

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  )
}