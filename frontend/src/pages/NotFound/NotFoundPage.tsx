import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export const NotFoundPage = () => (
    <div style={{ textAlign: "center", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: "90px", height: "90px", borderRadius: "24px", background: "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
            <Compass size={44} color="var(--text-main)" />
        </div>
        <h1 style={{ fontSize: "4rem", color: "var(--text-main)", margin: 0, fontWeight: 800, letterSpacing: "-2px" }}>404</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-tertiary)", margin: "10px 0 28px" }}>The page you are looking for could not be found.</p>
        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </div>
);