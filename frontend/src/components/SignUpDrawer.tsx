import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';

import SignUp from '../pages/SignUp';

export default function SignUpDrawer() {
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <div>
      <Button onClick={toggleDrawer(true)} variant="contained">
        sign up
      </Button>
      <Drawer open={open} onClose={toggleDrawer(false)} anchor="right">
        <SignUp />
      </Drawer>
    </div>
  );
}