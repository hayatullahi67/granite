
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Truck, Users, Settings, LogOut, Menu, X, Package, Activity, Bell, TrendingUp, DollarSign, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
     { to: '/customers', icon: Users, label: 'Customers' },
     { to: '/quarries', icon: Truck, label: 'Quarries' },
    { to: '/transactions', icon: ShoppingCart, label: 'Transactions' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/price-mapping', icon: DollarSign, label: 'Price Mapping' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics & Tracking' },
    { to: '/my-sales', icon: TrendingUp, label: isAdmin ? 'Users Sales' : 'My Sales' },
   
    
  ];

  if (isAdmin) {
    navItems.push(
      { to: '/audit', icon: Activity, label: 'Audit Trail' }
    );
  }

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    if (path === 'analytics') return 'Analytics & Tracking';
    if (path === 'price-mapping') return 'Price Mapping';
    if (path === 'my-sales') return isAdmin ? 'Users Sales Tracker' : 'Product Tracker';
    if (path === 'audit') return 'Audit Trail';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-stone-950 text-stone-100 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
          lg:static lg:translate-x-0 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-20 items-center px-8 border-b border-stone-800/50 bg-stone-950/50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
                G
             </div>
             <span className="text-xl font-bold tracking-tight text-white">Granite<span className="text-primary-400">Flow</span></span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                font-medium text-white
                ${isActive 
                  ? 'bg-primary-600 shadow-lg shadow-primary-900/20' 
                  : 'hover:bg-stone-900 text-stone-400 hover:text-white'}
              `}
            >
              <item.icon className={`mr-3 h-5 w-5 transition-colors shrink-0 ${location.pathname === item.to ? 'text-white' : 'text-stone-500 group-hover:text-white'}`} />
              <span className="relative z-10">{item.label}</span>
              {({ isActive }: any) => isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shine" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-stone-800/50 p-6 bg-stone-950">
            <div className="flex items-center mb-6 px-1">
                <div className="h-10 w-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-sm font-bold text-stone-300 shrink-0 uppercase">
                    {user?.name.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-stone-500 capitalize truncate font-bold tracking-widest">{user?.role}</p>
                </div>
            </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-2.5 text-sm font-medium text-stone-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between bg-white/80 backdrop-blur-md px-6 lg:px-10 border-b border-stone-200/60 sticky top-0 z-20 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-stone-500 hover:text-stone-700 focus:outline-none lg:hidden mr-4"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-stone-800 hidden sm:block">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-6">
            
            <div className="h-8 w-px bg-stone-200 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
                <p className="text-xs text-stone-400 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth">
            <Outlet />
        </main>
      </div>
    </div>
  );
};
