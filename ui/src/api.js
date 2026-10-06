// Small fetch wrapper for the Quarkus REST API.
async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const text = await res.text()
      if (text) message = text
    } catch (e) {
      // ignore body read errors
    }
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const usersApi = {
  list: () => request('/api/users'),
  get: (id) => request(`/api/users/${id}`),
  create: (user) => request('/api/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id, user) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  remove: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
}

export const notesApi = {
  list: (ownerId) => request(ownerId ? `/api/notes?ownerId=${encodeURIComponent(ownerId)}` : '/api/notes'),
  create: (note) => request('/api/notes', { method: 'POST', body: JSON.stringify(note) }),
  update: (id, note) => request(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) }),
  remove: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),
}
