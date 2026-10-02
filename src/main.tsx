import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker for offline support & home screen standalone installation
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
