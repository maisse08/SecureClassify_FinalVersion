import api from "./api";

export const datatypeService = {
    async getAll() {
        const res = await api.get("/datatypes");
        return res.data;
    },

    async getArchived() {
        const res = await api.get("/datatypes/archived");
        return res.data;
    },

    async getById(id: string) {
        const res = await api.get(`/datatypes/${id}`);
        return res.data;
    },

    async create(data: any) {
        const res = await api.post("/datatypes", data);
        return res.data;
    },

    async update(id: string, data: any) {
        const res = await api.put(`/datatypes/${id}`, data);
        return res.data;
    },

    async delete(id: string) {
        const res = await api.delete(`/datatypes/${id}`);
        return res.data;
    },

    async deactivate(id: string) {
        const res = await api.patch(`/datatypes/${id}/deactivate`);
        return res.data;
    },

    async activate(id: string) {
        const res = await api.patch(`/datatypes/${id}/activate`);
        return res.data;
    },

    async permanentlyDelete(id: string) {
        const res = await api.delete(`/datatypes/${id}/permanent`);
        return res.data;
    },
};
