import { WasteType, UserRole } from '@/types';

// Waste type configurations
export const WASTE_TYPES: Record<WasteType, { label: string; color: string; icon: string }> = {
  biodegradable: {
    label: 'Biodegradable',
    color: '#22c55e',
    icon: 'Leaf',
  },
  recyclable: {
    label: 'Recyclable',
    color: '#3b82f6',
    icon: 'Recycle',
  },
  hazardous: {
    label: 'Hazardous',
    color: '#ef4444',
    icon: 'AlertTriangle',
  },
  ewaste: {
    label: 'E-Waste',
    color: '#f59e0b',
    icon: 'Laptop',
  },
  construction: {
    label: 'Construction',
    color: '#8b5cf6',
    icon: 'HardHat',
  },
};

// User role configurations
export const USER_ROLES: Record<UserRole, { label: string; color: string }> = {
  citizen: {
    label: 'Citizen',
    color: '#3b82f6',
  },
  collector: {
    label: 'Collector',
    color: '#f59e0b',
  },
  dealer: {
    label: 'Dealer',
    color: '#8b5cf6',
  },
  admin: {
    label: 'Admin',
    color: '#ef4444',
  },
};

// Reward points configuration
export const REWARD_POINTS = {
  biodegradable: 5,
  recyclable: 10,
  hazardous: 15,
  ewaste: 20,
  construction: 8,
} as Record<WasteType, number>;

// Price per kg for different waste types (in INR)
export const WASTE_PRICES = {
  biodegradable: 2,
  recyclable: 15,
  hazardous: 0, // Special handling
  ewaste: 25,
  construction: 5,
} as Record<WasteType, number>;

// Status labels
export const STATUS_LABELS = {
  pending: 'Pending',
  collector_assigned: 'Collector Assigned',
  picked_up: 'Picked Up',
  stored_in_hub: 'Stored in Hub',
  sold_to_dealer: 'Sold to Dealer',
  cancelled: 'Cancelled',
};

// Order status labels
export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

// App metadata
export const APP_NAME = 'KachraMart';
export const APP_DESCRIPTION = 'AI-Powered Circular Waste Management Platform';
export const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
