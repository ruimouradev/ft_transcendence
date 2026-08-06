// src/components/useNotification.tsx
import { useState, useCallback } from "react";
import NotificationSnackbar, { type NotificationSeverity } from "./NotificationSnackbar";

export function useNotification() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<NotificationSeverity>("info");

  const showNotification = useCallback((
    message: string,
    severity: NotificationSeverity = "info"
  ) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const notificationNode = (
    <NotificationSnackbar
      open={open}
      message={message}
      severity={severity}
      onClose={handleClose}
    />
  );

  return {
    showNotification,
    notificationNode,
  };
}