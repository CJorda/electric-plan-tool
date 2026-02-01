import "./ManufacturersSection.css";

export default function ManufacturersSection({
  manufacturers,
  manufacturerForm,
  onManufacturerFormChange,
  onAddManufacturer,
  onUpdateManufacturer,
  onDeleteManufacturer,
}) {
  return (
    <section className="manufacturers">
      <div className="manufacturers__header">
        <div>
          <h2>Catálogo · Fabricantes</h2>
          <p>Define fabricantes y guarda sus datos de contacto.</p>
        </div>
        <button type="button" onClick={onAddManufacturer}>
          Añadir fabricante
        </button>
      </div>

      <div className="manufacturers__table">
        <div className="manufacturers__head">
          <span>Fabricante</span>
          <span>Contacto</span>
          <span>Email</span>
          <span>Teléfono</span>
          <span>Web</span>
          <span>Notas</span>
          <span />
        </div>

        <div className="manufacturers__row manufacturers__row--new">
          <input
            placeholder="Nombre"
            value={manufacturerForm.name}
            onChange={(event) => onManufacturerFormChange({ name: event.target.value })}
          />
          <input
            placeholder="Contacto"
            value={manufacturerForm.contactName}
            onChange={(event) => onManufacturerFormChange({ contactName: event.target.value })}
          />
          <input
            placeholder="correo@empresa.com"
            value={manufacturerForm.email}
            onChange={(event) => onManufacturerFormChange({ email: event.target.value })}
          />
          <input
            placeholder="+34 600 000 000"
            value={manufacturerForm.phone}
            onChange={(event) => onManufacturerFormChange({ phone: event.target.value })}
          />
          <input
            placeholder="https://"
            value={manufacturerForm.website}
            onChange={(event) => onManufacturerFormChange({ website: event.target.value })}
          />
          <input
            placeholder="Notas"
            value={manufacturerForm.notes}
            onChange={(event) => onManufacturerFormChange({ notes: event.target.value })}
          />
          <span className="manufacturers__hint">Completa y pulsa Añadir</span>
        </div>

        {manufacturers.length === 0 ? (
          <div className="manufacturers__empty">Aún no hay fabricantes registrados.</div>
        ) : (
          manufacturers.map((manufacturer) => (
            <div key={manufacturer.id} className="manufacturers__row">
              <input
                value={manufacturer.name}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { name: event.target.value })
                }
              />
              <input
                value={manufacturer.contactName || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { contactName: event.target.value })
                }
              />
              <input
                value={manufacturer.email || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { email: event.target.value })
                }
              />
              <input
                value={manufacturer.phone || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { phone: event.target.value })
                }
              />
              <input
                value={manufacturer.website || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { website: event.target.value })
                }
              />
              <input
                value={manufacturer.notes || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { notes: event.target.value })
                }
              />
              <button
                type="button"
                className="manufacturers__delete"
                onClick={() => onDeleteManufacturer(manufacturer.id)}
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
