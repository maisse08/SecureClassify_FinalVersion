export interface IShare {
    _id: string;
    data: string;
    sharedWith: string;
    sharedBy: string;
    permission: "view" | "edit";
    createdAt: string;
}