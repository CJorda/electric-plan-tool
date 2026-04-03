import { useEffect, useMemo, useState } from "react";

export default function useProductsTreeState({
  categoryNodes = [],
  categories = [],
  sourceProducts = [],
}) {
  const [selectedNodeId, setSelectedNodeId] = useState("all");
  const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set());

  const categoriesById = useMemo(
    () => new Map(categoryNodes.map((category) => [category.id, category])),
    [categoryNodes]
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map();
    categoryNodes.forEach((category) => {
      const parentId = category.parentId || null;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId).push(category);
    });

    map.forEach((list) => {
      list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    });

    return map;
  }, [categoryNodes]);

  const rootNodes = useMemo(() => childrenByParentId.get(null) || [], [childrenByParentId]);

  useEffect(() => {
    if (rootNodes.length === 0) {
      setSelectedNodeId("all");
      return;
    }

    setExpandedNodeIds((prev) => {
      if (prev.size > 0) return prev;
      return new Set(rootNodes.map((node) => node.id));
    });

    setSelectedNodeId((prev) => {
      if (prev !== "all" && !categoriesById.has(prev)) {
        return "all";
      }
      return prev;
    });
  }, [rootNodes, categoriesById]);

  const descendantCategoryNamesById = useMemo(() => {
    const cache = new Map();

    const collect = (nodeId) => {
      if (cache.has(nodeId)) return cache.get(nodeId);

      const node = categoriesById.get(nodeId);
      const names = new Set();
      if (node?.name) {
        names.add(node.name);
      }

      const children = childrenByParentId.get(nodeId) || [];
      children.forEach((child) => {
        collect(child.id).forEach((name) => names.add(name));
      });

      cache.set(nodeId, names);
      return names;
    };

    categoryNodes.forEach((node) => collect(node.id));
    return cache;
  }, [categoryNodes, categoriesById, childrenByParentId]);

  const directCountByCategory = useMemo(() => {
    const map = new Map();
    sourceProducts.forEach((product) => {
      const key = product.category || "";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [sourceProducts]);

  const subtreeCountById = useMemo(() => {
    const map = new Map();
    categoryNodes.forEach((node) => {
      const names = descendantCategoryNamesById.get(node.id) || new Set();
      let total = 0;
      names.forEach((name) => {
        total += directCountByCategory.get(name) || 0;
      });
      map.set(node.id, total);
    });
    return map;
  }, [categoryNodes, descendantCategoryNamesById, directCountByCategory]);

  const visibleProducts = useMemo(() => {
    if (selectedNodeId === "all") return sourceProducts;
    const names = descendantCategoryNamesById.get(selectedNodeId);
    if (!names || names.size === 0) return [];
    return sourceProducts.filter((product) => names.has(product.category));
  }, [selectedNodeId, sourceProducts, descendantCategoryNamesById]);

  const selectedNodeLabel = useMemo(() => {
    if (selectedNodeId === "all") return "Todas las categorías";
    const node = categoriesById.get(selectedNodeId);
    if (!node) return "Todas las categorías";
    const option = categories.find((category) => category.name === node.name);
    return option?.label || node.name;
  }, [selectedNodeId, categoriesById, categories]);

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
    selectedNodeId,
    setSelectedNodeId,
    expandedNodeIds,
    toggleNode,
    categoriesById,
    childrenByParentId,
    rootNodes,
    subtreeCountById,
    visibleProducts,
    selectedNodeLabel,
  };
}
