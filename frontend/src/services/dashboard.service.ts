import api from "./api";

export const dashboardService = {
    async getMyDashboard() {
        const res = await api.get("/dashboard/me");
        return res.data;
    },
};