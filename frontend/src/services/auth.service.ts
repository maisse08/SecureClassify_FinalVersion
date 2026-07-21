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
};