'use client';

import { useState, useEffect, useCallback } from 'react';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface UseApiOptions {
  manual?: boolean;
  params?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!options.manual);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(url, { params });
      setData(response.data);
      options.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Bir hata oluştu';
      setError(err);
      options.onError?.(err);
      // Only toast if it's not a background fetch or manual execute
      if (!options.manual) {
        // toast.error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options.onSuccess, options.onError, options.manual]);

  useEffect(() => {
    if (!options.manual) {
      execute(options.params);
    }
  }, [url, options.manual, JSON.stringify(options.params)]);

  return {
    data,
    loading,
    error,
    refresh: execute,
    execute
  };
}
