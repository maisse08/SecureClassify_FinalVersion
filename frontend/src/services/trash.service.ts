import api from "./api";

export const trashService = {
    async getAll() {
        const res = await api.get("/trash");
        return res.data;
    },

    async restore(id: string) {
        const res = await api.put(`/trash/${id}/restore`);
        return res.data;
    },

    async permanentlyDelete(id: string) {
        const res = await api.delete(`/trash/${id}`);
        return res.data;
    },
};