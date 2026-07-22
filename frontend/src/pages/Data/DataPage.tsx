import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { dataService } from "../../services/data.service";
import { shareService } from "../../services/share.service";
import { categoryService } from "../../services/category.service";
import { userService } from "../../services/user.service";
import { IData } from "../../types/data";
import { Database, Upload, Eye, Share2, Trash2, Download, X, FileText, Loader2, AlertCircle, Send, FolderInput, Files, Edit3, Image, FileType2, FileSpreadsheet, File, Users, FileCode } from "lucide-react";
import { FilePreviewModal } from "../../components/FilePreviewModal/FilePreviewModal";

const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const emptyImportForm = {
    titre: "",
    description: "",
    categorie: "",
};

const emptyShareForm = {
    receiverEmail: "",
    permission: "Read",
    expirationDate: "",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    "Imported": { label: "Imported", cls: "badge-employee" },
    "CIA Assigned": { label: "CIA Assigned", cls: "badge-sensitive" },
    "Classified": { label: "Classified", cls: "badge-critical" },
};

// Helper to get file icon based on extension
const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    const pdfExts = ["pdf"];
    const textExts = ["txt", "json", "csv", "xml", "md", "log"];
    const officeExts = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
    
    if (imageExts.includes(ext)) return { icon: Image, color: "#10b981" };
    if (pdfExts.includes(ext)) return { icon: FileType2, color: "#ef4444" };
    if (textExts.includes(ext)) return { icon: FileCode, color: "#3b82f6" };
    if (officeExts.includes(ext)) return { icon: FileSpreadsheet, color: "#f59e0b" };
    return { icon: File, color: "#6b7280" };
};


