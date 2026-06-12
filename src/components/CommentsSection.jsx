import { useState, useEffect, useCallback } from 'react'
import { getComments, postComment } from '../services/commentsApi.js'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function Avatar({ name }) {
  const initials = name.slice(0, 2).toUpperCase()
  const hue = name.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},50%,12%)`,
      border: `1px solid hsl(${hue},60%,35%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11,
      color: `hsl(${hue},70%,65%)`
    }}>
      {initials}
    </div>
  )
}

export default function CommentsSection({ country, user }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(false)
  const [text, setText]         = useState('')
  const [posting, setPosting]   = useState(false)
  const [error, setError]       = useState('')

  const load = useCallback(async () => {
    if (!country) return
    setLoading(true)
    try { setComments(await getComments(country)) } catch {}
    finally { setLoading(false) }
  }, [country])

  useEffect(() => { load() }, [load])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    setError('')
    try {
      const c = await postComment(country, text, user.token)
      setComments(prev => [c, ...prev])
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px 6px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.1em', color: '#3A5A80' }}>
          {comments.length} {comments.length === 1 ? 'COMENTARIO' : 'COMENTARIOS'} — {country.toUpperCase()}
        </span>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 12px' }}>
        {loading && (
          <div style={{ color: '#3A7A99', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', padding: '30px 0' }}>
            CARGANDO...
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', textAlign: 'center', gap: 10 }}>
            <div style={{ fontSize: 26, opacity: 0.25 }}>💬</div>
            <p style={{ color: '#3A7A99', fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.7, maxWidth: 220 }}>
              Sin comentarios aún.<br />Sé el primero en analizar {country}.
            </p>
          </div>
        )}

        {comments.map(c => (
          <div key={c.id} style={{
            display: 'flex', gap: 10, marginBottom: 10,
            padding: '10px 12px',
            background: 'rgba(15,35,70,0.5)',
            border: '1px solid #1E3D60',
            borderRadius: 6
          }}>
            <Avatar name={c.username} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 12, color: '#90CAF9' }}>
                  {c.username}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3A5A80' }}>
                  {timeAgo(c.createdAt)}
                </span>
              </div>
              <p style={{ color: '#C8F0FF', fontSize: 12, lineHeight: 1.65, margin: 0, wordBreak: 'break-word' }}>
                {c.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 20px 16px', borderTop: '1px solid #1E3D60', flexShrink: 0 }}>
        {error && (
          <div style={{ color: '#FF1744', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
            {error}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Tu análisis sobre ${country}...`}
            maxLength={500}
            rows={2}
            style={{
              flex: 1, background: 'rgba(0,10,35,0.7)', border: '1px solid #0A1535',
              borderRadius: 4, padding: '8px 10px', color: '#C8F0FF',
              fontFamily: 'Inter, sans-serif', fontSize: 12, resize: 'none', outline: 'none',
              transition: 'border-color .2s'
            }}
            onFocus={e =>  { e.target.style.borderColor = '#1E88E5' }}
            onBlur={e =>   { e.target.style.borderColor = '#0A1535' }}
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            style={{
              background: 'rgba(30,136,229,0.1)', border: '1px solid #1E88E5',
              borderRadius: 4, padding: '0 14px', cursor: 'pointer',
              color: '#90CAF9', fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '.06em', alignSelf: 'stretch',
              opacity: (!text.trim() || posting) ? 0.35 : 1, transition: 'opacity .2s'
            }}
          >
            {posting ? '...' : 'ENVIAR'}
          </button>
        </form>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#2A4A70', marginTop: 4, textAlign: 'right' }}>
          {text.length}/500
        </div>
      </div>
    </div>
  )
}
