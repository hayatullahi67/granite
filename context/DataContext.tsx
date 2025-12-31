
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Quarry, Customer, Transaction, AuditLog, ProductCostHistory, QuarryProductPrice } from '../types';
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
  quarryPrices: QuarryProductPrice[];
  saveProduct: (p: Product) => Promise<void>;
  softDeleteProduct: (p: Product) => Promise<void>;
  saveQuarry: (q: Quarry) => Promise<void>;
  saveCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addTransaction: (t: Transaction) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveQuarryPrice: (quarryId: string, productId: string, price: number) => Promise<void>;
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
  const [quarryPrices, setQuarryPrices] = useState<QuarryProductPrice[]>([]);

  useEffect(() => {
    if (!user) {
        setProducts([]);
        setQuarries([]);
        setCustomers([]);
        setTransactions([]);
        setAuditLogs([]);
        setPriceHistory([]);
        setQuarryPrices([]);
        return;
    }

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
    });

    const unsubQuarries = onSnapshot(collection(db, 'quarries'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Quarry));
      setQuarries(list);
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(list);
    });

    const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(list);
    });

    const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const unsubAudit = onSnapshot(qAudit, (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AuditLog));
      setAuditLogs(list);
    });

    const qHistory = query(collection(db, 'price_history'), orderBy('date', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ProductCostHistory));
      setPriceHistory(list);
    });

    const unsubPrices = onSnapshot(collection(db, 'quarry_prices'), (snapshot: any) => {
      const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as QuarryProductPrice));
      setQuarryPrices(list);
    });

    return () => {
      unsubProducts(); unsubQuarries(); unsubCustomers();
      unsubTransactions(); unsubAudit(); unsubHistory();
      unsubPrices();
    };
  }, [user]);

  const addAuditLog = async (action: string, entity: string, recordId: string, details: string) => {
    if (!user) return;
    await addDoc(collection(db, 'audit_logs'), {
      userId: user.id,
      userName: user.name,
      action,
      entity,
      recordId,
      details,
      timestamp: new Date().toISOString()
    });
  };

  const saveProduct = async (p: Product) => {
    if (!user) return;
    const productRef = doc(db, 'products', p.id);
    const existing = products.find(prod => prod.id === p.id);
    const payload = { 
        ...p, 
        createdAt: existing?.createdAt || new Date().toISOString(),
        createdBy: existing?.createdBy || user.id,
        createdByName: existing?.createdByName || user.name 
    };
    await setDoc(productRef, payload);
    await addAuditLog(existing ? 'UPDATE' : 'CREATE', 'PRODUCT', p.name, `Product definition managed`);
  };

  const saveQuarryPrice = async (quarryId: string, productId: string, price: number) => {
    if (!user) return;
    const priceId = `${quarryId}_${productId}`;
    const existing = quarryPrices.find(qp => qp.id === priceId);
    const product = products.find(p => p.id === productId);
    const quarry = quarries.find(q => q.id === quarryId);

    if (existing && existing.price !== price) {
        await addDoc(collection(db, 'price_history'), {
            productId,
            quarryId,
            productName: product?.name,
            quarryName: quarry?.name,
            oldPrice: existing.price,
            newPrice: price,
            changedBy: user.name,
            date: new Date().toISOString()
        });
    }

    const payload: QuarryProductPrice = {
        id: priceId,
        quarryId,
        productId,
        price,
        updatedBy: user.id,
        updatedByName: user.name,
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'quarry_prices', priceId), payload);
    await addAuditLog('UPDATE_PRICE', 'QUARRY_PRICE', quarry?.name || quarryId, `Set price for ${product?.name} to ₦${price}`);
  };

  const softDeleteProduct = async (p: Product) => {
    if(!user) return;
    await updateDoc(doc(db, 'products', p.id), { 
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
  };

  const saveQuarry = async (q: Quarry) => {
    if (!user) return;
    const payload: Quarry = {
        ...q,
        ownerId: q.ownerId || user.id,
        ownerName: q.ownerName || user.name
    };
    await setDoc(doc(db, 'quarries', q.id), payload);
  };

  const saveCustomer = async (c: Customer) => {
    if (!user) return;
    const existing = customers.find(cust => cust.id === c.id);
    await setDoc(doc(db, 'customers', c.id), {
        ...c,
        createdBy: existing?.createdBy || user.id,
        createdByName: existing?.createdByName || user.name,
        createdAt: existing?.createdAt || new Date().toISOString(),
    });
  };

  const deleteCustomer = async (id: string) => {
    await deleteDoc(doc(db, 'customers', id));
  };

  const addTransaction = async (t: Transaction) => {
    await setDoc(doc(db, 'transactions', t.id), t);
    const customerRef = doc(db, 'customers', t.customerId);
    const currentCust = customers.find(c => c.id === t.customerId);
    await setDoc(customerRef, { transactionCount: (currentCust?.transactionCount || 0) + 1 }, { merge: true });
  };

  const updateTransaction = async (t: Transaction) => {
    await setDoc(doc(db, 'transactions', t.id), t, { merge: true });
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  return (
    <DataContext.Provider value={{ 
      products, quarries, customers, transactions, auditLogs, priceHistory, quarryPrices,
      saveProduct, softDeleteProduct, saveQuarry, saveCustomer, deleteCustomer, 
      addTransaction, updateTransaction, deleteTransaction, saveQuarryPrice
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
