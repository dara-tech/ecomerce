import { useState, useEffect, useCallback } from 'react';
import api from './axios';

export function useOpsList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/ops/${path}`);
      setItems(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (body: unknown) => {
    await api.post(`/ops/${path}`, body);
    await refresh();
  };

  const update = async (id: string, body: unknown) => {
    await api.put(`/ops/${path}/${id}`, body);
    await refresh();
  };

  const remove = async (id: string) => {
    await api.delete(`/ops/${path}/${id}`);
    await refresh();
  };

  return { items, loading, error, refresh, create, update, remove };
}
