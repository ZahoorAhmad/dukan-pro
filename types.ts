export interface Product {
    id: string;
    name: string;
    category: string;
    supplierId: string | null;
    stock: number;
    purchasePrice: number;
    sellingPrice: number;
    createdAt: string;
}

export interface Customer {
    id:string;
    name: string;
    phone: string;
    address: string;
    createdAt: string;
    balance: number;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    createdAt: string;
    balance: number;
}

export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
}

export interface Sale {
    id: string;
    customerId: string | null;
    items: SaleItem[];
    totalAmount: number;
    totalCost: number;
    profit: number;
    date: string;
    paymentStatus: 'paid' | 'unpaid';
}

export type View = 'dashboard' | 'sales' | 'stock' | 'customers' | 'suppliers' | 'reports';