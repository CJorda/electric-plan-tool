import CustomSelect from "../ui/CustomSelect";

export default function ProductFormFields({
  form,
  categoryOptions,
  manufacturerOptions,
  distributorOptions,
  imagePreview,
  discountedPrice,
  onChange,
  onImageChange,
  imageInputId = "product-image-input",
}) {
  return (
    <>
      <label>
        Categoría
        <CustomSelect
          value={form.category}
          options={categoryOptions}
          onChange={(value) => onChange("category", value)}
        />
      </label>

      <div className="products__drawer-inline-row products__drawer-inline-row--pair">
        <label className="products__drawer-inline-field">
          Producto
          <input
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Nombre del producto"
          />
        </label>

        <label className="products__drawer-inline-field">
          Serie fabricante
          <input
            value={form.serial || ""}
            onChange={(event) => onChange("serial", event.target.value)}
            placeholder="Número de serie"
          />
        </label>
      </div>

      <div className="products__drawer-inline-row products__drawer-inline-row--pair">
        <label className="products__drawer-inline-field">
          Fabricante
          <CustomSelect
            value={form.manufacturer || ""}
            options={manufacturerOptions}
            placeholder="Fabricante"
            onChange={(value) => onChange("manufacturer", value)}
          />
        </label>

        <label className="products__drawer-inline-field">
          Distribuidor
          <CustomSelect
            value={form.distributorId || ""}
            options={distributorOptions}
            placeholder="Distribuidor"
            onChange={(value) => onChange("distributorId", value)}
          />
        </label>
      </div>

      <div className="products__drawer-inline-row">
        <label className="products__drawer-inline-field">
          Precio PVP (€)
          <input
            type="number"
            min="0"
            value={form.distributorPrice}
            onChange={(event) => onChange("distributorPrice", event.target.value)}
          />
        </label>

        <label className="products__drawer-inline-field">
          Descuento (%)
          <input
            type="number"
            min="0"
            value={form.discountPercent}
            onChange={(event) => onChange("discountPercent", event.target.value)}
          />
        </label>

        <label className="products__drawer-inline-field">
          Gastos envío (€)
          <input
            type="number"
            min="0"
            value={form.shippingCost}
            onChange={(event) => onChange("shippingCost", event.target.value)}
          />
        </label>

        <label className="products__drawer-inline-field">
          Tiempo entrega
          <input
            value={form.leadTime || ""}
            onChange={(event) => onChange("leadTime", event.target.value)}
            placeholder="Ej: 48h"
          />
        </label>
      </div>

      <label className="products__drawer-derived-field">
        Precio final (calculado)
        <input
          className="products__drawer-derived-input"
          readOnly
          aria-readonly="true"
          value={discountedPrice}
          title="Este valor se calcula automáticamente a partir del PVP, descuento y gastos de envío"
        />
        <small className="products__drawer-derived-help">
          Se calcula automáticamente con PVP, descuento y gastos de envío.
        </small>
      </label>

      <label className="products__drawer-image" htmlFor={imageInputId}>
        Imagen
        <div className="products__drawer-image-box">
          {imagePreview ? (
            <img src={imagePreview} alt="Previsualización" className="products__drawer-image-preview" />
          ) : (
            <span>Sin imagen</span>
          )}
          <input
            id={imageInputId}
            type="file"
            accept="image/*"
            onChange={(event) => onImageChange(event.target.files?.[0] || null)}
          />
        </div>
      </label>
    </>
  );
}
