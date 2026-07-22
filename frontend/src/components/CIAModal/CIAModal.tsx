import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { IData, CIA_LEVEL_DESCRIPTIONS } from "../../types/data";

interface CIAModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, niveauCIA: { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }) => Promise<void>;
    item: IData | null;
    mode: "assign" | "modify";
    savingId: string | null;
}

const CIA_LEVELS = [1, 2, 3, 4, 5];

export const CIAModal = ({ isOpen, onClose, onSave, item, mode, savingId }: CIAModalProps) => {
    const [confidentialite, setConfidentialite] = useState(1);
    const [integrite, setIntegrite] = useState(1);
    const [disponibilite, setDisponibilite] = useState(1);
    const [methodeCalcul, setMethodeCalcul] = useState<"MAX" | "MOY">("MAX");

    // Pre-fill form when item changes
    useEffect(() => {
        if (item?.niveauCIA) {
            setConfidentialite(item.niveauCIA.confidentialite || 1);
            setIntegrite(item.niveauCIA.integrite || 1);
            setDisponibilite(item.niveauCIA.disponibilite || 1);
            setMethodeCalcul(item.niveauCIA.methodeCalcul || "MAX");
        } else {
            setConfidentialite(1);
            setIntegrite(1);
            setDisponibilite(1);
            setMethodeCalcul("MAX");
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        await onSave(item._id, {
            confidentialite,
            integrite,
            disponibilite,
            methodeCalcul,
        });
    };

    if (!isOpen || !item) return null;

    const isSaving = savingId === item._id;
    const modalTitle = mode === "assign" ? "Assign CIA Assessment" : "Modify CIA Assessment";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: "600px",
                    width: "90%",
                }}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{modalTitle}</h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                            {item.titre}
                        </p>
                    </div>
                    <button
                        className="btn btn-sm"
                        onClick={onClose}
                        style={{ background: "var(--surface-inset)" }}
                        disabled={isSaving}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-tertiary)", marginBottom: "16px" }}>
                            {mode === "assign"
                                ? "Assign ONE Confidentiality / Integrity / Availability rating to this dataset as a whole."
                                : "Update the CIA assessment for this dataset. The global classification will be cleared and must be recalculated."}
                        </p>

                        <div className="cia-group" style={{ marginBottom: "20px" }}>
                            <div className="cia-input">
                                <label>Confidentiality</label>
                                <select
                                    className="form-control"
                                    value={confidentialite}
                                    onChange={e => setConfidentialite(Number(e.target.value))}
                                    disabled={isSaving}
                                >
                                    {CIA_LEVELS.map(l => (
                                        <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="cia-input">
                                <label>Integrity</label>
                                <select
                                    className="form-control"
                                    value={integrite}
                                    onChange={e => setIntegrite(Number(e.target.value))}
                                    disabled={isSaving}
                                >
                                    {CIA_LEVELS.map(l => (
                                        <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="cia-input">
                                <label>Availability</label>
                                <select
                                    className="form-control"
                                    value={disponibilite}
                                    onChange={e => setDisponibilite(Number(e.target.value))}
                                    disabled={isSaving}
                                >
                                    {CIA_LEVELS.map(l => (
                                        <option key={l} value={l}>{l} — {CIA_LEVEL_DESCRIPTIONS[l]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Calculation Method (for global classification)</label>
                            <select
                                className="form-control"
                                value={methodeCalcul}
                                onChange={e => setMethodeCalcul(e.target.value as "MAX" | "MOY")}
                                disabled={isSaving}
                            >
                                <option value="MAX">MAX (Highest Level)</option>
                                <option value="MOY">MOY (Average Level)</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="modal-actions" style={{ justifyContent: "flex-end", marginTop: "20px" }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> {mode === "assign" ? "Assign CIA" : "Update CIA"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};