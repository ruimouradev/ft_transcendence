import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import defaultAvatar from '../assets/avatar/a_default.svg';

// O canto direito da navbar: sem sessão mostra os dois botões de
// entrada, com sessão mostra o avatar com o menu da conta.
export default function UserMenu() {
    const { user, isAuthenticated, logout } = useAuth();
    const id = React.useId();
    const buttonId = `${id}-button`;
    const menuId = `${id}-menu`;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const navigate = useNavigate();

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Cada entrada do menu fecha-o e faz a sua ação, sem adivinhar
    // nada pelo texto clicado.
    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/');
    };

    if (!isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button component={RouterLink} to="/login" variant="contained" color="primary">
                    sign in
                </Button>
                {/* o amarelo do logo, para as duas pontas da navbar combinarem */}
                <Button component={RouterLink} to="/signup" variant="contained" sx={{ backgroundColor: '#eab308', color: '#0f172a', '&:hover': { backgroundColor: '#facc15' }, }}>
                    sign up
                </Button>
            </Box>
        );
    }

    return (
        <div>
            <Button id={buttonId} aria-controls={open ? menuId : undefined} aria-haspopup="true" aria-expanded={open} onClick={handleOpen}>
                <div className="flex items-center gap-4">
                    <img src={user?.avatar || defaultAvatar} alt={user?.nick_name || 'avatar'} className="w-12 h-12 rounded-full" />
                    {/* em telemóvel fica só o avatar, o nome não cabe */}
                    <div className="hidden sm:block">
                        <div>{user?.nick_name}</div>
                        <div className="text-sm text-gray-400">
                            {user?.is_superuser ? 'Super User' : 'User'}
                        </div>
                    </div>
                </div>
            </Button>
            <Menu id={menuId} anchorEl={anchorEl} open={open} onClose={handleClose} slotProps={{ list: { 'aria-labelledby': buttonId } }}>
                <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>Profile</MenuItem>
                <MenuItem component={RouterLink} to="/password" onClick={handleClose}>Password</MenuItem>
                <MenuItem component={RouterLink} to="/apikey" onClick={handleClose}>API Key</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </div>
    );
}
