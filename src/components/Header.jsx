export default function Header({ analyzedCount, user, onLogout }) {
  return (
    <header style={{
      background: 'rgba(13,30,53,0.95)',
      borderBottom: '1px solid #1E3D60',
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
          letterSpacing: '.1em', color: '#FF1744',
          textShadow: '0 0 8px rgba(255,23,68,0.9), 0 0 20px rgba(255,23,68,0.6), 0 0 40px rgba(255,23,68,0.3)'
        }}>
          ⊕ CONFLICTLY
        </span>
        <span style={{
          color: '#7AAAD0', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '.06em', borderLeft: '1px solid #1E3D60', paddingLeft: 12,
          textShadow: '0 0 8px rgba(100,180,255,0.8), 0 0 20px rgba(60,140,255,0.4)'
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
                background: 'rgba(30,136,229,0.15)', border: '1px solid #1E88E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11,
                color: '#90CAF9'
              }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#90CAF9', textShadow: '0 0 8px rgba(30,136,229,0.75), 0 0 18px rgba(30,136,229,0.4)' }}>
                {user.username}
              </span>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.3)',
                borderRadius: 3, padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: '#FF1744', letterSpacing: '.06em', transition: 'all .2s',
                textShadow: '0 0 6px rgba(255,23,68,0.8)'
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
