import { useEffect, useState } from 'react';

export default function useProjects({ apiEnabled }) {
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

  const load = async () => {
    setIsLoading(true);
    setError('');
    if (!apiEnabled) {
      setProjects(readLocalProjects());
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setProjects(data.items || []);
    } catch (e) {
      setError('API no disponible. Usando locales.');
      setProjects(readLocalProjects());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { projects, setProjects, isLoading, error, reload: load };
}
