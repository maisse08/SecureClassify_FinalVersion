import api from "./api";

export const departmentService = {
    async getAll() {
        const res = await api.get("/departments");
        return res.data;
    },

    async getArchived() {
        const res = await api.get("/departments/archived");
        return res.data;
    },

    async getById(id: string) {
        const res = await api.get(`/departments/${id}`);
        return res.data;
    },

    async create(data: any) {
        const res = await api.post("/departments", data);
        return res.data;
    },

    async update(id: string, data: any) {
        const res = await api.put(`/departments/${id}`, data);
        return res.data;
    },

    async delete(id: string) {
        const res = await api.delete(`/departments/${id}`);
        return res.data;
    },

    async deactivate(id: string) {
        const res = await api.patch(`/departments/${id}/deactivate`);
        return res.data;
    },

    async activate(id: string) {
        const res = await api.patch(`/departments/${id}/activate`);
        return res.data;
    },

    async permanentlyDelete(id: string) {
        const res = await api.delete(`/departments/${id}/permanent`);
        return res.data;
    },
};
