import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, Customer, Supplier, Sale, SaleItem, View } from './types.ts';
import { db } from './db.ts';
import Dexie from 'dexie';

// =================================================================================
// 1. HELPER FUNCTIONS & CUSTOM HOOK
// =================================================================================

const generateId = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

const formatCurrency = (amount: number): string => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};


// =================================================================================
// 2. ICON COMPONENTS
// =================================================================================

const Icon = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}>
        {children}
    </svg>
);
const DashboardIcon = () => <Icon><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></Icon>;
const ShoppingCartIcon = () => <Icon><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></Icon>;
const PackageIcon = () => <Icon><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M12 22V12"/><path d="m7 12 5 3 5-3"/><path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/></Icon>;
const UsersIcon = () => <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const TruckIcon = () => <Icon><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a2 2 0 0 0-1.17-1.83l-3-1.66A2 2 0 0 0 16.5 10H14"/><path d="M10 5H8"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></Icon>;
const BarChartIcon = () => <Icon><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></Icon>;
const PlusIcon = () => <Icon><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></Icon>;
const TrashIcon = () => <Icon><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></Icon>;
const EditIcon = () => <Icon><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></Icon>;
const CloseIcon = () => <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
const WalletIcon = () => <Icon><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></Icon>;
const ArrowDownIcon = () => <Icon><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></Icon>;
const ArrowUpIcon = () => <Icon><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></Icon>;
const RefreshCwIcon = () => <Icon><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></Icon>;


// =================================================================================
// 3. REUSABLE UI COMPONENTS
// =================================================================================

const StatCard = ({ title, value, icon, color, subtext }: { title: string, value: string, icon: React.ReactNode, color: string, subtext?:string }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
    </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'lg' }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, size?: 'lg' | '2xl' | '4xl' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        lg: 'max-w-lg',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className={`bg-slate-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <CloseIcon/>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Button = ({ onClick, children, className = '', type = 'button', disabled = false }: { onClick?: React.MouseEventHandler<HTMLButtonElement>, children: React.ReactNode, className?: string, type?: 'button' | 'submit' | 'reset', disabled?: boolean }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors ${disabled ? 'bg-slate-600 cursor-not-allowed' : ''} ${className}`}>
        {children}
    </button>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input ref={ref} {...props} className={`w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-600 ${props.className}`} />
));

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
    <select ref={ref} {...props} className={`w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${props.className}`}>
        {props.children}
    </select>
));


// =================================================================================
// 4. VIEW COMPONENTS
// =================================================================================

