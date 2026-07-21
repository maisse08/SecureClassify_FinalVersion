import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { categoryService } from "../../services/category.service";
import { FolderTree, Plus, Pencil, Archive, X, FileText, Recycle } from "lucide-react";

const initialForm = { name: "", description: "", color: "#1976D2" };

export const CategoriesPage = () => {
    const { addToast } = useToast();
    const { data: categoriesGroup, loading, error, refetch } = useFetch<any[]>(() => categoryService.getAll(), []);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...initialForm });
    const [saving, setSaving] = useState(false);

    const allCategories = Array.isArray(categoriesGroup) ? categoriesGroup : [];
    const activeCategories = allCategories.filter((c: any) => c.isActive);
    const inactiveCategories = allCategories.filter((c: any) => !c.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await categoryService.update(editingId, form);
                addToast("Category updated successfully!", "success");
            } else {
                await categoryService.create(form);
                addToast("Category created successfully!", "success");
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ ...initialForm });
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to save category", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await categoryService.deactivate(id);
            addToast("Category deactivated successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to deactivate category", "error");
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await categoryService.activate(id);
            addToast("Category activated successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to activate category", "error");
        }
    };

    const openEdit = (c: any) => {
        setForm({
            name: c.name,
            description: c.description || "",
            color: c.color || "#1976D2",
        });
        setEditingId(c._id);
        setShowModal(true);
    };

    if (loading) return <div className="loading"><span className="spin" style={{ width: "22px", height: "22px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--text-main)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span> Loading categories...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><FolderTree size={22} /> Categories</h3>
                        <p>Manage business data sensitivity groupings. Deactivate to hide, activate to restore.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ ...initialForm }); setShowModal(true); }}>
                        <Plus size={18} /> Add Category
                    </button>
                </div>

                {/* Active Categories Table */}
                <div className="table-container" style={{ marginBottom: "24px" }}>
                    <div style={{ padding: "12px 16px", background: "rgba(52, 211, 153, 0.1)", borderBottom: "1px solid rgba(52, 211, 153, 0.2)" }}>
                        <h4 style={{ margin: 0, color: "#34d399", display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
                            Active Categories ({activeCategories.length})
                        </h4>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Datasets</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeCategories.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state">No active categories.</td></tr>
                            ) : (
                                activeCategories.map((c: any) => (
                                    <tr key={c._id}>
                                        <td>
                                            <strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color || "#ccc", display: "inline-block" }} />
                                                {c.name}
                                            </strong>
                                        </td>
                                        <td style={{ color: "var(--text-tertiary)" }}>{c.description || "—"}</td>
                                        <td>
                                            <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                <FileText size={13} /> {c.datasetCount ?? 0} dataset{(c.datasetCount ?? 0) === 1 ? "" : "s"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-info btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /> Edit</button>
                                                <button className="btn btn-warning btn-sm" onClick={() => handleDeactivate(c._id)}><Archive size={14} /> Deactivate</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Inactive Categories Table */}
                <div className="table-container">
                    <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", borderBottom: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <h4 style={{ margin: 0, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
                            Inactive Categories ({inactiveCategories.length})
                        </h4>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Datasets</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inactiveCategories.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state">No inactive categories.</td></tr>
                            ) : (
                                inactiveCategories.map((c: any) => (
                                    <tr key={c._id}>
                                        <td>
                                            <strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color || "#ccc", display: "inline-block" }} />
                                                {c.name}
                                            </strong>
                                        </td>
                                        <td style={{ color: "var(--text-tertiary)" }}>{c.description || "—"}</td>
                                        <td>
                                            <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                <FileText size={13} /> {c.datasetCount ?? 0} dataset{(c.datasetCount ?? 0) === 1 ? "" : "s"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-info btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /> Edit</button>
                                                <button className="btn btn-success btn-sm" onClick={() => handleActivate(c._id)}><Recycle size={14} /> Activate</button>
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
                        <h3><FolderTree size={22} /> {editingId ? "Edit Category" : "Add New Category"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                            </div>
                            <div className="form-group">
                                <label>Category Banner Color</label>
                                <input type="color" className="form-control" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ height: "44px", cursor: "pointer" }} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Category"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};