import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Container,
} from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  is_superuser: boolean;
  is_active: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get<UserProfile>('https://localhost:8443/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setProfile(response.data);
      } catch (err: any) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.detail || 'Failed to load profile data.');
          navigate('/login', { replace: true });
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box display="flex" sx={{ justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profile) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>

        <Box sx={{ height: 120, bgcolor: 'primary.main' }} />

        <CardContent sx={{ pt: 0, position: 'relative' }}>
          <Box display="flex" sx={{ justifyContent:"center", mt: -7, mb: 2 }}>
            <Avatar
              src={profile.avatar}
              alt={profile.name}
              sx={{
                width: 100,
                height: 100,
                border: '4px solid white',
                boxShadow: 2,
                fontSize: 36,
                bgcolor: 'secondary.main',
              }}
            >
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </Box>

          <Stack sx={{ spacing: 1, alignItems: "center", textAlign: "center" }}>
            <Typography variant="h5" component="h1" fontWeight="bold">
              {profile.name}
            </Typography>

            <Stack sx={{ direction: "row", alignItems: "center", spacing: 0.5 }} color="text.secondary">
              <EmailIcon fontSize="small" />
              <Typography variant="body1">{profile.email}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {profile.is_superuser ? (
                <Chip
                  icon={<AdminIcon />}
                  label="Superuser"
                  color="secondary"
                  variant="filled"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<UserIcon />}
                  label="Standard User"
                  variant="outlined"
                  size="small"
                />
              )}

              {profile.is_active ? (
                <Chip
                  icon={<ActiveIcon />}
                  label="Active"
                  color="success"
                  variant="soft"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<InactiveIcon />}
                  label="Inactive"
                  color="error"
                  variant="soft"
                  size="small"
                />
              )}
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={2} sx={{ px: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography color="text.secondary">Account Role</Typography>
              <Typography fontWeight="medium">
                {profile.is_superuser ? 'Administrator' : 'General User'}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography color="text.secondary">Account Status</Typography>
              <Typography
                fontWeight="medium"
                color={profile.is_active ? 'success.main' : 'error.main'}
              >
                {profile.is_active ? 'Activated' : 'Pending Activation'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};