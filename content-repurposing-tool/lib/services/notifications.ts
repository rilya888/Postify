import { toast } from "sonner";

/**
 * Notification service for consistent messaging
 */
export class NotificationService {
  static success(title: string, description?: string) {
    toast.success(description || title);
  }

  static error(title: string, description?: string) {
    toast.error(description || title);
  }

  static info(title: string, description?: string) {
    toast.info(description || title);
  }

  static warn(title: string, description?: string) {
    toast.warning(description || title);
  }
}