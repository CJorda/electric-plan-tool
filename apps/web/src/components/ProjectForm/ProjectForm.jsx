import { useState } from 'react';
import './ProjectForm.css';

export default function ProjectForm({ apiEnabled = import.meta.env.VITE_API_ENABLED === 'true', onCreate }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('draft');
  const [type, setType] = useState('plan');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('El nombre es obligatorio');
    setLoading(true);
    try {
      const payload = { name: name.trim(), status, type };
      const created = await onCreate(payload);
      setName('');
      setStatus('draft');
      setType('plan');
      return created;
    } catch (err) {
      // error already handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del proyecto" />
      </label>

      <label>
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="plan">Plan</option>
          <option value="installation">Instalación</option>
          <option value="maintenance">Mantenimiento</option>
        </select>
      </label>

      <label>
        Estado
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Borrador</option>
          <option value="confirmed">Confirmado</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
      </label>

      <div className="project-form__actions">
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear proyecto'}</button>
      </div>
    </form>
  );
}
