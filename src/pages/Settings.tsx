// src/renderer/pages/Settings.tsx
import React, { useState, useEffect } from 'react'
import { 
  FiSettings, 
  FiSave, 
  FiRefreshCw,
  FiBell,
  FiShield,
  FiDatabase,
  FiCpu,
  FiGlobe,
  FiUser,
  FiMoon,
  FiSun,
  FiUpload,
  FiDownload
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useTheme } from '../contexts/ThemeContext'

const Settings: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    // General Settings
    autoUpdate: true,
    startOnBoot: false,
    minimizeToTray: true,
    
    // Analysis Settings
    maxFileSize: 50,
    scanSensitivity: 'medium',
    autoSubmitToVT: true,
    keepFileHistory: true,
    historyRetention: 30,
    
    // Security Settings
    requireAuth: true,
    encryptLocalData: true,
    clearClipboard: false,
    
    // Notification Settings
    notifyOnComplete: true,
    notifyOnThreat: true,
    soundNotifications: false,
    
    // API Settings
    vtApiKey: '',
    enableHybridAnalysis: false,
    enableCuckoo: false,
    
    // Performance Settings
    maxConcurrentScans: 3,
    cacheDuration: 24,
    enableCompression: true
  })

  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('malware_analyzer_settings')
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  const handleChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    localStorage.setItem('malware_analyzer_settings', JSON.stringify(settings))
    setHasChanges(false)
    toast.success('Settings saved successfully')
    
    // Show notification if enabled
    if (window.electronAPI && settings.notifyOnComplete) {
      window.electronAPI.showNotification(
        'Settings Updated',
        'Your preferences have been saved'
      )
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset all settings to default? This cannot be undone.')) {
      const defaults = {
        autoUpdate: true,
        startOnBoot: false,
        minimizeToTray: true,
        maxFileSize: 50,
        scanSensitivity: 'medium',
        autoSubmitToVT: true,
        keepFileHistory: true,
        historyRetention: 30,
        requireAuth: true,
        encryptLocalData: true,
        clearClipboard: false,
        notifyOnComplete: true,
        notifyOnThreat: true,
        soundNotifications: false,
        vtApiKey: '',
        enableHybridAnalysis: false,
        enableCuckoo: false,
        maxConcurrentScans: 3,
        cacheDuration: 24,
        enableCompression: true
      }
      
      setSettings(defaults)
      setHasChanges(true)
      toast.info('Settings reset to defaults')
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `malware-analyzer-settings-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Settings exported')
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string)
            setSettings(prev => ({ ...prev, ...imported }))
            setHasChanges(true)
            toast.success('Settings imported')
          } catch (error) {
            toast.error('Invalid settings file')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-main">
              Application Settings
            </h1>
            <p className="text-gray-400 mt-2">
              Configure your malware analysis preferences
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-3.5 bg-black-secondary hover:bg-black-primary rounded-xl transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <FiSun className="w-5 h-5 text-yellow-400" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <div className="p-3 bg-black-secondary rounded-xl">
              <FiSettings className="w-6 h-6 text-white hover:text-green-main" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Navigation */}
        <div className="md:col-span-1 border-r border-black-secondary pr-4">
          <div className="card sticky top-6">
            <nav className="space-y-2">
              {['General', 'Analysis', 'Security', 'Notifications', 'API', 'Performance'].map((section) => (
                <button
                  key={section}
                  onClick={() => document.getElementById(section.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-black-primary/30 transition-colors"
                >
                  <span className="font-medium">{section}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-4 space-y-6">
          {/* General Settings */}
          <div id="general" className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FiSettings className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">General Settings</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                    <div>
                      <p className="font-medium">Auto Update</p>
                      <p className="text-sm text-gray-400">Automatically check for updates</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.autoUpdate}
                        onChange={(e) => handleChange('autoUpdate', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${settings.autoUpdate ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 ${settings.autoUpdate ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.autoUpdate ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                    <div>
                      <p className="font-medium">Start on Boot</p>
                      <p className="text-sm text-gray-400">Launch on system startup</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.startOnBoot}
                        onChange={(e) => handleChange('startOnBoot', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${settings.startOnBoot ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 ${settings.startOnBoot ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.startOnBoot ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                  <div>
                    <p className="font-medium">Minimize to Tray</p>
                    <p className="text-sm text-gray-400">Hide to system tray when minimized</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.minimizeToTray}
                      onChange={(e) => handleChange('minimizeToTray', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${settings.minimizeToTray ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                    <div className={`absolute left-1 top-1 ${settings.minimizeToTray ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.minimizeToTray ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Analysis Settings */}
          <div id="analysis" className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FiCpu className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Analysis Settings</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block mb-2">
                  <span className="font-medium">Maximum File Size</span>
                  <span className="ml-2 text-gray-400">{settings.maxFileSize} MB</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.maxFileSize}
                  onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-black-secondary rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>1 MB</span>
                  <span>50 MB</span>
                  <span>100 MB</span>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Scan Sensitivity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleChange('scanSensitivity', level)}
                      className={`p-3 rounded-lg transition-colors ${
                        settings.scanSensitivity === level
                          ? 'bg-green-main text-black-primary font-semibold'
                          : 'bg-black-secondary hover:bg-black-primary'
                      }`}
                    >
                      <span className="capitalize">{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                    <div>
                      <p className="font-medium">Auto-submit to VirusTotal</p>
                      <p className="text-sm text-gray-400">Submit unknown files automatically</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.autoSubmitToVT}
                        onChange={(e) => handleChange('autoSubmitToVT', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${settings.autoSubmitToVT ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 ${settings.autoSubmitToVT ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.autoSubmitToVT ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                    <div>
                      <p className="font-medium">Keep File History</p>
                      <p className="text-sm text-gray-400">Store analysis results locally</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.keepFileHistory}
                        onChange={(e) => handleChange('keepFileHistory', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${settings.keepFileHistory ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 ${settings.keepFileHistory ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.keepFileHistory ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="font-medium">History Retention Period</span>
                  <span className="ml-2 text-gray-400">{settings.historyRetention} days</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={settings.historyRetention}
                  onChange={(e) => handleChange('historyRetention', parseInt(e.target.value))}
                  className="w-full h-2 bg-black-secondary rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>1 day</span>
                  <span>30 days</span>
                  <span>365 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div id="security" className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <FiShield className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Security Settings</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                    <div>
                      <p className="font-medium">Require Authentication</p>
                      <p className="text-sm text-gray-400">Password protect the application</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.requireAuth}
                        onChange={(e) => handleChange('requireAuth', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${settings.requireAuth ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1  w-4 h-4 ${settings.requireAuth ? 'bg-black-primary' : 'bg-white'} rounded-full transition-transform ${settings.requireAuth ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                    <div>
                      <p className="font-medium">Encrypt Local Data</p>
                      <p className="text-sm text-gray-400">Encrypt stored scan results</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.encryptLocalData}
                        onChange={(e) => handleChange('encryptLocalData', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${settings.encryptLocalData ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 ${settings.encryptLocalData ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.encryptLocalData ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between p-4 bg-black-primary rounded-lg">
                  <div>
                    <p className="font-medium">Clear Clipboard</p>
                    <p className="text-sm text-gray-400">Clear clipboard after copying sensitive data</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.clearClipboard}
                      onChange={(e) => handleChange('clearClipboard', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${settings.clearClipboard ? 'bg-green-main' : 'bg-gray-700'}`}></div>
                    <div className={`absolute left-1 top-1 ${settings.clearClipboard ? 'bg-black-primary' : 'bg-white'} w-4 h-4 rounded-full transition-transform ${settings.clearClipboard ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                  hasChanges
                    ? 'bg-green-main hover:bg-green-600 text-black-primary'
                    : 'bg-black-primary text-white/50 cursor-not-allowed'
                }`}
              >
                <FiSave className="w-4 h-4" />
                <span>Save Changes</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-6 py-3 bg-black-secondary hover:bg-black-secondary/80 hover:text-green-main rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>

              <button
                onClick={handleExportSettings}
                className="flex items-center space-x-2 px-6 py-3 bg-black-secondary hover:bg-black-secondary/80 hover:text-green-main rounded-lg transition-colors"
              >
                <FiUpload className="w-4 h-4" />
                <span>Export Settings</span>
              </button>

              <button
                onClick={handleImportSettings}
                className="flex items-center space-x-2 px-6 py-3 bg-black-secondary hover:bg-black-secondary/80 hover:text-green-main rounded-lg transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                <span>Import Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings