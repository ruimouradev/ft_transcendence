import { Alert, Snackbar } from '@mui/material';
import type { NotificationSnackbarProps } from '../core/types.ts'

function NotificationSnackbar({ open, message, severity, onClose, autoHideDuration = 3000 }: NotificationSnackbarProps)
{
    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose}
			anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
}

export default NotificationSnackbar