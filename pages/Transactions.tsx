
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge, Select } from '../components/UI';
import { Transaction, UserRole, TransactionItem } from '../types';
import {
  Plus, Search, Printer, Trash2, UserPlus, Truck, MapPin, Phone, Mail,MessageCircle ,
  FileEdit, Package, DollarSign, MapPinned, CheckCircle, CircleDollarSign,
  Calculator, User, Scale, UserCheck, CreditCard, X, AlertTriangle,
  Download, Filter, Calendar, FileSpreadsheet, RefreshCw, BarChart3, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EMPTY_ITEM: TransactionItem = {
  productId: '',
  productName: '',
  quarryId: '',
  quarryName: '',
  quarryLocation: '',
  truckPlateNumber: '',
  driverName: '',
  purchasePrice: 0,
  totalPurchaseCost: 0,
  salesPrice: 0,
  quantity: 0,
  transportCost: 0,
  otherExpenses: 0,
  totalInvoice: 0,
  subtotal: 0,
  profit: 0
};

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

  // Filter States
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = user?.role === UserRole.ADMIN;

  // 1. Initial Visibility Filter (Clerk vs Admin)
  const baseTransactions = useMemo(() => {
    if (!user) return [];
    return isAdmin ? transactions : transactions.filter(t => t.createdBy === user.id);
  }, [transactions, user, isAdmin]);

  // 2. Advanced Filtering Logic
  const filteredTransactions = useMemo(() => {
    return baseTransactions
      .filter(t => {
        // Customer Search / Reference Search
        const matchesSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.refNo.toLowerCase().includes(searchTerm.toLowerCase());

        // Customer Dropdown Filter
        const matchesCustomer = !filterCustomerId || t.customerId === filterCustomerId;

        // Date Range Filter
        const txDate = new Date(t.date).getTime();
        const matchesStart = !filterStartDate || txDate >= new Date(filterStartDate).setHours(0, 0, 0, 0);
        const matchesEnd = !filterEndDate || txDate <= new Date(filterEndDate).setHours(23, 59, 59, 999);

        return matchesSearch && matchesCustomer && matchesStart && matchesEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [baseTransactions, searchTerm, filterCustomerId, filterStartDate, filterEndDate]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCustomerId, filterStartDate, filterEndDate]);

  // 3. Filtered Totals for Summary Display
  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => ({
      revenue: acc.revenue + (Number(t.totalInvoice) || 0),
      tonnage: acc.tonnage + (Number(t.quantity) || 0),
      profit: acc.profit + (Number(t.profit) || 0),
      count: acc.count + 1
    }), { revenue: 0, tonnage: 0, profit: 0, count: 0 });
  }, [filteredTransactions]);

  const availableQuarries = useMemo(() =>
    isAdmin ? quarries : quarries.filter(q => q.ownerId === user?.id || !q.ownerId),
    [quarries, user, isAdmin]
  );

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
    items: [{ ...EMPTY_ITEM }] as TransactionItem[],
    deposit: 0,
  });

  const openingStanding = useMemo(() => {
    if (!form.customerId) return 0;
    return transactions
      .filter(t => t.customerId === form.customerId && t.id !== editingId)
      .reduce((sum, t) => sum + ((t.deposit || 0) - (t.totalInvoice || 0)), 0);
  }, [form.customerId, transactions, editingId]);

  const formTotals = useMemo(() => {
    const invoice = form.items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const cost = form.items.reduce((sum, item) => sum + (Number(item.totalPurchaseCost) || 0), 0);
    const qty = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const profit = form.items.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
    return { invoice, cost, qty, profit };
  }, [form.items]);

  const closingBalance = openingStanding - formTotals.invoice + form.deposit;

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    // Build headers conditionally
    const headers = ["Date", "Ref No", "Customer", "Items", "Qty (Tons)", "Total Invoice (N)", "Balance (N)"];
    if (isAdmin) headers.push("Clerk");

    // Build rows conditionally
    const rows = filteredTransactions.map(t => {
      const baseRow = [
        new Date(t.date).toLocaleDateString(),
        t.refNo,
        t.customerName,
        t.items?.length || 0,
        t.quantity,
        t.totalInvoice,
        t.balance
      ];
      if (isAdmin) baseRow.push(t.createdByName || 'N/A');
      return baseRow;
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProductsForQuarry = (quarryId: string) => {
    if (!quarryId) return [];
    const pricedProductIds = quarryPrices
      .filter(qp => qp.quarryId === quarryId)
      .map(qp => qp.productId);
    return products.filter(p => !p.isDeleted && pricedProductIds.includes(p.id));
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    const newItems = [...form.items];
    newItems.splice(index, 1);
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const updateItem = (index: number, updates: Partial<TransactionItem>) => {
    const newItem = { ...form.items[index], ...updates };

    const qty = parseFloat(newItem.quantity?.toString() || '0');
    const salesPrice = parseFloat(newItem.salesPrice?.toString() || '0');
    const purchasePrice = parseFloat(newItem.purchasePrice?.toString() || '0');

    const totalPurchaseCost = qty * purchasePrice;

    // Calculate Total Sales + Costs
    const transport = newItem.transportCost || 0;
    const expenses = newItem.otherExpenses || 0;
    const totalInvoice = qty * salesPrice;
    const subtotal = totalInvoice + transport + expenses;

    const profit = (salesPrice - purchasePrice) * qty;

    const updatedItem = {
      ...newItem,
      totalPurchaseCost,
      totalInvoice,
      subtotal,
      profit
    };

    const newItems = [...form.items];
    newItems[index] = updatedItem;
    setForm({ ...form, items: newItems });
  };

  const handleQuarrySelect = (index: number, quarryId: string) => {
    const quarry = quarries.find(item => item.id === quarryId);
    if (quarry) {
      updateItem(index, {
        quarryId: quarryId,
        quarryName: quarry.name,
        quarryLocation: quarry.location,
        productId: '',
        productName: '',
        purchasePrice: 0,
        salesPrice: 0,
        quantity: 0
      });
    }
  };

  const handleProductSelect = (index: number, pId: string) => {
    const p = products.find(item => item.id === pId);
    if (p) {
      const item = form.items[index];
      const match = quarryPrices.find(qp => qp.quarryId === item.quarryId && qp.productId === p.id);
      updateItem(index, {
        productId: p.id,
        productName: p.name,
        purchasePrice: match ? match.price : 0
      });
    }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = availableCustomers.find(item => item.id === e.target.value);
    if (c) {
      setForm(prev => ({
        ...prev,
        customerId: c.id,
        customerName: c.name,
        customerPhone: c.phone,
        customerEmail: c.email || ''
      }));
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
        items: tx.items || [],
        deposit: tx.deposit,
      });
    } else {
      setEditingId(null);
      setForm({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        destinationAddress: '',
        items: [{ ...EMPTY_ITEM }],
        deposit: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const hasInvalidPrices = form.items.some(i => i.salesPrice < i.purchasePrice);
    if (hasInvalidPrices) {
      alert("One or more items have a Sales Price lower than the Purchase Rate. Please correct this.");
      return;
    }

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
        items: form.items,
        totalInvoice: formTotals.invoice,
        totalPurchaseCost: formTotals.cost,
        quantity: formTotals.qty,
        profit: formTotals.profit,
        deposit: form.deposit,
        balance: closingBalance,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary-600" />
            Sales & Ledger
          </h1>
          <p className="text-stone-500 text-sm font-medium">Manage multiple loads per customer invoice with ledger integration.</p>
        </div>
        <Button onClick={() => openModal()} className="shadow-glow px-8 py-3 rounded-2xl w-full sm:w-auto transform transition-transform hover:scale-105 active:scale-95">
          <Plus className="h-4 w-4 mr-2" /> New Entry
        </Button>
      </div>

      {/* Advanced Filter Control Center */}
      <Card className="p-0 border-none shadow-soft overflow-hidden">
        <div className="p-6 bg-white space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-[280px] space-y-1.5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Search Records</label>
              <Input
                icon={Search}
                placeholder="Reference or Customer Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-50/80 border-stone-200 focus:bg-white h-11"
              />
            </div>

            {/* Customer Dropdown */}
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Filter by Customer</label>
              <Select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                options={[
                  { label: 'All Customers', value: '' },
                  ...availableCustomers.map(c => ({ label: c.name, value: c.id }))
                ]}
                icon={User}
                className="bg-stone-50/80 border-stone-200 h-11"
              />
            </div>

            {/* Date Range Group */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Date Period</label>
              <div className="flex items-center gap-2 bg-stone-50/80 p-1.5 rounded-xl border border-stone-200 h-11">
                <div className="w-36">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-black uppercase text-stone-600 focus:ring-0 w-full cursor-pointer"
                    title="From Date"
                    placeholder="From"
                  />
                </div>
                <div className="h-4 w-px bg-stone-300"></div>
                <div className="w-36">
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-black uppercase text-stone-600 focus:ring-0 w-full cursor-pointer"
                    title="To Date"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleExportCSV} className="h-11 px-6 rounded-xl border-stone-200 hover:bg-white hover:border-emerald-500 group">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 transition-transform group-hover:scale-110" />
                <span className="text-stone-700">Export</span>
              </Button>
              <button
                onClick={() => { setSearchTerm(''); setFilterCustomerId(''); setFilterStartDate(''); setFilterEndDate(''); }}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all border border-stone-200"
                title="Reset Filters"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-stone-100 divide-x divide-stone-100">
          <SummaryItem
            label="Records Found"
            value={filteredTotals.count}
            icon={Layers}
            color="stone"
          />
          <SummaryItem
            label="Total Tonnage"
            value={`${filteredTotals.tonnage.toLocaleString()} tons`}
            icon={Scale}
            color="primary"
          />
          <SummaryItem
            label="Billed Revenue"
            value={`₦${filteredTotals.revenue.toLocaleString()}`}
            icon={DollarSign}
            color="emerald"
          />
          <SummaryItem
            label="Estimated Yield"
            value={`₦${filteredTotals.profit.toLocaleString()}`}
            icon={BarChart3}
            color="indigo"
          />
        </div>
      </Card>

      {/* Main Data Table */}
      <Card noPadding className="border-none shadow-soft overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-stone-100 text-sm">
            <thead className="bg-stone-50/80">
              <tr>
                <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest text-[10px]">Reference</th>
                <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest text-[10px]">Customer</th>
                <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest text-[10px] hidden md:table-cell">Loads</th>
                <th className="px-6 py-4 text-right font-black text-stone-400 uppercase tracking-widest text-[10px]">Invoice Total</th>
                <th className="px-6 py-4 text-right font-black text-stone-400 uppercase tracking-widest text-[10px]">Balance</th>
                <th className="px-6 py-4 text-center font-black text-stone-400 uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-50">
              {filteredTransactions.slice((currentPage - 1) * 5, currentPage * 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/80 transition-all group cursor-pointer" onClick={() => { setSelectedTx(tx); setIsDetailModalOpen(true); }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono font-black text-stone-800 text-xs bg-stone-100 px-2.5 py-1 rounded-lg w-fit mb-1">{tx.refNo}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-stone-800">
                    <div className="truncate max-w-[120px] sm:max-w-none">{tx.customerName}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-stone-500 uppercase hidden md:table-cell">
                    <Badge color="blue">{tx.items?.length || 0} Loads</Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-stone-900 font-mono text-base">₦{(tx.totalInvoice || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-black font-mono px-3 py-1 rounded-full ${tx.balance < 0 ? 'bg-red-50 text-red-600' : tx.balance > 0 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {tx.balance > 0 ? '+' : tx.balance < 0 ? '-' : ''}₦{Math.abs(tx.balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => {
                          const message = `Agent BM\n\n${tx.items.map(i => `${i.truckPlateNumber}\n${i.driverName}`).join('\n\n')}`;
                          const url = `https://wa.me/${tx.customerPhone}?text=${encodeURIComponent(message)}`;
                          window.open(url, '_blank');
                        }}
                        className="p-2 text-stone-400 hover:text-green-600 transition-colors"
                        title="Send via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => navigate(`/receipt/${tx.id}`)} className="p-2 text-stone-400 hover:text-emerald-600 transition-colors" title="View Receipt"><Printer className="h-4 w-4" /></button>
                      <button onClick={() => openModal(tx)} className="p-2 text-stone-400 hover:text-blue-600 transition-colors" title="Edit"><FileEdit className="h-4 w-4" /></button>
                      <button onClick={() => deleteTransaction(tx.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-300">
                      <Search className="h-12 w-12 mb-4 opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-widest italic">No matching records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > 5 && (
          <div className="flex items-center justify-between p-4 border-t border-stone-100 bg-stone-50/50">
            <span className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">
              Showing {((currentPage - 1) * 5) + 1} - {Math.min(currentPage * 5, filteredTransactions.length)} of {filteredTransactions.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-xl disabled:opacity-30"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTransactions.length / 5), p + 1))}
                disabled={currentPage === Math.ceil(filteredTransactions.length / 5)}
                className="h-8 px-3 rounded-xl disabled:opacity-30"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modify Sales Entry" : "New Sales Entry"} maxWidth="sm:max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-2">
          {/* Recipient Details Card */}
          <div className="bg-stone-50/80 p-4 sm:p-5 rounded-3xl border border-stone-200">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="h-7 w-7 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-sm"><UserPlus className="h-3.5 w-3.5" /></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Recipient Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <Select label="Select Customer" value={form.customerId} onChange={handleCustomerSelect} options={availableCustomers.map(c => ({ label: c.name, value: c.id }))} icon={User} required />
              <Input label="Delivery Site Address" value={form.destinationAddress} onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })} icon={MapPin} placeholder="Enter destination..." required className="bg-white" />

              {/* Auto-populated Contact Info */}
              <Input
                label="Customer Number"
                value={availableCustomers.find(c => c.id === form.customerId)?.phone || ''}
                readOnly
                icon={Phone}
                className="bg-stone-100/50 text-stone-500 cursor-not-allowed"
                placeholder="-- --"
              />
              <Input
                label="Customer Email"
                value={availableCustomers.find(c => c.id === form.customerId)?.email || ''}
                readOnly
                icon={Mail}
                className="bg-stone-100/50 text-stone-500 cursor-not-allowed"
                placeholder="-- --"
              />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 pt-2">
            {form.items.map((item, index) => (
              <div key={index} className="relative group bg-white p-4 sm:p-5 rounded-3xl border border-stone-100 shadow-lg animate-in slide-in-from-top-4 duration-500">
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 h-8 w-8 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-md z-20">
                    <X className="h-4 w-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
                  {/* Supply Source Section */}
                  <div className="bg-stone-50/50 p-4 sm:p-5 rounded-2xl border border-stone-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-sm"><Truck className="h-3.5 w-3.5" /></div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Supply Source (Load {index + 1})</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Select label="Pick-up Quarry" value={item.quarryId} onChange={(e) => handleQuarrySelect(index, e.target.value)} options={availableQuarries.map(q => ({ label: q.name, value: q.id }))} icon={MapPinned} required />

                      {/* Read-only Quarry Location */}
                      {item.quarryId && (
                        <div className="flex items-center gap-2 pl-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          <MapPin className="h-3 w-3" />
                          {item.quarryLocation || 'Location not set'}
                        </div>
                      )}

                      <Select
                        label="Product"
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        options={getProductsForQuarry(item.quarryId).map(p => ({ label: p.name, value: p.id }))}
                        icon={Package}
                        required
                        disabled={!item.quarryId}
                      />
                    </div>
                    {/* Truck and Driver - Mobile Stacked */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Truck Plate" value={item.truckPlateNumber} onChange={(e) => updateItem(index, { truckPlateNumber: e.target.value.toUpperCase() })} icon={CreditCard} placeholder="Plate #" required />
                      <Input label="Driver" value={item.driverName} onChange={(e) => updateItem(index, { driverName: e.target.value })} icon={UserCheck} placeholder="Name" required />
                    </div>

                    {/* Transport and Expenses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                      <Input
                        label="Transport Cost (₦)"
                        type="number"
                        value={item.transportCost || ''}
                        onChange={(e) => updateItem(index, { transportCost: parseFloat(e.target.value || '0') })}
                        icon={Truck}
                        placeholder="0"
                        className="font-mono"
                      />
                      <Input
                        label="Other Expenses (₦)"
                        type="number"
                        value={item.otherExpenses || ''}
                        onChange={(e) => updateItem(index, { otherExpenses: parseFloat(e.target.value || '0') })}
                        icon={CircleDollarSign}
                        placeholder="0"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  {/* Calculations Section */}
                  <div className="space-y-4">
                    {/* Load Calc */}
                    <div className="bg-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm"><Calculator className="h-3.5 w-3.5" /></div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Load Calculation</h4>
                      </div>
                      <Input
                        label="Quantity to Move (Tons)"
                        type="number"
                        step="any"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, { quantity: e.target.value as unknown as number })}
                        icon={Scale}
                        required
                        className="bg-white font-black text-lg"
                      />
                      <div className="flex items-center justify-between px-2 pt-2 border-t border-indigo-100">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-indigo-300 uppercase">Purchase Rate</span>
                          <span className="text-xs font-mono font-black text-indigo-900">₦{(item.purchasePrice || 0).toLocaleString()}/ton</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-indigo-300 uppercase">Total Purchase Cost</span>
                          <span className="text-xs font-mono font-black text-indigo-900">₦{(item.totalPurchaseCost || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales Value */}
                    <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-100 space-y-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm"><DollarSign className="h-3.5 w-3.5" /></div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Sales Value</h4>
                      </div>
                      <Input
                        label="Sales Price (₦/Ton)"
                        type="number"
                        step="any"
                        value={item.salesPrice || ''}
                        onChange={(e) => updateItem(index, { salesPrice: e.target.value as unknown as number })}
                        icon={Calculator}
                        placeholder="Enter price..."
                        required
                        className={`bg-white font-mono font-black text-lg ${item.salesPrice > 0 && item.salesPrice < item.purchasePrice ? 'border-red-500 focus:ring-red-100' : ''}`}
                        error={item.salesPrice > 0 && item.salesPrice < item.purchasePrice ? `Price > ₦${item.purchasePrice.toLocaleString()}` : undefined}
                      />
                      <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-emerald-100">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-tight">Total Sales Bill</span>
                          <span className="text-xs font-black font-mono text-stone-900">
                            ₦{(item.totalInvoice || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-tight">Load Subtotal</span>
                          <span className="text-sm font-black font-mono text-emerald-700">
                            ₦{(item.subtotal || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end pr-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${item.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          Yield: {item.salesPrice > 0 ? `₦${Math.abs(item.profit || 0).toLocaleString()}` : '₦0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button type="button" onClick={addItem} className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all">
              <Plus className="h-3 w-3" /> Add Another Load
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6">
            <div className="p-4 sm:p-5 bg-stone-50 rounded-3xl border border-stone-200 flex flex-col justify-center shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Invoice Total</span>
              <div className="text-2xl font-black font-mono leading-none text-stone-900">₦{formTotals.invoice.toLocaleString()}</div>
              <div className={`text-[9px] font-bold uppercase mt-1.5 ${formTotals.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                Yield: ₦{formTotals.profit.toLocaleString()}
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-stone-50 rounded-3xl border border-stone-200 flex flex-col justify-center shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Amount Paid (₦)</span>
              <input type="number" step="any" value={form.deposit || ''} onChange={(e) => setForm({ ...form, deposit: parseFloat(e.target.value || '0') })} className="w-full text-2xl font-black font-mono text-stone-700 border-none bg-transparent focus:ring-0 p-0" placeholder="0.00" />
              <div className="text-[9px] text-stone-400 font-bold uppercase mt-1.5">Opening: ₦{openingStanding.toLocaleString()}</div>
            </div>
            <div className={`p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col justify-center text-white ${closingBalance < 0 ? 'bg-red-600' : 'bg-stone-900'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">New Ledger Balance</span>
              <div className="text-3xl font-black font-mono leading-none tracking-tight">
                {closingBalance > 0 ? '+' : closingBalance < 0 ? '-' : ''}₦{Math.abs(closingBalance).toLocaleString()}
              </div>
              <span className="text-[9px] mt-1.5 font-black uppercase tracking-widest opacity-60">{closingBalance < 0 ? 'Owed' : 'Settled'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-100">
            <Button type="button" variant="ghost" className="px-8 rounded-2xl order-2 sm:order-1 h-12 text-sm" onClick={() => setIsModalOpen(false)}>Discard</Button>
            <Button type="submit" fullWidth disabled={submitting || !form.customerId || form.items.some(i => !i.productId || i.quantity <= 0 || i.salesPrice < i.purchasePrice)} className="rounded-2xl shadow-glow h-12 text-lg font-black order-1 sm:order-2">
              {submitting ? 'Updating...' : 'Submit Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Invoice Summary" maxWidth="sm:max-w-4xl">
        {selectedTx && (
          <div className="space-y-6 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-stone-100 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge color="blue">{selectedTx.refNo}</Badge>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    {new Date(selectedTx.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-stone-900 tracking-tight">{selectedTx.customerName}</h2>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> {selectedTx.destinationAddress}
                  </p>
                  {(selectedTx.customerPhone || selectedTx.customerEmail) && (
                    <p className="text-xs text-stone-400 font-bold flex items-center gap-2">
                      {selectedTx.customerPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedTx.customerPhone}</span>}
                      {selectedTx.customerEmail && <span className="flex items-center gap-1 border-l border-stone-300 pl-2 ml-1"><Mail className="h-3 w-3" /> {selectedTx.customerEmail}</span>}
                    </p>
                  )}
                </div>
              </div>
              {selectedTx.balance < 0 ? <Badge color="red">DEBT OUTSTANDING</Badge> : <Badge color="green">CLEARED</Badge>}
            </div>

            <div className="space-y-4">
              {selectedTx.items?.map((item, idx) => (
                <div key={idx} className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden">
                  {/* Item Header */}
                  <div className="bg-stone-50/50 p-5 border-b border-stone-100 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm border border-stone-100"><Package className="h-5 w-5" /></div>
                      <div>
                        <p className="font-black text-stone-900 text-sm leading-none mb-1">{item.productName}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          {item.quarryName}
                          {item.quarryLocation && (
                            <>
                              <span className="mx-1">•</span>
                              <MapPin className="h-3 w-3 text-stone-300" />
                              {item.quarryLocation}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge color="stone">Load {idx + 1}</Badge>
                  </div>

                  {/* Item Details Grid */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Driver Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3 text-primary-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-900/60">Logistics</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Plate No</span>
                          <span className="text-xs font-bold text-stone-700">{item.truckPlateNumber}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Driver</span>
                          <span className="text-xs font-bold text-stone-700">{item.driverName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Scale className="h-3 w-3 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60">Purchase</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Qty (Tons)</span>
                          <span className="text-xs font-bold text-stone-700">{item.quantity}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Rate</span>
                          <span className="text-xs font-bold text-stone-700">₦{item.purchasePrice.toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-indigo-50">
                          <span className="text-[9px] text-indigo-400 block uppercase font-bold">Total Cost</span>
                          <span className="text-xs font-black text-indigo-900">₦{item.totalPurchaseCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Extra Costs */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-900/60">Expenses</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Transport</span>
                          <span className="text-xs font-bold text-stone-700">₦{(item.transportCost || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Other</span>
                          <span className="text-xs font-bold text-stone-700">₦{(item.otherExpenses || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60">Sales</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">Rate</span>
                          <span className="text-xs font-bold text-stone-700">₦{item.salesPrice.toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-emerald-50">
                          <span className="text-[9px] text-emerald-500 block uppercase font-bold">Total Bill</span>
                          <span className="text-xs font-black text-emerald-900">₦{(item.totalInvoice || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item Footer - Totals */}
                  <div className="bg-stone-900 p-4 flex flex-col sm:flex-row justify-between items-center px-6 gap-3">
                    <div className="flex items-center gap-6">
                      <div className="text-center sm:text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 block">Load Subtotal</span>
                        <span className="text-lg font-black font-mono text-white">₦{(item.subtotal || item.totalInvoice || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Yield</span>
                      <span className={`text-sm font-black font-mono ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.profit >= 0 ? '+' : ''}₦{item.profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <DollarSign className="h-48 w-48 -rotate-12 absolute -right-10 -bottom-10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10 text-center sm:text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block">Opening Ledger Bal</span>
                  <span className={`text-xl font-black font-mono block ${selectedTx.balance < 0 ? 'text-red-400' : 'text-stone-300'}`}>
                    ₦{(selectedTx.balance + selectedTx.totalInvoice - selectedTx.deposit).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Deposit Applied</span>
                  <span className="text-3xl font-black font-mono text-emerald-400 block">₦{(selectedTx.deposit || 0).toLocaleString()}</span>
                </div>
                <div className="space-y-1 sm:text-right">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block">Closing Ledger Bal</span>
                  <div className="flex flex-col sm:items-end">
                    <span className={`text-3xl font-black font-mono ${selectedTx.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedTx.balance > 0 ? '+' : selectedTx.balance < 0 ? '-' : ''}₦{Math.abs(selectedTx.balance || 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">{selectedTx.balance < 0 ? 'Customer In Debt' : 'Account Settled'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-stone-100">
              <Button fullWidth size="lg" className="rounded-2xl shadow-glow" onClick={() => setIsDetailModalOpen(false)}>
                <CheckCircle className="h-4 w-4 mr-2" /> Finish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Internal components for improved UI aesthetics
const SummaryItem: React.FC<{ label: string; value: string | number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    stone: 'bg-stone-50/50 text-stone-800',
    primary: 'bg-primary-50/50 text-primary-900',
    emerald: 'bg-emerald-50/50 text-emerald-900',
    indigo: 'bg-indigo-50/50 text-indigo-900'
  }[color];

  const iconColor = {
    stone: 'text-stone-400',
    primary: 'text-primary-500',
    emerald: 'text-emerald-500',
    indigo: 'text-indigo-500'
  }[color];

  return (
    <div className={`p-5 flex flex-col justify-between transition-colors hover:bg-stone-50 group ${colorClasses}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none group-hover:text-stone-500 transition-colors">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${iconColor} opacity-40 group-hover:opacity-100 transition-all group-hover:scale-110`} />
      </div>
      <p className="text-xl font-black tracking-tight leading-none group-hover:scale-[1.02] origin-left transition-transform">
        {value}
      </p>
    </div>
  );
};
