// src/renderer/pages/Settings.tsx
import React, { useState, useEffect } from 'react'
import { 
  FiSave, 
  FiRefreshCw,
  FiShield,
  FiCpu,
  FiBell,
  FiMoon,
  FiSun,
  FiUpload,
  FiDownload,
  FiAlertCircle
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useTheme } from '../contexts/ThemeContext'
import ConfirmationModal from '../components/ConfirmationModal'

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const [showResetModal, setShowResetModal] = useState(false)
  const [settings, setSettings] = useState({
    // Analysis Settings
    maxFileSize: 50,
    scanSensitivity: 'medium',
    keepFileHistory: true,
    
    // Security Settings
    encryptLocalData: true,
    
    // Notification Settings
    notifyOnComplete: true,
    notifyOnThreat: true,
    
    // Performance Settings
    maxConcurrentScans: 3,
  })

  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
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
  }

  const handleReset = () => {
    const defaults = {
      maxFileSize: 50,
      scanSensitivity: 'medium',
      keepFileHistory: true,
      encryptLocalData: true,
      notifyOnComplete: true,
      notifyOnThreat: true,
      maxConcurrentScans: 3,
    }
    
    setSettings(defaults)
    setHasChanges(true)
    toast.info('Settings reset to defaults')
    setShowResetModal(false)
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `malprober-settings-${Date.now()}.json`
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
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Configure your analysis preferences</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-black-secondary hover:bg-[#1f1f1f] transition-colors border border-[#2a2a2a]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <FiSun className="w-5 h-5 text-yellow-400" />
            ) : (
              <FiMoon className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-5">
          {/* Analysis Settings */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-[#a5f54a]/10 rounded-lg">
                <FiCpu className="w-5 h-5 text-[#a5f54a]" />
              </div>
              <h2 className="text-lg font-medium text-white">Analysis</h2>
            </div>

            <div className="space-y-5">
              {/* Max File Size */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Maximum File Size</label>
                  <span className="text-sm text-[#a5f54a]">{settings.maxFileSize} MB</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.maxFileSize}
                  onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-black-secondary rounded-lg appearance-none cursor-pointer accent-[#a5f54a]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 MB</span>
                  <span>50 MB</span>
                  <span>100 MB</span>
                </div>
              </div>

              {/* Scan Sensitivity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scan Sensitivity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleChange('scanSensitivity', level)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        settings.scanSensitivity === level
                          ? 'bg-[#a5f54a] text-black'
                          : 'bg-black-secondary text-gray-400 hover:text-white border border-[#2a2a2a]'
                      }`}
                    >
                      <span className="capitalize">{level}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {settings.scanSensitivity === 'low' && 'Faster scans, may miss some threats'}
                  {settings.scanSensitivity === 'medium' && 'Balanced speed and detection'}
                  {settings.scanSensitivity === 'high' && 'Thorough scanning, takes more time'}
                </p>
              </div>

              {/* Keep History Toggle */}
              <label className="flex items-center justify-between p-3 bg-black-secondary rounded-lg border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">Keep Scan History</p>
                  <p className="text-xs text-gray-500">Store analysis results for future reference</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.keepFileHistory}
                    onChange={(e) => handleChange('keepFileHistory', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-5 rounded-full transition-colors ${settings.keepFileHistory ? 'bg-[#a5f54a]' : 'bg-[#2a2a2a]'}`} />
                  <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.keepFileHistory ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <FiShield className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-lg font-medium text-white">Security</h2>
            </div>

            <label className="flex items-center justify-between p-3 bg-black-secondary rounded-lg border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Encrypt Local Data</p>
                <p className="text-xs text-gray-500">Secure stored scan results with encryption</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.encryptLocalData}
                  onChange={(e) => handleChange('encryptLocalData', e.target.checked)}
                  className="sr-only"
                />
                <div className={`block w-10 h-5 rounded-full transition-colors ${settings.encryptLocalData ? 'bg-[#a5f54a]' : 'bg-[#2a2a2a]'}`} />
                <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.encryptLocalData ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>

          {/* Notifications */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FiBell className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-medium text-white">Notifications</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-black-secondary rounded-lg border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">Analysis Complete</p>
                  <p className="text-xs text-gray-500">Notify when analysis finishes</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnComplete}
                    onChange={(e) => handleChange('notifyOnComplete', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-5 rounded-full transition-colors ${settings.notifyOnComplete ? 'bg-[#a5f54a]' : 'bg-[#2a2a2a]'}`} />
                  <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyOnComplete ? 'translate-x-5' : ''}`} />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 bg-black-secondary rounded-lg border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">Threat Detection</p>
                  <p className="text-xs text-gray-500">Alert when threats are found</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnThreat}
                    onChange={(e) => handleChange('notifyOnThreat', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-5 rounded-full transition-colors ${settings.notifyOnThreat ? 'bg-[#a5f54a]' : 'bg-[#2a2a2a]'}`} />
                  <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyOnThreat ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FiCpu className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-medium text-white">Performance</h2>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Concurrent Scans</label>
                <span className="text-sm text-[#a5f54a]">{settings.maxConcurrentScans}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.maxConcurrentScans}
                onChange={(e) => handleChange('maxConcurrentScans', parseInt(e.target.value))}
                className="w-full h-1.5 bg-black-secondary rounded-lg appearance-none cursor-pointer accent-[#a5f54a]"
              />
              <p className="text-xs text-gray-500 mt-2">Higher values use more system resources</p>
            </div>
          </div>
        </div>

        {/* Sidebar - Import/Export & Actions */}
        <div className="space-y-5">
          {/* Actions Card */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <h3 className="text-sm font-medium text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  hasChanges
                    ? 'bg-[#a5f54a] text-black hover:bg-[#8CBF3B]'
                    : 'bg-black-secondary text-gray-500 cursor-not-allowed border border-[#2a2a2a]'
                }`}
              >
                <FiSave className="w-4 h-4" />
                <span>Save Changes</span>
              </button>

              <button
                onClick={() => setShowResetModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-black-secondary text-gray-400 hover:text-red-400 border border-[#2a2a2a] hover:border-red-500/30 transition-all"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Import/Export Card */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <h3 className="text-sm font-medium text-white mb-4">Backup & Restore</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportSettings}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-black-secondary text-gray-300 hover:text-[#a5f54a] border border-[#2a2a2a] hover:border-[#a5f54a]/30 transition-all"
              >
                <FiUpload className="w-4 h-4" />
                <span>Export Settings</span>
              </button>

              <button
                onClick={handleImportSettings}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-black-secondary text-gray-300 hover:text-[#a5f54a] border border-[#2a2a2a] hover:border-[#a5f54a]/30 transition-all"
              >
                <FiDownload className="w-4 h-4" />
                <span>Import Settings</span>
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-[#a5f54a] mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-white mb-1">About Settings</h4>
                <p className="text-xs text-gray-500">
                  Settings are stored locally on your device. Changes apply immediately after saving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to their default values? This action cannot be undone."
        confirmText="Reset All"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  )
}

export default Settings