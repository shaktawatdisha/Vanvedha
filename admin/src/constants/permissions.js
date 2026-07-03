// Mirrors backend/apps/accounts/models.py StaffModule + the module each admin
// view is gated on (backend/apps/admin/views.py, backend/apps/procurement/views.py).
export const ROUTE_MODULES = {
  '/users':                     'accounts_users',
  '/delivery-agents':           'accounts_users',
  '/staff-payroll':             'payroll',
  '/categories':                'catalog_reviews',
  '/tags':                      'catalog_reviews',
  '/products':                  'catalog_reviews',
  '/orders':                    'orders_payments',
  '/coupons':                   'orders_payments',
  '/reviews':                   'catalog_reviews',
  '/raw-material/suppliers':    'procurement',
  '/raw-material/raw-lots':     'procurement',
  '/raw-material/batches':      'procurement',
  '/raw-material/scan':         'procurement',
};

// Routes that stay ADMIN-only regardless of staff permissions (dashboard
// aggregates data across every module; staff-permissions manages the
// permission templates themselves, which staff must never self-grant).
export const ADMIN_ONLY_PATHS = ['/dashboard', '/staff-permissions'];

export function moduleForPath(pathname) {
  const match = Object.keys(ROUTE_MODULES).find((p) => pathname.startsWith(p));
  return match ? ROUTE_MODULES[match] : null;
}

export function canViewModule(permissions, module) {
  return Boolean(permissions?.[module]?.view);
}

export function firstAllowedPath(permissions) {
  const entry = Object.entries(ROUTE_MODULES).find(([, module]) => canViewModule(permissions, module));
  return entry ? entry[0] : null;
}
