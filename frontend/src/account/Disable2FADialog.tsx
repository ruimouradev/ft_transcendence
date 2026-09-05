import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
	InputAdornment, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { Close, Visibility, VisibilityOff, } from '@mui/icons-material';
// import {QRCodeSVG} from 'qrcode.react';
import {api} from '../core/client';
import axios from 'axios';
import { useAuth } from '../core/AuthContext';
import type { Disable2FADialogProps, Message} from '../core/types.ts'

const steps = [ 'Disable Confirm', 'Disable 2FA', ];

function Disable2FADialog({ open, onClose, onSuccess, onClosed }: Disable2FADialogProps)
{
    const [activeStep, setActiveStep] = useState(0);
    const { user, login } = useAuth();

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [code, setCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetWizard = () => {
        setActiveStep(0);
        setPassword('');
        setShowPassword(false);
        setCode('');
        setLoading(false);
        setError(null);
    };

	const handleOpen = () => {
		resetWizard();
	}

    const handleClose = (_event?: object, reason?: 'backdropClick' |'escapeKeyDown') => {
        if (loading) { return; }
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') { return; }
        resetWizard();
        onClose();
    };

    const handleConfirm = () => {
        setError(null);
        setActiveStep(1);
    };

    const handleDisable2FA = async () => {
        if (!password) {
            setError('Please enter your current password.');
            return;
        }else if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!code) {
            setError('Please enter the 6-digit code from your authenticator app.');
            return;
        } else if (code.length !== 6) {
            setError('The authentication code must be exactly 6 digits long.');
            return;
        }
        setLoading(true);
        setError(null);
		if (!user)
			return ;
        try {
            await api.post<Message>('/2fa/disable', { password, code },);
            if (!user) return;
            login({ ...user, use2fa: false });
            onSuccess();
            resetWizard();
            onClose();
        } catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					setError('Your password is incorrect. Please try again.',);
				} else {
					setError(error.response?.data?.message ?? 'Failed to initialize two-factor authentication.',);
				}
			}
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby="enable-2fa-dialog-title" aria-describedby="enable-2fa-dialog-description" disableRestoreFocus
			slotProps={{ transition: { unmountOnExit: true, onEnter: handleOpen, onExited: onClosed } }}>

            <DialogTitle id="enable-2fa-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 600}}>
                    Disable Two-Factor Authentication
                </Typography>
                <IconButton onClick={() => { resetWizard(); onClose(); }} disabled={loading} aria-label="Close" >
                    <Close />
                </IconButton>
            </DialogTitle>

            <Box sx={{ px: 3, pt: 2, pb: 1, }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>
            <DialogContent dividers id="disable-2fa-dialog-description">
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Disable Two-Factor Authentication
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Disabling two-factor authentication will remove the current authenticator from your account.
                        </Typography>
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Verify your identity
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            For security reasons, please enter your current password .
                        </Typography>
                        <TextField fullWidth autoFocus required type={showPassword ? 'text' : 'password'} label="Current password" value={password}
                            onChange={(event) => setPassword(event.target.value)} autoComplete="current-password"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword((visible) => !visible)} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />                        
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Enter the 6-digit code currently shown in your authenticator app.
                        </Typography>
                        <TextField fullWidth label="Authentication code" value={code} onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 6); setCode(value); }} placeholder="000000"
                            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code', }, }}
                            sx={{ '& input': { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem', fontFamily: 'monospace', }, }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, }} >
                {activeStep === 0 && (
                    <>
                        <Button onClick={() => { resetWizard(); onClose(); }} >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleConfirm} >
                            Continue
                        </Button>
                    </>
                )}
                {activeStep === 1 && (
                        <Button variant="contained" onClick={handleDisable2FA} disabled={!password || !code || loading} startIcon={loading ? (<CircularProgress size={18} color="inherit" />) : undefined} >
                            {loading ? 'Setting up...' : 'Disable 2FA'}
                        </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default Disable2FADialog