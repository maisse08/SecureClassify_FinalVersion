import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { datatypeService } from "../../services/datatype.service";
import { FileText, FileType2, Plus, Pencil, Archive, X, FileImage, FileArchive, Film, Database, FileSpreadsheet, File, Recycle } from "lucide-react";

const FILE_ICONS: Record<string, any> = {
    "PDF": FileText,
    "Word Document": FileText,
    "Excel Spreadsheet": FileSpreadsheet,
    "PowerPoint Presentation": FileType2,
    "Image": FileImage,
    "ZIP Archive": FileArchive,
    "Video": Film,
    "Database Export": Database,
};

const emptyForm = { name: "", description: "", extensions: "" };

export const DataTypesPage = () => {
    const { addToast } = useToast();
    const { data: dataTypes, loading, error, refetch } = useFetch<any[]>(() => datatypeService.getAll(), []);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...emptyForm });
    const [saving, setSaving] = useState(false);

    const allTypes = Array.isArray(dataTypes) ? dataTypes : [];
    const activeTypes = allTypes.filter((t: any) => t.isActive);
    const inactiveTypes = allTypes.filter((t: any) => !t.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await datatypeService.update(editingId, form);
                addToast("Data type updated successfully!", "success");
            } else {
                await datatypeService.create(form);
                addToast("Data type created successfully!", "success");
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ ...emptyForm });
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to save data type", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await datatypeService.deactivate(id);
            addToast("Data type deactivated successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to deactivate data type", "error");
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await datatypeService.activate(id);
            addToast("Data type activated successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to activate data type", "error");
        }
    };

    const openEdit = (t: any) => {
        setForm({
            name: t.name,
            description: t.description || "",
            extensions: Array.isArray(t.extensions) ? t.extensions.join(", ") : (t.extensions || ""),
        });
        setEditingId(t._id);
        setShowModal(true);
    };

    if (loading) return <div className="loading"><span className="spin" style={{ width: "22px", height: "22px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--text-main)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span> Loading data types...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><FileType2 size={22} /> Data Type Registry</h3>
                        <p>Manage supported document formats. Deactivate to hide, activate to restore.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); }}>
                        <Plus size={18} /> New Data Type
                    </button>
                </div>
                {/* Active Data Types Table */}
                <div className="table-container" style={{ marginBottom: "24px" }}>
                    <div style={{ padding: "12px 16px", background: "rgba(52, 211, 153, 0.1)", borderBottom: "1px solid rgba(52, 211, 153, 0.2)" }}>
                        <h4 style={{ margin: 0, color: "#34d399", display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
                            Active Data Types ({activeTypes.length})
                        </h4>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Type Name</th>
                                <th>Description</th>
                                <th>Allowed Extensions</th>
                                <th>Datasets</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTypes.length === 0 ? (
                                <tr><td colSpan={6} className="empty-state">No active data types.</td></tr>
                            ) : (
                                activeTypes.map((t: any) => {
                                    const Icon = FILE_ICONS[t.name] || File;
                                    const exts = Array.isArray(t.extensions) ? t.extensions : (t.extensions ? [t.extensions] : []);
                                    return (
                                        <tr key={t._id}>
                                            <td>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-main)" }}>
                                                    <Icon size={18} style={{ color: "#3bc4e9" }} />
                                                    <strong>{t.name}</strong>
                                                </span>
                                            </td>
                                            <td style={{ color: "var(--text-tertiary)" }}>{t.description || "—"}</td>
                                            <td>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                    {exts.length > 0 ? exts.map((ext: string, i: number) => (
                                                        <span key={i} className="badge badge-normal" style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                            .{ext.replace(/^\./, "")}
                                                        </span>
                                                    )) : <span style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>Any</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-normal">{t.datasetCount ?? 0} dataset{(t.datasetCount ?? 0) === 1 ? "" : "s"}</span>
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-info btn-sm" onClick={() => openEdit(t)}><Pencil size={14} /> Edit</button>
                                                    <button className="btn btn-warning btn-sm" onClick={() => handleDeactivate(t._id)}><Archive size={14} /> Deactivate</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Inactive Data Types Table */}
                <div className="table-container">
                    <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", borderBottom: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <h4 style={{ margin: 0, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
                            Inactive Data Types ({inactiveTypes.length})
                        </h4>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Type Name</th>
                                <th>Description</th>
                                <th>Allowed Extensions</th>
                                <th>Datasets</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inactiveTypes.length === 0 ? (
                                <tr><td colSpan={6} className="empty-state">No inactive data types.</td></tr>
                            ) : (
                                inactiveTypes.map((t: any) => {
                                    const Icon = FILE_ICONS[t.name] || File;
                                    const exts = Array.isArray(t.extensions) ? t.extensions : (t.extensions ? [t.extensions] : []);
                                    return (
                                        <tr key={t._id}>
                                            <td>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-main)" }}>
                                                    <Icon size={18} style={{ color: "#3bc4e9" }} />
                                                    <strong>{t.name}</strong>
                                                </span>
                                            </td>
                                            <td style={{ color: "var(--text-tertiary)" }}>{t.description || "—"}</td>
                                            <td>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                    {exts.length > 0 ? exts.map((ext: string, i: number) => (
                                                        <span key={i} className="badge badge-normal" style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                            .{ext.replace(/^\./, "")}
                                                        </span>
                                                    )) : <span style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>Any</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-normal">{t.datasetCount ?? 0} dataset{(t.datasetCount ?? 0) === 1 ? "" : "s"}</span>
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-info btn-sm" onClick={() => openEdit(t)}><Pencil size={14} /> Edit</button>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleActivate(t._id)}><Recycle size={14} /> Activate</button>
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3><FileType2 size={22} /> {editingId ? "Edit Data Type" : "Register New Data Type"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Type Name (e.g. PDF, Excel Spreadsheet)</label>
                                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                            </div>
                            <div className="form-group">
                                <label>Allowed Extensions (comma-separated, e.g. pdf, PDF)</label>
                                <input className="form-control" placeholder="pdf, docx, xlsx..." value={form.extensions} onChange={e => setForm({ ...form, extensions: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Data Type"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};