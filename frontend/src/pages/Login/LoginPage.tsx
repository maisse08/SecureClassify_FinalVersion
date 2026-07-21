import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { 
    Shield, 
    Lock, 
    Mail, 
    Eye, 
    EyeOff, 
    AlertCircle
} from "lucide-react";
import "./LoginPage.css";

export const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-full-bg">
            <div className="glass-card">
                {/* Logo & Brand */}
                <div className="card-header">
                    <div className="brand-icon">
                        <Shield className="icon-inner" size={32} />
                    </div>
                    <div className="brand-text">
                        <h1>SecureClassify</h1>
                        <p>Enterprise Data Classification</p>
                    </div>
                </div>

                {error && (
                    <div className="auth-error-msg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>EMAIL</label>
                        <div className="field-container">
                            <Mail className="field-icon" size={18} />
                            <input 
                                type="email" 
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <div className="field-container">
                            <Lock className="field-icon" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button 
                                type="button" 
                                className="toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Login to System"}
                    </button>
                </form>

                <div className="card-footer">
                    <div className="security-specs">
                        <span>TLS 1.3</span>
                        <span className="dot">•</span>
                        <span>AES-256</span>
                    </div>
                    <a href="#" className="forgot-link">Forgot password?</a>
                </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="glow-1"></div>
            <div className="glow-2"></div>
        </div>
    );
};