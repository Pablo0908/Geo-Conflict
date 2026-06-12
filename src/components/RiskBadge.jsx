const RISK_STYLES = {
  CRÍTICO: { bg: '#3D0A0A', color: 'var(--accent-red)',   border: 'var(--accent-red)' },
  ALTO:    { bg: '#2D1A0A', color: 'var(--accent-amber)', border: 'var(--accent-amber)' },
  MEDIO:   { bg: '#1A1A0A', color: '#D4C830',             border: '#D4C830' },
  BAJO:    { bg: '#0A2D1A', color: 'var(--accent-green)', border: 'var(--accent-green)' },
}

export default function RiskBadge({ level, small = false }) {
  const style = RISK_STYLES[level] || RISK_STYLES.BAJO

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      borderRadius: 3,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 500,
      fontSize: small ? 10 : 11,
      padding: small ? '1px 6px' : '3px 10px',
      letterSpacing: '0.06em',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      boxShadow: `0 0 8px ${style.border}22`
    }}>
      {level || '—'}
    </span>
  )
}
