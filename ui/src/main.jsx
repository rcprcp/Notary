import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import App from './App'
import '@mantine/core/styles.css'

// HashRouter keeps navigation entirely client-side (e.g. /#/users), so Quarkus
// only ever needs to serve index.html and no server-side fallback is required.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </MantineProvider>
  </React.StrictMode>,
)
