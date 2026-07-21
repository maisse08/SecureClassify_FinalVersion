import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";
import { shareService } from "../../services/share.service";
import { Share2, Ban, RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface ISharedItem {
    _id: string;
    documentTitle: string;
    sender: string;
    senderEmail: string;
    receiver: string;
    receiverEmail: string;
    permission: "Read" | "Read & Write" | "Full Access";
    sharedDate: string;
    expirationDate: string;
    status: "Active" | "Expired" | "Revoked";
}

export const SharingPage = () => {
    const { isAdmin, user } = useAuth();
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const [shares, setShares] = useState<ISharedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchShares = async () => {
        setLoading(true);
        setError("");
        try {
            const res = isAdmin
                ? await shareService.getAll()
                : await shareService.getMyShares();
            // The API returns { success: true, data: ... }
            const data = res?.data || [];
            // For getMyShares, data is { sent, received } — merge them
            if (data.sent && data.received) {
                setShares([...data.sent, ...data.received]);
            } else if (Array.isArray(data)) {
                setShares(data);
            } else {
                setShares([]);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load shares");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShares();
    }, [isAdmin]);

    const handleRevoke = async (id: string) => {
        const ok = await confirm({
            title: "Revoke Share",
            message: "Are you sure you want to revoke this share? The recipient will immediately lose access.",
            confirmLabel: "Revoke",
            danger: true,
        });
        if (!ok) return;
        try {
            await shareService.revoke(id);
            addToast("Share revoked successfully.", "success");
            fetchShares();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Failed to revoke share", "error");
        }
    };

    if (loading) return <div className="loading"><Loader2 className="spin" size={22} /> Loading shares...</div>;
    if (error) return <div className="alert alert-danger"><AlertCircle size={18} /> {error}</div>;

    return (
        <div className="card">
            <div className="card-header">
                <h3><Share2 size={22} /> Document Sharing Management</h3>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Sender</th>
                            <th>Receiver</th>
                            <th>Permission Level</th>
                            <th>Sharing Date</th>
                            <th>Expiration Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shares.length === 0 ? (
                            <tr><td colSpan={8} className="empty-state">No shares found.</td></tr>
                        ) : (
                            shares.map((share) => (
                                <tr key={share._id}>
                                    <td><strong style={{ color: "var(--text-main)" }}>{share.documentTitle}</strong></td>
                                    <td>{share.senderEmail || share.sender}</td>
                                    <td>{share.receiverEmail || share.receiver}</td>
                                    <td>
                                        <span className="badge badge-normal">{share.permission}</span>
                                    </td>
                                    <td>{share.sharedDate ? new Date(share.sharedDate).toLocaleDateString() : "—"}</td>
                                    <td>{share.expirationDate ? new Date(share.expirationDate).toLocaleDateString() : "—"}</td>
                                    <td>
                                        <span className={`badge ${share.status === "Active" ? "badge-employee" :
                                                share.status === "Expired" ? "badge-sensitive" : "badge-critical"
                                            }`}>
                                            {share.status}
                                        </span>
                                    </td>
                                    <td>
                                        {share.status === "Active" && (isAdmin || share.sender === user?.id) ? (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleRevoke(share._id)}
                                            >
                                                <Ban size={14} /> Revoke Share
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: "0.85rem", color: "var(--text-disabled)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                <RefreshCw size={14} /> No actions
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};