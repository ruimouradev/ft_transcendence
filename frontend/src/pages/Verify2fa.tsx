import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Box, Container, Paper, Button, Link, Typography, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '../client';
import Reset2FA from '../components/Reset2FA';

export default function Verify2fa() {
    const [code, setCode] = useState('');
    const [recoverCode, setRecoverCode] = useState('');
    const [userecoverCode, setUserRecoverCode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {

    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/login/verify-2fa?code=${code}`);
            if (response.data.code === 'success') {
                const userResponse = await api.get('/users/me');
                login(userResponse.data);
                navigate('/dashboard', { replace: true });
            }
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };


    const handleAuthenticatorReset = async () => {
        setUserRecoverCode(true);
        // try {
        //     await api.post(`/login/reset-2fa?recover_code=${recoverCode}`);
        //     navigate('/login', { replace: true, state: { info: 'Authenticator reset. Please log in again.' } });
        // } catch (error) {
        //     setError(getErrorMessage(error));
        // }
    };

    const handle2FAEnabled = () => {
        // if (!user) return;
        // login({ ...user, user2fa: true });
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2, }} >
            <Container component="main" maxWidth="xs">
                <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }} >
                    <Typography variant="h6" gutterBottom>
                        Verify your authenticator
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Enter the 6-digit code currently shown in your authenticator app.
                    </Typography>
                    {!userecoverCode? (
                    <TextField fullWidth autoFocus label="Authentication code" value={code} onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 6); setCode(value); }} placeholder="000000"
                        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code', }, }}
                        sx={{ '& input': { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem', fontFamily: 'monospace', }, }}
                    />): (
                    <TextField fullWidth autoFocus label="Recovery code" value={recoverCode} onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 20); setRecoverCode(value); }} placeholder="00000000000000000000"
                        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 20, autoComplete: 'one-time-code', }, }}
                        sx={{ '& input': { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem', fontFamily: 'monospace', }, }}
                    />)}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, }}>
                        The code changes every 30 seconds.
                    </Typography>
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Box sx={{ mt: 3 }}>
                        <Button type="submit" fullWidth variant="contained" onClick={handleSubmit} disabled={loading || code.length !== 6}>
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
                    <Reset2FA open={userecoverCode} onClose={() => setUserRecoverCode(false)} onSuccess={handle2FAEnabled} />
                </Paper>
            </Container>
        </Box>
    );
}