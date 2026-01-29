import { toast } from "@/hooks/use-toast";

/**
 * Notification service for consistent messaging
 */
export class NotificationService {
  static success(title: string, description?: string) {
    toast({
      title,
      description,
      variant: "default",
    });
  }

  static error(title: string, description?: string) {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }

  static info(title: string, description?: string) {
    toast({
      title,
      description,
      variant: "default",
    });
  }

  static warn(title: string, description?: string) {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }
}