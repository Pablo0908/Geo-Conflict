// ── Conflict-status classification ──────────────────────────────────────────
// The AI assigns every analyzed country exactly one of these three roles.
// STATUS_META is the single source of truth — reused by the panel badge,
// the history list and the 3D globe (Globe3D imports STATUS_HEX from here).
//
// Phosphorescent rule (project memory): every label carries a color-matched
// glow via text-shadow — never flat.
export const STATUS_META = {
  'IN-CONFLICT': {
    label: 'IN-CONFLICT',
    short: 'IN-CONFLICT',
    hex:   '#FF1744',
    bg:    '#3D0A0A',
    glow:  '0 0 8px rgba(255,23,68,0.85), 0 0 20px rgba(255,23,68,0.45)',
  },
  'POSSIBLE': {
    label: 'POSSIBLE CONFLICT',
    short: 'POSSIBLE',
    hex:   '#FF9100',
    bg:    '#2D1A0A',
    glow:  '0 0 8px rgba(255,145,0,0.85), 0 0 20px rgba(255,145,0,0.45)',
  },
  'CLEAR': {
    label: 'CLEAR',
    short: 'CLEAR',
    hex:   '#00E676',
    bg:    '#0A2D1A',
    glow:  '0 0 8px rgba(0,230,118,0.85), 0 0 20px rgba(0,230,118,0.45)',
  },
}

// Hex lookup for the globe (cap / stroke / label colors).
export const STATUS_HEX = {
  'IN-CONFLICT': STATUS_META['IN-CONFLICT'].hex,
  'POSSIBLE':    STATUS_META['POSSIBLE'].hex,
  'CLEAR':       STATUS_META['CLEAR'].hex,
}

// Normalize whatever the model returned into one of the three known keys.
export function normalizeStatus(raw) {
  if (!raw) return 'CLEAR'
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '-').replace(/_/g, '-')
  if (s.startsWith('IN-CONFLICT') || s === 'CONFLICT' || s === 'IN-CONFLICTO' || s === 'EN-CONFLICTO') return 'IN-CONFLICT'
  if (s.startsWith('POSSIBLE') || s.startsWith('POSIBLE') || s === 'MAYBE' || s === 'UNCERTAIN') return 'POSSIBLE'
  if (s.startsWith('CLEAR') || s.startsWith('CLARO') || s === 'SAFE' || s === 'STABLE') return 'CLEAR'
  return 'CLEAR'
}

export default function ConflictBadge({ status, small = false, confidence }) {
  const key  = normalizeStatus(status)
  const meta = STATUS_META[key]

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            6,
      background:     meta.bg,
      color:          meta.hex,
      border:         `1px solid ${meta.hex}`,
      borderRadius:   3,
      fontFamily:     'JetBrains Mono, monospace',
      fontWeight:     600,
      fontSize:       small ? 10 : 12,
      padding:        small ? '1px 7px' : '4px 12px',
      letterSpacing:  '0.06em',
      lineHeight:     1,
      whiteSpace:     'nowrap',
      textShadow:     meta.glow,
      boxShadow:      `0 0 10px ${meta.hex}44, inset 0 0 8px ${meta.hex}18`,
    }}>
      {/* status dot */}
      <span style={{
        width: small ? 5 : 7, height: small ? 5 : 7, borderRadius: '50%',
        background: meta.hex, boxShadow: `0 0 6px ${meta.hex}`, flexShrink: 0,
      }} />
      {small ? meta.short : meta.label}
      {!small && typeof confidence === 'number' && (
        <span style={{ opacity: 0.7, fontWeight: 400, fontSize: 10 }}>· {confidence}%</span>
      )}
    </span>
  )
}
