// Small fetch wrapper for the Quarkus REST API.
// Credentials (cookies) are included automatically.
async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
  getCurrentUser: () => request('/api/users/me'),
  login: (email, password) => request('/api/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/users/logout', { method: 'POST' }),
  create: (user) => request('/api/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id, user) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  remove: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
}

export const notesApi = {
  // Optional search: { q, searchTitles, searchContent }
  list: (search) => {
    const q = search && search.q ? search.q.trim() : ''
    if (!q) return request('/api/notes')
    const params = new URLSearchParams({
      q,
      searchTitles: String(!!search.searchTitles),
      searchContent: String(!!search.searchContent),
    })
    return request(`/api/notes?${params.toString()}`)
  },
  get: (id) => request(`/api/notes/${id}`),
  create: (note) => request('/api/notes', { method: 'POST', body: JSON.stringify(note) }),
  update: (id, note) => request(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) }),
  remove: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),
}
