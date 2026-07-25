import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";
import { 
    Shield, 
    Lock, 
    Mail, 
    Eye, 
    EyeOff, 
    AlertCircle,
    CheckCircle
} from "lucide-react";
import "./LoginPage.css";

export const LoginPage = () => {
    // Login form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    // MFA state
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [showMFA, setShowMFA] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
    const [isExpired, setIsExpired] = useState(false);
    
    // Common state
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);
    
    const { login, verifyMFA } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check if redirected from successful password reset
    useEffect(() => {
        if (location.state?.passwordResetSuccess) {
            setSuccessMessage("Password has been reset successfully. Please log in with your new password.");
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Countdown timer
    useEffect(() => {
        if (!showMFA || isExpired) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setIsExpired(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showMFA, isExpired]);

    // Reset MFA state when showing MFA form
    useEffect(() => {
        if (showMFA) {
            setCountdown(300);
            setIsExpired(false);
            setError("");
            setResendSuccess(null);
            // Focus first OTP input
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
    }, [showMFA]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await login(email, password);
            
            if (result.requiresMFA) {
                setShowMFA(true);
            } else {
                navigate("/dashboard");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Handle backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        // Handle Enter
        if (e.key === "Enter") {
            handleVerify();
        }
        // Handle paste
        if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
            // Let paste event handle it
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
        
        if (pastedData.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length && i < 6; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            
            // Focus the next empty input or the last one
            const nextIndex = Math.min(pastedData.length, 5);
            otpRefs.current[nextIndex]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join("");
        
        if (code.length !== 6) {
            setError("Please enter the complete 6-digit code.");
            return;
        }

        if (isExpired) {
            setError("The verification code has expired.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await verifyMFA(code);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid verification code. Please try again.");
            // Clear only the OTP inputs, not the entire form
            setOtp(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!isExpired && countdown > 0) {
            return; // Cooldown not finished
        }

        setError("");
        setResendSuccess(null);
        setLoading(true);

        try {
            const res = await authService.resendMFA();
            setResendSuccess(res.data.message || "A new verification code has been sent.");
            setCountdown(300);
            setIsExpired(false);
            setOtp(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to resend code. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setShowMFA(false);
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setResendSuccess(null);
        setIsExpired(false);
        setCountdown(300);
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

                {successMessage && (
                    <div className="auth-success-msg">
                        <CheckCircle size={16} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="auth-error-msg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {resendSuccess && (
                    <div className="auth-success-msg">
                        <CheckCircle size={16} />
                        <span>{resendSuccess}</span>
                    </div>
                )}

                {!showMFA ? (
                    /* Login Form */
                    <form onSubmit={handleLoginSubmit} className="auth-form">
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
                ) : (
                    /* MFA Verification Form */
                    <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="auth-form">
                        <div className="mfa-header">
                            <h2>Verify your identity</h2>
                            <p>A 6-digit verification code has been sent to your email.</p>
                        </div>

                        <div className="otp-container">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    className="otp-input"
                                    disabled={loading || isExpired}
                                />
                            ))}
                        </div>

                        <div className="countdown-container">
                            {!isExpired ? (
                                <>
                                    <span className="countdown-label">Code expires in:</span>
                                    <span className="countdown-timer">{formatTime(countdown)}</span>
                                </>
                            ) : (
                                <span className="expired-message">The verification code has expired.</span>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="login-button" 
                            disabled={loading || isExpired || otp.join("").length !== 6}
                        >
                            {loading ? <div className="spinner"></div> : "Verify"}
                        </button>

                        <div className="mfa-actions">
                            <button 
                                type="button" 
                                className="resend-button"
                                onClick={handleResend}
                                disabled={loading || (!isExpired && countdown > 0)}
                            >
                                Resend Code
                            </button>
                            <button 
                                type="button" 
                                className="back-button"
                                onClick={handleBackToLogin}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}

                {!showMFA && (
                    <div className="card-footer">
                        <div className="security-specs">
                            <span>TLS 1.3</span>
                            <span className="dot">•</span>
                            <span>AES-256</span>
                        </div>
                        <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                    </div>
                )}
            </div>
            
            {/* Background decorative elements */}
            <div className="glow-1"></div>
            <div className="glow-2"></div>
        </div>
    );
};