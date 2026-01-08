
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button, Input } from '../components/UI';
import { AlertCircle, Mail, Lock, ArrowRight, User as UserIcon, WifiOff } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
      } else {
        await signup({ 
          email, 
          password, 
          name, 
          role: UserRole.CLERK 
        });
      }
      // If we reach here, it's successful
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login form error:", err);
      
      // Detailed Error Handling for UX
      const isNetworkError = !navigator.onLine || 
                             err.code === 'auth/network-request-failed' || 
                             err.message?.toLowerCase().includes('network');

      if (isNetworkError) {
        setError('Network connectivity issue detected. Please check your internet connection and try again.');
      } else if (err.code === 'auth/invalid-credential' || 
                 err.code === 'auth/user-not-found' || 
                 err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please double-check your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. This account has been temporarily disabled. Try again later.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else {
        setError('Authentication failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950 opacity-90 z-10"></div>
        <div className="absolute inset-0 z-0">
             <img 
                src="https://images.unsplash.com/photo-1596525941916-2fba64023774?q=80&w=2000&auto=format&fit=crop" 
                alt="Granite Texture" 
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
             />
        </div>
        
        <div className="relative z-20 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
             <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-glow mb-6">
                G
             </div>
             <h1 className="text-5xl font-bold tracking-tight mb-4">Master Your <br/> Supply Chain.</h1>
             <p className="text-stone-300 text-lg max-w-md leading-relaxed">
               GraniteFlow provides the robust foundation your quarry business needs to scale. Track inventory, manage sales, and analyze growth.
             </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-transparent">
        <div className="max-w-md w-full">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-stone-900">
              {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-stone-500">
              {mode === 'LOGIN' 
                ? 'Please enter your email to access your dashboard.' 
                : 'Set up your profile to get started.'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`p-4 rounded-xl text-sm flex items-start border animate-fadeIn ${error.includes('Network') ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error.includes('Network') ? <WifiOff className="h-5 w-5 mr-3 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
                <span className="font-medium">{error}</span>
              </div>
            )}
            
            <div className="space-y-5">
                {mode === 'SIGNUP' && (
                   <Input 
                    label="Full Name" 
                    type="text" 
                    icon={UserIcon}
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                )}

                <Input 
                label="Email Address" 
                type="email" 
                icon={Mail}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
                
                <div className="space-y-1">
                    <Input 
                    label="Password" 
                    type="password" 
                    icon={Lock}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    />
                    {mode === 'LOGIN' && (
                      <div className="flex justify-end">
                          <a href="#" className="text-xs font-medium text-primary-600 hover:text-primary-700">Forgot password?</a>
                      </div>
                    )}
                </div>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading} className="group mt-2">
              {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </Button>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
               <p>
                 {mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
                 <button 
                   type="button"
                   onClick={toggleMode}
                   className="ml-2 font-bold text-primary-600 hover:text-primary-700 hover:underline focus:outline-none"
                 >
                   {mode === 'LOGIN' ? "Sign Up" : "Log In"}
                 </button>
               </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
