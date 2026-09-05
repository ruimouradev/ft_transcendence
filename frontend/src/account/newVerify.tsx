import React, { useState } from 'react';
import { useAuth } from '../core/AuthContext';
import { Box, Container, Paper, Button, Link, Typography, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../core/client';
import Reset2FA from './Reset2FA';

function Verify2fa()
{
    const [code, setCode] = useState('');
    const [userecoverCode, setUserRecoverCode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.SubmitEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            const response = await api.post(`/login/verify-2fa`,{ code });
            if (response.data.code === 'success') {
                const userResponse = await api.get('/users/me');
                login(userResponse.data);
                navigate('/', { replace: true });
            }
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleAuthenticatorReset = async (event: React.MouseEvent) => {
        event.preventDefault();
        setUserRecoverCode(true);
    };


    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }} >
            <Container component="main" maxWidth="xs">
                <Paper  component="form" onSubmit={handleSubmit} elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }} >
                    <Typography variant="h6" gutterBottom>
                        Verify your authenticator
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Enter the 6-digit code currently shown in your authenticator app.
                    </Typography>
                                        <TextField fullWidth autoFocus label="Authentication code" value={code} onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 6); setCode(value); }} placeholder="000000"
                        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code', } }}
                        sx={{ '& input': { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem', fontFamily: 'monospace', } }}
                    />                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, }}>
                        The code changes every 30 seconds.
                    </Typography>
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Box sx={{ mt: 3 }}>
                        <Button type="submit" fullWidth variant="contained" disabled={loading || code.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                    </Box>
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Forgot your authenticator?{' '}
                            <Link href="#" onClick={handleAuthenticatorReset} underline="hover" sx={{ fontWeight: 600 }}>
                                Reset authenticator
                            </Link>
                        </Typography>
                    </Box>
                    <Reset2FA open={userecoverCode} onClose={() => setUserRecoverCode(false)} onSuccess={() => {}} />
                </Paper>
            </Container>
        </Box>
    );
}

export default Verify2fa