export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  FINANCE: "finance",
  SUPPORT: "support",
  MARKETING: "marketing",
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  DASHBOARD_FINANCE_VIEW: "dashboard.finance.view",
  SUBSCRIPTIONS_VIEW: "subscriptions.view",
  SUBSCRIPTIONS_FINANCE_VIEW: "subscriptions.finance.view",
  SUBSCRIPTIONS_MANAGE: "subscriptions.manage",
  CREDIT_SCORING_VIEW: "credit_scoring.view",
  ORGANIZATIONS_VIEW: "organizations.view",
  COMPANIES_VIEW: "companies.view",
  OPERATORS_VIEW: "operators.view",
  TAX_HUB_VIEW: "tax_hub.view",
  COMMS_VIEW: "comms.view",
  TROUBLESHOOTING_VIEW: "troubleshooting.view",
  ACCESS_CONTROL_MANAGE: "access_control.manage",
};

const ALL_PERMISSION_VALUES = Object.values(PERMISSIONS);

const basePermissions = {
  [PERMISSIONS.DASHBOARD_VIEW]: false,
  [PERMISSIONS.DASHBOARD_FINANCE_VIEW]: false,
  [PERMISSIONS.SUBSCRIPTIONS_VIEW]: false,
  [PERMISSIONS.SUBSCRIPTIONS_FINANCE_VIEW]: false,
  [PERMISSIONS.SUBSCRIPTIONS_MANAGE]: false,
  [PERMISSIONS.CREDIT_SCORING_VIEW]: false,
  [PERMISSIONS.ORGANIZATIONS_VIEW]: false,
  [PERMISSIONS.COMPANIES_VIEW]: false,
  [PERMISSIONS.OPERATORS_VIEW]: false,
  [PERMISSIONS.TAX_HUB_VIEW]: false,
  [PERMISSIONS.COMMS_VIEW]: false,
  [PERMISSIONS.TROUBLESHOOTING_VIEW]: false,
  [PERMISSIONS.ACCESS_CONTROL_MANAGE]: false,
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSION_VALUES.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {}),
  [ROLES.ADMIN]: {
    ...basePermissions,
    [PERMISSIONS.DASHBOARD_VIEW]: true,
    [PERMISSIONS.DASHBOARD_FINANCE_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_FINANCE_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_MANAGE]: true,
    [PERMISSIONS.CREDIT_SCORING_VIEW]: true,
    [PERMISSIONS.ORGANIZATIONS_VIEW]: true,
    [PERMISSIONS.COMPANIES_VIEW]: true,
    [PERMISSIONS.OPERATORS_VIEW]: true,
    [PERMISSIONS.TAX_HUB_VIEW]: true,
    [PERMISSIONS.COMMS_VIEW]: true,
    [PERMISSIONS.TROUBLESHOOTING_VIEW]: true,
  },
  [ROLES.FINANCE]: {
    ...basePermissions,
    [PERMISSIONS.DASHBOARD_VIEW]: true,
    [PERMISSIONS.DASHBOARD_FINANCE_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_FINANCE_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_MANAGE]: true,
    [PERMISSIONS.CREDIT_SCORING_VIEW]: true,
    [PERMISSIONS.COMPANIES_VIEW]: true,
  },
  [ROLES.SUPPORT]: {
    ...basePermissions,
    [PERMISSIONS.DASHBOARD_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_VIEW]: true,
    [PERMISSIONS.SUBSCRIPTIONS_MANAGE]: true,
    [PERMISSIONS.ORGANIZATIONS_VIEW]: true,
    [PERMISSIONS.COMPANIES_VIEW]: true,
    [PERMISSIONS.OPERATORS_VIEW]: true,
    [PERMISSIONS.TROUBLESHOOTING_VIEW]: true,
  },
  [ROLES.MARKETING]: {
    ...basePermissions,
    [PERMISSIONS.DASHBOARD_VIEW]: true,
    [PERMISSIONS.COMPANIES_VIEW]: true,
    [PERMISSIONS.TAX_HUB_VIEW]: true,
    [PERMISSIONS.COMMS_VIEW]: true,
  },
};

