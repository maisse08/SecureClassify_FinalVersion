export interface IDataType {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    datasetCount?: number;
    createdAt?: string;
    updatedAt?: string;
}
