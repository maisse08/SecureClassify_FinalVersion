import { createContext, useState, useEffect, ReactNode } from "react";
import { IUser } from "../types/user";
import { authService } from "../services/auth.service";

interface AuthContextType {
    user: IUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ requiresMFA?: boolean }>;
    verifyMFA: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authService.login(email, password);
        
        if (res.data.requiresMFA) {
            setTempCredentials({ email, password });
            return { requiresMFA: true };
        }
        
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return {};
    };

    const verifyMFA = async (code: string) => {
        if (!tempCredentials) {
            throw new Error("No pending MFA verification");
        }
        
        const res = await authService.verifyMFA(tempCredentials.email, code);
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setTempCredentials(null);
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch {
            // ignore
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        setTempCredentials(null);
    };

    const isAdmin = user?.role === "ADMIN";

    return (
        <AuthContext.Provider value={{ user, token, loading, login, verifyMFA, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};