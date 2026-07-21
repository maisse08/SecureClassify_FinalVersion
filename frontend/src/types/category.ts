export interface ICategory {
    _id: string;
    name: string;
    description?: string;
    color: string;
    isActive: boolean;
    datasetCount?: number;
    createdAt?: string;
    updatedAt?: string;
}
