import { normalizeStatus } from '../components/ConflictBadge.jsx'

// Analyzes a country by (1) reading the community comments collected for it
// (Instagram / social-media-style public opinion), (2) combining them with the
// real geopolitical situation, and (3) classifying the country into one of three
// conflict roles + producing a comment-based prediction.
//
//   conflictStatus:
//     "IN-CONFLICT" → 100% in an active conflict (red)   — must justify why
//     "POSSIBLE"    → 50/50, the AI is not sure (orange)
//     "CLEAR"       → no conflict whatsoever (green)
//
// The prediction is driven by the country's comments. Per the product spec it is
// only meant to be *detailed* for countries that are in conflict or that people
// are actively talking about; otherwise it stays brief.
export async function predictConflicts(countryName, countryCode, comments = []) {
  const systemPrompt = `Eres un analista de inteligencia geopolítica senior especializado en
detección de conflictos en tiempo real. Combinas dos fuentes: (1) tu conocimiento de la
situación real del país (historia, política, seguridad, tensiones actuales) y (2) el
sentimiento de la comunidad expresado en comentarios de redes sociales (Instagram, X, foros).
Tu análisis es objetivo y basado en evidencia. No añades disclaimers morales innecesarios.
Respondes SIEMPRE en español y SIEMPRE con un único objeto JSON válido, sin markdown ni backticks. La información de los conflictos de cada país debe de ser del 2026. Si es del 2025 para atras ya no importan, a excepción de que sigan teniendo los conflictos. Si el comentario va en contra de la terminos y eticas y ademas de eso va en contra de las evidencias, que no se tome en cuenta para la predicción. Siempre usa formato JSON.`

  const hasComments = Array.isArray(comments) && comments.length > 0
  const commentBlock = hasComments
    ? comments
        .map((c, i) => `${i + 1}. @${c.username || 'anónimo'}: "${(c.text || '').replace(/"/g, "'")}"`)
        .join('\n')
    : '(No hay comentarios de la comunidad para este país todavía.)'

  const userPrompt = `PAÍS: ${countryName} (código ISO: ${countryCode})

COMENTARIOS DE LA COMUNIDAD (estilo redes sociales — Instagram, X, foros) — ${comments.length} en total:
${commentBlock}

TAREA:
1. Lee y analiza los comentarios de arriba (tono, temas recurrentes, preocupaciones, sentimiento).
2. Combínalos con la situación geopolítica REAL del país.
3. Clasifica al país en EXACTAMENTE uno de estos tres roles (campo "conflictStatus"):
   - "IN-CONFLICT": el país está 100% en un conflicto activo (guerra, guerra civil, crisis violenta en curso). DEBES explicar el porqué en "statusReason".
   - "POSSIBLE": es un 50/50 — hay tensiones, inestabilidad o señales de riesgo pero NO un conflicto confirmado. Úsalo cuando NO estés seguro.
   - "CLEAR": no hay ningún conflicto, el país es estable.
4. Indica tu nivel de seguridad sobre la clasificación en "confidence" (0-100).
5. Genera una PREDICCIÓN basada principalmente en los comentarios de la comunidad combinados con la situación.
   - Si el país está "IN-CONFLICT" o "POSSIBLE", o si hay comentarios que lo justifiquen → predicción DETALLADA.
   - Si el país está "CLEAR" y no hay comentarios relevantes → predicción BREVE indicando que no hay señales que ameriten una predicción detallada.

Responde ÚNICAMENTE con un JSON con esta estructura EXACTA (sin markdown, sin backticks):
{
  "country": "${countryName}",
  "conflictStatus": "IN-CONFLICT | POSSIBLE | CLEAR",
  "confidence": número entre 0 y 100,
  "statusReason": "string de 1-2 oraciones — el porqué de la clasificación (obligatorio, sobre todo para IN-CONFLICT)",
  "executiveSummary": "string de 2-3 oraciones resumiendo la situación",
  "commentAnalysis": {
    "analyzed": ${comments.length},
    "sentiment": "TENSO | NEGATIVO | NEUTRAL | MIXTO | CALMADO",
    "themes": ["string", "string"],
    "summary": "string de 1-2 oraciones sobre lo que revelan los comentarios (o que no hay comentarios)"
  },
  "prediction": {
    "headline": "string corto — el titular de la predicción",
    "detail": "string de 1-3 oraciones basado en los comentarios + la situación",
    "probability": número entre 0 y 100,
    "timeframe": "string (ej: 6-12 meses, 1-2 años)"
  },
  "potentialConflicts": [
    { "type": "string", "probability": número 0-100, "description": "string de 1-2 oraciones", "timeframe": "string" }
  ],
  "keyActors": ["string", "string"],
  "riskFactors": ["string", "string"],
  "analysisDate": "${new Date().toISOString()}"
}`

  const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  const data = await response.json()

  let text = data.content || ''
  // Strip any accidental markdown fences before parsing.
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('La respuesta de la IA no es JSON válido')
  }

  // Defensive defaults so the UI never crashes on a missing field.
  return {
    country:          parsed.country || countryName,
    // Normalize to a canonical key ("IN-CONFLICT" | "POSSIBLE" | "CLEAR") so the
    // globe, history and badge all look up the same value regardless of model phrasing.
    conflictStatus:   normalizeStatus(parsed.conflictStatus),
    confidence:       typeof parsed.confidence === 'number' ? parsed.confidence : null,
    statusReason:     parsed.statusReason || '',
    executiveSummary: parsed.executiveSummary || '',
    commentAnalysis: {
      analyzed:  parsed.commentAnalysis?.analyzed ?? comments.length,
      sentiment: parsed.commentAnalysis?.sentiment || (hasComments ? 'MIXTO' : 'NEUTRAL'),
      themes:    Array.isArray(parsed.commentAnalysis?.themes) ? parsed.commentAnalysis.themes : [],
      summary:   parsed.commentAnalysis?.summary || (hasComments ? '' : 'Sin comentarios de la comunidad para analizar.'),
    },
    prediction: {
      headline:    parsed.prediction?.headline || '',
      detail:      parsed.prediction?.detail || '',
      probability: typeof parsed.prediction?.probability === 'number' ? parsed.prediction.probability : null,
      timeframe:   parsed.prediction?.timeframe || '',
    },
    potentialConflicts: Array.isArray(parsed.potentialConflicts) ? parsed.potentialConflicts : [],
    keyActors:          Array.isArray(parsed.keyActors) ? parsed.keyActors : [],
    riskFactors:        Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
    analysisDate:       parsed.analysisDate || new Date().toISOString(),
  }
}
