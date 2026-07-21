import api from "./api";

export const historyService = {
    async getDataHistory(dataId: string) {
        const res = await api.get(`/history/data/${dataId}`);
        return res.data;
    },

    async getAllDataHistory() {
        const res = await api.get("/history/data");
        return res.data;
    },

    async getConnectionHistory() {
        const res = await api.get("/history/connections");
        return res.data;
    },

    async getMyConnectionHistory() {
        const res = await api.get("/history/connections/me");
        return res.data;
    },

    async getMyDataHistory() {
        const res = await api.get("/history/data/me");
        return res.data;
    },
};
