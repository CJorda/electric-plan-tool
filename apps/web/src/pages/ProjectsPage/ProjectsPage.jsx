import { useEffect, useState } from "react";
import "./ProjectsPage.css";

const PROJECT_TYPES = ["Cuadro eléctrico", "PLC", "Variador", "Instalación", "Otro"];

function ProjectsPage({ isProjectsSection, activeSubsection, onOpenDesigner, onProjectCreated }) {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === "true";
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [projectName, setProjectName] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  const addLocalProject = ({ name, type, notes }) => {
    const localProject = {
      id: `local-${crypto.randomUUID()}`,
      name,
      type,
      notes,
      status: "local",
      created_at: new Date().toISOString(),
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
    const payload = {
      name: projectName.trim(),
      type: projectType,
      notes: projectNotes.trim(),
    };
    if (!apiEnabled) {
      addLocalProject(payload);
      setProjectName("");
      setProjectNotes("");
      onProjectCreated();
      onOpenDesigner();
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
      onProjectCreated();
      onOpenDesigner();
    } catch (err) {
      setError("API no disponible. Proyecto guardado localmente.");
      addLocalProject(payload);
      setProjectName("");
      setProjectNotes("");
      onProjectCreated();
      onOpenDesigner();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isProjectsSection) return null;

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
                  <div>
                    <strong>{project.name}</strong>
                    <div className="projects__meta">
                      {project.type} · {project.status === "local" ? "local" : project.status}
                    </div>
                  </div>
                  <button className="projects__action" type="button" onClick={onOpenDesigner}>
                    Abrir editor
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="projects__action" type="button" onClick={onOpenDesigner}>
            Abrir editor
          </button>
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
            <select value={projectType} onChange={(event) => setProjectType(event.target.value)}>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
    </section>
  );
}

export default ProjectsPage;
