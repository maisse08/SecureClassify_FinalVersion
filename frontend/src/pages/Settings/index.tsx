import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";
import { userService } from "../../services/user.service";
import { Settings as SettingsIcon, KeyRound, Sun, Moon, CheckCircle2, AlertCircle } from "lucide-react";
import type { Language } from "../../i18n/translations";

export const SettingsPage = () => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [message, setMessage] = useState("");

    // Change password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        // Theme and language are applied live as soon as they're changed
        // below, so this just confirms the preferences were saved.
        setMessage(t("settings.savedMessage"));
        setTimeout(() => setMessage(""), 3000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordMessage("");

        if (newPassword !== confirmPassword) {
            setPasswordError(t("settings.passwordMismatch"));
            return;
        }

        setPasswordSaving(true);
        try {
            await userService.changePassword(currentPassword, newPassword);
            setPasswordMessage(t("settings.passwordChanged"));
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordMessage(""), 3000);
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || "Failed to change password");
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div className="card">
                <div className="card-header">
                    <h3><SettingsIcon size={22} /> {t("settings.title")}</h3>
                </div>
                {message && <div className="alert alert-success"><CheckCircle2 size={18} /> {message}</div>}

                <form onSubmit={handleSaveSettings}>
                    <div className="form-group">
                        <label>{t("settings.theme")}</label>
                        <select
                            className="form-control"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                        >
                            <option value="light">{t("settings.theme.light")}</option>
                            <option value="dark">{t("settings.theme.dark")}</option>
                        </select>
                        <small className="form-hint" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {theme === "light" ? <Sun size={13} /> : <Moon size={13} />}
                            {theme === "light" ? t("settings.theme.light") : t("settings.theme.dark")}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>{t("settings.language")}</label>
                        <select
                            className="form-control"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                        >
                            <option value="en">English (US)</option>
                            <option value="fr">Français (FR)</option>
                            <option value="ar">العربية (AR)</option>
                        </select>
                    </div>

                    <hr />

                    <div className="form-group">
                        <label>{t("settings.accountInfo")}</label>
                        <input className="form-control" value={user?.email || ""} disabled />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{t("settings.role")}: {user?.role}</span>
                    </div>

                    <button type="submit" className="btn btn-primary">{t("settings.savePreferences")}</button>
                </form>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3><KeyRound size={22} /> {t("settings.changePassword")}</h3>
                </div>
                {passwordMessage && <div className="alert alert-success"><CheckCircle2 size={18} /> {passwordMessage}</div>}
                {passwordError && <div className="alert alert-danger"><AlertCircle size={18} /> {passwordError}</div>}
                <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                        <label>{t("settings.currentPassword")}</label>
                        <input
                            type="password"
                            className="form-control"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>{t("settings.newPassword")}</label>
                        <input
                            type="password"
                            className="form-control"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>{t("settings.confirmPassword")}</label>
                        <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-danger" disabled={passwordSaving}>
                        {passwordSaving ? "Updating..." : t("settings.updatePassword")}
                    </button>
                </form>
            </div>
        </div>
    );
};
