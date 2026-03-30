// src/renderer/components/Layout/index.tsx
import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  FiHome, 
  FiFile, 
  FiGlobe, 
  FiSettings,
  FiUser,
  FiMenu,
  FiGrid,
  FiX,
  FiLogOut
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { path: '/file-scan', label: 'File Scan', icon: <FiFile className="w-5 h-5" /> },
    { path: '/url-scan', label: 'URL Scan', icon: <FiGlobe className="w-5 h-5" /> },
    { path: '/history', label: 'History', icon: <FiGrid className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen text-white bg-linear-to-br from-[#111111] to-[#1a1a1a] overflow-hidden font-funnel-display">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white"
      >
        {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative z-40 h-full transition-all duration-300
        bg-[#111111]/80 backdrop-blur-xl border-r border-black-secondary
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-black-secondary">
          <div className="flex items-center space-x-1">
              <img 
                src="/logo_m.svg" 
                alt="MalProber Logo" 
                className="w-9 h-9"
              />
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold bg-linear-to-r text-[#a5f54a] bg-clip-text">
                  MalProber
                </h1>
                <p className="text-xs text-gray-400">Malware Analyzer</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-linear-to-r from-[#1d1d1d] to-[#1a1a1a] text-[#a5f54a] border-l-4 border-[#a5f54a]' 
                        : 'text-gray-400 hover:text-white hover:bg-black-primary'
                      }
                    `}
                  >
                    {item.icon}
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-black-secondary">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#a5f54a] flex items-center justify-center">
              <FiUser className="w-5 h-5 text-[#111111]" />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium text-white">{user?.username || 'Guest'}</p>
                <p className="text-xs text-gray-400">{user?.email || 'Researcher'}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-black-primary rounded-lg"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </div>
  )
}

export default Layout