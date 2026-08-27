export const ROLES = {
  ADMIN_GENERAL: "admin_general",
  ADMIN_ASIPONA: "admin_asipona",
  VIEWER: "viewer",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];