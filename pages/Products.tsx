
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole } from '../types';
import { Plus, Edit, Tag, Trash2, User as UserIcon, AlertCircle, Calendar, Info } from 'lucide-react';

export const Products: React.FC = () => {
  const { products, saveProduct, softDeleteProduct } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const [form, setForm] = useState({
    name: '',
    description: ''
  });

  const visibleProducts = useMemo(() => {
    if (!user) return [];
    const filtered = isAdmin ? products : products.filter(p => p.createdBy === user.id && !p.isDeleted);
    return filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
  }, [products, user, isAdmin]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({ name: product.name, description: product.description });
    } else {
      setEditingProduct(null);
      setForm({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm("Delete this material definition? It will no longer be available for selection.")) {
      await softDeleteProduct(product);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Product = {
        id: editingProduct ? editingProduct.id : Date.now().toString(),
        name: form.name,
        description: form.description,
        createdBy: editingProduct?.createdBy || user?.id || '',
        createdByName: editingProduct?.createdByName || user?.name || '',
        isDeleted: editingProduct?.isDeleted || false,
        createdAt: editingProduct?.createdAt 
      };
      await saveProduct(payload);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Materials</h1>
            <p className="text-stone-500 text-sm mt-1">Define types of granite. Specific rates are managed in <b>Quarries</b> or <b>Price Mapping</b>.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Define Material</Button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
                <thead className="bg-stone-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Material Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Date Defined</th>
                    {isAdmin && <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Created By</th>}
                    <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-50">
                {visibleProducts.map((p) => (
                    <tr key={p.id} className={`hover:bg-stone-50 transition-colors ${p.isDeleted ? 'opacity-50 grayscale bg-stone-50' : ''}`}>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mr-3">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <span className="block text-sm font-semibold text-stone-900">{p.name}</span>
                                <span className="text-[10px] text-stone-400">ID: {p.id.slice(-6)}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500 max-w-xs truncate">{p.description}</td>
                    <td className="px-6 py-4 text-sm text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </td>
                    {isAdmin && (
                        <td className="px-6 py-4 text-center">
                             <div className="flex items-center justify-center text-xs text-stone-500 font-bold">
                                 {p.createdByName || 'Unknown'}
                             </div>
                        </td>
                    )}
                    <td className="px-6 py-4 text-center">
                        {!p.isDeleted && (
                            <div className="flex justify-center gap-1">
                                <button onClick={() => openModal(p)} className="p-2 text-stone-400 hover:text-primary-600 rounded-lg transition-all"><Edit className="h-4 w-4"/></button>
                                <button onClick={() => handleDelete(p)} className="p-2 text-stone-400 hover:text-red-600 rounded-lg transition-all"><Trash2 className="h-4 w-4"/></button>
                            </div>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Material" : "Define Material"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Material Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g. Granite 3/4 inch" />
          <Input label="General Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required placeholder="Physical properties or grading details" />
          
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3">
              <Info className="h-5 w-5 text-indigo-600 shrink-0" />
              <div className="text-xs text-indigo-800 leading-relaxed font-medium">
                  Define the type of material here. You will set the specific selling price for this material when you manage a <b>Quarry</b>.
              </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Confirm Definition'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
