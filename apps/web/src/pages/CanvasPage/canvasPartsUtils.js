export const buildGroupedRows = (boxes, devices) => {
  const groups = boxes.map((box) => ({
    boxId: box.id,
    boxName: box.name,
    items: box.components.map((component) => ({
      boxId: box.id,
      boxName: box.name,
      type: "component",
      ...component,
    })),
  }));

  if (devices.length > 0) {
    groups.push({
      boxId: "devices",
      boxName: "Cámaras",
      items: devices.map((device) => ({
        id: device.id,
        boxId: "devices",
        boxName: "Cámaras",
        type: "device",
        category: device.category || "Cámaras",
        model: device.model || device.name || "Cámara",
        quantity: 1,
        unitPrice: Number(device.unitPrice) || 0,
        customerDiscountPercent: Number(device.customerDiscountPercent) || 0,
        discountApplied: Boolean(device.discountApplied),
        productActive: device.productActive !== false,
        total: Number(device.total) || Number(device.unitPrice) || 0,
      })),
    });
  }

  return groups;
};

export const getDiscountedUnitPrice = (component) => {
  const base = Number(component.unitPrice) || 0;
  let percent = Number(component.customerDiscountPercent) || 0;
  percent = Math.max(0, Math.min(100, percent));
  if (base <= 0) return 0;
  return Math.max(0, base * (1 - percent / 100));
};

const buildBomRows = (groupedRows) => {
  const rows = [];
  groupedRows.forEach((group) => {
    group.items.forEach((item) => {
      const unitPrice = Number(item.unitPrice) || 0;
      const percent = Number(item.customerDiscountPercent) || 0;
      const discountApplied = Boolean(item.discountApplied);
      const discountedUnit = discountApplied ? Math.max(0, unitPrice * (1 - percent / 100)) : unitPrice;
      const quantity = Number(item.quantity) || 1;
      const total = Number(item.total || discountedUnit * quantity) || 0;
      rows.push({
        boxId: group.boxId,
        boxName: group.boxName,
        category: item.category || group.boxName || "",
        model: item.model || item.name || "",
        quantity,
        unitPrice: unitPrice.toFixed(2),
        customerDiscountPercent: percent,
        discountApplied,
        unitPriceWithDiscount: discountedUnit.toFixed(2),
        total: Number(total).toFixed(2),
        type: item.type || "component",
      });
    });
  });
  return rows;
};

export const exportBomCsv = (groupedRows) => {
  const rows = buildBomRows(groupedRows);
  if (rows.length === 0) return;

  const header = [
    "Box ID",
    "Box Name",
    "Category",
    "Model",
    "Quantity",
    "Unit Price (€)",
    "Customer Discount (%)",
    "Discount Applied",
    "Unit Price With Discount (€)",
    "Total (€)",
    "Type",
  ];

  const lines = [header.join(",")];
  rows.forEach((row) => {
    const cols = [
      row.boxId,
      (row.boxName || "").replace(/"/g, '""'),
      (row.category || "").replace(/"/g, '""'),
      (row.model || "").replace(/"/g, '""'),
      row.quantity,
      row.unitPrice,
      row.customerDiscountPercent,
      row.discountApplied ? "YES" : "NO",
      row.unitPriceWithDiscount,
      row.total,
      row.type,
    ];
    const safe = cols.map((value) =>
      typeof value === "string" && value.includes(",") ? `"${value}"` : value
    );
    lines.push(safe.join(","));
  });

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.download = `bom-${now}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
