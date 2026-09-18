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
