import "./CatalogPage.css";
import ProductsSection from "../../components/ProductsSection/ProductsSection.jsx";
import CategoriesSection from "../../components/CategoriesSection/CategoriesSection.jsx";

function CatalogPage({
  isProductsSection,
  isCategoriesSection,
  productCategories,
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
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  onUpdateCategory,
}) {
  return (
    <>
      {isProductsSection && (
        <ProductsSection
          categories={productCategories}
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
        />
      )}

      {isCategoriesSection && (
        <CategoriesSection
          categoryForm={categoryForm}
          onCategoryFormChange={onCategoryFormChange}
          onAddCategory={onAddCategory}
          categories={categories}
          onUpdateCategory={onUpdateCategory}
        />
      )}
    </>
  );
}

export default CatalogPage;
