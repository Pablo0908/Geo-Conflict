import { useState } from 'react'
import { login, register } from '../services/authApi.js'

const INPUT_BASE = {
  width: '100%',
  background: 'rgba(0,20,40,0.7)',
  border: '1px solid #1E3D60',
  borderRadius: 4,
  padding: '10px 14px',
  color: '#C8F0FF',
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, letterSpacing: '.1em', color: '#3A7A99', marginBottom: 6
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...INPUT_BASE,
          borderColor: focused ? '#1E88E5' : '#0A1535',
          boxShadow:   focused ? '0 0 14px rgba(30,136,229,0.28)' : 'none',
        }}
      />
    </div>
  )
}

export default function AuthPage({ onSuccess }) {
  const [tab, setTab]        = useState('login')
  const [username, setUser]  = useState('')
  const [email, setEmail]    = useState('')
  const [password, setPwd]   = useState('')
  const [error, setError]    = useState('')
  const [loading, setLoad]   = useState(false)

  const switchTab = (t) => { setTab(t); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoad(true)
    try {
      const data = tab === 'login'
        ? await login(email, password)
        : await register(username, email, password)
      localStorage.setItem('conflictly_user', JSON.stringify(data))
      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoad(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0D1F35', position: 'relative', overflow: 'hidden'
    }}>
      {/* Hologram grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(30,100,229,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,100,229,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px'
      }} />
      {/* Center glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(20,80,180,0.30) 0%, transparent 65%)'
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 30,
            letterSpacing: '.12em', color: '#FF1744',
            textShadow: '0 0 8px rgba(255,23,68,0.95), 0 0 24px rgba(255,23,68,0.65), 0 0 50px rgba(255,23,68,0.3)', marginBottom: 8
          }}>
            ⊕ CONFLICTLY
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.18em', color: '#7AAAD0', textShadow: '0 0 8px rgba(100,180,255,0.8), 0 0 20px rgba(60,140,255,0.4)' }}>
            CONFLICT INTELLIGENCE PLATFORM
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(13,30,55,0.97)',
          border: '1px solid #1E3D60',
          borderRadius: 8,
          padding: 32,
          boxShadow: '0 0 50px rgba(0,100,200,0.1), 0 24px 60px rgba(0,0,0,0.7)'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid #0A1535' }}>
            {[['login','ACCEDER'], ['register','REGISTRARSE']].map(([t, label]) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                style={{
                  flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 0', fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11, letterSpacing: '.1em',
                  color: tab === t ? '#1E88E5' : '#3A5A99',
                  borderBottom: tab === t ? '2px solid #1E88E5' : '2px solid transparent',
                  marginBottom: -1, transition: 'color .2s',
                  textShadow: tab === t ? '0 0 8px rgba(30,136,229,0.85), 0 0 20px rgba(30,136,229,0.4)' : '0 0 6px rgba(90,128,170,0.5)'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {tab === 'register' && (
              <Field label="NOMBRE DE USUARIO" value={username} onChange={setUser} placeholder="agente_001" />
            )}
            <Field label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="usuario@dominio.com" />
            <Field label="CONTRASEÑA" type="password" value={password} onChange={setPwd} placeholder="••••••••" />

            {error && (
              <div style={{
                background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.4)',
                borderRadius: 4, padding: '8px 12px', marginBottom: 16,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#FF1744'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 0', marginTop: 4,
                background: loading ? 'rgba(10,40,120,0.2)' : 'rgba(30,136,229,0.12)',
                border: '1px solid #1E88E5', borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600,
                fontSize: 13, letterSpacing: '.1em', color: '#90CAF9',
                textShadow: '0 0 8px rgba(30,136,229,0.85), 0 0 20px rgba(30,136,229,0.45)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(30,136,229,0.18)',
                transition: 'all .2s'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(30,136,229,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(10,40,120,0.2)' : 'rgba(30,136,229,0.12)' }}
            >
              {loading ? '...' : tab === 'login' ? 'ACCEDER AL SISTEMA' : 'CREAR CUENTA'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
