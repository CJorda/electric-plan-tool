import './ProjectCreateModal.css';
import ProjectForm from '../ProjectForm/ProjectForm.jsx';

export default function ProjectCreateModal({ open, onClose, onCreate, clients = [] }) {
  if (!open) return null;

  const handleCreate = async (payload) => {
    const created = await onCreate?.(payload);
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
          <ProjectForm onCreate={handleCreate} clients={clients} />
        </div>
      </div>
    </div>
  );
}
