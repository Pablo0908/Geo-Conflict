export async function getComments(country) {
  const res = await fetch(`/api/comments/${encodeURIComponent(country)}`)
  if (!res.ok) throw new Error('Error al cargar comentarios')
  return res.json()
}

export async function postComment(country, text, token) {
  const res  = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ country, text })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al publicar')
  return data
}
