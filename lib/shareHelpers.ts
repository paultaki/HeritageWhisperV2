// Helper functions for share permissions

export function canEdit(permissionLevel: string): boolean {
  return permissionLevel === "edit";
}

export function canView(permissionLevel: string): boolean {
  return permissionLevel === "view" || permissionLevel === "edit";
}

export function getShareUrl(token: string, origin?: string): string {
  const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}/shared/${token}`;
}

export function formatPermissionLevel(level: string): string {
  return level === "edit" ? "Can Edit" : "View Only";
}

export function isShareExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
