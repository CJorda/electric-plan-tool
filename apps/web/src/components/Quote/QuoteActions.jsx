import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomSelect from "../ui/CustomSelect.jsx";
import { apiFetch } from '../../lib/api.js';
import { toastError, toastInfo, toastSuccess } from '../../lib/toast.js';
import QuoteAcceptModal from './QuoteAcceptModal.jsx';
import QuoteRevisionModal from './QuoteRevisionModal.jsx';

export default function QuoteActions({
  projectId,
  projectStatus,
  statusOptions = [],
  onStatusChange,
  hideStatusControls = false,
  designSnapshot,
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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

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
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  const openRevisionModal = () => {
    setIsRevisionOpen(true);
    setIsMoreMenuOpen(false);
    loadRevisions();
  };

  const handleExportPdf = async () => {
    setIsExportMenuOpen(false);
    await exportPdf();
  };

  const handleExportMaterials = async () => {
    setIsExportMenuOpen(false);
    await exportMaterialsCsv();
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
          snapshot: { design: designSnapshot, createdAt: new Date().toISOString() },
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
      <div className="quote-actions__menu" ref={exportMenuRef}>
        <button
          className="canvas__export quote-actions__menu-button"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isExportMenuOpen}
          onClick={() => {
            setIsExportMenuOpen((prev) => !prev);
            setIsMoreMenuOpen(false);
          }}
        >
          Exportar
        </button>
        {isExportMenuOpen && (
          <div className="quote-actions__dropdown" role="menu" aria-label="Opciones de exportación">
            <button className="quote-actions__menu-item" type="button" onClick={handleExportPdf}>
              Presupuesto (PDF)
            </button>
            <button className="quote-actions__menu-item" type="button" onClick={handleExportMaterials}>
              Materiales (CSV)
            </button>
          </div>
        )}
      </div>

      <div className="quote-actions__menu" ref={moreMenuRef}>
        <button
          className="canvas__edit quote-actions__menu-button"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isMoreMenuOpen}
          onClick={() => {
            setIsMoreMenuOpen((prev) => !prev);
            setIsExportMenuOpen(false);
          }}
        >
          Más
        </button>
        {isMoreMenuOpen && (
          <div className="quote-actions__dropdown" role="menu" aria-label="Más opciones">
            <button className="quote-actions__menu-item" type="button" onClick={openRevisionModal}>
              Historial{revisions.length > 0 ? ` (${revisions.length})` : ''}
            </button>
          </div>
        )}
      </div>

      {!hideStatusControls && (
        <label className="projects__status-select quote-actions__status">
          <CustomSelect
            value={projectStatus}
            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
            onChange={onStatusChange}
            className="projects__status-select-control"
          />
        </label>
      )}
      <button className="canvas__edit" type="button" onClick={() => { setAcceptState('idle'); setIsAcceptOpen(true); }}>Marcar como aceptado</button>
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
