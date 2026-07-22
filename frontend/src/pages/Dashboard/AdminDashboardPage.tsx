import { useState, useEffect } from "react";
import {
    Database, Users, Building2, FolderTree, Share2, Trash2,
    ShieldAlert, BarChart3, AlertCircle, Loader2
} from "lucide-react";
import { dashboardService } from "../../services/dashboard.service";
import { categoryService } from "../../services/category.service";
import { departmentService } from "../../services/department.service";
import "./dashboard.css";

export const AdminDashboardPage = () => {
    const [data, setData] = useState<any>(null);
    const [categoriesCount, setCategoriesCount] = useState(0);
    const [departmentsCount, setDepartmentsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashRes, catRes, deptRes] = await Promise.all([
                    dashboardService.getMyDashboard(),
                    categoryService.getAll().catch(() => ({ data: [] })),
                    departmentService.getAll().catch(() => ({ data: [] }))
                ]);

                setData(dashRes.data);

                const catList = Array.isArray(catRes) ? catRes : catRes.data || [];
                const deptList = Array.isArray(deptRes) ? deptRes : deptRes.data || [];
                setCategoriesCount(catList.length);
                setDepartmentsCount(deptList.length);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load dashboard statistics");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="dash-loading">
            <Loader2 className="spin" size={22} />
            <span>Loading SecureClassify Dashboard...</span>
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
    const totalUsers = stats.activeUsers || 0;
    const catDist = stats.distribution?.categories || [];
    const deptDist = stats.distribution?.departments || [];
    const monthlyUploads = stats.monthlyUploads || [];

    const importedDatasets = stats.importedDatasets || 0;
    const datasetsPendingCIA = stats.datasetsPendingCIA || 0;
    const classifiedDatasets = stats.classifiedDatasets || 0;
    const globalClassification = stats.globalClassification || { highest: 0, average: 0, classifiedCount: 0 };

    const statCards = [
        { icon: <Database size={20} />, value: totalDocs, label: "Total Datasets", accent: "#3b82f6" },
        { icon: <Database size={20} />, value: importedDatasets, label: "Imported Datasets", accent: "#8E24AA" },
        { icon: <ShieldAlert size={20} />, value: datasetsPendingCIA, label: "Pending CIA Assessment", accent: "#FB8C00" },
        { icon: <ShieldAlert size={20} />, value: classifiedDatasets, label: "Classified Datasets", accent: "#E53935" },
        { icon: <Users size={20} />, value: stats.activeUsers || 0, label: "Total Users", accent: "#2dd4bf" },
        { icon: <Building2 size={20} />, value: departmentsCount, label: "Departments", accent: "#00ACC1" },
        { icon: <FolderTree size={20} />, value: categoriesCount, label: "Doc Categories", accent: "#FB8C00" },
        { icon: <Share2 size={20} />, value: stats.shared?.totalShared || 0, label: "Shared Docs", accent: "#8E24AA" },
        { icon: <Trash2 size={20} />, value: stats.trashData || 0, label: "In Trash Bin", accent: "#E53935" },
    ];

    // Compute max count for bar chart scaling
    const maxMonthlyCount = Math.max(1, ...monthlyUploads.map((m: any) => m.count));

    return (
        <div className="dashboard-content">
            {/* Overview Header */}
            <div className="dash-card dash-overview">
                <div>
                    <h2 className="dash-title">Admin Dashboard</h2>
                    <p className="dash-subtitle">Organization-wide security classifications and data analytics summary.</p>
                </div>
                <span className="scope-badge admin">Administrator View</span>
            </div>

            {/* Statistics Cards Grid */}
            <div className="stats-grid">
                {statCards.map((s, i) => (
                    <div className="stat-card" key={i} style={{ ["--stat-accent" as any]: s.accent }}>
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
                        <h4 className="dash-card-title"><ShieldAlert size={18} /> CIA Classification Levels</h4>
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
                        <h4 className="dash-card-title"><ShieldAlert size={18} /> Global Classification Level</h4>
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
                                <span className="progress-label">Average across classified datasets</span>
                                <span style={{ fontWeight: 600 }}>{globalClassification.average}/5</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span className="progress-label">Datasets classified</span>
                                <span style={{ fontWeight: 600 }}>{globalClassification.classifiedCount}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">No datasets have a calculated global classification yet.</div>
                    )}
                </div>

                {/* Monthly Upload chart (dynamic) */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><BarChart3 size={18} /> Monthly Upload Volume</h4>
                    </div>
                    {monthlyUploads.length > 0 ? (
                        <div className="bar-chart">
                            {monthlyUploads.map((m: any) => {
                                const height = Math.max(4, Math.round((m.count / maxMonthlyCount) * 130));
                                return (
                                    <div className="bar-col" key={m.month}>
                                        <div className="bar" style={{ height: `${height}px`, background: "#1976D2" }} title={`${m.count} uploads`} />
                                        <span className="bar-label">{m.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">No upload data available yet.</div>
                    )}
                </div>
            </div>

            {/* Distribution grids */}
            <div className="dash-grid-2">
                {/* Categories - top categories with most data */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><FolderTree size={18} /> Top Data Categories</h4>
                    </div>
                    {catDist.length > 0 ? (
                        <div>
                            {catDist.map((c: any) => (
                                <div key={c.categoryId}>
                                    <div className="progress-label" style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>{c.categoryName}</span>
                                        <span>{c.count} files</span>
                                    </div>
                                    {renderProgressBar(c.count, totalDocs, "#00ACC1")}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">No categorised files found.</div>
                    )}
                </div>

                {/* Departments - user count for admin */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h4 className="dash-card-title"><Users size={18} /> Users by Department</h4>
                    </div>
                    {deptDist.length > 0 ? (
                        <div>
                            {deptDist.map((d: any) => (
                                <div key={d.departmentId}>
                                    <div className="progress-label" style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>{d.departmentName}</span>
                                        <span>{d.count} users</span>
                                    </div>
                                    {renderProgressBar(d.count, totalUsers, "#FB8C00")}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">No users assigned to departments.</div>
                    )}
                </div>
            </div>

        </div>
    );
};