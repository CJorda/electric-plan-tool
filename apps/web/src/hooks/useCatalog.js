import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";

function useCatalog({ authToken = "" } = {}) {
  const apiEnabled = import.meta.env.VITE_API_ENABLED === "true";
  const authFetch = (url, options) => apiFetch(url, options, authToken);
  const [isLoading, setIsLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    category: "",
    name: "",
    manufacturer: "",
    distributorId: "",
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
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", parentId: "" });
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerForm, setProviderForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });
  const [manufacturers, setManufacturers] = useState([]);
  const [manufacturerForm, setManufacturerForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });

  const normalizeOptionalFields = (payload) => ({
    ...payload,
    contactName: payload.contactName?.trim() || null,
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    website: payload.website?.trim() || null,
    notes: payload.notes?.trim() || null,
  });
  const [margins, setMargins] = useState([]);
  const [marginForm, setMarginForm] = useState({ providerId: "", categoryId: "", marginPercent: 0 });
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({ name: "", description: "" });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateMargins, setTemplateMargins] = useState([]);
  const [templateMarginForm, setTemplateMarginForm] = useState({ categoryId: "", marginPercent: 0 });

  const categoryLabelMap = useMemo(() => {
    const map = new Map();
    const byId = new Map(categories.map((category) => [category.id, category]));
    const getLabel = (category, depth = 0) => {
      if (!category) return "";
      if (map.has(category.id)) return map.get(category.id);
      if (depth > 5) return category.name;
      if (!category.parentId) {
        map.set(category.id, category.name);
        return category.name;
      }
      const parent = byId.get(category.parentId);
      const parentLabel = parent ? getLabel(parent, depth + 1) : "";
      const label = parentLabel ? `${parentLabel} / ${category.name}` : category.name;
      map.set(category.id, label);
      return label;
    };
    categories.forEach((category) => getLabel(category));
    return map;
  }, [categories]);

  const productCategoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        name: category.name,
        label: categoryLabelMap.get(category.id) || category.name,
      })),
    [categories, categoryLabelMap]
  );

  const productCategoryNames = useMemo(
    () => productCategoryOptions.map((option) => option.name),
    [productCategoryOptions]
  );

  const handleAddProvider = async () => {
    if (!providerForm.name.trim()) return;
    if (!apiEnabled) {
      setProviders((prev) => [{ id: crypto.randomUUID(), ...providerForm }, ...prev]);
      setProviderForm({ name: "", contactName: "", email: "", phone: "", website: "", notes: "" });
      return;
    }
    try {
      const payload = normalizeOptionalFields(providerForm);
      const response = await authFetch("/api/catalog/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error creando proveedor (${response.status})`);
      }
      const created = await response.json();
      setProviders((prev) => [created, ...prev]);
      setProviderForm({ name: "", contactName: "", email: "", phone: "", website: "", notes: "" });
    } catch (error) {
      alert(error?.message || "No se pudo crear el proveedor.");
    }
  };

  const updateProvider = async (providerId, updates) => {
    const current = providers.find((provider) => provider.id === providerId);
    const nextProvider = { ...current, ...updates };
    if (!apiEnabled) {
      setProviders((prev) =>
        prev.map((provider) =>
          provider.id === providerId ? { ...provider, ...nextProvider } : provider
        )
      );
      return;
    }
    try {
      const payload = normalizeOptionalFields(nextProvider);
      const response = await authFetch(`/api/catalog/providers/${providerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error actualizando distribuidor (${response.status})`);
      }
      const updated = await response.json();
      setProviders((prev) =>
        prev.map((provider) => (provider.id === providerId ? updated : provider))
      );
    } catch (error) {
      alert(error?.message || "No se pudo actualizar el distribuidor.");
    }
  };

  const deleteProvider = async (providerId) => {
    if (!apiEnabled) {
      setProviders((prev) => prev.filter((provider) => provider.id !== providerId));
      return;
    }
    try {
      const response = await authFetch(`/api/catalog/providers/${providerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error eliminando distribuidor (${response.status})`);
      }
      setProviders((prev) => prev.filter((provider) => provider.id !== providerId));
    } catch (error) {
      alert(error?.message || "No se pudo eliminar el distribuidor.");
    }
  };

  const handleAddManufacturer = async () => {
    if (!manufacturerForm.name.trim()) return;
    if (!apiEnabled) {
      setManufacturers((prev) => [
        { id: crypto.randomUUID(), ...manufacturerForm },
        ...prev,
      ]);
      setManufacturerForm({ name: "", contactName: "", email: "", phone: "", website: "", notes: "" });
      return;
    }
    try {
      const payload = normalizeOptionalFields(manufacturerForm);
      const response = await authFetch("/api/catalog/manufacturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error creando fabricante (${response.status})`);
      }
      const created = await response.json();
      setManufacturers((prev) => [created, ...prev]);
      setManufacturerForm({ name: "", contactName: "", email: "", phone: "", website: "", notes: "" });
    } catch (error) {
      alert(error?.message || "No se pudo crear el fabricante.");
    }
  };

  const updateManufacturer = async (manufacturerId, updates) => {
    const current = manufacturers.find((manufacturer) => manufacturer.id === manufacturerId);
    const nextManufacturer = { ...current, ...updates };
    if (!apiEnabled) {
      setManufacturers((prev) =>
        prev.map((manufacturer) =>
          manufacturer.id === manufacturerId ? { ...manufacturer, ...nextManufacturer } : manufacturer
        )
      );
      return;
    }
    try {
      const payload = normalizeOptionalFields(nextManufacturer);
      const response = await authFetch(`/api/catalog/manufacturers/${manufacturerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error actualizando fabricante (${response.status})`);
      }
      const updated = await response.json();
      setManufacturers((prev) =>
        prev.map((manufacturer) => (manufacturer.id === manufacturerId ? updated : manufacturer))
      );
    } catch (error) {
      alert(error?.message || "No se pudo actualizar el fabricante.");
    }
  };

  const deleteManufacturer = async (manufacturerId) => {
    if (!apiEnabled) {
      setManufacturers((prev) => prev.filter((manufacturer) => manufacturer.id !== manufacturerId));
      return;
    }
    try {
      const response = await authFetch(`/api/catalog/manufacturers/${manufacturerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error eliminando fabricante (${response.status})`);
      }
      setManufacturers((prev) => prev.filter((manufacturer) => manufacturer.id !== manufacturerId));
    } catch (error) {
      alert(error?.message || "No se pudo eliminar el fabricante.");
    }
  };

  const handleAddMargin = async () => {
    const providerId = marginForm.providerId;
    const categoryId = marginForm.categoryId;
    const marginPercent = Number(marginForm.marginPercent) || 0;
    if (!providerId || !categoryId) return;
    if (!apiEnabled) {
      const provider = providers.find((p) => p.id === providerId);
      const category = categories.find((c) => c.id === categoryId);
      setMargins((prev) => [
        {
          id: crypto.randomUUID(),
          providerId,
          providerName: provider?.name || "",
          categoryId,
          categoryName: category?.name || "",
          marginPercent,
        },
        ...prev,
      ]);
      return;
    }
    try {
      const response = await authFetch("/api/catalog/margins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, categoryId, marginPercent }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error guardando margen (${response.status})`);
      }
      await loadMargins();
    } catch (error) {
      alert(error?.message || "No se pudo guardar el margen.");
    }
  };

  const deleteMargin = async (marginId) => {
    if (!apiEnabled) {
      setMargins((prev) => prev.filter((m) => m.id !== marginId));
      return;
    }
    try {
      const response = await authFetch(`/api/catalog/margins/${marginId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando margen");
      setMargins((prev) => prev.filter((m) => m.id !== marginId));
    } catch {
      // ignore
    }
  };

  const handleAddTemplate = async () => {
    if (!templateForm.name.trim()) return;
    if (!apiEnabled) {
      const created = { id: crypto.randomUUID(), name: templateForm.name, description: templateForm.description || "" };
      setTemplates((prev) => [created, ...prev]);
      setTemplateForm({ name: "", description: "" });
      setSelectedTemplateId(created.id);
      return;
    }
    try {
      const response = await authFetch("/api/catalog/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateForm.name, description: templateForm.description }),
      });
      if (!response.ok) throw new Error("Error creando plantilla");
      const created = await response.json();
      setTemplates((prev) => [created, ...prev]);
      setTemplateForm({ name: "", description: "" });
      setSelectedTemplateId(created.id);
    } catch {
      // ignore
    }
  };

  const handleAddTemplateMargin = async () => {
    if (!selectedTemplateId || !templateMarginForm.categoryId) return;
    const marginPercent = Number(templateMarginForm.marginPercent) || 0;
    if (!apiEnabled) {
      const category = categories.find((c) => c.id === templateMarginForm.categoryId);
      setTemplateMargins((prev) => [
        {
          id: crypto.randomUUID(),
          categoryId: templateMarginForm.categoryId,
          categoryName: category?.name || "",
          marginPercent,
        },
        ...prev,
      ]);
      return;
    }
    try {
      const response = await authFetch(`/api/catalog/templates/${selectedTemplateId}/margins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: templateMarginForm.categoryId, marginPercent }),
      });
      if (!response.ok) throw new Error("Error guardando margen");
      await loadTemplateMargins(selectedTemplateId);
    } catch {
      // ignore
    }
  };

  const deleteTemplateMargin = async (marginId) => {
    if (!apiEnabled) {
      setTemplateMargins((prev) => prev.filter((m) => m.id !== marginId));
      return;
    }
    try {
      const response = await authFetch(`/api/catalog/templates/${selectedTemplateId}/margins/${marginId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error eliminando margen");
      setTemplateMargins((prev) => prev.filter((m) => m.id !== marginId));
    } catch {
      // ignore
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    if (!apiEnabled) {
      setCategories((prev) => [
        {
          id: crypto.randomUUID(),
          name: categoryForm.name,
          description: categoryForm.description,
          parentId: categoryForm.parentId || null,
        },
        ...prev,
      ]);
      setCategoryForm({ name: "", description: "", parentId: "" });
      return;
    }
    try {
      const response = await authFetch("/api/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
          parentId: categoryForm.parentId || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error creando categoría (${response.status})`);
      }
      const created = await response.json();
      setCategories((prev) => [created, ...prev]);
      setCategoryForm({ name: "", description: "", parentId: "" });
    } catch (error) {
      alert(error?.message || "No se pudo crear la categoría.");
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
      const response = await authFetch(`/api/catalog/categories/${categoryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nextCategory.name,
            description: nextCategory.description,
            parentId: nextCategory.parentId || null,
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
      const response = await authFetch(`/api/catalog/categories/${categoryId}`, {
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
      manufacturer: productForm.manufacturer,
      distributorId: productForm.distributorId,
      serial: productForm.serial,
      distributorPrice,
      discountPercent,
      discountPrice,
      shippingCost: Number(productForm.shippingCost) || 0,
      leadTime: productForm.leadTime,
    };
    if (!apiEnabled) {
      const distributorName = providers.find((provider) => provider.id === payload.distributorId)?.name || "";
      const created = { id: crypto.randomUUID(), ...payload, distributorName };
      setProducts((prev) => [created, ...prev]);
      setProductForm({
        category: productForm.category,
        name: "",
        manufacturer: "",
        distributorId: "",
        serial: "",
        distributorPrice: 0,
        discountPercent: 0,
        discountPrice: 0,
        shippingCost: 0,
        leadTime: "",
      });
      return created;
    }
    try {
      const response = await authFetch("/api/catalog/products", {
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
        manufacturer: "",
        distributorId: "",
        serial: "",
        distributorPrice: 0,
        discountPercent: 0,
        discountPrice: 0,
        shippingCost: 0,
        leadTime: "",
      });
      return { ...created, discountPercent: percent };
    } catch {
      // ignore
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Error leyendo archivo"));
      reader.readAsDataURL(file);
    });

  const uploadProductImage = async (productId, file) => {
    if (!apiEnabled || !file) return null;
    const dataUrl = await fileToDataUrl(file);
    const response = await authFetch(`/api/catalog/products/${productId}/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataUrl,
        type: file.type,
        name: file.name,
        size: file.size,
      }),
    });
    if (!response.ok) throw new Error("Error subiendo imagen");
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, hasImage: true } : product
      )
    );
    return true;
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
    if (updates.distributorId !== undefined) {
      const distributorName =
        providers.find((provider) => provider.id === updates.distributorId)?.name || "";
      nextProduct.distributorName = distributorName;
    }
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
      const response = await authFetch(`/api/catalog/products/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: nextProduct.category,
            name: nextProduct.name,
            manufacturer: nextProduct.manufacturer,
            distributorId: nextProduct.distributorId,
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

  const deleteProduct = async (productId) => {
    if (!apiEnabled) {
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      return;
    }
    try {
      const response = await authFetch(`/api/catalog/products/${productId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando producto");
      setProducts((prev) => prev.filter((product) => product.id !== productId));
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
    productCategoryNames.forEach((category) => groups.set(category, []));
    sortedProducts.forEach((product) => {
      if (!groups.has(product.category)) {
        groups.set(product.category, []);
      }
      groups.get(product.category).push(product);
    });
    return Array.from(groups.entries())
      .filter(([, items]) => items.length > 0)
      .map(([categoryName, items]) => {
        const category = categories.find((c) => c.name === categoryName);
        const label = category
          ? categoryLabelMap.get(category.id) || categoryName
          : categoryName;
        return [label, items];
      });
  }, [productCategoryNames, sortedProducts, categories, categoryLabelMap]);

  const loadMargins = async () => {
    if (!apiEnabled) return;
    try {
      const res = await authFetch("/api/catalog/margins");
      if (res.ok) {
        const data = await res.json();
        setMargins(data.items || []);
      }
    } catch {
      // ignore
    }
  };

  const loadTemplateMargins = async (templateId) => {
    if (!apiEnabled || !templateId) return;
    try {
      const res = await authFetch(`/api/catalog/templates/${templateId}/margins`);
      if (res.ok) {
        const data = await res.json();
        setTemplateMargins(data.items || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadCatalog = async () => {
      if (!apiEnabled) return;
      setIsLoading(true);
      try {
        const [categoriesRes, productsRes, providersRes, templatesRes, marginsRes, manufacturersRes] = await Promise.all([
          authFetch("/api/catalog/categories"),
          authFetch("/api/catalog/products"),
          authFetch("/api/catalog/providers"),
          authFetch("/api/catalog/templates"),
          authFetch("/api/catalog/margins"),
          authFetch("/api/catalog/manufacturers"),
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
        if (providersRes.ok) {
          const data = await providersRes.json();
          setProviders(data.items || []);
        }
        if (manufacturersRes.ok) {
          const data = await manufacturersRes.json();
          setManufacturers(data.items || []);
        }
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.items || []);
        }
        if (marginsRes.ok) {
          const data = await marginsRes.json();
          setMargins(data.items || []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalog();
  }, [apiEnabled, authToken]);

  useEffect(() => {
    if (!apiEnabled) return;
    if (selectedTemplateId) {
      loadTemplateMargins(selectedTemplateId);
    } else {
      setTemplateMargins([]);
    }
  }, [apiEnabled, selectedTemplateId, authToken]);

  useEffect(() => {
    if (!productCategoryNames.includes(productForm.category)) {
      setProductForm((prev) => ({
        ...prev,
        category: productCategoryNames[0] || "",
      }));
    }
    if (productCategoryFilter !== "Todas" && !productCategoryNames.includes(productCategoryFilter)) {
      setProductCategoryFilter("Todas");
    }
  }, [productCategoryNames, productForm.category, productCategoryFilter]);

  useEffect(() => {
    if (!marginForm.providerId && providers.length > 0) {
      setMarginForm((prev) => ({ ...prev, providerId: providers[0].id }));
    }
    if (!marginForm.categoryId && categories.length > 0) {
      setMarginForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
    if (!templateMarginForm.categoryId && categories.length > 0) {
      setTemplateMarginForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [providers, categories, marginForm.providerId, marginForm.categoryId, templateMarginForm.categoryId]);

  return {
    isLoading,
    productForm,
    setProductForm,
    products,
    productCategoryFilter,
    setProductCategoryFilter,
    productSort,
    categoryForm,
    setCategoryForm,
    categories,
    productCategoryOptions,
    groupedProducts,
    handleAddProduct,
    handleProductInputKeyDown,
    uploadProductImage,
    updateProduct,
    deleteProduct,
    handleSort,
    handleAddCategory,
    updateCategory,
    deleteCategory,
    providers,
    providerForm,
    setProviderForm,
    updateProvider,
    deleteProvider,
    manufacturers,
    manufacturerForm,
    setManufacturerForm,
    margins,
    marginForm,
    setMarginForm,
    handleAddProvider,
    handleAddManufacturer,
    updateManufacturer,
    deleteManufacturer,
    handleAddMargin,
    deleteMargin,
    templates,
    templateForm,
    setTemplateForm,
    selectedTemplateId,
    setSelectedTemplateId,
    templateMargins,
    templateMarginForm,
    setTemplateMarginForm,
    handleAddTemplate,
    handleAddTemplateMargin,
    deleteTemplateMargin,
    loadMargins,
  };
}

export default useCatalog;
