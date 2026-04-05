import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Download, FileText, History, List } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { toastError, toastInfo, toastSuccess } from '../../lib/toast.js';
import QuoteAcceptModal from './QuoteAcceptModal.jsx';
import QuoteRevisionModal from './QuoteRevisionModal.jsx';

export default function QuoteActions({
  projectId,
  onStatusChange,
  onTogglePartsList,
  designSnapshot,
  snapshotPricing,
  onRestoreDesign,
  onSetActiveVersion,
  onClearActiveVersion,
  activeVersionId,
  authToken = '',
  authorName = '',
}) {
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [acceptState, setAcceptState] = useState('idle');
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef(null);

  const exportMaterialsCsv = async () => {
    if (!projectId || projectId.startsWith('local-')) {
      toastInfo('Guarda el proyecto antes de exportar materiales.');
      return;
    }
    try {
      const res = await apiFetch(`/api/reports/materials/${projectId}?format=csv`, {}, authToken);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toastError('Error exportando materiales: ' + (body.error || res.statusText));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-${projectId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toastSuccess('Reporte de materiales exportado.');
    } catch (err) {
      console.error(err);
      toastError('Error exportando reporte de materiales.');
    }
  };

  const exportPdf = async () => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/quote.pdf`, {}, authToken);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toastError('Error generando PDF: ' + (body.error || res.statusText));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toastSuccess('PDF generado correctamente.');
    } catch (err) {
      console.error(err);
      toastError('Error generando PDF.');
    }
  };

  const accept = async (name) => {
    try {
      setAcceptState('submitting');
      const res = await apiFetch(`/api/projects/${projectId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ by: { name } }),
      }, authToken);
      const body = await res.json();
      if (!res.ok) {
        setAcceptState('idle');
        toastError('Error aceptando: ' + (body.error || res.statusText));
        return;
      }
      onStatusChange?.('confirmed');
      setAcceptState('success');
      toastSuccess('Presupuesto marcado como aceptado.');
    } catch (err) {
      console.error(err);
      setAcceptState('idle');
      toastError('Error aceptando presupuesto.');
    }
  };

  const loadRevisions = useCallback(async () => {
    if (!projectId || projectId.startsWith('local-')) {
      setRevisions([]);
      return;
    }
    try {
      const res = await apiFetch(`/api/projects/${projectId}/versions`, {}, authToken);
      if (!res.ok) return;
      const data = await res.json();
      setRevisions(data.versions || []);
    } catch {
      // ignore
    }
  }, [authToken, projectId]);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setIsActionsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openRevisionModal = () => {
    setIsRevisionOpen(true);
    setIsActionsMenuOpen(false);
    loadRevisions();
  };

  const runMenuAction = async (action) => {
    setIsActionsMenuOpen(false);
    await action?.();
  };

  const createRevision = async ({ name, notes, status, locked } = {}) => {
    if (!projectId || projectId.startsWith('local-')) {
      toastInfo('Guarda el proyecto antes de crear revisiones.');
      return;
    }
    setRevisionLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: {
            design: designSnapshot,
            pricing: snapshotPricing || undefined,
            createdAt: new Date().toISOString(),
          },
          name,
          notes,
          status,
          locked,
          author: authorName || undefined,
        }),
      }, authToken);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toastError('Error guardando revisión: ' + (body.error || res.statusText));
        return;
      }
      await loadRevisions();
      toastSuccess('Revisión guardada.');
    } finally {
      setRevisionLoading(false);
    }
  };

  const restoreRevision = async (revision) => {
    const snapshot = revision?.snapshot?.design;
    if (!snapshot) {
      toastInfo('Revisión sin snapshot disponible.');
      return;
    }
    await onRestoreDesign?.(snapshot);
    toastSuccess('Revisión restaurada.');
  };

  const setActiveRevision = async (revision) => {
    if (revision?.locked) {
      toastInfo('Esta versión está bloqueada y es solo lectura.');
      return;
    }
    await restoreRevision(revision);
    onSetActiveVersion?.(revision);
    setIsRevisionOpen(false);
  };

  return (
    <div className="quote-actions">
      <div className="quote-actions__menu" ref={actionsMenuRef}>
        <button
          className={`toolbar__button toolbar__menu-trigger quote-actions__menu-button ${
            isActionsMenuOpen ? 'is-active' : ''
          }`}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isActionsMenuOpen}
          onClick={() => {
            setIsActionsMenuOpen((prev) => !prev);
          }}
        >
          Acciones
          <ChevronDown className={`toolbar__menu-chevron${isActionsMenuOpen ? ' is-open' : ''}`} size={16} />
        </button>
        {isActionsMenuOpen && (
          <div className="quote-actions__dropdown" role="menu" aria-label="Acciones del proyecto">
            {onTogglePartsList && (
              <button className="quote-actions__menu-item" type="button" role="menuitem" onClick={() => runMenuAction(onTogglePartsList)}>
                <List size={15} className="quote-actions__menu-item-icon" />
                Listado de piezas
              </button>
            )}

            <button className="quote-actions__menu-item" type="button" role="menuitem" onClick={() => runMenuAction(exportPdf)}>
              <FileText size={15} className="quote-actions__menu-item-icon" />
              Exportar presupuesto (PDF)
            </button>
            <button className="quote-actions__menu-item" type="button" role="menuitem" onClick={() => runMenuAction(exportMaterialsCsv)}>
              <Download size={15} className="quote-actions__menu-item-icon" />
              Exportar materiales (CSV)
            </button>
            <button className="quote-actions__menu-item" type="button" role="menuitem" onClick={openRevisionModal}>
              <History size={15} className="quote-actions__menu-item-icon" />
              Historial{revisions.length > 0 ? ` (${revisions.length})` : ''}
            </button>

            <div className="quote-actions__menu-separator" />
            <button
              className="quote-actions__menu-item quote-actions__menu-item--accent"
              type="button"
              role="menuitem"
              onClick={() => {
                setIsActionsMenuOpen(false);
                setAcceptState('idle');
                setIsAcceptOpen(true);
              }}
            >
              <CheckCircle2 size={15} className="quote-actions__menu-item-icon" />
              Marcar como aceptado
            </button>
          </div>
        )}
      </div>

      <QuoteRevisionModal
        open={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        versions={revisions}
        onCreate={createRevision}
        onRestore={restoreRevision}
        onSetActive={setActiveRevision}
        onClearActive={onClearActiveVersion}
        activeVersionId={activeVersionId}
        loading={revisionLoading}
      />
      <QuoteAcceptModal
        open={isAcceptOpen}
        state={acceptState}
        onClose={() => setIsAcceptOpen(false)}
        onConfirm={async (name) => {
          await accept(name);
        }}
      />
    </div>
  );
}
