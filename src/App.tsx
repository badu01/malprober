// src/renderer/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layout
import Layout from './components/Layout'

// Pages
import Dashboard from './pages/Dashboard'
import FileScan from './pages/FileScan'
import UrlScan from './pages/UrlScan'
import History from './pages/History'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Analysis from './pages/Analysis'

// Context Providers
import { AuthProvider } from './contexts/AuthContext'
import { ScanProvider } from './contexts/ScanContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ScanProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="file-scan" element={<FileScan />} />
                <Route path="url-scan" element={<UrlScan />} />
                <Route path="history" element={<History />} />
                <Route path="settings" element={<Settings />} />
                <Route path="analysis/:id" element={<Analysis />} />
              </Route>
            </Routes>
          </Router>
          <ToastContainer 
            position="bottom-right"
            theme="dark"
            autoClose={3000}
            pauseOnHover
          />
        </ScanProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App