import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './shared/auth/AuthContext.tsx'
import { ColorModeProvider } from './shared/theme/ColorModeContext.tsx'
import { AppScrollbars } from './shared/ui/AppScrollbars.tsx'
import 'overlayscrollbars/overlayscrollbars.css'
import { LanguageProvider } from './shared/i18n/LanguageProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeProvider>
      <LanguageProvider>
        <AppScrollbars>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </AppScrollbars>
      </LanguageProvider>
    </ColorModeProvider>
  </StrictMode>,
)
