import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";
import { userService } from "../../services/user.service";
import { departmentService } from "../../services/department.service";
import { Users, Plus, Pencil, UserX, UserCheck, Search, X, Shield, Crown } from "lucide-react";
import { getPermissionLabel } from "../../constants/permissions";

// Every employee always manages their own data (create/update/delete/share) —
// this is automatic and not something shown/toggled in this form.
// The only permissions an admin can delegate to a specific user from here
// are: managing other users' data, viewing history, and managing trash.
const ADMIN_DELEGABLE_PERMISSIONS = ["data.view.others", "history.view", "history.restore"];

const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
    permissions: [] as string[]
};

export const UsersPage = () => {
    const { isAdmin } = useAuth();
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const { data: users, loading, error, refetch } = useFetch<any[]>(() => userService.getAll(), []);
    const { data: departments } = useFetch<any[]>(() => departmentService.getAll(), []);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const userList = Array.isArray(users) ? users : [];
    const deptList = Array.isArray(departments) ? departments : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                const { password, ...updateData } = form;
                await userService.update(editingId, { ...updateData, ...(password ? { password } : {}) });
            } else {
                // Ensure department is provided for non-admin users
                const submitData = { ...form };
                if (submitData.role !== "ADMIN" && !submitData.department) {
                    throw new Error("Department is required for non-admin users");
                }
                await userService.create(submitData);
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ ...emptyForm });
            refetch();
            addToast(editingId ? "User updated successfully!" : "User created successfully!", "success");
        } catch (err: any) {
            addToast(err.response?.data?.message || err.message || "Failed to save user", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string, isActive: boolean) => {
        const action = isActive ? "Deactivate" : "Reactivate";
        const ok = await confirm({
            title: `${action} User Account`,
            message: `Are you sure you want to ${action.toLowerCase()} this user account?`,
            confirmLabel: action,
            danger: isActive,
        });
        if (!ok) return;
        try {
            await userService.update(id, { isActive: !isActive });
            refetch();
            addToast(`User account ${isActive ? "deactivated" : "reactivated"} successfully.`, "success");
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to update user status", "error");
        }
    };

    const openEdit = (u: any) => {
        setForm({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            password: "",
            role: u.role,
            department: u.department || "",
            permissions: u.permissions || []
        });
        setEditingId(u._id || u.id);
        setShowModal(true);
    };

    const togglePermission = (perm: string) => {
        setForm((prev: any) => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter((p: string) => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    if (loading) return <div className="loading"><span className="spin" style={{ width: "22px", height: "22px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--text-main)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span> Loading user accounts...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    const filteredUsers = userList.filter((u: any) => {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const emailMatch = (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
        const nameMatch = fullName.includes(searchQuery.toLowerCase());
        return !searchQuery || emailMatch || nameMatch;
    });

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><Users size={22} /> User Account Management</h3>
                        <p>Create and manage user accounts, roles, and access permissions.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); }}>
                        <Plus size={18} /> Create User
                    </button>
                </div>
                <div style={{ marginTop: "15px" }}>
                    <div style={{ position: "relative", maxWidth: "400px" }}>
                        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or email..."
                            style={{ paddingLeft: 44 }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Account Status</th>
                                <th>Permissions</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={8} className="empty-state">No users found matching your search criteria.</td></tr>
                            ) : (
                                filteredUsers.map((u: any) => {
                                    const deptObj = deptList.find((d: any) => d._id === u.department);
                                    return (
                                        <tr key={u._id || u.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem" }}>
                                                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                                                    </div>
                                                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)" }}>{u.firstName} {u.lastName}</div>
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--text-tertiary)" }}>{u.email}</td>
                                            <td>{deptObj ? deptObj.name : (u.department ? "—" : <span style={{ color: "var(--text-disabled)" }}>None</span>)}</td>
                                            <td>
                                                <span className={`badge ${u.role === "ADMIN" ? "badge-admin" : "badge-employee"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                    {u.role === "ADMIN" ? <><Crown size={12} /> Admin</> : <><Shield size={12} /> Employee</>}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.isActive ? "badge-employee" : "badge-critical"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                    {u.isActive ? <><UserCheck size={12} /> Active</> : <><UserX size={12} /> Inactive</>}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                                                    {(u.permissions || []).length > 0
                                                        ? (u.permissions || []).slice(0, 3).map((p: string, i: number) => (
                                                            <span key={i} className="badge badge-normal" style={{ fontSize: "0.7rem" }}>{getPermissionLabel(p)}</span>
                                                        ))
                                                        : <span style={{ color: "var(--text-disabled)", fontSize: "0.8rem" }}>Default</span>
                                                    }
                                                    {(u.permissions || []).length > 3 && (
                                                        <span className="badge" style={{ background: "var(--surface-soft-2)", color: "var(--text-secondary)", fontSize: "0.7rem" }}>
                                                            +{u.permissions.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                                {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-info btn-sm" onClick={() => openEdit(u)}><Pencil size={14} /> Edit</button>
                                                    <button
                                                        className={`btn btn-sm ${u.isActive ? "btn-warning" : "btn-success"}`}
                                                        onClick={() => handleDeactivate(u._id || u.id, u.isActive)}
                                                    >
                                                        {u.isActive ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Reactivate</>}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "540px" }}>
                        <h3><Users size={22} /> {editingId ? "Edit User Account" : "Create New User"}</h3>
                        <form onSubmit={handleSubmit}>
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
                                <label>Email Address</label>
                                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!editingId} />
                                {editingId && <small style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>Email cannot be changed after creation.</small>}
                            </div>
                            <div className="form-group">
                                <label>{editingId ? "New Password (leave blank to keep current)" : "Password"}</label>
                                <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} {...(!editingId ? { required: true, minLength: 8 } : { minLength: 8 })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role Assignment</label>
                                    {isAdmin ? (
                                        <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="ADMIN">Administrator</option>
                                        </select>
                                    ) : (
                                        <input className="form-control" value="Employee" disabled />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                                        <option value="">No Department</option>
                                        {deptList.map((d: any) => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="form-group">
                                    <label>Delegated Permissions</label>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", margin: "0 0 8px" }}>
                                        Every user already manages their own data by default. Only an admin can additionally delegate: managing other users' data, viewing history, or managing trash.
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "12px", background: "var(--surface-inset)", borderRadius: "12px", border: "1px solid var(--border-soft)" }}>
                                        {ADMIN_DELEGABLE_PERMISSIONS.map(perm => (
                                            <label key={perm} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontWeight: "normal", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.permissions.includes(perm)}
                                                    onChange={() => togglePermission(perm)}
                                                />
                                                {getPermissionLabel(perm)}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!isAdmin && (
                                <div className="alert alert-info">
                                    Only an administrator can assign roles or grant permissions. New users you create will be Employees with default data-management permissions.
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save User"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};