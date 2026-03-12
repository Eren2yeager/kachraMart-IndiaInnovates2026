'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user;

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  const isAdmin = hasRole('admin');
  const isCitizen = hasRole('citizen');
  const isCollector = hasRole('collector');
  const isDealer = hasRole('dealer');

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    isAdmin,
    isCitizen,
    isCollector,
    isDealer,
  };
}
