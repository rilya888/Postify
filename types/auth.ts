/**
 * User type (without sensitive data)
 * Used throughout the application
 */
export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Auth response type
 * Used in API responses
 */
export type AuthResponse = {
  user: User;
  message?: string;
};

/**
 * Auth error type
 * Used for error handling
 */
export type AuthError = {
  error: string;
  field?: string;
};
