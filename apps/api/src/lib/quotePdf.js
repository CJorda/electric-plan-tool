export async function streamQuotePdf(res, project, items = [], opts = {}) {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const formatCurrency = (v) => `€${Number(v || 0).toFixed(2)}`;
  const getQty = (it) => Number(it.qty ?? it.quantity ?? 1);
  const getUnit = (it) => Number(it.unit ?? it.unitPrice ?? it.distributorPrice ?? 0);
  const getTotal = (it) => Number(it.total ?? (getUnit(it) * getQty(it)));
  const colors = {
    ink: '#0f172a',
    text: '#111827',
    muted: '#6b7280',
    line: '#e5e7eb',
    soft: '#f8fafc',
    accent: '#6366f1',
    accentDark: '#4f46e5',
  };

  // headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="quote-${project.id}.pdf"`);
  doc.pipe(res);

  // Brand header bar
  doc.save();
  doc.rect(0, 0, doc.page.width, 90).fill(colors.accent);
  doc.fillColor('#ffffff').fontSize(14).text('Electric Plan Tool', doc.page.margins.left, 30);
  doc.fontSize(9).fillColor('#eef2ff').text('Automation Budgeting Suite', doc.page.margins.left, 50);
  doc.restore();

  // Logo placeholder
  doc.save();
  doc.circle(doc.page.width - doc.page.margins.right - 20, 45, 16).fill('#ffffff');
  doc.fillColor(colors.accentDark).fontSize(10).text('E', doc.page.width - doc.page.margins.right - 24, 38);
  doc.restore();

  // Title block
  doc.fillColor(colors.ink).fontSize(20).text('Presupuesto', doc.page.margins.left, 110);
  doc.fontSize(10).fillColor(colors.muted).text(`ID: ${project.id}`, doc.page.margins.left, 134);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, doc.page.margins.left + 120, 134);

  // Project details card
  doc.moveDown(2);
  const startY = 160;
  doc.roundedRect(doc.page.margins.left, startY - 8, doc.page.width - doc.page.margins.left * 2, 60, 10).fill(colors.soft);
  doc.fillColor(colors.ink).fontSize(12).text(project.name || 'Proyecto', doc.page.margins.left + 12, startY);
  doc.fontSize(10).fillColor(colors.muted).text(project.notes || 'Sin notas', doc.page.margins.left + 12, startY + 18, { width: 420 });
  doc.fontSize(10).fillColor(colors.muted).text(`Estado: ${project.status || 'draft'}`, doc.page.width - doc.page.margins.right - 140, startY + 4, { width: 130, align: 'right' });

  // Items table header
  let tableTop = startY + 86;
  const tableLeft = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left * 2;

  doc.rect(tableLeft, tableTop - 8, tableWidth, 24).fill('#eef2ff');
  doc.moveTo(tableLeft, tableTop + 16).lineTo(tableLeft + tableWidth, tableTop + 16).stroke(colors.line);
  doc.fontSize(10).fillColor(colors.ink);
  doc.text('#', tableLeft + 4, tableTop);
  doc.text('Descripción', tableLeft + 30, tableTop);
  doc.text('Cantidad', tableLeft + tableWidth - 220, tableTop, { width: 60, align: 'right' });
  doc.text('P. Unit.', tableLeft + tableWidth - 150, tableTop, { width: 60, align: 'right' });
  doc.text('Total', tableLeft + tableWidth - 60, tableTop, { width: 60, align: 'right' });

  // Table rows
  let y = tableTop + 24;
  items.forEach((it, i) => {
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    if (i % 2 === 0) {
      doc.rect(tableLeft, y - 4, tableWidth, 20).fill('#f9fafb');
    }
    doc.fontSize(10).fillColor(colors.text);
    doc.text(String(i + 1), tableLeft + 4, y);
    doc.text(it.desc || it.model || it.name || '', tableLeft + 30, y, { width: tableWidth - 300 });
    doc.text(String(getQty(it)), tableLeft + tableWidth - 220, y, { width: 60, align: 'right' });
    doc.text(formatCurrency(getUnit(it)), tableLeft + tableWidth - 150, y, { width: 60, align: 'right' });
    doc.text(formatCurrency(getTotal(it)), tableLeft + tableWidth - 60, y, { width: 60, align: 'right' });
    y += 20;
    doc.moveTo(tableLeft, y - 6).lineTo(tableLeft + tableWidth, y - 6).stroke('#f3f4f6');
  });

  // Totals
  const subtotal = items.reduce((s, it) => s + getTotal(it), 0);
  const taxes = opts.taxes ?? 0;
  const total = subtotal + taxes;

  const totalsY = Math.max(y + 12, doc.page.height - 190);
  doc.roundedRect(tableLeft + tableWidth - 240, totalsY - 8, 220, 70, 10).fill('#eef2ff');
  doc.fontSize(10).fillColor(colors.muted);
  doc.text('Subtotal', tableLeft + tableWidth - 220, totalsY, { width: 140, align: 'right' });
  doc.text(formatCurrency(subtotal), tableLeft + tableWidth - 60, totalsY, { width: 60, align: 'right' });
  doc.text('Impuestos', tableLeft + tableWidth - 220, totalsY + 16, { width: 140, align: 'right' });
  doc.text(formatCurrency(taxes), tableLeft + tableWidth - 60, totalsY + 16, { width: 60, align: 'right' });
  doc.fontSize(12).fillColor(colors.ink).text('Total', tableLeft + tableWidth - 220, totalsY + 36, { width: 140, align: 'right' });
  doc.fontSize(12).fillColor(colors.text).text(formatCurrency(total), tableLeft + tableWidth - 60, totalsY + 36, { width: 60, align: 'right' });

  // Signature placeholder
  const signY = totalsY + 86;
  doc.moveTo(tableLeft, signY).lineTo(tableLeft + 220, signY).stroke('#c7d2fe');
  doc.fontSize(10).fillColor(colors.muted).text('Firma cliente', tableLeft, signY + 6);

  // Footer
  doc.fontSize(9).fillColor('#9ca3af').text('Gracias por confiar en nosotros. Este presupuesto es válido por 30 días.', doc.page.margins.left, doc.page.height - 45, { align: 'center', width: doc.page.width - doc.page.margins.left * 2 });

  doc.end();
}
