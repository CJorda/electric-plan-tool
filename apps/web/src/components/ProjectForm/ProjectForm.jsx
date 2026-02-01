import { useState } from 'react';
import CustomSelect from "../ui/CustomSelect.jsx";
import './ProjectForm.css';

export default function ProjectForm({ apiEnabled = import.meta.env.VITE_API_ENABLED === 'true', onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('plan');
  const [client, setClient] = useState('');
  const [reference, setReference] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('El nombre es obligatorio');
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        status: 'draft',
        type,
        client: client.trim() || null,
        reference: reference.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      };
      const created = await onCreate(payload);
      setName('');
      setType('plan');
      setClient('');
      setReference('');
      setAddress('');
      setNotes('');
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
        <CustomSelect
          value={type}
          options={[
            { value: "plan", label: "Plan" },
            { value: "installation", label: "Instalación" },
            { value: "maintenance", label: "Mantenimiento" },
          ]}
          onChange={setType}
        />
      </label>

      <label>
        Cliente
        <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre del cliente" />
      </label>

      <label>
        Referencia interna
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej: OP-2026-014" />
      </label>

      <label>
        Dirección
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección del proyecto" />
      </label>

      <label>
        Notas
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas internas o del cliente"
          rows={3}
        />
      </label>

      <div className="project-form__actions">
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear proyecto'}</button>
      </div>
    </form>
  );
}
