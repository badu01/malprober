// src/renderer/pages/Login.tsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FiShield, 
  FiUser, 
  FiLock, 
  FiMail,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiUserPlus,
  FiChrome,
  FiAlertCircle
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  
  const { login, register, loginWithGoogle, resetPassword, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (resetMode) {
        await resetPassword(resetEmail)
        toast.success('Password reset email sent! Check your inbox.')
        setResetMode(false)
        setResetEmail('')
        return
      }
      
      if (isLogin) {
        await login(formData.email, formData.password)
        toast.success('Welcome back to MalProber!')
        navigate('/')
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }
        
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }

        await register(formData.username, formData.email, formData.password)
        toast.success('Account created successfully!')
        navigate('/') // Switch to login after successful registration
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Signed in with Google!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Reset Password Mode
  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center bg-[url(/login_bg.png)] justify-end pr-40 bg-cover">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo_m.svg" alt="MalProber" className="w-12 h-12 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-white">Reset Password</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your email to receive reset link</p>
          </div>
          
          <div className="rounded-xl border  p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#a5f54a] text-black py-2 rounded-lg font-medium text-sm hover:bg-[#8CBF3B] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
              
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="w-full text-gray-500 hover:text-white text-sm transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-end pr-40 bg-[url(/login_bg.png)] bg-cover p-4 ">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="">
          {/* <img src="/logo_m.svg" alt="MalProber" className="w-12 h-12 mx-auto mb-2" /> */}
          <h1 className="text-5xl pl-6 text-white">{
            isLogin ? 'Sign In' : 'Sign Up'
          }</h1>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border p-6">
          {/* Toggle Buttons */}
          <div className="flex gap-1 mb-6 bg-[#1a1a1a] rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isLogin 
                  ? 'bg-[#a5f54a] text-black' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !isLogin 
                  ? 'bg-[#a5f54a] text-black' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
                    placeholder="Enter username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-9 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#a5f54a] transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#a5f54a] focus:ring-[#a5f54a] focus:ring-offset-0"
                  />
                  <span className="ml-2 text-xs text-gray-500">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="text-xs text-[#a5f54a] hover:text-[#8CBF3B] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                loading
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-[#a5f54a] text-black hover:bg-[#8CBF3B]'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isLogin ? (
                    <>
                      <FiLogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a2a]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#141414] text-gray-500">Or</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 py-2 rounded-lg text-sm hover:border-[#a5f54a] hover:text-white transition-all disabled:opacity-50"
          >
            <FiChrome className="w-4 h-4 text-[#a5f54a]" />
            <span>Continue with Google</span>
          </button>

          {/* Demo Credentials */}
          <div className="mt-5 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="w-3.5 h-3.5 text-[#a5f54a] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">
                  <span className="text-[#a5f54a]">Demo Access</span><br />
                  Email: <span className="text-gray-400 font-mono text-[11px]">researcher@malprober.com</span><br />
                  Password: <span className="text-gray-400 font-mono text-[11px]">demo123</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-600">
          By continuing, you agree to our{' '}
          <Link to="#" className="text-[#a5f54a] hover:underline">
            Terms
          </Link>{' '}
          &{' '}
          <Link to="#" className="text-[#a5f54a] hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login