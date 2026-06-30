/** Role-based access control — permissions per role */
export const PERMISSIONS = {
  'dashboard:read': 'View dashboard',
  'products:read': 'View products',
  'products:write': 'Manage products',
  'orders:read': 'View orders',
  'orders:write': 'Manage orders',
  'users:read': 'View users',
  'users:write': 'Manage users',
  'payments:read': 'View payments',
  'payments:write': 'Manage payments',
  'cms:read': 'View CMS',
  'cms:write': 'Manage CMS',
  'marketing:read': 'View marketing',
  'marketing:write': 'Manage marketing',
  'settings:read': 'View settings',
  'settings:write': 'Manage settings',
  'security:read': 'View security logs & sessions',
  'security:write': 'Manage security settings',
  'audit:read': 'View activity audit logs',
};

export const ROLE_PERMISSIONS = {
  customer: [],
  support: [
    'dashboard:read',
    'orders:read',
    'orders:write',
    'users:read',
  ],
  manager: [
    'dashboard:read',
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'users:read',
    'payments:read',
    'cms:read',
    'cms:write',
    'marketing:read',
    'marketing:write',
    'settings:read',
    'security:read',
    'audit:read',
  ],
  admin: Object.keys(PERMISSIONS),
};

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer;
}

export function roleHasPermission(role, permission) {
  const perms = getPermissionsForRole(role);
  return perms.includes(permission);
}

export function canAccessAdminPanel(role) {
  return role !== 'customer';
}
