import { useState, useEffect, useCallback } from 'react';
import { fetchSubmissions } from '../services/api';


export const useSubmissionsList = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSubmissions();
      
      
      const uniqueSubmissions = Array.from(
        new Map(data.map(sub => [sub.id, sub])).values()
      );
      
      setSubmissions(uniqueSubmissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    submissions,
    loading,
    error,
    refresh,
  };
};