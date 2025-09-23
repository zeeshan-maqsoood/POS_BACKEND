export declare const categoryService: {
    create(data: any, user?: any): Promise<{
        menuItems: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tags: string[];
            taxRate: number;
            taxExempt: boolean;
            categoryId: string;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
            price: number;
            cost: number | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
    }>;
    list(user?: any, queryParams?: any): Promise<({
        menuItems: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tags: string[];
            taxRate: number;
            taxExempt: boolean;
            categoryId: string;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
            price: number;
            cost: number | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
    })[]>;
    get(id: string, user?: any): Promise<({
        menuItems: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tags: string[];
            taxRate: number;
            taxExempt: boolean;
            categoryId: string;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
            price: number;
            cost: number | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
    }) | null>;
    update(id: string, data: any, user?: any): Promise<{
        menuItems: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tags: string[];
            taxRate: number;
            taxExempt: boolean;
            categoryId: string;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
            price: number;
            cost: number | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
    }>;
    remove(id: string, user?: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
    }>;
};
export declare const menuItemService: {
    create(data: any, user?: any): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
        };
        modifiers: {
            id: string;
            modifierId: string;
            menuItemId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tags: string[];
        taxRate: number;
        taxExempt: boolean;
        categoryId: string;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
        price: number;
        cost: number | null;
    }>;
    list(user?: any, queryParams?: any): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
        };
        modifiers: {
            id: string;
            modifierId: string;
            menuItemId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tags: string[];
        taxRate: number;
        taxExempt: boolean;
        categoryId: string;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
        price: number;
        cost: number | null;
    })[]>;
    get(id: string, user?: any): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
        };
        modifiers: {
            id: string;
            modifierId: string;
            menuItemId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tags: string[];
        taxRate: number;
        taxExempt: boolean;
        categoryId: string;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
        price: number;
        cost: number | null;
    }) | null>;
    update(id: string, data: any, user?: any): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            imageUrl: string | null;
            isActive: boolean;
            branchName: string | null;
        };
        modifiers: {
            id: string;
            modifierId: string;
            menuItemId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tags: string[];
        taxRate: number;
        taxExempt: boolean;
        categoryId: string;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
        price: number;
        cost: number | null;
    }>;
    remove(id: string, user?: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tags: string[];
        taxRate: number;
        taxExempt: boolean;
        categoryId: string;
        imageUrl: string | null;
        isActive: boolean;
        branchName: string | null;
        price: number;
        cost: number | null;
    }>;
};
export declare const modifierService: {
    create(data: any): Promise<{
        options: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            price: number;
            modifierId: string;
            isDefault: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        type: string;
        isRequired: boolean;
        minSelection: number;
        maxSelection: number;
    }>;
    list(): Promise<({
        options: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            price: number;
            modifierId: string;
            isDefault: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        type: string;
        isRequired: boolean;
        minSelection: number;
        maxSelection: number;
    })[]>;
    get(id: string): Promise<({
        options: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            price: number;
            modifierId: string;
            isDefault: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        type: string;
        isRequired: boolean;
        minSelection: number;
        maxSelection: number;
    }) | null>;
    update(id: string, data: any): Promise<{
        options: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            price: number;
            modifierId: string;
            isDefault: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        type: string;
        isRequired: boolean;
        minSelection: number;
        maxSelection: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        type: string;
        isRequired: boolean;
        minSelection: number;
        maxSelection: number;
    }>;
};
