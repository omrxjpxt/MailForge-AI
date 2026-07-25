import { FirebaseError } from "firebase/app";

export interface AuthErrorMessage {
  title: string;
  description: string;
  /** Which field to highlight: 'email' | 'password' | null */
  field: "email" | "password" | null;
  /** Whether to clear the password field */
  clearPassword: boolean;
}

/**
 * Maps Firebase authentication errors to human-readable, security-safe messages.
 * Never exposes raw Firebase error codes or messages to the UI.
 *
 * Security note: auth/wrong-password and auth/user-not-found are intentionally
 * mapped to the same message to prevent account enumeration attacks.
 */
export function getAuthErrorMessage(error: unknown): AuthErrorMessage {
  // Extract Firebase error code if available
  let code: string | undefined;
  if (error instanceof FirebaseError) {
    code = error.code;
  } else if (
    error instanceof Error &&
    error.message &&
    !error.message.includes("Firebase:")
  ) {
    // Non-Firebase errors (e.g., session creation failures) — safe to show
    return {
      title: "Unable to sign in",
      description: error.message,
      field: null,
      clearPassword: false,
    };
  }

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return {
        title: "Invalid email or password",
        description: "Please check your credentials and try again.",
        field: "password",
        clearPassword: true,
      };

    case "auth/invalid-email":
      return {
        title: "Invalid email address",
        description: "Please enter a valid email address.",
        field: "email",
        clearPassword: false,
      };

    case "auth/network-request-failed":
      return {
        title: "Connection problem",
        description:
          "Please check your internet connection and try again.",
        field: null,
        clearPassword: false,
      };

    case "auth/too-many-requests":
      return {
        title: "Too many login attempts",
        description:
          "For your security, login has been temporarily disabled. Please wait a few minutes before trying again.",
        field: null,
        clearPassword: false,
      };

    case "auth/email-already-in-use":
      return {
        title: "Email already in use",
        description:
          "An account with this email address already exists. Please sign in instead.",
        field: "email",
        clearPassword: false,
      };

    case "auth/weak-password":
      return {
        title: "Password too weak",
        description: "Password must be at least 6 characters long.",
        field: "password",
        clearPassword: false,
      };

    case "auth/user-disabled":
      return {
        title: "Account disabled",
        description:
          "This account has been disabled. Please contact support.",
        field: null,
        clearPassword: false,
      };

    default:
      return {
        title: "Unable to sign in",
        description: "Something went wrong. Please try again.",
        field: null,
        clearPassword: false,
      };
  }
}
