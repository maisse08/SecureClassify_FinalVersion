export const PERMISSIONS = {
    USERS_CREATE: "users.create",
    USERS_VIEW_OTHERS: "users.view.others",
    USERS_UPDATE: "users.update",
    USERS_DELETE: "users.delete",

    CATEGORIES_CREATE: "categories.create",
    CATEGORIES_UPDATE: "categories.update",
    CATEGORIES_ARCHIVE: "categories.archive",
    CATEGORIES_RESTORE: "categories.restore",
    CATEGORIES_DELETE: "categories.delete",

    DEPARTMENTS_CREATE: "departments.create",
    DEPARTMENTS_UPDATE: "departments.update",
    DEPARTMENTS_ARCHIVE: "departments.archive",
    DEPARTMENTS_RESTORE: "departments.restore",
    DEPARTMENTS_DELETE: "departments.delete",

    DATATYPES_CREATE: "datatypes.create",
    DATATYPES_UPDATE: "datatypes.update",
    DATATYPES_ARCHIVE: "datatypes.archive",
    DATATYPES_RESTORE: "datatypes.restore",
    DATATYPES_DELETE: "datatypes.delete",

    DATA_CREATE: "data.create",
    DATA_UPDATE: "data.update",
    DATA_DELETE: "data.delete",
    DATA_VIEW_OTHERS: "data.view.others",
    DATA_SHARE: "data.share",

    HISTORY_VIEW: "history.view",
    HISTORY_RESTORE: "history.restore",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Every employee manages their own data by default. This is not something
// an admin can revoke through the delegated-permissions selection — it is
// always granted, on top of whatever is delegated.
export const DEFAULT_EMPLOYEE_PERMISSIONS = [
    PERMISSIONS.DATA_CREATE,
    PERMISSIONS.DATA_UPDATE,
    PERMISSIONS.DATA_DELETE,
    PERMISSIONS.DATA_SHARE,
];

export default PERMISSIONS;
