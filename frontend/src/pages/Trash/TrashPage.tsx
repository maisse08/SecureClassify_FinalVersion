import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";
import { trashService } from "../../services/trash.service";
import { ITrashEntry } from "../../types/data";
import { useAuth } from "../../hooks/useAuth";
import { Trash2, Recycle, AlertTriangle, Info, Paperclip, XCircle } from "lucide-react";

const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const TrashPage = () => {
    const { isAdmin, user } = useAuth();
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const canManageAllTrash = isAdmin || (user?.permissions || []).some(p => p === "history.view" || p === "history.restore");
    const { data: trashList, loading, error, refetch } = useFetch<ITrashEntry[]>(() => trashService.getAll(), []);

    const handleRestore = async (originalDataId: string) => {
        const ok = await confirm({
            title: "Restore Document",
            message: "Restore this document to the active list?",
            confirmLabel: "Restore",
        });
        if (!ok) return;
        try {
            await trashService.restore(originalDataId);
            addToast("Document restored successfully.", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to restore document", "error");
        }
    };

    const handlePermanentDelete = async (id: string) => {
        const ok = await confirm({
            title: "Permanently Delete Document",
            message: "This action cannot be undone. The document and all its files will be permanently removed.",
            confirmLabel: "Delete Forever",
            danger: true,
        });
        if (!ok) return;
        try {
            await trashService.permanentlyDelete(id);
            addToast("Document permanently deleted.", "success");
            refetch();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to permanently delete", "error");
        }
    };

    if (loading) return <div className="loading"><span className="spin" style={{ width: "22px", height: "22px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--text-main)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span> Loading trash bin...</div>;
    if (error) return <div className="alert alert-danger"><AlertTriangle size={18} /> {error}</div>;

    const list = Array.isArray(trashList) ? trashList : [];

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><Trash2 size={22} /> Trash Bin</h3>
                        <p>Deleted documents are held here before permanent removal.</p>
                    </div>
                    <span className="badge badge-sensitive" style={{ fontSize: "1rem", padding: "8px 16px" }}>
                        {list.length} item{list.length !== 1 ? "s" : ""} in Trash
                    </span>
                </div>

                {!canManageAllTrash && (
                    <div className="alert alert-info" style={{ marginTop: "15px" }}>
                        <Info size={18} /> You can restore your own documents. Only administrators (or users granted trash-management permission) can permanently delete documents.
                    </div>
                )}
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Dataset Name</th>
                                <th>Owner</th>
                                <th>CIA Score</th>
                                <th>File Attachment</th>
                                <th>File Size</th>
                                <th>Deleted By</th>
                                <th>Deleted At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-state">
                                        <div style={{ padding: "30px 0" }}>
                                            <div style={{ marginBottom: "10px", color: "#34d399" }}><Recycle size={40} /></div>
                                            <p>Trash is empty — no deleted documents!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                list.map((item: any) => {
                                    const globalScore = item.niveauCIA?.niveauGlobal;
                                    const cls = globalScore <= 2 ? "badge-normal" : globalScore <= 4 ? "badge-sensitive" : "badge-critical";
                                    return (
                                        <tr key={item._id}>
                                            <td><strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: 8 }}><Trash2 size={16} /> {item.titre}</strong></td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {item.proprietaire ? String(item.proprietaire).substring(0, 8) + "..." : "Admin"}
                                            </td>
                                            <td>
                                                {globalScore ? (
                                                    <span className={`badge ${cls}`}>{globalScore}/5</span>
                                                ) : "—"}
                                            </td>
                                            <td style={{ fontSize: "0.85rem" }}>
                                                {item.pieceJointe ? (
                                                    <span style={{ color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: 6 }}><Paperclip size={14} /> {item.pieceJointe}</span>
                                                ) : (
                                                    <span style={{ color: "var(--text-disabled)" }}>None</span>
                                                )}
                                            </td>
                                            <td>{formatSize(item.tailleAttachement)}</td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {item.deletedBy ? String(item.deletedBy).substring(0, 8) + "..." : "—"}
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : "—"}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleRestore(item.originalDataId)}
                                                    >
                                                        <Recycle size={14} /> Restore
                                                    </button>
                                                    {canManageAllTrash && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handlePermanentDelete(item._id)}
                                                        >
                                                            <XCircle size={14} /> Delete Forever
                                                        </button>
                                                    )}
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
        </div>
    );
};