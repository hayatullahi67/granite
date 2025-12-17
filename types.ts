
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
  currentPrice: number;
  createdBy: string; // User ID
  createdByName?: string; // User Name for Admin view
  createdAt?: string; // ISO Date String
  isDeleted?: boolean; // Soft Delete flag
  deletedAt?: string;
}

export interface ProductCostHistory {
  id: string;
  productId: string;
  productName?: string; // Denormalized for easier display
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
  address?: string;
  transactionCount: number;
  createdBy?: string; // User ID who registered them
  createdByName?: string; // Name of user who registered them
  createdAt?: string;
}

export interface Transaction {
  id: string;
  refNo: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  customerPhone: string; // Snapshot of phone at time of sale
  shippingAddress: string; // Snapshot of address at time of sale
  productId: string;
  productName: string; // Denormalized
  quarryId: string;
  quarryName: string; // Denormalized
  quarryLocation: string; // Snapshot of source location
  rate: number;
  quantity: number;
  totalCost: number;
  deposit: number;
  balance: number;
  createdBy: string; // UserId
  createdByName: string;
  date: string; // ISO String
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
