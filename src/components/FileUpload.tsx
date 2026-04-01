// src/renderer/components/FileUpload.tsx
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiFile, FiX, FiAlertCircle, FiCheck } from 'react-icons/fi'

interface FileUploadProps {
  onFileSelected: (file: File, filePath?: string, fileInfo?: any) => void
  maxSize?: number
  acceptedTypes?: string[]
  isAnalyzing?: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  maxSize = 1024 * 1024 * 1024,
  acceptedTypes = [
    '.exe', '.dll', '.msi', '.bat', '.cmd',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.js', '.py', '.ps1', '.vbs', '.sh',
    '.zip', '.rar', '.7z', '.tar', '.gz'
  ],
  isAnalyzing = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<any>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDragActive(false)
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]

      // For web drop, we don't have file path
      setSelectedFile(file)
      setFilePath(null)
      setFileInfo(null)
      onFileSelected(file)
    }
  }, [onFileSelected])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    maxFiles: 1,
    maxSize,
    disabled: isAnalyzing,
    accept: acceptedTypes.reduce((acc, ext) => {
      // Handle different MIME types properly
      const mimeMap: Record<string, string> = {
        '.exe': 'application/x-msdownload',
        '.dll': 'application/x-msdownload',
        '.msi': 'application/x-msi',
        '.bat': 'text/plain',
        '.cmd': 'text/plain',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.js': 'text/javascript',
        '.py': 'text/x-python',
        '.ps1': 'text/plain',
        '.vbs': 'text/plain',
        '.sh': 'text/x-sh',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip'
      }

      acc[mimeMap[ext] || 'application/octet-stream'] = [ext]
      return acc
    }, {} as Record<string, string[]>)
  })

  const removeFile = () => {
    setSelectedFile(null)
    setFilePath(null)
    setFileInfo(null)
    setDragActive(false)
  }

  const handleSelectFile = async () => {
    if (window.electronAPI) {
      try {
        const filePath = await window.electronAPI.openFileDialog()
        if (filePath) {
          const fileInfo = await window.electronAPI.getFileInfo(filePath)

          // Create a File object with the correct properties
          const file = new File([], fileInfo.name, {
            type: fileInfo.mimeType || 'application/octet-stream',
            lastModified: new Date(fileInfo.modified).getTime()
          })

          // Add custom properties
          Object.defineProperties(file, {
            path: { value: filePath, writable: false },
            size: { value: fileInfo.size, writable: false }
          })

          setSelectedFile(file)
          setFilePath(filePath)
          setFileInfo(fileInfo)

          // Pass the file info in the format the backend expects
          onFileSelected(file, filePath, {
            original_name: fileInfo.name,  // CRITICAL: Use 'original_name' not 'name'
            file_path: filePath,
            file_size: fileInfo.size,
            file_hash: fileInfo.hash || '',
            file_extension: fileInfo.name.split('.').pop() || ''
          })
        }
      } catch (error) {
        console.error('Error selecting file:', error)
      }
    }
    else {
      // Fallback for web
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = acceptedTypes.join(',')
      input.onchange = (e: any) => {
        const file = e.target.files[0]
        if (file) {
          setSelectedFile(file)
          setFilePath(null)
          setFileInfo(null)
          onFileSelected(file)
        }
      }
      input.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border-3 border-dashed rounded-2xl p-10 
            transition-all duration-300 cursor-pointer
            ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
            ${dragActive
              ? 'border-green-main bg-green-main/10 scale-[1.02]'
              : 'border-black-secondary hover:border-green-main/30 hover:bg-black-primary'
            }
          `}
        >
          <input {...getInputProps()} disabled={isAnalyzing} />

          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className={`
              p-5 rounded-full mb-6 transition-all duration-300
              ${dragActive
                ? 'bg-green-main/20 scale-110'
                : 'bg-black-secondary'
              }
            `}>
              <FiUpload className={`
                w-12 h-12 transition-colors duration-300
                ${dragActive ? 'text-green-main' : 'text-gray-400'}
              `} />
            </div>

            <p className="text-xl font-medium mb-2 text-center">
              {dragActive ? 'Drop the file here' : 'Drag & drop file here'}
            </p>

            <p className="text-gray-400 mb-6 text-center">
              or{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAnalyzing) handleSelectFile()
                }}
                disabled={isAnalyzing}
                className="text-green-main hover:text-[#8CBF3B] font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                browse
              </button>{' '}
              to upload
            </p>

            <div className="grid  gap-4 w-full max-w-lg">
              <div  className="flex flex-col items-center p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Upload formats</div>
                  <div className="text-xs text-green-main font-medium">
                    { '.exe .dll .msi'}
                  </div>
                </div>
            </div>

            <div className="mt-6 p-3 bg-black-secondary rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <FiAlertCircle className="w-4 h-4" />
                <span>Max file size: {formatFileSize(maxSize)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl">
          <div className="relative bg-black-primary backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#a5f54a] rounded-xl">
                  <FiFile className="w-8 h-8 text-black-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{selectedFile.name}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-black-secondary rounded-full">
                      {selectedFile.type || 'Unknown type'}
                    </span>
                    {filePath && (
                      <span className="text-xs px-2 py-1 bg-green-main/10 text-green-main rounded-full">
                        Electron
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={removeFile}
                disabled={isAnalyzing}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove file"
              >
                <FiX className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center p-4 bg-black-secondary rounded-lg">
                <FiCheck className="w-5 h-5 text-[#a5f54a] mr-3" />
                <div>
                  <p className="font-medium">File selected successfully</p>
                  <p className="text-sm text-gray-400">
                    {filePath
                      ? `Path: ${filePath}`
                      : 'Ready for analysis. Click "Start Analysis" to begin.'}
                  </p>
                </div>
              </div>

              {fileInfo && fileInfo.hash && (
                <div className="p-4 bg-black-secondary rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">File Hash (SHA-256)</p>
                  <p className="font-mono text-sm truncate">
                    {fileInfo.hash}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload