import api from "./api";

export const shareService = {
    async getAll() {
        const res = await api.get("/shares");
        return res.data;
    },

    async getMyShares() {
        const res = await api.get("/shares/me");
        return res.data;
    },

    async getByDocument(documentId: string) {
        const res = await api.get(`/shares/document/${documentId}`);
        return res.data;
    },

    async create(data: {
        documentId: string;
        receiverEmail: string;
        permission: string;
        expirationDate: string;
    }) {
        const res = await api.post("/shares", data);
        return res.data;
    },

    async revoke(id: string) {
        const res = await api.put(`/shares/${id}/revoke`);
        return res.data;
    },

    async delete(id: string) {
        const res = await api.delete(`/shares/${id}`);
        return res.data;
    },
};