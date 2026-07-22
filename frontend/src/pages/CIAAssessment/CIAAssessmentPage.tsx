import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { dataService } from "../../services/data.service";
import { IData, CIA_LEVEL_DESCRIPTIONS } from "../../types/data";
import { ShieldAlert, Loader2, AlertCircle, Save, Calculator, Eye, FileText, ClipboardCheck, CheckCircle } from "lucide-react";
import { CIAModal } from "../../components/CIAModal/CIAModal";

const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getClassificationBadge = (classification?: string) => {
    if (!classification) return { label: "Not calculated", cls: "badge-normal" };
    const clsMap: Record<string, string> = {
        "Public": "badge-normal",
        "Internal": "badge-employee",
        "Confidential": "badge-sensitive",
        "Highly Confidential": "badge-critical",
    };
    return { label: classification, cls: clsMap[classification] || "badge-normal" };
};

const getProtectionBadge = (protection?: string) => {
    if (!protection) return { label: "Not set", cls: "badge-normal" };
    const clsMap: Record<string, string> = {
        "Basic protection": "badge-normal",
        "Standard protection": "badge-employee",
        "Enhanced protection": "badge-sensitive",
        "Maximum protection": "badge-critical",
    };
    return { label: protection, cls: clsMap[protection] || "badge-normal" };
};

// Levels 1-5, each with a fixed business-meaning description.
const CIA_LEVELS = [1, 2, 3, 4, 5];

type TabType = "imported" | "ciaAssigned" | "classified";

