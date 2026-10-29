export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

type Listener = (notifications: Notification[]) => void;

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const copy = [...this.notifications];
    this.listeners.forEach((l) => l(copy));
  }

  show(type: NotificationType, message: string, title?: string, duration = 4000): string {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: Notification = { id, type, message, title, duration };
    this.notifications = [item, ...this.notifications].slice(0, 5);
    this.emit();
    if (duration > 0 && typeof window !== "undefined") {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.emit();
  }

  clear() {
    this.notifications = [];
    this.emit();
  }
}

export const notificationManager = new NotificationManager();

export function showSuccess(message: string, title = "Success") {
  return notificationManager.show("success", message, title);
}

export function showError(message: string, title = "Error") {
  return notificationManager.show("error", message, title);
}

export function showInfo(message: string, title = "Information") {
  return notificationManager.show("info", message, title);
}

export function showWarning(message: string, title = "Warning") {
  return notificationManager.show("warning", message, title);
}
