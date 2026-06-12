import { useEffect, useState, useRef } from 'react'
import RadarAnimation from './RadarAnimation.jsx'
import ConflictBadge, { STATUS_META, normalizeStatus } from './ConflictBadge.jsx'
import CommentsSection from './CommentsSection.jsx'

// Sentiment → glow color for the comment-analysis chip.
const SENTIMENT_COLOR = {
  TENSO:    '#FF1744',
  NEGATIVO: '#FF6D00',
  MIXTO:    '#FF9100',
  NEUTRAL:  '#5BA8E5',
  CALMADO:  '#00E676',
}
function sentimentColor(s) {
  return SENTIMENT_COLOR[String(s || '').toUpperCase()] || '#5BA8E5'
}
function glowFor(hex) {
  return `0 0 8px ${hex}D9, 0 0 18px ${hex}66`
}
// Color-matched glow for light cyan/white body text (phosphorescent rule).
const GLOW_LIGHT = '0 0 8px rgba(200,240,255,0.55), 0 0 18px rgba(120,200,255,0.30)'

function TypewriterText({ text, speed = 25 }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)
  const frameRef = useRef(null)
  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    function tick() {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
        frameRef.current = setTimeout(tick, speed)
      }
    }
    frameRef.current = setTimeout(tick, speed)
    return () => clearTimeout(frameRef.current)
  }, [text, speed])
  return <span>{displayed}</span>
}

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 11,
        letterSpacing: '.1em', color: '#3A5A99', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6
      }}>
        <span style={{ color: '#1E88E5', textShadow: '0 0 8px rgba(30,136,229,0.9), 0 0 18px rgba(30,136,229,0.5)' }}>{icon}</span>{title}
      </div>
      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 32, textAlign: 'center' }}>
      <RadarAnimation active={false} size={90} />
      <p style={{ color: '#3A7A99', fontSize: 13, lineHeight: 1.7, maxWidth: 240 }}>
        Selecciona un país en el globo para ver su análisis de conflicto
      </p>
    </div>
  )
}

function LoadingState({ countryName }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 32, textAlign: 'center' }}>
      <RadarAnimation active size={90} />
      <div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#C8F0FF', marginBottom: 6 }}>
          {countryName}
        </div>
        <div style={{ color: '#3A7A99', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
          Analizando vectores de conflicto...
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5FF', display: 'inline-block', animation: `blink 1.2s ${i * 0.3}s ease-in-out infinite` }} />
        ))}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
    </div>
  )
}

