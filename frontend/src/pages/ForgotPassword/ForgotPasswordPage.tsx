import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    Shield,
    Mail,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { authService } from "../../services/auth.service";
import "../Login/LoginPage.css";

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "An error occurred. Please try again."
            );
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
                        <p>Reset your password</p>
                    </div>
                </div>

                {error && (
                    <div className="auth-error-msg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <CheckCircle
                            size={48}
                            style={{ color: "#22c55e", marginBottom: "16px" }}
                        />
                        <p
                            style={{
                                color: "#94a3b8",
                                fontSize: "0.9rem",
                                lineHeight: 1.6,
                            }}
                        >
                            If an account with that email exists, a password
                            reset link has been sent.
                        </p>
                        <p
                            style={{
                                color: "#64748b",
                                fontSize: "0.8rem",
                                marginTop: "12px",
                            }}
                        >
                            Please check your email inbox and follow the
                            instructions to reset your password.
                        </p>
                        <Link
                            to="/login"
                            style={{
                                display: "inline-block",
                                marginTop: "20px",
                                color: "#3b82f6",
                                textDecoration: "none",
                                fontSize: "0.85rem",
                            }}
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <p
                            style={{
                                color: "#94a3b8",
                                fontSize: "0.85rem",
                                marginBottom: "24px",
                                lineHeight: 1.6,
                            }}
                        >
                            Enter your email address and we'll send you a link
                            to reset your password.
                        </p>

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

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner"></div>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>
                )}

                <div className="card-footer">
                    <Link
                        to="/login"
                        style={{
                            color: "#94a3b8",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <ArrowLeft size={14} />
                        Back to Login
                    </Link>
                    <div className="security-specs">
                        <span>TLS 1.3</span>
                        <span className="dot">•</span>
                        <span>AES-256</span>
                    </div>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="glow-1"></div>
            <div className="glow-2"></div>
        </div>
    );
};