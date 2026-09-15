export type AuthUser = {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

export type AuthSessionState = {
  configured: boolean;
  localTestAuthEnabled?: boolean;
  authMode?: "cloud" | "local-test";
  authenticated: boolean;
  user: AuthUser | null;
  error?: string;
  requiresEmailConfirmation?: boolean;
};

export type UpdateStatus =
  | "disabled"
  | "dev"
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "current"
  | "error";

export type UpdateState = {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion: string;
  progress: number;
  message: string;
};
