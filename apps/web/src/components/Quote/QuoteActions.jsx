import React, { useEffect, useState } from 'react';
import CustomSelect from "../ui/CustomSelect.jsx";
import { apiFetch } from '../../lib/api.js';
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
  const exportPdf = async () => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/quote.pdf`, {}, authToken);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return alert('Error generando PDF: ' + (body.error || res.statusText));
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
    } catch (err) {
      console.error(err);
      alert('Error generando PDF');
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
        return alert('Error aceptando: ' + (body.error || res.statusText));
      }
      onStatusChange?.('confirmed');
      setAcceptState('success');
    } catch (err) {
      console.error(err);
      setAcceptState('idle');
      alert('Error aceptando presupuesto');
    }
  };

  const loadRevisions = async () => {
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
  };

  useEffect(() => {
    loadRevisions();
  }, [projectId]);

  const createRevision = async ({ name, notes, status, locked } = {}) => {
    if (!projectId || projectId.startsWith('local-')) {
      alert('Guarda el proyecto antes de crear revisiones.');
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
        alert('Error guardando revisión: ' + (body.error || res.statusText));
        return;
      }
      await loadRevisions();
    } finally {
      setRevisionLoading(false);
    }
  };

  const restoreRevision = async (revision) => {
    const snapshot = revision?.snapshot?.design;
    if (!snapshot) return alert('Revisión sin snapshot disponible.');
    await onRestoreDesign?.(snapshot);
  };

  const setActiveRevision = async (revision) => {
    if (revision?.locked) {
      alert('Esta versión está bloqueada y es solo lectura.');
      return;
    }
    await restoreRevision(revision);
    onSetActiveVersion?.(revision);
    setIsRevisionOpen(false);
  };

  return (
    <div className="quote-actions">
      <button className="canvas__export" type="button" onClick={exportPdf}>Exportar presupuesto (PDF)</button>
      <button className="canvas__edit" type="button" onClick={() => { setIsRevisionOpen(true); loadRevisions(); }}>
        Historial{revisions.length > 0 ? ` (${revisions.length})` : ''}
      </button>
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
