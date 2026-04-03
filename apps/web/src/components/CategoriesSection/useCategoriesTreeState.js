import { useEffect, useMemo, useState } from "react";

export default function useCategoriesTreeState({ categories = [], categoryForm }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set());

  const categoryMeta = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const childrenByParentId = new Map();

    categories.forEach((category) => {
      const parentId = category.parentId || null;
      if (!childrenByParentId.has(parentId)) {
        childrenByParentId.set(parentId, []);
      }
      childrenByParentId.get(parentId).push(category);
    });

    childrenByParentId.forEach((items) => {
      items.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    });

    const pathById = new Map();
    const depthById = new Map();
    const getPath = (categoryId, stack = new Set()) => {
      if (pathById.has(categoryId)) return pathById.get(categoryId);
      const category = byId.get(categoryId);
      if (!category) return "";
      if (stack.has(categoryId)) return category.name;

      const nextStack = new Set(stack);
      nextStack.add(categoryId);
      const parentPath = category.parentId ? getPath(category.parentId, nextStack) : "";
      const depth = category.parentId ? (depthById.get(category.parentId) || 0) + 1 : 0;
      const path = parentPath ? `${parentPath} / ${category.name}` : category.name;
      pathById.set(categoryId, path);
      depthById.set(categoryId, depth);
      return path;
    };

    categories.forEach((category) => {
      getPath(category.id);
    });

    const descendantsById = new Map();
    const collectDescendants = (categoryId) => {
      if (descendantsById.has(categoryId)) return descendantsById.get(categoryId);
      const descendants = new Set();
      const directChildren = childrenByParentId.get(categoryId) || [];
      directChildren.forEach((child) => {
        descendants.add(child.id);
        collectDescendants(child.id).forEach((nested) => descendants.add(nested));
      });
      descendantsById.set(categoryId, descendants);
      return descendants;
    };

    categories.forEach((category) => {
      collectDescendants(category.id);
    });

    const rootCategories = [...(childrenByParentId.get(null) || [])];

    return {
      byId,
      childrenByParentId,
      rootCategories,
      pathById,
      depthById,
      descendantsById,
    };
  }, [categories]);

  useEffect(() => {
    const rootIds = categoryMeta.rootCategories.map((category) => category.id);

    setExpandedNodeIds((prev) => {
      if (prev.size > 0) return prev;
      return new Set(rootIds);
    });

    setSelectedCategoryId((prev) => {
      if (prev && categoryMeta.byId.has(prev)) return prev;
      return rootIds[0] || "";
    });
  }, [categoryMeta]);

  const selectedCategory = selectedCategoryId
    ? categoryMeta.byId.get(selectedCategoryId) || null
    : null;

  const parentOptions = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const pathA = categoryMeta.pathById.get(a.id) || a.name;
      const pathB = categoryMeta.pathById.get(b.id) || b.name;
      return pathA.localeCompare(pathB, "es", { sensitivity: "base" });
    });

    return [
      { value: "", label: "Sin categoría padre (nivel raíz)" },
      ...sorted.map((category) => ({
        value: category.id,
        label: categoryMeta.pathById.get(category.id) || category.name,
      })),
    ];
  }, [categories, categoryMeta.pathById]);

  const buildParentOptionsForCategory = (categoryId) => {
    const invalidParentIds = new Set(categoryMeta.descendantsById.get(categoryId) || []);
    invalidParentIds.add(categoryId);

    return parentOptions.filter(
      (option) => option.value === "" || !invalidParentIds.has(option.value)
    );
  };

  const trimmedName = categoryForm.name.trim();
  const selectedParentName = categoryForm.parentId
    ? categoryMeta.byId.get(categoryForm.parentId)?.name || ""
    : "";
  const isNameSameAsParent =
    Boolean(selectedParentName) && trimmedName.toLowerCase() === selectedParentName.toLowerCase();
  const canSaveCategory = trimmedName.length > 0 && !isNameSameAsParent;
  const nextCategoryPath = categoryForm.parentId
    ? `${categoryMeta.pathById.get(categoryForm.parentId) || selectedParentName} / ${
        trimmedName || "Nueva categoría"
      }`
    : trimmedName || "Nueva categoría";

  const toggleNode = (nodeId) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return {
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
  };
}
