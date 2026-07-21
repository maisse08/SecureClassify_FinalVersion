import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { departmentService } from "../../services/department.service";
import { Building2, Plus, Pencil, Archive, X, Hash, Users, Recycle } from "lucide-react";

const emptyForm = { name: "", code: "", description: "" };

export const DepartmentsPage = () => {
    const { addToast } = useToast();
    const { data: departments, loading, error, refetch } = useFetch<any[]>(() => departmentService.getAll(), []);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...emptyForm });
    const [saving, setSaving] = useState(false);

    const allDepts = Array.isArray(departments) ? departments : [];
    const activeDepts = allDepts.filter((d: any) => d.isActive);
    const inactiveDepts = allDepts.filter((d: any) => !d.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await departmentService.update(editingId, form);
                addToast("Department updated successfully!", "success");
            } else {
                await departmentService.create(form);
                addToast("Department created successfully!", "success");
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ ...emptyForm });
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to save department", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await departmentService.deactivate(id);
            addToast("Department deactivated successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to deactivate department", "error");
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await departmentService.activate(id);
            addToast("Department activated successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to activate department", "error");
        }
    };

    const openEdit = (d: any) => {
        setForm({ name: d.name, code: d.code || "", description: d.description || "" });
        setEditingId(d._id);
        setShowModal(true);
    };

    if (loading) return <div className="loading"><span className="spin" style={{ width: "22px", height: "22px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--text-main)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span> Loading departments...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><Building2 size={22} /> Departments</h3>
                        <p>Manage organizational departments. Deactivate to hide, activate to restore.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); }}>
                        <Plus size={18} /> New Department
                    </button>
                </div>
                {/* Active Departments Table */}
                <div className="table-container" style={{ marginBottom: "24px" }}>
                    <div style={{ padding: "12px 16px", background: "rgba(52, 211, 153, 0.1)", borderBottom: "1px solid rgba(52, 211, 153, 0.2)" }}>
                        <h4 style={{ margin: 0, color: "#34d399", display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
                            Active Departments ({activeDepts.length})
                        </h4>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th>Code</th>
                                <th>Users</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeDepts.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state">No active departments.</td></tr>
                            ) : (
                                activeDepts.map((d: any) => (
                                    <tr key={d._id}>
                                        <td><strong style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}><Building2 size={16} /> {d.name}</strong></td>
                                        <td><span className="badge badge-admin">{d.code || "N/A"}</span></td>
                                        <td>
                                            <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Users size={13} /> {d.userCount ?? 0} user{(d.userCount ?? 0) === 1 ? "" : "s"}</span>
                                        </td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-info btn-sm" onClick={() => openEdit(d)}><Pencil size={14} /> Edit</button>
                                                <button className="btn btn-warning btn-sm" onClick={() => handleDeactivate(d._id)}><Archive size={14} /> Deactivate</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Inactive Departments Table */}
                <div className="table-container">
                    <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", borderBottom: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <h4 style={{ margin: 0, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
                            Inactive Departments ({inactiveDepts.length})
                        </h4>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th>Code</th>
                                <th>Users</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inactiveDepts.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state">No inactive departments.</td></tr>
                            ) : (
                                inactiveDepts.map((d: any) => (
                                    <tr key={d._id}>
                                        <td><strong style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}><Building2 size={16} /> {d.name}</strong></td>
                                        <td><span className="badge badge-admin">{d.code || "N/A"}</span></td>
                                        <td>
                                            <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Users size={13} /> {d.userCount ?? 0} user{(d.userCount ?? 0) === 1 ? "" : "s"}</span>
                                        </td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-info btn-sm" onClick={() => openEdit(d)}><Pencil size={14} /> Edit</button>
                                                <button className="btn btn-success btn-sm" onClick={() => handleActivate(d._id)}><Recycle size={14} /> Activate</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3><Building2 size={22} /> {editingId ? "Edit Department" : "Create New Department"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Department Name</label>
                                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Short Code (e.g. IT, HR, FIN)</label>
                                <div style={{ position: "relative" }}>
                                    <Hash size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
                                    <input className="form-control" style={{ paddingLeft: 40 }} value={form.code} placeholder="3-letter code" onChange={e => setForm({ ...form, code: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Department"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};