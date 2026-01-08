
export enum UserRole {
  ADMIN = 'ADMIN',
  CLERK = 'CLERK'
}

export interface User {
  id: string; // Firebase UID
  name: string;
  email: string; // Used for Auth
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  createdBy: string; // User ID
  createdByName?: string; // User Name for Admin view
  createdAt?: string; // ISO Date String
  isDeleted?: boolean; // Soft Delete flag
  deletedAt?: string;
}

export interface QuarryProductPrice {
  id: string; // Concatenation of quarryId_productId
  quarryId: string;
  productId: string;
  price: number;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface ProductCostHistory {
  id: string;
  productId: string;
  quarryId?: string; // Now specific to a quarry
  productName?: string;
  quarryName?: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  date: string;
}

export interface Quarry {
  id: string;
  name: string;
  location: string;
  ownerId?: string; // ID of the user who manages this quarry
  ownerName?: string; // Name of the user
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  transactionCount: number;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quarryId: string;
  quarryName: string;
  quarryLocation: string;
  truckPlateNumber: string;
  driverName: string;
  purchasePrice: number; // Unit Purchase Rate
  totalPurchaseCost: number; // purchasePrice * quantity
  salesPrice: number; // Unit Sales Rate
  quantity: number;
  transportCost: number;
  otherExpenses: number;
  totalInvoice: number; // salesPrice * quantity
  subtotal: number; // totalInvoice + transportCost + otherExpenses
  profit: number; // (salesPrice - purchasePrice) * quantity
}

export interface Transaction {
  id: string;
  refNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  destinationAddress: string;
  items: TransactionItem[]; // Support for multiple products per invoice
  totalInvoice: number; // Aggregate of all items
  totalPurchaseCost: number; // Aggregate of all items
  quantity: number; // Total tonnage across all items
  profit: number; // Aggregate profit
  deposit: number;
  balance: number;
  createdBy: string;
  createdByName: string;
  date: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  recordId: string;
  details: string;
  timestamp: string;
}
