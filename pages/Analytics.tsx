
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button, Select, Input } from '../components/UI';
import { UserRole } from '../types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, TrendingUp, DollarSign, Calendar, Filter, Printer,
    Download, FileSpreadsheet, Scale, User, Package, Layers,
    ArrowUpRight, ArrowDownRight, Wallet, Activity, Search
} from 'lucide-react';

export const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { transactions: allTransactions } = useData();

    // Filter States
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [clerkSearch, setClerkSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const isAdmin = authUser?.role === UserRole.ADMIN;

    // Base Data Calculation (Role-Based)
    const baseTransactions = useMemo(() => {
        if (!authUser) return [];
        if (isAdmin) return allTransactions;
        return allTransactions.filter(t => t.createdBy === authUser.id);
    }, [allTransactions, authUser, isAdmin]);

    // Filtering by Year, Month, and Clerk
    const filteredData = useMemo(() => {
        return baseTransactions.filter(t => {
            const d = new Date(t.date);
            const matchesDate = d.getFullYear().toString() === selectedYear && (d.getMonth() + 1).toString() === selectedMonth;
            const matchesClerk = !clerkSearch || (t.createdByName || '').toLowerCase().includes(clerkSearch.toLowerCase());
            return matchesDate && matchesClerk;
        });
    }, [baseTransactions, selectedYear, selectedMonth, clerkSearch]);

    // Comprehensive Metrics
    const stats = useMemo(() => {
        const revenue = filteredData.reduce((acc, t) => acc + (Number(t.totalInvoice) || 0), 0);
        const volume = filteredData.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
        const profit = filteredData.reduce((acc, t) => acc + (Number(t.profit) || 0), 0);

        // Summation of Balances (Dashboard Analytics Rule)
        const receivables = filteredData.reduce((acc, t) => t.balance < 0 ? acc + Math.abs(t.balance) : acc, 0); // Negative balances
        const credits = filteredData.reduce((acc, t) => t.balance > 0 ? acc + t.balance : acc, 0); // Positive balances

        return { revenue, volume, profit, receivables, credits };
    }, [filteredData]);

    // Chart: Daily Revenue & Profit Trend
    const trendData = useMemo(() => {
        const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
        const data = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dayTx = filteredData.filter(t => new Date(t.date).getDate() === i);
            data.push({
                name: i.toString(),
                Revenue: dayTx.reduce((acc, t) => acc + (t.totalInvoice || 0), 0),
                Profit: dayTx.reduce((acc, t) => acc + (t.profit || 0), 0)
            });
        }
        return data;
    }, [filteredData, selectedYear, selectedMonth]);

    // Market Share Data
    const productData = useMemo(() => {
        const prods: Record<string, number> = {};
        filteredData.forEach(t => {
            t.items?.forEach(item => {
                prods[item.productName] = (prods[item.productName] || 0) + (item.totalInvoice || 0);
            });
        });
        return Object.entries(prods).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#a5b4fc', '#c7d2fe'];

    const handleExportCSV = () => {
        if (filteredData.length === 0) return;
        const headers = ["Date", "Ref No", "Customer", "Revenue", "Profit", "Balance", "Tonnage"];
        if (isAdmin) headers.push("Clerk");

        const rows = filteredData.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.refNo,
            t.customerName,
            t.totalInvoice,
            t.profit,
            t.balance,
            t.quantity,
            ...(isAdmin ? [t.createdByName] : [])
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Tracker_Export_${selectedMonth}_${selectedYear}.csv`);
        link.click();
    };

    const years = ["2024", "2025", "2026"];
    const months = [
        { label: "January", value: "1" }, { label: "February", value: "2" },
        { label: "March", value: "3" }, { label: "April", value: "4" },
        { label: "May", value: "5" }, { label: "June", value: "6" },
        { label: "July", value: "7" }, { label: "August", value: "8" },
        { label: "September", value: "9" }, { label: "October", value: "10" },
        { label: "November", value: "11" }, { label: "December", value: "12" }
    ];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">

            {/* Refined Header Block */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-none">Analytics & Tracking</h1>
                    <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Performance Insights for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {isAdmin && (
                        <div className="flex-1 lg:w-64 min-w-[200px]">
                            <Input
                                icon={Search}
                                placeholder="Search by Clerk..."
                                value={clerkSearch}
                                onChange={(e) => setClerkSearch(e.target.value)}
                                className="h-11 bg-stone-50 border-stone-200"
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                        <Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            options={months}
                            className="h-9 border-none bg-transparent text-[10px] font-black uppercase tracking-widest min-w-[120px] px-2"
                        />
                        <div className="w-px h-4 bg-stone-300"></div>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            options={years.map(y => ({ label: y, value: y }))}
                            className="h-9 border-none bg-transparent text-[10px] font-black uppercase tracking-widest min-w-[90px] px-2"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExportCSV} className="h-12 px-6 rounded-xl border-stone-200 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> <span className="text-xs font-bold uppercase tracking-widest">Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* Summative Analytics - Core KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <SummaryCard label="Period Revenue" value={`₦${stats.revenue.toLocaleString()}`} icon={DollarSign} color="primary" />
                <SummaryCard label="Net Profit" value={`₦${stats.profit.toLocaleString()}`} icon={TrendingUp} color="emerald" />
                <SummaryCard label="Total Tonnage" value={`${stats.volume.toLocaleString()}t`} icon={Scale} color="indigo" />
                <SummaryCard label="Total Debits" value={`₦${stats.receivables.toLocaleString()}`} icon={ArrowDownRight} color="red" sub="" />
                <SummaryCard label="Total Credits" value={`₦${stats.credits.toLocaleString()}`} icon={ArrowUpRight} color="blue" sub="" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Visual Tracker: Realtime Performance Chart */}
                <Card className="lg:col-span-8 border-stone-100 p-8 rounded-[2.5rem] flex flex-col h-[460px] shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary-600" /> Performance Tracker
                            </h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] mt-1">Daily billing volume analysis</p>
                        </div>
                        <Badge color="blue">Realtime Sync</Badge>
                    </div>
                    <div className="flex-1 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} fontWeight="bold" dy={10} />
                                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `₦${v / 1000}k`} width={55} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                                />
                                <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Product Mix Analysis */}
                <Card className="lg:col-span-4 border-stone-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
                    <div className="self-start mb-10">
                        <h3 className="text-xl font-black text-stone-900 tracking-tight">Market Share</h3>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] mt-1">Material Distribution</p>
                    </div>
                    <div className="h-60 w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={productData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={90}
                                    paddingAngle={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {productData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 w-full mt-auto">
                        {productData.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 truncate max-w-[140px] group-hover:text-stone-900 transition-colors">{item.name}</span>
                                </div>
                                <span className="text-xs font-black font-mono text-stone-900">₦{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                        {productData.length === 0 && (
                            <div className="text-center py-6">
                                <Package className="h-10 w-10 text-stone-100 mx-auto mb-2" />
                                <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">No material movement recorded</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Detailed Transaction Tracker Table */}
            <Card noPadding className="border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-stone-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-black text-stone-900 tracking-tight">Detailed Tracker</h3>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] mt-1">Audit-ready transaction records</p>
                    </div>
                    <Badge color="blue">{filteredData.length} records in view</Badge>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="min-w-full divide-y divide-stone-100 text-sm">
                        <thead className="bg-stone-50">
                            <tr>
                                <th className="px-8 py-5 text-left font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Reference</th>
                                <th className="px-8 py-5 text-left font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Client / Recipient</th>
                                <th className="px-8 py-5 text-right font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Revenue</th>
                                <th className="px-8 py-5 text-right font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Profit</th>
                                <th className="px-8 py-5 text-right font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Ledger Balance</th>
                                <th className="px-8 py-5 text-center font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Receipt</th>
                                {isAdmin && <th className="px-8 py-5 text-center font-black text-stone-400 uppercase tracking-[0.15em] text-[10px]">Authorised By</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                            {filteredData.slice((currentPage - 1) * 5, currentPage * 5).map((tx, idx) => (
                                <tr key={idx} className="group hover:bg-stone-50 transition-colors">
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="text-xs font-black font-mono text-stone-800 bg-stone-100 px-2 py-1 rounded-lg w-fit mb-1 group-hover:bg-white transition-colors border border-stone-200 shadow-sm">{tx.refNo}</div>
                                        <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="font-black text-stone-900 truncate max-w-[200px] leading-tight mb-1">{tx.customerName}</div>
                                        <div className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter flex items-center gap-1.5"><Scale className="h-2.5 w-2.5" /> {tx.quantity} tons total</div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-stone-900 font-mono text-base">₦{tx.totalInvoice.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right font-black text-emerald-600 font-mono text-base">₦{tx.profit.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`text-xs font-black font-mono px-4 py-1.5 rounded-full inline-block border ${tx.balance < 0 ? 'bg-red-50 text-red-600 border-red-100' : tx.balance > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {tx.balance > 0 ? '+' : ''}₦{tx.balance.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button onClick={() => navigate(`/receipt/${tx.id}`)} className="p-2 text-stone-400 hover:text-emerald-600 transition-colors bg-stone-50 rounded-lg hover:bg-stone-100 border border-stone-100 hover:border-emerald-200" title="View Receipt">
                                            <Printer className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-8 w-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-[10px] font-black group-hover:bg-white transition-colors">{tx.createdByName?.charAt(0)}</div>
                                                <span className="text-[10px] font-bold text-stone-500 uppercase truncate max-w-[100px] tracking-widest">{tx.createdByName}</span>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr><td colSpan={isAdmin ? 6 : 5} className="p-32 text-center">
                                    <BarChart3 className="h-14 w-14 text-stone-100 mx-auto mb-4 opacity-30" />
                                    <p className="text-xs font-black text-stone-300 uppercase tracking-[0.2em] italic">No transaction records match the filters</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredData.length > 5 && (
                    <div className="flex items-center justify-between p-4 border-t border-stone-100 bg-stone-50/50">
                        <span className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">
                            Showing {((currentPage - 1) * 5) + 1} - {Math.min(currentPage * 5, filteredData.length)} of {filteredData.length}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 rounded-xl disabled:opacity-30"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / 5), p + 1))}
                                disabled={currentPage === Math.ceil(filteredData.length / 5)}
                                className="h-8 px-3 rounded-xl disabled:opacity-30"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

// --- Refined Summary Card for Analytics ---
const SummaryCard: React.FC<{ label: string; value: string; icon: any; color: string; sub?: string }> = ({ label, value, icon: Icon, color, sub }) => {
    const colorSchemes: Record<string, string> = {
        primary: 'bg-primary-50 text-primary-600 border-primary-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100'
    };

    return (
        <Card className="border-stone-100 rounded-[1.75rem] p-6 shadow-sm group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-36">
            <div className="flex items-start justify-between">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform ${colorSchemes[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {sub && <Badge color={color as any}>{sub}</Badge>}
            </div>
            <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em] leading-none mb-2">{label}</p>
                <p className="text-xl font-black text-stone-900 tracking-tight leading-none truncate">{value}</p>
            </div>
        </Card>
    );
};
