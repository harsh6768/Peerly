import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppAuthProvider } from './context/AppAuthContext'
import { HousingIntentProvider } from './context/HousingIntentContext'
import { PublicConfigProvider } from './context/PublicConfigContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PublicConfigProvider>
        <AppAuthProvider>
          <BrowserRouter>
            <HousingIntentProvider>
              <App />
            </HousingIntentProvider>
          </BrowserRouter>
        </AppAuthProvider>
      </PublicConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