function PredictionView({ country, prediction }) {
  const statusKey  = normalizeStatus(prediction.conflictStatus)
  const meta       = STATUS_META[statusKey]
  const ca         = prediction.commentAnalysis || {}
  const pred       = prediction.prediction || {}
  const sentHex    = sentimentColor(ca.sentiment)

  return (
    <div style={{ padding: '20px 20px 24px', overflowY: 'auto', flex: 1 }}>
      {/* Country header + conflict-status badge */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1E3D60' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#C8F0FF' }}>
            {prediction.country || country.name}
          </h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#3A7A99' }}>
            {country.code}
          </span>
        </div>
        <ConflictBadge status={statusKey} confidence={prediction.confidence} />
      </div>

      {/* WHY — the AI's justification for the status (required for IN-CONFLICT) */}
      {prediction.statusReason && (
        <Section icon="▸" title="VEREDICTO — ¿POR QUÉ?">
          <div style={{
            background: `${meta.hex}12`, borderLeft: `3px solid ${meta.hex}`,
            borderRadius: 4, padding: '10px 14px'
          }}>
            <p style={{ color: '#E6F4FF', fontSize: 13, lineHeight: 1.7, margin: 0, textShadow: GLOW_LIGHT }}>
              <span style={{ color: meta.hex, textShadow: meta.glow, fontWeight: 700 }}>
                [{meta.label}]
              </span>{' '}
              {prediction.statusReason}
            </p>
          </div>
        </Section>
      )}

      {/* Radar + executive summary */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ flexShrink: 0 }}><RadarAnimation active size={60} /></div>
        <Section icon="▸" title="RESUMEN EJECUTIVO">
          <p style={{ color: '#C8F0FF', fontSize: 13, lineHeight: 1.7, textShadow: GLOW_LIGHT }}>{prediction.executiveSummary}</p>
        </Section>
      </div>

      {/* Comment analysis — what the AI read from the community */}
      <Section icon="▸" title="ANÁLISIS DE COMENTARIOS">
        <div style={{ background: 'rgba(15,35,70,0.55)', border: '1px solid #1E3D60', borderRadius: 6, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ca.summary ? 8 : 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#90CAF9', textShadow: '0 0 8px rgba(30,136,229,0.7)' }}>
              {ca.analyzed || 0} {(ca.analyzed === 1) ? 'comentario analizado' : 'comentarios analizados'}
            </span>
            {ca.sentiment && (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
                color: sentHex, border: `1px solid ${sentHex}`, borderRadius: 3,
                padding: '2px 8px', letterSpacing: '.05em', textShadow: glowFor(sentHex)
              }}>
                {String(ca.sentiment).toUpperCase()}
              </span>
            )}
          </div>
          {ca.summary && (
            <p style={{ color: '#C8F0FF', fontSize: 12, lineHeight: 1.65, margin: '0 0 8px', textShadow: GLOW_LIGHT }}>{ca.summary}</p>
          )}
          {Array.isArray(ca.themes) && ca.themes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ca.themes.map((t, i) => (
                <span key={i} style={{ background: 'rgba(20,50,100,0.55)', border: '1px solid #1E3D60', borderRadius: 4, padding: '2px 9px', fontSize: 10, color: '#90CAF9', textShadow: '0 0 7px rgba(30,136,229,0.6)' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Prediction — driven by the community comments */}
      <Section icon="▸" title="PREDICCIÓN (BASADA EN COMENTARIOS)">
        <div style={{ background: 'rgba(15,35,70,0.55)', border: '1px solid #1E3D60', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: pred.detail ? 8 : 0 }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: '#C8F0FF', textShadow: GLOW_LIGHT }}>
              {pred.headline || '—'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {pred.timeframe && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3A7A99' }}>{pred.timeframe}</span>
              )}
              {typeof pred.probability === 'number' && (
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
                  color: pred.probability >= 70 ? '#FF1744' : pred.probability >= 40 ? '#FF9100' : '#00E676',
                  textShadow: glowFor(pred.probability >= 70 ? '#FF1744' : pred.probability >= 40 ? '#FF9100' : '#00E676')
                }}>
                  {pred.probability}%
                </span>
              )}
            </div>
          </div>
          {pred.detail && (
            <p style={{ color: '#C8F0FF', fontSize: 12.5, lineHeight: 1.7, margin: 0, textShadow: GLOW_LIGHT }}>
              <TypewriterText text={pred.detail} speed={20} />
            </p>
          )}
        </div>
      </Section>

      {/* Potential conflicts */}
      {prediction.potentialConflicts?.length > 0 && (
        <Section icon="▸" title="CONFLICTOS POTENCIALES">
          {prediction.potentialConflicts.map((c, i) => (
            <div key={i} style={{ background: 'rgba(15,35,70,0.55)', border: '1px solid #1E3D60', borderRadius: 6, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 12, color: '#C8F0FF', textShadow: GLOW_LIGHT }}>
                  {i + 1}. {c.type}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3A7A99' }}>{c.timeframe}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500, color: c.probability >= 70 ? '#FF1744' : c.probability >= 40 ? '#FF9100' : '#00E676', textShadow: glowFor(c.probability >= 70 ? '#FF1744' : c.probability >= 40 ? '#FF9100' : '#00E676') }}>
                    {c.probability}%
                  </span>
                </div>
              </div>
              <p style={{ color: '#3A7A99', fontSize: 12, lineHeight: 1.6 }}>{c.description}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Actors */}
      {prediction.keyActors?.length > 0 && (
        <Section icon="▸" title="ACTORES CLAVE">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {prediction.keyActors.map((a, i) => (
              <span key={i} style={{ background: 'rgba(20,50,100,0.55)', border: '1px solid #1E3D60', borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#C8F0FF', textShadow: GLOW_LIGHT }}>{a}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Risk factors */}
      {prediction.riskFactors?.length > 0 && (
        <Section icon="▸" title="FACTORES DE RIESGO">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {prediction.riskFactors.map((f, i) => (
              <li key={i} style={{ color: '#C8F0FF', fontSize: 12, lineHeight: 1.6, display: 'flex', gap: 8, textShadow: GLOW_LIGHT }}>
                <span style={{ color: '#00E5FF', flexShrink: 0 }}>–</span>{f}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3A5A80', marginTop: 8, paddingTop: 12, borderTop: '1px solid #1E3D60' }}>
        ANÁLISIS IA — {new Date(prediction.analysisDate).toLocaleString('es-ES')}
      </div>
    </div>
  )
}

function HistoryList({ history, onHistoryClick }) {
  if (!history.length) return null
  return (
    <div style={{ borderTop: '1px solid #1E3D60', padding: '12px 20px', flexShrink: 0 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3A5A80', letterSpacing: '.08em', marginBottom: 8 }}>
        HISTORIAL
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {history.map(item => (
          <button
            key={item.code}
            onClick={() => onHistoryClick(item)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, color: '#C8F0FF', fontSize: 12, textAlign: 'left', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,40,80,0.4)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontFamily: 'Inter, sans-serif' }}>{item.name}</span>
            <ConflictBadge status={item.status} small />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ConflictPanel({ country, prediction, loading, error, history, user, onRetry, onHistoryClick, mobileOpen, onMobileClose }) {
  const [tab, setTab] = useState('analysis')

  // Always reset to analysis tab when switching countries
  useEffect(() => { setTab('analysis') }, [country?.code])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  if (isMobile && !mobileOpen) return null

  const panelStyle = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }
    : { width: 380, background: 'rgba(13,30,53,0.98)', borderLeft: '1px solid #1E3D60', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }

  return (
    <div style={panelStyle}>
      {/* Panel header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E3D60', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '.1em', color: '#3A7A99' }}>
          PANEL DE ANÁLISIS
        </span>
        {isMobile && (
          <button onClick={onMobileClose} style={{ background: 'none', border: 'none', color: '#3A7A99', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {/* Tabs — only when a country is selected */}
      {country && (
        <div style={{ display: 'flex', borderBottom: '1px solid #1E3D60', flexShrink: 0 }}>
          {[['analysis', 'ANÁLISIS IA'], ['comments', 'COMENTARIOS']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                letterSpacing: '.08em', color: tab === key ? '#1E88E5' : '#3A5A99',
                borderBottom: tab === key ? '2px solid #1E88E5' : '2px solid transparent',
                marginBottom: -1, transition: 'color .2s',
                textShadow: tab === key ? '0 0 8px rgba(30,136,229,0.85), 0 0 20px rgba(30,136,229,0.4)' : '0 0 5px rgba(90,128,170,0.45)',
                boxShadow: tab === key ? '0 2px 10px rgba(30,136,229,0.15)' : 'none'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'analysis' && (
          <>
            {loading && <LoadingState countryName={country?.name} />}
            {!loading && error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32, textAlign: 'center' }}>
                <span style={{ fontSize: 32 }}>⚠</span>
                <p style={{ color: '#FF1744', fontSize: 13 }}>{error}</p>
                <button onClick={onRetry} style={{ background: 'rgba(255,23,68,0.12)', color: '#FF1744', border: '1px solid #FF1744', borderRadius: 4, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: '.05em' }}>
                  REINTENTAR
                </button>
              </div>
            )}
            {!loading && !error && !prediction && <EmptyState />}
            {!loading && !error && prediction && <PredictionView country={country} prediction={prediction} />}
          </>
        )}

        {tab === 'comments' && country && (
          <CommentsSection country={country.name} user={user} />
        )}
      </div>

      <HistoryList history={history} onHistoryClick={onHistoryClick} />
    </div>
  )
}
