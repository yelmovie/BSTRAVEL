import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import './styles/index.css'

if (import.meta.env.DEV) {
  const k = import.meta.env.VITE_KAKAO_MAP_JS_KEY
  const set = typeof k === 'string' && k.trim() !== ''
  if (set) {
    // eslint-disable-next-line no-console
    console.log('[BSTRAVEL env] VITE_KAKAO_MAP_JS_KEY: (set)')
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      '[BSTRAVEL env] VITE_KAKAO_MAP_JS_KEY is empty — set it in .env or .env.local and restart vite',
    )
  }
}

createRoot(document.getElementById('root')!).render(<App />)
  