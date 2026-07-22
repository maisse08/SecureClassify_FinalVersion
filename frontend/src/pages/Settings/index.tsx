import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";
import { dashboardService } from "../../services/dashboard.service";
import {
    Info, Shield, Server, Database, Activity, Sun, Moon,
    CheckCircle, XCircle, ArrowRight, FileText, Lightbulb,
    BookOpen, Layers, Cpu, Globe, Loader2, AlertCircle
} from "lucide-react";
import "../pages/Dashboard/dashboard.css";

const APP_VERSION = "1.0.0";

const classificationLevels = [
    { level: "Public", description: "Data intended for public access with minimal security requirements.", color: "#60a5fa" },
    { level: "Internal", description: "Data intended for internal organizational use only.", color: "#34d399" },
    { level: "Confidential", description: "Sensitive information requiring enhanced protection.", color: "#fbbf24" },
    { level: "Highly Confidential", description: "Critical information requiring the highest level of protection and restricted access.", color: "#f87171" },
];

const workflowSteps = [
    { icon: <FileText size={22} />, label: "Import Dataset", color: "#3b82f6" },
    { icon: <Shield size={22} />, label: "Assign CIA Assessment", color: "#8E24AA" },
    { icon: <Activity size={22} />, label: "Calculate Global Classification", color: "#FB8C00" },
    { icon: <BookOpen size={22} />, label: "Consult History", color: "#2dd4bf" },
];

const quickTips = [
    "Import datasets before assigning CIA values.",
    "Review CIA values carefully before calculating the Global Classification.",
    "Archived records can be restored from the Trash module.",
    "All important actions are recorded in the History module.",
    "Use the Sharing module to collaborate securely with colleagues.",
    "Regularly review your dashboard for pending assessments.",
];

