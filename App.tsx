
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Products } from './pages/Products';
import { PriceMapping } from './pages/PriceMapping';
import { MySales } from './pages/MySales';
import { Customers } from './pages/Customers';
import { Quarries } from './pages/Quarries';
import { AuditTrail } from './pages/AuditTrail';
import { Receipt } from './pages/Receipt';
import { Analytics } from './pages/Analytics';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode, requiredRole?: UserRole }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="products" element={<Products />} />
              <Route path="price-mapping" element={<PriceMapping />} />
              <Route path="my-sales" element={<MySales />} />
              <Route path="receipt/:id" element={<Receipt />} />
              <Route path="customers" element={<Customers />} />
              <Route path="quarries" element={<Quarries />} />
              
               <Route 
                path="audit" 
                element={
                    <ProtectedRoute requiredRole={UserRole.ADMIN}>
                        <AuditTrail />
                    </ProtectedRoute>
                } 
              />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
