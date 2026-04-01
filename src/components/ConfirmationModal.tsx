// src/renderer/components/ConfirmationModal.tsx
import React, { useEffect, useState } from 'react'
import { FiAlertTriangle, FiX, FiTrash2, FiShield } from 'react-icons/fi'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: React.ReactNode
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon
}) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  const handleConfirm = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onConfirm()
      onClose()
    }, 200)
  }

  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-400',
          buttonBg: 'bg-red-500 hover:bg-red-600',
          borderColor: 'border-red-500/20'
        }
      case 'warning':
        return {
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-400',
          buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
          borderColor: 'border-yellow-500/20'
        }
      default:
        return {
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-400',
          buttonBg: 'bg-blue-500 hover:bg-blue-600',
          borderColor: 'border-blue-500/20'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md transform transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                {icon || (type === 'danger' ? (
                  <FiAlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />
                ) : (
                  <FiShield className={`w-5 h-5 ${styles.iconColor}`} />
                ))}
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-5">
            <p className="text-gray-400 text-sm leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2a2a2a] bg-[#0f0f0f]">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-black-primary text-gray-300 text-sm font-medium transition-colors border border-[#2a2a2a]"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg ${styles.buttonBg} text-white text-sm font-medium transition-colors flex items-center gap-2`}
            >
              {type === 'danger' && <FiTrash2 className="w-4 h-4" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal