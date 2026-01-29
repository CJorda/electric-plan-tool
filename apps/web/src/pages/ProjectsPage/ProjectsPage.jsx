import { useState } from 'react';
import './ProjectsPage.css';
import ProjectList from '../../components/ProjectList/ProjectList.jsx';
import ProjectForm from '../../components/ProjectForm/ProjectForm.jsx';
import useProjects from '../../hooks/useProjects.js';
import ProjectDeleteModal from '../../components/ProjectDeleteModal/ProjectDeleteModal.jsx';

function ProjectsPage({ isProjectsSection, activeSubsection, onOpenDesigner, onProjectCreated, hideStatusControls = false }) {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === 'true';
  const [projectTotals, setProjectTotals] = useState(() => {
    try {
      const s = localStorage.getItem('projectTotals');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  const { projects, setProjects, isLoading, error, reload } = useProjects({ apiEnabled });

  const handleOpen = (projectId) => onOpenDesigner(projectId, projects.find((p) => p.id === projectId)?.status);

  const [confirmProject, setConfirmProject] = useState(null);

  const handleDelete = (project) => {
    // open confirmation modal
    setConfirmProject(project);
  };

  const performDelete = (project) => {
    if (!project) return;
    const prevProjects = projects;
    // optimistic update
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setConfirmProject(null);

    if (apiEnabled) {
      fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
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
        const res = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...project, status }),
        });
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
    if (apiEnabled) {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
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
        setProjects((prev) => [created, ...prev]);
        onProjectCreated?.(created);
        return created;
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
    return created;
  };

  if (!isProjectsSection) return null;

  const isList = activeSubsection === 'Listado';
  const isNew = activeSubsection === 'Nuevo';

  return (
    <section className="projects">
      <div className="projects__header">
        <div>
          <h2>Proyectos · {isNew ? 'Nuevo' : 'Listado'}</h2>
          <p>Organiza y gestiona tus proyectos eléctricos.</p>
        </div>
      </div>

      {isList && (
        <div className="projects__placeholder">
          <h3>Listado de proyectos</h3>
          <p>Aquí aparecerán los proyectos guardados y el historial reciente.</p>
          {isLoading && <p className="projects__status">Cargando proyectos...</p>}
          {error && <p className="projects__status projects__status--error">{error}</p>}
          {!isLoading && (
            <ProjectList
              projects={projects}
              totals={projectTotals}
              onOpen={handleOpen}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              hideStatusControls={hideStatusControls}
            />
          )}
        </div>
      )}

      {isNew && (
        <div className="projects__form">
          <h3>Crear proyecto</h3>
          <ProjectForm onCreate={handleCreateProject} />
        </div>
      )}

      <ProjectDeleteModal
        open={Boolean(confirmProject)}
        project={confirmProject}
        onCancel={() => setConfirmProject(null)}
        onConfirm={performDelete}
      />
    </section>
  );
}

export default ProjectsPage;
