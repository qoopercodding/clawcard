import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DevInspectorProvider } from './components/debug/DevInspector.tsx'

/**
 * Punkt wejścia aplikacji.
 *
 * DevInspectorProvider owija cały App — dzięki temu useDevInspector()
 * działa w każdym komponencie w drzewie bez dodatkowej konfiguracji.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevInspectorProvider>
      <App />
    </DevInspectorProvider>
  </StrictMode>,
)
