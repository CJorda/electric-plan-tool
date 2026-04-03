import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';

export default function useProjects({ apiEnabled, authToken = '' }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const readLocalProjects = () => {
    try {
      const stored = localStorage.getItem('projectsLocal');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    if (!apiEnabled) {
      setProjects(readLocalProjects());
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/api/projects', {}, authToken);
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setProjects(data.items || []);
    } catch {
      setError('API no disponible. Usando locales.');
      setProjects(readLocalProjects());
    } finally {
      setIsLoading(false);
    }
  }, [apiEnabled, authToken]);

  useEffect(() => {
    load();
  }, [load]);

  return { projects, setProjects, isLoading, error, reload: load };
}
