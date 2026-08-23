import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
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
  PersonAddOutlined as PersonAddIcon,
} from '@mui/icons-material';

import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { api } from '../core/client';

// Criar conta. As validações daqui são a primeira linha (campos vazios,
// tamanhos, passwords iguais) e o backend repete-as do lado dele, que é
// quem manda. Depois do registo a conta fica à espera da verificação
// por email, e o login avisa disso.
export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nickName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // formato dos erros de validação (422) do FastAPI
  interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
  }
  interface ErrorResponse {
    detail: ValidationError[];
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!formData.email) {
      setError('Email is required.');
      return;
    }
    if (!formData.nickName) {
      setError('Nick name is required.');
      return;
    }
    if (formData.nickName.length < 3 || formData.nickName.length > 20) {
      setError('Nick name must be between 3 and 20 characters long.');
      return;
    }
    if (!formData.agreeTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }
    setError('');
    try {
      const params = {
        email: formData.email,
        password: formData.password,
        nick_name: formData.nickName,
      };
      const response = await api.post('/users/signup', params);
      if (response?.data?.id) {
        navigate('/login?info=Account created successfully, check your email for verification', { replace: true });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 422) {
            const errorData = err.response.data as ErrorResponse;
            const messages = errorData.detail.map((item) => item.msg);
            setError(`Sign up failed: ${messages.join('\n')}`);
          } else {
            setError(`Sign up failed: ${err.response.data.detail || 'unknown error'}`);
          }
        } else if (err.request) {
          setError('Sign up failed: no response from the server');
        } else {
          setError(`Sign up failed: ${err.message}`);
        }
      } else {
        setError('Sign up failed: an unknown error occurred');
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 3,
          width: '100%',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          Create an Account
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="nickName"
                required
                fullWidth
                id="nickName"
                label="Nick Name"
                autoFocus
                value={formData.nickName}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
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
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeTerms"
                    color="primary"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I agree to the <Link component={RouterLink} to="/terms" color="primary">Terms of Service</Link> and <Link component={RouterLink} to="/privacy" color="primary">Privacy Policy</Link>.
                  </Typography>
                }
              />
            </Grid>
          </Grid>
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 2, py: 1.2, fontWeight: 'bold' }}>
            Sign Up
          </Button>
          <Grid container sx={{ justifyContent: "flex-end" }}>
            <Grid size={{ xs: 12 }}>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                variant="body2"
                color="primary"
              >
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
