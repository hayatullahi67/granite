
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole, Quarry } from '../types';
import { 
  Search, TrendingUp, History, ArrowRight, DollarSign, 
  Calendar, Tag, X, Clock, User as UserIcon,
  ArrowUpCircle, ArrowDownCircle, MinusCircle, Truck
} from 'lucide-react';

export const PriceMapping: React.FC = () => {
  const { products, quarries, quarryPrices, priceHistory, saveQuarryPrice } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarryId, setSelectedQuarryId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeUpdate, setActiveUpdate] = useState<{ quarry: Quarry; product: Product; price: number } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ quarryId: string; productId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const visibleQuarries = useMemo(() => {
    const list = isAdmin ? quarries : quarries.filter(q => q.ownerId === user?.id);
    return list.filter(q => q.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [quarries, user, isAdmin, searchTerm]);

  const activeProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);

  const selectedQuarry = useMemo(() => 
    quarries.find(q => q.id === selectedQuarryId), 
    [selectedQuarryId, quarries]
  );

  const openUpdate = (product: Product) => {
    if (!selectedQuarry) return;
    const currentRate = quarryPrices.find(qp => qp.quarryId === selectedQuarry.id && qp.productId === product.id)?.price || 0;
    setActiveUpdate({ quarry: selectedQuarry, product, price: currentRate });
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpdate) return;
    setSubmitting(true);
    try {
        await saveQuarryPrice(activeUpdate.quarry.id, activeUpdate.product.id, activeUpdate.price);
        setIsUpdateModalOpen(false);
    } finally {
        setSubmitting(false);
    }
  };

  const openHistory = (productId: string) => {
    if (!selectedQuarryId) return;
    setHistoryTarget({ quarryId: selectedQuarryId, productId });
    setIsHistoryModalOpen(true);
  };

  const filteredHistory = useMemo(() => {
      if (!historyTarget) return [];
      return priceHistory.filter(h => h.quarryId === historyTarget.quarryId && h.productId === historyTarget.productId);
  }, [historyTarget, priceHistory]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Location Rate Mapping</h1>
        <div className="w-full max-w-xl">
            <Input 
                icon={Truck} 
                placeholder="Search by Quarry Site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white shadow-sm"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Quarry Selection */}
          <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Select a Quarry</h3>
              {visibleQuarries.map(q => (
                  <button 
                    key={q.id}
                    onClick={() => setSelectedQuarryId(q.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedQuarryId === q.id ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-500/20 text-white' : 'bg-white border-stone-200 text-stone-600 hover:border-primary-300'}`}
                  >
                      <Truck className={`h-5 w-5 ${selectedQuarryId === q.id ? 'text-primary-200' : 'text-stone-300'}`} />
                      <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{q.name}</p>
                          <p className={`text-[10px] truncate ${selectedQuarryId === q.id ? 'text-primary-100' : 'text-stone-400'}`}>{q.location}</p>
                      </div>
                  </button>
              ))}
              {visibleQuarries.length === 0 && <p className="text-sm text-stone-400 italic">No quarries found matching your search.</p>}
          </div>

          {/* Main Content: Rate Cards for selected Quarry */}
          <div className="lg:col-span-8 space-y-4">
              {!selectedQuarryId ? (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-stone-200 text-stone-400">
                      <DollarSign className="h-12 w-12 opacity-10 mb-4" />
                      <p className="font-bold">Select a site to manage rates</p>
                  </div>
              ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between bg-primary-50 p-6 rounded-[2rem] border border-primary-100">
                          <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                                  <Truck className="h-7 w-7" />
                              </div>
                              <div>
                                  <h2 className="text-xl font-black text-primary-900">{selectedQuarry?.name}</h2>
                                  <p className="text-xs text-primary-700 font-medium">{selectedQuarry?.location}</p>
                              </div>
                          </div>
                          <Badge color="purple">Price List</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeProducts.map(prod => {
                              const rate = quarryPrices.find(qp => qp.quarryId === selectedQuarryId && qp.productId === prod.id)?.price || 0;
                              return (
                                  <Card key={prod.id} className="p-5 border-stone-200/60 group hover:border-primary-200 transition-all shadow-none hover:shadow-xl hover:shadow-stone-200/30">
                                      <div className="flex justify-between items-start mb-4">
                                          <div className="flex items-center gap-2">
                                              <Tag className="h-4 w-4 text-stone-300 group-hover:text-primary-500" />
                                              <span className="font-bold text-stone-800 text-sm truncate max-w-[120px]">{prod.name}</span>
                                          </div>
                                          <button onClick={() => openHistory(prod.id)} className="p-1.5 text-stone-300 hover:text-stone-600 rounded-lg hover:bg-stone-50"><History className="h-4 w-4" /></button>
                                      </div>
                                      <div className="bg-stone-50 group-hover:bg-primary-50 transition-colors p-4 rounded-xl flex flex-col items-center mb-4">
                                          <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Current Rate</span>
                                          <span className="text-2xl font-black text-stone-900 font-mono">₦{(rate || 0).toLocaleString()}</span>
                                      </div>
                                      <Button fullWidth size="sm" variant="secondary" onClick={() => openUpdate(prod)}>Update Rate</Button>
                                  </Card>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Update Price Modal */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Update Site Rate">
          {activeUpdate && (
              <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary-600"><Truck className="h-5 w-5" /></div>
                      <div className="min-w-0">
                          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{activeUpdate.quarry.name}</p>
                          <p className="font-black text-stone-800 truncate">{activeUpdate.product.name}</p>
                      </div>
                  </div>
                  <Input 
                    label="Market Price per Ton (₦)" 
                    type="number" 
                    value={activeUpdate.price} 
                    onChange={(e) => setActiveUpdate({...activeUpdate, price: Number(e.target.value)})}
                    required 
                    className="text-3xl font-mono font-black py-6 border-2 focus:border-primary-500"
                    autoFocus
                  />
                  <Button type="submit" fullWidth size="lg" disabled={submitting}>{submitting ? 'Updating...' : 'Set New Rate'}</Button>
              </form>
          )}
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Rate Evolution">
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredHistory.map((log) => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-stone-100 pb-6 last:pb-0">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary-500 border-4 border-white shadow-sm"></div>
                      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-stone-400 flex items-center"><Clock className="h-2.5 w-2.5 mr-1" /> {new Date(log.date).toLocaleDateString()}</span>
                              <Badge color={log.newPrice > log.oldPrice ? 'green' : 'red'}>₦{(log.newPrice || 0).toLocaleString()}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                              <span className="line-through opacity-40">₦{(log.oldPrice || 0).toLocaleString()}</span>
                              <ArrowRight className="h-2 w-2" />
                              <span>Updated by {log.changedBy}</span>
                          </div>
                      </div>
                  </div>
              ))}
              {filteredHistory.length === 0 && <p className="text-center text-stone-400 text-sm py-10">No history available for this combination.</p>}
          </div>
      </Modal>
    </div>
  );
};
