import React, { useState, useEffect } from 'react';
import {
	Box,
	Button,
	Container,
	Divider,
	IconButton,
	InputAdornment,
	Link,
	Paper,
	TextField,
	Typography,
	Alert,
	Avatar,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
} from '@mui/icons-material';

import myIcon from '../assets/i42.ico';
import { api, getErrorMessage } from '../client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		rememberMe: false,
	});
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [info, setInfo] = useState('');
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const handleChange = (e) => {
		const { name, value, checked, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
		if (error) setError('');
	};

	useEffect(() => {
		setInfo('');
		setError('');
		const errorParam = searchParams.get('error');
		const infoParam = searchParams.get('info');
		if (infoParam) {
			setInfo(infoParam);
		}
		if (errorParam === 'oauth2_error') {
			setError('Login failed: OAuth2 error.');
		} else {
			setError(errorParam || '');
		}
	}, [searchParams]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.email || !formData.password) {
			setError('Please fill in all fields.');
			return;
		}
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.append('username', formData.email);
			params.append('password', formData.password);

			const response = await api.post('/login/access-token', params, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				}
			});
			if (response.data.token_type && response.data.access_token) {
				login(response.data.user);
				navigate('/dashboard', { replace: true });
			}
		} catch (error) {
			setError(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2, }} >
			<Container component="main" maxWidth="xs">
				<Paper elevation={6}
					sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }} >

					<Avatar alt="Remy Sharp" src="/src/assets/avatar/a00.jpeg" sx={{ width: 120, height: 120, border: 'none' }} />

					{error && (
						<Alert severity="error" sx={{ width: '100%', mb: 2 }}>
							{error}
						</Alert>
					)}
					{info && (
						<Alert severity="success" sx={{ width: '100%', mb: 2 }}>
							{info}
						</Alert>
					)}

					<Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
						<TextField margin="normal" required fullWidth id="email" label="Login Name(email)" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} />

						<TextField margin="normal" required fullWidth name="password" label="Password" type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password" value={formData.password}
							onChange={handleChange}
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

						<Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: 3 }} >
							{loading ? 'Signing in...' : 'Sign In'}
						</Button>

						<Divider sx={{ my: 3 }}>
							<Typography variant="body2" color="text.secondary">
								OR
							</Typography>
						</Divider>

						<Box sx={{ display: 'flex', gap: 2 }}>
							<Button fullWidth variant="outlined" endIcon={<img src={myIcon} alt="42" style={{ width: 20, height: 20 }} />} onClick={() => window.location.href = 'api/v1/auth/42/login'} sx={{ textTransform: 'none', borderRadius: 2 }} >
								Login with
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
                                <Link href="#" onClick={(e) => { e.preventDefault(); if (formData.email) window.location.href = `/api/v1/password-recovery/${formData.email}`; }} underline="hover" sx={{ fontWeight: 600 }}>
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