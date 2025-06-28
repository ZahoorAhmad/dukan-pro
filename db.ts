import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Supplier, Sale } from './types.ts';

export class DukaanProDB extends Dexie {
    products!: Table<Product, string>;
    customers!: Table<Customer, string>;
    suppliers!: Table<Supplier, string>;
    sales!: Table<Sale, string>;

    constructor() {
        super('dukaanProDatabase');
        this.version(1).stores({
            products: 'id, name, category, supplierId',
            customers: 'id, name, phone',
            suppliers: 'id, name',
            sales: 'id, customerId, date, paymentStatus',
        });
    }
}

export const db = new DukaanProDB();
