// User roles
export type UserRole = 'citizen' | 'collector' | 'dealer' | 'admin';

// Waste types
export type WasteType = 
  | 'biodegradable' 
  | 'recyclable' 
  | 'hazardous' 
  | 'ewaste' 
  | 'construction';

// Waste listing status
export type WasteStatus = 
  | 'pending' 
  | 'collector_assigned' 
  | 'picked_up' 
  | 'stored_in_hub' 
  | 'sold_to_dealer'
  | 'cancelled';

// Order status
export type OrderStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'completed';

// Location type
export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

// User interface
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  location?: Location;
  image?: string;
  rewardPoints?: number;
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Waste listing interface
export interface IWasteListing {
  _id: string;
  userId: string;
  user?: IUser;
  imageUrl: string;
  wasteType: WasteType;
  quantity: number; // in kg
  pickupLocation: Location;
  status: WasteStatus;
  collectorId?: string;
  collector?: IUser;
  aiConfidence?: number;
  description?: string;
  estimatedValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Waste inventory interface
export interface IWasteInventory {
  _id: string;
  wasteType: WasteType;
  quantity: number; // in kg
  hubId: string;
  verified: boolean;
  sourceListings: string[]; // Array of WasteListing IDs
  createdAt: Date;
  updatedAt: Date;
}

// Waste order interface
export interface IWasteOrder {
  _id: string;
  dealerId: string;
  dealer?: IUser;
  wasteType: WasteType;
  quantity: number; // in kg
  pricePerKg: number;
  totalPrice: number;
  status: OrderStatus;
  inventoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Hub interface
export interface IHub {
  _id: string;
  name: string;
  location: Location;
  capacity: number; // in kg
  currentLoad: number; // in kg
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI prediction response
export interface AIPrediction {
  class: WasteType;
  confidence: number;
}

export interface AIResponse {
  predictions: AIPrediction[];
  time: number;
}

// Analytics data
export interface AnalyticsData {
  totalWasteCollected: number;
  recyclingRate: number;
  landfillDiverted: number;
  co2Saved: number;
  wasteByType: Record<WasteType, number>;
  monthlyTrend: Array<{
    month: string;
    collected: number;
    recycled: number;
  }>;
}
