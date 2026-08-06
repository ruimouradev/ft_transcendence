import { useState, useCallback } from "react";
import NotificationSnackbar, { type NotificationSeverity } from "./NotificationSnackbar";

export interface NotificationItem {
  id: string;
  message: string;
  severity: NotificationSeverity;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((
    message: string,
    severity: NotificationSeverity = "info"
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, severity }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notificationNode = (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {notifications.map((item) => (
        <div key={item.id} style={{ pointerEvents: "auto" }}>
          <NotificationSnackbar
            open={true}
            message={item.message}
            severity={item.severity}
            onClose={() => dismissNotification(item.id)}
          />
        </div>
      ))}
    </div>
  );

  return {
    showNotification,
    notificationNode,
  };
}

// // src/components/useNotification.tsx
// import { useState, useCallback } from "react";
// import NotificationSnackbar, { type NotificationSeverity } from "./NotificationSnackbar";

// export function useNotification() {
//   const [open, setOpen] = useState(false);
//   const [message, setMessage] = useState("");
//   const [severity, setSeverity] = useState<NotificationSeverity>("info");

//   const showNotification = useCallback((
//     message: string,
//     severity: NotificationSeverity = "info"
//   ) => {
//     setMessage(message);
//     setSeverity(severity);
//     setOpen(true);
//   }, []);

//   const handleClose = useCallback(() => {
//     setOpen(false);
//   }, []);

//   const notificationNode = (
//     <NotificationSnackbar
//       open={open}
//       message={message}
//       severity={severity}
//       onClose={handleClose}
//     />
//   );

//   return {
//     showNotification,
//     notificationNode,
//   };
// }