export async function buildQuotePdfBuffer(project, items = [], opts = {}) {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks = [];

  doc.on("data", (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  const colors = {
    ink: "#0f172a",
    text: "#1f2937",
    muted: "#64748b",
    line: "#dbe3ef",
    lineSoft: "#e9eff7",
    surface: "#f8fbff",
    surfaceStrong: "#edf4ff",
    accent: "#005fcc",
    accentSoft: "#dbeafe",
    white: "#ffffff",
  };

  const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
  const formatDate = (value = new Date()) => {
    try {
      return new Date(value).toLocaleDateString("es-ES");
    } catch {
      return new Date().toLocaleDateString("es-ES");
    }
  };
  const formatDateTime = (value = new Date()) => {
    try {
      return new Date(value).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return new Date().toLocaleString("es-ES");
    }
  };
  const getQty = (item) => Number(item.qty ?? item.quantity ?? 1);
  const getUnit = (item) => Number(item.unit ?? item.unitPrice ?? item.distributorPrice ?? 0);
  const getTotal = (item) => Number(item.total ?? getUnit(item) * getQty(item));
  const truncate = (value, max = 86) => {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  };

  const subtotal = items.reduce((sum, item) => sum + getTotal(item), 0);
  const taxes = Number(opts.taxes ?? 0);
  const total = subtotal + taxes;
  const verification = opts.verification || null;

  const left = doc.page.margins.left;
  const right = doc.page.margins.right;
  const contentWidth = doc.page.width - left - right;
  const contentTop = 92;
  const contentBottomOffset = 30;
  let pageNumber = 1;

  const pageBottom = () => doc.page.height - doc.page.margins.bottom - contentBottomOffset;

  const drawPageScaffold = () => {
    const width = doc.page.width;
    const footerTextY = doc.page.height - doc.page.margins.bottom - 14;
    const footerLineY = footerTextY - 6;

    doc.save();
    doc.rect(0, 0, width, 62).fill(colors.accent);
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(12).text("Electric Plan Tool", left, 19);
    doc.fillColor("#dbeafe").font("Helvetica").fontSize(9).text("Presupuesto técnico de proyecto", left, 35);
    doc
      .fillColor("#bfdbfe")
      .font("Helvetica")
      .fontSize(8.5)
      .text(`Página ${pageNumber}`, width - right - 78, 24, { width: 78, align: "right" });
    doc.restore();

    doc.save();
    doc.moveTo(left, footerLineY).lineTo(width - right, footerLineY).stroke(colors.line);
    doc
      .fillColor(colors.muted)
      .font("Helvetica")
      .fontSize(8.5)
      .text(
        "Documento generado automáticamente. Presupuesto válido por 30 días salvo revisión comercial.",
        left,
        footerTextY,
        { width: width - left - right, align: "center", lineBreak: false }
      );
    doc.restore();

    doc.y = contentTop;
  };

  const drawInfoCard = (x, y, width, title, rows) => {
    doc.save();
    doc.roundedRect(x, y, width, 126, 12).fill(colors.surface);
    doc.roundedRect(x, y, width, 126, 12).lineWidth(1).stroke(colors.line);
    doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(10).text(title, x + 12, y + 10);
    doc.restore();

    let rowY = y + 30;
    rows.forEach((row) => {
      doc.fillColor(colors.muted).font("Helvetica").fontSize(8.5).text(row.label, x + 12, rowY, { width: 90 });
      doc
        .fillColor(colors.text)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(truncate(row.value, 58), x + 98, rowY, { width: width - 110, align: "left" });
      rowY += 18;
    });
  };

  const drawTableHeader = (y) => {
    const table = {
      x: left,
      y,
      width: contentWidth,
      height: 28,
      columns: {
        index: { x: left + 10, width: 22 },
        description: { x: left + 38, width: contentWidth - 292 },
        qty: { x: left + contentWidth - 236, width: 58 },
        unit: { x: left + contentWidth - 168, width: 68 },
        total: { x: left + contentWidth - 90, width: 80 },
      },
    };

    doc.save();
    doc.roundedRect(table.x, table.y, table.width, table.height, 8).fill(colors.surfaceStrong);
    doc.roundedRect(table.x, table.y, table.width, table.height, 8).lineWidth(1).stroke(colors.line);
    doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(9);
    doc.text("#", table.columns.index.x, table.y + 9, { width: table.columns.index.width });
    doc.text("Concepto", table.columns.description.x, table.y + 9, { width: table.columns.description.width });
    doc.text("Cant.", table.columns.qty.x, table.y + 9, { width: table.columns.qty.width, align: "right" });
    doc.text("Unitario", table.columns.unit.x, table.y + 9, { width: table.columns.unit.width, align: "right" });
    doc.text("Importe", table.columns.total.x, table.y + 9, { width: table.columns.total.width, align: "right" });
    doc.restore();

    return table;
  };

  const addPageWithScaffold = () => {
    doc.addPage();
    pageNumber += 1;
    drawPageScaffold();
  };

  const ensureSpace = (requiredHeight) => {
    if (doc.y + requiredHeight <= pageBottom()) return;
    addPageWithScaffold();
  };

  drawPageScaffold();

  let cursorY = doc.y;
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(22).text("Presupuesto del proyecto", left, cursorY);
  cursorY += 26;
  doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(13).text(project.name || "Proyecto sin nombre", left, cursorY);
  cursorY += 18;
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9.5).text(`ID ${project.id}`, left, cursorY);
  cursorY += 14;
  doc.moveTo(left, cursorY).lineTo(left + contentWidth, cursorY).stroke(colors.line);
  cursorY += 14;

  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;

  drawInfoCard(left, cursorY, cardWidth, "Datos del proyecto", [
    { label: "Tipo", value: project.type || "Proyecto" },
    { label: "Estado", value: project.status || "draft" },
    { label: "Cliente", value: project.client || "No especificado" },
    { label: "Referencia", value: project.reference || "No especificada" },
    { label: "Dirección", value: project.address || "No especificada" },
  ]);

  drawInfoCard(left + cardWidth + cardGap, cursorY, cardWidth, "Resumen económico", [
    { label: "Fecha emisión", value: formatDate(new Date()) },
    { label: "Partidas", value: String(items.length) },
    { label: "Subtotal", value: formatCurrency(subtotal) },
    { label: "Impuestos", value: formatCurrency(taxes) },
    { label: "Total", value: formatCurrency(total) },
  ]);

  cursorY += 146;
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13).text("Partidas", left, cursorY);
  cursorY += 20;

  doc.y = cursorY;
  let table = drawTableHeader(doc.y);
  doc.y = table.y + table.height + 6;

  if (!items.length) {
    ensureSpace(44);
    doc.save();
    doc.roundedRect(left, doc.y, contentWidth, 36, 8).fill(colors.surface);
    doc.roundedRect(left, doc.y, contentWidth, 36, 8).stroke(colors.line);
    doc.fillColor(colors.muted).font("Helvetica").fontSize(10).text("No hay partidas registradas para este proyecto.", left + 12, doc.y + 12);
    doc.restore();
    doc.y += 48;
  } else {
    items.forEach((item, index) => {
      const description = truncate(item.desc || item.model || item.name || "Partida", 94);
      const meta = truncate(item.boxName ? `Caja: ${item.boxName}` : item.type ? `Tipo: ${item.type}` : "", 56);
      const rowHeight = meta ? 34 : 24;
      const rowY = doc.y;

      if (rowY + rowHeight > pageBottom()) {
        addPageWithScaffold();
        doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(12).text("Partidas (continuación)", left, doc.y);
        doc.y += 18;
        table = drawTableHeader(doc.y);
        doc.y = table.y + table.height + 6;
      }

      const renderY = doc.y;

      if (index % 2 === 0) {
        doc.save();
        doc.roundedRect(table.x, renderY - 2, table.width, rowHeight, 6).fill(colors.surface);
        doc.restore();
      }

      doc.fillColor(colors.text).font("Helvetica").fontSize(9.5);
      doc.text(String(index + 1), table.columns.index.x, renderY + 7, { width: table.columns.index.width });
      doc.font("Helvetica-Bold").text(description, table.columns.description.x, renderY + 6, { width: table.columns.description.width });

      if (meta) {
        doc.fillColor(colors.muted).font("Helvetica").fontSize(8.2).text(meta, table.columns.description.x, renderY + 18, { width: table.columns.description.width });
      }

      doc
        .fillColor(colors.text)
        .font("Helvetica")
        .fontSize(9.5)
        .text(String(getQty(item)), table.columns.qty.x, renderY + 7, {
          width: table.columns.qty.width,
          align: "right",
        });
      doc.text(formatCurrency(getUnit(item)), table.columns.unit.x, renderY + 7, {
        width: table.columns.unit.width,
        align: "right",
      });
      doc.text(formatCurrency(getTotal(item)), table.columns.total.x, renderY + 7, {
        width: table.columns.total.width,
        align: "right",
      });

      doc.y = renderY + rowHeight;
      doc.moveTo(table.x, doc.y - 2).lineTo(table.x + table.width, doc.y - 2).stroke(colors.lineSoft);
    });
  }

  doc.y += 12;
  const totalsBoxHeight = 94;
  ensureSpace(totalsBoxHeight + 12);
  const totalsBoxWidth = 258;
  const totalsX = left + contentWidth - totalsBoxWidth;
  const totalsY = doc.y;

  doc.save();
  doc.roundedRect(totalsX, totalsY, totalsBoxWidth, totalsBoxHeight, 12).fill(colors.accentSoft);
  doc.roundedRect(totalsX, totalsY, totalsBoxWidth, totalsBoxHeight, 12).stroke(colors.line);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9.2);
  doc.text("Subtotal", totalsX + 16, totalsY + 16, { width: 148, align: "right" });
  doc.text(formatCurrency(subtotal), totalsX + 170, totalsY + 16, { width: 72, align: "right" });
  doc.text("Impuestos", totalsX + 16, totalsY + 36, { width: 148, align: "right" });
  doc.text(formatCurrency(taxes), totalsX + 170, totalsY + 36, { width: 72, align: "right" });
  doc.moveTo(totalsX + 16, totalsY + 58).lineTo(totalsX + totalsBoxWidth - 16, totalsY + 58).stroke(colors.line);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(11).text("TOTAL", totalsX + 16, totalsY + 66, { width: 148, align: "right" });
  doc.text(formatCurrency(total), totalsX + 170, totalsY + 66, { width: 72, align: "right" });
  doc.restore();

  doc.y = totalsY + totalsBoxHeight + 10;

  const notes = String(project.notes || "").trim();
  if (notes) {
    const notesTextWidth = contentWidth - 24;
    const notesTextHeight = doc.heightOfString(notes, {
      width: notesTextWidth,
      align: "left",
      lineGap: 2,
    });
    const notesBlockHeight = Math.max(34, notesTextHeight + 18);

    ensureSpace(notesBlockHeight + 12);
    const notesY = doc.y;
    doc.save();
    doc.roundedRect(left, notesY, contentWidth, notesBlockHeight, 10).fill(colors.surface);
    doc.roundedRect(left, notesY, contentWidth, notesBlockHeight, 10).stroke(colors.line);
    doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(9.5).text("Notas del proyecto", left + 12, notesY + 8);
    doc.fillColor(colors.text).font("Helvetica").fontSize(9).text(notes, left + 12, notesY + 20, {
      width: notesTextWidth,
      align: "left",
      lineGap: 2,
    });
    doc.restore();
    doc.y = notesY + notesBlockHeight + 6;
  }

  if (verification?.id || verification?.verifyHint) {
    const verificationTextWidth = contentWidth - 24;
    const verifyHint = truncate(
      verification.verifyHint || "GET /api/projects/{id}/quote/verification/latest",
      96
    );
    const verificationRows = [
      `Código de verificación: ${verification.id || "N/D"}`,
      `Emitido: ${formatDateTime(verification.issuedAt || new Date())}`,
      `Usuario: ${verification.issuedBy || "sistema"}`,
      `Validación API: ${verifyHint}`,
      "Integridad protegida por huella SHA-256 y firma digital opcional.",
    ];
    const verificationBody = verificationRows.join("\n");
    const verificationBodyHeight = doc.heightOfString(verificationBody, {
      width: verificationTextWidth,
      lineGap: 2,
    });
    const verificationBlockHeight = verificationBodyHeight + 26;

    ensureSpace(verificationBlockHeight + 12);
    const verifyY = doc.y;

    doc.save();
    doc.roundedRect(left, verifyY, contentWidth, verificationBlockHeight, 10).fill(colors.surfaceStrong);
    doc.roundedRect(left, verifyY, contentWidth, verificationBlockHeight, 10).stroke(colors.line);
    doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(9.5).text("Sello de verificación", left + 12, verifyY + 8);
    doc.fillColor(colors.text).font("Helvetica").fontSize(8.7).text(verificationBody, left + 12, verifyY + 20, {
      width: verificationTextWidth,
      lineGap: 2,
    });
    doc.restore();

    doc.y = verifyY + verificationBlockHeight + 6;
  }

  ensureSpace(26);
  const signY = doc.y + 2;
  const signWidth = 210;
  doc.moveTo(left, signY).lineTo(left + signWidth, signY).stroke(colors.line);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9).text("Firma cliente", left, signY + 6);

  const rightSignX = left + contentWidth - signWidth;
  doc.moveTo(rightSignX, signY).lineTo(rightSignX + signWidth, signY).stroke(colors.line);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9).text("Firma comercial", rightSignX, signY + 6);

  return new Promise((resolve, reject) => {
    doc.once("error", reject);
    doc.once("end", () => resolve(Buffer.concat(chunks)));
    doc.end();
  });
}

