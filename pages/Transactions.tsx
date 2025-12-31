
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge, Select } from '../components/UI';
import { Transaction, UserRole, Customer } from '../types';
import { 
  Plus, Search, Printer, Trash2, UserPlus, Truck, MapPin, 
  FileEdit, Package, AlertCircle, Mail, DollarSign, 
  TrendingUp, Info, MapPinned, Wallet, Receipt as ReceiptIcon, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Transactions: React.FC = () => {
  const { transactions, products, quarries, customers, quarryPrices, addTransaction, updateTransaction, deleteTransaction } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const visibleTransactions = useMemo(() => {
    if (!user) return [];
    const base = isAdmin ? transactions : transactions.filter(t => t.createdBy === user.id);
    return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user, isAdmin]);

  const availableQuarries = useMemo(() => 
    isAdmin ? quarries : quarries.filter(q => q.ownerId === user?.id),
    [quarries, user, isAdmin]
  );

  const availableProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);
  const availableCustomers = useMemo(() => 
    isAdmin ? customers : customers.filter(c => c.createdBy === user?.id),
    [customers, user, isAdmin]
  );

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    destinationAddress: '',
    productId: '', 
    productName: '',
    quarryId: '',
    quarryName: '',
    quarryLocation: '', 
    purchasePrice: 0, // Unit rate from quarry
    salesPrice: 0,    // User inputs total sales amount here
    quantity: 0,
    deposit: 0,
  });

  // Financial Calculations
  const totalPurchaseCost = (form.purchasePrice || 0) * (form.quantity || 0);
  const totalInvoiceValue = (form.salesPrice || 0); // Sales price is now the total
  const currentProfit = totalInvoiceValue - totalPurchaseCost;
  const currentBalance = totalInvoiceValue - (form.deposit || 0);
  
  // Validation: Sales Total must not be less than Total Purchase Cost
  const isPriceInvalid = totalInvoiceValue > 0 && totalInvoiceValue < totalPurchaseCost;

  const filteredProducts = useMemo(() => {
      if (!form.quarryId) return [];
      const pricedProductIds = quarryPrices.filter(qp => qp.quarryId === form.quarryId).map(qp => qp.productId);
      return availableProducts.filter(p => pricedProductIds.includes(p.id));
  }, [form.quarryId, availableProducts, quarryPrices]);

  useEffect(() => {
      if (form.quarryId && form.productId) {
          const match = quarryPrices.find(qp => qp.quarryId === form.quarryId && qp.productId === form.productId);
          if (match) {
              setForm(prev => ({ 
                ...prev, 
                purchasePrice: match.price,
              }));
          } else {
              setForm(prev => ({ ...prev, purchasePrice: 0 }));
          }
      }
  }, [form.quarryId, form.productId, quarryPrices]);

  const handleCustomerSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    const existing = availableCustomers.find(c => c.id === cId);
    if (existing) {
        setForm(prev => ({
            ...prev,
            customerId: existing.id,
            customerName: existing.name,
            customerPhone: existing.phone,
            customerEmail: existing.email || ''
        }));
    }
  };

  const handleQuarrySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const qId = e.target.value;
      const q = availableQuarries.find(item => item.id === qId);
      if (q) {
          setForm(prev => ({ 
            ...prev, 
            quarryId: q.id, 
            quarryName: q.name, 
            quarryLocation: q.location,
            productId: '', 
            productName: '',
            purchasePrice: 0,
            salesPrice: 0
          }));
      }
  };

  const handleProductSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pId = e.target.value;
      const p = availableProducts.find(item => item.id === pId);
      if (p) {
          setForm(prev => ({ ...prev, productId: p.id, productName: p.name }));
      }
  };

  const openModal = (tx?: Transaction) => {
    if (tx) {
        setEditingId(tx.id);
        setForm({
            customerId: tx.customerId,
            customerName: tx.customerName,
            customerPhone: tx.customerPhone || '',
            customerEmail: tx.customerEmail || '',
            destinationAddress: tx.destinationAddress || '',
            productId: tx.productId,
            productName: tx.productName,
            quarryId: tx.quarryId,
            quarryName: tx.quarryName,
            quarryLocation: tx.quarryLocation || '',
            purchasePrice: tx.purchasePrice || 0,
            salesPrice: tx.salesPrice || 0,
            quantity: tx.quantity,
            deposit: tx.deposit,
        });
    } else {
        setEditingId(null);
        setForm({ 
            customerId: '', customerName: '', customerPhone: '', customerEmail: '', destinationAddress: '',
            productId: '', productName: '', quarryId: '', quarryName: '', quarryLocation: '', 
            purchasePrice: 0, salesPrice: 0, quantity: 0, deposit: 0 
        });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isPriceInvalid) return;
    
    setSubmitting(true);
    try {
        const newTx: Transaction = {
            id: editingId || Date.now().toString(),
            refNo: editingId ? transactions.find(t => t.id === editingId)!.refNo : `TX-${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: form.customerId,
            customerName: form.customerName,
            customerPhone: form.customerPhone,
            customerEmail: form.customerEmail,
            destinationAddress: form.destinationAddress,
            productId: form.productId,
            productName: form.productName,
            quarryId: form.quarryId,
            quarryName: form.quarryName,
            quarryLocation: form.quarryLocation,
            purchasePrice: form.purchasePrice,
            salesPrice: totalInvoiceValue, // Saving the total amount
            quantity: form.quantity,
            totalInvoice: totalInvoiceValue,
            profit: currentProfit,
            deposit: form.deposit,
            balance: currentBalance,
            createdBy: user.id,
            createdByName: user.name,
            date: editingId ? transactions.find(t => t.id === editingId)!.date : new Date().toISOString()
        };

        if (editingId) await updateTransaction(newTx);
        else await addTransaction(newTx);
        setIsModalOpen(false);
    } finally {
        setSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => 
    visibleTransactions.filter(t => t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || t.refNo.toLowerCase().includes(searchTerm.toLowerCase())),
    [visibleTransactions, searchTerm]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
             <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Sales & Ledger</h1>
             <p className="text-stone-500 text-sm mt-1">Record sales and monitor customer debt balances.</p>
        </div>
        <Button onClick={() => openModal()} className="shadow-glow px-6 py-3 rounded-2xl"><Plus className="h-4 w-4 mr-2" /> New Transaction</Button>
      </div>

      <Card noPadding className="border-none shadow-soft">
        <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center gap-4">
            <Input icon={Search} placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white max-w-sm" />
            <div className="hidden sm:flex items-center gap-6 ml-auto">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Total Sales</span>
                    <span className="text-sm font-bold text-stone-800">₦{(visibleTransactions.reduce((a, b) => a + (b.totalInvoice || 0), 0)).toLocaleString()}</span>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-stone-100 text-sm">
            <thead className="bg-stone-50/80">
              <tr>
                <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest text-[10px]">Reference</th>
                <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest text-[10px]">Customer</th>
                <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest text-[10px]">Product / Source</th>
                <th className="px-6 py-4 text-right font-black text-stone-400 uppercase tracking-widest text-[10px]">Invoice Total</th>
                <th className="px-6 py-4 text-right font-black text-stone-400 uppercase tracking-widest text-[10px]">Debt/Balance</th>
                <th className="px-6 py-4 text-center font-black text-stone-400 uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/80 transition-all group cursor-pointer" onClick={() => { setSelectedTx(tx); setIsDetailModalOpen(true); }}>
                  <td className="px-6 py-4">
                      <div className="font-mono font-black text-stone-800 text-xs bg-stone-100 px-2.5 py-1 rounded-lg w-fit mb-1">{tx.refNo}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="font-bold text-stone-800">{tx.customerName}</div>
                      <div className="text-[10px] text-stone-400">{tx.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="text-xs font-black text-stone-800 uppercase">{tx.productName}</div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1 font-bold"><Truck className="h-3 w-3" /> {tx.quarryName}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="font-black text-stone-900 font-mono">₦{(tx.totalInvoice || 0).toLocaleString()}</div>
                      <div className="text-[9px] text-stone-400 font-bold">{(tx.quantity || 0).toLocaleString()} Tons</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-black font-mono ${(tx.balance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ₦{(tx.balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openModal(tx)} className="p-2 text-stone-400 hover:text-blue-600 transition-colors"><FileEdit className="h-4 w-4" /></button>
                        <button onClick={() => navigate(`/receipt/${tx.id}`)} className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"><Printer className="h-4 w-4" /></button>
                        <button onClick={() => deleteTransaction(tx.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Main Entry Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Update Transaction" : "New Sales Entry"}
        maxWidth="sm:max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logistics Area */}
            <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                           <MapPinned className="h-4 w-4" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Supply Source</h4>
                    </div>
                    
                    <Select label="Pick-up Quarry" value={form.quarryId} onChange={handleQuarrySelection} options={availableQuarries.map(q => ({ label: q.name, value: q.id }))} required />
                    <Select label="Material Type" value={form.productId} onChange={handleProductSelection} options={filteredProducts.map(p => ({ label: p.name, value: p.id }))} required disabled={!form.quarryId} />
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                           <Truck className="h-4 w-4" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Load Calculation</h4>
                    </div>
                    
                    {/* Quantity comes before purchase info as requested */}
                    <Input label="Quantity to Move (Tons)" type="number" value={form.quantity || ''} onChange={(e) => setForm({...form, quantity: Number(e.target.value)})} required placeholder="0" className="bg-white font-black text-lg" />
                    
                    <div className="p-4 bg-white rounded-2xl border border-indigo-100 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-bold text-stone-400 uppercase">Purchase Rate</span>
                            <div className="text-sm font-black text-stone-800">₦{(form.purchasePrice || 0).toLocaleString()}/ton</div>
                        </div>
                        <div className="h-8 w-px bg-stone-100"></div>
                        <div className="text-right">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">Total Purchase Cost</span>
                            {/* Fix: use totalPurchaseCost instead of totalPurchaseAmount which was not defined */}
                            <div className="text-sm font-black text-indigo-600">₦{totalPurchaseCost.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buyer Area */}
            <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-stone-900 rounded-xl flex items-center justify-center text-white">
                           <UserPlus className="h-4 w-4" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Recipient Details</h4>
                    </div>

                    <Select label="Select Customer" value={form.customerId} onChange={handleCustomerSelection} options={availableCustomers.map(c => ({ label: c.name, value: c.id }))} required />
                    <Input label="Delivery Site Address" value={form.destinationAddress} onChange={(e) => setForm({...form, destinationAddress: e.target.value})} icon={MapPin} placeholder="Enter destination..." className="bg-white" required />
                </div>

                <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100/50 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                           <DollarSign className="h-4 w-4" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Total Sales Value</h4>
                    </div>
                    <Input 
                        label="Sales Price (₦)" 
                        type="number" 
                        value={form.salesPrice || ''} 
                        onChange={(e) => setForm({...form, salesPrice: Number(e.target.value)})} 
                        required 
                        placeholder="Enter total sale amount"
                        className={`bg-white font-mono font-black text-xl ${isPriceInvalid ? 'ring-2 ring-red-500/50' : 'border-emerald-200'}`} 
                    />
                    {isPriceInvalid && (
                        <p className="text-[10px] text-red-600 font-bold uppercase animate-pulse flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Error: Sales price cannot be less than total purchase cost (₦{totalPurchaseCost.toLocaleString()})
                        </p>
                    )}
                </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 bg-stone-100 rounded-[2.5rem] border border-stone-200 flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Invoice Amount</span>
                  <div className="text-3xl font-black font-mono text-stone-900 leading-none">₦{(totalInvoiceValue || 0).toLocaleString()}</div>
                  <div className="mt-3 text-[10px] font-bold text-stone-400 uppercase">
                     Yield: <span className={currentProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}>₦{(currentProfit || 0).toLocaleString()}</span>
                  </div>
              </div>
              <div className="p-6 bg-white rounded-[2.5rem] border border-stone-200 flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Amount Paid (₦)</span>
                  <input type="number" value={form.deposit || ''} onChange={(e) => setForm({...form, deposit: Number(e.target.value)})} className="w-full text-2xl font-black font-mono text-emerald-600 border-none bg-transparent focus:ring-0 p-0" placeholder="0.00" />
              </div>
              <div className="p-6 bg-stone-900 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Debt Balance</span>
                  <div className={`text-3xl font-black font-mono leading-none ${currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₦{(currentBalance || 0).toLocaleString()}</div>
              </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-100">
            <Button type="button" variant="ghost" className="px-10 rounded-2xl" onClick={() => setIsModalOpen(false)}>Discard</Button>
            <Button type="submit" fullWidth disabled={submitting || !form.customerId || !form.productId || form.quantity <= 0 || isPriceInvalid} className="rounded-2xl shadow-glow h-16 text-xl">
                {submitting ? 'Syncing...' : 'Commit Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Transaction Record Overview" maxWidth="sm:max-w-3xl">
          {selectedTx && (
            <div className="space-y-8 pb-4">
                <div className="flex justify-between items-center border-b pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge color="blue">{selectedTx.refNo}</Badge>
                            <span className="text-xs font-bold text-stone-400 uppercase">{new Date(selectedTx.date).toLocaleDateString()}</span>
                        </div>
                        <h2 className="text-3xl font-black text-stone-900 leading-tight">Sale Record Breakdown</h2>
                    </div>
                    {selectedTx.balance > 0 ? <Badge color="red">DEBT OWED</Badge> : <Badge color="green">FULLY PAID</Badge>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                         <h4 className="text-[10px] font-black uppercase text-stone-400 mb-4">Billing & Route</h4>
                         <div className="space-y-3">
                             <div>
                                 <p className="text-sm font-bold text-stone-900">{selectedTx.customerName}</p>
                                 <p className="text-xs text-stone-500">{selectedTx.customerPhone}</p>
                             </div>
                             <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                                 <MapPin className="h-3.5 w-3.5" /> {selectedTx.destinationAddress}
                             </div>
                         </div>
                    </div>
                    <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                         <h4 className="text-[10px] font-black uppercase text-stone-400 mb-4">Supply Data</h4>
                         <div className="space-y-3">
                             <div>
                                 <p className="text-sm font-bold text-stone-900">{selectedTx.quarryName}</p>
                                 <p className="text-xs text-stone-500">{selectedTx.quarryLocation}</p>
                             </div>
                             <div className="text-xs font-black text-primary-600 uppercase">
                                 {selectedTx.productName} • {(selectedTx.quantity || 0).toLocaleString()} Tons
                             </div>
                         </div>
                    </div>
                </div>

                <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Invoice Total</span>
                            <span className="text-2xl font-black font-mono">₦{(selectedTx.totalInvoice || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Total Paid</span>
                            <span className="text-2xl font-black font-mono text-emerald-400">₦{(selectedTx.deposit || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Outstanding</span>
                            <span className={`text-2xl font-black font-mono ${selectedTx.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₦{(selectedTx.balance || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Transaction Profit</span>
                            <span className="text-2xl font-black font-mono text-indigo-400">₦{(selectedTx.profit || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button variant="secondary" fullWidth size="lg" className="rounded-2xl" onClick={() => navigate(`/receipt/${selectedTx.id}`)}>
                        <Printer className="h-4 w-4 mr-2" /> Print Receipt
                    </Button>
                    <Button fullWidth size="lg" className="rounded-2xl shadow-glow" onClick={() => setIsDetailModalOpen(false)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Finish View
                    </Button>
                </div>
            </div>
          )}
      </Modal>
    </div>
  );
};
