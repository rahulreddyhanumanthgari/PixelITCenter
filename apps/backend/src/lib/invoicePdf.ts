import PDFDocument from "pdfkit";

// The invoice as a one-page PDF (US Letter), drawn with PDFKit's built-in
// Helvetica, so there are no font files to ship. Everything on it comes from the
// invoice row, which copied the client, rates and terms when it was raised.

export type CompanyDetails = { name: string; address: string; phone: string; email: string; remitTo?: string };

export type InvoicePdfData = {
  number: string;
  issueDate: string; // "Oct 14, 2026"
  dueDate: string;
  paymentTermsDays: number;
  periodLabel: string; // "September 2026"
  client: { name: string; type: "CLIENT" | "VENDOR"; endClientName: string | null; contactPerson: string | null; billingEmail: string };
  consultantName: string;
  role: string;
  hours: string; // "160.00"
  rate: string; // "$95.00"
  total: string; // "$15,200.00"
};

const NAVY = "#041327";
const ORANGE = "#fc650d";
const MUTED = "#5b6472";
const LINE = "#d9dee5";

export function renderInvoicePdf(data: InvoicePdfData, company: CompanyDetails): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 54,
    info: { Title: `Invoice ${data.number}`, Author: company.name, Subject: `${data.consultantName}, ${data.periodLabel}` },
  });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = 54;
  const right = doc.page.width - 54;
  const width = right - left;

  // Header: company on the left, INVOICE on the right.
  doc.rect(0, 0, doc.page.width, 6).fill(ORANGE);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18).text(company.name, left, 40);
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  doc.text(company.address, left, 64, { width: 260 });
  doc.text(`${company.phone}  ·  ${company.email}`, { width: 260 });

  doc.font("Helvetica-Bold").fontSize(22).fillColor(NAVY).text("INVOICE", left, 40, { width, align: "right" });
  const meta: [string, string][] = [
    ["Invoice no.", data.number],
    ["Issue date", data.issueDate],
    ["Due date", data.dueDate],
    ["Terms", `Net ${data.paymentTermsDays}`],
  ];
  let y = 70;
  for (const [label, value] of meta) {
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(label, right - 200, y, { width: 90 });
    doc.font("Helvetica-Bold").fillColor(NAVY).text(value, right - 110, y, { width: 110, align: "right" });
    y += 14;
  }

  // Bill to / consultant.
  y = 150;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(LINE).stroke();
  y += 14;
  const col = width / 2;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(ORANGE).text("BILL TO", left, y);
  doc.text("CONSULTANT", left + col, y);
  y += 13;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(data.client.name, left, y, { width: col - 12 });
  doc.text(data.consultantName, left + col, y, { width: col });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  const billTo = [
    data.client.type === "VENDOR" ? "Vendor" : "Client",
    data.client.contactPerson ? `Attn: ${data.client.contactPerson}` : null,
    data.client.billingEmail,
    data.client.endClientName ? `End client: ${data.client.endClientName}` : null,
  ].filter(Boolean) as string[];
  doc.text(billTo.join("\n"), left, y + 16, { width: col - 12 });
  doc.text(`${data.role}\nPeriod: ${data.periodLabel}`, left + col, y + 16, { width: col });

  // Line item.
  y = 270;
  const cols = [left, left + width * 0.52, left + width * 0.68, left + width * 0.82];
  doc.rect(left, y, width, 22).fill("#f3f6fa");
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(NAVY);
  doc.text("DESCRIPTION", cols[0]! + 8, y + 7);
  doc.text("HOURS", cols[1]!, y + 7, { width: width * 0.14, align: "right" });
  doc.text("RATE / HR", cols[2]!, y + 7, { width: width * 0.13, align: "right" });
  doc.text("AMOUNT", cols[3]!, y + 7, { width: width * 0.18 - 8, align: "right" });
  y += 30;
  doc.font("Helvetica").fontSize(10).fillColor(NAVY);
  doc.text(`Consulting services: ${data.consultantName}, ${data.role} (${data.periodLabel})`, cols[0]! + 8, y, { width: width * 0.5 - 8 });
  doc.text(data.hours, cols[1]!, y, { width: width * 0.14, align: "right" });
  doc.text(data.rate, cols[2]!, y, { width: width * 0.13, align: "right" });
  doc.text(data.total, cols[3]!, y, { width: width * 0.18 - 8, align: "right" });
  y += 36;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).stroke();

  // Total.
  y += 12;
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text("Total due", cols[2]!, y, { width: width * 0.13, align: "right" });
  doc.font("Helvetica-Bold").fontSize(14).fillColor(NAVY).text(data.total, cols[3]!, y - 2, { width: width * 0.18 - 8, align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`Due by ${data.dueDate}`, cols[2]!, y + 18, { width: width * 0.31 - 8, align: "right" });

  // Footer.
  y += 70;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text("Payment", left, y);
  doc.font("Helvetica").fillColor(MUTED);
  doc.text(`Please quote ${data.number} with your payment. Payment is due within ${data.paymentTermsDays} days of the issue date.`, left, y + 13, { width });
  if (company.remitTo) doc.text(`Remit to: ${company.remitTo}`, { width });
  doc.text(`Questions about this invoice: ${company.email}`, { width });

  doc.end();
  return done;
}
