import { useState, useEffect } from 'react';
import { BaseRepository } from '../repositories';
import { BaseEntity } from '../models/firebase.types';

export function useFirestoreCollection<T extends BaseEntity>(repository: BaseRepository<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = repository.subscribe(
      (items) => {
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Erro ao sincronizar dados com o Firebase.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [repository]);

  return { data, loading, error, setData };
}
