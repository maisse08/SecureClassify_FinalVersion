export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    department?: string;
    permissions?: string[];
    isActive: boolean;
}