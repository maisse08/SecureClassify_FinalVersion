import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Shield,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import { authService } from "../../services/auth.service";
import "../Login/LoginPage.css";

export const ResetPasswordPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        if (!token) {
            setError("Invalid reset link. No token provided.");
        }
    }, [token]);

    const validatePassword = (pwd: string): string[] => {
        const errors: string[] = [];
        if (pwd.length < 8) {
            errors.push("At least 8 characters");
        }
        if (!/[A-Z]/.test(pwd)) {
            errors.push("One uppercase letter");
        }
        if (!/[a-z]/.test(pwd)) {
            errors.push("One lowercase letter");
        }
        if (!/[0-9]/.test(pwd)) {
            errors.push("One number");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
            errors.push("One special character");
        }
        return errors;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (newPassword.length > 0) {
            setValidationErrors(validatePassword(newPassword));
        } else {
            setValidationErrors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate password
        const errors = validatePassword(password);
        if (errors.length > 0) {
            setError("Password does not meet the requirements.");
            return;
        }

        // Check passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!token) {
            setError("Invalid reset link. No token provided.");
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
            // Redirect to login after 3 seconds with success message
            setTimeout(() => {
                navigate("/login", { state: { passwordResetSuccess: true } });
            }, 3000);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to reset password. The link may have expired."
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
                        <p>Create new password</p>
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
                                color: "#e2e8f0",
                                fontSize: "1rem",
                                fontWeight: 600,
                                marginBottom: "8px",
                            }}
                        >
                            Password Reset Successful!
                        </p>
                        <p
                            style={{
                                color: "#94a3b8",
                                fontSize: "0.9rem",
                                lineHeight: 1.6,
                            }}
                        >
                            Your password has been updated successfully.
                            Redirecting to login...
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
                            Go to Login
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
                            Enter your new password below.
                        </p>

                        <div className="input-group">
                            <label>NEW PASSWORD</label>
                            <div className="field-container">
                                <Lock className="field-icon" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            {password.length > 0 && validationErrors.length > 0 && (
                                <div
                                    style={{
                                        marginTop: "8px",
                                        padding: "10px 14px",
                                        background: "rgba(239, 68, 68, 0.08)",
                                        border: "1px solid rgba(239, 68, 68, 0.15)",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <p
                                        style={{
                                            color: "#f87171",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            letterSpacing: "0.5px",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        PASSWORD REQUIREMENTS
                                    </p>
                                    {validationErrors.map((err, idx) => (
                                        <p
                                            key={idx}
                                            style={{
                                                color: "#ef4444",
                                                fontSize: "0.75rem",
                                                marginBottom: "2px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "0.6rem",
                                                }}
                                            >
                                                ✗
                                            </span>
                                            {err}
                                        </p>
                                    ))}
                                </div>
                            )}
                            {password.length > 0 && validationErrors.length === 0 && (
                                <div
                                    style={{
                                        marginTop: "8px",
                                        padding: "10px 14px",
                                        background: "rgba(34, 197, 94, 0.08)",
                                        border: "1px solid rgba(34, 197, 94, 0.15)",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <p
                                        style={{
                                            color: "#4ade80",
                                            fontSize: "0.75rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <span style={{ fontSize: "0.6rem" }}>
                                            ✓
                                        </span>
                                        Password meets all requirements
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label>CONFIRM PASSWORD</label>
                            <div className="field-container">
                                <Lock className="field-icon" size={18} />
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            {confirmPassword.length > 0 &&
                                password !== confirmPassword && (
                                    <p
                                        style={{
                                            color: "#ef4444",
                                            fontSize: "0.75rem",
                                            marginTop: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <AlertCircle size={12} />
                                        Passwords do not match
                                    </p>
                                )}
                            {confirmPassword.length > 0 &&
                                password === confirmPassword && (
                                    <p
                                        style={{
                                            color: "#4ade80",
                                            fontSize: "0.75rem",
                                            marginTop: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <span
                                            style={{ fontSize: "0.6rem" }}
                                        >
                                            ✓
                                        </span>
                                        Passwords match
                                    </p>
                                )}
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner"></div>
                            ) : (
                                "Reset Password"
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