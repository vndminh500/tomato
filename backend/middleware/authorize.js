const ROLE_PERMISSIONS = {
    admin: ["*"],
    staff: [
        "orders.read_all",
        "orders.update_status",
        "reviews.read",
        "reviews.reply"
    ],
    customer: [
        "profile.read_self",
        "profile.update_self",
        "order.read_self",
        "order.cancel_self",
        "order.place",
        "menu.read",
        "promo.validate"
    ]
};

const getUserPermissions = (user = {}) => {
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const extraPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    return new Set([...rolePermissions, ...extraPermissions]);
};

const requireRole = (...roles) => {
    const allowedRoles = new Set(roles);
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!allowedRoles.has(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        next();
    };
};

const requirePermission = (...permissions) => {
    const requiredPermissions = permissions.filter(Boolean);
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userPermissions = getUserPermissions(req.user);
        const hasWildcard = userPermissions.has("*");
        const hasAllPermissions = requiredPermissions.every((permission) =>
            userPermissions.has(permission)
        );
        if (!hasWildcard && !hasAllPermissions) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        next();
    };
};

export { ROLE_PERMISSIONS, getUserPermissions, requireRole, requirePermission };
