import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './core/AuthContext'
import PresenceKeeper from './core/PresenceKeeper'
import { unoTheme } from './ui/unoTheme'

// O tema global: o site é escuro, e com o MUI em modo escuro os
// cartões, menus e formulários acompanham o fundo em vez de aparecerem
// como caixas brancas. Os tons são os mesmos da moldura (slate).
const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0f172a',
            paper: '#1e293b',
        },
    },
})

// A ordem das camadas importa: a presença precisa de saber quem está
// logado, por isso o PresenceKeeper vive dentro do AuthProvider.
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
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
