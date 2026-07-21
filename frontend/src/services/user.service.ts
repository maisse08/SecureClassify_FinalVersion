import api from "./api";

export const userService = {
    async getAll() {
        const res = await api.get("/users");
        return res.data;
    },

    async getById(id: string) {
        const res = await api.get(`/users/${id}`);
        return res.data;
    },

    async getProfile() {
        const res = await api.get("/users/me");
        return res.data;
    },

    async updateProfile(data: any) {
        const res = await api.put("/users/me", data);
        return res.data;
    },

    async create(data: any) {
        const res = await api.post("/users", data);
        return res.data;
    },

    async update(id: string, data: any) {
        const res = await api.put(`/users/${id}`, data);
        return res.data;
    },

    async delete(id: string) {
        const res = await api.delete(`/users/${id}`);
        return res.data;
    },

    async changePassword(currentPassword: string, newPassword: string) {
        const res = await api.put("/users/change-password", { currentPassword, newPassword });
        return res.data;
    },

    async addPermission(id: string, permission: string) {
        const res = await api.post(`/users/${id}/permissions`, { permission });
        return res.data;
    },

    async removePermission(id: string, permission: string) {
        const res = await api.delete(`/users/${id}/permissions/${permission}`);
        return res.data;
    },
};