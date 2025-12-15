
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge, Select } from '../components/UI';
import { Transaction, UserRole } from '../types';
import { Plus, Search, Printer, Filter, Download, UserPlus, Package, Truck, Phone, MapPin, Edit, FileEdit, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Transactions: React.FC = () => {
  const { transactions, products, quarries, customers, addTransaction, updateTransaction, saveCustomer, deleteTransaction } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  // 1. Available Quarries
  const availableQuarries = useMemo(() => {
    if (isAdmin) return quarries;
    return quarries.filter(q => q.ownerId === user?.id);
  }, [quarries, user, isAdmin]);

  // 2. Available Products (Active Only)
  // Admin sees all. Clerk sees only their own.
  const availableProducts = useMemo(() => {
    const activeProducts = products.filter(p => !p.isDeleted);
    if (isAdmin) return activeProducts;
    return activeProducts.filter(p => p.createdBy === user?.id);
  }, [products, user, isAdmin]);

  // Form State
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productId: '', // Added productId to link strictly
    productName: '',
    quarryName: '',
    quarryLocation: '', 
    rate: 0,
    quantity: 0,
    deposit: 0,
  });

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    
    setForm(prev => ({
        ...prev,
        customerName: name,
        // Auto-fill if customer exists
        customerPhone: existing ? existing.phone : prev.customerPhone,
        customerAddress: existing ? (existing.address || '') : prev.customerAddress
    }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    const selectedProduct = products.find(p => p.id === prodId);

    if (selectedProduct) {
        // Auto-fill Name and Rate (Current Price) based on selection
        setForm(prev => ({ 
            ...prev, 
            productId: selectedProduct.id,
            productName: selectedProduct.name, 
            rate: selectedProduct.currentPrice 
        }));
    } else {
         setForm(prev => ({ ...prev, productId: '', productName: '', rate: 0 }));
    }
  };

  const handleQuarryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const existing = quarries.find(q => q.name.toLowerCase() === name.toLowerCase());
    setForm(prev => ({
        ...prev,
        quarryName: name,
        quarryLocation: existing ? existing.location : ''
    }));
  };

  const openModal = (tx?: Transaction) => {
    if (tx) {
        // Edit Mode
        setEditingId(tx.id);
        const existingCust = customers.find(c => c.id === tx.customerId);
        
        setForm({
            customerName: tx.customerName,
            customerPhone: tx.customerPhone || (existingCust ? existingCust.phone : ''),
            customerAddress: tx.shippingAddress || (existingCust ? (existingCust.address || '') : ''),
            productId: tx.productId,
            productName: tx.productName,
            quarryName: tx.quarryName,
            quarryLocation: tx.quarryLocation || '',
            rate: tx.rate,
            quantity: tx.quantity,
            deposit: tx.deposit,
        });
    } else {
        // Create Mode
        setEditingId(null);
        setForm({ 
            customerName: '', customerPhone: '', customerAddress: '',
            productId: '', productName: '', quarryName: '', quarryLocation: '', rate: 0, quantity: 0, deposit: 0 
        });
    }
    setIsModalOpen(true);
  };

  const totalCost = form.rate * form.quantity;
  const balance = totalCost - form.deposit;

  // Validation Check
  const isFormValid = 
    form.customerName.trim() !== '' &&
    form.productId !== '' && // Must have selected a product from dropdown
    form.quarryName.trim() !== '' &&
    form.rate > 0 &&
    form.quantity > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
        // 1. Resolve Customer (Find or Create)
        let targetCustomer = customers.find(c => c.name.toLowerCase() === form.customerName.trim().toLowerCase());
        
        if (!targetCustomer && form.customerName.trim()) {
            const newId = Date.now().toString();
            targetCustomer = {
                id: newId,
                name: form.customerName.trim(),
                phone: form.customerPhone.trim(),
                address: form.customerAddress.trim(),
                transactionCount: 0,
            };
            await saveCustomer(targetCustomer);
        } else if (targetCustomer) {
            // Update address/phone if changed for existing customer
            if (targetCustomer.address !== form.customerAddress || targetCustomer.phone !== form.customerPhone) {
                await saveCustomer({
                    ...targetCustomer,
                    phone: form.customerPhone,
                    address: form.customerAddress
                });
            }
        }

        // 2. Resolve Quarry (Find or Create)
        const existingQuarry = quarries.find(q => q.name.toLowerCase() === form.quarryName.trim().toLowerCase());
        const quarryId = existingQuarry ? existingQuarry.id : `QUARRY_${Date.now()}`;
        const quarryName = existingQuarry ? existingQuarry.name : form.quarryName;

        if (targetCustomer && form.productId && quarryName) {
            
            if (editingId) {
                // UPDATE
                const originalTx = transactions.find(t => t.id === editingId);
                if (originalTx) {
                    const updatedTx: Transaction = {
                        ...originalTx,
                        customerId: targetCustomer.id,
                        customerName: targetCustomer.name,
                        customerPhone: form.customerPhone,
                        shippingAddress: form.customerAddress,
                        productId: form.productId,
                        productName: form.productName,
                        quarryId: quarryId,
                        quarryName: quarryName,
                        quarryLocation: form.quarryLocation,
                        rate: form.rate,
                        quantity: form.quantity,
                        totalCost,
                        deposit: form.deposit,
                        balance,
                    };
                    await updateTransaction(updatedTx);
                }
            } else {
                // CREATE
                const newTx: Transaction = {
                    id: Date.now().toString(),
                    refNo: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
                    customerId: targetCustomer.id,
                    customerName: targetCustomer.name,
                    customerPhone: form.customerPhone,
                    shippingAddress: form.customerAddress,
                    productId: form.productId,
                    productName: form.productName,
                    quarryId: quarryId,
                    quarryName: quarryName,
                    quarryLocation: form.quarryLocation,
                    rate: form.rate,
                    quantity: form.quantity,
                    totalCost,
                    deposit: form.deposit,
                    balance,
                    createdBy: user.id,
                    createdByName: user.name,
                    date: new Date().toISOString()
                };
                await addTransaction(newTx);
            }
            
            setIsModalOpen(false);
        }
    } catch (error) {
        console.error("Failed to process transaction:", error);
        alert("Failed to save transaction. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
        await deleteTransaction(id);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.refNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
             <h1 className="text-2xl font-bold text-stone-900">Transactions</h1>
             <p className="text-stone-500 text-sm mt-1">Manage sales and view history.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Button variant="secondary" className="hidden sm:flex justify-center">
                 <Download className="h-4 w-4 mr-2" /> Export
             </Button>
             <Button onClick={() => openModal()} className="w-full sm:w-auto flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white shadow-glow justify-center">
                <Plus className="h-4 w-4 mr-2" /> New Sale
             </Button>
        </div>
      </div>

      <Card className="flex flex-col border-none shadow-soft" noPadding>
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-50/30">
          <div className="w-full sm:w-96 relative">
            <Input 
              icon={Search}
              placeholder="Search customer, ref number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="text-stone-500 w-full sm:w-auto justify-center"><Filter className="h-4 w-4 mr-2"/> Filter</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-stone-100">
            <thead className="bg-stone-50/50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Reference</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Customer</th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Details</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Amount</th>
                <th className="hidden sm:table-cell px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/80 transition-all duration-200 group">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-800 font-mono bg-stone-100 w-fit px-2 py-0.5 rounded text-[10px] mb-1">{tx.refNo}</span>
                        <span className="text-xs text-stone-400">{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-700">
                    {tx.customerName}
                    {/* Mobile Only Details Preview */}
                    <div className="sm:hidden text-xs text-stone-400 mt-1">{tx.productName} ({tx.quantity}t)</div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-900">{tx.productName}</div>
                      <div className="text-xs text-stone-500">{tx.quantity} tons @ {tx.rate}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-stone-900 text-right font-bold">₦{tx.totalCost.toLocaleString()}</td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-right">
                    {tx.balance > 0 ? (
                      <Badge color="red">Due: ₦{tx.balance.toLocaleString()}</Badge>
                    ) : (
                      <Badge color="green">Paid</Badge>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center items-center gap-2 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => openModal(tx)}
                            className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                            title="Edit Transaction"
                        >
                        <FileEdit className="h-4 w-4" />
                        </button>
                         <button 
                            onClick={() => navigate(`/receipt/${tx.id}`)}
                            className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" 
                            title="View Receipt"
                        >
                        <Printer className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                            title="Delete Transaction"
                        >
                        <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                  <div className="bg-stone-100 p-4 rounded-full mb-3">
                    <Search className="h-6 w-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No transactions found.</p>
              </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Sale ✏️" : "New Sale ✨"}>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Logistics Section - Styled like Receipt */}
          <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-100">
             <div className="flex items-center gap-2 mb-4">
                <Truck className="h-4 w-4 text-stone-400" />
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Logistics & Shipping</h4>
             </div>
             
             {/* Updated Grid: Stack on Medium (md), Split on Large (lg) */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                {/* Visual Connector Line for Desktop */}
                <div className="hidden lg:block absolute left-1/2 top-10 bottom-4 w-px bg-stone-200/50 -translate-x-1/2"></div>
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 bg-stone-100 rounded-full items-center justify-center text-stone-400 z-10">
                    <ArrowRight className="h-3 w-3" />
                </div>

                {/* Left: Source (Quarry) */}
                <div className="space-y-4">
                    <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">From (Source)</div>
                    <div className="relative">
                        <Input 
                        label="Quarry Name" 
                        list="quarry-suggestions"
                        placeholder={isAdmin ? "Select any quarry..." : "Select from your sites..."}
                        value={form.quarryName}
                        onChange={handleQuarryChange}
                        icon={Truck}
                        required
                        className="font-bold"
                        />
                        <datalist id="quarry-suggestions">
                            {/* Filtered suggestions based on user role */}
                            {availableQuarries.map(q => <option key={q.id} value={q.name} />)}
                        </datalist>
                    </div>
                    {/* From Location Input */}
                    <Input 
                        label="Source Location"
                        placeholder="Quarry Address..."
                        value={form.quarryLocation}
                        onChange={(e) => setForm({...form, quarryLocation: e.target.value})}
                        icon={MapPin}
                        className="text-sm"
                    />
                </div>

                {/* Right: Destination (Customer) */}
                <div className="space-y-4">
                    <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">To (Destination)</div>
                    <div className="relative">
                        <Input 
                            label="Customer Name"
                            list="customer-suggestions"
                            placeholder="Select customer..."
                            value={form.customerName}
                            onChange={handleCustomerChange}
                            icon={UserPlus}
                            required
                            className="font-bold"
                        />
                        <datalist id="customer-suggestions">
                            {customers.map(c => <option key={c.id} value={c.name} />)}
                        </datalist>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Input 
                            label="Phone"
                            placeholder="080..."
                            value={form.customerPhone}
                            onChange={(e) => setForm({...form, customerPhone: e.target.value})}
                            className="text-sm"
                        />
                         <div className="col-span-2">
                            <Input 
                                label="Shipping Address"
                                placeholder="Delivery location..."
                                value={form.customerAddress}
                                onChange={(e) => setForm({...form, customerAddress: e.target.value})}
                                icon={MapPin}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>
             </div>
          </div>

          {/* Order Details */}
          <div>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">Order Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
                <div className="sm:col-span-2 lg:col-span-6">
                    <Select
                        label="Select Product"
                        options={availableProducts.map(p => ({
                            label: `${p.name} (₦${p.currentPrice.toLocaleString()})`,
                            value: p.id
                        }))}
                        value={form.productId}
                        onChange={handleProductChange}
                        required
                    />
                    {availableProducts.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No products found. Please add products first.</p>
                    )}
                </div>
                <div className="sm:col-span-1 lg:col-span-3">
                    <Input 
                        label="Rate (₦)" 
                        type="number" 
                        value={form.rate} 
                        onChange={(e) => setForm({...form, rate: Number(e.target.value)})} 
                        required
                        disabled={true} // Auto-filled from Price Mapping
                        className="bg-stone-100"
                    />
                </div>
                <div className="sm:col-span-1 lg:col-span-3">
                    <Input 
                        label="Quantity (Tons)" 
                        type="number" 
                        value={form.quantity} 
                        onChange={(e) => setForm({...form, quantity: Number(e.target.value)})} 
                        required
                    />
                </div>
            </div>
          </div>
          
          {/* Payment Section */}
          <div className="p-5 bg-gradient-to-br from-stone-50 to-white rounded-2xl border border-stone-100 shadow-sm">
             <div className="flex justify-between text-sm mb-3 text-stone-600">
                 <span className="font-medium">Subtotal</span>
                 <span className="font-bold text-stone-900 text-lg">₦{totalCost.toLocaleString()}</span>
             </div>
             <div className="h-px bg-stone-200 my-3"></div>
             <div className="grid grid-cols-2 gap-4 items-center">
                 <div className="col-span-2 sm:col-span-1">
                     <Input 
                        label="Deposit Paid" 
                        type="number" 
                        value={form.deposit} 
                        onChange={(e) => setForm({...form, deposit: Number(e.target.value)})} 
                        required
                        className="bg-white shadow-sm"
                    />
                 </div>
                 <div className="col-span-2 sm:col-span-1 text-right bg-stone-100/50 p-2 rounded-xl">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1">Balance Due</div>
                      <div className={`text-xl font-black ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          ₦{balance.toLocaleString()}
                      </div>
                 </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !isFormValid} className="shadow-lg shadow-primary-500/30">
                {submitting ? 'Processing...' : (editingId ? 'Update Sale' : 'Complete Sale')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
