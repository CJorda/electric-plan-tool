import { useMemo, useState } from 'react';
import './QuoteRevisionModal.css';

export default function QuoteRevisionModal({
  open,
  onClose,
  versions = [],
  onCreate,
  onRestore,
  onSetActive,
  onClearActive,
  activeVersionId,
  loading,
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [locked, setLocked] = useState(false);
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [versions]
  );

  const handleOpenVersion = (version) => {
    if (!version) return;
    if (version.locked) {
      onRestore?.(version);
      return;
    }
    onSetActive?.(version);
  };

  if (!open) return null;

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal__header">
          <h3>Historial de revisiones</h3>
          <button className="qr-modal__close" type="button" onClick={onClose}>Cerrar</button>
        </div>
        <div className="qr-modal__body">
          <div className="qr-modal__form">
            <label>
              Nombre
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Modbus"
              />
            </label>
            <label>
              Notas
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles de la versión"
                rows={2}
              />
            </label>
            <label>
              Estado
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Borrador</option>
                <option value="confirmed">Confirmada</option>
              </select>
            </label>
            <label className="qr-modal__checkbox">
              <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
              Bloquear versión
            </label>
          </div>
          <div className="qr-modal__actions">
            <button
              className="qr-modal__confirm"
              type="button"
              onClick={() => onCreate?.({ name, notes, status, locked })}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Crear versión'}
            </button>
            {activeVersionId && (
              <button className="qr-modal__secondary" type="button" onClick={onClearActive}>
                Salir de versión
              </button>
            )}
          </div>

          <div className="qr-modal__list">
            {versions.length === 0 ? (
              <div className="qr-modal__empty">Aún no hay revisiones guardadas.</div>
            ) : (
              sortedVersions.map((v) => (
                <div key={v.id} className="qr-modal__row">
                  <div>
                    <strong>{v.name || 'Versión'}</strong>
                    <div className="qr-modal__date">
                      {new Date(v.createdAt).toLocaleString()}
                      {v.author ? ` · ${v.author}` : ''}
                      {v.status ? ` · ${v.status}` : ''}
                      {v.locked ? ' · bloqueada' : ''}
                    </div>
                    {v.notes && <div className="qr-modal__notes">{v.notes}</div>}
                  </div>
                  <span className="qr-modal__id">{v.id.slice(0, 8)}</span>
                  {activeVersionId === v.id ? (
                    <span className="qr-modal__active">Activa</span>
                  ) : (
                    <div className="qr-modal__row-actions">
                      <button
                        className={v.locked ? "qr-modal__restore" : "qr-modal__primary"}
                        type="button"
                        onClick={() => handleOpenVersion(v)}
                      >
                        Abrir
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
