import { useMemo, useState } from 'react';
import './ProjectsPage.css';
import useProjects from '../../hooks/useProjects.js';
import ProjectDeleteModal from '../../components/ProjectDeleteModal/ProjectDeleteModal.jsx';
import ProjectCreateModal from '../../components/ProjectCreateModal/ProjectCreateModal.jsx';
import ProjectAttachmentsModal from '../../components/ProjectAttachmentsModal/ProjectAttachmentsModal.jsx';
import VersionDeleteModal from '../../components/VersionDeleteModal/VersionDeleteModal.jsx';
import { apiFetch } from '../../lib/api.js';
import { toastError, toastInfo, toastSuccess } from '../../lib/toast.js';
import ProjectsPageHeader from './ProjectsPageHeader.jsx';
import ProjectsPageContent from './ProjectsPageContent.jsx';
import { buildFilteredProjects, downloadProjectsCsv, formatBytes, readFileAsDataUrl } from './projectsPageUtils.js';
import { createProjectRecord } from './projectsPageCreate.js';
import { STATUS_OPTIONS } from '../../constants/projectStatus';

function ProjectsPage({ isProjectsSection, searchQuery = '', onOpenDesigner, onProjectCreated, hideStatusControls = false, authToken = '', clients = [] }) {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === 'true';
  const [projectTotals] = useState(() => {
    try {
      const s = localStorage.getItem('projectTotals');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  const { projects, setProjects, isLoading, error } = useProjects({ apiEnabled, authToken });

  const handleOpen = (projectId) => onOpenDesigner(projectId, projects.find((p) => p.id === projectId)?.status);

  const [confirmProject, setConfirmProject] = useState(null);
  const [confirmVersion, setConfirmVersion] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [attachmentsProject, setAttachmentsProject] = useState(null);
  const [attachmentsByProject, setAttachmentsByProject] = useState({});
  const [versionsByProject, setVersionsByProject] = useState({});
  const [versionsOpenByProject, setVersionsOpenByProject] = useState({});
  const [versionsLoadingByProject, setVersionsLoadingByProject] = useState({});
  const [quickFilter, setQuickFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = useMemo(() => {
    return buildFilteredProjects({
      projects,
      searchQuery,
      attachmentsByProject,
      projectTotals,
      quickFilter,
      statusFilter,
    });
  }, [projects, searchQuery, attachmentsByProject, projectTotals, quickFilter, statusFilter]);

  const exportProjectsCsv = () => {
    downloadProjectsCsv({ filteredProjects, projectTotals });
  };

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
      toastError('No se pudieron cargar las versiones.');
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
      toastError('No se pudo duplicar la versión.');
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
      toastError('No se pudo eliminar la versión.');
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
      toastError('No se pudo renombrar la versión.');
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
      toastError('No se pudo renombrar el proyecto.');
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
      toastError('No se pudieron cargar los adjuntos.');
    }
  };

  const handleAddAttachments = async (files) => {
    if (!attachmentsProject) return;
    const maxSize = 5 * 1024 * 1024;
    const allowed = files.filter((file) => file.size <= maxSize);
    if (allowed.length !== files.length) {
      toastInfo('Algunos archivos superan 5MB y fueron omitidos.');
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
      toastSuccess('Adjuntos subidos correctamente.');
    } catch (error) {
      console.error('Failed to upload attachments', error);
      toastError('No se pudieron subir los adjuntos.');
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
        toastError('No se pudo eliminar el adjunto.');
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
      toastError('No se pudo abrir el adjunto.');
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
          toastError('No se pudo eliminar el proyecto en el servidor. Revirtiendo.');
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
        toastError('No se pudo actualizar el estado en el servidor. Revirtiendo.');
      }
    }
  };

  const handleCreateProject = async (payload) => {
    try {
      const { mode, createdProject, createdVersion } = await createProjectRecord({
        payload,
        apiEnabled,
        authToken,
      });

      if (mode === 'api') {
        setVersionsByProject((prev) => ({
          ...prev,
          [createdProject.id]: createdVersion ? [createdVersion] : [],
        }));
        setVersionsOpenByProject((prev) => ({ ...prev, [createdProject.id]: true }));
      }

      setProjects((prev) => [createdProject, ...prev]);
      onProjectCreated?.(createdProject);
      setIsCreateOpen(false);
      toastSuccess(mode === 'api' ? 'Proyecto creado correctamente.' : 'Proyecto creado en modo local.');
      return createdProject;
    } catch (err) {
      console.error('Failed to create project', err);
      toastError('No se pudo crear el proyecto en el servidor. ' + (err?.message || ''));
      throw err;
    }
  };

  if (!isProjectsSection) return null;

  return (
    <section className="projects">
      <ProjectsPageHeader
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onOpenCreate={() => setIsCreateOpen(true)}
        onExportCsv={exportProjectsCsv}
      />

      <ProjectsPageContent
        filteredProjects={filteredProjects}
        error={error}
        isLoading={isLoading}
        projectTotals={projectTotals}
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
