import { useEffect, useMemo, useState } from "react";

function useCatalog() {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === "true";
  const [productForm, setProductForm] = useState({
    category: "",
    name: "",
    serial: "",
    distributorPrice: 0,
    discountPercent: 0,
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

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    if (!apiEnabled) {
      setCategories((prev) => [
        { id: crypto.randomUUID(), name: categoryForm.name, description: categoryForm.description },
        ...prev,
      ]);
      setCategoryForm({ name: "", description: "" });
      return;
    }
    try {
      const response = await fetch("/api/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryForm.name, description: categoryForm.description }),
      });
      if (!response.ok) throw new Error("Error creando categoría");
      const created = await response.json();
      setCategories((prev) => [created, ...prev]);
      setCategoryForm({ name: "", description: "" });
    } catch {
      // ignore
    }
  };

  const updateCategory = async (categoryId, updates) => {
    const current = categories.find((category) => category.id === categoryId);
    const nextCategory = { ...current, ...updates };
    if (!apiEnabled) {
      setCategories((prev) => {
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
      return;
    }
    try {
      const response = await fetch(`/api/catalog/categories/${categoryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nextCategory.name,
            description: nextCategory.description,
          }),
        }
      );
      if (!response.ok) throw new Error("Error actualizando categoría");
      const updated = await response.json();
      setCategories((prev) =>
        prev.map((category) => (category.id === categoryId ? updated : category))
      );
      if (current && updated.name !== current.name) {
        setProducts((productsPrev) =>
          productsPrev.map((product) =>
            product.category === current.name
              ? { ...product, category: updated.name }
              : product
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const deleteCategory = async (categoryId) => {
    const current = categories.find((category) => category.id === categoryId);
    if (!apiEnabled) {
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      if (current) {
        setProducts((prev) => prev.filter((product) => product.category !== current.name));
      }
      return;
    }
    try {
      const response = await fetch(`/api/catalog/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error eliminando categoría");
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      if (current) {
        setProducts((prev) => prev.filter((product) => product.category !== current.name));
      }
    } catch {
      // ignore
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim() || !productForm.category) return;
    const distributorPrice = Number(productForm.distributorPrice) || 0;
    const discountPercent = Number(productForm.discountPercent) || 0;
    const discountPrice = Math.max(0, distributorPrice * (1 - discountPercent / 100));
    const payload = {
      category: productForm.category,
      name: productForm.name,
      serial: productForm.serial,
      distributorPrice,
      discountPercent,
      discountPrice,
      shippingCost: Number(productForm.shippingCost) || 0,
      leadTime: productForm.leadTime,
    };
    if (!apiEnabled) {
      setProducts((prev) => [{ id: crypto.randomUUID(), ...payload }, ...prev]);
      setProductForm({
        category: productForm.category,
        name: "",
        serial: "",
        distributorPrice: 0,
        discountPercent: 0,
        discountPrice: 0,
        shippingCost: 0,
        leadTime: "",
      });
      return;
    }
    try {
      const response = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error creando producto");
      const created = await response.json();
      const percent = created.distributorPrice
        ? Math.max(0, ((created.distributorPrice - created.discountPrice) / created.distributorPrice) * 100)
        : 0;
      setProducts((prev) => [{ ...created, discountPercent: percent }, ...prev]);
      setProductForm({
        category: productForm.category,
        name: "",
        serial: "",
        distributorPrice: 0,
        discountPercent: 0,
        discountPrice: 0,
        shippingCost: 0,
        leadTime: "",
      });
    } catch {
      // ignore
    }
  };

  const handleProductInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddProduct();
    }
  };

  const updateProduct = async (productId, updates) => {
    const current = products.find((product) => product.id === productId);
    const nextProduct = { ...current, ...updates };
    if (updates.distributorPrice !== undefined || updates.discountPercent !== undefined) {
      const base = Number(nextProduct.distributorPrice) || 0;
      const percent = Number(nextProduct.discountPercent) || 0;
      nextProduct.discountPrice = Math.max(0, base * (1 - percent / 100));
    }
    if (!apiEnabled) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, ...nextProduct } : product
        )
      );
      return;
    }
    try {
      const response = await fetch(`/api/catalog/products/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: nextProduct.category,
            name: nextProduct.name,
            serial: nextProduct.serial,
            distributorPrice: Number(nextProduct.distributorPrice) || 0,
            discountPrice: Number(nextProduct.discountPrice) || 0,
            shippingCost: Number(nextProduct.shippingCost) || 0,
            leadTime: nextProduct.leadTime,
          }),
        }
      );
      if (!response.ok) throw new Error("Error actualizando producto");
      const updated = await response.json();
      const percent = updated.distributorPrice
        ? Math.max(0, ((updated.distributorPrice - updated.discountPrice) / updated.distributorPrice) * 100)
        : 0;
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...updated, discountPercent: percent } : product
        )
      );
    } catch {
      // ignore
    }
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
      const valueA = key === "discountPercent" ? a.discountPercent ?? 0 : a[key];
      const valueB = key === "discountPercent" ? b.discountPercent ?? 0 : b[key];
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
    const loadCatalog = async () => {
      if (!apiEnabled) return;
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch("/api/catalog/categories"),
          fetch("/api/catalog/products"),
        ]);
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.items || []);
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          const items = (data.items || []).map((item) => {
            const base = Number(item.distributorPrice) || 0;
            const discount = Number(item.discountPrice) || 0;
            const percent = base > 0 ? Math.max(0, ((base - discount) / base) * 100) : 0;
            return { ...item, discountPercent: percent };
          });
          setProducts(items);
        }
      } catch {
        // ignore
      }
    };
    loadCatalog();
  }, [apiEnabled]);

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
    deleteCategory,
  };
}

export default useCatalog;
