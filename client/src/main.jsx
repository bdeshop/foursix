import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SidebarProvider } from '../context/SidebarContext.jsx'
import { CategoryProvider } from '../context/CategoryContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <SidebarProvider>
      <CategoryProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </CategoryProvider>
   </SidebarProvider>
  </StrictMode>,
)
