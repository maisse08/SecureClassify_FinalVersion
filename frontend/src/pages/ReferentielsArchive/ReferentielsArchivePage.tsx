import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { categoryService } from "../../services/category.service";
import { departmentService } from "../../services/department.service";
import { datatypeService } from "../../services/datatype.service";
import { Archive, Building2, FolderTree, FileType, Recycle, XCircle, Info, FileText, Users } from "lucide-react";

type TabKey = "categories" | "departments" | "datatypes";

export const ReferentielsArchivePage = () => {
    const { isAdmin, user } = useAuth();
    const { addToast } = useToast();
    const permissions = user?.permissions || [];
    const canDeleteCategories = isAdmin || permissions.includes("categories.delete");
    const canDeleteDepartments = isAdmin || permissions.includes("departments.delete");
    const canDeleteDatatypes = isAdmin || permissions.includes("datatypes.delete");

    const [tab, setTab] = useState<TabKey>("categories");
    const [confirmItem, setConfirmItem] = useState<{ action: string; service: any; id: string; refetch: () => void } | null>(null);

    const { data: archivedCategories, loading: loadingCategories, error: errorCategories, refetch: refetchCategories } =
        useFetch<any[]>(() => categoryService.getArchived(), []);
    const { data: archivedDepartments, loading: loadingDepartments, error: errorDepartments, refetch: refetchDepartments } =
        useFetch<any[]>(() => departmentService.getArchived(), []);
    const { data: archivedDataTypes, loading: loadingDataTypes, error: errorDataTypes, refetch: refetchDataTypes } =
        useFetch<any[]>(() => datatypeService.getArchived(), []);

    const catList = Array.isArray(archivedCategories) ? archivedCategories : [];
    const deptList = Array.isArray(archivedDepartments) ? archivedDepartments : [];
    const typeList = Array.isArray(archivedDataTypes) ? archivedDataTypes : [];

    const handleRestore = async (service: any, id: string, refetch: () => void) => {
        try {
            await service.restore(id);
            addToast("Record restored successfully!", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to restore", "error");
        }
    };

    const handlePermanentDelete = async (service: any, id: string, refetch: () => void) => {
        try {
            await service.permanentlyDelete(id);
            addToast("Record permanently deleted.", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to permanently delete", "error");
        }
    };

    const TABS: { key: TabKey; label: string; icon: any }[] = [
        { key: "categories", label: "Archived Categories", icon: FolderTree },
        { key: "departments", label: "Archived Departments", icon: Building2 },
        { key: "datatypes", label: "Archived Data Types", icon: FileType },
    ];

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><Archive size={22} /> Référentiels Archive</h3>
                        <p>Archived reference data is kept here. Restore it to bring it back, or permanently delete it once it's no longer referenced.</p>
                    </div>
                </div>

                <div className="btn-group" style={{ marginTop: "10px" }}>
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            className={`btn ${tab === key ? "btn-primary" : ""}`}
                            onClick={() => setTab(key)}
                        >
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {tab === "categories" && (
                <div className="card">
                    {loadingCategories ? (
                        <div className="loading">Loading archived categories...</div>
                    ) : errorCategories ? (
                        <div className="alert alert-danger">{errorCategories}</div>
                    ) : (
                        <>
                            {!canDeleteCategories && (
                                <div className="alert alert-info" style={{ marginBottom: "12px" }}>
                                    <Info size={18} /> You can restore archived categories. Only administrators (or users granted the delete permission) can permanently delete them.
                                </div>
                            )}
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Category Name</th>
                                            <th>Description</th>
                                            <th>Datasets</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {catList.length === 0 ? (
                                            <tr><td colSpan={4} className="empty-state">
                                                <div style={{ padding: "20px 0" }}>
                                                    <div style={{ marginBottom: "8px", color: "#34d399" }}><Recycle size={32} /></div>
                                                    No archived categories.
                                                </div>
                                            </td></tr>
                                        ) : (
                                            catList.map((c: any) => (
                                                <tr key={c._id}>
                                                    <td><strong style={{ color: "var(--text-main)" }}>{c.name}</strong></td>
                                                    <td style={{ color: "var(--text-tertiary)" }}>{c.description || "—"}</td>
                                                    <td>
                                                        <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                            <FileText size={13} /> {c.datasetCount ?? 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <button className="btn btn-success btn-sm" onClick={() => handleRestore(categoryService, c._id, refetchCategories)}>
                                                                <Recycle size={14} /> Restore
                                                            </button>
                                                            {canDeleteCategories && (
                                                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem({ action: "permanently delete this category", service: categoryService, id: c._id, refetch: refetchCategories })}>
                                                                    <XCircle size={14} /> Delete Forever
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {tab === "departments" && (
                <div className="card">
                    {loadingDepartments ? (
                        <div className="loading">Loading archived departments...</div>
                    ) : errorDepartments ? (
                        <div className="alert alert-danger">{errorDepartments}</div>
                    ) : (
                        <>
                            {!canDeleteDepartments && (
                                <div className="alert alert-info" style={{ marginBottom: "12px" }}>
                                    <Info size={18} /> You can restore archived departments. Only administrators (or users granted the delete permission) can permanently delete them.
                                </div>
                            )}
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Department Name</th>
                                            <th>Code</th>
                                            <th>Users</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptList.length === 0 ? (
                                            <tr><td colSpan={4} className="empty-state">
                                                <div style={{ padding: "20px 0" }}>
                                                    <div style={{ marginBottom: "8px", color: "#34d399" }}><Recycle size={32} /></div>
                                                    No archived departments.
                                                </div>
                                            </td></tr>
                                        ) : (
                                            deptList.map((d: any) => (
                                                <tr key={d._id}>
                                                    <td><strong style={{ color: "var(--text-main)" }}>{d.name}</strong></td>
                                                    <td><span className="badge badge-admin">{d.code || "N/A"}</span></td>
                                                    <td>
                                                        <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                            <Users size={13} /> {d.userCount ?? 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <button className="btn btn-success btn-sm" onClick={() => handleRestore(departmentService, d._id, refetchDepartments)}>
                                                                <Recycle size={14} /> Restore
                                                            </button>
                                                            {canDeleteDepartments && (
                                                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem({ action: "permanently delete this department", service: departmentService, id: d._id, refetch: refetchDepartments })}>
                                                                    <XCircle size={14} /> Delete Forever
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {tab === "datatypes" && (
                <div className="card">
                    {loadingDataTypes ? (
                        <div className="loading">Loading archived data types...</div>
                    ) : errorDataTypes ? (
                        <div className="alert alert-danger">{errorDataTypes}</div>
                    ) : (
                        <>
                            {!canDeleteDatatypes && (
                                <div className="alert alert-info" style={{ marginBottom: "12px" }}>
                                    <Info size={18} /> You can restore archived data types. Only administrators (or users granted the delete permission) can permanently delete them.
                                </div>
                            )}
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Type Name</th>
                                            <th>Description</th>
                                            <th>Datasets</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {typeList.length === 0 ? (
                                            <tr><td colSpan={4} className="empty-state">
                                                <div style={{ padding: "20px 0" }}>
                                                    <div style={{ marginBottom: "8px", color: "#34d399" }}><Recycle size={32} /></div>
                                                    No archived data types.
                                                </div>
                                            </td></tr>
                                        ) : (
                                            typeList.map((t: any) => (
                                                <tr key={t._id}>
                                                    <td><strong style={{ color: "var(--text-main)" }}>{t.name}</strong></td>
                                                    <td style={{ color: "var(--text-tertiary)" }}>{t.description || "—"}</td>
                                                    <td>
                                                        <span className="badge badge-normal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                            <FileText size={13} /> {t.datasetCount ?? 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <button className="btn btn-success btn-sm" onClick={() => handleRestore(datatypeService, t._id, refetchDataTypes)}>
                                                                <Recycle size={14} /> Restore
                                                            </button>
                                                            {canDeleteDatatypes && (
                                                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem({ action: "permanently delete this data type", service: datatypeService, id: t._id, refetch: refetchDataTypes })}>
                                                                    <XCircle size={14} /> Delete Forever
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmItem && (
                <div className="modal-overlay" onClick={() => setConfirmItem(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                        <h3><XCircle size={22} /> Confirm Permanent Deletion</h3>
                        <p style={{ color: "var(--text-tertiary)", margin: "16px 0", lineHeight: 1.6 }}>
                            Are you sure you want to <strong>permanently delete</strong> {confirmItem.action}?
                            <br />
                            <span style={{ color: "#ef4444", fontWeight: 600 }}>This action CANNOT be undone!</span>
                        </p>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setConfirmItem(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => {
                                handlePermanentDelete(confirmItem.service, confirmItem.id, confirmItem.refetch);
                                setConfirmItem(null);
                            }}>Delete Forever</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};