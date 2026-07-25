import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Box from '@mui/material/Box';
import LoginDrawer from './LoginDrawer';
import SignUpDrawer from './SignUpDrawer';

export default function UserMenu() {
  const { isLoggedIn, logout } = useAuth();
  const id = React.useId();
  const buttonId = `${id}-button`;
  const menuId = `${id}-menu`;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(null);
    console.log('Menu item clicked:', event.currentTarget.textContent);
    if (event.currentTarget.textContent === 'Logout') {
      logout();
      navigate('/');
    }
  };

  return (
    <div>
    {!isLoggedIn ? (<Box sx={{ display: 'flex', gap: 1 }}>
            <LoginDrawer />
            <SignUpDrawer />
        </Box>) : (<>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleClick}
      >
        <div className="flex items-center gap-4">
            <img src="src/assets/avatar/a00.jpeg" className="w-12 h-12 rounded-full" />
            <div>
                <div>Super Uno</div>
                <div className="text-sm text-gray-400">
                    Level 8
                </div>
            </div>
        </div>
      </Button>
      <Menu id={menuId} anchorEl={anchorEl} open={open} onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': buttonId,
          },
        }} >
        <MenuItem link="/profile" onClick={handleClose}><Link href="/profile" underline="none">Profile</Link></MenuItem>
        <MenuItem link="/account" onClick={handleClose}><Link href="/account" underline="none">My account</Link></MenuItem>
        <MenuItem link="/logout" onClick={handleClose}>Logout</MenuItem>
      </Menu>
       </> )}
    </div>
  );
}
