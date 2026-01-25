import { useEffect, useState } from "react";
import "./ProjectsPage.css";

function ProjectsPage({
  isProjectsSection,
  activeSubsection,
  onOpenDesigner,
  onProjectCreated,
}) {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === "true";
  const [projectType, setProjectType] = useState("General");
  const [projectName, setProjectName] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [projectDate, setProjectDate] = useState("");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectTotals, setProjectTotals] = useState(() => {
    try {
      const stored = localStorage.getItem("projectTotals");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const statusOptions = [
    { value: "draft", label: "borrador" },
    { value: "confirmed", label: "confirmado" },
    { value: "published", label: "publicado" },
    { value: "archived", label: "archivado" },
  ];

  const statusLabels = {
    draft: "borrador",
    confirmed: "confirmado",
    published: "publicado",
    archived: "archivado",
    local: "local",
  };

  const getNextStatus = (current) => {
    switch (current) {
      case "draft":
        return { next: "confirmed", label: "Confirmar" };
      case "confirmed":
        return { next: "published", label: "Publicar" };
      case "published":
        return { next: "archived", label: "Archivar" };
      case "archived":
        return { next: "draft", label: "Reactivar" };
      default:
        return null;
    }
  };

  const isList = activeSubsection === "Listado";
  const isNew = activeSubsection === "Nuevo";

  const readLocalProjects = () => {
    try {
      const stored = localStorage.getItem("projectsLocal");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const writeLocalProjects = (items) => {
    try {
      localStorage.setItem("projectsLocal", JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const removeLocalProject = (projectId) => {
    setProjects((prev) => {
      const next = prev.filter((project) => project.id !== projectId);
      writeLocalProjects(next);
      return next;
    });
  };

  const removeProjectTotal = (projectId) => {
    try {
      const stored = localStorage.getItem("projectTotals");
      const current = stored ? JSON.parse(stored) : {};
      delete current[projectId];
      localStorage.setItem("projectTotals", JSON.stringify(current));
      setProjectTotals(current);
    } catch {
      // ignore
    }
  };

  const addLocalProject = ({ name, type, notes, createdAt }) => {
    const localProject = {
      id: `local-${crypto.randomUUID()}`,
      name,
      type,
      notes,
      status: "local",
      created_at: createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => {
      const next = [localProject, ...prev];
      writeLocalProjects(next);
      return next;
    });
    return localProject;
  };

  const loadProjects = async () => {
    setIsLoading(true);
    setError("");
    if (!apiEnabled) {
      setProjects(readLocalProjects());
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Error al cargar proyectos");
      const data = await response.json();
      setProjects(data.items || []);
    } catch (err) {
      setError("API no disponible. Usando proyectos locales.");
      setProjects(readLocalProjects());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isProjectsSection) {
      const localProjects = readLocalProjects();
      if (localProjects.length > 0) {
        setProjects(localProjects);
      }
      try {
        const storedTotals = localStorage.getItem("projectTotals");
        setProjectTotals(storedTotals ? JSON.parse(storedTotals) : {});
      } catch {
        setProjectTotals({});
      }
      loadProjects();
    }
  }, [isProjectsSection]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }
    setIsLoading(true);
    setError("");
    const createdAt = projectDate ? new Date(projectDate).toISOString() : new Date().toISOString();
    const payload = {
      name: projectName.trim(),
      type: projectType,
      notes: projectNotes.trim(),
      createdAt,
    };
    if (!apiEnabled) {
      const localProject = addLocalProject(payload);
      setProjectName("");
      setProjectNotes("");
      setProjectDate("");
      onProjectCreated();
      onOpenDesigner(localProject.id);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error al crear proyecto");
      const created = await response.json();
      setProjects((prev) => [created, ...prev]);
      setProjectName("");
      setProjectNotes("");
      setProjectDate("");
      onProjectCreated();
      onOpenDesigner(created.id);
    } catch (err) {
      setError("API no disponible. Proyecto guardado localmente.");
      const localProject = addLocalProject(payload);
      setProjectName("");
      setProjectNotes("");
      setProjectDate("");
      onProjectCreated();
      onOpenDesigner(localProject.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteCandidate) return;
    const projectId = deleteCandidate.id;
    setError("");
    if (!apiEnabled || deleteCandidate.status === "local") {
      removeLocalProject(projectId);
      removeProjectTotal(projectId);
      setDeleteCandidate(null);
      return;
    }
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando proyecto");
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      removeProjectTotal(projectId);
    } catch (err) {
      setError("No se pudo eliminar el proyecto.");
    } finally {
      setDeleteCandidate(null);
    }
  };

  const handleUpdateStatus = async (project, status) => {
    if (!project || !status || project.status === status) return;
    if (project.status === "local") return;
    if (!apiEnabled) {
      setError("API no disponible para actualizar el estado.");
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          type: project.type,
          notes: project.notes ?? "",
          status,
        }),
      });
      if (!response.ok) throw new Error("Error actualizando estado");
      const updated = await response.json();
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
    } catch (err) {
      setError("No se pudo actualizar el estado.");
    }
  };

  if (!isProjectsSection) return null;

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };


  return (
    <section className="projects">
      <div className="projects__header">
        <div>
          <h2>Proyectos · {isNew ? "Nuevo" : "Listado"}</h2>
          <p>Organiza y gestiona tus proyectos eléctricos.</p>
        </div>
      </div>

      {isList && (
        <div className="projects__placeholder">
          <h3>Listado de proyectos</h3>
          <p>Aquí aparecerán los proyectos guardados y el historial reciente.</p>
          {isLoading && <p className="projects__status">Cargando proyectos...</p>}
          {error && <p className="projects__status projects__status--error">{error}</p>}
          {!isLoading && projects.length > 0 && (
            <div className="projects__list">
              {projects.map((project) => (
                <div key={project.id} className="projects__card">
                  <div className="projects__info">
                    <div className="projects__title-row">
                      <strong className="projects__name">{project.name}</strong>
                      <span className={`projects__status-pill projects__status-pill--${project.status}`}>
                        {statusLabels[project.status] ?? project.status}
                      </span>
                    </div>
                    <div className="projects__meta">
                      <span>{project.type}</span>
                      {project.created_at && <span>· Creado: {formatDate(project.created_at)}</span>}
                    </div>
                  </div>
                  <div className="projects__summary">
                    <span className="projects__badge" aria-label="Total estimado">
                      <span className="projects__badge-price">
                        €{Number(projectTotals[project.id] ?? 0).toFixed(2)}
                      </span>
                      <span className="projects__badge-label">Total estimado</span>
                    </span>
                  </div>
                  <div className="projects__actions">
                    {project.status !== "local" && (
                      <label className="projects__status-select">
                        Estado
                        <select
                          value={project.status}
                          onChange={(event) => handleUpdateStatus(project, event.target.value)}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <button
                      className="projects__action"
                      type="button"
                      onClick={() => onOpenDesigner(project.id)}
                    >
                      Abrir editor
                    </button>
                    <button
                      className="projects__danger"
                      type="button"
                      onClick={() => setDeleteCandidate(project)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isNew && (
        <div className="projects__form">
          <label className="projects__label">
            Nombre del proyecto
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Ej: Cuadro línea 3"
            />
          </label>
          <label className="projects__label">
            Tipo de proyecto
            <input
              value={projectType}
              onChange={(event) => setProjectType(event.target.value)}
              placeholder="Ej: CCM, distribución, PLC"
            />
          </label>
          <label className="projects__label">
            Fecha de creación
            <input type="date" value={projectDate} onChange={(event) => setProjectDate(event.target.value)} />
          </label>
          <label className="projects__label projects__label--full">
            Especificaciones básicas
            <textarea
              rows={4}
              value={projectNotes}
              onChange={(event) => setProjectNotes(event.target.value)}
              placeholder="Requisitos, tensiones, número de cuadros, etc."
            />
          </label>
          {error && <p className="projects__status projects__status--error">{error}</p>}
          <button className="projects__action" type="button" onClick={handleCreateProject} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear y abrir editor"}
          </button>
        </div>
      )}
      {deleteCandidate && (
        <div className="projects__modal-overlay" role="dialog" aria-modal="true">
          <div className="projects__modal">
            <h3>¿Eliminar proyecto?</h3>
            <p>
              Se eliminará <strong>{deleteCandidate.name}</strong> de forma permanente.
            </p>
            <div className="projects__modal-actions">
              <button className="projects__modal-cancel" type="button" onClick={() => setDeleteCandidate(null)}>
                Cancelar
              </button>
              <button className="projects__modal-confirm" type="button" onClick={handleDeleteProject}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProjectsPage;