export const CIAAssessmentPage = () => {
    const { isAdmin, user } = useAuth();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();

    // CIA evaluation is done on a user's own data, or on data shared with
    // them at the "Full Access" level. Admins and users delegated
    // "manage other users' data" legitimately assess everyone's data.
    // View / Read & Write collaborators cannot assess or classify someone
    // else's data — that stays with the owner or a Full Access delegate.
    const canManageAllData = isAdmin || (user?.permissions || []).includes("data.view.others");
    const isOwnItem = (item: any) => {
        const ownerId = item.proprietaire?._id || item.proprietaire;
        return !!ownerId && !!user?.id && ownerId.toString() === user.id.toString();
    };
    const canManageItem = (item: any) => {
        if (canManageAllData) return true;
        if (isOwnItem(item)) return true;
        return item.userPermission === "Full Access";
    };

    const [allData, setAllData] = useState<IData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Read tab from query parameter, default to "imported"
    const tabParam = searchParams.get("tab") as TabType | null;
    const [activeTab, setActiveTab] = useState<TabType>(tabParam && ["imported", "ciaAssigned", "classified"].includes(tabParam) ? tabParam : "imported");

    // Draft CIA values keyed by dataset id, so each row's form is independent.
    const [drafts, setDrafts] = useState<Record<string, { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [calculatingId, setCalculatingId] = useState<string | null>(null);

    // CIA Modal state
    const [isCIAModalOpen, setIsCIAModalOpen] = useState(false);
    const [selectedItemForCIA, setSelectedItemForCIA] = useState<IData | null>(null);
    const [ciaModalMode, setCiaModalMode] = useState<"assign" | "modify">("assign");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await dataService.getAll();
            const raw: IData[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setAllData(raw);

            // Seed drafts from any existing CIA values (or sensible defaults).
            setDrafts((prev) => {
                const next = { ...prev };
                raw.forEach((item) => {
                    if (!next[item._id]) {
                        next[item._id] = {
                            confidentialite: item.niveauCIA?.confidentialite || 1,
                            integrite: item.niveauCIA?.integrite || 1,
                            disponibilite: item.niveauCIA?.disponibilite || 1,
                            methodeCalcul: item.niveauCIA?.methodeCalcul || "MAX",
                        };
                    }
                });
                return next;
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load datasets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Sync tab with query parameter changes
    useEffect(() => {
        if (tabParam && ["imported", "ciaAssigned", "classified"].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const dataList = allData.filter(canManageItem);

    // Filter datasets into three categories based on their current state
    const importedData = dataList.filter(item => {
        const hasCIA = typeof item.niveauCIA?.confidentialite === "number";
        const hasClassification = typeof item.niveauCIA?.classification === "string";
        return item.statut === "Imported" && !hasCIA && !hasClassification;
    });

    const ciaAssignedData = dataList.filter(item => {
        const hasCIA = typeof item.niveauCIA?.confidentialite === "number";
        const hasClassification = typeof item.niveauCIA?.classification === "string";
        return hasCIA && !hasClassification;
    });

    const classifiedData = dataList.filter(item => {
        const hasClassification = typeof item.niveauCIA?.classification === "string";
        return hasClassification;
    });

    const updateDraft = (id: string, patch: Partial<{ confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }>) => {
        setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const handleSaveCIA = async (item: IData) => {
        const draft = drafts[item._id];
        if (!draft) return;
        setSavingId(item._id);
        try {
            await dataService.assignCIA(item._id, draft);
            addToast("CIA assessment saved successfully.", "success");
            fetchData();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to save CIA assessment", "error");
        } finally {
            setSavingId(null);
        }
    };

    const handleCIAModalSave = async (id: string, niveauCIA: { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }) => {
        setSavingId(id);
        try {
            await dataService.assignCIA(id, niveauCIA);
            addToast(
                ciaModalMode === "assign"
                    ? "CIA assessment saved successfully."
                    : "CIA assessment updated successfully. Please recalculate the global classification.",
                "success"
            );
            setIsCIAModalOpen(false);
            setSelectedItemForCIA(null);
            fetchData();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to save CIA assessment", "error");
        } finally {
            setSavingId(null);
        }
    };

    const openCIAModal = (item: IData, mode: "assign" | "modify") => {
        setSelectedItemForCIA(item);
        setCiaModalMode(mode);
        setIsCIAModalOpen(true);
    };

    const closeCIAModal = () => {
        setIsCIAModalOpen(false);
        setSelectedItemForCIA(null);
    };

    const handleCalculate = async (item: IData) => {
        setCalculatingId(item._id);
        try {
            await dataService.calculateClassification(item._id);
            addToast("Global classification calculated successfully.", "success");
            fetchData();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to calculate classification", "error");
        } finally {
            setCalculatingId(null);
        }
    };

    if (loading) return <div className="loading"><Loader2 className="spin" size={22} /> Loading datasets...</div>;
    if (error) return <div className="alert alert-danger"><AlertCircle size={18} /> {error}</div>;

    const renderImportedTab = () => (
        <div className="datasets-grid">
            {importedData.length === 0 ? (
                <div className="empty-state-card">
                    <FileText size={48} />
                    <p>No imported datasets awaiting CIA assessment.</p>
                </div>
            ) : (
                importedData.map((item) => (
                    <div className="card dataset-card" key={item._id}>
                        <div className="card-header">
                            <div>
                                <h4>{item.titre}</h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                    {item.categorie?.name || "—"} · {item.fileCount ?? 0} file(s) · {formatSize(item.totalSize)} · Imported {item.importDate ? new Date(item.importDate).toLocaleDateString() : "-"}
                                </p>
                            </div>
                            <span className={`badge badge-employee`}>{item.statut}</span>
                        </div>

                        <div className="cia-group" style={{ marginTop: "12px" }}>
                            <div className="cia-input">
                                <label>Confidentiality</label>
                                <select className="form-control" value={drafts[item._id]?.confidentialite || 1} onChange={e => updateDraft(item._id, { confidentialite: Number(e.target.value) })}>
                                    {CIA_LEVELS.map(l => <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>)}
                                </select>
                            </div>
                            <div className="cia-input">
                                <label>Integrity</label>
                                <select className="form-control" value={drafts[item._id]?.integrite || 1} onChange={e => updateDraft(item._id, { integrite: Number(e.target.value) })}>
                                    {CIA_LEVELS.map(l => <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>)}
                                </select>
                            </div>
                            <div className="cia-input">
                                <label>Availability</label>
                                <select className="form-control" value={drafts[item._id]?.disponibilite || 1} onChange={e => updateDraft(item._id, { disponibilite: Number(e.target.value) })}>
                                    {CIA_LEVELS.map(l => <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "12px", maxWidth: "320px" }}>
                            <label>Calculation Method (for global classification)</label>
                            <select className="form-control" value={drafts[item._id]?.methodeCalcul || "MAX"} onChange={e => updateDraft(item._id, { methodeCalcul: e.target.value as "MAX" | "MOY" })}>
                                <option value="MAX">MAX (Highest Level)</option>
                                <option value="MOY">MOY (Average Level)</option>
                            </select>
                        </div>

                        <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "14px" }}>
                            <button type="button" className="btn btn-primary" disabled={savingId === item._id} onClick={() => handleSaveCIA(item)}>
                                <Save size={16} /> {savingId === item._id ? "Saving..." : "Assign CIA"}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderCiaAssignedTab = () => (
        <div className="datasets-grid">
            {ciaAssignedData.length === 0 ? (
                <div className="empty-state-card">
                    <ClipboardCheck size={48} />
                    <p>No datasets with CIA assigned awaiting classification calculation.</p>
                </div>
            ) : (
                ciaAssignedData.map((item) => {
                    const draft = drafts[item._id] || { confidentialite: 1, integrite: 1, disponibilite: 1, methodeCalcul: "MAX" as const };
                    const badge = getClassificationBadge(item.niveauCIA?.classification);

                    return (
                        <div className="card dataset-card" key={item._id}>
                            <div className="card-header">
                                <div>
                                    <h4>{item.titre}</h4>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                        {item.categorie?.name || "—"} · {item.fileCount ?? 0} file(s) · {formatSize(item.totalSize)} · Imported {item.importDate ? new Date(item.importDate).toLocaleDateString() : "-"}
                                    </p>
                                </div>
                                <span className={`badge badge-sensitive`}>{item.statut}</span>
                            </div>

                            <div className="cia-display" style={{ marginTop: "12px" }}>
                                <div className="cia-value">
                                    <span className="cia-label">Confidentiality:</span>
                                    <span className="cia-level">{item.niveauCIA?.confidentialite || "-"} — {CIA_LEVEL_DESCRIPTIONS[item.niveauCIA?.confidentialite || 1]}</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Integrity:</span>
                                    <span className="cia-level">{item.niveauCIA?.integrite || "-"} — {CIA_LEVEL_DESCRIPTIONS[item.niveauCIA?.integrite || 1]}</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Availability:</span>
                                    <span className="cia-level">{item.niveauCIA?.disponibilite || "-"} — {CIA_LEVEL_DESCRIPTIONS[item.niveauCIA?.disponibilite || 1]}</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Method:</span>
                                    <span className="cia-level">{item.niveauCIA?.methodeCalcul === "MOY" ? "Average (MOY)" : "MAX (Highest Level)"}</span>
                                </div>
                            </div>

                            <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "14px" }}>
                                <button type="button" className="btn btn-secondary" disabled={savingId === item._id} onClick={() => openCIAModal(item, "modify")}>
                                    <Save size={16} /> {savingId === item._id ? "Saving..." : "Modify CIA"}
                                </button>
                                <button type="button" className="btn btn-info" disabled={calculatingId === item._id} onClick={() => handleCalculate(item)}>
                                    <Calculator size={16} /> {calculatingId === item._id ? "Calculating..." : "Calculate Classification"}
                                </button>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );

    const renderClassifiedTab = () => (
        <div className="datasets-grid">
            {classifiedData.length === 0 ? (
                <div className="empty-state-card">
                    <CheckCircle size={48} />
                    <p>No classified datasets yet.</p>
                </div>
            ) : (
                classifiedData.map((item) => {
                    const badge = getClassificationBadge(item.niveauCIA?.classification);
                    const protectionBadge = getProtectionBadge(item.niveauCIA?.protectionRequired);

                    return (
                        <div className="card dataset-card" key={item._id}>
                            <div className="card-header">
                                <div>
                                    <h4>{item.titre}</h4>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                        {item.categorie?.name || "—"} · {item.fileCount ?? 0} file(s) · {formatSize(item.totalSize)} · Imported {item.importDate ? new Date(item.importDate).toLocaleDateString() : "-"}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <span className={`badge badge-critical`}>{item.statut}</span>
                                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                                    <span className={`badge ${protectionBadge.cls}`}>{protectionBadge.label}</span>
                                </div>
                            </div>

                            <div className="cia-display" style={{ marginTop: "12px" }}>
                                <div className="cia-value">
                                    <span className="cia-label">Confidentiality:</span>
                                    <span className="cia-level">{item.niveauCIA?.confidentialite || "-"} — {CIA_LEVEL_DESCRIPTIONS[item.niveauCIA?.confidentialite || 1]}</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Integrity:</span>
                                    <span className="cia-level">{item.niveauCIA?.integrite || "-"} — {CIA_LEVEL_DESCRIPTIONS[item.niveauCIA?.integrite || 1]}</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Availability:</span>
                                    <span className="cia-level">{item.niveauCIA?.disponibilite || "-"} — {CIA_LEVEL_DESCRIPTIONS[item.niveauCIA?.disponibilite || 1]}</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Global Level:</span>
                                    <span className="cia-level">{item.niveauCIA?.niveauGlobal || "-"}/5</span>
                                </div>
                                <div className="cia-value">
                                    <span className="cia-label">Method:</span>
                                    <span className="cia-level">{item.niveauCIA?.methodeCalcul === "MOY" ? "Average (MOY)" : "MAX (Highest Level)"}</span>
                                </div>
                            </div>

                            <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "14px" }}>
                                <button type="button" className="btn btn-secondary" disabled={savingId === item._id} onClick={() => openCIAModal(item, "modify")}>
                                    <Save size={16} /> {savingId === item._id ? "Saving..." : "Modify CIA"}
                                </button>
                                <button type="button" className="btn btn-info" disabled>
                                    <Eye size={16} /> View Details
                                </button>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><ShieldAlert size={22} /> CIA Assessment</h3>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                            Assign ONE Confidentiality / Integrity / Availability rating to each of your own imported datasets
                            as a whole (not per file), then calculate its global classification as a separate step.
                            {!canManageAllData && " Datasets shared with you at 'Full Access' are also shown here so you can manage them. Data shared at 'View' or 'Edit' level is not shown — CIA assessment stays with the owner."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === "imported" ? "active" : ""}`}
                        onClick={() => setActiveTab("imported")}
                    >
                        <FileText size={18} />
                        Imported ({importedData.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === "ciaAssigned" ? "active" : ""}`}
                        onClick={() => setActiveTab("ciaAssigned")}
                    >
                        <ClipboardCheck size={18} />
                        CIA Assigned ({ciaAssignedData.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === "classified" ? "active" : ""}`}
                        onClick={() => setActiveTab("classified")}
                    >
                        <CheckCircle size={18} />
                        Classified ({classifiedData.length})
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === "imported" && renderImportedTab()}
                {activeTab === "ciaAssigned" && renderCiaAssignedTab()}
                {activeTab === "classified" && renderClassifiedTab()}
            </div>

            {/* CIA Modal */}
            <CIAModal
                isOpen={isCIAModalOpen}
                onClose={closeCIAModal}
                onSave={handleCIAModalSave}
                item={selectedItemForCIA}
                mode={ciaModalMode}
                savingId={savingId}
            />
        </div>
    );
};
