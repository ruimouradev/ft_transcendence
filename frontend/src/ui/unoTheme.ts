import { createTheme } from '@mui/material';

export const unoTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#f44336' },   // UNO red
        secondary: { main: '#ffeb3b' }, // UNO yellow
        success: { main: '#4caf50' },   // UNO green
        info: { main: '#2196f3' },      // UNO blue
        background: {
            default: '#0f172a',
            paper: '#1e293b',
        },
        text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 16,
        h4: { fontWeight: 800 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundImage: 'none',
                },
            },
        },
    },
});
