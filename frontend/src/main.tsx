import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppAuthProvider } from './context/AppAuthContext'
import { HousingIntentProvider } from './context/HousingIntentContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppAuthProvider>
      <BrowserRouter>
        <HousingIntentProvider>
          <App />
        </HousingIntentProvider>
      </BrowserRouter>
    </AppAuthProvider>
  </StrictMode>,
)
