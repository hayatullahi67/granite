
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Customer, UserRole } from '../types';
import { Plus, Edit, Users, Phone, MapPin, Search, Trash2 } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, saveCustomer, deleteCustomer } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Validation: Name and Phone are required
  const isFormValid = form.name.trim() !== '' && form.phone.trim() !== '';

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setForm({ name: customer.name, phone: customer.phone, address: customer.address || '' });
    } else {
      setEditingCustomer(null);
      setForm({ name: '', phone: '', address: '' });
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
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Customers</h1>
            <p className="text-stone-500 text-sm mt-1">Manage client relationships and contact details.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
      </div>

      <Card noPadding>
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-50/50">
          <div className="w-full sm:w-96">
            <Input 
              icon={Search}
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
                <thead className="bg-stone-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Transactions</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-50">
                {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center mr-3 text-stone-500">
                                    <Users className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-semibold text-stone-900">{customer.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-stone-500">
                                <Phone className="h-3.5 w-3.5 mr-1.5" />
                                {customer.phone}
                            </div>
                        </td>
                         <td className="px-6 py-4 text-sm text-stone-500">
                            {customer.address ? (
                                <div className="flex items-center">
                                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="truncate max-w-[150px]">{customer.address}</span>
                                </div>
                            ) : (
                                <span className="text-stone-300 italic">No address</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                             <Badge color="blue">{customer.transactionCount || 0} Orders</Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <button 
                                    onClick={() => openModal(customer)} 
                                    className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                    title="Edit Customer"
                                >
                                    <Edit className="h-4 w-4"/>
                                </button>
                                <button 
                                    onClick={() => handleDelete(customer.id)} 
                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete Customer"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                 {filteredCustomers.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-stone-400">No customers found.</td></tr>
                )}
                </tbody>
            </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Customer Name" 
            value={form.name} 
            onChange={(e) => setForm({...form, name: e.target.value})} 
            icon={Users}
            required 
          />
          <Input 
            label="Phone Number" 
            value={form.phone} 
            onChange={(e) => setForm({...form, phone: e.target.value})} 
            icon={Phone}
            placeholder="080..."
            required 
          />
          <Input 
            label="Shipping Address" 
            value={form.address} 
            onChange={(e) => setForm({...form, address: e.target.value})} 
            icon={MapPin}
            placeholder="Delivery location..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || !isFormValid}>
                {submitting ? 'Saving...' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
