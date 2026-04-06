import { memo } from "react";
import "./CatalogPage.css";
import CatalogContentSections from "./CatalogContentSections.jsx";
import CatalogLoadingState from "./CatalogLoadingState.jsx";

function CatalogPage({
  isProductsSection,
  isCategoriesSection,
  isManufacturersSection,
  isProvidersSection,
  activeSubsection,
  isLoading = false,
  authToken,
  productCategoryOptions,
  categories,
  productCategoryFilter,
  onFilterChange,
  productForm,
  onProductFormChange,
  onAddProduct,
  onUploadProductImage,
  onProductInputKeyDown,
  groupedProducts,
  allSortedProducts,
  onSort,
  sortState,
  onUpdateProduct,
  onLoadProductPriceHistory,
  onCreateProductTariff,
  onDeleteProductTariffEntry,
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
}) {
  "use memo";

  const isProvidersCatalogSection =
    isProvidersSection || activeSubsection === "Proveedores y fabricantes";
  const isManufacturersCatalogSection = isManufacturersSection;
  const isCatalogUnifiedSection = isProductsSection || isCategoriesSection;
  const isActive =
    isCatalogUnifiedSection ||
    isProvidersCatalogSection ||
    isManufacturersCatalogSection;

  if (!isActive) return null;

  if (isLoading) {
    return (
      <CatalogLoadingState
        isCatalogUnifiedSection={isCatalogUnifiedSection}
        isProvidersSection={isProvidersCatalogSection}
        isManufacturersSection={isManufacturersCatalogSection}
      />
    );
  }

  return (
    <CatalogContentSections
      isCatalogUnifiedSection={isCatalogUnifiedSection}
      isProvidersSection={isProvidersCatalogSection}
      isManufacturersSection={isManufacturersCatalogSection}
      authToken={authToken}
      productCategoryOptions={productCategoryOptions}
      categories={categories}
      productCategoryFilter={productCategoryFilter}
      onFilterChange={onFilterChange}
      productForm={productForm}
      onProductFormChange={onProductFormChange}
      onAddProduct={onAddProduct}
      onUploadProductImage={onUploadProductImage}
      onProductInputKeyDown={onProductInputKeyDown}
      groupedProducts={groupedProducts}
      allSortedProducts={allSortedProducts}
      onSort={onSort}
      sortState={sortState}
      onUpdateProduct={onUpdateProduct}
      onLoadProductPriceHistory={onLoadProductPriceHistory}
      onCreateProductTariff={onCreateProductTariff}
      onDeleteProductTariffEntry={onDeleteProductTariffEntry}
      onDeleteProduct={onDeleteProduct}
      categoryForm={categoryForm}
      onCategoryFormChange={onCategoryFormChange}
      onAddCategory={onAddCategory}
      onUpdateCategory={onUpdateCategory}
      onDeleteCategory={onDeleteCategory}
      providers={providers}
      providerForm={providerForm}
      onProviderFormChange={onProviderFormChange}
      onAddProvider={onAddProvider}
      onUpdateProvider={onUpdateProvider}
      onDeleteProvider={onDeleteProvider}
      manufacturers={manufacturers}
      manufacturerForm={manufacturerForm}
      onManufacturerFormChange={onManufacturerFormChange}
      onAddManufacturer={onAddManufacturer}
      onUpdateManufacturer={onUpdateManufacturer}
      onDeleteManufacturer={onDeleteManufacturer}
    />
  );
}

export default memo(CatalogPage);
