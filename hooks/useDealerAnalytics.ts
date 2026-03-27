'use client';

import { useState, useEffect } from 'react';
import { DealerAnalyticsData } from '@/types';

export function useDealerAnalytics(period: 'all' | 'monthly' | 'weekly' = 'all') {
  const [data, setData] = useState<DealerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dealer/analytics?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalytics();
  }, [period]);
  
  return { data, loading, error, refetch: fetchAnalytics };
}
