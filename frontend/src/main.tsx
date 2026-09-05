import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './core/AuthContext'
import PresenceKeeper from './core/PresenceKeeper'
import { unoTheme } from './ui/unoTheme'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={unoTheme}>
            <CssBaseline />
            <AuthProvider>
                <PresenceKeeper />
                <BrowserRouter>
                    	<App />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
)
