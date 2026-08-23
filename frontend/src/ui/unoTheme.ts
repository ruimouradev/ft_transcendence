import { createTheme } from '@mui/material';

// O tema escuro das páginas MUI (estatísticas, amigos), nas quatro
// cores do baralho. Vive aqui para todas vestirem exatamente o mesmo.
export const unoTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#f44336' },   // vermelho UNO
        secondary: { main: '#ffeb3b' }, // amarelo UNO
        success: { main: '#4caf50' },   // verde UNO
        info: { main: '#2196f3' },      // azul UNO
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
        // letra base maior que o default do MUI, tudo escala com ela
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
