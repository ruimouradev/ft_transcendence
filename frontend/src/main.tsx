import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import { WebSocketProvider } from './components/WebSocketContext.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <WebSocketProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </WebSocketProvider>
        </AuthProvider>
    </StrictMode>,
)
