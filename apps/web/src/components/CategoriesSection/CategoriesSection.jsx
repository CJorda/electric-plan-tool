import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import CategoryCreateCard from "./CategoryCreateCard.jsx";
import CategoryDeleteModal from "./CategoryDeleteModal.jsx";
import CategoryDetailCard from "./CategoryDetailCard.jsx";
import CategoriesTreePanel from "./CategoriesTreePanel.jsx";
import useCategoriesTreeState from "./useCategoriesTreeState.js";
import "./CategoriesSection.css";

function CategoriesSection({
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  categories,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    expandedNodeIds,
    toggleNode,
    categoryMeta,
    selectedCategory,
    parentOptions,
    buildParentOptionsForCategory,
    canSaveCategory,
    isNameSameAsParent,
    nextCategoryPath,
  } = useCategoriesTreeState({ categories, categoryForm });

  const handleSaveCategory = () => {
    if (!canSaveCategory) return;
    const payload = {
      name: categoryForm.name,
      description: categoryForm.description,
      parentId: categoryForm.parentId || "",
    };
    onCategoryFormChange(payload);
    onAddCategory();
  };

  const renderTreeNode = (category, depth = 0) => {
    const children = categoryMeta.childrenByParentId.get(category.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodeIds.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="categories__tree-node-wrap">
        <div className="categories__tree-row" style={{ paddingLeft: `${depth * 14}px` }}>
          <button
            type="button"
            className="categories__tree-toggle"
            onClick={() => hasChildren && toggleNode(category.id)}
            disabled={!hasChildren}
            aria-label={hasChildren ? (isExpanded ? "Contraer" : "Expandir") : "Sin hijos"}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="categories__tree-toggle-spacer" />
            )}
          </button>
          <button
            type="button"
            className={`categories__tree-node ${isSelected ? "is-active" : ""}`}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            <span>{category.name}</span>
            <span className="categories__tree-count">{children.length}</span>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="categories__tree-children">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="products categories">
      <div className="products__header">
        <div>
          <h2>Catálogo · Categorías</h2>
          <p>Gestiona categorías en forma de árbol y edita su jerarquía.</p>
        </div>
        <div className="products__controls products__controls--right">
          <button className="categories__action" type="button" onClick={handleSaveCategory} disabled={!canSaveCategory}>
            Añadir categoría
          </button>
        </div>
      </div>

      <div className="categories__layout">
        <CategoriesTreePanel
          selectedCategoryId={selectedCategoryId}
          categoriesCount={categories.length}
          rootCategories={categoryMeta.rootCategories}
          renderTreeNode={renderTreeNode}
          onSelectAll={() => setSelectedCategoryId("")}
        />

        <div className="categories__editor">
          <CategoryCreateCard
            categoryForm={categoryForm}
            parentOptions={parentOptions}
            nextCategoryPath={nextCategoryPath}
            selectedCategory={selectedCategory}
            isNameSameAsParent={isNameSameAsParent}
            onCategoryFormChange={onCategoryFormChange}
          />

          <CategoryDetailCard
            selectedCategory={selectedCategory}
            depthById={categoryMeta.depthById}
            pathById={categoryMeta.pathById}
            buildParentOptionsForCategory={buildParentOptionsForCategory}
            onUpdateCategory={onUpdateCategory}
            onRequestDelete={setDeleteCandidate}
          />
        </div>
      </div>

      <CategoryDeleteModal
        open={Boolean(deleteCandidate)}
        categoryName={deleteCandidate?.name}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            onDeleteCategory(deleteCandidate.id);
          }
          setDeleteCandidate(null);
        }}
      />
    </section>
  );
}

export default CategoriesSection;
