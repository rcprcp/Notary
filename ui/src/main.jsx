import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import App from './App'
import '@mantine/core/styles.css'

// SPA shell with persistent theme support.
function Root() {
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('notary-theme-color') || 'blue'
  })

  const handleThemeChange = (color) => {
    setThemeColor(color)
    localStorage.setItem('notary-theme-color', color)
  }

  return (
    <MantineProvider theme={{ primaryColor: themeColor }}>
      <HashRouter>
        <App onThemeChange={handleThemeChange} />
      </HashRouter>
    </MantineProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
