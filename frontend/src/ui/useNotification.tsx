import { useState, useCallback } from "react";
import NotificationSnackbar from "./NotificationSnackbar";
import type { NotificationItem, NotificationSeverity } from '../core/types.ts'

export function useNotification()
{
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);

	const showNotification = useCallback((message: string, severity: NotificationSeverity = "info") => {
		const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
		setNotifications((prev) => [...prev, { id, message, severity }]);
	}, []);

	const dismissNotification = useCallback((id: string) => {
		setNotifications((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const current = notifications[0];
	const notificationNode = current
	? (<NotificationSnackbar key={current.id} open={true} message={current.message}
		severity={current.severity} onClose={() => dismissNotification(current.id)}/>) 
	: null;

	return ({ showNotification, notificationNode });
}
