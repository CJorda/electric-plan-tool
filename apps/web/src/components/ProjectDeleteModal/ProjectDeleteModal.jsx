import './ProjectDeleteModal.css';

export default function ProjectDeleteModal({ open, project, onCancel, onConfirm }) {
  if (!open || !project) return null;

  return (
    <div className="pd-modal-backdrop">
      <div className="pd-modal">
        <h3>¿Eliminar proyecto?</h3>
        <p>Vas a eliminar el proyecto <strong>{project.name}</strong>. Esta acción no se puede deshacer.</p>
        <div className="pd-actions">
          <button className="pd-cancel" type="button" onClick={onCancel}>Cancelar</button>
          <button className="pd-confirm" type="button" onClick={() => onConfirm(project)}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}
