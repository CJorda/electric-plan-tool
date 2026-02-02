import { useState } from "react";
import "./ClientsSection.css";

export default function ClientsSection({
  clients,
  clientForm,
  onClientFormChange,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) {
  const [showValidation, setShowValidation] = useState(false);
  const isNameValid = clientForm.name.trim().length > 0;
  const isContactValid = clientForm.contactName.trim().length > 0;

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
        ) : (
          clients.map((client) => (
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
              <button
                type="button"
                className="clients__delete"
                onClick={() => onDeleteClient(client.id)}
              >
                X
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
