import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const raiz = document.getElementById('root')
const UI_LISTA = '.tb, .login-wrap, .mobile-header'

function ocultarSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return
  splash.classList.add('hide')
  setTimeout(() => splash.remove(), 350)
}

function contenidoListo() {
  return Boolean(raiz.querySelector(UI_LISTA))
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// El montaje inicial de React es sincrónico, así que justo después de
// render() el menú o el login ya están en el DOM salvo que la ruta actual
// sea una redirección (p. ej. "/"), que resuelve en un segundo instante.
if (contenidoListo()) {
  ocultarSplash()
} else {
  const observador = new MutationObserver(() => {
    if (!contenidoListo()) return
    observador.disconnect()
    ocultarSplash()
  })
  observador.observe(raiz, { childList: true, subtree: true })
}
