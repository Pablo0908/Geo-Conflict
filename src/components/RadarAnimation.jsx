import './RadarAnimation.css'

export default function RadarAnimation({ active = false, size = 80 }) {
  const color = active ? 'var(--accent-red)' : 'var(--text-muted)'
  const cx = size / 2
  const r1 = size * 0.45
  const r2 = size * 0.32
  const r3 = size * 0.18

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`radar${active ? ' radar--active' : ''}`}
      aria-hidden="true"
    >
      {/* Outer pulsing ring */}
      <circle
        cx={cx} cy={cx} r={r1}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
        className={active ? 'radar-ring-outer' : ''}
      />
      {/* Mid ring */}
      <circle
        cx={cx} cy={cx} r={r2}
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.3"
      />
      {/* Inner ring */}
      <circle
        cx={cx} cy={cx} r={r3}
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        opacity="0.25"
      />
      {/* Cross hairs */}
      <line x1={cx} y1={cx - r1} x2={cx} y2={cx + r1} stroke={color} strokeWidth="0.5" opacity="0.2" />
      <line x1={cx - r1} y1={cx} x2={cx + r1} y2={cx} stroke={color} strokeWidth="0.5" opacity="0.2" />

      {/* Sweep arm */}
      {active && (
        <g className="radar-sweep" style={{ transformOrigin: `${cx}px ${cx}px` }}>
          {/* Gradient sweep wedge approximation via arc */}
          <line
            x1={cx} y1={cx}
            x2={cx} y2={cx - r1 - 2}
            stroke={color}
            strokeWidth="1.5"
            opacity="0.9"
          />
          <line
            x1={cx} y1={cx}
            x2={cx + r1 * 0.5} y2={cx - r1 * 0.86}
            stroke={color}
            strokeWidth="0.8"
            opacity="0.4"
          />
        </g>
      )}

      {/* Center dot */}
      <circle cx={cx} cy={cx} r="2" fill={color} opacity={active ? 1 : 0.4} />
    </svg>
  )
}
