import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { REFERENTIELS_PERMISSIONS } from "../../constants/permissions";
import {
    LayoutDashboard, Files, Share2, Trash2, Users,
    Building2, FolderTree, FileType, History,
    User, ChevronLeft, ChevronRight, ChevronDown, Shield, ShieldAlert,
    Archive
} from "lucide-react";

export const Sidebar = () => {
    const { isAdmin, user } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // The "Référentiels" parent menu is expanded by default whenever the
    // user is already looking at one of its submenu pages.
    const referentielsPaths = ["/departments", "/categories", "/datatypes"];
    const [referentielsOpen, setReferentielsOpen] = useState(
        referentielsPaths.some(p => location.pathname.startsWith(p))
    );

    const toggleSidebar = () => setCollapsed(!collapsed);

    // A regular employee who was delegated any "users.*" permission by an
    // admin should also be able to reach the Users administration page —
    // not just true ADMIN accounts.
    const permissions = user?.permissions || [];
    const canManageUsers = isAdmin || permissions.some(p => p.startsWith("users."));

    // Référentiels (reference data) section: ADMIN always sees it, and a
    // regular employee sees it once an admin has delegated at least one
    // categories.*/departments.*/datatypes.* permission.
    const canManageReferentiels = isAdmin || permissions.some(p => REFERENTIELS_PERMISSIONS.includes(p));

    const NavItem = ({ to, icon, label, sub }: any) => (
        <NavLink to={to} className={({ isActive }) => `nav-link ${sub ? "nav-link-sub" : ""} ${isActive ? "active" : ""}`}>
            <span className="nav-icon">{icon}</span>
            {!collapsed && <span className="nav-text">{label}</span>}
        </NavLink>
    );

    return (
        <aside className={`sidebar glass-panel ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Shield className="logo-icon" size={28} />
                    {!collapsed && <h2>{t("app.name")}</h2>}
                </div>
                <button className="collapse-btn" onClick={toggleSidebar}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label={t("nav.dashboard")} />
                <NavItem to="/data" icon={<Files size={20} />} label={t("nav.documents")} />
                <NavItem to="/cia-assessment" icon={<ShieldAlert size={20} />} label={t("nav.ciaAssessment")} />
                <NavItem to="/sharing" icon={<Share2 size={20} />} label={t("nav.sharing")} />
                <NavItem to="/trash" icon={<Trash2 size={20} />} label={t("nav.trash")} />
                {isAdmin && (
                    <NavItem to="/history" icon={<History size={20} />} label={t("nav.activity")} />
                )}
                {(canManageUsers || canManageReferentiels) && (
                    <div className="admin-section">
                        {!collapsed && <span className="section-label">{t("nav.administration")}</span>}

                        {canManageUsers && (
                            <NavItem to="/users" icon={<Users size={20} />} label={t("nav.users")} />
                        )}

                        {canManageReferentiels && (
                            <div className="nav-group">
                                <button
                                    type="button"
                                    className={`nav-link nav-parent ${referentielsOpen ? "expanded" : ""}`}
                                    onClick={() => setReferentielsOpen(o => !o)}
                                >
                                    <span className="nav-icon"><FolderTree size={20} /></span>
                                    {!collapsed && <span className="nav-text">{t("nav.referentiels")}</span>}
                                    {!collapsed && (
                                        <span className={`nav-chevron ${referentielsOpen ? "rotate" : ""}`}>
                                            <ChevronDown size={16} />
                                        </span>
                                    )}
                                </button>

                                {referentielsOpen && (
                                    <div className="nav-submenu">
                                         <NavItem sub to="/departments" icon={<Building2 size={17} />} label={t("nav.departments")} />
                                        <NavItem sub to="/categories" icon={<FolderTree size={17} />} label={t("nav.categories")} />
                                        <NavItem sub to="/datatypes" icon={<FileType size={17} />} label={t("nav.datatypes")} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <NavItem to="/profile" icon={<User size={20} />} label={t("nav.profile")} />
            </div>
        </aside>
    );
};
