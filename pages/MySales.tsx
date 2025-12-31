
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Input } from '../components/UI';
import { Package, TrendingUp, DollarSign, Award, Users, Filter, Search, BarChart3, ArrowUpRight } from 'lucide-react';
import { UserRole } from '../types';

export const MySales: React.FC = () => {
  const { transactions } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === UserRole.ADMIN;

  // Logic for Admin: Sales by User
  const adminUserStats = useMemo(() => {
    if (!isAdmin) return [];
    
    const userGroups: Record<string, { userId: string; name: string; totalRevenue: number; totalVolume: number; txCount: number; topProduct: string; productStats: Record<string, number> }> = {};

    transactions.forEach(t => {
        const creatorId = t.createdBy;
        const creatorName = t.createdByName || 'Unknown Clerk';
        
        if (!userGroups[creatorId]) {
            userGroups[creatorId] = {
                userId: creatorId,
                name: creatorName,
                totalRevenue: 0,
                totalVolume: 0,
                txCount: 0,
                topProduct: '',
                productStats: {}
            };
        }
        
        const group = userGroups[creatorId];
        group.totalRevenue += (t.totalInvoice || 0);
        group.totalVolume += (t.quantity || 0);
        group.txCount += 1;
        
        group.productStats[t.productName] = (group.productStats[t.productName] || 0) + (t.totalInvoice || 0);
    });

    // Determine Top Product per user
    Object.values(userGroups).forEach(group => {
        let maxRev = 0;
        let bestProd = 'N/A';
        Object.entries(group.productStats).forEach(([prod, rev]) => {
            if (rev > maxRev) {
                maxRev = rev;
                bestProd = prod;
            }
        });
        group.topProduct = bestProd;
    });

    return Object.values(userGroups).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [transactions, isAdmin]);

  // Logic for Clerks: Personal Product Tracker
  const personalSalesData = useMemo(() => {
    if (isAdmin) return [];
    if (!user) return [];
    
    const myTx = transactions.filter(t => t.createdBy === user.id);
    const productStats: Record<string, { name: string; quantity: number; revenue: number; count: number }> = {};

    myTx.forEach(t => {
        if (!productStats[t.productName]) {
            productStats[t.productName] = { 
                name: t.productName, 
                quantity: 0, 
                revenue: 0,
                count: 0
            };
        }
        productStats[t.productName].quantity += (t.quantity || 0);
        productStats[t.productName].revenue += (t.totalInvoice || 0);
        productStats[t.productName].count += 1;
    });

    return Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
  }, [transactions, user, isAdmin]);

  const totals = useMemo(() => {
      return transactions.reduce((acc, t) => {
          const isMyTx = isAdmin || t.createdBy === user?.id;
          if (isMyTx) {
              acc.qty += (t.quantity || 0);
              acc.rev += (t.totalInvoice || 0);
              acc.count += 1;
          }
          return acc;
      }, { qty: 0, rev: 0, count: 0 });
  }, [transactions, user, isAdmin]);

  const filteredAdminStats = useMemo(() => {
      return adminUserStats.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [adminUserStats, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">{isAdmin ? 'User Sales Tracker' : 'Product Tracker'}</h1>
            <p className="text-stone-500 text-sm mt-1">
                {isAdmin ? 'Monitoring performance and sales metrics across all clerks.' : 'Track your total sales volume and revenue per product.'}
            </p>
        </div>
        {isAdmin && (
            <div className="w-full sm:w-64">
                <Input 
                    icon={Search}
                    placeholder="Search by clerk name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white shadow-sm"
                />
            </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-glow">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                      <p className="text-primary-100 text-[10px] font-black uppercase tracking-wider">Total Revenue</p>
                      <h3 className="text-2xl font-black">₦{(totals.rev || 0).toLocaleString()}</h3>
                  </div>
              </div>
          </Card>
           <Card className="border-none bg-white shadow-soft">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-stone-100 rounded-xl text-stone-600">
                      <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-wider">Total Tonnage</p>
                      <h3 className="text-2xl font-black text-stone-900">{(totals.qty || 0).toLocaleString()} <span className="text-xs font-bold text-stone-400">tons</span></h3>
                  </div>
              </div>
          </Card>
           <Card className="border-none bg-white shadow-soft">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                      <Award className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-wider">{isAdmin ? 'Active Clerks' : 'Sales Count'}</p>
                      <h3 className="text-2xl font-black text-stone-900">{isAdmin ? adminUserStats.length : totals.count}</h3>
                  </div>
              </div>
          </Card>
      </div>

      {isAdmin ? (
          /* Admin Specific View: Clerk Performance Table */
          <Card noPadding className="border-none shadow-soft overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-bold text-stone-900">Clerk Performance Leaderboard</h3>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100">
                    <thead className="bg-stone-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">Clerk Name</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-stone-400 uppercase tracking-widest">Transactions</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-stone-400 uppercase tracking-widest">Volume (Tons)</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">Top Selling Product</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-stone-400 uppercase tracking-widest">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-stone-50">
                        {filteredAdminStats.map((stat, idx) => (
                            <tr key={stat.userId} className="hover:bg-stone-50/80 transition-all group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-stone-100 text-stone-500'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-stone-900 leading-tight">{stat.name}</div>
                                            <div className="text-[10px] text-stone-400 uppercase tracking-tighter">Clerk Profile</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-stone-100 text-stone-600">
                                        {stat.txCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="text-sm font-mono text-stone-600 font-bold">{(stat.totalVolume || 0).toLocaleString()}t</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-3.5 w-3.5 text-stone-400" />
                                        <span className="text-xs font-medium text-stone-700 truncate max-w-[120px]">{stat.topProduct}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-emerald-600 font-mono">₦{(stat.totalRevenue || 0).toLocaleString()}</span>
                                        <div className="text-[9px] text-stone-400 flex items-center gap-1 group-hover:text-primary-500 transition-colors">
                                            Contribution <ArrowUpRight className="h-2 w-2" />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </Card>
      ) : (
          /* Clerk Specific View: Product Breakdown Table */
          <Card noPadding className="border-none shadow-soft overflow-hidden">
            <div className="p-6 border-b border-stone-100">
                <h3 className="text-lg font-bold text-stone-900">Personal Sales Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100">
                    <thead className="bg-stone-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">Transaction Count</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Total Tons Sold</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-stone-50">
                        {personalSalesData.map((item, index) => (
                            <tr key={index} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center mr-3 text-stone-500">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-stone-900">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                                        {item.count}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-stone-600">
                                    {(item.quantity || 0).toLocaleString()} t
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Badge color="green">₦{(item.revenue || 0).toLocaleString()}</Badge>
                                </td>
                            </tr>
                        ))}
                        {personalSalesData.length === 0 && (
                            <tr><td colSpan={4} className="p-12 text-center text-stone-400">No sales records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </Card>
      )}
    </div>
  );
};
