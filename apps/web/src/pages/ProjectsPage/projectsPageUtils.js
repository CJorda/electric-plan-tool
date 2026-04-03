export const buildFilteredProjects = ({
  projects,
  searchQuery,
  attachmentsByProject,
  projectTotals,
  quickFilter,
  statusFilter,
}) => {
  const query = String(searchQuery || "").trim().toLowerCase();
  let items = [...projects];

  if (query) {
    items = items.filter((project) => {
      const searchable = [
        project.name,
        project.client,
        project.reference,
        project.address,
        project.type,
        project.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }

  if (statusFilter && statusFilter !== "all") {
    items = items.filter(
      (project) => String(project.status || "draft").toLowerCase() === statusFilter
    );
  }

  if (quickFilter === "with-attachments") {
    items = items.filter((project) => (attachmentsByProject[project.id]?.length || 0) > 0);
  }

  if (quickFilter === "cost-desc") {
    items = items.sort(
      (a, b) => Number(projectTotals[b.id] || 0) - Number(projectTotals[a.id] || 0)
    );
  }

  return items;
};

export const downloadProjectsCsv = ({ filteredProjects, projectTotals }) => {
  const rows = filteredProjects.map((project) => [
    project.name || "",
    project.client || "",
    project.reference || "",
    project.status || "",
    Number(projectTotals[project.id] || 0).toFixed(2),
  ]);

  const header = ["Proyecto", "Cliente", "Referencia", "Estado", "Total"];
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "proyectos.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const formatBytes = (value) => {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
