import { useState } from 'react';
import './QuoteAcceptModal.css';

export default function QuoteAcceptModal({ open, onClose, onConfirm, state = 'idle' }) {
  const [name, setName] = useState('Cliente');

  const handleClose = () => {
    setName('Cliente');
    onClose?.();
  };

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.(name.trim() || 'Cliente');
  };

  return (
    <div className="qa-modal-backdrop" onClick={handleClose}>
      <div className="qa-modal" onClick={(e) => e.stopPropagation()}>
        {state === 'success' ? (
          <div className="qa-success">
            <div className="qa-check" aria-hidden="true">✓</div>
            <h3>Presupuesto aceptado</h3>
            <p>El proyecto quedó marcado como confirmado.</p>
            <button className="qa-modal__confirm" type="button" onClick={handleClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <div className="qa-modal__header">
              <h3>Marcar presupuesto como aceptado</h3>
              <button className="qa-modal__close" type="button" onClick={handleClose}>Cerrar</button>
            </div>
            <div className="qa-modal__body">
              <label className="qa-modal__label">
                Nombre del cliente
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente" />
              </label>
            </div>
            <div className="qa-modal__actions">
              <button className="qa-modal__cancel" type="button" onClick={handleClose}>Cancelar</button>
              <button className="qa-modal__confirm" type="button" onClick={handleConfirm} disabled={state === 'submitting'}>
                {state === 'submitting' ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
