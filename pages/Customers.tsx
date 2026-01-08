
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Customer, UserRole } from '../types';
import { Plus, Edit, Users, Phone, Mail, Search, Trash2, Calendar, User as UserIcon, Scale, Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, transactions, saveCustomer, deleteCustomer } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Filter customers based on role
  const visibleCustomers = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return customers;
    return customers.filter(c => c.createdBy === user.id);
  }, [customers, user, isAdmin]);

  // Calculate live balance for each customer
  const customersWithBalances = useMemo(() => {
    return visibleCustomers.map(customer => {
        const customerTx = transactions.filter(t => t.customerId === customer.id);
        const balance = customerTx.reduce((acc, t) => acc + (t.balance || 0), 0);
        return { ...customer, currentBalance: balance };
    });
  }, [visibleCustomers, transactions]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const isFormValid = form.name.trim() !== '' && form.phone.trim() !== '';

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setForm({ name: customer.name, phone: customer.phone, email: customer.email || '' });
    } else {
      setEditingCustomer(null);
      setForm({ name: '', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this customer? This cannot be undone.')) {
          await deleteCustomer(id);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Customer = {
        id: editingCustomer ? editingCustomer.id : Date.now().toString(),
        transactionCount: editingCustomer ? editingCustomer.transactionCount : 0,
        ...form
      };
      await saveCustomer(payload);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving customer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customersWithBalances.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => (a.currentBalance < 0 ? -1 : 1)); // Show debts first
  }, [customersWithBalances, searchTerm]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      
      {/* Dynamic Header Block */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-none">Customer Ledger</h1>
            <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Managing financial standings for {visibleCustomers.length} clients</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-80">
                <Input 
                    icon={Search}
                    placeholder="Search ledger by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-stone-50 border-stone-200 h-12"
                />
            </div>
            <Button onClick={() => openModal()} className="w-full sm:w-auto h-12 shadow-glow rounded-xl px-8 font-black uppercase tracking-widest text-xs">
                <Plus className="h-4 w-4 mr-2" /> Register Customer
            </Button>
        </div>
      </div>

      {/* Ledger Table Section */}
      <Card noPadding className="border-stone-100 shadow-soft overflow-hidden rounded-[2rem] bg-white">
        <div className="overflow-x-auto min-h-[500px]">
            <table className="min-w-full divide-y divide-stone-100 text-sm">
                <thead className="bg-stone-50/80">
                <tr>
                    <th className="px-8 py-5 text-left font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Client Reference</th>
                    <th className="px-8 py-5 text-left font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Contact Info</th>
                    <th className="px-8 py-5 text-right font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Statement Balance</th>
                    <th className="px-8 py-5 text-center font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">History</th>
                    <th className="px-8 py-5 text-center font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-50">
                {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-stone-50/50 transition-all group">
                        <td className="px-8 py-5">
                            <div className="flex items-center">
                                <div className="h-11 w-11 rounded-xl bg-stone-50 group-hover:bg-white border border-stone-100 flex items-center justify-center mr-4 text-stone-400 group-hover:text-primary-600 transition-all shadow-sm">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block font-black text-stone-900 leading-tight truncate mb-1">{customer.name}</span>
                                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest bg-stone-50 px-2 py-0.5 rounded-md">REF: {customer.id.slice(-6)}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <div className="space-y-1.5">
                                <div className="flex items-center text-xs font-black text-stone-800 tracking-tight">
                                    <Phone className="h-3 w-3 mr-2 text-stone-300" />
                                    {customer.phone}
                                </div>
                                {customer.email && (
                                    <div className="flex items-center text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                                        <Mail className="h-3 w-3 mr-2 text-stone-300" />
                                        <span className="truncate max-w-[140px]">{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-8 py-5 text-right whitespace-nowrap">
                            <div className={`text-lg font-black font-mono leading-none mb-1.5 flex items-center justify-end gap-2 ${customer.currentBalance < 0 ? 'text-red-600' : customer.currentBalance > 0 ? 'text-emerald-600' : 'text-stone-400'}`}>
                                {customer.currentBalance > 0 && <TrendingUp className="h-4 w-4" />}
                                {customer.currentBalance < 0 && <TrendingDown className="h-4 w-4" />}
                                {customer.currentBalance > 0 ? '+' : ''}₦{(customer.currentBalance || 0).toLocaleString()}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${customer.currentBalance < 0 ? 'bg-red-50 text-red-700 border-red-100' : customer.currentBalance > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                                {customer.currentBalance < 0 ? 'Debt Owed' : customer.currentBalance > 0 ? 'Prepaid Credit' : 'Balance Clear'}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                             <div className="inline-flex flex-col items-center">
                                <span className="text-sm font-black text-stone-800 leading-none">{customer.transactionCount || 0}</span>
                                <span className="text-[8px] font-black text-stone-400 uppercase mt-1 tracking-widest">Total Loads</span>
                             </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <button onClick={() => openModal(customer)} className="h-9 w-9 flex items-center justify-center text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Edit Profile">
                                    <Edit className="h-4 w-4"/>
                                </button>
                                <button onClick={() => handleDelete(customer.id)} className="h-9 w-9 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Ledger">
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                 {filteredCustomers.length === 0 && (
                    <tr><td colSpan={5} className="py-32 text-center">
                        <Wallet className="h-16 w-16 text-stone-100 mx-auto mb-6 opacity-30" />
                        <p className="text-xs font-black text-stone-300 uppercase tracking-[0.2em] italic">No customer ledger accounts match your search</p>
                    </td></tr>
                )}
                </tbody>
            </table>
        </div>
      </Card>

      {/* Modern Registration Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Update Authorized Profile" : "Register New Account"} maxWidth="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6 pb-2">
          <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 space-y-5">
              <Input label="Business or Client Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} icon={Users} required placeholder="e.g. Skyline Logistics" className="bg-white border-stone-200" />
              <Input label="Primary Phone Line" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} icon={Phone} placeholder="080... (Required for communication)" required className="bg-white border-stone-200" />
              <Input label="Official Email (Optional)" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} icon={Mail} placeholder="billing@company.com" className="bg-white border-stone-200" />
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" fullWidth disabled={submitting || !isFormValid} className="rounded-2xl h-16 shadow-glow text-lg font-black tracking-tight">
                {submitting ? 'Updating Ledger...' : (editingCustomer ? 'Authorize Updates' : 'Confirm Registration')}
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl h-12 text-stone-400" onClick={() => setIsModalOpen(false)}>Discard</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