const Dashboard = React.memo(({ products, sales, customers, suppliers }: { products: Product[], sales: Sale[], customers: Customer[], suppliers: Supplier[] }) => {
    const stats = useMemo(() => {
        const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);
        const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
        const totalReceivables = customers.reduce((acc, c) => acc + c.balance, 0);
        const totalPayables = suppliers.reduce((acc, s) => acc + s.balance, 0);
        return { totalStockValue, totalProfit, totalReceivables, totalPayables };
    }, [products, sales, customers, suppliers]);

    const monthlySalesData = useMemo(() => {
        const months: { [key: string]: { sales: number, profit: number } } = {};
        sales.forEach(sale => {
            const month = new Date(sale.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!months[month]) {
                months[month] = { sales: 0, profit: 0 };
            }
            months[month].sales += sale.totalAmount;
            months[month].profit += sale.profit;
        });

        const sortedMonths = Object.keys(months).sort((a, b) => {
            const [monA, yearA] = a.split(' ');
            const [monB, yearB] = b.split(' ');
            const dateA = new Date(`01-${monA}-${yearA}`);
            const dateB = new Date(`01-${monB}-${yearB}`);
            return dateA.getTime() - dateB.getTime();
        }).slice(-6); // Last 6 months

        return sortedMonths.map(month => ({
            name: month,
            sales: months[month].sales,
            profit: months[month].profit
        }));
    }, [sales]);

    const maxMonthlyValue = Math.max(...monthlySalesData.map(d => d.sales), ...monthlySalesData.map(d => d.profit), 1);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Inventory Value" value={formatCurrency(stats.totalStockValue)} icon={<PackageIcon />} color="bg-blue-500" />
                <StatCard title="Total Realized Profit" value={formatCurrency(stats.totalProfit)} icon={<BarChartIcon />} color="bg-green-500" />
                <StatCard title="Total Receivables" value={formatCurrency(stats.totalReceivables)} icon={<ArrowDownIcon/>} color="bg-yellow-500" subtext="From Customers"/>
                <StatCard title="Total Payables" value={formatCurrency(stats.totalPayables)} icon={<ArrowUpIcon/>} color="bg-red-500" subtext="To Suppliers"/>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Monthly Performance (Last 6 Months)</h2>
                {monthlySalesData.length > 0 ? (
                    <div className="flex items-end h-64 space-x-4">
                        {monthlySalesData.map(data => (
                            <div key={data.name} className="flex-1 flex flex-col items-center">
                                <div className="flex items-end h-full w-full space-x-2 justify-center">
                                    <div className="w-1/2 flex flex-col justify-end items-center">
                                        <div className="bg-cyan-500 rounded-t-sm" title={`Sales: ${formatCurrency(data.sales)}`} style={{ height: `${(data.sales / maxMonthlyValue) * 100}%`, width: '80%' }}></div>
                                    </div>
                                    <div className="w-1/2 flex flex-col justify-end items-center">
                                        <div className="bg-green-500 rounded-t-sm" title={`Profit: ${formatCurrency(data.profit)}`} style={{ height: `${(data.profit / maxMonthlyValue) * 100}%`, width: '80%' }}></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 mt-2">{data.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-10">No sales data available to show chart.</p>
                )}
                <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-cyan-500 rounded-sm"></div>
                        <span className="text-sm">Sales</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                        <span className="text-sm">Profit</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

const StockManagement = ({ products, setProducts, suppliers, setSuppliers }: {
    products: Product[],
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
    suppliers: Supplier[],
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Product | undefined>(undefined);
    const [itemToRestock, setItemToRestock] = useState<Product | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenModal = (item?: Product) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleOpenRestockModal = (item: Product) => {
        setItemToRestock(item);
        setIsRestockModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setIsRestockModalOpen(false);
        setItemToEdit(undefined);
        setItemToRestock(undefined);
    };

    const handleSubmit = async (data: Omit<Product, 'id' | 'createdAt'>, creditPurchase: boolean) => {
        try {
            if (itemToEdit) {
                const updatedProduct = { ...itemToEdit, ...data };
                await db.products.update(itemToEdit.id, updatedProduct);
                setProducts(prev => prev.map(p => p.id === itemToEdit.id ? updatedProduct : p));
            } else {
                const newProduct: Product = { ...data, id: generateId(), createdAt: new Date().toISOString() };
                await db.transaction('rw', db.products, db.suppliers, async () => {
                    await db.products.add(newProduct);
                    if (creditPurchase && data.supplierId && data.stock > 0) {
                        const amount = data.stock * data.purchasePrice;
                        await db.suppliers.where('id').equals(data.supplierId).modify(supplier => {
                            supplier.balance += amount;
                        });
                    }
                });

                setProducts(prev => [newProduct, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                if (creditPurchase && data.supplierId && data.stock > 0) {
                    const amount = data.stock * data.purchasePrice;
                    setSuppliers(sup => sup.map(s => s.id === data.supplierId ? { ...s, balance: s.balance + amount } : s));
                }
            }
        } catch (error) {
            console.error("Failed to save product:", error);
            alert("Error: Could not save product data.");
        }
        handleCloseModals();
    };

    const handleRestock = async (quantity: number, purchasePrice: number, onCredit: boolean) => {
        if(!itemToRestock) return;
        try {
            await db.transaction('rw', db.products, db.suppliers, async () => {
                await db.products.where('id').equals(itemToRestock.id).modify(product => {
                    product.stock += quantity;
                    product.purchasePrice = purchasePrice;
                });
                if(onCredit && itemToRestock.supplierId) {
                    const amount = quantity * purchasePrice;
                    await db.suppliers.where('id').equals(itemToRestock.supplierId).modify(supplier => {
                        supplier.balance += amount;
                    });
                }
            });

            setProducts(prev => prev.map(p => p.id === itemToRestock.id ? {...p, stock: p.stock + quantity, purchasePrice: purchasePrice} : p));
            if(onCredit && itemToRestock.supplierId) {
                const amount = quantity * purchasePrice;
                setSuppliers(sup => sup.map(s => s.id === itemToRestock.supplierId ? {...s, balance: s.balance + amount} : s));
            }
        } catch (error) {
            console.error("Failed to restock product:", error);
            alert("Error: Could not restock product.");
        }
        handleCloseModals();
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product? This cannot be undone.')) {
            try {
                await db.products.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error("Failed to delete product:", error);
                alert("Error: Could not delete product.");
            }
        }
    };

    const filteredItems = useMemo(() => products.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3"><PackageIcon /> Stock</h1>
                <Button onClick={() => handleOpenModal()} className="bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2">
                    <PlusIcon /> Add New Product
                </Button>
            </div>

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search by product name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-700">
                        <tr>
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Category</th>
                            <th className="p-4 font-semibold">Supplier</th>
                            <th className="p-4 font-semibold">Stock</th>
                            <th className="p-4 font-semibold">Purchase Price</th>
                            <th className="p-4 font-semibold">Selling Price</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredItems.length > 0 ? filteredItems.map(item => (
                            <tr key={item.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50">
                                <td className="p-4 whitespace-nowrap">{item.name}</td>
                                <td className="p-4 whitespace-nowrap">{item.category}</td>
                                <td className="p-4 whitespace-nowrap">{suppliers.find(s => s.id === item.supplierId)?.name || 'N/A'}</td>
                                <td className="p-4 whitespace-nowrap"><span className={`${item.stock < 5 ? 'text-red-400 font-bold' : ''}`}>{item.stock}</span></td>
                                <td className="p-4 whitespace-nowrap">{formatCurrency(item.purchasePrice)}</td>
                                <td className="p-4 whitespace-nowrap">{formatCurrency(item.sellingPrice)}</td>
                                <td className="p-4 flex justify-end gap-2">
                                    <Button onClick={() => handleOpenRestockModal(item)} className="p-2 bg-green-600 hover:bg-green-500 text-white"><RefreshCwIcon /></Button>
                                    <Button onClick={() => handleOpenModal(item)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white"><EditIcon /></Button>
                                    <Button onClick={() => handleDelete(item.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white"><TrashIcon /></Button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="text-center p-8 text-slate-400">No products found.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModals} title={itemToEdit ? 'Edit Product' : 'Add New Product'}>
                <ProductForm onSubmit={handleSubmit} itemToEdit={itemToEdit} suppliers={suppliers} />
            </Modal>
            <Modal isOpen={isRestockModalOpen} onClose={handleCloseModals} title={`Restock: ${itemToRestock?.name}`}>
                <RestockForm onSubmit={handleRestock} itemToRestock={itemToRestock} />
            </Modal>
        </div>
    );
};

const ProductForm = ({ onSubmit, itemToEdit, suppliers }: { onSubmit: (data: Omit<Product, 'id'|'createdAt'>, credit: boolean) => Promise<void>, itemToEdit?: Product, suppliers: Supplier[] }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await onSubmit({
            name: formData.get('name') as string,
            category: formData.get('category') as string,
            supplierId: formData.get('supplierId') as string,
            stock: Number(formData.get('stock')),
            purchasePrice: Number(formData.get('purchasePrice')),
            sellingPrice: Number(formData.get('sellingPrice')),
        }, formData.get('creditPurchase') === 'on');
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Product Name" defaultValue={itemToEdit?.name} required />
            <Input name="category" placeholder="Category" defaultValue={itemToEdit?.category} required />
            <Select name="supplierId" defaultValue={itemToEdit?.supplierId || ''} required>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input name="stock" type="number" placeholder="Initial Stock Quantity" defaultValue={itemToEdit?.stock} required disabled={!!itemToEdit} />
            <Input name="purchasePrice" type="number" step="0.01" placeholder="Purchase Price (Rs.)" defaultValue={itemToEdit?.purchasePrice} required />
            <Input name="sellingPrice" type="number" step="0.01" placeholder="Selling Price (Rs.)" defaultValue={itemToEdit?.sellingPrice} required />
            {!itemToEdit && (
                <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" name="creditPurchase" className="bg-slate-700 rounded"/>
                    <span>Add this initial stock to supplier's credit balance</span>
                </label>
            )}
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">{itemToEdit ? 'Update Product' : 'Add Product'}</Button>
        </form>
    )
}

const RestockForm = ({ onSubmit, itemToRestock }: { onSubmit: (quantity: number, purchasePrice: number, onCredit: boolean) => Promise<void>, itemToRestock?: Product }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await onSubmit(
            Number(formData.get('quantity')),
            Number(formData.get('purchasePrice')),
            formData.get('creditPurchase') === 'on'
        );
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="quantity" type="number" placeholder="Quantity to Add" required />
            <Input name="purchasePrice" type="number" step="0.01" placeholder="Purchase Price (per item)" defaultValue={itemToRestock?.purchasePrice} required />
            <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" name="creditPurchase" className="bg-slate-700 rounded"/>
                <span>This is a credit purchase (update supplier balance)</span>
            </label>
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">Restock Product</Button>
        </form>
    );
};


const CustomerManagement = ({ customers, setCustomers, sales }: {
    customers: Customer[],
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>,
    sales: Sale[]
}) => {
    const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenAddEditModal = (customer?: Customer) => {
        setSelectedCustomer(customer);
        setAddEditModalOpen(true);
    };

    const handleOpenManageModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsManageModalOpen(true);
    };

    const handleCloseModals = () => {
        setSelectedCustomer(undefined);
        setAddEditModalOpen(false);
        setIsManageModalOpen(false);
    };

    const handleSubmit = async (data: Omit<Customer, 'id' | 'createdAt'>) => {
        try {
            if (selectedCustomer) { // Editing
                const updatedCustomer = { ...selectedCustomer, ...data };
                await db.customers.update(selectedCustomer.id, updatedCustomer);
                setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));
            } else { // Adding
                const newCustomer: Customer = { ...data, id: generateId(), createdAt: new Date().toISOString() };
                await db.customers.add(newCustomer);
                setCustomers(prev => [newCustomer, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (error) {
            console.error("Failed to save customer:", error);
            alert("Error: Could not save customer data.");
        }
        handleCloseModals();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await db.customers.delete(id);
                setCustomers(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Failed to delete customer:", error);
                alert("Error: Could not delete customer.");
            }
        }
    };

    const handlePayment = async (customerId: string, amount: number) => {
        try {
            await db.customers.where('id').equals(customerId).modify(customer => {
                customer.balance -= amount;
            });
            setCustomers(prev => prev.map(c => c.id === customerId ? {...c, balance: c.balance - amount} : c));
        } catch (error) {
            console.error("Failed to receive payment:", error);
            alert("Error: Could not process payment.");
        }
    };

    const filteredCustomers = useMemo(() => customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [customers, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3"><UsersIcon /> Customers</h1>
                <Button onClick={() => handleOpenAddEditModal()} className="bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2">
                    <PlusIcon /> Add New Customer
                </Button>
            </div>
            <Input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4" />

            <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700">
                    <tr>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Phone</th>
                        <th className="p-4 font-semibold">Balance (Udhaar)</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredCustomers.map(customer => (
                        <tr key={customer.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50">
                            <td className="p-4">{customer.name}</td>
                            <td className="p-4">{customer.phone}</td>
                            <td className={`p-4 font-bold ${customer.balance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{formatCurrency(customer.balance)}</td>
                            <td className="p-4 flex justify-end gap-2">
                                <Button onClick={() => handleOpenManageModal(customer)} className="bg-blue-600 hover:bg-blue-500 text-white">Manage</Button>
                                <Button onClick={() => handleOpenAddEditModal(customer)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white"><EditIcon /></Button>
                                <Button onClick={() => handleDelete(customer.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white"><TrashIcon /></Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddEditModalOpen} onClose={handleCloseModals} title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await handleSubmit({
                        name: formData.get('name') as string,
                        phone: formData.get('phone') as string,
                        address: formData.get('address') as string,
                        balance: selectedCustomer?.balance ?? 0,
                    });
                }} className="space-y-4">
                    <Input name="name" placeholder="Customer Name" defaultValue={selectedCustomer?.name} required />
                    <Input name="phone" placeholder="Phone Number" defaultValue={selectedCustomer?.phone} required />
                    <Input name="address" placeholder="Address" defaultValue={selectedCustomer?.address} required />
                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">{selectedCustomer ? 'Update Customer' : 'Add Customer'}</Button>
                </form>
            </Modal>

            <Modal isOpen={isManageModalOpen} onClose={handleCloseModals} title={`Manage: ${selectedCustomer?.name}`} size="2xl">
                {selectedCustomer && <ManageCustomerView customer={selectedCustomer} sales={sales} onReceivePayment={handlePayment} />}
            </Modal>
        </div>
    );
};

const ManageCustomerView = ({ customer, sales, onReceivePayment }: { customer: Customer, sales: Sale[], onReceivePayment: (id: string, amount: number) => Promise<void> }) => {
    const [amount, setAmount] = useState('');
    const customerSales = useMemo(() => sales.filter(s => s.customerId === customer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sales, customer.id]);

    const handlePayment = async () => {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            await onReceivePayment(customer.id, numAmount);
            setAmount('');
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                <div className="text-lg font-bold">Current Balance (Udhaar)</div>
                <div className="text-2xl font-bold text-yellow-400">{formatCurrency(customer.balance)}</div>
            </div>

            <div className="space-y-4">
                <h4 className="text-lg font-semibold">Receive Payment</h4>
                <div className="flex gap-2">
                    <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                    <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-500 text-white">Receive</Button>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold mb-2">Transaction History</h4>
                <div className="max-h-64 overflow-y-auto bg-slate-900 p-2 rounded-md">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-900">
                        <tr>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Total</th>
                            <th className="p-2 text-left">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {customerSales.map(sale => (
                            <tr key={sale.id} className="border-b border-slate-800 last:border-b-0">
                                <td className="p-2">{formatDate(sale.date)}</td>
                                <td className="p-2">{formatCurrency(sale.totalAmount)}</td>
                                <td className={`p-2 font-semibold ${sale.paymentStatus === 'unpaid' ? 'text-yellow-400' : 'text-green-400'}`}>{sale.paymentStatus}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


const SupplierManagement = ({ suppliers, setSuppliers }: { suppliers: Supplier[], setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>> }) => {
    const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenAddEditModal = (supplier?: Supplier) => {
        setSelectedSupplier(supplier);
        setAddEditModalOpen(true);
    };

    const handleOpenManageModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsManageModalOpen(true);
    };

    const handleCloseModals = () => {
        setSelectedSupplier(undefined);
        setAddEditModalOpen(false);
        setIsManageModalOpen(false);
    };

    const handleSubmit = async (data: Omit<Supplier, 'id' | 'createdAt'>) => {
        try {
            if (selectedSupplier) { // Editing
                const updatedSupplier = { ...selectedSupplier, ...data };
                await db.suppliers.update(selectedSupplier.id, updatedSupplier);
                setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? updatedSupplier : s));
            } else { // Adding
                const newSupplier: Supplier = { ...data, id: generateId(), createdAt: new Date().toISOString() };
                await db.suppliers.add(newSupplier);
                setSuppliers(prev => [newSupplier, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (error) {
            console.error("Failed to save supplier:", error);
            alert("Error: Could not save supplier data.");
        }
        handleCloseModals();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await db.suppliers.delete(id);
                setSuppliers(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                console.error("Failed to delete supplier:", error);
                alert("Error: Could not delete supplier.");
            }
        }
    };

    const handlePayment = async (supplierId: string, amount: number) => {
        try {
            await db.suppliers.where('id').equals(supplierId).modify(supplier => {
                supplier.balance -= amount;
            });
            setSuppliers(prev => prev.map(s => s.id === supplierId ? {...s, balance: s.balance - amount} : s));
        } catch (error) {
            console.error("Failed to make payment:", error);
            alert("Error: Could not process payment.");
        }
    };

    const filteredSuppliers = useMemo(() => suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [suppliers, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3"><TruckIcon /> Suppliers</h1>
                <Button onClick={() => handleOpenAddEditModal()} className="bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2">
                    <PlusIcon /> Add New Supplier
                </Button>
            </div>
            <Input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4" />

            <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700">
                    <tr>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Contact Person</th>
                        <th className="p-4 font-semibold">Balance (Payable)</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredSuppliers.map(supplier => (
                        <tr key={supplier.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50">
                            <td className="p-4">{supplier.name}</td>
                            <td className="p-4">{supplier.contactPerson}</td>
                            <td className={`p-4 font-bold ${supplier.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(supplier.balance)}</td>
                            <td className="p-4 flex justify-end gap-2">
                                <Button onClick={() => handleOpenManageModal(supplier)} className="bg-blue-600 hover:bg-blue-500 text-white">Manage</Button>
                                <Button onClick={() => handleOpenAddEditModal(supplier)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white"><EditIcon /></Button>
                                <Button onClick={() => handleDelete(supplier.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white"><TrashIcon /></Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddEditModalOpen} onClose={handleCloseModals} title={selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await handleSubmit({
                        name: formData.get('name') as string,
                        contactPerson: formData.get('contactPerson') as string,
                        phone: formData.get('phone') as string,
                        balance: selectedSupplier?.balance ?? 0,
                    });
                }} className="space-y-4">
                    <Input name="name" placeholder="Supplier Name" defaultValue={selectedSupplier?.name} required />
                    <Input name="contactPerson" placeholder="Contact Person" defaultValue={selectedSupplier?.contactPerson} required />
                    <Input name="phone" placeholder="Phone Number" defaultValue={selectedSupplier?.phone} required />
                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">{selectedSupplier ? 'Update Supplier' : 'Add Supplier'}</Button>
                </form>
            </Modal>

            <Modal isOpen={isManageModalOpen} onClose={handleCloseModals} title={`Manage: ${selectedSupplier?.name}`}>
                {selectedSupplier && <ManageSupplierView supplier={selectedSupplier} onMakePayment={handlePayment} />}
            </Modal>
        </div>
    );
};

const ManageSupplierView = ({ supplier, onMakePayment }: { supplier: Supplier, onMakePayment: (id: string, amount: number) => Promise<void> }) => {
    const [amount, setAmount] = useState('');

    const handlePayment = async () => {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            await onMakePayment(supplier.id, numAmount);
            setAmount('');
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                <div className="text-lg font-bold">Current Balance (Payable)</div>
                <div className="text-2xl font-bold text-red-400">{formatCurrency(supplier.balance)}</div>
            </div>

            <div className="space-y-4">
                <h4 className="text-lg font-semibold">Make Payment</h4>
                <div className="flex gap-2">
                    <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                    <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-500 text-white">Pay</Button>
                </div>
            </div>
            <p className="text-sm text-slate-400">Note: The history of purchases from this supplier is not yet tracked. This feature will be added in a future update.</p>
        </div>
    );
}


const Sales = ({ products, setProducts, customers, setCustomers, sales, setSales }: {
    products: Product[],
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
    customers: Customer[],
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>,
    sales: Sale[],
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>
}) => {
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const filteredProducts = useMemo(() =>
            products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0),
        [products, searchTerm]
    );

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    return prevCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                }
                alert('Cannot add more than available stock.');
                return prevCart;
            }
            return [...prevCart, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
            }];
        });
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        const product = products.find(p => p.id === productId);
        if(!product) return;

        if (quantity > product.stock) {
            alert('Cannot set quantity more than available stock.');
            quantity = product.stock;
        }

        setCart(prevCart => {
            if (quantity <= 0) {
                return prevCart.filter(item => item.productId !== productId);
            }
            return prevCart.map(item => item.productId === productId ? { ...item, quantity } : item);
        });
    };

    const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.sellingPrice * item.quantity, 0), [cart]);

    const handleCheckout = async (paymentStatus: 'paid' | 'unpaid') => {
        if (cart.length === 0) {
            alert('Cart is empty.');
            return;
        }

        if(paymentStatus === 'unpaid' && !selectedCustomerId){
            alert('Please select a customer for a credit (Udhaar) sale.');
            return;
        }

        const totalAmount = cartTotal;
        const totalCost = cart.reduce((total, item) => total + item.purchasePrice * item.quantity, 0);

        const newSale: Sale = {
            id: generateId(),
            customerId: selectedCustomerId,
            items: cart,
            totalAmount,
            totalCost,
            profit: totalAmount - totalCost,
            date: new Date().toISOString(),
            paymentStatus,
        };

        try {
            await db.transaction('rw', db.sales, db.products, db.customers, async () => {
                await db.sales.add(newSale);

                for (const cartItem of cart) {
                    await db.products.where('id').equals(cartItem.productId).modify(product => {
                        product.stock -= cartItem.quantity;
                    });
                }

                if (paymentStatus === 'unpaid' && selectedCustomerId) {
                    await db.customers.where('id').equals(selectedCustomerId).modify(customer => {
                        customer.balance += totalAmount;
                    });
                }
            });

            // If the transaction succeeds, update React state
            setSales(prev => [newSale, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            setProducts(prevProducts => {
                const updatedProducts = [...prevProducts];
                cart.forEach(cartItem => {
                    const productIndex = updatedProducts.findIndex(p => p.id === cartItem.productId);
                    if (productIndex !== -1) {
                        updatedProducts[productIndex].stock -= cartItem.quantity;
                    }
                });
                return updatedProducts;
            });

            if (paymentStatus === 'unpaid' && selectedCustomerId) {
                setCustomers(prevCustomers => prevCustomers.map(c =>
                    c.id === selectedCustomerId ? { ...c, balance: c.balance + totalAmount } : c
                ));
            }

            setCart([]);
            setSearchTerm('');
            setSelectedCustomerId(null);
            alert(`Sale completed as ${paymentStatus}!`);

        } catch (error) {
            console.error("Checkout failed:", error);
            alert("The sale could not be completed due to a database error. Please try again.");
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 flex-shrink-0"><ShoppingCartIcon/> Point of Sale</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                {/* Product List */}
                <div className="lg:col-span-2 bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col">
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4 flex-shrink-0"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 flex-grow">
                        {filteredProducts.map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="bg-slate-700 p-3 rounded-lg text-center cursor-pointer hover:bg-cyan-600 transition-colors flex flex-col justify-between">
                                <p className="font-semibold text-sm">{product.name}</p>
                                <p className="text-xs text-slate-400">{formatCurrency(product.sellingPrice)}</p>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && <p className="col-span-full text-center text-slate-400 py-8">No products match your search or all are out of stock.</p>}
                    </div>
                </div>

                {/* Cart */}
                <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col">
                    <div className="flex-shrink-0">
                        <h2 className="text-xl font-bold mb-4">Current Sale</h2>
                        <Select value={selectedCustomerId || ''} onChange={(e) => setSelectedCustomerId(e.target.value || null)} className="mb-4">
                            <option value="">Walk-in Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>

                    <div className="flex-grow overflow-y-auto -mr-4 pr-4 space-y-2 min-h-0">
                        {cart.length === 0 ? <p className="text-slate-400 text-center pt-10">Cart is empty</p> :
                            cart.map(item => (
                                <div key={item.productId} className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
                                    <div>
                                        <p className="font-semibold text-sm">{item.productName}</p>
                                        <p className="text-xs text-slate-300">{formatCurrency(item.sellingPrice)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value))}
                                            className="w-16 text-center"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                    <div className="border-t border-slate-700 mt-4 pt-4 flex-shrink-0">
                        <div className="flex justify-between items-center text-xl font-bold mb-4">
                            <span>Total</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handleCheckout('paid')} className="w-full bg-green-600 hover:bg-green-500 text-white text-lg">
                                Checkout (Paid)
                            </Button>
                            <Button onClick={() => handleCheckout('unpaid')} disabled={!selectedCustomerId} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-lg">
                                Save as Udhaar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Reports = ({ sales, customers, products }: { sales: Sale[], customers: Customer[], products: Product[] }) => {
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><BarChartIcon /> Sales Reports</h1>
            <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-700">
                        <tr>
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold">Customer</th>
                            <th className="p-4 font-semibold">Items</th>
                            <th className="p-4 font-semibold">Payment Status</th>
                            <th className="p-4 font-semibold">Total Amount</th>
                            <th className="p-4 font-semibold">Profit</th>
                            <th className="p-4 font-semibold text-right">Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sales.length > 0 ? sales.map(sale => (
                            <tr key={sale.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50">
                                <td className="p-4 whitespace-nowrap">{formatDate(sale.date)}</td>
                                <td className="p-4 whitespace-nowrap">{customers.find(c => c.id === sale.customerId)?.name || 'Walk-in'}</td>
                                <td className="p-4">{sale.items.length}</td>
                                <td className="p-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${sale.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{sale.paymentStatus}</span></td>
                                <td className="p-4 font-semibold">{formatCurrency(sale.totalAmount)}</td>
                                <td className="p-4 text-green-400">{formatCurrency(sale.profit)}</td>
                                <td className="p-4 text-right">
                                    <Button onClick={() => setSelectedSale(sale)} className="bg-slate-600 hover:bg-slate-500 text-white text-sm">
                                        View
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="text-center p-8 text-slate-400">No sales records found.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title={`Sale Details - ${selectedSale ? formatDate(selectedSale.date) : ''}`}>
                {selectedSale && (
                    <div className="space-y-4">
                        <p><strong>Customer:</strong> {customers.find(c => c.id === selectedSale.customerId)?.name || 'Walk-in'}</p>
                        <p><strong>Payment Status:</strong> <span className={`font-bold ${selectedSale.paymentStatus === 'unpaid' ? 'text-yellow-400':'text-green-400'}`}>{selectedSale.paymentStatus}</span></p>
                        <h4 className="font-bold border-t border-slate-600 pt-2">Items:</h4>
                        <ul className="space-y-2">
                            {selectedSale.items.map(item => (
                                <li key={item.productId} className="flex justify-between bg-slate-700 p-2 rounded">
                                    <span>{item.productName} x {item.quantity}</span>
                                    <span>{formatCurrency(item.sellingPrice * item.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t border-slate-600 pt-2 space-y-1">
                            <p className="flex justify-between"><strong>Total Cost:</strong> <span>{formatCurrency(selectedSale.totalCost)}</span></p>
                            <p className="flex justify-between"><strong>Total Sale:</strong> <span>{formatCurrency(selectedSale.totalAmount)}</span></p>
                            <p className="flex justify-between text-green-400 font-bold"><strong>Profit:</strong> <span>{formatCurrency(selectedSale.profit)}</span></p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};


// =================================================================================
// 5. MAIN APP COMPONENT
// =================================================================================

export const App = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsData, customersData, suppliersData, salesData] = await Promise.all([
                    db.products.toArray(),
                    db.customers.toArray(),
                    db.suppliers.toArray(),
                    db.sales.toArray(),
                ]);
                setProducts(productsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setCustomers(customersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setSuppliers(suppliersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setSales(salesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } catch (error) {
                console.error("Failed to load data from database", error);
                alert("Could not load data. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return <Dashboard products={products} sales={sales} customers={customers} suppliers={suppliers} />;
            case 'sales': return <Sales products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers} sales={sales} setSales={setSales} />;
            case 'stock': return <StockManagement products={products} setProducts={setProducts} suppliers={suppliers} setSuppliers={setSuppliers} />;
            case 'customers': return <CustomerManagement customers={customers} setCustomers={setCustomers} sales={sales}/>;
            case 'suppliers': return <SupplierManagement suppliers={suppliers} setSuppliers={setSuppliers} />;
            case 'reports': return <Reports sales={sales} customers={customers} products={products} />;
            default: return <Dashboard products={products} sales={sales} customers={customers} suppliers={suppliers} />;
        }
    };

    const navItems: { view: View, label: string, icon: React.ReactNode }[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { view: 'sales', label: 'POS', icon: <ShoppingCartIcon /> },
        { view: 'stock', label: 'Stock', icon: <PackageIcon /> },
        { view: 'customers', label: 'Customers', icon: <UsersIcon /> },
        { view: 'suppliers', label: 'Suppliers', icon: <TruckIcon /> },
        { view: 'reports', label: 'Reports', icon: <BarChartIcon /> },
    ];

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg">Loading Shop Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-900 text-white">
            <nav className="w-64 bg-slate-800 p-4 flex flex-col shadow-lg">
                <div className="text-2xl font-bold text-white mb-8 text-center">Dukaan Pro</div>
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.view}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setActiveView(item.view); }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                                    activeView === item.view ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};