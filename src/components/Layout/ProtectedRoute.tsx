import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  const [terminalText, setTerminalText] = useState("")
  
  const lines = [
    "> REQUESTING_SYSCALL_AUTH...",
    "> KERNEL_HANDSHAKE: 0x7FFA",
    "> LOADING_SANDBOX_MODULES...",
    "> STATUS: ENFORCED"
  ]
  const fullText = lines.join("\n")

  useEffect(() => {
    if (loading) {
      let i = 0
      const interval = setInterval(() => {
        setTerminalText(fullText.slice(0, i))
        i++
        if (i > fullText.length) clearInterval(interval)
      }, 25) // Slightly faster, jittery feel
      return () => clearInterval(interval)
    }
  }, [loading, fullText])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black font-mono selection:bg-[#a5f54a] selection:text-black p-6">
        <div className="w-full max-w-sm">
          {/* Main Terminal Output */}
          <div className="text-[11px] md:text-[12px] leading-relaxed tracking-tight">
            <pre className="whitespace-pre-wrap">
              {/* Previous lines in a dim gray to simulate history */}
              <span className="text-gray-600 block mb-2 tracking-[0.2em] text-[10px]">
                --- MALWARE_ENV_v1.0.2 ---
              </span>
              
              {/* Active typing text */}
              <span className="text-[#a5f54a]">
                {terminalText}
              </span>
              
              {/* Classic Block Cursor */}
              <span className="inline-block w-2 h-[14px] ml-1 bg-[#a5f54a] animate-pulse align-middle"></span>
            </pre>
          </div>

          {/* Footer Shimmer Line - Minimalist */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gray-900 overflow-hidden relative">
              <div className="absolute inset-0 bg-[#a5f54a]/30 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            </div>
            <span className="text-[9px] text-gray-700 uppercase tracking-widest">Secure_Sess</span>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute