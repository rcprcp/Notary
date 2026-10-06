import React, { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import App from './App'
import { usersApi } from './api'
import '@mantine/core/styles.css'

const THEME_KEY = 'notary-theme-color'
const USER_KEY = 'notary-current-user'

// SPA shell. The theme is stored in the current user's record on the server
// (users.theme_color); localStorage is only a cache / fallback when no user is selected.
function Root() {
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem(THEME_KEY) || 'blue')
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem(USER_KEY))

  const applyTheme = (color) => {
    setThemeColor(color)
    localStorage.setItem(THEME_KEY, color)
  }

  // Select a user and load their saved theme from the server.
  const selectUser = useCallback(async (id) => {
    setCurrentUserId(id)
    if (!id) {
      localStorage.removeItem(USER_KEY)
      return
    }
    localStorage.setItem(USER_KEY, id)
    try {
      const user = await usersApi.get(id)
      if (user?.themeColor) applyTheme(user.themeColor)
    } catch (e) {
      if (e.status === 404) {
        // The remembered user no longer exists.
        setCurrentUserId(null)
        localStorage.removeItem(USER_KEY)
      } else {
        console.error('Failed to load user theme', e)
      }
    }
  }, [])

  // On first load, restore the remembered user's theme from the server.
  useEffect(() => {
    const id = localStorage.getItem(USER_KEY)
    if (id) selectUser(id)
  }, [selectUser])

  // Apply immediately, then persist to the current user's record (if any).
  const changeTheme = async (color) => {
    applyTheme(color)
    if (!currentUserId) return
    try {
      await usersApi.update(currentUserId, { themeColor: color })
    } catch (e) {
      console.error('Failed to save theme to user record', e)
    }
  }

  return (
    <MantineProvider theme={{ primaryColor: themeColor }}>
      <HashRouter>
        <App
          themeColor={themeColor}
          onThemeChange={changeTheme}
          currentUserId={currentUserId}
          onUserChange={selectUser}
        />
      </HashRouter>
    </MantineProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
