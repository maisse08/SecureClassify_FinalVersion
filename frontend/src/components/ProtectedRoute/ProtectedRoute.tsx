import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface Props {
    children: React.ReactNode;
    adminOnly?: boolean;
    /** Allow access if the user has ANY of these permission keys (or is admin). */
    anyPermission?: string[];
}

export const ProtectedRoute = ({ children, adminOnly, anyPermission }: Props) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div className="loading">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;

    if (anyPermission && !isAdmin) {
        const permissions = user.permissions || [];
        const hasAccess = anyPermission.some(p => permissions.includes(p));
        if (!hasAccess) return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};