import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { Quarry, UserRole } from '../types';
import { Plus, Edit, Truck, MapPin, User as UserIcon } from 'lucide-react';

interface QuarryCardProps {
  q: Quarry;
  onEdit: (q: Quarry) => void;
  showOwner?: boolean;
}

// Reusable Card Component for a Quarry - Moved outside for better performance and typing
const QuarryCard: React.FC<QuarryCardProps> = ({ q, onEdit, showOwner }) => (
  <Card className="group relative overflow-hidden h-full">
      <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-primary-500 transition-colors"></div>
      
      <div className="flex justify-between items-start mb-4 pr-12">
          <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <Truck className="h-6 w-6" />
          </div>
      </div>
      
      <div className="flex justify-between items-start">
          <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{q.name}</h3>
                <div className="flex items-center text-stone-500 text-sm">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  {q.location}
              </div>
          </div>
          
          <button 
              onClick={() => onEdit(q)}
              className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
              title="Edit Quarry"
          >
              <Edit className="h-4 w-4" />
          </button>
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-xs font-medium text-stone-400 bg-stone-50 px-2 py-1 rounded">ID: {q.id.substring(0, 8)}...</span>
            {showOwner && (
              <div className="flex items-center text-xs text-stone-400">
                    <UserIcon className="h-3 w-3 mr-1" />
                    {q.ownerName}
              </div>
            )}
      </div>
  </Card>
);

export const Quarries: React.FC = () => {
  const { quarries, saveQuarry } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuarry, setEditingQuarry] = useState<Quarry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // CLERK VIEW: Only see quarries they created
  const myQuarries = useMemo(() => {
    return quarries.filter(q => q.ownerId === user?.id);
  }, [quarries, user]);

  // ADMIN VIEW: Group quarries by Owner Name
  const quarriesByOwner = useMemo(() => {
    const groups: { [key: string]: Quarry[] } = {};
    quarries.forEach(q => {
      const owner = q.ownerName || 'Unknown User';
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push(q);
    });
    return groups;
  }, [quarries]);

  const [form, setForm] = useState({
    name: '',
    location: ''
  });

  const openModal = (quarry?: Quarry) => {
    if (quarry) {
      setEditingQuarry(quarry);
      setForm({ name: quarry.name, location: quarry.location });
    } else {
      setEditingQuarry(null);
      setForm({ name: '', location: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Quarry = {
        id: editingQuarry ? editingQuarry.id : Date.now().toString(),
        ownerId: editingQuarry ? editingQuarry.ownerId : user?.id, // Preserve owner or set to current
        ownerName: editingQuarry ? editingQuarry.ownerName : user?.name,
        ...form
      };
      await saveQuarry(payload);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving quarry:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const EmptyState = () => (
    <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
        <Truck className="h-12 w-12 mx-auto text-stone-300 mb-3" />
        <p className="text-stone-500 font-medium">No quarries found.</p>
        <Button variant="ghost" className="mt-2 text-primary-600" onClick={() => openModal()}>Create First Quarry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Quarries</h1>
            <p className="text-stone-500 text-sm mt-1">
                {isAdmin ? "Overview of all user quarries by owner." : "Manage your personal quarry sites."}
            </p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add Quarry</Button>
      </div>

      {isAdmin ? (
        <div className="space-y-12">
            {Object.entries(quarriesByOwner).map(([ownerName, ownerQuarries]: [string, Quarry[]]) => (
                <div key={ownerName} className="space-y-4">
                    {/* User Section Header */}
                    <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-stone-700 font-bold border border-stone-300 shadow-sm">
                            {ownerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-900">{ownerName}</h2>
                            <p className="text-xs text-stone-500 font-medium">{ownerQuarries.length} site{ownerQuarries.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    
                    {/* Grid for this user */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ownerQuarries.map(q => <QuarryCard key={q.id} q={q} onEdit={openModal} showOwner={true} />)}
                    </div>
                </div>
            ))}
            
            {quarries.length === 0 && <EmptyState />}
        </div>
      ) : (
        /* Clerk View: Simple Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myQuarries.map((q) => <QuarryCard key={q.id} q={q} onEdit={openModal} showOwner={false} />)}
            {myQuarries.length === 0 && <EmptyState />}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuarry ? "Edit Quarry" : "Add Quarry"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
             label="Quarry Name" 
             value={form.name} 
             onChange={(e) => setForm({...form, name: e.target.value})} 
             icon={Truck}
             placeholder="e.g. Abeokuta Site A"
             required 
          />
          <Input 
             label="Location" 
             value={form.location} 
             onChange={(e) => setForm({...form, location: e.target.value})} 
             icon={MapPin}
             placeholder="e.g. 123 Quarry Road, Ogun State"
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
