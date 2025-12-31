
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button } from '../components/UI';
import { UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Users, Truck, TrendingUp, ArrowRight, Calendar, Package } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { transactions, customers, products, quarries } = useData();
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN;

  // Filter core data sets based on user role to ensure siloed view for clerks
  const myTransactions = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return transactions;
    return transactions.filter(t => t.createdBy === user.id);
  }, [transactions, user, isAdmin]);

  const myCustomers = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return customers;
    return customers.filter(c => c.createdBy === user.id);
  }, [customers, user, isAdmin]);

  const myQuarries = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return quarries;
    return quarries.filter(q => q.ownerId === user.id);
  }, [quarries, user, isAdmin]);

  const myProducts = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return products;
    return products.filter(p => p.createdBy === user.id);
  }, [products, user, isAdmin]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTx = myTransactions.filter(t => t.date.startsWith(today));
    
    const totalRevenue = myTransactions.reduce((acc, t) => acc + (t.totalInvoice || 0), 0);
    const todayRevenue = todayTx.reduce((acc, t) => acc + (t.totalInvoice || 0), 0);
    const totalVolume = myTransactions.reduce((acc, t) => acc + (t.quantity || 0), 0);

    return {
      todayCount: todayTx.length,
      todayRevenue,
      totalCustomers: myCustomers.length,
      totalProducts: myProducts.length,
      totalQuarries: myQuarries.length,
      totalRevenue,
      totalVolume,
      totalTxCount: myTransactions.length
    };
  }, [myTransactions, myCustomers, myProducts, myQuarries]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTotal = myTransactions
        .filter(t => t.date.startsWith(date))
        .reduce((acc, t) => acc + (t.totalInvoice || 0), 0);
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      return { date: dayName, sales: dayTotal };
    });
  }, [myTransactions]);

  const greetingTime = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <div>
            <h1 className="text-2xl font-bold text-stone-900">{greetingTime}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-stone-500 text-sm mt-1">
              {isAdmin ? "Here's the company overview for today." : "Here is your personal sales performance."}
            </p>
        </div>
        <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center px-4 py-2 bg-stone-50 rounded-xl text-sm font-medium text-stone-600 border border-stone-200">
                <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                {new Date().toLocaleDateString()}
             </div>
             <Badge color="purple">{user?.role}</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
            title="Today's Sales" 
            value={`₦${(stats.todayRevenue || 0).toLocaleString()}`} 
            icon={DollarSign} 
            color="green"
            trend={`${stats.todayCount} transactions`}
        />
        
        <StatCard 
          title="Total Revenue" 
          value={`₦${(stats.totalRevenue || 0).toLocaleString()}`} 
          icon={ShoppingBag} 
          color="blue"
          trend={isAdmin ? "Company wide" : "My Lifetime Sales"}
        />

        <StatCard 
            title={isAdmin ? "Total Quarries" : "My Quarries"} 
            value={stats.totalQuarries} 
            icon={Truck} 
            color="purple"
            trend={isAdmin ? "Active sites" : "Sites managed by me"}
        />
        
        <StatCard 
            title={isAdmin ? "Total Volume Sold" : "My Customers"} 
            value={isAdmin ? `${(stats.totalVolume || 0).toLocaleString()} tons` : stats.totalCustomers} 
            icon={isAdmin ? Package : Users} 
            color="yellow"
            trend={isAdmin ? "Across all quarries" : "Customers I registered"}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-stone-900">{isAdmin ? "Company Revenue" : "My Performance"}</h3>
             <Badge color="blue">Last 7 Days</Badge>
          </div>
          <div className="flex-1 w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="date" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`} />
                <Tooltip cursor={{ fill: '#f5f5f4', opacity: 0.5 }} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => [`₦${(value || 0).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} activeBar={{ fill: '#4f46e5' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col h-full" noPadding>
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
             <h3 className="text-lg font-bold text-stone-900">My Recent Sales</h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
              <ul className="divide-y divide-stone-50">
                {myTransactions.slice(0, 6).map((tx) => (
                  <li key={tx.id} className="p-4 hover:bg-stone-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 text-stone-500">
                             <Truck className="h-5 w-5" />
                         </div>
                         <div className="min-w-0">
                             <p className="truncate text-sm font-semibold text-stone-900">{tx.customerName}</p>
                             <p className="truncate text-xs text-stone-500">{tx.productName} • <span className="text-stone-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold text-stone-900">₦{(tx.totalInvoice || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </li>
                ))}
                {myTransactions.length === 0 && <li className="p-8 text-center text-stone-400 text-sm">No sales recorded yet.</li>}
              </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: any;
    color: 'blue' | 'green' | 'purple' | 'yellow';
    trend: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-emerald-50 text-emerald-600',
      purple: 'bg-indigo-50 text-indigo-600',
      yellow: 'bg-amber-50 text-amber-600'
  };

  return (
    <Card className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start">
         <div>
            <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">{value}</h3>
         </div>
         <div className={`p-3 rounded-xl ${colors[color]} transition-colors`}>
            <Icon className="h-6 w-6" />
         </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
          <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
          <span className="text-stone-400">{trend}</span>
      </div>
    </Card>
  );
};
