
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole } from '../types';
import { Search, TrendingUp, History, ArrowRight, DollarSign, Calendar, User as UserIcon, Tag } from 'lucide-react';

export const PriceMapping: React.FC = () => {
  const { products, priceHistory, saveProduct } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Filter products: Only show active products
  // Clerks see only their own. Admins see everything.
  const visibleProducts = useMemo(() => {
    if (!user) return [];
    const active = products.filter(p => !p.isDeleted);
    if (isAdmin) return active;
    return active.filter(p => p.createdBy === user.id);
  }, [products, user, isAdmin]);

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isAdmin && p.createdByName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [visibleProducts, searchTerm, isAdmin]);

  // Filter history: Admins see all, Users see their own changes OR changes to their products
  const relevantHistory = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return priceHistory;
    
    // Get IDs of my products
    const myProductIds = visibleProducts.map(p => p.id);
    return priceHistory.filter(h => myProductIds.includes(h.productId));
  }, [priceHistory, visibleProducts, user, isAdmin]);

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
            <p className="text-stone-500 text-sm mt-1">
              {isAdmin ? 'System-wide price management across all clerks.' : 'Update your product prices and track historical changes.'}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product List & Current Prices */}
        <div className="lg:col-span-8 space-y-4">
            <Card className="h-full flex flex-col border-none shadow-soft" noPadding>
                <div className="p-4 border-b border-stone-100 flex items-center bg-stone-50/50">
                    <Input 
                        icon={Search} 
                        placeholder={isAdmin ? "Search products or clerks..." : "Search products..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white shadow-sm"
                    />
                </div>
                <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar">
                    <table className="min-w-full divide-y divide-stone-50">
                        <thead className="bg-stone-50 sticky top-0 z-10 border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Product Info</th>
                                {isAdmin && (
                                    <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Owner / Clerk</th>
                                )}
                                <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Current Price</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-50">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-stone-50 transition-all duration-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-stone-900 leading-tight">{p.name}</div>
                                                <div className="text-[11px] text-stone-400 mt-0.5 truncate max-w-[180px]">{p.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-600">
                                                    {p.createdByName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="text-sm font-medium text-stone-600">
                                                    {p.createdByName || 'System'}
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100">
                                            ₦{p.currentPrice.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => openUpdateModal(p)}
                                            className="text-stone-400 hover:text-primary-600 p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                            title="Quick Update"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="p-12 text-center text-stone-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="h-8 w-8 opacity-20" />
                                            <span className="text-sm font-medium">No results found matching your search.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* Right Column: Price History Feed */}
        <div className="lg:col-span-4 space-y-4">
            <Card className="h-full flex flex-col bg-stone-50/50 border-stone-200" noPadding>
                <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white rounded-t-[1.5rem]">
                     <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary-600" />
                        <h3 className="font-bold text-stone-900">Activity History</h3>
                     </div>
                     <Badge color="blue">{relevantHistory.length}</Badge>
                </div>
                <div className="flex-1 overflow-auto max-h-[600px] p-4 space-y-4 custom-scrollbar">
                    {relevantHistory.map((h) => (
                        <div key={h.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 transition-all hover:shadow-md">
                             <div className="flex justify-between items-start mb-3">
                                <div className="font-bold text-stone-800 text-sm">{h.productName || 'Product Removed'}</div>
                                <div className="text-[10px] text-stone-400 flex items-center bg-stone-50 px-2 py-1 rounded-lg font-medium">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(h.date).toLocaleDateString()}
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3 border border-stone-100">
                                 <div className="text-center">
                                     <div className="text-[9px] uppercase font-black text-stone-400 mb-1 tracking-tighter">PREVIOUS</div>
                                     <div className="font-mono text-stone-400 line-through text-xs">₦{h.oldPrice.toLocaleString()}</div>
                                 </div>
                                 <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-stone-100 shadow-sm">
                                     <ArrowRight className="h-3 w-3 text-primary-500" />
                                 </div>
                                 <div className="text-center">
                                     <div className="text-[9px] uppercase font-black text-primary-500 mb-1 tracking-tighter">UPDATED</div>
                                     <div className="font-mono font-bold text-emerald-600 text-sm">₦{h.newPrice.toLocaleString()}</div>
                                 </div>
                             </div>
                             
                             <div className="mt-3 text-[10px] text-stone-400 flex justify-between items-center px-1">
                                 <div className="flex items-center gap-1.5">
                                     <div className="h-4 w-4 rounded-full bg-stone-100 flex items-center justify-center text-[8px] font-bold text-stone-500">
                                         {h.changedBy?.charAt(0)}
                                     </div>
                                     <span className="font-medium text-stone-500">{h.changedBy}</span>
                                 </div>
                                 <span className="font-mono">{new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                        </div>
                    ))}
                     {relevantHistory.length === 0 && (
                        <div className="text-center py-20 text-stone-400">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No price adjustments found.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Product Price">
         <form onSubmit={handleUpdatePrice} className="space-y-6">
             <div className="bg-primary-50 p-5 rounded-2xl border border-primary-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                    <DollarSign className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-black text-primary-900 text-lg">{selectedProduct?.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge color="purple">Owner: {selectedProduct?.createdByName}</Badge>
                        <span className="text-xs text-primary-700 font-medium">Currently: ₦{selectedProduct?.currentPrice.toLocaleString()}</span>
                    </div>
                </div>
             </div>

             <div className="space-y-3">
                 <Input 
                    label="New Market Rate (₦)" 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(Number(e.target.value))} 
                    required 
                    className="text-2xl font-mono font-black text-stone-800 py-4 focus:ring-primary-500 border-2"
                 />
                 <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex gap-2">
                     <TrendingUp className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                     <p className="text-[11px] text-amber-800 leading-relaxed">
                        Updating the price will immediately reflect in all new sales for this product. A historical entry will be saved for audit purposes.
                     </p>
                 </div>
             </div>

             <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Discard</Button>
                <Button type="submit" disabled={submitting} className="px-8 shadow-glow">
                    {submitting ? 'Syncing...' : 'Update & Log'}
                </Button>
             </div>
         </form>
      </Modal>
    </div>
  );
};
