import { useEffect, useMemo, useState } from 'react';
import './ProjectCreateModal.css';
import ProjectForm from '../ProjectForm/ProjectForm.jsx';
import CustomSelect from '../ui/CustomSelect.jsx';
import { apiFetch } from '../../lib/api.js';

export default function ProjectCreateModal({ open, onClose, onCreate, clients = [], projects = [], authToken = '' }) {
  if (!open) return null;

  const [baseProjectId, setBaseProjectId] = useState('');
  const [baseVersionId, setBaseVersionId] = useState('');
  const [baseVersions, setBaseVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const apiEnabled = import.meta.env.VITE_API_ENABLED === 'true';

  useEffect(() => {
    if (!open) return;
    setBaseProjectId('');
    setBaseVersionId('');
    setBaseVersions([]);
    setVersionsLoading(false);
  }, [open]);

  useEffect(() => {
    if (!baseProjectId || !apiEnabled) {
      setBaseVersions([]);
      setBaseVersionId('');
      return;
    }
    let cancelled = false;
    setVersionsLoading(true);
    apiFetch(`/api/projects/${baseProjectId}/versions`, {}, authToken)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setBaseVersions(Array.isArray(data?.versions) ? data.versions : []);
      })
      .catch(() => {
        if (!cancelled) setBaseVersions([]);
      })
      .finally(() => {
        if (!cancelled) setVersionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baseProjectId, apiEnabled, authToken]);

  const projectOptions = useMemo(() => (
    projects.map((project) => ({ value: project.id, label: project.name }))
  ), [projects]);

  const versionOptions = useMemo(() => (
    [
      { value: '', label: 'Diseño actual' },
      ...baseVersions.map((version) => ({
        value: version.id,
        label: version.name || version.id.slice(0, 8),
      })),
    ]
  ), [baseVersions]);

  const handleCreate = async (payload) => {
    const created = await onCreate?.({
      ...payload,
      baseProjectId: baseProjectId || null,
      baseVersionId: baseVersionId || null,
    });
    if (created) onClose?.();
    return created;
  };

  return (
    <div className="pc-modal-backdrop" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pc-modal__header">
          <h3>Nuevo proyecto</h3>
          <button className="pc-modal__close" type="button" onClick={onClose}>Cerrar</button>
        </div>
        <div className="pc-modal__body">
          <div className="pc-modal__base">
            <label>
              Basado en proyecto
              <CustomSelect
                value={baseProjectId}
                options={projectOptions}
                placeholder="Sin base"
                onChange={(value) => {
                  setBaseProjectId(value);
                  setBaseVersionId('');
                }}
                disabled={!projectOptions.length}
              />
            </label>
            <label>
              Basado en versión
              <CustomSelect
                value={baseVersionId}
                options={versionOptions}
                placeholder={versionsLoading ? 'Cargando...' : 'Diseño actual'}
                onChange={setBaseVersionId}
                disabled={!baseProjectId || versionsLoading}
              />
            </label>
          </div>
          <ProjectForm onCreate={handleCreate} clients={clients} />
        </div>
      </div>
    </div>
  );
}
