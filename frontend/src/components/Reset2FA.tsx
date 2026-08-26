import { useEffect, useState } from 'react';

import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, Paper, Step, StepLabel, Stepper, TextField, Typography, } from '@mui/material';

import { CheckCircle, Close, ContentCopy, Download, Visibility, VisibilityOff, } from '@mui/icons-material';

import {QRCodeSVG} from 'qrcode.react';

import {api} from '../client';


interface Reset2FADialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Setup2FAResponse {
    otpauth_url: string;
    secret: string;
}

interface Verify2FAResponse {
    recovery_codes: string[];
}

const steps = [ 'Reset Confirm', 'Verify', 'Authenticator', 'Verify code', 'Recovery codes', ];

export default function Reset2FA({
    open,
    onClose,
    onSuccess,
}: Reset2FADialogProps) {
    const [activeStep, setActiveStep] = useState(0);

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [recoverCode, setRecoverCode] = useState('');

    const [code, setCode] = useState('');

    const [secret, setSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');

    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [savedRecoveryCodes, setSavedRecoveryCodes] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetWizard = () => {
        setActiveStep(0);

        setPassword('');
        setShowPassword(false);

        setCode('');

        setSecret('');
        setOtpauthUrl('');

        setRecoveryCodes([]);
        setSavedRecoveryCodes(false);

        setLoading(false);
        setError(null);
    };

    useEffect(() => { if (open) { resetWizard(); } }, [open]);

    const handleClose = () => {
        if (loading) { return; }
        resetWizard();
        onClose();
    };

    const handleConfirm = () => {
        setError(null);
        setActiveStep(1);
    };

    const handleSetup2FA = async () => {
        if (!password) {
            setError('Please enter your current password.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post<Setup2FAResponse>('/2fa/reset', { password, recovery_code: recoverCode },);
            setSecret(response.data.secret);
            setOtpauthUrl(response.data.otpauth_url);
            setActiveStep(2);
        } catch (error: any) {
            if (error.response?.status === 401) {
                setError('Your password is incorrect. Please try again.',);
            } else {
                setError(error.response?.data?.message ?? 'Failed to initialize two-factor authentication.',);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAuthenticatorContinue = () => {
        setError(null);
        setActiveStep(3);
    };

    const handleVerifyCode = async () => {
        if (code.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post<Verify2FAResponse>('/2fa/verify-setup', { code, },
            );
            setRecoveryCodes(response.data.recovery_codes,);
            setActiveStep(4);
        } catch (error: any) {
            if (error.response?.status === 400) {
                setError('The verification code is invalid or expired.',);
            } else {
                setError(error.response?.data?.message ?? 'Failed to verify the authentication code.',);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopyRecoveryCodes = async () => {
        try {
            await navigator.clipboard.writeText(
                recoveryCodes.join('\n'),
            );
        } catch {
            setError('Failed to copy recovery codes.',);
        }
    };

    const handleDownloadRecoveryCodes = () => {
        const content = ['Two-Factor Authentication Recovery Codes', '', ...recoveryCodes, '', 'Keep these codes in a safe place.',].join('\n');
        const blob = new Blob([content], { type: 'text/plain', },);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '2fa-recovery-codes.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFinish = () => {
        if (!savedRecoveryCodes) { return; }
        onSuccess();
        resetWizard();
        onClose();
    };

    const handleBack = () => {
        setError(null);
        setActiveStep( (currentStep) => currentStep - 1, );
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby="enable-2fa-dialog-title" aria-describedby="enable-2fa-dialog-description" slotProps={{ transition: { unmountOnExit: true, }, }}>

            <DialogTitle id="enable-2fa-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, }}>
                <Typography variant="h6" component="span" fontWeight={600}>
                    Reset Two-Factor Authentication
                </Typography>
                <IconButton onClick={handleClose} disabled={loading} aria-label="Close" >
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
            <DialogContent dividers id="enable-2fa-dialog-description">
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Reset Two-Factor Authentication
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Resetting two-factor authentication will remove the current authenticator from your account.
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            You can use apps such as Google Authenticator, Microsoft Authenticator, or Authy.
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            The reset will only be completed after you successfully verify your authenticator.
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
                                            <IconButton onClick={() => setShowPassword((visible) => !visible,)} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />                        
                        <Typography color="text.secondary" sx={{ mb: 3 , pt: 2,}}>
                            Please enter your recovery code to reset two-factor authentication.
                        </Typography>
                        <TextField fullWidth required type='text' label="Recovery code" value={recoverCode} onChange={(event) => setRecoverCode(event.target.value)} />
                    </Box>
                )}
                {activeStep === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom  >
                            Set up your authenticator
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Open your authenticator app and scan the QR code below.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, }}>
                            <Paper elevation={2} sx={{ p: 2, display: 'inline-flex', }}>
                                <Box display="flex" justifyContent="center" alignItems="center" alt="Two-factor authentication QR code" >
                                    <QRCodeSVG value={otpauthUrl} size={220} level="M" />
                                </Box>
                            </Paper>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} >
                            Can't scan the QR code? Enter this setup key manually:
                        </Typography>
                        <TextField fullWidth value={secret} slotProps={{ input: { readOnly: true, }, }} />
                        <Alert severity="warning" sx={{ mt: 3 }} >
                            Keep this setup key private. Anyone with this key can generate authentication codes for your account.
                        </Alert>
                    </Box>
                )}
                {activeStep === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Verify your authenticator
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Enter the 6-digit code currently shown in your authenticator app.
                        </Typography>
                        <TextField fullWidth autoFocus label="Authentication code" value={code} onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 6); setCode(value); }} placeholder="000000"
                            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code', }, }}
                            sx={{ '& input': { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem', fontFamily: 'monospace', }, }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, }}>
                            The code changes every 30 seconds.
                        </Typography>
                    </Box>
                )}

                {activeStep === 4 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, }} >
                            <CheckCircle color="success" fontSize="large" />
                            <Typography variant="h6" >
                                2FA has been enabled
                            </Typography>
                        </Box>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Save these recovery codes in a secure location. Each code can be used once if you lose access to your authenticator.
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 2, position: 'relative', mb: 2, }} >
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, pr: 5, }}>
                                {recoveryCodes.map((recoveryCode) => (<Typography key={recoveryCode} sx={{ fontFamily: 'monospace', fontSize: '0.95rem', }} > {recoveryCode} </Typography>),)}
                            </Box>
                            <IconButton onClick={handleCopyRecoveryCodes} sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="Copy recovery codes">
                                <ContentCopy />
                            </IconButton>
                        </Paper>

                        <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadRecoveryCodes} sx={{ mb: 2 }} >
                            Download recovery codes
                        </Button>
                        <Divider sx={{ my: 2 }} />
                        <FormControlLabel control={<Checkbox checked={savedRecoveryCodes} onChange={(event) => setSavedRecoveryCodes(event.target.checked)} />} label="I have saved my recovery codes" />
                        <Alert severity="warning" sx={{ mt: 2 }} >
                            You won't be able to see these recovery codes again after closing this dialog.
                        </Alert>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, }} >
                {activeStep === 0 && (
                    <>
                        <Button onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleConfirm} >
                            Continue
                        </Button>
                    </>
                )}

                {activeStep === 1 && (
                    <>
                        <Button onClick={handleBack} disabled={loading} >
                            Back
                        </Button>
                        <Button variant="contained" onClick={handleSetup2FA} disabled={!password || !recoverCode || loading} startIcon={loading ? (<CircularProgress size={18} color="inherit" />) : undefined} >
                            {loading ? 'Setting up...' : 'Continue'}
                        </Button>
                    </>
                )}

                {activeStep === 2 && (
                    <>
                        <Button onClick={handleBack} >
                            Back
                        </Button>
                        <Button variant="contained" onClick={handleAuthenticatorContinue} >
                            Continue
                        </Button>
                    </>
                )}

                {activeStep === 3 && (
                    <>
                        <Button onClick={handleBack} disabled={loading} >
                            Back
                        </Button>
                        <Button variant="contained" onClick={handleVerifyCode} disabled={code.length !== 6 || loading} startIcon={loading ? (<CircularProgress size={18} color="inherit" />) : undefined} >
                            {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                    </>
                )}

                {activeStep === 4 && (
                    <Button variant="contained" onClick={handleFinish} disabled={!savedRecoveryCodes} startIcon={<CheckCircle />} >
                        Finish
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}