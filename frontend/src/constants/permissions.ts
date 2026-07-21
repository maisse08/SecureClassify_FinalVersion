// Friendly labels for the technical permission keys used by the backend.
export const PERMISSION_LABELS: Record<string, string> = {
    "users.create": "Add Users",
    "users.view.others": "View All Users",
    "users.update": "Update Users",
    "users.delete": "Delete Users",
    "categories.create": "Create Categories",
    "categories.update": "Update Categories",
    "categories.archive": "Archive Categories",
    "categories.restore": "Restore Categories",
    "categories.delete": "Permanently Delete Categories",
    "departments.create": "Create Departments",
    "departments.update": "Update Departments",
    "departments.archive": "Archive Departments",
    "departments.restore": "Restore Departments",
    "departments.delete": "Permanently Delete Departments",
    "datatypes.create": "Create Data Types",
    "datatypes.update": "Update Data Types",
    "datatypes.archive": "Archive Data Types",
    "datatypes.restore": "Restore Data Types",
    "datatypes.delete": "Permanently Delete Data Types",
    "data.create": "Create Data",
    "data.update": "Update Data",
    "data.delete": "Delete Data",
    "data.view.others": "Manage Other Users' Data",
    "data.share": "Share Data",
    "history.view": "View All History",
    "history.restore": "Manage Trash & Restore Data",
};

// Human-readable description of what a default employee can do.
// A brand new employee can only manage (create/update/delete/share) their
// own data — everything else must be explicitly delegated by an admin.
export const DEFAULT_EMPLOYEE_PERMISSIONS = ["data.create", "data.update", "data.delete", "data.share"];

// Permissions that an admin can delegate to a regular user, beyond the
// defaults every employee already has for their own data. These map to the
// cahier de charges: "only admin can give a user the permission to add a
// user, or manage some user's data, or manage history/trash".
export const DELEGABLE_PERMISSIONS = [
    "users.create",
    "users.view.others",
    "users.update",
    "users.delete",
    "data.view.others",
    "history.view",
    "history.restore",
    "categories.create",
    "categories.update",
    "categories.archive",
    "categories.restore",
    "categories.delete",
    "departments.create",
    "departments.update",
    "departments.archive",
    "departments.restore",
    "departments.delete",
    "datatypes.create",
    "datatypes.update",
    "datatypes.archive",
    "datatypes.restore",
    "datatypes.delete",
];

// Any of these means the user can reach the "Référentiels" section of the
// sidebar (Categories / Departments / Data Types + their Archive), even
// without the ADMIN role.
export const REFERENTIELS_PERMISSIONS = DELEGABLE_PERMISSIONS.filter(
    (p) => p.startsWith("categories.") || p.startsWith("departments.") || p.startsWith("datatypes.")
);

// Every permission key that can be granted/revoked from the Users admin page.
export const ALL_GRANTABLE_PERMISSIONS = [
    ...DEFAULT_EMPLOYEE_PERMISSIONS,
    ...DELEGABLE_PERMISSIONS,
];

export const getPermissionLabel = (key: string): string => {
    return PERMISSION_LABELS[key] ?? key;
};