import React, { useState, useEffect } from 'react';
import { Box, Button, Checkbox, Container, CssBaseline, FormControl, FormControlLabel, Grid, IconButton, InputAdornment, Link, Paper, TextField, Typography, Alert, Avatar, } from '@mui/material';
import { Visibility, VisibilityOff, PersonAddOutlined as PersonAddIcon, } from '@mui/icons-material';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { api, getErrorMessage } from '../client.ts';

export default function SignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nick_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    interface ValidationError {
        loc: (string | number)[];
        msg: string;
        type: string;
        input?: any;
    }

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, checked?: boolean) => {
        setError('');
        setErrors({});
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked?? false : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.currentTarget.reportValidity();
            return;
        }

        if (formData.nick_name.length < 3 || formData.nick_name.length > 20) {
            setErrors({ nick_name: 'Nick name must be between 3 and 20 characters long.' });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setErrors({ password: 'Passwords do not match', confirmPassword: 'Passwords do not match' });
            return;
        } else if (formData.password.length < 8) {
            setErrors({ password: 'Password must be at least 8 characters long.' });
            return;
        }

        if (!formData.agreeTerms) {
            setErrors({ agreeTerms: 'You must agree to the terms and conditions.' });
            return;
        }
        setError('');
        setLoading(true);
        try {
            const params = {
                'email': formData.email,
                'password': formData.password,
                'nick_name': formData.nick_name
            }
            await api.post('/users/signup', params);
            navigate('/login?info=Account created successfully,check your email for verification', { replace: true });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 422) {
                    const validationErrors = error.response.data?.detail as ValidationError[];
                    const fieldErrors: Record<string, string> = {};
                    for (const error of validationErrors) {
                        const fieldName = error.loc.at(-1);
                        if (typeof fieldName === 'string') {
                            fieldErrors[fieldName] = error.msg;
                        }
                    }
                    setErrors(fieldErrors);
                }else{
                    if (error.response?.status === 400) {
                        if (error.response.data?.code === 'USER_EXISTS') {
                            setErrors({ email: error.response.data?.msg || 'This email is already registered. Please try a different one.' });
                        } else if (error.response.data?.code === 'NICKNAME_EXISTS') {
                            setErrors({ nick_name: error.response.data?.msg || 'This nick name is already taken. Please try a different one.' });
                        } else {
                            setError(getErrorMessage(error));
                        }
                    }else{
                        setError(getErrorMessage(error));
                    }
                }
            }else {
                setError("An unexpected error occurred. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <CssBaseline />
            <Paper elevation={4} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3, width: '100%', }}            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <PersonAddIcon />
                </Avatar>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Create an Account
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField name="nick_name" required fullWidth id="nick_name" label="Nick Name" error={!!errors.nick_name} helperText={errors.nick_name} value={formData.nick_name} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField required fullWidth id="email" label="Email Address" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField required fullWidth name="password" label="Password" type={showPassword ? 'text' : 'password'} id="password" value={formData.password} onChange={handleChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }
                                }}  error={!!errors.password} helperText={errors.password}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField required fullWidth name="confirmPassword" label="Confirm Password" type={showPassword ? 'text' : 'password'} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl error={!!errors.agreeTerms} component="fieldset" variant="standard">
                                <FormControlLabel
                                    control={
                                        <Checkbox name="agreeTerms" color="primary" checked={formData.agreeTerms} onChange={handleChange} />
                                    }
                                    label={
                                        <Typography variant="body2" color="text.secondary">
                                            I agree to the <Link href="#" color="primary">Terms of Service</Link> and <Link href="#" color="primary">Privacy Policy</Link>.
                                        </Typography>
                                    }/>
                            {errors.agreeTerms && <Typography variant="caption" color="error">{errors.agreeTerms}</Typography>}
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 2, py: 1.2, fontWeight: 'bold' }} disabled={loading}>
                        Sign Up
                    </Button>
                    <Grid container>
                        <Box sx={{ mt: 1, textAlign: 'center', width: '100%' }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account? {' '}
                                <Link href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} variant="body2" color="primary">
                                    Sign in
                                </Link>
                            </Typography>
                        </Box>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
}