import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
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
  Google as GoogleIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

import myIcon from '../assets/i42.ico';

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

  interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: any;
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
    } else if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    } else if (!formData.email) {
      setError('Email is required.');
      return;
    }
    if (!formData.nickName) {
      setError('Nick name is required.');
      return;
    }
    if(formData.nickName.length < 3 || formData.nickName.length > 20) {
      setError('Nick name must be between 3 and 20 characters long.');
      return;
    }
    if (!formData.agreeTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }
    setError('');
    // Add registration API call here
    try {
      const params = {
        'email': formData.email,
        'password': formData.password,
        'nick_name': formData.nickName
      }
      const response = await axios.post('/api/v1/users/signup', params, { withCredentials: true });
      if (response?.data?.id) {
        navigate('/login?info=Account created successfully,check your email for verification', { replace: true });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 422) {
            const errorData = error.response.data as ErrorResponse;
            const errorMessages = errorData.detail.map((err) => err.msg);
            console.log('Error messages:', errorMessages);
            setError(`login failed: ${errorMessages.join('\n')}`);
          } else {
            setError(`login failed: ${error.response.data.detail || 'Unknown error'}`);
          }
        } else if (error.request) {
          setError('login failed: No response from server');
        } else {
          setError(`login failed: ${error.message}`);
        }
      } else {
        setError('login failed: An unknown error occurred');
      }
    } finally {
      // setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{
      height: '100vh', display: 'flex', alignItems:
        'center'
    }}>
      <CssBaseline />
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
                  }
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
                    I agree to the <Link href="#" color="primary">Terms of Service</Link> and <Link
                      href="#" color="primary">Privacy Policy</Link>.
                  </Typography>
                }
              />
            </Grid>
          </Grid>
          <Button type="submit" fullWidth variant="contained" sx={{
            mt: 2, mb: 2, py: 1.2, fontWeight:
              'bold'
          }}>
            Sign Up
          </Button>
          {/* <Divider sx={{ my: 2 }}>OR</Divider>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<img src={myIcon} alt="42" style={{ width: 20, height: 20 }} />}
              onClick={() => alert('42 Login')}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Login 42
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => alert('GitHub Login')}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              GitHub
            </Button>
          </Box> */}
          <Grid container sx={{ justifyContent: "flex-end" }}>
            <Grid size={{ xs: 12 }}>
              <Link href="#" onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }} variant="body2" color="primary">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}