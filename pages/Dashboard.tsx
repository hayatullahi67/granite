
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge } from '../components/UI';
import { UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  DollarSign, ShoppingBag, Users, Truck, TrendingUp,
  Calendar, Clock, LayoutGrid, ChevronRight, Activity
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { transactions, customers, quarries } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === UserRole.ADMIN;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const myTransactions = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return transactions;
    return transactions.filter(t => t.createdBy === user.id);
  }, [transactions, user, isAdmin]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTx = myTransactions.filter(t => t.date.startsWith(today));
    
    const todaySales = todayTx.reduce((acc, t) => acc + (t.totalInvoice || 0), 0);
    const totalRevenue = myTransactions.reduce((acc, t) => acc + (t.totalInvoice || 0), 0);

    const myCustomersCount = isAdmin ? customers.length : customers.filter(c => c.createdBy === user?.id).length;
    const myQuarriesCount = isAdmin ? quarries.length : quarries.filter(q => q.ownerId === user?.id).length;

    return {
      todayTxCount: todayTx.length,
      todaySales,
      totalRevenue,
      myCustomersCount,
      myQuarriesCount
    };
  }, [myTransactions, customers, quarries, isAdmin, user]);

  const chartData = useMemo(() => {
    const data = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTotal = myTransactions
        .filter(t => t.date.startsWith(dateStr))
        .reduce((acc, t) => acc + (t.totalInvoice || 0), 0);
      
      data.push({
        name: days[date.getDay()],
        sales: dayTotal
      });
    }
    return data;
  }, [myTransactions]);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      
      {/* Refined Header */}
      <div className="bg-white px-7 py-5 rounded-[1.5rem] border border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/10">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight leading-tight">
              {greeting}, {user?.name.split(' ')[0].toLowerCase()}!
            </h1>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Sales Intelligence Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100 text-stone-500 hover:bg-white transition-colors cursor-default">
                <Calendar className="h-3.5 w-3.5 text-primary-500" />
                <span className="text-[10px] font-bold">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="bg-primary-50 px-4 py-1.5 rounded-lg border border-primary-100 flex items-center justify-center">
                <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">{user?.role}</span>
            </div>
        </div>
      </div>

      {/* Tighter KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard 
            label="Today's Sales" 
            value={`₦${stats.todaySales.toLocaleString()}`} 
            trend={`${stats.todayTxCount} tx today`}
            icon={DollarSign}
            color="emerald"
          />
          <DashboardCard 
            label="Total Revenue" 
            value={`₦${stats.totalRevenue.toLocaleString()}`} 
            trend="Lifetime performance"
            icon={ShoppingBag}
            color="blue"
          />
          <DashboardCard 
            label="My Quarries" 
            value={stats.myQuarriesCount} 
            trend="Active sites"
            icon={Truck}
            color="indigo"
          />
          <DashboardCard 
            label="My Customers" 
            value={stats.myCustomersCount} 
            trend="Registered clients"
            icon={Users}
            color="amber"
          />
      </div>

      {/* Main Content: Chart & Activity with matching height - Reduced to 360px for compactness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Balanced Performance Tracker */}
        <Card className="lg:col-span-8 border-stone-100 p-6 rounded-[1.5rem] flex flex-col h-[360px]">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-base font-bold text-stone-900 tracking-tight">Performance Tracker</h3>
               <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Daily billing volume (7 Days)</p>
             </div>
             <Badge color="blue">Live</Badge>
          </div>
          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#a8a29e" 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#a8a29e" 
                  fontSize={10} 
                  fontWeight={800} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `₦${v >= 1000 ? (v/1000).toLocaleString() + 'k' : v}`} 
                  width={65}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 8 }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '800' }} 
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4f46e5' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Matching Recent Sales List - Reduced to 360px */}
        <Card className="lg:col-span-4 border-stone-100 p-0 flex flex-col rounded-[1.5rem] overflow-hidden h-[360px]" noPadding>
          <div className="px-6 py-4 border-b border-stone-50 flex justify-between items-center bg-white sticky top-0 z-10">
             <div>
               <h3 className="text-base font-bold text-stone-900 tracking-tight">Recent Sales</h3>
               <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Latest 10 entries</p>
             </div>
             <div onClick={() => navigate('/transactions')} className="h-7 w-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer border border-stone-100">
               <ChevronRight className="h-4 w-4" />
             </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
              <ul className="divide-y divide-stone-50">
                {myTransactions.slice(0, 10).map((tx) => (
                  <li key={tx.id} className="px-5 py-3 hover:bg-stone-50/50 transition-all group cursor-default">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className="h-9 w-9 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:text-primary-500 group-hover:bg-white transition-all border border-stone-100 shadow-sm">
                             <Truck className="h-4.5 w-4.5" />
                         </div>
                         <div className="min-w-0">
                             <p className="truncate text-[13px] font-bold text-stone-800 leading-tight mb-0.5">{tx.customerName}</p>
                             <div className="flex items-center text-[8px] text-stone-400 font-bold uppercase tracking-widest gap-1.5">
                                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span className="text-stone-500">{tx.items?.[0]?.productName || 'Material'}</span>
                             </div>
                         </div>
                      </div>
                      <div className="text-right pl-2">
                         <div className="text-xs font-bold font-mono text-stone-900">
                            ₦{(tx.totalInvoice || 0).toLocaleString()}
                         </div>
                      </div>
                    </div>
                  </li>
                ))}
                {myTransactions.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-12 opacity-30">
                        <LayoutGrid className="h-8 w-8 text-stone-400 mb-2" />
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">No Sales Recorded</p>
                    </div>
                )}
              </ul>
          </div>
          <div className="px-6 py-3 bg-stone-50/50 border-t border-stone-100">
              <button 
                onClick={() => navigate('/transactions')} 
                className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.15em] hover:text-primary-800 transition-all flex items-center gap-1.5 mx-auto active:scale-95"
              >
                  View Records <ChevronRight className="h-3 w-3" />
              </button>
          </div>
        </Card>
      </div>
      
    </div>
  );
};

// --- Refined KPI Card Component ---
interface DashboardCardProps {
    label: string;
    value: string | number;
    trend: string;
    icon: any;
    color: 'emerald' | 'blue' | 'indigo' | 'amber';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ label, value, trend, icon: Icon, color }) => {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <Card className="p-5 border-stone-100 rounded-[1.25rem] group hover:border-primary-200 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
                    <h3 className="text-xl font-bold text-stone-900 tracking-tight leading-none pt-0.5">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${colorMap[color]} shadow-sm transition-transform group-hover:scale-110`}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
            </div>
            <div className="flex items-center gap-1.5 pt-2.5 border-t border-stone-50/50">
                <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{trend}</span>
            </div>
        </Card>
    );
};
