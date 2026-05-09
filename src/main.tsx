import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('[Renderer] src/main.tsx executing');

const rootElement = document.getElementById('root');
console.log('[Renderer] #root element found:', !!rootElement);

if (rootElement) {
  console.log('[Renderer] Creating React root and rendering App...');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('[Renderer] React render call completed');
} else {
  console.error('[Renderer] FATAL: #root element not found in DOM!');
}
