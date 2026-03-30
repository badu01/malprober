// src/renderer/pages/FileScan.tsx
import React, { useState } from 'react'
import {
  FiShield,
  FiCheck
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import FileUpload from '../components/FileUpload'
import AnalysisProgress from '../components/AnalysisProgress'
import ResultsDisplay from '../components/ResultsDisplay'
import axios from 'axios'
import { analysisService } from '../renderer/services/analysisService' // Import the service
import ChatBot from '../components/ChatBot'

const FileScan: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null) // NEW: Store file path separately
  const [fileInfo, setFileInfo] = useState<any>(null) // NEW: Store file info
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  // Handle file selection from FileUpload component
  const handleFileSelect = async (file: File, filePath?: string, fileInfoData?: any) => {
    setSelectedFile(file)
    setSelectedFilePath(filePath || null)
    setFileInfo(fileInfoData || null)
    setAnalysisResults(null)
    setAnalysisId(null)
    setProgress(0)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setProgress(10)
    setStatusMessage('Preparing file for analysis...')

    try {
      let filePathToUse = selectedFilePath;

      if (!filePathToUse && window.electronAPI) {
        setStatusMessage('Getting file information...')

        const dialogPath = await window.electronAPI.openFileDialog()
        if (dialogPath) {
          filePathToUse = dialogPath
          const info = await window.electronAPI.getFileInfo(dialogPath)
          setFileInfo(info)
        } else {
          throw new Error('File selection cancelled')
        }
      }

      // If we're in web mode or still no path, use FormData upload
      if (!filePathToUse || !window.electronAPI) {
        setStatusMessage('Uploading file to analysis server...')

        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setProgress(Math.min(percent, 30))
            }
          }
        })

        console.log('Upload response:', uploadResponse.data) // Debug log

        if (!uploadResponse.data.success) {
          throw new Error(uploadResponse.data.message || 'Upload failed')
        }

        setProgress(30)
        setStatusMessage('File uploaded, starting analysis...')

        // CRITICAL FIX: Make sure we're sending the correct property name
        // Backend expects 'filePath' (see your apiHandlers.ts)
        const analysisResult = await axios.post('http://localhost:5000/api/analyze', {
          filePath: uploadResponse.data.fileInfo.file_path  // Make sure this matches backend
        })

        console.log('Analysis result:', analysisResult.data) // Debug log

        if (!analysisResult.data.success) {
          throw new Error(analysisResult.data.message || 'Failed to start analysis')
        }

        const newAnalysisId = analysisResult.data.analysisId
        setAnalysisId(newAnalysisId)
        setProgress(40)
        setStatusMessage('Analysis in progress...')

        await pollAnalysisStatus(newAnalysisId)

      } else {
        // Use Electron IPC
        setStatusMessage('Uploading file via Electron...')

        console.log('Uploading file via Electron:', filePathToUse) // Debug log

        const uploadResult = await analysisService.uploadFile(filePathToUse)

        console.log('Electron upload result:', uploadResult) // Debug log

        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Upload failed')
        }

        setProgress(30)
        setStatusMessage('File uploaded, starting analysis...')

        // CRITICAL FIX: Use the correct file_path from the response
        const analysisResult = await analysisService.startAnalysis(uploadResult.fileInfo.file_path)

        console.log('Analysis start result:', analysisResult) // Debug log

        if (!analysisResult.success) {
          throw new Error(analysisResult.message || 'Failed to start analysis')
        }

        const newAnalysisId = analysisResult.analysisId
        setAnalysisId(newAnalysisId)
        setProgress(40)
        setStatusMessage('Analysis in progress...')

        await pollAnalysisStatus(newAnalysisId)
      }

    } catch (error: any) {
      console.error('Analysis failed:', error)

      // Better error message
      let errorMessage = error.message || 'Analysis failed'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }

      toast.error(errorMessage)
      setStatusMessage('Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Poll analysis status
  // Poll analysis status
  const pollAnalysisStatus = async (id: string) => {
    return new Promise<void>((resolve, reject) => {
      const poll = async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:5000/api/status/${id}`)

          if (statusResponse.data.found && statusResponse.data.analysis) {
            const analysis = statusResponse.data.analysis

            // Update progress based on status
            const progressMap: Record<string, number> = {
              'restoring': 45,
              'starting_vm': 50,
              'booting': 55,
              'copying': 60,
              'executing': 70,
              'monitoring': 75,
              'shutting_down': 85,
              'collecting_logs': 90,
              'completed': 100,
              'failed': 100
            }

            const stepMap: Record<string, number> = {
              'restoring': 1,
              'starting_vm': 2,
              'booting': 2,
              'copying': 3,
              'executing': 4,
              'monitoring': 5,
              'shutting_down': 6,
              'collecting_logs': 6,
              'completed': 7,
              'failed': 7
            }

            if (analysis.status in progressMap) {
              setProgress(progressMap[analysis.status])
            }

            if (analysis.status in stepMap) {
              setCurrentStep(stepMap[analysis.status])
            }

            // Update status message
            if (analysis.events && analysis.events.length > 0) {
              const lastEvent = analysis.events[analysis.events.length - 1]
              setStatusMessage(lastEvent.message)
            } else {
              setStatusMessage(analysis.status.replace('_', ' ').toUpperCase())
            }

            // Check for error that might contain 'original_name'
            if (analysis.status === 'failed') {
              const errorMsg = analysis.error || 'Analysis failed';

              // If the error is about 'original_name', show a more helpful message
              if (errorMsg.includes('original_name')) {
                console.error('Property name mismatch detected. Please update backend to use consistent property names.');
                toast.error('Analysis failed due to data format mismatch. Check console for details.');
              } else {
                toast.error(errorMsg);
              }

              reject(new Error(errorMsg));
              return;
            }

            // Check if complete
            if (analysis.status === 'completed') {
              console.log(`[${id}] Analysis completed, fetching results...`);
              
              const resultsResponse = await axios.get(`http://localhost:5000/api/results/${id}`)
              setAnalysisResults(resultsResponse.data)
              console.log("RESULTTTTT",analysisResults);
              toast.success('Analysis complete!')
              resolve()
              return
            }
          }

          setTimeout(poll, 2000)

        } catch (error: any) {
          console.error('Polling error:', error)
          reject(error)
        }
      }

      poll()
    })
  }

  const steps = [
    'Uploading File',
    'Restoring VM',
    'Starting VM',
    'Copying File',
    'Executing Malware',
    'Monitoring Behavior',
    'Collecting Logs',
    'Generating Report'
  ]

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="glass-effect rounded-2xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-green-main">
                File Scan
              </h1>
              <p className="text-gray-400 mt-2">
                Upload suspicious files for comprehensive malware detection
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiShield className="w-6 h-6 text-[#a5f54a]" />
                <span className="text-sm font-medium">Secure Analysis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - File Upload */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Upload File</h2>
                <p className="text-gray-400">
                  Drag and drop your file or click to browse. Maximum file size: 50MB
                </p>
              </div>

              <FileUpload
                onFileSelected={handleFileSelect}
                isAnalyzing={isAnalyzing}
              />

              {selectedFile && !isAnalyzing && (
                <div className="mt-6">
                  <button
                    onClick={handleAnalyze}
                    className="w-full bg-[#a5f54a] text-[#111111] px-6 py-3 rounded-lg font-medium hover:bg-[#8CBF3B] transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiShield className="w-5 h-5" />
                    <span>Start Analysis</span>
                  </button>
                </div>
              )}
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="card mt-6">
                <AnalysisProgress
                  currentStep={currentStep}
                  steps={steps}
                  progress={progress}
                  status={statusMessage}
                  analysisId={analysisId}
                />
              </div>
            )}
          </div>

          {/* Right Column - Recent Scans & Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            {/* <div className="card">
              <h3 className="text-lg font-semibold mb-4">Analysis Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Files Scanned</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Threats Detected</span>
                  <span className="font-medium text-red-400">42</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Average Confidence</span>
                  <span className="font-medium text-[#a5f54a]">94.2%</span>
                </div>
              </div>
            </div> */}







              <ChatBot analysisResults={analysisResults} isAnalyzing={isAnalyzing}/>











            {/* Tips */}
            {/* <div className="card">
              <h3 className="text-lg font-semibold mb-4">Analysis Tips</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <FiCheck className="w-5 h-5 text-[#a5f54a] mt-0.5 shrink-0" />
                  <span className="text-sm">Files are analyzed in isolated VM environment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="w-5 h-5 text-[#a5f54a] mt-0.5 shrink-0" />
                  <span className="text-sm">Sysmon and Fakenet capture detailed behavior</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="w-5 h-5 text-[#a5f54a] mt-0.5 shrink-0" />
                  <span className="text-sm">Results include process, network, and file operations</span>
                </li>
              </ul>
            </div> */}
          </div>
        </div>

        {/* Results Display */}
        {analysisResults && (
          <div className="mt-8">
            <ResultsDisplay results={analysisResults} />
          </div>
        )}
      </div>
    </div>
  )
}

export default FileScan