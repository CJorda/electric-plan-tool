import { useEffect, useMemo, useState } from "react";

function useCatalog() {
  const [productForm, setProductForm] = useState({
    category: "",
    name: "",
    serial: "",
    distributorPrice: 0,
    discountPrice: 0,
    shippingCost: 0,
    leadTime: "",
  });
  const [products, setProducts] = useState([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState("Todas");
  const [productSort, setProductSort] = useState({ key: "name", direction: "asc" });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [categories, setCategories] = useState([]);

  const productCategories = useMemo(
    () => categories.map((category) => category.name),
    [categories]
  );

  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) return;
    setCategories((prev) => [
      { id: crypto.randomUUID(), name: categoryForm.name, description: categoryForm.description },
      ...prev,
    ]);
    setCategoryForm({ name: "", description: "" });
  };

  const updateCategory = (categoryId, updates) => {
    setCategories((prev) => {
      const current = prev.find((category) => category.id === categoryId);
      const next = prev.map((category) =>
        category.id === categoryId ? { ...category, ...updates } : category
      );
      if (current && updates.name && updates.name !== current.name) {
        setProducts((productsPrev) =>
          productsPrev.map((product) =>
            product.category === current.name
              ? { ...product, category: updates.name }
              : product
          )
        );
      }
      return next;
    });
  };

  const handleAddProduct = () => {
    if (!productForm.name.trim() || !productForm.category) return;
    setProducts((prev) => [
      {
        id: crypto.randomUUID(),
        category: productForm.category,
        name: productForm.name,
        serial: productForm.serial,
        distributorPrice: Number(productForm.distributorPrice) || 0,
        discountPrice: Number(productForm.discountPrice) || 0,
        shippingCost: Number(productForm.shippingCost) || 0,
        leadTime: productForm.leadTime,
      },
      ...prev,
    ]);
    setProductForm({
      category: productForm.category,
      name: "",
      serial: "",
      distributorPrice: 0,
      discountPrice: 0,
      shippingCost: 0,
      leadTime: "",
    });
  };

  const handleProductInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddProduct();
    }
  };

  const updateProduct = (productId, updates) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, ...updates } : product))
    );
  };

  const handleSort = (key) => {
    setProductSort((prev) => {
      const nextDirection = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction: nextDirection };
    });
  };

  const filteredProducts = useMemo(() => {
    if (productCategoryFilter === "Todas") return products;
    return products.filter((product) => product.category === productCategoryFilter);
  }, [productCategoryFilter, products]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    const { key, direction } = productSort;
    sorted.sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }
      return direction === "asc"
        ? String(valueA ?? "").localeCompare(String(valueB ?? ""))
        : String(valueB ?? "").localeCompare(String(valueA ?? ""));
    });
    return sorted;
  }, [filteredProducts, productSort]);

  const groupedProducts = useMemo(() => {
    const groups = new Map();
    productCategories.forEach((category) => groups.set(category, []));
    sortedProducts.forEach((product) => {
      if (!groups.has(product.category)) {
        groups.set(product.category, []);
      }
      groups.get(product.category).push(product);
    });
    return Array.from(groups.entries()).filter(([, items]) => items.length > 0);
  }, [productCategories, sortedProducts]);

  useEffect(() => {
    if (!productCategories.includes(productForm.category)) {
      setProductForm((prev) => ({
        ...prev,
        category: productCategories[0] || "",
      }));
    }
    if (productCategoryFilter !== "Todas" && !productCategories.includes(productCategoryFilter)) {
      setProductCategoryFilter("Todas");
    }
  }, [productCategories, productForm.category, productCategoryFilter]);

  return {
    productForm,
    setProductForm,
    products,
    productCategoryFilter,
    setProductCategoryFilter,
    productSort,
    categoryForm,
    setCategoryForm,
    categories,
    productCategories,
    groupedProducts,
    handleAddProduct,
    handleProductInputKeyDown,
    updateProduct,
    handleSort,
    handleAddCategory,
    updateCategory,
  };
}

export default useCatalog;
