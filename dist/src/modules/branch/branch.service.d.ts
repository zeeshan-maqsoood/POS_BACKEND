export declare const branchService: {
    getAllBranches(): Promise<{
        name: string | null;
        value: string | null;
    }[]>;
    getUserBranches(userId: string): Promise<{
        name: string | null;
        value: string | null;
    }[]>;
};
