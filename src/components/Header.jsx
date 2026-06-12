export default function Header({ analyzedCount, user, onLogout }) {
  return (
    <header style={{
      background: 'rgba(2,9,18,0.92)',
      borderBottom: '1px solid #0A3A55',
      boxShadow: '0 1px 20px rgba(0,180,255,0.08)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20,
          letterSpacing: '.1em', color: '#00E5FF',
          textShadow: '0 0 18px rgba(0,229,255,0.55)'
        }}>
          ⊕ CONFLICTLY
        </span>
        <span style={{
          color: '#3A7A99', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '.06em', borderLeft: '1px solid #0A3A55', paddingLeft: 12
        }}>
          CONFLICT INTELLIGENCE PLATFORM
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#3A7A99', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
            background: analyzedCount > 0 ? '#00E676' : '#3A7A99',
            boxShadow: analyzedCount > 0 ? '0 0 7px #00E676' : 'none'
          }} />
          {analyzedCount} {analyzedCount === 1 ? 'país analizado' : 'países analizados'}
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(0,100,180,0.2)', border: '1px solid #00AAFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11,
                color: '#00C8FF'
              }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#00C8FF' }}>
                {user.username}
              </span>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.3)',
                borderRadius: 3, padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: '#FF1744', letterSpacing: '.06em', transition: 'all .2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,23,68,0.18)'; e.currentTarget.style.borderColor = '#FF1744' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,23,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,23,68,0.3)' }}
            >
              SALIR
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
