
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Customer, UserRole } from '../types';
import { Plus, Edit, Users, Phone, Mail, Search, Trash2, Calendar, User as UserIcon } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, saveCustomer, deleteCustomer } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Filter customers based on role: Clerks only see their own registrations
  const visibleCustomers = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return customers;
    return customers.filter(c => c.createdBy === user.id);
  }, [customers, user, isAdmin]);

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
    return visibleCustomers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [visibleCustomers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Customers</h1>
            <p className="text-stone-500 text-sm mt-1">
                {isAdmin ? 'System-wide customer database.' : 'Your registered client list.'}
            </p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-50/50">
          <div className="w-full sm:w-96">
            <Input 
              icon={Search}
              placeholder="Search by name, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
                <thead className="bg-stone-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Contact Details</th>
                    {isAdmin && (
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Registered By</th>
                    )}
                    <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-50">
                {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center">
                                <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center mr-3 text-stone-500">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-stone-900 leading-tight">{customer.name}</span>
                                    <span className="text-[10px] text-stone-400 font-mono">#{customer.id.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-y-1">
                                <div className="flex items-center text-xs font-bold text-stone-600">
                                    <Phone className="h-3 w-3 mr-1.5 text-stone-400" />
                                    {customer.phone}
                                </div>
                                {customer.email && (
                                    <div className="flex items-center text-[11px] text-stone-400">
                                        <Mail className="h-3 w-3 mr-1.5" />
                                        <span className="truncate max-w-[150px]">{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </td>
                        {isAdmin && (
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-black text-stone-600 uppercase shadow-sm">
                                        {customer.createdByName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="text-xs font-bold text-stone-800">{customer.createdByName || 'System'}</div>
                                </div>
                            </td>
                        )}
                        <td className="px-6 py-4 text-right">
                             <Badge color={customer.transactionCount > 5 ? 'purple' : 'blue'}>
                                {customer.transactionCount || 0} Transactions
                             </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <button onClick={() => openModal(customer)} className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Edit">
                                    <Edit className="h-4 w-4"/>
                                </button>
                                <button onClick={() => handleDelete(customer.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                 {filteredCustomers.length === 0 && (
                    <tr><td colSpan={isAdmin ? 5 : 4} className="p-12 text-center text-stone-400 text-sm">
                        No matching customer records found.
                    </td></tr>
                )}
                </tbody>
            </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Edit Customer" : "New Customer"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Full Name / Company" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} icon={Users} required placeholder="e.g. Landmark Construction" />
          <Input label="Phone Contact" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} icon={Phone} placeholder="080..." required />
          <Input label="Customer Email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} icon={Mail} placeholder="client@example.com" />
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Discard</Button>
            <Button type="submit" disabled={submitting || !isFormValid} className="px-8 shadow-glow">
                {submitting ? 'Processing...' : (editingCustomer ? 'Update Profile' : 'Register Customer')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
