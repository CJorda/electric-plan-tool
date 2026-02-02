import { useRef } from "react";
import "./ProjectAttachmentsModal.css";

export default function ProjectAttachmentsModal({
  open,
  project,
  attachments = [],
  onAddAttachments,
  onDeleteAttachment,
  onOpenAttachment,
  onClose,
}) {
  const inputRef = useRef(null);

  if (!open || !project) return null;

  const handlePickFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    onAddAttachments?.(files);
    event.target.value = "";
  };

  return (
    <div className="pa-modal-backdrop" onClick={onClose}>
      <div className="pa-modal" onClick={(event) => event.stopPropagation()}>
        <div className="pa-modal__header">
          <div>
            <h3>Adjuntos · {project.name}</h3>
            <p>Sube archivos o elimina los existentes.</p>
          </div>
          <button className="pa-modal__close" type="button" onClick={onClose}>Cerrar</button>
        </div>

        <div className="pa-modal__body">
          <div className="pa-modal__actions">
            <input
              ref={inputRef}
              className="pa-modal__file"
              type="file"
              multiple
              onChange={handlePickFiles}
            />
            <button
              type="button"
              className="pa-modal__button"
              onClick={() => inputRef.current?.click()}
            >
              Añadir adjuntos
            </button>
          </div>

          {attachments.length === 0 ? (
            <div className="pa-modal__empty">No hay adjuntos todavía.</div>
          ) : (
            <ul className="pa-modal__list">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="pa-modal__item">
                  <div className="pa-modal__file-info">
                    <strong>{attachment.name}</strong>
                    <span>{attachment.sizeLabel}</span>
                  </div>
                  <div className="pa-modal__item-actions">
                    <button
                      type="button"
                      className="pa-modal__link"
                      onClick={() => onOpenAttachment?.(attachment)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="pa-modal__delete"
                      onClick={() => onDeleteAttachment?.(attachment.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
