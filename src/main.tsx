import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
import { localeFromPath } from './seo/site.ts'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

if (isAdmin) {
  root.replaceChildren()
  createRoot(root).render(
    <StrictMode>
      <AdminPage />
    </StrictMode>,
  )
} else {
  const app = (
    <StrictMode>
      <LanguageProvider initialLocale={localeFromPath(window.location.pathname)}>
        <App />
      </LanguageProvider>
    </StrictMode>
  )
  if (root.childElementCount > 0) hydrateRoot(root, app)
  else createRoot(root).render(app)
}
