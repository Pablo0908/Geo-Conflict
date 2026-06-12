import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

// ── Claude prediction ─────────────────────────────────────────────────────────
app.post('/api/predict', async (req, res) => {
  const { systemPrompt, userPrompt } = req.body
  if (!systemPrompt || !userPrompt)
    return res.status(400).json({ error: 'Faltan systemPrompt o userPrompt' })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
    res.json({ content: message.content[0].text })
  } catch (error) {
    console.error('Claude API error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.listen(3001, () => {
  console.log('🛰  Proxy running on http://localhost:3001')
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'tu_api_key_aqui')
    console.warn('⚠  ANTHROPIC_API_KEY not set — edit .env')
})
