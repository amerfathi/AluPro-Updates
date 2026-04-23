import type { UserRole } from "@/types/database";

export const roleRank: Record<UserRole, number> = {
  client: 1,
  staff: 2,
  admin: 3,
};

export function hasRole(userRole: UserRole | undefined, minRole: UserRole) {
  if (!userRole) {
    return false;
  }

  return roleRank[userRole] >= roleRank[minRole];
}

export function canManageBusinessData(role: UserRole | undefined) {
  return hasRole(role, "staff");
}

export function canAccessAdmin(role: UserRole | undefined) {
  return hasRole(role, "staff");
}

export function canAccessPortal(role: UserRole | undefined) {
  return role === "client";
}


