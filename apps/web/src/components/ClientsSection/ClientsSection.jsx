import { useMemo, useState } from "react";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import "./ClientsSection.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const hasContent = (value) => normalizeText(value).length > 0;

export default function ClientsSection({
  clients,
  clientForm,
  onClientFormChange,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) {
  const [showValidation, setShowValidation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const isNameValid = clientForm.name.trim().length > 0;
  const isContactValid = clientForm.contactName.trim().length > 0;

  const filteredClients = useMemo(() => {
    const query = normalizeText(searchQuery);
    return clients.filter((client) => {
      const matchesQuery =
        !query ||
        [
          client.name,
          client.contactName,
          client.email,
          client.phone,
          client.address,
          client.notes,
        ].some((field) => normalizeText(field).includes(query));

      const matchesEmail =
        emailFilter === "all" ||
        (emailFilter === "with" ? hasContent(client.email) : !hasContent(client.email));

      const matchesPhone =
        phoneFilter === "all" ||
        (phoneFilter === "with" ? hasContent(client.phone) : !hasContent(client.phone));

      return matchesQuery && matchesEmail && matchesPhone;
    });
  }, [clients, searchQuery, emailFilter, phoneFilter]);

  const sortedClients = useMemo(() => {
    const next = [...filteredClients];
    if (sortBy === "nameAsc") {
      next.sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name), "es"));
    } else if (sortBy === "nameDesc") {
      next.sort((a, b) => normalizeText(b.name).localeCompare(normalizeText(a.name), "es"));
    } else if (sortBy === "contactAsc") {
      next.sort((a, b) => normalizeText(a.contactName).localeCompare(normalizeText(b.contactName), "es"));
    }
    return next;
  }, [filteredClients, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const pagedClients = sortedClients.slice(startIndex, startIndex + pageSize);
  const visibleStart = sortedClients.length === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + pagedClients.length, sortedClients.length);

  const handleAdd = () => {
    if (!isNameValid || !isContactValid) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    onAddClient();
  };

  return (
    <section className="clients">
      <div className="clients__header">
        <div>
          <h2>Clientes</h2>
          <p>Registra clientes y mantén sus datos de contacto actualizados.</p>
        </div>
        <button type="button" onClick={handleAdd}>Añadir cliente</button>
      </div>

      <div className="clients__tools" role="group" aria-label="Filtros de clientes">
        <label className="clients__tool clients__tool--search">
          <span>Buscar</span>
          <input
            type="search"
            placeholder="Nombre, contacto, email, teléfono..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
          />
        </label>

        <label className="clients__tool">
          <span>Email</span>
          <select
            value={emailFilter}
            onChange={(event) => {
              setEmailFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="with">Con email</option>
            <option value="without">Sin email</option>
          </select>
        </label>

        <label className="clients__tool">
          <span>Teléfono</span>
          <select
            value={phoneFilter}
            onChange={(event) => {
              setPhoneFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="with">Con teléfono</option>
            <option value="without">Sin teléfono</option>
          </select>
        </label>

        <label className="clients__tool">
          <span>Orden</span>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="recent">Recientes</option>
            <option value="nameAsc">Nombre A-Z</option>
            <option value="nameDesc">Nombre Z-A</option>
            <option value="contactAsc">Contacto A-Z</option>
          </select>
        </label>
      </div>

      <div className="clients__results">
        <span>
          Mostrando {visibleStart}-{visibleEnd} de {sortedClients.length}
        </span>
        <label className="clients__page-size">
          <span>Filas</span>
          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value) || 10);
              setCurrentPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="clients__table">
        <div className="clients__head">
          <span>Cliente</span>
          <span>Contacto</span>
          <span>Email</span>
          <span>Teléfono</span>
          <span>Dirección</span>
          <span>Notas</span>
          <span />
        </div>

        <div className="clients__row clients__row--new">
          <input
            placeholder="Nombre del cliente"
            className={showValidation && !isNameValid ? "clients__input--error" : ""}
            value={clientForm.name}
            onChange={(event) => {
              setShowValidation(false);
              onClientFormChange({ name: event.target.value });
            }}
          />
          <input
            placeholder="Contacto"
            className={showValidation && !isContactValid ? "clients__input--error" : ""}
            value={clientForm.contactName}
            onChange={(event) => {
              setShowValidation(false);
              onClientFormChange({ contactName: event.target.value });
            }}
          />
          <input
            placeholder="correo@empresa.com"
            value={clientForm.email}
            onChange={(event) => onClientFormChange({ email: event.target.value })}
          />
          <input
            placeholder="+34 600 000 000"
            value={clientForm.phone}
            onChange={(event) => onClientFormChange({ phone: event.target.value })}
          />
          <input
            placeholder="Dirección del cliente"
            value={clientForm.address}
            onChange={(event) => onClientFormChange({ address: event.target.value })}
          />
          <input
            placeholder="Notas"
            value={clientForm.notes}
            onChange={(event) => onClientFormChange({ notes: event.target.value })}
          />
          <span className="clients__hint">Completa y pulsa Añadir</span>
        </div>

        {clients.length === 0 ? (
          <div className="clients__empty">Aún no hay clientes registrados.</div>
        ) : pagedClients.length === 0 ? (
          <div className="clients__empty">No hay resultados con los filtros actuales.</div>
        ) : (
          pagedClients.map((client) => (
            <div key={client.id} className="clients__row">
              <input
                value={client.name}
                onChange={(event) => onUpdateClient(client.id, { name: event.target.value })}
              />
              <input
                value={client.contactName || ""}
                onChange={(event) => onUpdateClient(client.id, { contactName: event.target.value })}
              />
              <input
                value={client.email || ""}
                onChange={(event) => onUpdateClient(client.id, { email: event.target.value })}
              />
              <input
                value={client.phone || ""}
                onChange={(event) => onUpdateClient(client.id, { phone: event.target.value })}
              />
              <input
                value={client.address || ""}
                onChange={(event) => onUpdateClient(client.id, { address: event.target.value })}
              />
              <input
                value={client.notes || ""}
                onChange={(event) => onUpdateClient(client.id, { notes: event.target.value })}
              />
              <DeleteIconButton
                ariaLabel="Eliminar cliente"
                onClick={() => onDeleteClient(client.id)}
              />
            </div>
          ))
        )}
      </div>

      {sortedClients.length > 0 && (
        <div className="clients__pagination">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, effectivePage - 1))}
            disabled={effectivePage <= 1}
          >
            Anterior
          </button>
          <span>
            Página {effectivePage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, effectivePage + 1))}
            disabled={effectivePage >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
