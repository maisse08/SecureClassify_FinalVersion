import api from "./api";

export const categoryService = {
    async getAll() {
        const res = await api.get("/categories");
        return res.data;
    },

    async getArchived() {
        const res = await api.get("/categories/archived");
        return res.data;
    },

    async getById(id: string) {
        const res = await api.get(`/categories/${id}`);
        return res.data;
    },

    async create(data: any) {
        const res = await api.post("/categories", data);
        return res.data;
    },

    async update(id: string, data: any) {
        const res = await api.put(`/categories/${id}`, data);
        return res.data;
    },

    async delete(id: string) {
        const res = await api.delete(`/categories/${id}`);
        return res.data;
    },

    async deactivate(id: string) {
        const res = await api.patch(`/categories/${id}/deactivate`);
        return res.data;
    },

    async activate(id: string) {
        const res = await api.patch(`/categories/${id}/activate`);
        return res.data;
    },

    async permanentlyDelete(id: string) {
        const res = await api.delete(`/categories/${id}/permanent`);
        return res.data;
    },
};
