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

      <label>
        Producto
        <input
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Nombre del producto"
        />
      </label>

      <label>
        Fabricante
        <CustomSelect
          value={form.manufacturer || ""}
          options={manufacturerOptions}
          placeholder="Fabricante"
          onChange={(value) => onChange("manufacturer", value)}
        />
      </label>

      <label>
        Distribuidor
        <CustomSelect
          value={form.distributorId || ""}
          options={distributorOptions}
          placeholder="Distribuidor"
          onChange={(value) => onChange("distributorId", value)}
        />
      </label>

      <label>
        Serie fabricante
        <input
          value={form.serial || ""}
          onChange={(event) => onChange("serial", event.target.value)}
          placeholder="Número de serie"
        />
      </label>

      <label>
        Precio PVP (€)
        <input
          type="number"
          min="0"
          value={form.distributorPrice}
          onChange={(event) => onChange("distributorPrice", event.target.value)}
        />
      </label>

      <label>
        Descuento (%)
        <input
          type="number"
          min="0"
          value={form.discountPercent}
          onChange={(event) => onChange("discountPercent", event.target.value)}
        />
      </label>

      <label>
        Gastos envío (€)
        <input
          type="number"
          min="0"
          value={form.shippingCost}
          onChange={(event) => onChange("shippingCost", event.target.value)}
        />
      </label>

      <label>
        Tiempo entrega
        <input
          value={form.leadTime || ""}
          onChange={(event) => onChange("leadTime", event.target.value)}
          placeholder="Ej: 48h"
        />
      </label>

      <label>
        Precio final
        <input readOnly value={discountedPrice} />
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
