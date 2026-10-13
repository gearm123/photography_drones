import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
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
      <App />
    </StrictMode>
  )
  if (root.childElementCount > 0) hydrateRoot(root, app)
  else createRoot(root).render(app)
}
