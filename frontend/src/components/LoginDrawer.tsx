import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';

import Login from '../pages/Login';

export default function LoginDrawer() {
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <div>
      <Button onClick={toggleDrawer(true)} variant="contained">
        sign in
      </Button>
      <Drawer open={open} onClose={toggleDrawer(false)} anchor="right">
        <Login />
      </Drawer>
    </div>
  );
}