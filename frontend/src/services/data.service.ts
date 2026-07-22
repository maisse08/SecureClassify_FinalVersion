import api from "./api";

// Build a FormData payload from a data object, appending the attachment file
// under the "pieceJointe" field when present.
const buildFormData = (data: any): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === "pieceJointeFile") return; // handled separately
        if (value === undefined || value === null) return;
        if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, String(value));
        }
    });
    if (data.pieceJointeFile instanceof File) {
        formData.append("pieceJointe", data.pieceJointeFile);
    }
    return formData;
};

// Build a FormData payload for a dataset import: dataset name + category
// (manual), plus every file from the chosen folder or multi-file selection.
const buildImportFormData = (data: { titre: string; description?: string; categorie: string }, files: File[]): FormData => {
    const formData = new FormData();
    formData.append("titre", data.titre);
    if (data.description) formData.append("description", data.description);
    formData.append("categorie", data.categorie);
    files.forEach((file) => formData.append("files", file, (file as any).webkitRelativePath || file.name));
    return formData;
};

export const dataService = {
    async getAll() {
        const res = await api.get("/data");
        return res.data;
    },

    async getMyData() {
        const res = await api.get("/data/me");
        return res.data;
    },

    async getById(id: string) {
        const res = await api.get(`/data/${id}`);
        return res.data;
    },

    // Import a dataset: a folder or several individually-selected files, plus
    // the manually entered dataset name and category. No CIA is sent here.
    async importData(data: { titre: string; description?: string; categorie: string }, files: File[]) {
        const res = await api.post("/data", buildImportFormData(data, files));
        return res.data;
    },

    async update(id: string, data: any) {
        const res = await api.put(`/data/${id}`, buildFormData(data));
        return res.data;
    },

    // CIA Assessment page: assign ONE CIA rating to the whole dataset.
    async assignCIA(id: string, niveauCIA: { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }) {
        const res = await api.patch(`/data/${id}/cia`, { niveauCIA });
        return res.data;
    },

    // Separate action: calculate the global classification from the CIA
    // levels already assigned to the dataset.
    async calculateClassification(id: string) {
        const res = await api.post(`/data/${id}/calculate-classification`);
        return res.data;
    },

    async delete(id: string) {
        const res = await api.delete(`/data/${id}`);
        return res.data;
    },

    // Get the preview URL for an imported file (for direct browser use)
    getFilePreviewUrl(id: string, filename: string) {
        return `/data/${id}/files/${encodeURIComponent(filename)}`;
    },

    // Fetch a file as a blob with authentication (for preview/download)
    async getFileBlob(id: string, filename: string, download: boolean = false): Promise<Blob> {
        const url = `/data/${id}/files/${encodeURIComponent(filename)}?download=${download}`;
        const res = await api.get(url, { responseType: 'blob' });
        return res.data;
    },
};
