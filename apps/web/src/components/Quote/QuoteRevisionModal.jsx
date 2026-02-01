import './QuoteRevisionModal.css';

export default function QuoteRevisionModal({ open, onClose, versions = [], onCreate, onRestore, loading }) {
  if (!open) return null;

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal__header">
          <h3>Historial de revisiones</h3>
          <button className="qr-modal__close" type="button" onClick={onClose}>Cerrar</button>
        </div>
        <div className="qr-modal__body">
          <button className="qr-modal__confirm" type="button" onClick={onCreate} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar revisión'}
          </button>
          <div className="qr-modal__list">
            {versions.length === 0 ? (
              <div className="qr-modal__empty">Aún no hay revisiones guardadas.</div>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="qr-modal__row">
                  <div>
                    <strong>Revisión</strong>
                    <div className="qr-modal__date">{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                  <span className="qr-modal__id">{v.id.slice(0, 8)}</span>
                  <button className="qr-modal__restore" type="button" onClick={() => onRestore?.(v)}>
                    Restaurar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
