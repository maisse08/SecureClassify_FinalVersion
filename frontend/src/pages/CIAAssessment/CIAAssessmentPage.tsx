import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { dataService } from "../../services/data.service";
import { IData, CIA_LEVEL_DESCRIPTIONS } from "../../types/data";
import { ShieldAlert, Loader2, AlertCircle, Save, Calculator } from "lucide-react";

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

// Levels 1-5, each with a fixed business-meaning description.
const CIA_LEVELS = [1, 2, 3, 4, 5];

export const CIAAssessmentPage = () => {
    const { isAdmin, user } = useAuth();
    const { addToast } = useToast();

    // CIA evaluation is only ever done on a user's own data — a document
    // shared with them (at any permission level) is excluded here, even
    // though they may see/edit it elsewhere. Admins and users delegated
    // "manage other users' data" legitimately assess everyone's data.
    const canManageAllData = isAdmin || (user?.permissions || []).includes("data.view.others");
    const isOwnItem = (item: any) => {
        const ownerId = item.proprietaire?._id || item.proprietaire;
        return !!ownerId && !!user?.id && ownerId.toString() === user.id.toString();
    };

    const [allData, setAllData] = useState<IData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Draft CIA values keyed by dataset id, so each row's form is independent.
    const [drafts, setDrafts] = useState<Record<string, { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [calculatingId, setCalculatingId] = useState<string | null>(null);

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

    const dataList = canManageAllData ? allData : allData.filter(isOwnItem);

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

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><ShieldAlert size={22} /> CIA Assessment</h3>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                            Assign ONE Confidentiality / Integrity / Availability rating to each of your own imported datasets
                            as a whole (not per file), then calculate its global classification as a separate step.
                            {!canManageAllData && " Data shared with you by other users is not shown here — CIA assessment stays with the owner."}
                        </p>
                    </div>
                </div>
            </div>

            {dataList.length === 0 && (
                <div className="card">
                    <div className="empty-state">No imported datasets found. Import data first from the Data Management page.</div>
                </div>
            )}

            {dataList.map((item) => {
                const draft = drafts[item._id] || { confidentialite: 1, integrite: 1, disponibilite: 1, methodeCalcul: "MAX" as const };
                const badge = getClassificationBadge(item.niveauCIA?.classification);
                const hasCIA = typeof item.niveauCIA?.confidentialite === "number";
                const canCalculate = hasCIA && item.statut !== "Classified";

                return (
                    <div className="card" key={item._id}>
                        <div className="card-header">
                            <div>
                                <h4>{item.titre}</h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                    {item.categorie?.name || "—"} · {item.fileCount ?? 0} file(s) · {formatSize(item.totalSize)} · Imported {item.importDate ? new Date(item.importDate).toLocaleDateString() : "-"}
                                </p>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <span className={`badge ${item.statut === "Classified" ? "badge-critical" : item.statut === "CIA Assigned" ? "badge-sensitive" : "badge-employee"}`}>{item.statut}</span>
                                <span className={`badge ${badge.cls}`}>{badge.label}</span>
                            </div>
                        </div>

                        <div className="cia-group" style={{ marginTop: "8px" }}>
                            <div className="cia-input">
                                <label>Confidentiality</label>
                                <select className="form-control" value={draft.confidentialite} onChange={e => updateDraft(item._id, { confidentialite: Number(e.target.value) })}>
                                    {CIA_LEVELS.map(l => <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>)}
                                </select>
                            </div>
                            <div className="cia-input">
                                <label>Integrity</label>
                                <select className="form-control" value={draft.integrite} onChange={e => updateDraft(item._id, { integrite: Number(e.target.value) })}>
                                    {CIA_LEVELS.map(l => <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>)}
                                </select>
                            </div>
                            <div className="cia-input">
                                <label>Availability</label>
                                <select className="form-control" value={draft.disponibilite} onChange={e => updateDraft(item._id, { disponibilite: Number(e.target.value) })}>
                                    {CIA_LEVELS.map(l => <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "12px", maxWidth: "320px" }}>
                            <label>Calculation Method (for global classification)</label>
                            <select className="form-control" value={draft.methodeCalcul} onChange={e => updateDraft(item._id, { methodeCalcul: e.target.value as "MAX" | "MOY" })}>
                                <option value="MAX">MAX (Highest Level)</option>
                                <option value="MOY">MOY (Average Level)</option>
                            </select>
                        </div>

                        <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "14px" }}>
                            <button type="button" className="btn btn-primary" disabled={savingId === item._id} onClick={() => handleSaveCIA(item)}>
                                <Save size={16} /> {savingId === item._id ? "Saving..." : "Save CIA Assessment"}
                            </button>
                            <button type="button" className="btn btn-info" disabled={!canCalculate || calculatingId === item._id} onClick={() => handleCalculate(item)} title={!hasCIA ? "Assign and save CIA first" : undefined}>
                                <Calculator size={16} /> {calculatingId === item._id ? "Calculating..." : "Calculate Global Classification"}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
