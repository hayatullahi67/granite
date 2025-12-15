
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge } from '../components/UI';
import { Package, TrendingUp, DollarSign, Award } from 'lucide-react';
import { UserRole } from '../types';

export const MySales: React.FC = () => {
  const { transactions } = useData();
  const { user } = useAuth();

  const salesData = useMemo(() => {
    if (!user) return [];
    
    // 1. Filter transactions by user (or show all for Admin if they want to see company wide, 
    // but request says "products user has sold", implying personal performance)
    const myTx = transactions.filter(t => t.createdBy === user.id);

    // 2. Group by Product ID/Name
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
        productStats[t.productName].revenue += (t.totalCost || 0);
        productStats[t.productName].count += 1;
    });

    // 3. Convert to Array and Sort by Revenue Desc
    return Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

  }, [transactions, user]);

  const totals = useMemo(() => {
      return salesData.reduce((acc, curr) => ({
          qty: acc.qty + curr.quantity,
          rev: acc.rev + curr.revenue
      }), { qty: 0, rev: 0 });
  }, [salesData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Product Tracker</h1>
            <p className="text-stone-500 text-sm mt-1">Track your total sales volume and revenue per product.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-glow">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                      <p className="text-primary-100 text-sm font-medium">Total Revenue</p>
                      <h3 className="text-2xl font-bold">₦{totals.rev.toLocaleString()}</h3>
                  </div>
              </div>
          </Card>
           <Card>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-stone-100 rounded-xl text-stone-600">
                      <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-stone-500 text-sm font-medium">Total Volume</p>
                      <h3 className="text-2xl font-bold text-stone-900">{totals.qty.toLocaleString()} <span className="text-sm font-normal text-stone-400">tons</span></h3>
                  </div>
              </div>
          </Card>
           <Card>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <Award className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-stone-500 text-sm font-medium">Top Product</p>
                      <h3 className="text-lg font-bold text-stone-900 truncate max-w-[150px]">{salesData[0]?.name || 'N/A'}</h3>
                  </div>
              </div>
          </Card>
      </div>

      <Card noPadding>
        <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-bold text-stone-900">Sales Breakdown</h3>
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
                    {salesData.map((item, index) => (
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
                                {item.quantity.toLocaleString()} t
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Badge color="green">₦{item.revenue.toLocaleString()}</Badge>
                            </td>
                        </tr>
                    ))}
                    {salesData.length === 0 && (
                        <tr><td colSpan={4} className="p-12 text-center text-stone-400">No sales records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
