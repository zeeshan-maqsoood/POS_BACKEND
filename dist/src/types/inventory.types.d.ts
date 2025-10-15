export interface InventoryCategory {
    id: string;
    name: string;
    description?: string;
    color: string;
    branchName?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    subcategories: InventorySubcategory[];
    itemCount: number;
}
export interface InventorySubcategory {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    branchName?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    itemCount: number;
}
export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    subcategoryId?: string;
    quantity: number;
    unit: string;
    price: number;
    cost: number;
    minStock: number;
    maxStock: number;
    supplier: string;
    location: string;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    branchName?: string;
    expiryDate?: Date;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
    category: InventoryCategory;
    subcategory?: InventorySubcategory;
}
export interface CreateInventoryCategoryDto {
    name: string;
    description?: string;
    color: string;
    branchName?: string;
}
export interface UpdateInventoryCategoryDto {
    name?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
}
export interface CreateInventorySubcategoryDto {
    name: string;
    description?: string;
    categoryId: string;
    branchName?: string;
}
export interface UpdateInventorySubcategoryDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export interface CreateInventoryItemDto {
    name: string;
    description?: string;
    categoryId: string;
    subcategoryId?: string;
    quantity: number;
    unit: string;
    price: number;
    cost: number;
    minStock: number;
    maxStock: number;
    supplier: string;
    location: string;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    branchName?: string;
    expiryDate?: Date;
}
export interface UpdateInventoryItemDto {
    name?: string;
    description?: string;
    categoryId?: string;
    subcategoryId?: string;
    quantity?: number;
    unit?: string;
    price?: number;
    cost?: number;
    minStock?: number;
    maxStock?: number;
    supplier?: string;
    location?: string;
    status?: "In Stock" | "Low Stock" | "Out of Stock";
    expiryDate?: Date;
    lastUpdated?: Date;
}
