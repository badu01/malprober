// src/renderer/components/AnalysisProgress.tsx
import React from 'react'
import { FiUpload, FiSearch, FiShield, FiFileText } from 'react-icons/fi'

interface AnalysisProgressProps {
  currentStep: number
  steps: string[]
  progress: number
  status?: string
  analysisId?:string | null
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ 
  currentStep, 
  steps, 
  progress,
  status,
}) => {
  const stepIcons = [FiUpload, FiSearch, FiShield, FiFileText]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Analysis Progress</h3>
          <p className="text-gray-400">{status}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-main bg-clip-text ">
            {progress}%
          </div>
          <div className="text-sm text-gray-400">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-2 bg-black-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-main rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const Icon = stepIcons[index] || FiFileText
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          
          return (
            <div
              key={step}
              className={`
                relative p-4 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-linear-to-br from-black-primary to-black-secondary border border-gray-700 scale-[1.02]' 
                  : isCompleted
                  ? 'bg-green-main/5 border border-green-main/30'
                  : 'bg-black-secondary/30'
                }
              `}
            >
              

              <div className="flex items-center space-x-3">
                <div className={`
                  p-2 rounded-lg transition-all duration-300
                  ${isActive 
                    ? 'bg-green-main scale-110' 
                    : isCompleted
                    ? 'bg-green-main/20'
                    : 'bg-gray-700'
                  }
                `}>
                  <Icon className={`
                    w-5 h-5 transition-colors duration-300
                    ${isActive 
                      ? 'text-black-primary' 
                      : isCompleted
                      ? 'text-green-main'
                      : 'text-gray-500'
                    }
                  `} />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`
                      text-sm font-medium transition-colors duration-300
                      ${isActive 
                        ? 'text-white' 
                        : isCompleted
                        ? 'text-green-main'
                        : 'text-gray-400'
                      }
                    `}>
                      Step {index + 1}
                    </span>
                    {isCompleted && (
                      <div className="w-2 h-2 bg-green-main rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{step}</p>
                </div>
              </div>

              {/* Status indicator */}
              {isActive && (
                <div className="absolute -top-2 -right-2">
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-main rounded-full animate-ping"></div>
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-main rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AnalysisProgress