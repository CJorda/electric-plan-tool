import { useState } from 'react';
import './ProjectsPage.css';
import ProjectList from '../../components/ProjectList/ProjectList.jsx';
import useProjects from '../../hooks/useProjects.js';
import ProjectDeleteModal from '../../components/ProjectDeleteModal/ProjectDeleteModal.jsx';
import ProjectCreateModal from '../../components/ProjectCreateModal/ProjectCreateModal.jsx';
import ProjectAttachmentsModal from '../../components/ProjectAttachmentsModal/ProjectAttachmentsModal.jsx';
import VersionDeleteModal from '../../components/VersionDeleteModal/VersionDeleteModal.jsx';
import { apiFetch } from '../../lib/api.js';

function ProjectsPage({ isProjectsSection, activeSubsection, onOpenDesigner, onProjectCreated, hideStatusControls = false, authToken = '', clients = [] }) {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === 'true';
  const [projectTotals, setProjectTotals] = useState(() => {
    try {
      const s = localStorage.getItem('projectTotals');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  const { projects, setProjects, isLoading, error, reload } = useProjects({ apiEnabled, authToken });

  const handleOpen = (projectId) => onOpenDesigner(projectId, projects.find((p) => p.id === projectId)?.status);

  const [confirmProject, setConfirmProject] = useState(null);
  const [confirmVersion, setConfirmVersion] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [attachmentsProject, setAttachmentsProject] = useState(null);
  const [attachmentsByProject, setAttachmentsByProject] = useState({});
  const [versionsByProject, setVersionsByProject] = useState({});
  const [versionsOpenByProject, setVersionsOpenByProject] = useState({});
  const [versionsLoadingByProject, setVersionsLoadingByProject] = useState({});

  const formatBytes = (value) => {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDelete = (project) => {
    // open confirmation modal
    setConfirmProject(project);
  };

  const handleToggleVersions = async (project) => {
    if (!project) return;
    setVersionsOpenByProject((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
    if (versionsByProject[project.id] || versionsLoadingByProject[project.id]) return;
    setVersionsLoadingByProject((prev) => ({ ...prev, [project.id]: true }));
    try {
      const res = await apiFetch(`/api/projects/${project.id}/versions`, {}, authToken);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVersionsByProject((prev) => ({ ...prev, [project.id]: data.versions || [] }));
    } catch (error) {
      console.error('Failed to load versions', error);
      alert('No se pudieron cargar las versiones.');
    } finally {
      setVersionsLoadingByProject((prev) => ({ ...prev, [project.id]: false }));
    }
  };

  const handleSelectVersion = (project, version) => {
    if (!project || !version) return;
    onOpenDesigner(project.id, project.status, version);
  };

  const handleDuplicateVersion = async (project, version) => {
    if (!project) return;
    const duplicateName = `Copia ${new Date().toLocaleDateString()}`;
    const versionPayload = {
      snapshot: version?.snapshot || { design: { boxes: [], cables: [], devices: [] } },
      name: duplicateName,
      status: 'draft',
      locked: false,
    };

    if (!apiEnabled) {
      const localVersion = {
        id: `local-${Date.now()}`,
        ...versionPayload,
        createdAt: new Date().toISOString(),
      };
      setVersionsByProject((prev) => ({
        ...prev,
        [project.id]: [localVersion, ...(prev[project.id] || [])],
      }));
      setVersionsOpenByProject((prev) => ({ ...prev, [project.id]: true }));
      return;
    }

    try {
      const createRes = await apiFetch(`/api/projects/${project.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionPayload),
      }, authToken);
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${createRes.status}`);
      }
      const createdVersion = await createRes.json();

      setVersionsByProject((prev) => ({
        ...prev,
        [project.id]: [createdVersion, ...(prev[project.id] || [])],
      }));
      setVersionsOpenByProject((prev) => ({ ...prev, [project.id]: true }));
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? { ...item, versions_count: (item.versions_count || 0) + 1 }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to duplicate version', error);
      alert('No se pudo duplicar la versión.');
    }
  };

  const handleDeleteVersion = async (project, version) => {
    if (!project || !version) return;
    if (!apiEnabled) {
      setVersionsByProject((prev) => ({
        ...prev,
        [project.id]: (prev[project.id] || []).filter((item) => item.id !== version.id),
      }));
      return;
    }
    try {
      const res = await apiFetch(`/api/projects/${project.id}/versions/${version.id}`, {
        method: 'DELETE',
      }, authToken);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVersionsByProject((prev) => ({
        ...prev,
        [project.id]: (prev[project.id] || []).filter((item) => item.id !== version.id),
      }));
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? { ...item, versions_count: Math.max(0, (item.versions_count || 1) - 1) }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to delete version', error);
      alert('No se pudo eliminar la versión.');
    }
  };

  const handleRequestDeleteVersion = (project, version) => {
    if (!project || !version) return;
    setConfirmVersion({ project, version });
  };

  const handleRenameVersion = async (project, version, name) => {
    if (!project || !version || !name) return;
    if (!apiEnabled) {
      setVersionsByProject((prev) => ({
        ...prev,
        [project.id]: (prev[project.id] || []).map((item) =>
          item.id === version.id ? { ...item, name } : item
        ),
      }));
      return;
    }
    try {
      const res = await apiFetch(
        `/api/projects/${project.id}/versions/${version.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        },
        authToken
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setVersionsByProject((prev) => ({
        ...prev,
        [project.id]: (prev[project.id] || []).map((item) =>
          item.id === version.id ? { ...item, name: updated.name } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to rename version', error);
      alert('No se pudo renombrar la versión.');
    }
  };

  const handleRenameProject = async (project, name) => {
    if (!project || !name) return;
    if (!apiEnabled) {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? { ...item, name } : item)));
      return;
    }
    try {
      const payload = {
        name,
        type: project.type || 'plan',
        client: project.client ?? null,
        reference: project.reference ?? null,
        address: project.address ?? null,
        notes: project.notes ?? null,
        status: project.status || 'draft',
      };
      const res = await apiFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, authToken);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setProjects((prev) => prev.map((item) => (item.id === project.id ? { ...item, name: updated.name } : item)));
    } catch (error) {
      console.error('Failed to rename project', error);
      alert('No se pudo renombrar el proyecto.');
    }
  };

  const handleOpenAttachments = async (project) => {
    if (!project) return;
    setAttachmentsProject(project);
    if (!apiEnabled) return;
    try {
      const res = await apiFetch(`/api/projects/${project.id}/attachments`, {}, authToken);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = (data.items || []).map((item) => ({
        ...item,
        sizeLabel: formatBytes(item.size),
      }));
      setAttachmentsByProject((prev) => ({ ...prev, [project.id]: items }));
    } catch (error) {
      console.error('Failed to load attachments', error);
      alert('No se pudieron cargar los adjuntos.');
    }
  };

  const handleAddAttachments = async (files) => {
    if (!attachmentsProject) return;
    const maxSize = 5 * 1024 * 1024;
    const allowed = files.filter((file) => file.size <= maxSize);
    if (allowed.length !== files.length) {
      alert('Algunos archivos superan 5MB y fueron omitidos.');
    }
    if (!apiEnabled) return;

    try {
      const payloadItems = await Promise.all(
        allowed.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: await readFileAsDataUrl(file),
        }))
      );
      const res = await apiFetch(
        `/api/projects/${attachmentsProject.id}/attachments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: payloadItems }),
        },
        authToken
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const created = (data.items || []).map((item) => ({
        ...item,
        sizeLabel: formatBytes(item.size),
      }));
      setAttachmentsByProject((prev) => {
        const current = prev[attachmentsProject.id] || [];
        return {
          ...prev,
          [attachmentsProject.id]: [...created, ...current],
        };
      });
    } catch (error) {
      console.error('Failed to upload attachments', error);
      alert('No se pudieron subir los adjuntos.');
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    if (!attachmentsProject) return;
    if (!apiEnabled) return;
    apiFetch(
      `/api/projects/${attachmentsProject.id}/attachments/${attachmentId}`,
      { method: 'DELETE' },
      authToken
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setAttachmentsByProject((prev) => {
          const current = prev[attachmentsProject.id] || [];
          return {
            ...prev,
            [attachmentsProject.id]: current.filter((item) => item.id !== attachmentId),
          };
        });
      })
      .catch((error) => {
        console.error('Failed to delete attachment', error);
        alert('No se pudo eliminar el adjunto.');
      });
  };

  const handleOpenAttachment = async (attachment) => {
    if (!attachmentsProject || !attachment) return;
    if (!apiEnabled) return;
    try {
      const res = await apiFetch(
        `/api/projects/${attachmentsProject.id}/attachments/${attachment.id}`,
        {},
        authToken
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to open attachment', error);
      alert('No se pudo abrir el adjunto.');
    }
  };

  const performDelete = (project) => {
    if (!project) return;
    const prevProjects = projects;
    // optimistic update
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setConfirmProject(null);

    if (apiEnabled) {
      apiFetch(`/api/projects/${project.id}`, { method: 'DELETE' }, authToken)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          console.error('Failed to delete project', err);
          alert('No se pudo eliminar el proyecto en el servidor. Revirtiendo.');
          setProjects(prevProjects);
        });
    }
  };

  const handleStatusChange = async (project, status) => {
    if (!project || project.status === status) return;
    // optimistic update
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, status } : p)));

    // persist to API if enabled
    if (apiEnabled) {
      try {
        const res = await apiFetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...project, status }),
        }, authToken);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
      } catch (err) {
        // revert optimistic change
        setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
        console.error('Failed to update project status', err);
        alert('No se pudo actualizar el estado en el servidor. Revirtiendo.');
      }
    }
  };

  const handleCreateProject = async (payload) => {
    const baseProjectId = payload?.baseProjectId || null;
    const baseVersionId = payload?.baseVersionId || null;
    if (apiEnabled) {
      try {
        const cleanedPayload = { ...payload };
        delete cleanedPayload.baseProjectId;
        delete cleanedPayload.baseVersionId;
        const res = await apiFetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanedPayload),
        }, authToken);
        if (!res.ok) {
          let errBody = null;
          try {
            errBody = await res.json();
          } catch (e) {
            // ignore
          }
          const msg = errBody?.message || errBody?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        const created = await res.json();
        const readBlobAsDataUrl = (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

        let initialDesign = { boxes: [], cables: [], devices: [] };
        let baseVersionMeta = null;

        if (baseProjectId) {
          const [designRes, versionsRes, attachmentsRes] = await Promise.all([
            apiFetch(`/api/projects/${baseProjectId}/design`, {}, authToken),
            apiFetch(`/api/projects/${baseProjectId}/versions`, {}, authToken),
            apiFetch(`/api/projects/${baseProjectId}/attachments`, {}, authToken),
          ]);

          const designData = designRes.ok ? await designRes.json() : { design: null };
          const versionsData = versionsRes.ok ? await versionsRes.json() : { versions: [] };
          const attachmentsData = attachmentsRes.ok ? await attachmentsRes.json() : { items: [] };

          if (baseVersionId && Array.isArray(versionsData?.versions)) {
            baseVersionMeta = versionsData.versions.find((version) => version.id === baseVersionId) || null;
            if (baseVersionMeta?.snapshot?.design) {
              initialDesign = baseVersionMeta.snapshot.design;
            }
          }

          if (!baseVersionMeta && designData?.design) {
            initialDesign = designData.design;
          }

          if (Array.isArray(attachmentsData?.items) && attachmentsData.items.length > 0) {
            for (const attachment of attachmentsData.items) {
              const fileRes = await apiFetch(
                `/api/projects/${baseProjectId}/attachments/${attachment.id}`,
                {},
                authToken
              );
              if (!fileRes.ok) continue;
              const blob = await fileRes.blob();
              const dataUrl = await readBlobAsDataUrl(blob);
              await apiFetch(
                `/api/projects/${created.id}/attachments`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    items: [{
                      name: attachment.name,
                      type: attachment.mime_type || attachment.type,
                      size: attachment.size || blob.size,
                      dataUrl,
                    }],
                  }),
                },
                authToken
              );
            }
          }
        }

        if (initialDesign) {
          await apiFetch(`/api/projects/${created.id}/design`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ design: initialDesign }),
          }, authToken);
        }

        const versionRes = await apiFetch(`/api/projects/${created.id}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshot: { design: initialDesign, createdAt: new Date().toISOString() },
            name: baseVersionMeta?.name || 'Versión 1',
            notes: baseVersionMeta?.notes || null,
            status: baseVersionMeta?.status || 'draft',
            locked: false,
            author: baseVersionMeta?.author || null,
          }),
        }, authToken);

        const createdVersion = versionRes.ok ? await versionRes.json() : null;
        const createdWithVersions = { ...created, versions_count: 1 };
        setVersionsByProject((prev) => ({
          ...prev,
          [created.id]: createdVersion ? [createdVersion] : [],
        }));
        setVersionsOpenByProject((prev) => ({ ...prev, [created.id]: true }));

        setProjects((prev) => [createdWithVersions, ...prev]);
        onProjectCreated?.(createdWithVersions);
        setIsCreateOpen(false);
        return createdWithVersions;
      } catch (err) {
        console.error('Failed to create project', err);
        alert('No se pudo crear el proyecto en el servidor. ' + (err?.message || ''));
        throw err;
      }
    }

    // local fallback
    const id = `local-${Date.now()}`;
    const created = { id, name: payload.name || 'Proyecto local', status: payload.status || 'draft', createdAt: new Date().toISOString(), design: payload.design || null };
    setProjects((prev) => [created, ...prev]);
    onProjectCreated?.(created);
    setIsCreateOpen(false);
    return created;
  };

  if (!isProjectsSection) return null;

  return (
    <section className="projects">
      <div className="projects__header">
        <div>
          <h2>Proyectos</h2>
          <p>Organiza y gestiona tus proyectos eléctricos.</p>
        </div>
        <div className="projects__header-actions">
          <button
            className="projects__action"
            type="button"
            onClick={() => setIsCreateOpen(true)}
          >
            Nuevo proyecto
          </button>
        </div>
      </div>

      <div className="projects__placeholder">
        <h3>Listado de proyectos</h3>
        <p>Aquí aparecerán los proyectos guardados y el historial reciente.</p>
        {error && <p className="projects__status projects__status--error">{error}</p>}
        {isLoading ? (
          <div className="projects__skeleton">
            {[1, 2, 3].map((item) => (
              <div key={item} className="projects__skeleton-card">
                <div className="projects__skeleton-title skeleton" />
                <div className="projects__skeleton-meta">
                  <span className="projects__skeleton-pill skeleton" />
                  <span className="projects__skeleton-line skeleton" />
                  <span className="projects__skeleton-line skeleton" />
                </div>
                <div className="projects__skeleton-actions">
                  <span className="projects__skeleton-button skeleton" />
                  <span className="projects__skeleton-button skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProjectList
            projects={projects}
            totals={projectTotals}
            onOpen={handleOpen}
            onDelete={handleDelete}
            onAttachments={handleOpenAttachments}
            onDuplicateVersion={handleDuplicateVersion}
            onRequestDeleteVersion={handleRequestDeleteVersion}
            onRenameVersion={handleRenameVersion}
            onRenameProject={handleRenameProject}
            attachmentsByProject={attachmentsByProject}
            versionsByProject={versionsByProject}
            versionsOpenByProject={versionsOpenByProject}
            versionsLoadingByProject={versionsLoadingByProject}
            onToggleVersions={handleToggleVersions}
            onSelectVersion={handleSelectVersion}
            onStatusChange={handleStatusChange}
            hideStatusControls={hideStatusControls}
          />
        )}
      </div>

      <ProjectDeleteModal
        open={Boolean(confirmProject)}
        project={confirmProject}
        onCancel={() => setConfirmProject(null)}
        onConfirm={performDelete}
      />
      <VersionDeleteModal
        open={Boolean(confirmVersion)}
        project={confirmVersion?.project}
        version={confirmVersion?.version}
        onCancel={() => setConfirmVersion(null)}
        onConfirm={(project, version) => {
          setConfirmVersion(null);
          handleDeleteVersion(project, version);
        }}
      />
      <ProjectCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateProject}
        clients={clients}
        projects={projects}
        authToken={authToken}
      />
      <ProjectAttachmentsModal
        open={Boolean(attachmentsProject)}
        project={attachmentsProject}
        attachments={attachmentsProject ? attachmentsByProject[attachmentsProject.id] || [] : []}
        onAddAttachments={handleAddAttachments}
        onDeleteAttachment={handleDeleteAttachment}
        onOpenAttachment={handleOpenAttachment}
        onClose={() => setAttachmentsProject(null)}
      />
    </section>
  );
}

export default ProjectsPage;
