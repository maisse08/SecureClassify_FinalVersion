import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { historyService } from "../../services/history.service";
import { History, FileText, Wifi, Search, CheckCircle2, XCircle, FilterX, Lock } from "lucide-react";

type ActiveTab = "connections" | "actions";

export const HistoryPage = () => {
    const { isAdmin, user } = useAuth();
    // An admin sees everyone's history by default. A regular user only sees
    // the same if an admin has delegated them the "history.view" permission
    // (manage all history) — otherwise they only see their own activity.
    const canViewAllHistory = isAdmin || (user?.permissions || []).includes("history.view");

    const { data: connections, loading: loadingConns } = useFetch<any[]>(
        () => canViewAllHistory ? historyService.getConnectionHistory() : historyService.getMyConnectionHistory(),
        [canViewAllHistory]
    );
    const { data: actions, loading: loadingActions } = useFetch<any[]>(
        () => canViewAllHistory ? historyService.getAllDataHistory() : historyService.getMyDataHistory(),
        [canViewAllHistory]
    );

    const [activeTab, setActiveTab] = useState<ActiveTab>("actions");
    const [searchUser, setSearchUser] = useState("");
    const [searchAction, setSearchAction] = useState("");
    const [dateFrom, setDateFrom] = useState("");

    if (loadingConns && loadingActions) return <div className="loading"><span className="spin" style={{ width: "22px", height: "22px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--text-main)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span> Loading system activity history...</div>;

    const connList = Array.isArray(connections) ? connections : [];
    const actionList = Array.isArray(actions) ? actions : [];

    const filteredConnections = connList.filter((c: any) => {
        const matchUser = !searchUser || (c.email || "").toLowerCase().includes(searchUser.toLowerCase());
        const matchDate = !dateFrom || new Date(c.timestamp) >= new Date(dateFrom);
        return matchUser && matchDate;
    });

    const filteredActions = actionList.filter((a: any) => {
        const matchAction = !searchAction || (a.action || "").toLowerCase().includes(searchAction.toLowerCase());
        const matchDate = !dateFrom || new Date(a.timestamp) >= new Date(dateFrom);
        return matchAction && matchDate;
    });

    const getActionBadge = (action: string) => {
        switch (action) {
            case "create":
            case "import": return "badge-employee";
            case "delete": return "badge-critical";
            case "update": return "badge-normal";
            case "restore": return "badge-employee";
            case "cia_assigned":
            case "classified": return "badge-sensitive";
            default: return "badge-sensitive";
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case "create": return "Create";
            case "import": return "Import";
            case "update": return "Update";
            case "delete": return "Delete";
            case "restore": return "Restore";
            case "cia_assigned": return "CIA Assigned";
            case "classified": return "Classified";
            default: return action;
        }
    };

    return (
        <div>
            {/* Header Card with Tabs */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3><History size={22} /> System Activity History</h3>
                        <p>{canViewAllHistory ? "Complete audit trail of all important system operations and user actions." : "Your personal connection and document activity."}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            className={`btn btn-sm ${activeTab === "actions" ? "btn-primary" : ""}`}
                            style={activeTab !== "actions" ? { background: "var(--surface-soft)", color: "var(--text-secondary)" } : {}}
                            onClick={() => setActiveTab("actions")}
                        >
                            <FileText size={15} /> Document Actions
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === "connections" ? "btn-primary" : ""}`}
                            style={activeTab !== "connections" ? { background: "var(--surface-soft)", color: "var(--text-secondary)" } : {}}
                            onClick={() => setActiveTab("connections")}
                        >
                            <Wifi size={15} /> Connections
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                    {activeTab === "connections" ? (
                        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
                            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder={canViewAllHistory ? "Filter by user email..." : "Filter by email..."}
                                style={{ paddingLeft: 44 }}
                                value={searchUser}
                                onChange={e => setSearchUser(e.target.value)}
                            />
                        </div>
                    ) : (
                        <select
                            className="form-control"
                            style={{ flex: 1, minWidth: "180px" }}
                            value={searchAction}
                            onChange={e => setSearchAction(e.target.value)}
                        >
                            <option value="">All Action Types</option>
                            <option value="create">Create</option>
                            <option value="import">Import</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="restore">Restore</option>
                            <option value="cia_assigned">CIA Assigned</option>
                            <option value="classified">Classified</option>
                        </select>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>From date:</label>
                        <input
                            type="date"
                            className="form-control"
                            style={{ width: "170px" }}
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                    </div>
                    {(searchUser || searchAction || dateFrom) && (
                        <button className="btn btn-sm" style={{ background: "var(--surface-soft)", color: "var(--text-secondary)" }} onClick={() => { setSearchUser(""); setSearchAction(""); setDateFrom(""); }}>
                            <FilterX size={15} /> Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Connection History Table */}
            {activeTab === "connections" && (
                <div className="card">
                    <div className="card-header">
                        <h4><Wifi size={18} /> Connection Logs ({filteredConnections.length} records)</h4>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User Email</th>
                                    <th>Action</th>
                                    <th>Status</th>
                                    <th>IP Address</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConnections.length === 0 ? (
                                    <tr><td colSpan={5} className="empty-state">No connection records found.</td></tr>
                                ) : (
                                    filteredConnections.slice(0, 50).map((c: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>{c.email}</td>
                                            <td style={{ textTransform: "capitalize" }}>{c.action?.replace("_", " ")}</td>
                                            <td>
                                                <span className={`badge ${c.success ? "badge-employee" : "badge-critical"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                    {c.success ? <><CheckCircle2 size={12} /> Success</> : <><XCircle size={12} /> Failed</>}
                                                </span>
                                            </td>
                                            <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{c.ip || "—"}</td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {c.timestamp ? new Date(c.timestamp).toLocaleString() : "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Document Action History Table */}
            {activeTab === "actions" && (
                <div className="card">
                    <div className="card-header">
                        <h4><FileText size={18} /> Document Action Logs ({filteredActions.length} records)</h4>
                    </div>
                    {!canViewAllHistory && filteredActions.length === 0 && (
                        <div className="alert alert-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Lock size={18} /> You are viewing only your own document actions.
                        </div>
                    )}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Action Type</th>
                                    <th>Target Document</th>
                                    <th>Details</th>
                                    <th>Performed By</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActions.length === 0 ? (
                                    <tr><td colSpan={5} className="empty-state">No document action records match your filters.</td></tr>
                                ) : (
                                    filteredActions.slice(0, 50).map((a: any, i: number) => (
                                        <tr key={i}>
                                            <td>
                                                <span className={`badge ${getActionBadge(a.action)}`}>
                                                    {getActionLabel(a.action) || "unknown"}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)" }}>
                                                {a.data?.titre || a.dataTitle || a.dataId || "—"}
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {a.details || "—"}
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                {a.performedBy?.email || a.performedByEmail || (a.performedBy ? String(a.performedBy).substring(0, 10) + "..." : "—")}
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                                                {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};