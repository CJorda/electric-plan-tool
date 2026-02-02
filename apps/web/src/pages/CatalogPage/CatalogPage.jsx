import "./CatalogPage.css";
import ProductsSection from "../../components/ProductsSection/ProductsSection.jsx";
import CategoriesSection from "../../components/CategoriesSection/CategoriesSection.jsx";
import MarginsSection from "../../components/MarginsSection/MarginsSection.jsx";
import TemplatesSection from "../../components/TemplatesSection/TemplatesSection.jsx";
import ManufacturersSection from "../../components/ManufacturersSection/ManufacturersSection.jsx";
import ProvidersSection from "../../components/ProvidersSection/ProvidersSection.jsx";

function CatalogPage({
  isProductsSection,
  isCategoriesSection,
  isMarginsSection,
  isTemplatesSection,
  isManufacturersSection,
  isProvidersSection,
  activeSubsection,
  onSubsectionChange,
  isLoading = false,
  productCategoryOptions,
  categories,
  productCategoryFilter,
  onFilterChange,
  productForm,
  onProductFormChange,
  onAddProduct,
  onProductInputKeyDown,
  groupedProducts,
  onSort,
  sortState,
  onUpdateProduct,
  onDeleteProduct,
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  providers,
  providerForm,
  onProviderFormChange,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  manufacturers,
  manufacturerForm,
  onManufacturerFormChange,
  onAddManufacturer,
  onUpdateManufacturer,
  onDeleteManufacturer,
  margins,
  marginForm,
  onMarginFormChange,
  onAddMargin,
  onDeleteMargin,
  templates,
  templateForm,
  onTemplateFormChange,
  onAddTemplate,
  selectedTemplateId,
  onSelectTemplate,
  templateMargins,
  templateMarginForm,
  onTemplateMarginFormChange,
  onAddTemplateMargin,
  onDeleteTemplateMargin,
}) {
  const isProvidersActive = isProvidersSection || activeSubsection === "Distribuidores";
  const isActive =
    isProductsSection ||
    isCategoriesSection ||
    isMarginsSection ||
    isTemplatesSection ||
    isManufacturersSection ||
    isProvidersActive;

  if (!isActive) return null;

  if (isLoading) {
    return (
      <section className="catalog">
        <div className="catalog__content">
          <div className="catalog__content-panel">
            {isProductsSection && (
              <section className="catalog__skeleton-section">
                <div className="catalog__skeleton-header">
                  <div className="catalog__skeleton-title skeleton" />
                  <div className="catalog__skeleton-subtitle skeleton" />
                </div>
                <div className="catalog__skeleton-controls">
                  <span className="catalog__skeleton-chip skeleton" />
                  <span className="catalog__skeleton-chip skeleton" />
                  <span className="catalog__skeleton-button skeleton" />
                </div>
                <div className="catalog__skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="catalog__skeleton-card skeleton" />
                  ))}
                </div>
              </section>
            )}

            {isCategoriesSection && (
              <section className="catalog__skeleton-section">
                <div className="catalog__skeleton-header">
                  <div className="catalog__skeleton-title skeleton" />
                  <div className="catalog__skeleton-subtitle skeleton" />
                </div>
                <div className="catalog__skeleton-grid">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="catalog__skeleton-row skeleton" />
                  ))}
                </div>
              </section>
            )}

            {isMarginsSection && (
              <section className="catalog__skeleton-section">
                <div className="catalog__skeleton-header">
                  <div className="catalog__skeleton-title skeleton" />
                  <div className="catalog__skeleton-subtitle skeleton" />
                </div>
                <div className="catalog__skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="catalog__skeleton-row skeleton" />
                  ))}
                </div>
              </section>
            )}

            {isTemplatesSection && (
              <section className="catalog__skeleton-section">
                <div className="catalog__skeleton-header">
                  <div className="catalog__skeleton-title skeleton" />
                  <div className="catalog__skeleton-subtitle skeleton" />
                </div>
                <div className="catalog__skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="catalog__skeleton-row skeleton" />
                  ))}
                </div>
              </section>
            )}

            {isProvidersActive && (
              <section className="catalog__skeleton-section">
                <div className="catalog__skeleton-header">
                  <div className="catalog__skeleton-title skeleton" />
                  <div className="catalog__skeleton-subtitle skeleton" />
                </div>
                <div className="catalog__skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="catalog__skeleton-row skeleton" />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog">
      <div className="catalog__content">
        {isManufacturersSection ? (
          <div className="catalog__content-panel">
            <ManufacturersSection
              manufacturers={manufacturers}
              manufacturerForm={manufacturerForm}
              onManufacturerFormChange={onManufacturerFormChange}
              onAddManufacturer={onAddManufacturer}
              onUpdateManufacturer={onUpdateManufacturer}
              onDeleteManufacturer={onDeleteManufacturer}
            />
          </div>
        ) : isProvidersActive ? (
          <div className="catalog__content-panel">
            <ProvidersSection
              providers={providers}
              providerForm={providerForm}
              onProviderFormChange={onProviderFormChange}
              onAddProvider={onAddProvider}
              onUpdateProvider={onUpdateProvider}
              onDeleteProvider={onDeleteProvider}
            />
          </div>
        ) : (
          <div className="catalog__content-panel">
            {isProductsSection && (
              <ProductsSection
                categories={productCategoryOptions}
                manufacturers={manufacturers}
                providers={providers}
                categoryFilter={productCategoryFilter}
                onFilterChange={onFilterChange}
                productForm={productForm}
                onProductFormChange={onProductFormChange}
                onAddProduct={onAddProduct}
                onProductInputKeyDown={onProductInputKeyDown}
                groupedProducts={groupedProducts}
                onSort={onSort}
                sortState={sortState}
                onUpdateProduct={onUpdateProduct}
                onDeleteProduct={onDeleteProduct}
              />
            )}

            {isCategoriesSection && (
              <CategoriesSection
                categoryForm={categoryForm}
                onCategoryFormChange={onCategoryFormChange}
                onAddCategory={onAddCategory}
                categories={categories}
                onUpdateCategory={onUpdateCategory}
                onDeleteCategory={onDeleteCategory}
              />
            )}

            {isMarginsSection && (
              <MarginsSection
                categories={categories}
                providers={providers}
                margins={margins}
                marginForm={marginForm}
                onMarginFormChange={onMarginFormChange}
                onAddMargin={onAddMargin}
                onDeleteMargin={onDeleteMargin}
              />
            )}

            {isTemplatesSection && (
              <TemplatesSection
                categories={categories}
                templates={templates}
                templateForm={templateForm}
                onTemplateFormChange={onTemplateFormChange}
                onAddTemplate={onAddTemplate}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={onSelectTemplate}
                templateMargins={templateMargins}
                templateMarginForm={templateMarginForm}
                onTemplateMarginFormChange={onTemplateMarginFormChange}
                onAddTemplateMargin={onAddTemplateMargin}
                onDeleteTemplateMargin={onDeleteTemplateMargin}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default CatalogPage;
