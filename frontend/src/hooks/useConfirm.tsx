import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Renders the confirm button and icon in the danger (red) style. */
    danger?: boolean;
}

interface ConfirmContextType {
    /** Shows a styled confirmation modal and resolves to true/false based on the user's choice. */
    confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
    confirm: async () => false,
});

interface PendingConfirm extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback((options: ConfirmOptions | string) => {
        const normalized: ConfirmOptions = typeof options === "string" ? { message: options } : options;
        return new Promise<boolean>((resolve) => {
            setPending({ ...normalized, resolve });
        });
    }, []);

    const handleClose = (result: boolean) => {
        pending?.resolve(result);
        setPending(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {pending && (
                <div className="modal-overlay" onClick={() => handleClose(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <AlertTriangle size={22} style={{ color: pending.danger ? "#ef4444" : "var(--primary)" }} />
                            {pending.title || "Confirm Action"}
                        </h3>
                        <p style={{ color: "var(--text-tertiary)", margin: "16px 0", lineHeight: 1.6 }}>
                            {pending.message}
                        </p>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => handleClose(false)}>
                                {pending.cancelLabel || "Cancel"}
                            </button>
                            <button
                                className={`btn ${pending.danger ? "btn-danger" : "btn-primary"}`}
                                onClick={() => handleClose(true)}
                            >
                                {pending.confirmLabel || "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => useContext(ConfirmContext);
