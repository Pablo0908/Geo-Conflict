import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Globe3D from './components/Globe3D.jsx'
import ConflictPanel from './components/ConflictPanel.jsx'
import StarField from './components/StarField.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { predictConflicts } from './services/claudeApi.js'
import { getComments } from './services/commentsApi.js'

// v2 — analysis shape changed (conflictStatus + comment analysis), so ignore old caches.
const CACHE_KEY_PREFIX = 'conflictly_v2_'

// A cache is only valid while the country's comments are unchanged, since the
// analysis reads them. Comments arrive newest-first from the API.
function commentSig(comments) {
  return `${comments.length}:${comments[0]?.id || ''}`
}

function getCache(countryCode) {
  try { const r = sessionStorage.getItem(CACHE_KEY_PREFIX + countryCode); return r ? JSON.parse(r) : null } catch { return null }
}
function setCache(countryCode, data) {
  try { sessionStorage.setItem(CACHE_KEY_PREFIX + countryCode, JSON.stringify(data)) } catch {}
}

export default function App() {
  const navigate = useNavigate()

  const [user, setUser]                = useState(null)
  const [booted, setBooted]            = useState(false)
  const [selectedCountry, setSelected] = useState(null)
  const [prediction, setPrediction]    = useState(null)
  const [loading, setLoading]          = useState(false)
  const [error, setError]              = useState(null)
  const [history, setHistory]          = useState([])
  const [analyzedCount, setCount]      = useState(0)
  const [mobileOpen, setMobileOpen]    = useState(false)

  // Restore session before deciding any redirects (avoids login-flash)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('conflictly_user')
      if (saved) setUser(JSON.parse(saved))
    } catch {}
    setBooted(true)
  }, [])

  const handleAuthSuccess = useCallback((data) => {
    setUser(data)
    navigate('/main', { replace: true })
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem('conflictly_user')
    setUser(null)
    navigate('/access', { replace: true })
  }, [navigate])

  const analyze = useCallback(async (countryName, countryCode) => {
    if (!countryName) return
    setSelected({ name: countryName, code: countryCode })
    setError(null)
    setMobileOpen(true)
    setPrediction(null)
    setLoading(true)

    try {
      // 1. Read the country's community comments — the AI analyzes these.
      const comments = await getComments(countryName).catch(() => [])
      const sig      = commentSig(comments)

      // 2. Reuse a cached analysis only if the comments haven't changed.
      const cached = getCache(countryCode)
      let data
      if (cached && cached._sig === sig) {
        data = cached
      } else {
        data = await predictConflicts(countryName, countryCode, comments)
        data._sig = sig
        setCache(countryCode, data)
        setCount(prev => prev + 1)
      }

      setPrediction(data)
      setHistory(prev => {
        const filtered = prev.filter(h => h.code !== countryCode)
        return [{ name: countryName, code: countryCode, status: data.conflictStatus }, ...filtered].slice(0, 5)
      })
    } catch (err) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleHistoryClick = useCallback((item) => {
    const cached = getCache(item.code)
    setSelected({ name: item.name, code: item.code })
    setPrediction(cached)
    setError(null)
    setLoading(false)
    setMobileOpen(true)
  }, [])

  // Wait for the session-restore effect before routing decisions
  if (!booted) return null

  const mainApp = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'transparent' }}>
      <StarField />
      <Header analyzedCount={analyzedCount} user={user} onLogout={logout} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <Globe3D onCountryClick={analyze} selectedCode={selectedCountry?.code} history={history} />
        <ConflictPanel
          country={selectedCountry}
          prediction={prediction}
          loading={loading}
          error={error}
          history={history}
          user={user}
          onRetry={() => selectedCountry && analyze(selectedCountry.name, selectedCountry.code)}
          onHistoryClick={handleHistoryClick}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>
    </div>
  )

  return (
    <Routes>
      {/* Login / register — redirect to app if already authenticated */}
      <Route
        path="/access"
        element={user ? <Navigate to="/main" replace /> : <AuthPage onSuccess={handleAuthSuccess} />}
      />
      {/* Main globe app — protected, redirect to /access if not authenticated */}
      <Route
        path="/main"
        element={user ? mainApp : <Navigate to="/access" replace />}
      />
      {/* Root and anything else → send to the right place based on auth */}
      <Route path="*" element={<Navigate to={user ? '/main' : '/access'} replace />} />
    </Routes>
  )
}
