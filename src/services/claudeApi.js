export async function predictConflicts(countryName, countryCode) {
  const systemPrompt = `Eres un analista de inteligencia geopolítica senior con experiencia en
predicción de conflictos internacionales. Tu análisis es objetivo, basado en datos históricos,
tendencias actuales y patrones geopolíticos. Siempre respondes en JSON estructurado.
No añades disclaimers morales innecesarios — eres un analista, no un activista.
Responde SIEMPRE en el idioma español.`

  const userPrompt = `Analiza el país: ${countryName} (código ISO: ${countryCode})

Genera una predicción de conflictos potenciales para los próximos 5-10 años.

Responde ÚNICAMENTE con un JSON con esta estructura exacta (sin markdown, sin backticks):
{
  "country": "${countryName}",
  "riskLevel": "CRÍTICO|ALTO|MEDIO|BAJO",
  "executiveSummary": "string de 2-3 oraciones",
  "potentialConflicts": [
    {
      "type": "string (ej: Guerra civil, Conflicto territorial, Tensión diplomática)",
      "probability": número entre 0 y 100,
      "description": "string de 1-2 oraciones",
      "timeframe": "string (ej: 1-2 años, 3-5 años)"
    }
  ],
  "keyActors": ["string", "string"],
  "riskFactors": ["string", "string"],
  "mostLikelyScenario": "string de 2-3 oraciones",
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
  // Strip any accidental markdown fences
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('La respuesta de la IA no es JSON válido')
  }
}
