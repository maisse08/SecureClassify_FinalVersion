export interface IDepartment {
    _id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    userCount?: number;
    createdAt?: string;
    updatedAt?: string;
}
