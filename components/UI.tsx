
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
    className={`bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] border border-stone-100 overflow-hidden transition-all duration-300 ${!noPadding ? 'p-6' : ''} ${onClick ? 'cursor-pointer active:scale-[0.99] hover:border-primary-200 hover:shadow-lg' : ''} ${className}`}
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
  const base = "inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98]";

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-100 shadow-sm",
    secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 focus:ring-stone-100",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50 focus:ring-red-100",
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
    {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-primary-500 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <input
        className={`
          block w-full rounded-xl bg-white border border-stone-200
          focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500
          disabled:bg-stone-50 disabled:text-stone-400
          transition-all duration-200 text-sm px-4 py-2.5 shadow-sm
          ${Icon ? 'pl-10' : ''}
          ${error ? 'border-red-500 bg-red-50/30' : ''} 
          placeholder:text-stone-400
          ${className}
        `}
        {...props}
      />
    </div>
    {error && <p className="ml-1 text-xs text-red-600">{error}</p>}
  </div>
);

// --- Select ---
// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
  icon?: React.ElementType;
}

export const Select: React.FC<SelectProps> = ({ label, options, icon: Icon, className = '', value, onChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value.toString() === value?.toString());

  const handleSelect = (optionValue: string | number) => {
    setIsOpen(false);
    if (onChange) {
      // Create a synthetic event to maintain backward compatibility
      const syntheticEvent = {
        target: { value: optionValue },
        currentTarget: { value: optionValue },
        persist: () => { },
        preventDefault: () => { },
        stopPropagation: () => { },
        nativeEvent: new Event('change')
      } as unknown as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 z-10">
            <Icon className="h-4 w-4" />
          </div>
        )}

        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative w-full text-left cursor-pointer
            rounded-xl bg-white border border-stone-200
            focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500
            transition-all duration-200 text-sm px-4 py-2.5 shadow-sm
            ${Icon ? 'pl-10' : ''}
            ${isOpen ? 'border-primary-500 ring-4 ring-primary-500/5' : ''}
            ${className}
          `}
        >
          <span className={`block truncate ${!selectedOption ? 'text-stone-400' : 'text-stone-900'}`}>
            {selectedOption ? selectedOption.label : 'Select an option'}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <svg
              className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar border border-stone-100">
            {options.map((option, index) => {
              const isSelected = option.value.toString() === value?.toString();
              return (
                <div
                  key={index}
                  className={`
                      relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors
                      ${isSelected ? 'bg-primary-50 text-primary-900 font-bold' : 'text-stone-700 hover:bg-stone-50'}
                    `}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className={`block truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="py-3 px-4 text-sm text-stone-400 italic text-center">No options available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
        className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center sm:p-0">
          <div className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-stone-100 animate-in zoom-in-95 duration-200`}>
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-lg font-bold text-stone-800 tracking-tight" id="modal-title">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode, color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'stone' }> = ({ children, color = 'blue' }) => {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-primary-50 text-primary-700 border-primary-100',
    stone: 'bg-stone-50 text-stone-700 border-stone-200',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border ${colors[color]} uppercase tracking-wider`}>
      {children}
    </span>
  );
}
