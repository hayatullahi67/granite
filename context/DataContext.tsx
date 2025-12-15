
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Quarry, Customer, Transaction, AuditLog, ProductCostHistory } from '../types';
import { useAuth } from './AuthContext';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from '../services/firebase';

interface DataContextType {
  products: Product[];
  quarries: Quarry[];
  customers: Customer[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  priceHistory: ProductCostHistory[];
  saveProduct: (p: Product) => Promise<void>;
  softDeleteProduct: (p: Product) => Promise<void>;
  saveQuarry: (q: Quarry) => Promise<void>;
  saveCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addTransaction: (t: Transaction) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [quarries, setQuarries] = useState<Quarry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [priceHistory, setPriceHistory] = useState<ProductCostHistory[]>([]);

  // --- Real-time Listeners ---

  useEffect(() => {
    if (!user) {
        // Clear data on logout
        setProducts([]);
        setQuarries([]);
        setCustomers([]);
        setTransactions([]);
        setAuditLogs([]);
        setPriceHistory([]);
        return;
    }

    // 1. Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
    });

    // 2. Quarries
    const unsubQuarries = onSnapshot(collection(db, 'quarries'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Quarry));
      setQuarries(list);
    });

    // 3. Customers
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(list);
    });

    // 4. Transactions (Ordered by date desc)
    const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(list);
    });

    // 5. Audit Logs (Ordered by timestamp desc)
    const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const unsubAudit = onSnapshot(qAudit, (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AuditLog));
      setAuditLogs(list);
    });

    // 6. Price History
    const qHistory = query(collection(db, 'price_history'), orderBy('date', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ProductCostHistory));
      setPriceHistory(list);
    });

    // Cleanup listeners on unmount or logout
    return () => {
      unsubProducts();
      unsubQuarries();
      unsubCustomers();
      unsubTransactions();
      unsubAudit();
      unsubHistory();
    };
  }, [user]);

  // --- Actions ---

  const addAuditLog = async (action: string, entity: string, recordId: string, details: string) => {
    if (!user) return;
    // We let Firestore generate the ID for logs
    const logData = {
      userId: user.id,
      userName: user.name,
      action,
      entity,
      recordId,
      details,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, 'audit_logs'), logData);
  };

  const saveProduct = async (p: Product) => {
    if (!user) return;

    const productRef = doc(db, 'products', p.id);
    // Check if the product already exists in the current state to determine Create vs Update
    const existing = products.find(prod => prod.id === p.id);
    
    if (existing) {
      // UPDATE
      
      // Price Check Logic - Create History Entry if price changed
      if (existing.currentPrice !== p.currentPrice) {
         const historyData = {
           productId: p.id,
           productName: p.name,
           oldPrice: existing.currentPrice,
           newPrice: p.currentPrice,
           changedBy: user.name,
           date: new Date().toISOString()
         };
         await addDoc(collection(db, 'price_history'), historyData);
      }
      
      // Ensure we preserve immutable fields
      const payload = { 
        ...p, 
        createdAt: existing.createdAt || new Date().toISOString(),
        createdBy: existing.createdBy || user.id,
        createdByName: existing.createdByName || user.name 
      };
      
      await setDoc(productRef, payload); 
      await addAuditLog('UPDATE', 'PRODUCT', p.name, `Updated product details`);

    } else {
      // CREATE
      const payload: Product = { 
        ...p, 
        createdAt: new Date().toISOString(),
        createdBy: user.id, 
        createdByName: user.name,
        isDeleted: false 
      }; 
      await setDoc(productRef, payload);
      
      // Initial Price History Record
      const historyData = {
           productId: p.id,
           productName: p.name,
           oldPrice: 0,
           newPrice: p.currentPrice,
           changedBy: user.name,
           date: new Date().toISOString()
      };
      await addDoc(collection(db, 'price_history'), historyData);
      await addAuditLog('CREATE', 'PRODUCT', p.name, `Created new product`);
    }
  };

  const softDeleteProduct = async (p: Product) => {
    if(!user) return;
    const productRef = doc(db, 'products', p.id);
    
    await updateDoc(productRef, { 
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
    
    await addAuditLog('DELETE', 'PRODUCT', p.name, `Soft deleted product`);
  }

  const saveQuarry = async (q: Quarry) => {
    if (!user) return;
    
    const payload: Quarry = {
        ...q,
        ownerId: q.ownerId || user.id,
        ownerName: q.ownerName || user.name
    };

    await setDoc(doc(db, 'quarries', q.id), payload);
    await addAuditLog('UPDATE', 'QUARRY', q.name, `Updated quarry details`);
  };

  const saveCustomer = async (c: Customer) => {
    if (!user) return;
    const isNew = !customers.find(cust => cust.id === c.id);
    await setDoc(doc(db, 'customers', c.id), c);
    if(isNew) await addAuditLog('CREATE', 'CUSTOMER', c.name, `Registered new customer`);
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;
    const customer = customers.find(c => c.id === id);
    await deleteDoc(doc(db, 'customers', id));
    await addAuditLog('DELETE', 'CUSTOMER', customer?.name || id, `Deleted customer record`);
  };

  const addTransaction = async (t: Transaction) => {
    if (!user) return;
    
    // 1. Add Transaction
    await setDoc(doc(db, 'transactions', t.id), t);

    // 2. Update Customer Count
    // Use Firestore increment if possible, but for simplicity with this structure we read-modify-write
    // Since we have real-time listeners, `customers` state is up to date
    const customerRef = doc(db, 'customers', t.customerId);
    const currentCust = customers.find(c => c.id === t.customerId);
    const newCount = (currentCust?.transactionCount || 0) + 1;
    
    await setDoc(customerRef, { transactionCount: newCount }, { merge: true });

    // 3. Audit
    await addAuditLog('CREATE', 'TRANSACTION', t.refNo, `Sale: ${t.productName} (${t.quantity} tons)`);
  };

  const updateTransaction = async (t: Transaction) => {
    if (!user) return;
    await setDoc(doc(db, 'transactions', t.id), t, { merge: true });
    await addAuditLog('UPDATE', 'TRANSACTION', t.refNo, `Updated sale details`);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const t = transactions.find(tx => tx.id === id);
    await deleteDoc(doc(db, 'transactions', id));
    await addAuditLog('DELETE', 'TRANSACTION', t?.refNo || id, `Deleted transaction`);
  };

  return (
    <DataContext.Provider value={{ 
      products, 
      quarries, 
      customers, 
      transactions, 
      auditLogs, 
      priceHistory,
      saveProduct, 
      softDeleteProduct,
      saveQuarry, 
      saveCustomer, 
      deleteCustomer, 
      addTransaction, 
      updateTransaction, 
      deleteTransaction 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