export const SettingsPage = () => {
    const { user, isAdmin } = useAuth();
    const { theme } = useTheme();
    const { t } = useLanguage();

    const [dashData, setDashData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await dashboardService.getMyDashboard();
                setDashData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Could not load system data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const classificationMethod = dashData?.stats?.globalClassification
        ? (dashData.stats.globalClassification.highest !== undefined && dashData.stats.globalClassification.average !== undefined
            ? "Average / Maximum"
            : "N/A")
        : "N/A";

    const serverStatus = "Online";
    const dbStatus = "Connected";

    return (
        <div className="dashboard-content">
            {/* Page Header */}
            <div className="dash-card dash-overview">
                <div>
                    <h2 className="dash-title">Information Center</h2>
                    <p className="dash-subtitle">
                        Overview of the SecureClassify platform, system status, and classification workflow.
                    </p>
                </div>
                <span className={`scope-badge ${isAdmin ? "admin" : "user"}`}>
                    {isAdmin ? "Administrator View" : "Employee View"}
                </span>
            </div>

            {/* 1. Application Overview */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h4 className="dash-card-title"><Info size={18} /> Application Overview</h4>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: "#3b82f6" }}>
                            <div className="stat-icon"><Shield size={20} /></div>
                            <div className="stat-value" style={{ fontSize: "1.3rem" }}>SecureClassify</div>
                            <div className="stat-label">Application Name</div>
                        </div>
                        <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: "#8E24AA" }}>
                            <div className="stat-icon"><Cpu size={20} /></div>
                            <div className="stat-value" style={{ fontSize: "1.3rem" }}>v{APP_VERSION}</div>
                            <div className="stat-label">Version</div>
                        </div>
                        <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: "#2dd4bf" }}>
                            <div className="stat-icon"><Globe size={20} /></div>
                            <div className="stat-value" style={{ fontSize: "1.3rem" }}>Enterprise</div>
                            <div className="stat-label">Data Classification Platform</div>
                        </div>
                    </div>

                    <div className="dash-card" style={{ padding: "18px 20px", margin: 0 }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                            <strong style={{ color: "var(--text-main)" }}>Developed during the internship at HTBS Africa</strong>
                            <br />
                            A comprehensive enterprise solution for classifying, assessing, and managing sensitive data
                            using the CIA (Confidentiality, Integrity, Availability) methodology.
                        </div>
                    </div>

                    <div className="dash-card" style={{ padding: "18px 20px", margin: 0 }}>
                        <div className="dash-card-header" style={{ marginBottom: "12px" }}>
                            <h4 className="dash-card-title" style={{ fontSize: "0.95rem" }}><Layers size={16} /> Technology Stack</h4>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            {["React + TypeScript", "Node.js + Express", "MongoDB"].map((tech) => (
                                <span key={tech} className="badge badge-normal" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. System Status */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h4 className="dash-card-title"><Server size={18} /> System Status</h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: serverStatus === "Online" ? "#28A745" : "#E53935" }}>
                        <div className="stat-icon"><Server size={20} /></div>
                        <div className="stat-value" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            {serverStatus === "Online" ? <CheckCircle size={18} color="#28A745" /> : <XCircle size={18} color="#E53935" />}
                            {serverStatus}
                        </div>
                        <div className="stat-label">Server Status</div>
                    </div>
                    <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: dbStatus === "Connected" ? "#28A745" : "#E53935" }}>
                        <div className="stat-icon"><Database size={20} /></div>
                        <div className="stat-value" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            {dbStatus === "Connected" ? <CheckCircle size={18} color="#28A745" /> : <XCircle size={18} color="#E53935" />}
                            {dbStatus}
                        </div>
                        <div className="stat-label">Database Status</div>
                    </div>
                    <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: "#3b82f6" }}>
                        <div className="stat-icon">{theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}</div>
                        <div className="stat-value" style={{ fontSize: "1.1rem", textTransform: "capitalize" }}>{theme}</div>
                        <div className="stat-label">Current Theme</div>
                    </div>
                    <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: isAdmin ? "#8E24AA" : "#2dd4bf" }}>
                        <div className="stat-icon"><Shield size={20} /></div>
                        <div className="stat-value" style={{ fontSize: "1.1rem", textTransform: "capitalize" }}>{user?.role || "N/A"}</div>
                        <div className="stat-label">Logged-in User Role</div>
                    </div>
                    <div className="stat-card" style={{ padding: "18px 20px", ["--stat-accent" as any]: "#FB8C00" }}>
                        <div className="stat-icon"><Activity size={20} /></div>
                        <div className="stat-value" style={{ fontSize: "1.1rem" }}>{user?.department || "N/A"}</div>
                        <div className="stat-label">Department</div>
                    </div>
                </div>
            </div>

            {/* 3. Classification Information */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h4 className="dash-card-title"><Activity size={18} /> Classification Information</h4>
                </div>

                {/* Workflow */}
                <div style={{ marginBottom: "20px" }}>
                    <h5 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 14px 0", letterSpacing: "0.5px" }}>
                        Workflow
                    </h5>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                        {workflowSteps.map((step, idx) => (
                            <React.Fragment key={step.label}>
                                <div className="stat-card" style={{
                                    padding: "14px 18px",
                                    margin: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    flex: "1 1 auto",
                                    minWidth: "160px",
                                    ["--stat-accent" as any]: step.color,
                                }}>
                                    <div className="stat-icon" style={{ width: "36px", height: "36px", margin: 0, color: step.color }}>
                                        {step.icon}
                                    </div>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < workflowSteps.length - 1 && (
                                    <ArrowRight size={20} style={{ color: "var(--text-disabled)", flexShrink: 0 }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Classification Method */}
                <div className="dash-card" style={{ padding: "16px 20px", margin: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                            Classification Method:
                        </span>
                        <span className="badge badge-normal" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                            {classificationMethod}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                            (Average or Maximum — configured per dataset)
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. Classification Levels */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h4 className="dash-card-title"><Layers size={18} /> Classification Levels</h4>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Classification</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classificationLevels.map((cl) => (
                                <tr key={cl.level}>
                                    <td>
                                        <span className="badge" style={{
                                            background: `${cl.color}20`,
                                            color: cl.color,
                                            border: `1px solid ${cl.color}40`,
                                            padding: "6px 14px",
                                            fontSize: "0.82rem",
                                        }}>
                                            {cl.level}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        {cl.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. Quick Tips */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h4 className="dash-card-title"><Lightbulb size={18} /> Quick Tips</h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                    {quickTips.map((tip, idx) => (
                        <div key={idx} className="stat-card" style={{
                            padding: "16px 18px",
                            margin: 0,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            ["--stat-accent" as any]: "#3b82f6",
                        }}>
                            <Lightbulb size={18} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "2px" }} />
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                {tip}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};