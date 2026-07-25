import React, { useState } from 'react';
import {
Box,
Button,
Checkbox,
Container,
CssBaseline,
Divider,
FormControlLabel,
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
LockOutlined as LockOutlinedIcon,
Google as GoogleIcon,
GitHub as GitHubIcon,
} from '@mui/icons-material';

import myIcon from '../assets/i42.ico';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function Login() {

    const { login } = useAuth();
const [formData, setFormData] = useState({
email: '',
password: '',
rememberMe: false,
});
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const navigate = useNavigate();

const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
};

const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
};

const handleSubmit = async (e) =>{
    e.preventDefault();
    // Basic validation
    if (!formData.email || !formData.password) {
        setError('Please fill in all fields.');
        return;
    }
    setLoading(true);
    try {
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);

        const response = await axios.post('http://localhost:8000/api/v1/login/access-token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
            });
        console.log('Response:', response.data);
        console.log('Response:', response.token_type, response.access_token);
        if (response.data.token_type && response.data.access_token) {
        login(response.data.access_token);
        navigate('/', { replace: true });
      }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                setError(`login failed: ${error.response.data.detail || 'Unknown error'}`);
            } else if (error.request) {
                setError('login failed: No response from server');
            } else {
                setError(`login failed: ${error.message}`);
            }
        } else {
            setError('login failed: An unknown error occurred');
        }
    } finally {
      setLoading(false);
    }
};

return (
<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2,}} >
<Container component="main" maxWidth="xs">
<Paper elevation={6}
sx={{
p: 4,
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
borderRadius: 3,
backgroundColor: 'rgba(255, 255, 255, 0.95)',
backdropFilter: 'blur(10px)',
}} >
{/* Header Avatar & Icon */}
<Avatar alt="Remy Sharp" src="/src/assets/avatar/a00.jpeg" sx={{ width: 120, height: 120 ,border: 'none' }}/>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Login Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={formData.email}
          onChange={handleChange}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
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

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1,
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                color="primary"
              />
            }
            label={<Typography variant="body2">Remember me</Typography>}
          />
          <Link href="#" variant="body2" underline="hover">
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 3,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Divider for Social Login */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Social Buttons */}
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
        </Box>

        {/* Footer Sign Up Link */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link href="/signup" underline="hover" sx={{ fontWeight: 600 }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  </Container>
</Box>


);
}