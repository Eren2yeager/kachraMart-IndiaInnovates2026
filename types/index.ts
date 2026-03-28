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

// Collector task status
export type CollectorTaskStatus = 
  | 'assigned' 
  | 'accepted' 
  | 'on_the_way' 
  | 'picked' 
  | 'delivered';

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
  assignedHubId?: string; // Hub where waste should be delivered
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
  reserved: boolean;
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

// Collector task interface
export interface ICollectorTask {
  _id: string;
  collectorId: string;
  collector?: IUser;
  wasteListingId: string;
  wasteListing?: IWasteListing;
  status: CollectorTaskStatus;
  route?: {
    distance: number; // in km
    duration: number; // in minutes
    polyline: string; // Encoded polyline
  };
  currentLocation?: [number, number]; // [longitude, latitude]
  locationHistory?: Array<{
    coordinates: [number, number];
    timestamp: Date;
  }>;
  startedAt?: Date;
  completedAt?: Date;
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

// Analytics data types
export interface MonthlyDataPoint {
  month: string;
  quantity: number;
}

export interface WeeklyDataPoint {
  week: string;
  quantity: number;
}

export interface MonthlySpendingPoint {
  month: string;
  spent: number;
}

export interface HubPerformanceMetric {
  hubId: string;
  name: string;
  capacity: number;
  currentLoad: number;
  utilizationPercentage: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  completedOrders: number;
  approvalRate: number;
  averageOrderValue: number;
}

export interface TopDealer {
  dealerId: string;
  dealerName: string;
  totalQuantity: number;
  totalSpent: number;
}

export interface AdminAnalyticsData {
  totalWasteCollected: number;
  co2Saved: number;
  landfillDiverted: number;
  diversionPercentage: number;
  wasteByType: Record<WasteType, number>;
  wasteByStatus: Record<WasteStatus, { count: number; quantity: number }>;
  monthlyTrend: MonthlyDataPoint[];
  weeklyTrend?: WeeklyDataPoint[];
  hubPerformance: HubPerformanceMetric[];
  orderStats: OrderStatistics;
  topDealers: TopDealer[];
  lastUpdated: string;
}

export interface DealerAnalyticsData {
  totalPurchases: {
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  };
  purchasesByType: Record<WasteType, { quantity: number; spent: number }>;
  spendingTrend: MonthlySpendingPoint[];
  averagePriceByType: Record<WasteType, number>;
  lastUpdated: string;
}
