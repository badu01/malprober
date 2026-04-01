// src/renderer/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react'
import {
  FiShield,
  FiFile,
  FiGlobe,
  FiAlertTriangle,
  FiCheckCircle,
  FiBarChart2,
  FiTrendingUp,
  FiClock,
  FiLoader
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { scanHistoryService } from '../renderer/firebase/scanHistoryService'
import { useAuth } from '../contexts/AuthContext'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalScans: 0,
    maliciousCount: 0,
    suspiciousCount: 0,
    safeCount: 0,
    avgConfidence: 0,
    fileScans: 0,
    urlScans: 0
  })
  const [recentScans, setRecentScans] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Get user stats from service
      const userStats = await scanHistoryService.getUserStats()
      
      // Get recent scans
      const scans = await scanHistoryService.getUserScans(10)
      setRecentScans(scans)
      
      // Calculate additional stats
      const fileScans = scans.filter(s => s.type === 'file').length
      const urlScans = scans.filter(s => s.type === 'url').length
      
      setStats({
        totalScans: userStats.totalScans,
        maliciousCount: userStats.maliciousCount,
        suspiciousCount: userStats.suspiciousCount,
        safeCount: userStats.safeCount,
        avgConfidence: userStats.avgConfidence,
        fileScans: fileScans,
        urlScans: urlScans
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const barData = {
    labels: ["Safe", "Suspicious", "Malicious"],
    datasets: [
      {
        label: "Scans",
        data: [stats.safeCount, stats.suspiciousCount, stats.maliciousCount],
        backgroundColor: [
          "rgba(165, 245, 74, 0.7)",   // green-main
          "rgba(245, 158, 11, 0.7)",   // orange
          "rgba(239, 68, 68, 0.7)",    // red
        ],
        borderColor: [
          "rgb(165, 245, 74)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#e5e5e5",
        bodyColor: "#a3a3a3",
        borderColor: "#2a2a2a",
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: function(context: any) {
            return ` ${context.raw} scans`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: { 
          color: "#a3a3a3", 
          font: { size: 11, weight: 500 },
        },
        grid: { display: false },
      },
      y: {
        ticks: { 
          color: "#a3a3a3", 
          font: { size: 11 },
          stepSize: 1,
        },
        grid: { color: "rgba(255,255,255,0.05)" },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FiLoader className="w-10 h-10 text-[#a5f54a] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-green-main">
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Overview of your malware analysis activities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Last Scan</p>
              <p className="text-sm font-medium text-gray-300">
                {recentScans.length > 0
                  ? new Date(recentScans[0].timestamp).toLocaleDateString()
                  : 'No scans yet'
                }
              </p>
            </div>
            <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <FiShield className="w-6 h-6 text-[#a5f54a]" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Scans</p>
              <p className="text-2xl font-semibold text-white mt-1">{stats.totalScans}</p>
            </div>
            <div className="p-2 bg-[#1a1a1a] rounded-lg">
              <FiBarChart2 className="w-5 h-5 text-[#a5f54a]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center text-[#a5f54a] text-xs">
              <FiTrendingUp className="w-3 h-3 mr-1" />
              <span>{stats.fileScans} files, {stats.urlScans} URLs</span>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Malicious</p>
              <p className="text-2xl font-semibold text-red-400 mt-1">{stats.maliciousCount}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              {stats.totalScans > 0
                ? `${((stats.maliciousCount / stats.totalScans) * 100).toFixed(1)}% of total scans`
                : 'No data'
              }
            </p>
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Suspicious</p>
              <p className="text-2xl font-semibold text-orange-400 mt-1">{stats.suspiciousCount}</p>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Requires manual review
            </p>
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Confidence</p>
              <p className="text-2xl font-semibold text-[#a5f54a] mt-1">{stats.avgConfidence.toPrecision(3)}%</p>
            </div>
            <div className="p-2 bg-[#1a1a1a] rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-[#a5f54a]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
              <div
                className="bg-[#a5f54a] h-1.5 rounded-full transition-all"
                style={{ width: `${stats.avgConfidence}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Distribution Chart */}
        <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Threat Distribution</h3>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#a5f54a]"></div>
              <span className="text-xs text-gray-500">Safe ({stats.safeCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-xs text-gray-500">Suspicious ({stats.suspiciousCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-xs text-gray-500">Malicious ({stats.maliciousCount})</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Quick Actions</h3>
          <div className="flex flex-col space-y-2">
            <Link to="/file-scan">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-all group border border-[#2a2a2a] hover:border-[#a5f54a]/30">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-[#141414] rounded-lg group-hover:bg-[#a5f54a]/10">
                    <FiFile className="w-4 h-4 text-[#a5f54a]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">File Scan</p>
                    <p className="text-xs text-gray-500">Upload and analyze files</p>
                  </div>
                </div>
                <div className="text-gray-600 group-hover:text-[#a5f54a] transition-colors">
                  →
                </div>
              </button>
            </Link>

            <Link to="/url-scan">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-all group border border-[#2a2a2a] hover:border-[#a5f54a]/30">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-[#141414] rounded-lg group-hover:bg-[#a5f54a]/10">
                    <FiGlobe className="w-4 h-4 text-[#a5f54a]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">URL Scan</p>
                    <p className="text-xs text-gray-500">Check website safety</p>
                  </div>
                </div>
                <div className="text-gray-600 group-hover:text-[#a5f54a] transition-colors">
                  →
                </div>
              </button>
            </Link>

            <Link to="/history">
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-all group border border-[#2a2a2a] hover:border-[#a5f54a]/30">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-[#141414] rounded-lg group-hover:bg-[#a5f54a]/10">
                    <FiClock className="w-4 h-4 text-[#a5f54a]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">View History</p>
                    <p className="text-xs text-gray-500">Past scan results</p>
                  </div>
                </div>
                <div className="text-gray-600 group-hover:text-[#a5f54a] transition-colors">
                  →
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Recent Activity</h3>
          {recentScans.length > 0 && (
            <Link to="/history" className="text-xs text-[#a5f54a] hover:text-[#8CBF3B] transition-colors">
              View all →
            </Link>
          )}
        </div>
        
        {recentScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Target</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Verdict</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Confidence</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-2 px-3">
                      <div className="text-sm text-gray-300 truncate max-w-[180px]">
                        {scan.filename || scan.target}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${scan.type === 'file'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {scan.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${scan.verdict === 'safe'
                          ? 'bg-[#a5f54a]/10 text-[#a5f54a]'
                          : scan.verdict === 'suspicious'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {scan.verdict.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-[#1a1a1a] rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              scan.confidence > 70 ? 'bg-[#a5f54a]' :
                              scan.confidence > 30 ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${scan.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">{scan.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <FiClock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No scan history yet</p>
            <p className="text-xs text-gray-600 mt-1">Start by analyzing a file or URL</p>
            <Link to="/file-scan">
              <button className="mt-4 px-4 py-1.5 bg-[#a5f54a] text-black rounded-lg text-sm font-medium hover:bg-[#8CBF3B] transition-colors">
                Start Scan
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard