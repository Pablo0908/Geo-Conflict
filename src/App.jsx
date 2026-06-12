import { useState, useCallback, useEffect } from 'react'
import Header from './components/Header.jsx'
import Globe3D from './components/Globe3D.jsx'
import ConflictPanel from './components/ConflictPanel.jsx'
import StarField from './components/StarField.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { predictConflicts } from './services/claudeApi.js'

const CACHE_KEY_PREFIX = 'conflictly_'

function getCache(countryCode) {
  try { const r = sessionStorage.getItem(CACHE_KEY_PREFIX + countryCode); return r ? JSON.parse(r) : null } catch { return null }
}
function setCache(countryCode, data) {
  try { sessionStorage.setItem(CACHE_KEY_PREFIX + countryCode, JSON.stringify(data)) } catch {}
}

export default function App() {
  const [user, setUser]                 = useState(null)
  const [selectedCountry, setSelected] = useState(null)
  const [prediction, setPrediction]    = useState(null)
  const [loading, setLoading]          = useState(false)
  const [error, setError]              = useState(null)
  const [history, setHistory]          = useState([])
  const [analyzedCount, setCount]      = useState(0)
  const [mobileOpen, setMobileOpen]    = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('conflictly_user')
      if (saved) setUser(JSON.parse(saved))
    } catch {}
  }, [])

  const handleAuthSuccess = useCallback((data) => {
    setUser(data)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('conflictly_user')
    setUser(null)
  }, [])

  const analyze = useCallback(async (countryName, countryCode) => {
    if (!countryName) return
    setSelected({ name: countryName, code: countryCode })
    setError(null)
    setMobileOpen(true)

    const cached = getCache(countryCode)
    if (cached) { setPrediction(cached); setLoading(false); return }

    setLoading(true)
    setPrediction(null)
    try {
      const data = await predictConflicts(countryName, countryCode)
      setCache(countryCode, data)
      setPrediction(data)
      setCount(prev => prev + 1)
      setHistory(prev => {
        const filtered = prev.filter(h => h.code !== countryCode)
        return [{ name: countryName, code: countryCode, risk: data.riskLevel }, ...filtered].slice(0, 5)
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

  if (!user) return <AuthPage onSuccess={handleAuthSuccess} />

  return (
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
}
