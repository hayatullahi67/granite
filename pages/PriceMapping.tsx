
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Product, UserRole, Quarry } from '../types';
// Added MapPin to the imports from lucide-react
import { 
  Search, TrendingUp, History, ArrowRight, DollarSign, 
  Calendar, Tag, X, Clock, User as UserIcon,
  ArrowUpCircle, ArrowDownCircle, MinusCircle, Truck,
  ChevronRight, Filter, Layers, Activity, TrendingDown, MapPin
} from 'lucide-react';

export const PriceMapping: React.FC = () => {
  const { products, quarries, quarryPrices, priceHistory, saveQuarryPrice } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarryId, setSelectedQuarryId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeUpdate, setActiveUpdate] = useState<{ quarry: Quarry; product: Product; price: number } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ quarryId: string; productId: string; productName: string } | null>(null);
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

  const openHistory = (product: Product) => {
    if (!selectedQuarryId) return;
    setHistoryTarget({ quarryId: selectedQuarryId, productId: product.id, productName: product.name });
    setIsHistoryModalOpen(true);
  };

  const filteredHistory = useMemo(() => {
      if (!historyTarget) return [];
      return priceHistory.filter(h => h.quarryId === historyTarget.quarryId && h.productId === historyTarget.productId);
  }, [historyTarget, priceHistory]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header & Global Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="space-y-1">
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Market Rate Sheets</h1>
            <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Track & Authorize material price adjustments</p>
        </div>
        <div className="w-full lg:w-96">
            <Input 
                icon={Search} 
                placeholder="Search Quarry Site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-50 border-stone-200 h-12"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Quarry Selector - Scrollable Horizontal on Mobile, Side Menu on Desktop */}
          <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Truck className="h-3 w-3" /> Select Active Site
                </h3>
                <Badge color="blue">{visibleQuarries.length}</Badge>
              </div>
              
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
                  {visibleQuarries.map(q => (
                      <button 
                        key={q.id}
                        onClick={() => setSelectedQuarryId(q.id)}
                        className={`
                            shrink-0 w-[240px] lg:w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group
                            ${selectedQuarryId === q.id 
                                ? 'bg-primary-600 border-primary-600 shadow-xl shadow-primary-500/20 text-white translate-x-1' 
                                : 'bg-white border-stone-100 text-stone-600 hover:border-primary-200 hover:shadow-md'}
                        `}
                      >
                          <div className="flex items-center gap-4 min-w-0">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${selectedQuarryId === q.id ? 'bg-white/20' : 'bg-stone-50'}`}>
                                  <MapPin className={`h-5 w-5 ${selectedQuarryId === q.id ? 'text-white' : 'text-stone-300'}`} />
                              </div>
                              <div className="min-w-0">
                                  <p className="font-black text-sm truncate leading-tight mb-0.5">{q.name}</p>
                                  <p className={`text-[10px] font-bold uppercase truncate tracking-tighter ${selectedQuarryId === q.id ? 'text-primary-100' : 'text-stone-400'}`}>{q.location}</p>
                              </div>
                          </div>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${selectedQuarryId === q.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                      </button>
                  ))}
                  {visibleQuarries.length === 0 && (
                      <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-stone-100 w-full">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">No matching sites</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Rate Matrix Management */}
          <div className="lg:col-span-8 space-y-4">
              {!selectedQuarryId ? (
                  <Card className="h-[500px] flex flex-col items-center justify-center bg-white border-none shadow-soft rounded-[2.5rem]">
                      <div className="h-20 w-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                        <Layers className="h-10 w-10 text-stone-100" />
                      </div>
                      <h2 className="text-xl font-black text-stone-900 mb-2">Select a site to view rates</h2>
                      <p className="text-stone-400 text-sm font-medium text-center max-w-xs">Pick a quarry from the list to manage material pricing and audit history.</p>
                  </Card>
              ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      
                      {/* Active Site Spotlight */}
                      <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                              <TrendingUp className="h-40 w-40 -rotate-12" />
                          </div>
                          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                  <Badge color="purple">Active Rate Sheet</Badge>
                                  <h2 className="text-3xl font-black mt-4 tracking-tight leading-none">{selectedQuarry?.name}</h2>
                                  <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mt-3 flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-primary-400" /> {selectedQuarry?.location}
                                  </p>
                              </div>
                              <div className="bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-md border border-white/5">
                                  <p className="text-[9px] font-black text-primary-300 uppercase tracking-[0.2em] mb-1">Managed By</p>
                                  <p className="text-base font-black truncate max-w-[150px]">{selectedQuarry?.ownerName}</p>
                              </div>
                          </div>
                      </div>

                      {/* Responsive Grid of Product Rates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeProducts.map(prod => {
                              const rate = quarryPrices.find(qp => qp.quarryId === selectedQuarryId && qp.productId === prod.id)?.price || 0;
                              return (
                                  <Card key={prod.id} className="p-6 border-stone-100 rounded-[2rem] group hover:border-primary-200 transition-all shadow-sm hover:shadow-xl hover:shadow-stone-200/20 bg-white flex flex-col h-full">
                                      <div className="flex justify-between items-start mb-6">
                                          <div className="flex items-center gap-3">
                                              <div className="h-9 w-9 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                                                <Tag className="h-5 w-5" />
                                              </div>
                                              <div className="min-w-0">
                                                <span className="block font-black text-stone-800 text-sm truncate max-w-[140px] leading-tight mb-0.5">{prod.name}</span>
                                                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Load Price Tracker</span>
                                              </div>
                                          </div>
                                          <button 
                                            onClick={() => openHistory(prod)} 
                                            className="h-8 w-8 flex items-center justify-center text-stone-300 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all"
                                            title="View Price Evolution"
                                          >
                                            <History className="h-4 w-4" />
                                          </button>
                                      </div>
                                      
                                      <div className="bg-stone-50/50 group-hover:bg-white transition-colors p-5 rounded-[1.5rem] border border-stone-100 flex flex-col items-center justify-center mb-6">
                                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1.5">Current Authorized Rate</p>
                                          <div className="flex items-baseline gap-2">
                                              <span className="text-3xl font-black text-stone-900 font-mono tracking-tighter">₦{(rate || 0).toLocaleString()}</span>
                                              <span className="text-[10px] font-bold text-stone-400 uppercase">/ Ton</span>
                                          </div>
                                      </div>
                                      
                                      <div className="mt-auto space-y-2">
                                        <Button fullWidth size="md" onClick={() => openUpdate(prod)} className="rounded-xl font-black uppercase text-[10px] tracking-[0.15em] py-3 shadow-none hover:shadow-lg">
                                            Adjust Price
                                        </Button>
                                        <button 
                                            onClick={() => openHistory(prod)}
                                            className="w-full py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest hover:text-primary-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            View Price Evolution <ChevronRight className="h-3 w-3" />
                                        </button>
                                      </div>
                                  </Card>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Modern Price Adjustment Modal */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Authorize New Rate" maxWidth="sm:max-w-md">
          {activeUpdate && (
              <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="bg-primary-50 p-6 rounded-[2rem] border border-primary-100 flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary-600"><TrendingUp className="h-6 w-6" /></div>
                      <div className="min-w-0">
                          <p className="text-[9px] text-primary-400 font-black uppercase tracking-widest leading-none mb-1">{activeUpdate.quarry.name}</p>
                          <p className="font-black text-stone-900 text-lg truncate leading-tight">{activeUpdate.product.name}</p>
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">New Market Rate (₦/Ton)</label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 font-black text-2xl font-mono">₦</span>
                        <input 
                            type="number" 
                            value={activeUpdate.price || ''} 
                            onChange={(e) => setActiveUpdate({...activeUpdate, price: Number(e.target.value)})}
                            className="w-full text-4xl font-mono font-black py-8 pl-12 pr-6 border-2 border-stone-100 rounded-[2.5rem] focus:border-primary-500 focus:ring-0 transition-all text-stone-900 bg-stone-50"
                            autoFocus
                        />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button type="submit" fullWidth size="lg" disabled={submitting} className="rounded-2xl h-16 shadow-glow text-lg font-black tracking-tight">
                        {submitting ? 'Updating System...' : 'Authorize Rate Change'}
                    </Button>
                    <Button type="button" variant="ghost" className="rounded-xl h-12 text-stone-400" onClick={() => setIsUpdateModalOpen(false)}>Discard Change</Button>
                  </div>
              </form>
          )}
      </Modal>

      {/* Evolution Timeline Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Price Evolution Timeline" maxWidth="sm:max-w-xl">
          <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-stone-100 pb-6 mb-6">
                  <div className="h-12 w-12 bg-stone-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner"><Activity className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-black text-stone-900 tracking-tight leading-none mb-1">{historyTarget?.productName}</h4>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Historical Pricing Audit</p>
                  </div>
              </div>
              
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {filteredHistory.map((log, idx) => {
                      const diff = log.newPrice - log.oldPrice;
                      const isUp = diff > 0;
                      return (
                          <div key={log.id} className="relative pl-8 pb-8 last:pb-2 border-l-2 border-stone-100 ml-3">
                              <div className={`absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4 border-white shadow-md flex items-center justify-center ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                  {isUp ? <ArrowUpCircle className="h-3 w-3 text-white" /> : <ArrowDownCircle className="h-3 w-3 text-white" />}
                              </div>
                              <div className="bg-white p-5 rounded-[1.75rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                      <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                              <span className="text-xl font-black font-mono text-stone-900">₦{(log.newPrice || 0).toLocaleString()}</span>
                                              <Badge color={isUp ? 'green' : 'red'}>
                                                  {isUp ? '+' : ''}₦{diff.toLocaleString()}
                                              </Badge>
                                          </div>
                                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                              <UserIcon className="h-3 w-3" /> Updated by {log.changedBy}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mb-1">Authorization Date</p>
                                          <p className="text-xs font-bold text-stone-800 flex items-center justify-end gap-1.5"><Calendar className="h-3 w-3 text-stone-400" /> {new Date(log.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                          <p className="text-[9px] font-bold text-stone-400 uppercase mt-0.5">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
                  {filteredHistory.length === 0 && (
                      <div className="py-20 text-center flex flex-col items-center">
                        <div className="h-16 w-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                          <Clock className="h-8 w-8 text-stone-100" />
                        </div>
                        <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">No previous changes recorded</p>
                        <p className="text-[10px] text-stone-300 font-medium max-w-[200px] mt-1 italic">This material is currently at its initial registered price.</p>
                      </div>
                  )}
              </div>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-100">
              <Button fullWidth variant="secondary" className="rounded-xl h-12" onClick={() => setIsHistoryModalOpen(false)}>Close Timeline</Button>
          </div>
      </Modal>
    </div>
  );
};
