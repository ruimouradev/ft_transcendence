import React from 'react';
import { Alert, Snackbar } from '@mui/material';

export type NotificationSeverity = 'success' | 'error' | 'info' | 'warning';

interface NotificationSnackbarProps {
    open: boolean;
    message: string;
    severity: NotificationSeverity;
    onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
    autoHideDuration?: number;
}

// Um aviso flutuante único. Para avisos soltos usa-se este diretamente;
// para uma fila deles usa-se o useNotification, que empilha vários.
export default function NotificationSnackbar({
    open,
    message,
    severity,
    onClose,
    autoHideDuration = 3000,
}: NotificationSnackbarProps) {
    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
}
