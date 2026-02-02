import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SidebarProvider } from '../context/SidebarContext.jsx'
import { CategoryProvider } from '../context/CategoryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <SidebarProvider>
      <CategoryProvider>
        <App />
      </CategoryProvider>
   </SidebarProvider>
  </StrictMode>,
)
