
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole, ProductCostHistory } from '../types';
import { 
  Search, TrendingUp, History, ArrowRight, DollarSign, 
  Calendar, Tag, X, ChevronRight, Clock, User as UserIcon,
  ArrowUpCircle, ArrowDownCircle, MinusCircle
} from 'lucide-react';

export const PriceMapping: React.FC = () => {
  const { products, priceHistory, saveProduct } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Filter products: Only show active products
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

  // Logic for the History View
  const historyProduct = useMemo(() => {
    if (!historyProductId) return null;
    return products.find(p => p.id === historyProductId);
  }, [historyProductId, products]);

  const productHistory = useMemo(() => {
    if (!historyProductId) return [];
    return priceHistory
      .filter(h => h.productId === historyProductId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [priceHistory, historyProductId]);

  const openUpdateModal = (product: Product) => {
    setSelectedProduct(product);
    setNewPrice(product.currentPrice);
    setIsUpdateModalOpen(true);
  };

  const openHistoryModal = (productId: string) => {
    setHistoryProductId(productId);
    setIsHistoryModalOpen(true);
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
        setIsUpdateModalOpen(false);
    } catch (error) {
        console.error("Failed to update price", error);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Price Mapping</h1>
            <p className="text-stone-500 text-sm mt-1">
              {isAdmin ? 'Corporate rate management and historical auditing.' : 'Manage your product market rates.'}
            </p>
        </div>
        
        <div className="w-full max-w-xl">
            <Input 
                icon={Search} 
                placeholder={isAdmin ? "Search products or clerks..." : "Search your products..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white shadow-sm border-stone-200"
            />
        </div>
      </div>

      {/* Modern Card Grid - Responsive breakpoints: 1 col, 2 col (md), 3 col (xl) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProducts.map((product) => (
            <Card key={product.id} className="group relative flex flex-col p-0 overflow-hidden border-stone-200/60 hover:border-primary-200" noPadding>
                {/* Product Status Bar */}
                <div className="h-1.5 w-full bg-stone-100 group-hover:bg-primary-500 transition-colors"></div>
                
                <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-stone-50 text-stone-400 group-hover:bg-primary-50 group-hover:text-primary-600 flex items-center justify-center transition-all duration-300">
                                <Tag className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-stone-900 truncate">{product.name}</h3>
                                {isAdmin && (
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <UserIcon className="h-2.5 w-2.5" /> {product.createdByName}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge color="blue">Active</Badge>
                    </div>

                    <div className="bg-stone-50/50 rounded-2xl p-4 mb-6 border border-stone-100/50 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Current Market Rate</span>
                        <span className="text-3xl font-black text-stone-900 font-mono">
                            ₦{product.currentPrice.toLocaleString()}
                        </span>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => openHistoryModal(product.id)}
                            className="text-xs py-3"
                        >
                            <History className="h-3.5 w-3.5 mr-2" /> History
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={() => openUpdateModal(product)}
                            className="text-xs py-3 shadow-sm"
                        >
                            <TrendingUp className="h-3.5 w-3.5 mr-2" /> Update
                        </Button>
                    </div>
                </div>
            </Card>
        ))}

        {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 bg-white rounded-[2rem] border-2 border-dashed border-stone-200">
                <div className="p-4 bg-stone-50 rounded-full mb-4">
                    <Search className="h-10 w-10 opacity-20" />
                </div>
                <p className="font-bold text-stone-600">No products match your search</p>
                <p className="text-sm">Try adjusting your filters or search terms.</p>
            </div>
        )}
      </div>

      {/* History Modal - Optimized for Mobile & Professional Audit */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title="Price Timeline"
      >
        <div className="space-y-6">
            {historyProduct && (
                <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                        <Tag className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 truncate">{historyProduct.name}</h4>
                        <p className="text-xs text-stone-500 truncate">{historyProduct.description}</p>
                    </div>
                </div>
            )}

            <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
                {productHistory.map((log, idx) => {
                    const isIncrease = log.newPrice > log.oldPrice;
                    const isDecrease = log.newPrice < log.oldPrice;
                    
                    return (
                        <div key={log.id} className="relative">
                            {/* Timeline Node Icon */}
                            <div className={`absolute -left-[31px] top-1 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 
                                ${isIncrease ? 'bg-emerald-100 text-emerald-600' : 
                                  isDecrease ? 'bg-red-100 text-red-600' : 
                                  'bg-blue-100 text-blue-600'}`}>
                                {isIncrease ? <ArrowUpCircle className="h-4 w-4" /> : 
                                 isDecrease ? <ArrowDownCircle className="h-4 w-4" /> : 
                                 <MinusCircle className="h-4 w-4" />}
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-stone-800">
                                            {isIncrease ? 'Price Increased' : isDecrease ? 'Price Reduced' : 'Initial Pricing'}
                                        </span>
                                        <span className="text-[10px] text-stone-400 flex items-center mt-0.5">
                                            <Clock className="h-2.5 w-2.5 mr-1" /> {new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <Badge color={isIncrease ? 'green' : isDecrease ? 'red' : 'blue'}>
                                        ₦{log.newPrice.toLocaleString()}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-3 text-[10px] bg-stone-50 px-3 py-2 rounded-lg">
                                    <div className="flex-1">
                                        <span className="block text-stone-400 font-bold uppercase tracking-tighter">Previous</span>
                                        <span className="font-mono text-stone-500 line-through">₦{log.oldPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="h-4 w-px bg-stone-200"></div>
                                    <div className="flex-1 text-right">
                                        <span className="block text-stone-400 font-bold uppercase tracking-tighter">Updated By</span>
                                        <span className="font-medium text-stone-700">{log.changedBy}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {productHistory.length === 0 && (
                    <div className="text-center py-10 pr-8">
                        <History className="h-10 w-10 text-stone-200 mx-auto mb-3" />
                        <p className="text-sm text-stone-400 font-medium">No historical price changes recorded for this product yet.</p>
                    </div>
                )}
            </div>
        </div>
      </Modal>

      {/* Update Modal - Clean Single Focus */}
      <Modal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        title="Adjust Rate"
      >
         <form onSubmit={handleUpdatePrice} className="space-y-6">
             <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                    <DollarSign className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-black text-primary-900 text-lg truncate">{selectedProduct?.name}</h4>
                    <span className="text-xs text-primary-700 font-medium">Current: ₦{selectedProduct?.currentPrice.toLocaleString()}</span>
                </div>
             </div>

             <div className="space-y-4">
                 <Input 
                    label="New Market Rate (₦)" 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(Number(e.target.value))} 
                    required 
                    className="text-3xl font-mono font-black text-stone-800 py-6 border-2 focus:border-primary-500"
                    autoFocus
                 />
                 <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50 flex gap-3">
                     <TrendingUp className="h-5 w-5 text-amber-600 shrink-0" />
                     <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        This update will be logged in the product's history and will take immediate effect for all new transactions.
                     </p>
                 </div>
             </div>

             <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" fullWidth onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
                <Button type="submit" fullWidth disabled={submitting} className="shadow-lg shadow-primary-500/20">
                    {submitting ? 'Syncing...' : 'Apply Rate Change'}
                </Button>
             </div>
         </form>
      </Modal>
    </div>
  );
};
