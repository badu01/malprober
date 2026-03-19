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
  FiClock
} from 'react-icons/fi'

import { Link } from 'react-router-dom'
import { useScan } from '../contexts/ScanContext'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const Dashboard: React.FC = () => {
  const { scans } = useScan()
  const [stats, setStats] = useState({
    totalScans: 0,
    maliciousCount: 0,
    suspiciousCount: 0,
    safeCount: 0,
    avgConfidence: 0
  })

  useEffect(() => {
    const total = scans.length
    const malicious = scans.filter(s => s.verdict === 'malicious').length
    const suspicious = scans.filter(s => s.verdict === 'suspicious').length
    const safe = scans.filter(s => s.verdict === 'safe').length
    const avgConfidence = scans.length > 0
      ? scans.reduce((acc, s) => acc + s.confidence, 0) / scans.length
      : 0

    setStats({
      totalScans: total,
      maliciousCount: malicious,
      suspiciousCount: suspicious,
      safeCount: safe,
      avgConfidence: parseFloat(avgConfidence.toFixed(1))
    })
  }, [scans])

  const doughnutData = {
    labels: ['Safe', 'Suspicious', 'Malicious'],
    datasets: [
      {
        // data: [stats.safeCount, stats.suspiciousCount, stats.maliciousCount],
        data: [100, 20, 30],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)'
        ],
        borderColor: [
          'rgb(22, 163, 74)',
          'rgb(202, 138, 4)',
          'rgb(220, 38, 38)'
        ],
        borderWidth: 2,
      },
    ],
  }


  const barData = {
    labels: ["Safe", "Suspicious", "Malicious"],
    datasets: [
      {
        label: "Analysis Results",
        data: [100, 20, 30], // or use stats.safeCount etc.
        backgroundColor: [
          "rgba(34,197,94,0.7)",   // green
          "rgba(234,179,8,0.7)",   // yellow
          "rgba(239,68,68,0.7)",   // red
        ],
        borderColor: [
          "rgb(22,163,74)",
          "rgb(202,138,4)",
          "rgb(220,38,38)",
        ],
        borderWidth: 2,
        borderRadius: 8, // Rounded corners
        barThickness: 45,
      },
    ],
  };


  const recentActivity = scans.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-green-main bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time overview of your malware analysis activities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Analysis</p>
              <p className="font-medium">
                {scans.length > 0
                  ? new Date(scans[0].timestamp).toLocaleTimeString()
                  : 'No scans yet'
                }
              </p>
            </div>
            <div className="p-3 bg-linear-to-r from-green-500 to-blue-500 rounded-xl">
              <FiShield className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Scans</p>
              <p className="text-3xl font-bold mt-2">{stats.totalScans}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FiBarChart2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-green-400">
              <FiTrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+12% from last week</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Malicious</p>
              <p className="text-3xl font-bold mt-2 text-red-400">{stats.maliciousCount}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <FiAlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">
              {stats.totalScans > 0
                ? `${((stats.maliciousCount / stats.totalScans) * 100).toFixed(1)}% of total`
                : 'No data'
              }
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Average Confidence</p>
              <p className="text-3xl font-bold mt-2 text-green-400">{stats.avgConfidence}%</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-linear-to-r from-green-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${stats.avgConfidence}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Recent Activity</p>
              <p className="text-3xl font-bold mt-2">{recentActivity.length}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FiClock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Last 5 scans</p>
          </div>
        </div>
      </div>

      {/* Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Threat Distribution</h3>
          <div className="h-64">
            {/* <Doughnut 
              data={doughnutData} 
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
            /> */}

            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      color: "#e5e7eb",
                      font: { size: 13, weight: 500 },
                    },
                  },
                  tooltip: {
                    backgroundColor: "#1f2937",
                    titleColor: "#fff",
                    bodyColor: "#d1d5db",
                    borderColor: "#374151",
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                  },
                },
                scales: {
                  x: {
                    ticks: { color: "#9ca3af", font: { size: 12 } },
                    grid: { display: false },
                  },
                  y: {
                    ticks: { color: "#9ca3af", font: { size: 12 } },
                    grid: { color: "rgba(255,255,255,0.05)" },
                  },
                },
              }}
            />



          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-col space-y-2">
            <Link to="/file-scan">
              <button className="w-full flex items-center justify-between p-4 rounded-lg bg-black-primary hover:bg-black-primary/80 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30">
                    <FiFile className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">File Scan</p>
                    <p className="text-sm text-gray-400">Upload and analyze files</p>
                  </div>
                </div>
                <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </button>
            </Link>

            <Link to="/url-scan">
              <button className="w-full flex items-center justify-between p-4 rounded-lg bg-black-primary hover:bg-black-primary/80 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30">
                    <FiGlobe className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">URL Scan</p>
                    <p className="text-sm text-gray-400">Check website safety</p>
                  </div>
                </div>
                <div className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </button>
            </Link>

            <Link to="/history">
              <button className="w-full flex items-center justify-between p-4 rounded-lg bg-black-primary hover:bg-black-primary/80 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30">
                    <FiClock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">View History</p>
                    <p className="text-sm text-gray-400">Past scan results</p>
                  </div>
                </div>
                <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Link to="/history" className="text-sm text-blue-400 hover:text-blue-300">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Target</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Verdict</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length > 0 ? (
                recentActivity.map((scan) => (
                  <tr key={scan.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="font-medium truncate max-w-xs">
                        {scan.filename || scan.target}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${scan.type === 'file'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {scan.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${scan.verdict === 'safe'
                          ? 'bg-green-500/20 text-green-400'
                          : scan.verdict === 'suspicious'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {scan.verdict.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${scan.confidence > 70
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
                      {new Date(scan.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No scan history yet. Start by analyzing a file or URL.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard