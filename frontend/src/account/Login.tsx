import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Divider, IconButton, InputAdornment, Link, Paper, TextField, Typography, Alert, Avatar, } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import icon42 from '../assets/i42.ico';
import avatarUno from '../assets/avatar/a_default.svg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '../core/client';
import { useAuth } from '../core/AuthContext';

// O ecrã de entrada. Duas portas: email e password contra o backend,
// ou a conta 42 por OAuth. O token de sessão volta num cookie httponly,
// por isso aqui não se guarda token nenhum.
export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, login } = useAuth();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // O backend comunica connosco por parâmetros no endereço: a
    // verificação de email e o OAuth redirecionam para /login com
    // ?info= ou ?error=. Derivam-se aqui na renderização, sem estado
    // à parte, e o erro do formulário tem prioridade sobre o do URL.
    const info = searchParams.get('info') || '';
    const errorParam = searchParams.get('error');
    const urlError = errorParam === 'oauth2_error' ? 'Login failed: OAuth2 error.' : (errorParam || '');
    const shownError = error || urlError;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    useEffect(() => {
        if (!loading && user) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        setError('');
        const errorParam = searchParams.get('error');
        // const infoParam = searchParams.get('info');
        // if (infoParam) {
        // 	setInfo(infoParam);
        // }
        if (errorParam === 'oauth2_error') {
            setError('Login failed: OAuth2 error.');
        } else {
            setError(errorParam || '');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }, [searchParams]);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields.');
            return;
        }

		if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
			setError('Please enter a valid email address.');
			return;
		}
		
        setLoading(true);
        try {
            // o endpoint segue o formato clássico do OAuth2: um form
            // com username e password, não JSON
            const params = new URLSearchParams();
            params.append('username', formData.email);
            params.append('password', formData.password);

            const response = await api.post('/login/access-token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            if (response.data.code === 'success') {
                const userResponse = await api.get('/users/me');
                login(userResponse.data);
                navigate('/', { replace: true });
            } else if (response.data.code === '2fa_required') {
                navigate('/login/2fa', { replace: true });
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (!formData.email) {
            setError('Please enter your email to reset your password.');
            return;
        }
        try {
            const response = await api.post('/request-password-reset', { email: formData.email });
            navigate(`/login?info=${encodeURIComponent(response.data.message)}`, { replace: true });
        } catch (err) {
			if (axios.isAxiosError(err)) {
				if(err.response?.status === 429) {
					setError('Requests are limited to 1 per minute. Please try again later.');
				} else {
					setError(getErrorMessage(err));
				}
			}
        }
    };
    
    // sem fundo próprio: o cartão assenta no fundo do site
    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Container component="main" maxWidth="xs">
                <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3, }}                >
                    <Avatar alt="UNO" src={avatarUno} sx={{ width: 120, height: 120, border: 'none' }} />

                    {shownError && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {shownError}
                        </Alert>
                    )}
                    {info && (
                        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                            {info}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                        <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} />

                        <TextField margin="normal" required fullWidth name="password" label="Password" type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password" value={formData.password} onChange={handleChange}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: 3, }}                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <Divider sx={{ my: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                OR
                            </Typography>
                        </Divider>

                        {/* o OAuth é uma viagem de página inteira: vamos ao
                            backend, ele leva-nos ao intra e traz-nos de volta */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button fullWidth variant="outlined" startIcon={<img src={icon42} alt="42" style={{ width: 20, height: 20 }} />} onClick={() => { window.location.href = 'api/v1/auth/42/login'; }} sx={{ textTransform: 'none', borderRadius: 2 }}>
                                Login 42
                            </Button>
                        </Box>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{' '}
                                <Link href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} underline="hover" sx={{ fontWeight: 600 }}>
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Forgot your password?{' '}
                                <Link href="#" onClick={handlePasswordReset} underline="hover" sx={{ fontWeight: 600 }}>
                                    Reset Password
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
