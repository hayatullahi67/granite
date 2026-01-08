
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Quarry, UserRole, Product } from '../types';
import {
  Plus, Edit, Truck, MapPin, User as UserIcon, Tag,
  DollarSign, ArrowRight, Eye, Info, LayoutGrid,
  ChevronRight, Activity, Calendar, Package, CheckCircle
} from 'lucide-react';

export const Quarries: React.FC = () => {
  const { quarries, products, quarryPrices, saveQuarry, saveQuarryPrice } = useData();
  const { user } = useAuth();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data state
  const [editingQuarry, setEditingQuarry] = useState<Quarry | null>(null);
  const [selectedQuarry, setSelectedQuarry] = useState<Quarry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Track prices locally in modal before saving
  const [tempPrices, setTempPrices] = useState<Record<string, number>>({});

  const isAdmin = user?.role === UserRole.ADMIN;

  const myQuarries = useMemo(() => {
    return isAdmin ? quarries : quarries.filter(q => q.ownerId === user?.id);
  }, [quarries, user, isAdmin]);

  const activeProducts = useMemo(() => {
    return products.filter(p => !p.isDeleted && (isAdmin || p.createdBy === user?.id));
  }, [products, user, isAdmin]);

  const [form, setForm] = useState({ name: '', location: '' });

  // Methods
  const openFormModal = (quarry?: Quarry) => {
    if (quarry) {
      setEditingQuarry(quarry);
      setForm({ name: quarry.name, location: quarry.location });

      const prices: Record<string, number> = {};
      quarryPrices.filter(qp => qp.quarryId === quarry.id).forEach(qp => {
        prices[qp.productId] = qp.price;
      });
      setTempPrices(prices);
    } else {
      setEditingQuarry(null);
      setForm({ name: '', location: '' });
      setTempPrices({});
    }
    setIsFormModalOpen(true);
  };

  const openDetailModal = (quarry: Quarry) => {
    setSelectedQuarry(quarry);
    setIsDetailModalOpen(true);
  };

  const handlePriceChange = (productId: string, val: number) => {
    setTempPrices(prev => ({ ...prev, [productId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const qId = editingQuarry ? editingQuarry.id : Date.now().toString();
      const payload: Quarry = {
        id: qId,
        ownerId: editingQuarry ? editingQuarry.ownerId : user?.id,
        ownerName: editingQuarry ? editingQuarry.ownerName : user?.name,
        ...form
      };
      await saveQuarry(payload);

      // Save all set prices
      for (const prodId of Object.keys(tempPrices)) {
        if (tempPrices[prodId] > 0) {
          await saveQuarryPrice(qId, prodId, tempPrices[prodId]);
        }
      }

      setIsFormModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Details Modal
  const currentQuarryPrices = useMemo(() => {
    if (!selectedQuarry) return [];
    return quarryPrices
      .filter(qp => qp.quarryId === selectedQuarry.id)
      .map(qp => {
        const prod = products.find(p => p.id === qp.productId);
        return { ...qp, productName: prod?.name || 'Unknown' };
      });
  }, [selectedQuarry, quarryPrices, products]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Quarry Sites</h1>
          <p className="text-stone-500 text-sm mt-1">{isAdmin ? "Full site network and fleet tracking." : "Sites managed under your profile."}</p>
        </div>
        <Button onClick={() => openFormModal()} className="shadow-glow px-6"><Plus className="h-4 w-4 mr-2" /> Register New Site</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myQuarries.map((q) => (
          <Card
            key={q.id}
            className="relative group p-0 overflow-hidden flex flex-col cursor-pointer border-stone-200/60 hover:border-primary-300 transition-all duration-300 hover:shadow-2xl hover:shadow-stone-200/40"
            noPadding
            onClick={() => openDetailModal(q)}
          >
            {/* Visual Accent */}
            <div className="h-1.5 w-full bg-stone-100 group-hover:bg-primary-500 transition-colors"></div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-stone-50 group-hover:bg-primary-50 flex items-center justify-center text-stone-400 group-hover:text-primary-600 transition-all duration-300 shadow-sm">
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openFormModal(q); }}
                    className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-bold text-stone-900 tracking-tight group-hover:text-primary-700 transition-colors">{q.name}</h3>
                <p className="text-sm text-stone-500 flex items-center"><MapPin className="h-3.5 w-3.5 mr-1.5 text-stone-300" /> {q.location}</p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-stone-50">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-500 uppercase">
                    {q.ownerName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isAdmin ? q.ownerName : 'Active Site'}</span>
                </div>
                <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Card>
        ))}
        {myQuarries.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 bg-white rounded-[2rem] border-2 border-dashed border-stone-200">
            <LayoutGrid className="h-12 w-12 opacity-10 mb-4" />
            <p className="font-bold">No quarries found</p>
            <p className="text-sm">Get started by registering your first site.</p>
          </div>
        )}
      </div>

      {/* Detail Modal - Comprehensive View */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Quarry Overview"
      >
        {selectedQuarry && (
          <div className="space-y-8 pb-4">
            {/* Header Information */}
            <div className="relative overflow-hidden rounded-[2rem] bg-stone-900 text-white p-8 shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Truck className="h-32 w-32 -rotate-12" />
              </div>
              <div className="relative z-10">
                <Badge color="purple">Operational Site</Badge>
                <h2 className="text-3xl font-black mt-4 mb-2 tracking-tight leading-tight">{selectedQuarry.name}</h2>
                <p className="text-stone-400 text-sm flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-primary-400" /> {selectedQuarry.location}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                    {selectedQuarry.ownerName?.charAt(0)}
                  </div>
                  <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">Managed by {selectedQuarry.ownerName}</span>
                </div>
              </div>
            </div>

            {/* Price List Section */}
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="font-black text-stone-800 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary-500" /> Site Rate Sheet
                </h4>
                <div className="flex items-center text-[10px] text-stone-400 font-bold uppercase tracking-tighter gap-1.5">
                  <Activity className="h-3 w-3" /> Live Prices
                </div>
              </div>

              <div className="space-y-3">
                {currentQuarryPrices.map(qp => (
                  <div key={qp.id} className="group bg-white hover:bg-stone-50 p-5 rounded-[1.5rem] border border-stone-100 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-stone-50 group-hover:bg-white flex items-center justify-center text-stone-400 group-hover:text-primary-500 transition-colors shadow-inner">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-800 text-base leading-none mb-1">{qp.productName}</p>
                        <div className="flex items-center text-[10px] text-stone-400 font-bold uppercase tracking-tighter gap-1">
                          <Calendar className="h-2.5 w-2.5" /> Updated {qp.updatedAt ? new Date(qp.updatedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-stone-900 font-mono leading-none mb-0.5">₦{(qp.price || 0).toLocaleString()}</div>
                      <span className="text-[9px] text-stone-500 uppercase font-black tracking-widest bg-stone-100 px-1.5 py-0.5 rounded-md">Per Ton</span>
                    </div>
                  </div>
                ))}
                {currentQuarryPrices.length === 0 && (
                  <div className="text-center py-16 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Info className="h-8 w-8 text-stone-200" />
                    </div>
                    <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">No Rates Defined</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto leading-relaxed font-medium">Market prices have not been established for this site yet.</p>
                    <button onClick={() => { setIsDetailModalOpen(false); openFormModal(selectedQuarry); }} className="mt-6 px-6 py-2 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-stone-800 transition-colors uppercase tracking-widest shadow-lg">Configure Now</button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-4 pt-6 border-t border-stone-100">
              <Button variant="secondary" fullWidth size="lg" className="rounded-2xl" onClick={() => { setIsDetailModalOpen(false); openFormModal(selectedQuarry); }}>
                <Edit className="h-4 w-4 mr-2" /> Modify Site
              </Button>
              <Button fullWidth size="lg" className="rounded-2xl shadow-glow" onClick={() => setIsDetailModalOpen(false)}>
                <CheckCircle className="h-4 w-4 mr-2" /> Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal - Registration & Price Sheet */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingQuarry ? "Site Configuration" : "New Quarry Site"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Input label="Site Display Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={Truck} required placeholder="e.g. Apex Granite Site-A" />
            <Input label="Geographical Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} icon={MapPin} required placeholder="State, Region or GPS Coordinates" />
          </div>

          <div className="border-t border-stone-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-primary-500" />
              <h4 className="font-black text-sm text-stone-800 uppercase tracking-widest">Price Management</h4>
            </div>
            <div className="space-y-3 bg-stone-50 p-4 rounded-[1.5rem] border border-stone-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {activeProducts.map(prod => (
                <div key={prod.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-stone-100 shadow-sm group hover:border-primary-200 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-900 truncate">{prod.name}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">Market Rate</p>
                  </div>
                  <div className="w-32 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-black text-xs">₦</span>
                    <input
                      type="number"
                      value={tempPrices[prod.id] || ''}
                      onChange={(e) => handlePriceChange(prod.id, Number(e.target.value))}
                      className="w-full bg-stone-50 border-none rounded-xl text-sm font-mono font-black focus:ring-1 focus:ring-primary-500 p-2.5 pl-7 text-right"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
              {activeProducts.length === 0 && (
                <div className="text-center py-6">
                  <Tag className="h-8 w-8 text-stone-200 mx-auto mb-2" />
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">No materials defined</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="ghost" className="rounded-xl px-6" onClick={() => setIsFormModalOpen(false)}>Discard</Button>
            <Button type="submit" disabled={submitting} className="shadow-lg shadow-primary-500/10 rounded-xl px-8">
              {submitting ? 'Processing...' : (editingQuarry ? 'Update Site' : 'Create Site')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
