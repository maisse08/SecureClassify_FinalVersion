import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/user.service";
import { User, KeyRound, ClipboardList, CheckCircle2, XCircle, Crown, Shield } from "lucide-react";

export const ProfilePage = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        displayName: user?.displayName || "",
        email: user?.email || "",
    });
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            await userService.updateProfile(form);
            setMessage("Profile updated successfully!");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPwd(true);
        setError("");
        setMessage("");
        try {
            await userService.changePassword(passwords.currentPassword, passwords.newPassword);
            setMessage("Password changed successfully!");
            setPasswords({ currentPassword: "", newPassword: "" });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPwd(false);
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3><User size={22} /> My Profile</h3>
                    <span className={`badge ${user?.role === "ADMIN" ? "badge-admin" : "badge-employee"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {user?.role === "ADMIN" ? <><Crown size={12} /> {user?.role}</> : <><Shield size={12} /> {user?.role}</>}
                    </span>
                </div>

                {message && <div className="alert alert-success"><CheckCircle2 size={18} /> {message}</div>}
                {error && <div className="alert alert-danger"><XCircle size={18} /> {error}</div>}

                <form onSubmit={handleProfileUpdate}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input className="form-control" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input className="form-control" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Display Name</label>
                        <input className="form-control" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Update Profile"}
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3><KeyRound size={22} /> Change Password</h3>
                </div>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input type="password" className="form-control" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>New Password (min 8 characters)</label>
                        <input type="password" className="form-control" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={8} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={changingPwd}>
                        {changingPwd ? "Changing..." : "Change Password"}
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3><ClipboardList size={22} /> Account Info</h3>
                </div>
                <div className="table-container">
                    <table>
                        <tbody>
                            <tr><td><strong style={{ color: "var(--text-main)" }}>User ID</strong></td><td style={{ color: "var(--text-secondary)" }}>{user?.id}</td></tr>
                            <tr><td><strong style={{ color: "var(--text-main)" }}>Role</strong></td><td><span className={`badge ${user?.role === "ADMIN" ? "badge-admin" : "badge-employee"}`}>{user?.role}</span></td></tr>
                            <tr><td><strong style={{ color: "var(--text-main)" }}>Department</strong></td><td style={{ color: "var(--text-secondary)" }}>{user?.department || "N/A"}</td></tr>
                            <tr><td><strong style={{ color: "var(--text-main)" }}>Active</strong></td><td>
                                <span className={`badge ${user?.isActive ? "badge-employee" : "badge-critical"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {user?.isActive ? <><CheckCircle2 size={12} /> Yes</> : <><XCircle size={12} /> No</>}
                                </span>
                            </td></tr>
                            <tr><td><strong style={{ color: "var(--text-main)" }}>Permissions</strong></td><td style={{ color: "var(--text-secondary)" }}>{(user?.permissions || []).join(", ") || "None"}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};