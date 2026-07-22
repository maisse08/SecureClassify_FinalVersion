import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";
import { userService } from "../../services/user.service";
import {
    User, KeyRound, Shield, CheckCircle2, XCircle,
    Crown, Sun, Moon, Globe,
    Eye, EyeOff, Loader2, Save, Lock
} from "lucide-react";
import "../../pages/Dashboard/dashboard.css";

export const ProfilePage = () => {
    const { user, isAdmin } = useAuth();
    const { theme, setTheme } = useTheme();
    const { t, language, setLanguage } = useLanguage();

    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
    });
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await userService.getProfile();
                setProfileData(data);
            } catch {
                setProfileData(user);
            }
        };
        fetchProfile();
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            await userService.updateProfile(form);
            setMessage(t("profile.profileUpdated"));
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (passwords.newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }
        setChangingPwd(true);
        setError("");
        setMessage("");
        try {
            await userService.changePassword(passwords.currentPassword, passwords.newPassword);
            setMessage(t("profile.passwordChanged"));
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPwd(false);
        }
    };

    const displayData = profileData || user;

    const languages = [
        { code: "en" as const, label: "English" },
        { code: "fr" as const, label: "Français" },
        { code: "ar" as const, label: "العربية" },
    ];

    return (
        <div className="dashboard-content" style={{ padding: "1.5rem", gap: "18px" }}>
            {/* Page Header */}
            <div className="dash-card dash-overview" style={{ padding: "20px 24px" }}>
                <div>
                    <h2 className="dash-title">{t("profile.title")}</h2>
                    <p className="dash-subtitle">
                        {isAdmin ? "Administrator" : "Employee"} &middot; {displayData?.department || "N/A"}
                    </p>
                </div>
                <span className={`scope-badge ${isAdmin ? "admin" : "user"}`}>
                    {isAdmin ? <><Crown size={14} /> ADMIN</> : <><Shield size={14} /> {displayData?.role}</>}
                </span>
            </div>

            {message && (
                <div className="dash-card" style={{ padding: "10px 18px", background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#34d399", fontSize: "0.9rem" }}>
                        <CheckCircle2 size={18} /> {message}
                    </div>
                </div>
            )}
            {error && (
                <div className="dash-card" style={{ padding: "10px 18px", background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f87171", fontSize: "0.9rem" }}>
                        <XCircle size={18} /> {error}
                    </div>
                </div>
            )}

            {/* Three-column grid for cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>

                {/* 1. Personal Information */}
                <div className="dash-card" style={{ padding: "20px 22px" }}>
                    <div className="dash-card-header" style={{ marginBottom: "10px" }}>
                        <h4 className="dash-card-title" style={{ fontSize: "1rem" }}><User size={16} /> {t("profile.personalInfo")}</h4>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "-4px 0 12px 0" }}>
                        {t("profile.personalInfo.desc")}
                    </p>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: "12px" }}>
                                <label>{t("profile.firstName")}</label>
                                <input className="form-control" value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: "12px" }}>
                                <label>{t("profile.lastName")}</label>
                                <input className="form-control" value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: "12px" }}>
                            <label>{t("profile.email")}</label>
                            <input type="email" className="form-control" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: "12px" }}>
                                <label>{t("profile.department")}</label>
                                <input className="form-control" value={displayData?.department || "N/A"} disabled />
                            </div>
                            <div className="form-group" style={{ marginBottom: "12px" }}>
                                <label>{t("profile.role")}</label>
                                <input className="form-control" value={displayData?.role || "N/A"} disabled />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%" }}>
                            {saving ? <><Loader2 size={16} className="spin" /> {t("profile.saving")}</> : <><Save size={16} /> {t("profile.updateProfile")}</>}
                        </button>
                    </form>
                </div>

                {/* 2. Preferences */}
                <div className="dash-card" style={{ padding: "20px 22px" }}>
                    <div className="dash-card-header" style={{ marginBottom: "10px" }}>
                        <h4 className="dash-card-title" style={{ fontSize: "1rem" }}><Globe size={16} /> {t("profile.preferences")}</h4>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "-4px 0 12px 0" }}>
                        {t("profile.preferences.desc")}
                    </p>
                    <div className="form-group" style={{ marginBottom: "12px" }}>
                        <label>{t("profile.theme")}</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                className={`btn ${theme === "light" ? "btn-primary" : ""}`}
                                style={{ flex: 1, justifyContent: "center" }}
                                onClick={() => setTheme("light")}
                            >
                                <Sun size={16} /> {t("profile.theme") === "Theme" ? "Light" : "Clair"}
                            </button>
                            <button
                                type="button"
                                className={`btn ${theme === "dark" ? "btn-primary" : ""}`}
                                style={{ flex: 1, justifyContent: "center" }}
                                onClick={() => setTheme("dark")}
                            >
                                <Moon size={16} /> {t("profile.theme") === "Theme" ? "Dark" : "Sombre"}
                            </button>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>{t("profile.language")}</label>
                        <select
                            className="form-control"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as any)}
                        >
                            {languages.map(l => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. Security - Change Password */}
                <div className="dash-card" style={{ padding: "20px 22px" }}>
                    <div className="dash-card-header" style={{ marginBottom: "10px" }}>
                        <h4 className="dash-card-title" style={{ fontSize: "1rem" }}><Lock size={16} /> {t("profile.security")}</h4>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "-4px 0 12px 0" }}>
                        {t("profile.security.desc")}
                    </p>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group" style={{ marginBottom: "12px" }}>
                            <label>{t("profile.currentPassword")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPwd.current ? "text" : "password"}
                                    className="form-control"
                                    value={passwords.currentPassword}
                                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    required
                                    style={{ paddingRight: "40px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                                    style={{
                                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 0
                                    }}
                                >
                                    {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: "12px" }}>
                            <label>{t("profile.newPassword")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPwd.new ? "text" : "password"}
                                    className="form-control"
                                    value={passwords.newPassword}
                                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    required
                                    minLength={8}
                                    style={{ paddingRight: "40px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                                    style={{
                                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 0
                                    }}
                                >
                                    {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: "12px" }}>
                            <label>{t("profile.confirmPassword")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPwd.confirm ? "text" : "password"}
                                    className="form-control"
                                    value={passwords.confirmPassword}
                                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    required
                                    style={{ paddingRight: "40px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                                    style={{
                                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 0
                                    }}
                                >
                                    {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={changingPwd} style={{ width: "100%" }}>
                            {changingPwd ? <><Loader2 size={16} className="spin" /> {t("profile.changing")}</> : <><KeyRound size={16} /> {t("profile.changePassword")}</>}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};