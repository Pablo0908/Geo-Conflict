export async function register(username, email, password) {
  const res  = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al registrar')
  return data
}

export async function login(email, password) {
  const res  = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
  return data
}
