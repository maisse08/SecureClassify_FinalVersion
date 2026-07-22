import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { Search, ChevronDown } from "lucide-react";
import "./Navbar.css";

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to data page with search query
            navigate(`/data?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav className="navbar glass-panel">
            <div className="nav-left">
                <form className="search-box" onSubmit={handleSearch}>
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={t("navbar.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            <div className="nav-right">
                <div className="nav-status">
                    <span className="pulse-dot"></span>
                    <span className="status-text">{t("navbar.networkSecure")}</span>
                </div>

                <div className="user-profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <div className="avatar-box">
                        {user?.firstName?.charAt(0) || "?"}
                    </div>
                    <div className="user-meta">
                        <span className="user-name">{user?.firstName} {user?.lastName}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                    <ChevronDown size={16} className={dropdownOpen ? "rotate" : ""} />

                    {dropdownOpen && (
                        <div className="profile-dropdown glass-panel">
                            <div className="dropdown-info">
                                <p className="full-name">{user?.firstName} {user?.lastName}</p>
                                <p className="email">{user?.email}</p>
                            </div>
                            <div className="divider"></div>
                            <button className="dropdown-link" onClick={logout}>{t("navbar.signOut")}</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};