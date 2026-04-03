import './VersionDeleteModal.css';
import DeleteIconButton from '../ui/DeleteIconButton.jsx';

export default function VersionDeleteModal({ open, project, version, onCancel, onConfirm }) {
  if (!open || !project || !version) return null;

  return (
    <div className="vd-modal-backdrop">
      <div className="vd-modal">
        <h3>¿Eliminar versión?</h3>
        <p>
          Vas a eliminar la versión <strong>{version.name || version.id.slice(0, 8)}</strong> del proyecto{' '}
          <strong>{project.name}</strong>. Esta acción no se puede deshacer.
        </p>
        <div className="vd-actions">
          <button className="vd-cancel" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <DeleteIconButton
            ariaLabel="Confirmar eliminación de versión"
            onClick={() => onConfirm(project, version)}
          />
        </div>
      </div>
    </div>
  );
}
