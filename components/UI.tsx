
import React from 'react';
import { X } from 'lucide-react';

// --- Card ---
export const Card: React.FC<{ 
  children: React.ReactNode, 
  className?: string, 
  noPadding?: boolean,
  onClick?: () => void 
}> = ({ children, className = '', noPadding = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-[1.5rem] shadow-soft border border-stone-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 ${!noPadding ? 'p-6' : ''} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', fullWidth = false, className = '', ...props }) => {
  const base = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-100 shadow-md hover:shadow-lg shadow-primary-500/20",
    secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 focus:ring-stone-100 shadow-sm",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50 focus:ring-red-100 hover:border-red-200",
    ghost: "bg-transparent text-stone-500 hover:bg-stone-100/70 hover:text-stone-900"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };
  
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props} />;
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}
export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => (
  <div className="w-full space-y-1.5">
    {label && <label className="block text-sm font-bold text-stone-700 ml-1">{label}</label>}
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-primary-500 transition-colors">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <input 
        className={`
          block w-full rounded-xl bg-stone-50 border-0
          focus:bg-white focus:outline-none focus:ring-0
          disabled:bg-stone-100 disabled:text-stone-400
          transition-all duration-200 sm:text-sm px-4 py-2.5
          ${Icon ? 'pl-10' : ''}
          ${error ? 'ring-2 ring-red-500/50 bg-red-50/30' : ''} 
          placeholder:text-stone-400
          ${className}
        `}
        {...props} 
      />
    </div>
    {error && <p className="ml-1 text-sm text-red-600 animate-pulse">{error}</p>}
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
}
export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="w-full space-y-1.5">
    {label && <label className="block text-sm font-bold text-stone-700 ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`
          block w-full rounded-xl bg-stone-50 border-0
          focus:bg-white focus:outline-none focus:ring-0
          transition-all duration-200 sm:text-sm px-4 py-2.5 appearance-none
          cursor-pointer
          ${className}
        `}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);

// --- Modal ---
export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = 'sm:max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose} 
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center sm:p-0">
          <div className={`relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-white/50 ring-1 ring-stone-900/5 animate-in zoom-in-95 duration-200 slide-in-from-bottom-5 sm:slide-in-from-bottom-0`}>
            <div className="bg-gradient-to-r from-stone-50/90 to-white/90 px-6 py-5 border-b border-stone-100 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
              <h3 className="text-xl font-bold leading-6 text-stone-800 tracking-tight flex items-center gap-2" id="modal-title">
                {title}
              </h3>
              <button 
                onClick={onClose} 
                className="rounded-full p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 group shadow-sm hover:rotate-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 max-h-[85vh] overflow-y-auto custom-scrollbar bg-white text-stone-800">
               {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode, color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' }> = ({ children, color = 'blue' }) => {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-700/10',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/10',
    purple: 'bg-primary-50 text-primary-700 ring-primary-700/10',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${colors[color]} tracking-wide`}>
      {children}
    </span>
  );
}