export const DataPage = () => {
    const { isAdmin, user } = useAuth();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();

    // A user can manage everyone's data if they're an admin, or if an admin
    // delegated them the "data.view.others" permission.
    const canManageAllData = isAdmin || (user?.permissions || []).includes("data.view.others");

    // Data loading: admin sees all, employees see only their own
    const [dataList, setDataList] = useState<IData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [catList, setCatList] = useState<any[]>([]);
    const [userList, setUserList] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // Read filters from query parameters
    const filterCategory = searchParams.get("category");
    const filterDepartment = searchParams.get("department");
    const filterClassification = searchParams.get("classification");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // All users now use getAll() which returns owned + shared data
            const [dashRes, catRes, usersRes] = await Promise.all([
                dataService.getAll(),
                categoryService.getAll().catch(() => ({ data: [] })),
                canManageAllData ? userService.getAll().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            ]);
            const raw = Array.isArray(dashRes?.data) ? dashRes.data : Array.isArray(dashRes) ? dashRes : [];
            setDataList(raw);
            setCatList(Array.isArray(catRes?.data) ? catRes.data : Array.isArray(catRes) ? catRes : []);
            setUserList(Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [canManageAllData]);

    const isOwnItem = (item: any) => {
        const ownerId = item.proprietaire?._id || item.proprietaire;
        return !!ownerId && !!user?.id && ownerId.toString() === user.id.toString();
    };

    // A new user can, by default, fully manage (create/view/edit/share/delete)
    // their own data. Everything else the backend surfaced — either because an
    // admin granted "manage other users' data", or because a document was
    // individually shared with them — is shown separately so it's always
    // clear which data is genuinely theirs versus data they were granted
    // access to.
    const matchesSearch = (item: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.titre?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item._id?.toLowerCase().includes(query)
        );
    };

    const matchesCategory = (item: any) => {
        if (!filterCategory) return true;
        const itemCatId = item.categorie?._id || item.categorie;
        return itemCatId && itemCatId.toString() === filterCategory;
    };

    const matchesDepartment = (item: any) => {
        if (!filterDepartment) return true;
        const ownerId = item.proprietaire?._id || item.proprietaire;
        if (!ownerId) return false;
        const owner = userList.find((u: any) => (u._id || u.id)?.toString() === ownerId.toString());
        return owner && (owner.department?._id || owner.department)?.toString() === filterDepartment;
    };

    const matchesClassification = (item: any) => {
        if (!filterClassification) return true;
        const globalCIA = item.niveauCIA?.niveauGlobal;
        if (!globalCIA) return false;
        const level = Number(globalCIA);
        if (filterClassification === "public") return level <= 2;
        if (filterClassification === "internal") return level === 3 || level === 4;
        if (filterClassification === "confidential") return level === 5;
        if (filterClassification === "secret") return level === 5;
        if (filterClassification === "critical") return level === 5;
        return true;
    };

    // For admins: allow filtering by specific user
    const filteredData = selectedUserId
        ? dataList.filter((item: any) => {
            const ownerId = item.proprietaire?._id || item.proprietaire;
            return ownerId && ownerId.toString() === selectedUserId;
        })
        : dataList;

    const myData = filteredData.filter((item: any) => isOwnItem(item) && matchesSearch(item) && matchesCategory(item) && matchesDepartment(item) && matchesClassification(item));
    const otherData = filteredData.filter((item: any) => !isOwnItem(item) && matchesSearch(item) && matchesCategory(item) && matchesDepartment(item) && matchesClassification(item));

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build active filter badge descriptions
    const activeFilterBadges: { label: string; onClear: () => void }[] = [];
    if (filterCategory) {
        const cat = catList.find((c: any) => (c._id || c.id)?.toString() === filterCategory);
        activeFilterBadges.push({
            label: `Category: ${cat?.name || filterCategory}`,
            onClear: () => { /* handled by removing param via navigation */ },
        });
    }
    if (filterDepartment) {
        const dept = userList.find((u: any) => (u.department?._id || u.department)?.toString() === filterDepartment)?.department;
        const deptName = typeof dept === "object" ? dept?.name : filterDepartment;
        activeFilterBadges.push({
            label: `Department: ${deptName || filterDepartment}`,
            onClear: () => {},
        });
    }
    if (filterClassification) {
        const labels: Record<string, string> = {
            public: "Public (CIA ≤ 2)",
            internal: "Internal (CIA 3-4)",
            confidential: "Confidential (CIA = 5)",
            secret: "Secret (CIA = 5)",
            critical: "Critical (CIA = 5)",
        };
        activeFilterBadges.push({
            label: `Classification: ${labels[filterClassification] || filterClassification}`,
            onClear: () => {},
        });
    }

    const [showModal, setShowModal] = useState(false);
    const [importForm, setImportForm] = useState({ ...emptyImportForm });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const filesInputRef = useRef<HTMLInputElement>(null);

    // Modal state for viewing details & sharing
    const [viewingItem, setViewingItem] = useState<IData | null>(null);
    const [sharingItem, setSharingItem] = useState<IData | null>(null);
    const [shareForm, setShareForm] = useState({ ...emptyShareForm });
    const [shareSaving, setShareSaving] = useState(false);
    const [shareResult, setShareResult] = useState("");

     // File preview modal state
     const [previewFile, setPreviewFile] = useState<{ dataId: string; file: any } | null>(null);

     // All Imported Files modal state
     const [showAllFilesModal, setShowAllFilesModal] = useState(false);
     const [allFilesSearchQuery, setAllFilesSearchQuery] = useState("");

    const handleFilesChosen = (fileList: FileList | null) => {
        if (!fileList) return;
        setSelectedFiles(Array.from(fileList));
    };

    const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<IData | null>(null);
    const [editForm, setEditForm] = useState({ titre: "", description: "", categorie: "" });
    const [editSaving, setEditSaving] = useState(false);

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            addToast("Select a folder or at least one file to import.", "warning");
            return;
        }
        setSaving(true);
        try {
            await dataService.importData(importForm, selectedFiles);
            addToast("Dataset imported successfully!", "success");
            setShowModal(false);
            setImportForm({ ...emptyImportForm });
            setSelectedFiles([]);
            fetchData();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to import dataset", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await dataService.delete(id.toString());
            addToast("Dataset moved to trash.", "success");
            setConfirmDeleteId(null);
            fetchData();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to delete", "error");
        }
    };

    const openEditModal = (item: IData) => {
        setEditingItem(item);
        setEditForm({
            titre: item.titre,
            description: item.description || "",
            categorie: item.categorie?._id || "",
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setEditSaving(true);
        try {
            await dataService.update(editingItem._id, editForm);
            addToast("Dataset updated successfully!", "success");
            setEditingItem(null);
            fetchData();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to update dataset", "error");
        } finally {
            setEditSaving(false);
        }
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sharingItem) return;
        setShareSaving(true);
        setShareResult("");
        try {
            await shareService.create({
                documentId: sharingItem._id,
                receiverEmail: shareForm.receiverEmail,
                permission: shareForm.permission,
                expirationDate: shareForm.expirationDate,
            });
            addToast(`Shared successfully with ${shareForm.receiverEmail}!`, "success");
            setSharingItem(null);
            setShareForm({ ...emptyShareForm });
            setShareResult("");
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to share document", "error");
        } finally {
            setShareSaving(false);
        }
    };

    if (loading) return <div className="loading"><Loader2 className="spin" size={22} /> Loading datasets...</div>;
    if (error) return <div className="alert alert-danger"><AlertCircle size={18} /> {error}</div>;

    const renderDataTable = (list: any[], emptyMessage: string) => (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Dataset Name</th>
                        <th>Category</th>
                        <th>Owner</th>
                        <th>Shared By</th>
                        <th>Files</th>
                        <th>Total Size</th>
                        <th>Status</th>
                        <th>Imported</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {list.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="empty-state">
                                {searchQuery ? "No data matches your search." : emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        list.map((item: any) => {
                            const status = STATUS_BADGE[item.statut] || { label: item.statut, cls: "badge-normal" };
                            // Sharing is only allowed for the actual owner (or someone
                            // managing all data via a delegated admin permission).
                            // Data that arrived through a share can never be re-shared,
                            // no matter how permissive the granted access level is.
                            const canShare = isOwnItem(item) || canManageAllData;
                            const canModify = isOwnItem(item) || canManageAllData || item.userPermission === "Read & Write" || item.userPermission === "Full Access";
                            // Delete is reserved for the owner, admin, or a "Full Access" share —
                            // a "Read & Write" collaborator can edit but not delete.
                            const canDelete = isOwnItem(item) || canManageAllData || item.userPermission === "Full Access";

                            return (
                                <tr key={item._id}>
                                    <td><strong style={{ color: "var(--text-main)" }}>{item.titre}</strong></td>
                                    <td>{item.categorie?.name || "—"}</td>
                                    <td style={{ color: "var(--text-tertiary)" }}>
                                        {item.proprietaire ? `${item.proprietaire.firstName} ${item.proprietaire.lastName}` : "Admin"}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                        {item.sharedBy ? (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                <Share2 size={12} />
                                                {item.sharedBy.firstName} {item.sharedBy.lastName}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td>{item.fileCount ?? 0}</td>
                                    <td>{formatSize(item.totalSize)}</td>
                                    <td>
                                        <span className={`badge ${status.cls}`}>{status.label}</span>
                                    </td>
                                    <td style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                                        {item.importDate ? new Date(item.importDate).toLocaleDateString() : "-"}
                                    </td>
                                    <td>
                                        <div className="btn-group">
                                            {(item.userPermission === "Read" || item.userPermission === "Read & Write" || item.userPermission === "Full Access") && (
                                                <button type="button" className="btn btn-sm" style={{ background: "var(--surface-soft)" }} onClick={() => setViewingItem(item)}><Eye size={14} /> View</button>
                                            )}
                                            {canModify && (
                                                <button type="button" className="btn btn-sm" style={{ background: "var(--primary-soft)", color: "var(--primary)" }} onClick={() => openEditModal(item)}><Edit3 size={14} /> Modify</button>
                                            )}
                                            {canShare && (
                                                <button type="button" className="btn btn-warning btn-sm" onClick={() => { setSharingItem(item); setShareForm({ ...emptyShareForm }); setShareResult(""); }}><Share2 size={14} /> Share</button>
                                            )}
                                            {canDelete && (
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteId(item._id)}><Trash2 size={14} /> Delete</button>
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
    );

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3><Database size={22} /> Data Management</h3>
                    <button className="btn btn-primary" onClick={() => { setImportForm({ ...emptyImportForm }); setSelectedFiles([]); setShowModal(true); }}>
                        <Upload size={18} /> Import Data
                    </button>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
                    <div className="form-group" style={{ flex: 1, minWidth: "240px", marginBottom: 0 }}>
                        <input
                            className="form-control"
                            placeholder="Search by title, description, or ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {canManageAllData && (
                        <div className="form-group" style={{ minWidth: "260px", marginBottom: 0 }}>
                            <select
                                className="form-control"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                            >
                                <option value="">All Users</option>
                                {userList.map((u: any) => (
                                    <option key={u._id || u.id} value={u._id || u.id}>
                                        {u.firstName} {u.lastName} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {activeFilterBadges.length > 0 && (
                    <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontWeight: 600 }}>Active Filters:</span>
                        {activeFilterBadges.map((badge, idx) => (
                            <span key={idx} style={{ padding: "4px 10px", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                {badge.label}
                            </span>
                        ))}
                    </div>
                )}
                {canManageAllData && selectedUserId && (
                    <div style={{ marginTop: "10px", padding: "8px 12px", background: "var(--primary-soft)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Users size={14} />
                        Filtering data for: <strong>{userList.find(u => (u._id || u.id) === selectedUserId)?.firstName} {userList.find(u => (u._id || u.id) === selectedUserId)?.lastName}</strong>
                        <button
                            onClick={() => setSelectedUserId("")}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "inline-flex" }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* My Data — every user can fully manage the data they imported:
                view, share, and delete it. */}
            {!selectedUserId && (
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h4><Database size={18} /> My Datasets</h4>
                            <p>Datasets you imported and fully control. CIA is assigned separately on the CIA Assessment page.</p>
                        </div>
                    </div>
                    {renderDataTable(myData, "You haven't imported any data yet. Click 'Import Data' to begin.")}
                </div>
            )}

            {/* Second section is intentionally separate from "My Data" — it is
                either data an admin granted this user broad access to manage,
                or data individually shared with them by another user. */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h4><Share2 size={18} /> {canManageAllData ? (selectedUserId ? "User's Datasets" : "All Users' Data (Granted by Admin)") : "Shared With Me"}</h4>
                        <p>
                            {canManageAllData
                                ? selectedUserId
                                    ? "Datasets owned by the selected user."
                                    : "You've been granted permission to view and manage every user's data. Use the filter above to view a specific user's data."
                                : "Datasets other users have shared with you. Shared data can never be re-shared."}
                        </p>
                    </div>
                </div>
                {renderDataTable(otherData, canManageAllData ? (selectedUserId ? "This user has no datasets." : "No other users' data found.") : "No datasets have been shared with you yet.")}
            </div>

            {/* Import Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3><Upload size={22} /> Import Data</h3>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", marginTop: "-6px" }}>
                            Import a folder or multiple files. File count, total size, and file types are captured automatically.
                            CIA is not assigned here — that happens on the CIA Assessment page.
                        </p>
                        <form onSubmit={handleImportSubmit}>
                            <div className="form-group">
                                <label>Dataset Name</label>
                                <input className="form-control" value={importForm.titre} onChange={e => setImportForm({ ...importForm, titre: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <textarea className="form-control" value={importForm.description} onChange={e => setImportForm({ ...importForm, description: e.target.value })} rows={2} />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-control" value={importForm.categorie} onChange={e => setImportForm({ ...importForm, categorie: e.target.value })} required>
                                    <option value="">Select Category...</option>
                                    {catList.map((c: any) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ background: "var(--surface-inset)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "700", color: "var(--text-main)" }}>
                                    <FolderInput size={16} /> Files to Import
                                </label>
                                <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                                    <button type="button" className="btn" onClick={() => folderInputRef.current?.click()}>
                                        <FolderInput size={16} /> Choose Folder
                                    </button>
                                    <button type="button" className="btn" onClick={() => filesInputRef.current?.click()}>
                                        <Files size={16} /> Choose Files
                                    </button>
                                </div>
                                {/* Folder picker */}
                                <input
                                    ref={folderInputRef}
                                    type="file"
                                    style={{ display: "none" }}
                                    /* @ts-ignore - non-standard attribute for folder selection */
                                    webkitdirectory=""
                                    directory=""
                                    multiple
                                    onChange={e => handleFilesChosen(e.target.files)}
                                />
                                {/* Multi-file picker */}
                                <input
                                    ref={filesInputRef}
                                    type="file"
                                    style={{ display: "none" }}
                                    multiple
                                    onChange={e => handleFilesChosen(e.target.files)}
                                />
                                {selectedFiles.length > 0 ? (
                                    <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        <strong style={{ color: "var(--text-main)" }}>{selectedFiles.length}</strong> file(s) selected — total <strong style={{ color: "var(--text-main)" }}>{formatSize(totalSelectedSize)}</strong>
                                        <div style={{ maxHeight: "120px", overflowY: "auto", marginTop: "6px" }}>
                                            {selectedFiles.slice(0, 20).map((f, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                                    <span>{(f as any).webkitRelativePath || f.name}</span>
                                                    <span>{formatSize(f.size)}</span>
                                                </div>
                                            ))}
                                            {selectedFiles.length > 20 && <div>...and {selectedFiles.length - 20} more</div>}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "var(--text-disabled)" }}>No files selected. Please choose a folder or files to import.</div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Importing..." : "Import Dataset"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dataset Details Modal */}
            {viewingItem && (
                <div className="modal-overlay" onClick={() => setViewingItem(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
                        <h3><Eye size={22} /> Dataset Details</h3>
                        <hr />
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "15px 0" }}>
                            <div><span style={{ color: "var(--text-tertiary)" }}>Dataset ID:</span> <code>{viewingItem._id}</code></div>
                            <div><span style={{ color: "var(--text-tertiary)" }}>Name:</span> <strong style={{ color: "var(--text-main)" }}>{viewingItem.titre}</strong></div>
                            <div><span style={{ color: "var(--text-tertiary)" }}>Description:</span> <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{viewingItem.description || "-"}</p></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div><span style={{ color: "var(--text-tertiary)" }}>Category:</span><br /><strong style={{ color: "var(--text-main)" }}>{viewingItem.categorie?.name ? String(viewingItem.categorie.name) : "—"}</strong></div>
                                <div><span style={{ color: "var(--text-tertiary)" }}>Owner:</span><br /><strong style={{ color: "var(--text-main)" }}>{`${viewingItem.proprietaire.firstName} ${viewingItem.proprietaire.lastName}`}</strong></div>
                                {viewingItem.sharedBy && (
                                    <div><span style={{ color: "var(--text-tertiary)" }}>Shared By:</span><br /><strong style={{ color: "var(--text-main)" }}>{`${viewingItem.sharedBy.firstName} ${viewingItem.sharedBy.lastName}`}</strong></div>
                                )}
                                <div><span style={{ color: "var(--text-tertiary)" }}>Files:</span><br /><strong style={{ color: "var(--text-main)" }}>{viewingItem.fileCount ?? 0}</strong></div>
                                <div><span style={{ color: "var(--text-tertiary)" }}>Total Size:</span><br /><strong style={{ color: "var(--text-main)" }}>{formatSize(viewingItem.totalSize)}</strong></div>
                                <div><span style={{ color: "var(--text-tertiary)" }}>File Types:</span><br /><strong style={{ color: "var(--text-main)" }}>{(viewingItem.fileTypes || []).join(", ") || "—"}</strong></div>
                                <div><span style={{ color: "var(--text-tertiary)" }}>Import Date:</span><br /><strong style={{ color: "var(--text-main)" }}>{viewingItem.importDate ? new Date(viewingItem.importDate).toLocaleString() : "—"}</strong></div>
                            </div>
                            <div style={{ padding: "12px", background: "var(--surface-inset)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <span style={{ fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Security Classification Status</span>
                                <div style={{ marginBottom: "8px" }}>
                                    <span className={`badge ${(STATUS_BADGE[viewingItem.statut] || { cls: "badge-normal" }).cls}`}>{viewingItem.statut}</span>
                                </div>
                                {viewingItem.niveauCIA?.confidentialite ? (
                                    <>
                                        <div style={{ display: "flex", gap: "15px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            <div>Confidentiality: <strong>{viewingItem.niveauCIA?.confidentialite}/5</strong></div>
                                            <div>Integrity: <strong>{viewingItem.niveauCIA?.integrite}/5</strong></div>
                                            <div>Availability: <strong>{viewingItem.niveauCIA?.disponibilite}/5</strong></div>
                                        </div>
                                        <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            Calculation Method: <strong>{viewingItem.niveauCIA?.methodeCalcul}</strong> | Global CIA Score: <strong>{viewingItem.niveauCIA?.niveauGlobal ?? "Not calculated yet"}{viewingItem.niveauCIA?.niveauGlobal ? "/5" : ""}</strong>
                                        </div>
                                        {viewingItem.niveauCIA?.classification && (
                                            <div style={{ marginTop: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                Global Classification: <strong>{viewingItem.niveauCIA.classification}</strong>
                                            </div>
                                        )}
                                        {viewingItem.niveauCIA?.protectionRequired && (
                                            <div style={{ marginTop: "4px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                Protection Required: <strong>{viewingItem.niveauCIA.protectionRequired}</strong>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>CIA has not been assessed yet. Visit the CIA Assessment page to assign it.</div>
                                )}
                            </div>
                            {viewingItem.importedFiles && viewingItem.importedFiles.length > 0 && (
                                <div>
                                    <span style={{ color: "var(--text-tertiary)" }}>Imported Files:</span>
                                    <div style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                                        {viewingItem.importedFiles.slice(0, 5).map((f, i) => {
                                            const { icon: FileIcon, color } = getFileIcon(f.originalName);
                                            return (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between", padding: "4px 0" }}>
                                                    <button 
                                                        onClick={() => setPreviewFile({ dataId: viewingItem._id, file: f })}
                                                        style={{ 
                                                            display: "inline-flex", 
                                                            alignItems: "center", 
                                                            gap: 6, 
                                                            background: "none", 
                                                            border: "none", 
                                                            color: "var(--primary)", 
                                                            cursor: "pointer",
                                                            padding: 0,
                                                            fontSize: "0.85rem"
                                                        }}
                                                        title="Click to preview"
                                                    >
                                                        <FileIcon size={13} color={color} />
                                                        {f.originalName}
                                                    </button>
                                                    <span style={{ color: "var(--text-tertiary)" }}>{formatSize(f.size)}</span>
                                                </div>
                                            );
                                        })}
                                        {viewingItem.importedFiles.length > 5 && (
                                            <button 
                                                onClick={() => setShowAllFilesModal(true)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "var(--primary)",
                                                    cursor: "pointer",
                                                    padding: "4px 0",
                                                    fontSize: "0.85rem",
                                                    fontWeight: "600",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                            >
                                                + {viewingItem.importedFiles.length - 5} more files
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {viewingItem.pieceJointe && (
                                <div><span style={{ color: "var(--text-tertiary)" }}>Attachment:</span> <a href={`http://localhost:5000/uploads/${viewingItem.pieceJointe}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "underline" }}><Download size={15} /> {viewingItem.pieceJointe}</a></div>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                <div>Imported: {new Date(viewingItem.dateCreation).toLocaleString()}</div>
                                <div>Modified: {new Date(viewingItem.dateModification).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setViewingItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sharing Dataset Modal */}
            {sharingItem && (
                <div className="modal-overlay" onClick={() => { if (!shareSaving) setSharingItem(null); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                        <h3><Share2 size={22} /> Share: {sharingItem.titre}</h3>
                        {shareResult && (
                            <div className={`alert ${shareResult.startsWith("success") ? "alert-success" : "alert-danger"}`}>
                                {shareResult.replace(/^success:/, "")}
                            </div>
                        )}
                        <form onSubmit={handleShare}>
                            <div className="form-group" style={{ marginTop: "15px" }}>
                                <label>Collaborator Email</label>
                                <input type="email" className="form-control" placeholder="Enter user email..." value={shareForm.receiverEmail} onChange={e => setShareForm({ ...shareForm, receiverEmail: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Access Permission Level</label>
                                <select className="form-control" value={shareForm.permission} onChange={e => setShareForm({ ...shareForm, permission: e.target.value })}>
                                    <option value="Read">Read (View Only)</option>
                                    <option value="Read & Write">Read & Write (Collaborate)</option>
                                    <option value="Full Access">Full Access (Manage)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Expiration Date</label>
                                <input type="date" className="form-control" value={shareForm.expirationDate} onChange={e => setShareForm({ ...shareForm, expirationDate: e.target.value })} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setSharingItem(null)} disabled={shareSaving}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-success" disabled={shareSaving}>
                                    {shareSaving ? "Sharing..." : <><Send size={16} /> Share Dataset</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Dataset Modal */}
            {editingItem && (
                <div className="modal-overlay" onClick={() => setEditingItem(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <h3><Edit3 size={22} /> Modify Dataset</h3>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", marginTop: "-6px" }}>
                            Update dataset name, description, or category. File changes are not supported here.
                        </p>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>Dataset Name</label>
                                <input className="form-control" value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <textarea className="form-control" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-control" value={editForm.categorie} onChange={e => setEditForm({ ...editForm, categorie: e.target.value })} required>
                                    <option value="">Select Category...</option>
                                    {catList.map((c: any) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setEditingItem(null)} disabled={editSaving}><X size={16} /> Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                        <h3><Trash2 size={22} /> Confirm Delete</h3>
                        <p style={{ color: "var(--text-tertiary)", margin: "16px 0", lineHeight: 1.6 }}>
                            Move this dataset to trash? You can restore it later from the Trash page.
                        </p>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(confirmDeleteId)}>
                                <Trash2 size={16} /> Move to Trash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    dataId={previewFile.dataId}
                    file={previewFile.file}
                    onClose={() => { setPreviewFile(null); }}
                />
            )}

            {/* All Imported Files Modal */}
            {showAllFilesModal && viewingItem && (
                <div className="modal-overlay" onClick={() => { setShowAllFilesModal(false); setAllFilesSearchQuery(""); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0 }}><Files size={22} /> All Imported Files</h3>
                            <button className="btn btn-sm" onClick={() => { setShowAllFilesModal(false); setAllFilesSearchQuery(""); }}><X size={16} /></button>
                        </div>

                        {/* Search input */}
                        <div className="form-group" style={{ marginBottom: "16px" }}>
                            <input
                                className="form-control"
                                placeholder="Search files by name..."
                                value={allFilesSearchQuery}
                                onChange={e => setAllFilesSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Files list */}
                        <div style={{ flex: 1, overflowY: "auto", maxHeight: "500px" }}>
                            {(() => {
                                const filteredFiles = viewingItem.importedFiles?.filter((f: any) =>
                                    f.originalName.toLowerCase().includes(allFilesSearchQuery.toLowerCase())
                                ) || [];

                                if (filteredFiles.length === 0) {
                                    return (
                                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                                            <File size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                                            <div>{allFilesSearchQuery ? "No files match your search" : "No files imported"}</div>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                        {filteredFiles.map((f: any, i: number) => {
                                            const { icon: FileIcon, color } = getFileIcon(f.originalName);
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => setPreviewFile({ dataId: viewingItem._id, file: f })}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        padding: "10px 12px",
                                                        background: "var(--surface)",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        border: "1px solid rgba(255,255,255,0.06)",
                                                        transition: "background 0.15s ease"
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
                                                    title="Click to preview"
                                                >
                                                    <FileIcon size={20} color={color} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: "500", color: "var(--text-main)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {f.originalName}
                                                        </div>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                                                            {f.mimeType || "Unknown type"}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500", whiteSpace: "nowrap" }}>
                                                        {formatSize(f.size)}
                                                    </div>
                                                    <Eye size={16} color="var(--primary)" style={{ opacity: 0.7 }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer with count */}
                        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.85rem", color: "var(--text-tertiary)", textAlign: "center" }}>
                            {viewingItem.importedFiles?.length || 0} file(s) total
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
