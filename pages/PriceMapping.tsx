
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole } from '../types';
import { Search, TrendingUp, History, ArrowRight, DollarSign, Calendar } from 'lucide-react';

export const PriceMapping: React.FC = () => {
  const { products, priceHistory, saveProduct } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter products: Only show user's active products
  const myProducts = useMemo(() => {
    if (!user) return [];
    // Admins might want to see all, but for mapping let's stick to owned or all active if Admin
    if (user.role === UserRole.ADMIN) return products.filter(p => !p.isDeleted);
    return products.filter(p => p.createdBy === user.id && !p.isDeleted);
  }, [products, user]);

  const filteredProducts = useMemo(() => {
    return myProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [myProducts, searchTerm]);

  // Filter history: Admins see all, Users see their own changes OR changes to their products
  const relevantHistory = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.ADMIN) return priceHistory;
    
    // Get IDs of my products
    const myProductIds = myProducts.map(p => p.id);
    return priceHistory.filter(h => myProductIds.includes(h.productId));
  }, [priceHistory, myProducts, user]);

  const openUpdateModal = (product: Product) => {
    setSelectedProduct(product);
    setNewPrice(product.currentPrice);
    setIsModalOpen(true);
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setSubmitting(true);
    try {
        // We reuse saveProduct. It detects the price change and writes to price_history table automatically.
        const updatedProduct: Product = {
            ...selectedProduct,
            currentPrice: newPrice
        };
        await saveProduct(updatedProduct);
        setIsModalOpen(false);
    } catch (error) {
        console.error("Failed to update price", error);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Price Mapping</h1>
            <p className="text-stone-500 text-sm mt-1">Update product prices and track historical changes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product List & Current Prices */}
        <div className="lg:col-span-7 space-y-4">
            <Card className="h-full flex flex-col" noPadding>
                <div className="p-4 border-b border-stone-100 flex items-center bg-stone-50/50">
                    <Input 
                        icon={Search} 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white shadow-sm"
                    />
                </div>
                <div className="flex-1 overflow-auto max-h-[600px]">
                    <table className="min-w-full divide-y divide-stone-50">
                        <thead className="bg-stone-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Current Price</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-50">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-stone-900">{p.name}</div>
                                        <div className="text-xs text-stone-400">{p.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-bold text-stone-700 bg-stone-100 px-2 py-1 rounded">
                                            ₦{p.currentPrice.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Button size="sm" variant="secondary" onClick={() => openUpdateModal(p)}>
                                            Update
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-stone-400">No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* Right Column: Price History Feed */}
        <div className="lg:col-span-5 space-y-4">
            <Card className="h-full flex flex-col bg-stone-50/50 border-stone-200">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary-600" />
                        <h3 className="font-bold text-stone-900">History Log</h3>
                     </div>
                     <span className="text-xs text-stone-400 bg-white px-2 py-1 rounded border border-stone-200">{relevantHistory.length} records</span>
                </div>
                <div className="flex-1 overflow-auto max-h-[600px] p-4 space-y-4">
                    {relevantHistory.map((h) => (
                        <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative overflow-hidden group">
                             <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-stone-800">{h.productName || products.find(p => p.id === h.productId)?.name || 'Unknown Product'}</div>
                                <div className="text-[10px] text-stone-400 flex items-center bg-stone-50 px-1.5 py-0.5 rounded">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(h.date).toLocaleDateString()}
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between bg-stone-50 rounded-lg p-3">
                                 <div className="text-center">
                                     <div className="text-xs text-stone-400 mb-1">Old Price</div>
                                     <div className="font-mono text-stone-500 line-through">₦{h.oldPrice.toLocaleString()}</div>
                                 </div>
                                 <ArrowRight className="h-4 w-4 text-stone-300" />
                                 <div className="text-center">
                                     <div className="text-xs text-stone-400 mb-1">New Price</div>
                                     <div className="font-mono font-bold text-emerald-600">₦{h.newPrice.toLocaleString()}</div>
                                 </div>
                             </div>
                             
                             <div className="mt-3 text-xs text-stone-400 flex justify-between items-center">
                                 {user?.role === UserRole.ADMIN && (
                                     <span>Changed by: <span className="text-stone-600 font-medium">{h.changedBy}</span></span>
                                 )}
                                 <span>{new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                        </div>
                    ))}
                     {relevantHistory.length === 0 && (
                        <div className="text-center py-10 text-stone-400">
                            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            No price changes recorded yet.
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Price">
         <form onSubmit={handleUpdatePrice} className="space-y-6">
             <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary-600 shrink-0">
                    <DollarSign className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-primary-900">{selectedProduct?.name}</h4>
                    <p className="text-xs text-primary-700">Current Price: ₦{selectedProduct?.currentPrice.toLocaleString()}</p>
                </div>
             </div>

             <div className="space-y-2">
                 <Input 
                    label="New Price (₦)" 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(Number(e.target.value))} 
                    required 
                    className="text-lg font-mono font-bold"
                 />
                 <p className="text-xs text-stone-500">This will update the product's current price and create a history record.</p>
             </div>

             <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Confirm Update'}
                </Button>
             </div>
         </form>
      </Modal>
    </div>
  );
};
