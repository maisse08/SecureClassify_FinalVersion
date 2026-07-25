import api from "./api";

export const authService = {
    async login(email: string, password: string) {
        const res = await api.post("/auth/login", { email, password });
        return res.data;
    },

    async logout() {
        const res = await api.post("/auth/logout");
        return res.data;
    },

    async forgotPassword(email: string) {
        const res = await api.post("/auth/forgot-password", { email });
        return res.data;
    },

    async resetPassword(token: string, password: string) {
        const res = await api.post("/auth/reset-password", { token, password });
        return res.data;
    },

    async verifyMFA(email: string, code: string) {
        const res = await api.post("/auth/verify-mfa", { email, otp: code });
        return res.data;
    },

    async resendMFA() {
        const res = await api.post("/auth/resend-mfa");
        return res.data;
    },
};
