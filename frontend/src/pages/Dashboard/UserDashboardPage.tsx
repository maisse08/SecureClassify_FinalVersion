import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Database, Share2, Trash2, ShieldAlert, BarChart3,
    AlertCircle, Loader2, FileText, Upload, CheckCircle
} from "lucide-react";
import { dashboardService } from "../../services/dashboard.service";
import "./dashboard.css";

export const UserDashboardPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const dashRes = await dashboardService.getMyDashboard();
                setData(dashRes.data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load your dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="dash-loading">
            <Loader2 className="spin" size={22} />
            <span>Loading your workspace...</span>
        </div>
    );
    if (error) return (
        <div className="dash-error">
            <AlertCircle size={18} />
            <span>{error}</span>
        </div>
    );
    if (!data) return null;

    const { stats } = data;

    const renderProgressBar = (value: number, max: number, color: string) => {
        const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
        return (
            <div className="progress-row">
                <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${percentage}%`, background: color }} />
                </div>
                <span className="progress-value">{value} ({percentage}%)</span>
            </div>
        );
    };

    const totalDocs = stats.totalData || 0;
    const monthlyUploads = stats.monthlyUploads || [];

    const importedDatasets = stats.importedDatasets || 0;
    const classifiedDatasets = stats.classifiedDatasets || 0;
    const globalClassification = stats.globalClassification || { highest: 0, average: 0, classifiedCount: 0 };

    // User-specific stat cards (no admin-level info like users/departments/categories)
    const statCards = [
        { icon: <Database size={20} />, value: totalDocs, label: "My Datasets", accent: "#3b82f6", path: "/data" },
        { icon: <Upload size={20} />, value: importedDatasets, label: "My Imports", accent: "#8E24AA", path: "/cia-assessment?tab=imported" },
        { icon: <CheckCircle size={20} />, value: classifiedDatasets, label: "Classified", accent: "#28A745", path: "/cia-assessment?tab=classified" },
        { icon: <Share2 size={20} />, value: stats.shared?.sharedByMe || 0, label: "Shared by Me", accent: "#2dd4bf", path: "/sharing" },
        { icon: <Share2 size={20} />, value: stats.shared?.sharedWithMe || 0, label: "Shared with Me", accent: "#00ACC1", path: "/sharing" },
        { icon: <Trash2 size={20} />, value: stats.trashData || 0, label: "In Trash", accent: "#E53935", path: "/trash" },
    ];

    const handleStatCardClick = (path: string) => {
        navigate(path);
    };

    const maxMonthlyCount = Math.max(1, ...monthlyUploads.map((m: any) => m.count));

    return (
        <div className="dashboard-content">
            {/* Overview Header */}
            <div className="dash-card dash-overview">
                <div>
                    <h2 className="dash-title">My Workspace</h2>
                    <p className="dash-subtitle">Your personal data classification overview and recent activity.</p>
                </div>
                <span className="scope-badge user">Employee Workspace</span>
            </div>

            {/* Statistics Cards Grid */}
            <div className="stats-grid">
                {statCards.map((s, i) => (
                    <div
                        className="stat-card clickable"
                        key={i}
                        style={{ ["--stat-accent" as any]: s.accent }}
                        onClick={() => handleStatCardClick(s.path)}
                        title={`Go to ${s.label}`}
                    >
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="dash-grid-2">
                {/* CIA level progress bars */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><ShieldAlert size={18} /> My CIA Classification Levels</h4>
                    </div>
                    <div>
                        <span className="progress-label">Low Sensitivity (Global CIA ≤ 2)</span>
                        {renderProgressBar(stats.classification?.low || 0, totalDocs, "#28A745")}

                        <span className="progress-label">Medium Sensitivity (Global CIA 3-4)</span>
                        {renderProgressBar(stats.classification?.medium || 0, totalDocs, "#FFC107")}

                        <span className="progress-label">High Sensitivity (Global CIA = 5)</span>
                        {renderProgressBar(stats.classification?.high || 0, totalDocs, "#DC3545")}
                    </div>
                </div>

                {/* Global Classification summary */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><ShieldAlert size={18} /> My Global Classification</h4>
                    </div>
                    {globalClassification.classifiedCount > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span className="progress-label">Highest level reached</span>
                                <span className={`badge ${globalClassification.highest >= 5 ? "badge-critical" : globalClassification.highest >= 3 ? "badge-sensitive" : "badge-normal"}`}>
                                    {globalClassification.highest}/5
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span className="progress-label">Average across my datasets</span>
                                <span style={{ fontWeight: 600 }}>{globalClassification.average}/5</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span className="progress-label">My classified datasets</span>
                                <span style={{ fontWeight: 600 }}>{globalClassification.classifiedCount}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">You have no classified datasets yet.</div>
                    )}
                </div>

                {/* Monthly Upload chart (dynamic - user specific) */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><BarChart3 size={18} /> My Monthly Uploads</h4>
                    </div>
                    {monthlyUploads.length > 0 ? (
                        <div className="bar-chart">
                            {monthlyUploads.map((m: any) => {
                                const height = Math.max(4, Math.round((m.count / maxMonthlyCount) * 130));
                                return (
                                    <div className="bar-col" key={m.month}>
                                        <div className="bar" style={{ height: `${height}px`, background: "#2dd4bf" }} title={`${m.count} uploads`} />
                                        <span className="bar-label">{m.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">You haven't uploaded any data yet.</div>
                    )}
                </div>

                {/* Workflow Status Summary */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><FileText size={18} /> My Workflow Status</h4>
                    </div>
                    <div>
                        <span className="progress-label">Imported (awaiting CIA)</span>
                        {renderProgressBar(stats.datasetStatus?.imported || 0, totalDocs, "#FB8C00")}

                        <span className="progress-label">CIA Assigned</span>
                        {renderProgressBar(stats.datasetStatus?.ciaAssigned || 0, totalDocs, "#3b82f6")}

                        <span className="progress-label">Classified</span>
                        {renderProgressBar(stats.datasetStatus?.classified || 0, totalDocs, "#28A745")}
                    </div>
                </div>
            </div>

        </div>
    );
};