import { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./authProvider";
import { UserProfile } from "../types/auth";

const rolePermissions: Record<string, Record<string, string[]>> = {
  admin_general: {
    users: ["list", "create", "edit", "delete", "show"],
    asiponas: ["list", "create", "edit", "delete", "show"],
    contracts: ["list", "create", "edit", "delete", "show"],
    dashboard: ["list", "show"],
  },
  admin_asipona: {
    users: ["list", "show"],
    asiponas: ["list", "show"],
    contracts: ["list", "create", "edit", "delete", "show"],
    dashboard: ["list", "show"],
  },
  viewer: {
    users: [],
    asiponas: ["list", "show"],
    contracts: ["list", "show"],
    dashboard: ["list", "show"],
  },
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const identity = (await authProvider.getIdentity?.()) as UserProfile | null;
    const userRole = identity?.role || "viewer";

    const allowedActions = rolePermissions[userRole]?.[resource || ""] || [];
    const canAccess = allowedActions.includes(action);

    return {
      can: canAccess,
      reason: canAccess ? undefined : "No cuentas con permisos suficientes.",
    };
  },
};