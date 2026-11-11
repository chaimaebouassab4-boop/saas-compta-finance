import type { Tables } from "@/integrations/supabase/types";
export type Line = { description: string; quantity: number; unit_price: number; tax_rate: number };
export type Invoice = Tables<"invoices">;
export const labels: Record<Invoice["status"], string> = {
  imported: "Importé",
  needs_review: "À vérifier",
  needs_correction: "À corriger",
  validated: "Validé",
  draft: "Brouillon",
  issued: "Émise",
  partially_paid: "Partiellement payée",
  paid: "Payée",
};
export const money = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(n);
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function totals(lines: Line[]) {
  let ht = 0,
    tax = 0;
  for (const l of lines) {
    const c = Math.round(l.quantity * l.unit_price * 100);
    ht += c;
    tax += Math.round((c * l.tax_rate) / 100);
  }
  return { subtotal: ht / 100, tax_amount: tax / 100, total: (ht + tax) / 100 };
}
export function issues(i: Invoice, all: Invoice[]) {
  const a: string[] = [];
  if (!i.invoice_number.trim()) a.push("Numéro manquant.");
  if (!i.counterparty_name.trim()) a.push("Client ou fournisseur manquant.");
  if (!i.invoice_date) a.push("Date manquante.");
  if (!i.due_date) a.push("Échéance manquante.");
  if (i.due_date && i.invoice_date && i.due_date < i.invoice_date)
    a.push("Échéance antérieure à la facture.");
  if (i.total <= 0 || Math.abs(i.subtotal + i.tax_amount - i.total) > 0.011)
    a.push("Montants incohérents ou nuls.");
  if (
    i.invoice_number &&
    all.some(
      (x) =>
        x.id !== i.id &&
        x.organization_id === i.organization_id &&
        x.kind === i.kind &&
        x.invoice_number === i.invoice_number &&
        x.counterparty_name === i.counterparty_name,
    )
  )
    a.push("Doublon possible : même numéro et même tiers.");
  return a;
}
export function metrics(list: Invoice[]) {
  const s = list.filter(
    (i) =>
      i.kind === "sale" && ["validated", "issued", "partially_paid", "paid"].includes(i.status),
  );
  const sum = (a: Invoice[], k: "subtotal" | "total" | "paid_amount") =>
    a.reduce((n, i) => n + Math.round(Number(i[k]) * 100), 0) / 100;
  return {
    revenue: sum(s, "subtotal"),
    collected: sum(s, "paid_amount"),
    outstanding: sum(s, "total") - sum(s, "paid_amount"),
    purchases: sum(
      list.filter((i) => i.kind === "purchase" && i.status === "validated"),
      "subtotal",
    ),
    pending: list.filter((i) => ["imported", "needs_review", "needs_correction"].includes(i.status))
      .length,
  };
}
export function blankInvoice(org: string, kind: Invoice["kind"], user: string): Invoice {
  return {
    id: crypto.randomUUID(),
    organization_id: org,
    kind,
    created_by: user,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: "MAD",
    invoice_number: "",
    counterparty_name: "",
    invoice_date: today(),
    due_date: today(),
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    paid_amount: 0,
    status: "draft",
    document_path: null,
    document_name: null,
    extraction_mode: "manual",
    extracted_fields: [],
    notes: "",
    validated_by: null,
    validated_at: null,
  };
}
export function demoInvoices(): Invoice[] {
  return [
    ["sale", "FV-042", "Atelier Atlas", 18500, "issued"],
    ["purchase", "FA-018", "Papeterie du Maroc", 2400, "needs_review"],
    ["sale", "FV-041", "Studio Riad", 9200, "paid"],
  ].map(([k, n, c, a, s]) => ({
    ...blankInvoice("demo", k as Invoice["kind"], "demo"),
    invoice_number: String(n),
    counterparty_name: String(c),
    ...totals([
      {
        description: "Prestation de démonstration",
        quantity: 1,
        unit_price: Number(a),
        tax_rate: 20,
      },
    ]),
    extracted_fields: [
      {
        description: "Prestation de démonstration",
        quantity: 1,
        unit_price: Number(a),
        tax_rate: 20,
      },
    ],
    status: s as Invoice["status"],
    paid_amount: s === "paid" ? Number(a) * 1.2 : 0,
  }));
}
