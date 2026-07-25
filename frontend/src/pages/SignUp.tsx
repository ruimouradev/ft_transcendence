import React, { useState } from 'react';
import {
Box,
Button,
Checkbox,
Container,
CssBaseline,
Divider,
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

import myIcon from '../assets/i42.ico';

export default function SignUp() {
const [showPassword, setShowPassword] = useState(false);
const [formData, setFormData] = useState({
firstName: '',
lastName: '',
email: '',
password: '',
confirmPassword: '',
agreeTerms: false,
});
const [error, setError] = useState('');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const { name, value, checked, type } = e.target;
setFormData((prev) => ({
...prev,
[name]: type === 'checkbox' ? checked : value,
}));
};
const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (formData.password !== formData.confirmPassword) {
setError('Passwords do not match!');
return;
}
if (!formData.agreeTerms) {
setError('You must agree to the terms and conditions.');
return;
}
setError('');
console.log('Form Submitted:', formData);
// Add registration API call here
};
return (
<Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems:
'center' }}>
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
<Grid item xs={12} sm={6}>
<TextField
name="firstName"
required
fullWidth
id="firstName"
label="First Name"
autoFocus
value={formData.firstName}
onChange={handleChange}
/>
</Grid>
<Grid item xs={12} sm={6}>
<TextField

name="lastName"
required
fullWidth
id="lastName"
label="Last Name"
value={formData.lastName}
onChange={handleChange}
/>
</Grid>
<Grid item xs={12}>
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
<Grid item xs={12}>
<TextField
required
fullWidth
name="password"
label="Password"
type={showPassword ? 'text' : 'password'}
id="password"
value={formData.password}
onChange={handleChange}
InputProps={{
endAdornment: (
<InputAdornment position="end">
<IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
{showPassword ? <VisibilityOff /> : <Visibility />}
</IconButton>
</InputAdornment>
),
}}
/>
</Grid>
<Grid item xs={12}>
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
<Grid item xs={12}>
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
<Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 2, py: 1.2, fontWeight:
'bold' }}>
Sign Up
</Button>
<Divider sx={{ my: 2 }}>OR</Divider>
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
{/* 
<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
<Button fullWidth variant="outlined" startIcon={<GoogleIcon />} size="small">
Google
</Button>
<Button fullWidth variant="outlined" startIcon={<GitHubIcon />} size="small">
GitHub
</Button>
</Stack> */}

<Grid container justifyContent="flex-end">
<Grid item>
<Link href="/login" variant="body2" color="primary">
Already have an account? Sign in
</Link>
</Grid>
</Grid>
</Box>
</Paper>
</Container>
);
}