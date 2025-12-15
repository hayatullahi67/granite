
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole } from '../types';
import { Plus, Edit, Tag, Trash2, User as UserIcon, AlertCircle, Calendar } from 'lucide-react';

export const Products: React.FC = () => {
  const { products, saveProduct, softDeleteProduct } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const [form, setForm] = useState({
    name: '',
    description: '',
    currentPrice: 0
  });

  // Filtering Logic
  // Clerks see only their own products that are NOT deleted.
  // Admin sees all products (including deleted ones).
  const visibleProducts = useMemo(() => {
    if (!user) return [];
    
    let filtered = products;

    if (isAdmin) {
      filtered = products;
    } else {
      // Allow duplicates (different IDs) to show up as long as they belong to user
      // AND they are not explicitly deleted.
      filtered = products.filter(p => p.createdBy === user.id && p.isDeleted !== true);
    }

    // Sort by Date Added (Newest First)
    return filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
  }, [products, user, isAdmin]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({ name: product.name, description: product.description, currentPrice: product.currentPrice });
    } else {
      setEditingProduct(null);
      setForm({ name: '', description: '', currentPrice: 0 });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm("Are you sure you want to delete this product? It will be removed from your list.")) {
      try {
        await softDeleteProduct(product);
      } catch (error) {
        alert("Failed to delete product. Please try again.");
        console.error(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // By using Date.now() for new products, we guarantee unique IDs
      // This allows adding "Granite A" multiple times as distinct entries
      const payload: Product = {
        id: editingProduct ? editingProduct.id : Date.now().toString(),
        currentPrice: form.currentPrice,
        name: form.name,
        description: form.description,
        createdBy: editingProduct?.createdBy || user?.id || '',
        createdByName: editingProduct?.createdByName || user?.name || '',
        isDeleted: editingProduct?.isDeleted || false,
        // Preserve existing date if editing, creation is handled in DataContext, 
        // but passing existing ensures we don't lose it if logic differs.
        createdAt: editingProduct?.createdAt 
      };
      await saveProduct(payload);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Products</h1>
            <p className="text-stone-500 text-sm mt-1">{isAdmin ? 'Manage all system products.' : 'Manage your product inventory.'}</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
      </div>

      <Card noPadding className="h-full">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
                <thead className="bg-stone-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Price</th>
                    {isAdmin && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Owner</th>
                    )}
                    <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Action</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-50">
                {visibleProducts.map((p) => (
                    <tr key={p.id} className={`hover:bg-stone-50 transition-colors ${p.isDeleted ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-3 ${p.isDeleted ? 'bg-red-100 text-red-500' : 'bg-primary-50 text-primary-600'}`}>
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <span className={`block text-sm font-semibold ${p.isDeleted ? 'text-stone-400 line-through' : 'text-stone-900'}`}>{p.name}</span>
                                <span className="text-[10px] text-stone-400">ID: {p.id.slice(-6)}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500 max-w-xs truncate">{p.description}</td>
                    <td className="px-6 py-4 text-sm text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                            <Badge color={p.isDeleted ? 'red' : 'blue'}>₦{p.currentPrice.toLocaleString()}</Badge>
                    </td>
                    {isAdmin && (
                        <td className="px-6 py-4 text-center">
                             <div className="flex items-center justify-center text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full w-fit mx-auto">
                                 <UserIcon className="h-3 w-3 mr-1" />
                                 {p.createdByName || 'Unknown'}
                             </div>
                        </td>
                    )}
                    <td className="px-6 py-4 text-center">
                        {p.isDeleted ? (
                            <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                <AlertCircle className="h-3 w-3 mr-1"/> Deleted
                            </span>
                        ) : (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                Active
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                        {!p.isDeleted && (
                            <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => openModal(p)} 
                                    className="text-stone-400 hover:text-primary-600 transition-colors p-2 hover:bg-primary-50 rounded-lg"
                                    title="Edit Details"
                                >
                                    <Edit className="h-4 w-4"/>
                                </button>
                                <button 
                                    onClick={() => handleDelete(p)} 
                                    className="text-stone-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                    title="Delete Product"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>
                        )}
                    </td>
                    </tr>
                ))}
                    {visibleProducts.length === 0 && (
                    <tr><td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-stone-400">No products found.</td></tr>
                )}
                </tbody>
            </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Product Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g. Granite 3/4 inch" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required placeholder="Batch details, quality, etc." />
          
          {!editingProduct && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm text-blue-800">
                  <p><strong>Note:</strong> You can add multiple products with the same name if they are different batches. Prices are managed in the <strong>Price Mapping</strong> page.</p>
              </div>
          )}

          <Input 
            label="Current Price (₦)" 
            type="number" 
            value={form.currentPrice} 
            onChange={(e) => setForm({...form, currentPrice: Number(e.target.value)})} 
            required 
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