export const MOCK_ACCOUNTS = [
  { id: "acct-super-admin", name: "Ernest", role: ROLES.SUPER_ADMIN, permissionOverrides: {} },
  { id: "acct-admin", name: "Asha", role: ROLES.ADMIN, permissionOverrides: {} },
  { id: "acct-finance", name: "Diana", role: ROLES.FINANCE, permissionOverrides: {} },
  { id: "acct-support", name: "Wilson", role: ROLES.SUPPORT, permissionOverrides: {} },
  { id: "acct-marketing", name: "Janeth", role: ROLES.MARKETING, permissionOverrides: {} },
];

export function getRoleLabel(role) {
  if (role === ROLES.SUPER_ADMIN) return "Super Admin";
  if (role === ROLES.ADMIN) return "Admin";
  if (role === ROLES.FINANCE) return "Finance";
  if (role === ROLES.MARKETING) return "Marketing";
  return "Sales / Support";
}

export function getEffectivePermissions(role, overrides = {}) {
  const fromRole = ROLE_PERMISSIONS[role] || basePermissions;
  return {
    ...fromRole,
    ...overrides,
  };
}

export function normalizeOverrides(overrides) {
  if (!overrides || typeof overrides !== "object") return {};
  return Object.entries(overrides).reduce((acc, [key, value]) => {
    if (ALL_PERMISSION_VALUES.includes(key) && typeof value === "boolean") {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function getPermissionLabel(permission) {
  const labels = {
    [PERMISSIONS.DASHBOARD_VIEW]: "View dashboard",
    [PERMISSIONS.DASHBOARD_FINANCE_VIEW]: "View dashboard finance numbers",
    [PERMISSIONS.SUBSCRIPTIONS_VIEW]: "View subscriptions",
    [PERMISSIONS.SUBSCRIPTIONS_FINANCE_VIEW]: "View subscriptions finance details",
    [PERMISSIONS.SUBSCRIPTIONS_MANAGE]: "Manage subscription actions",
    [PERMISSIONS.CREDIT_SCORING_VIEW]: "View credit scoring",
    [PERMISSIONS.ORGANIZATIONS_VIEW]: "View organizations",
    [PERMISSIONS.COMPANIES_VIEW]: "View companies",
    [PERMISSIONS.OPERATORS_VIEW]: "View operators",
    [PERMISSIONS.TAX_HUB_VIEW]: "View tax hub CMS",
    [PERMISSIONS.COMMS_VIEW]: "View comms",
    [PERMISSIONS.TROUBLESHOOTING_VIEW]: "View troubleshooting",
    [PERMISSIONS.ACCESS_CONTROL_MANAGE]: "Manage access control",
  };
  return labels[permission] || permission;
}

export function canAccessPath(pathname, permissions) {
  const entries = [
    { startsWith: "/admin/access-control", permission: PERMISSIONS.ACCESS_CONTROL_MANAGE },
    { startsWith: "/admin/credit-scoring", permission: PERMISSIONS.CREDIT_SCORING_VIEW },
    { startsWith: "/admin/subscriptions", permission: PERMISSIONS.SUBSCRIPTIONS_VIEW },
    { startsWith: "/admin/organizations", permission: PERMISSIONS.ORGANIZATIONS_VIEW },
    { startsWith: "/admin/companies", permission: PERMISSIONS.COMPANIES_VIEW },
    { startsWith: "/admin/operators", permission: PERMISSIONS.OPERATORS_VIEW },
    { startsWith: "/admin/tax-hub-cms", permission: PERMISSIONS.TAX_HUB_VIEW },
    { startsWith: "/admin/comms", permission: PERMISSIONS.COMMS_VIEW },
    { startsWith: "/admin/troubleshooting", permission: PERMISSIONS.TROUBLESHOOTING_VIEW },
    { startsWith: "/admin", permission: PERMISSIONS.DASHBOARD_VIEW },
  ];

  const match = entries.find((entry) => pathname.startsWith(entry.startsWith));
  if (!match) return true;
  return Boolean(permissions?.[match.permission]);
}
