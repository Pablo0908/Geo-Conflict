import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createHash, randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const app = express()
app.use(express.json())
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))

// ── Gemini config ───────────────────────────────────────────────────────────
// Accept the key under any of these names so an existing .env keeps working.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-3.5-flash'

// Conflict analysis + heated user comments must not trip Gemini's safety filters
// into refusing. Relax the four standard categories.
const SAFETY_SETTINGS = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
].map(category => ({ category, threshold: 'BLOCK_NONE' }))

// ── Data helpers ──────────────────────────────────────────────────────────────
const DATA_DIR      = join(__dirname, 'data')
const USERS_FILE    = join(DATA_DIR, 'users.json')
const COMMENTS_FILE = join(DATA_DIR, 'comments.json')

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const readJSON  = (f) => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : []
const writeJSON = (f, d) => writeFileSync(f, JSON.stringify(d, null, 2))
const hashPwd   = (p) => createHash('sha256').update(p + 'conflictly-s4lt').digest('hex')

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const users = readJSON(USERS_FILE)
  const user  = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ error: 'No autorizado' })
  req.user = user
  next()
}

// ── Register ──────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body
  if (!username?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' })

  const users = readJSON(USERS_FILE)
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ error: 'El email ya está registrado' })
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return res.status(400).json({ error: 'El nombre de usuario ya existe' })

  const token = randomUUID()
  const user  = {
    id: randomUUID(), username: username.trim(),
    email: email.toLowerCase().trim(), passwordHash: hashPwd(password),
    token, createdAt: new Date().toISOString()
  }
  users.push(user)
  writeJSON(USERS_FILE, users)
  res.json({ token, username: user.username, email: user.email })
})

// ── Login ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' })

  const users = readJSON(USERS_FILE)
  const user  = users.find(u => u.email === email.toLowerCase().trim())
  if (!user || user.passwordHash !== hashPwd(password))
    return res.status(401).json({ error: 'Credenciales incorrectas' })

  user.token = randomUUID()
  writeJSON(USERS_FILE, users)
  res.json({ token: user.token, username: user.username, email: user.email })
})

// ── Comments ──────────────────────────────────────────────────────────────────
app.get('/api/comments/:country', (req, res) => {
  const country  = decodeURIComponent(req.params.country)
  const all      = readJSON(COMMENTS_FILE)
  const filtered = all
    .filter(c => c.country === country)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(filtered)
})

app.post('/api/comments', requireAuth, (req, res) => {
  const { country, text } = req.body
  if (!country || !text?.trim())
    return res.status(400).json({ error: 'País y texto requeridos' })
  if (text.trim().length > 500)
    return res.status(400).json({ error: 'Máximo 500 caracteres' })

  const comments = readJSON(COMMENTS_FILE)
  const comment  = {
    id: randomUUID(), country, username: req.user.username,
    text: text.trim(), createdAt: new Date().toISOString()
  }
  comments.push(comment)
  writeJSON(COMMENTS_FILE, comments)
  res.json(comment)
})

// ── Gemini prediction ───────────────────────────────────────────────────────
app.post('/api/predict', async (req, res) => {
  const { systemPrompt, userPrompt } = req.body
  if (!systemPrompt || !userPrompt)
    return res.status(400).json({ error: 'Faltan systemPrompt o userPrompt' })

  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('tu_api'))
    return res.status(401).json({ error: 'GEMINI_API_KEY no configurada en .env' })

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const gemRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',   // force clean JSON, no markdown fences
        },
      }),
    })

    const data = await gemRes.json()

    if (!gemRes.ok) {
      const msg = data?.error?.message || `Gemini HTTP ${gemRes.status}`
      console.error('Gemini API error:', msg)
      return res.status(gemRes.status).json({ error: msg })
    }

    const candidate = data.candidates?.[0]
    const text = (candidate?.content?.parts || []).map(p => p.text).filter(Boolean).join('')

    if (!text) {
      const reason = candidate?.finishReason || data.promptFeedback?.blockReason || 'sin contenido'
      console.error('Gemini returned no text:', reason)
      return res.status(502).json({ error: `Gemini no devolvió texto (${reason})` })
    }

    res.json({ content: text })
  } catch (error) {
    console.error('Gemini request failed:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.listen(3001, () => {
  console.log(`🛰  Proxy running on http://localhost:3001 — Gemini model: ${GEMINI_MODEL}`)
  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('tu_api'))
    console.warn('⚠  GEMINI_API_KEY not set — edit .env (GEMINI_API_KEY=AIza...)')
})
