import { useState, useCallback } from "react";
import NotificationSnackbar, { type NotificationSeverity } from "./NotificationSnackbar";

// (vive na pasta ui porque qualquer página pode precisar de avisos)
export interface NotificationItem {
  id: string;
  message: string;
  severity: NotificationSeverity;
}

// Fila de avisos para uma página: chama-se showNotification("texto",
// "error") e renderiza-se {notificationNode} algures no JSX. Vários
// avisos seguidos empilham-se no canto em vez de se atropelarem.
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

  // O Snackbar do MUI posiciona-se sozinho no ecrã (position fixed),
  // por isso mostrar varios ao mesmo tempo era empilha-los todos no
  // mesmo sitio. Mostra-se so o primeiro da fila: quando fecha, o
  // seguinte aparece.
  const current = notifications[0];
  const notificationNode = current ? (
    <NotificationSnackbar
      key={current.id}
      open={true}
      message={current.message}
      severity={current.severity}
      onClose={() => dismissNotification(current.id)}
    />
  ) : null;

  return {
    showNotification,
    notificationNode,
  };
}
