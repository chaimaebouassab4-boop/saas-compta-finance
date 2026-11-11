import { describe, expect, it } from "vitest";
import { blankInvoice, totals, metrics, issues } from "@/lib/finance";
describe("Financial calculations", () => {
  it("rounds line totals and tax to cents", () => {
    expect(totals([{ description: "Test", quantity: 3, unit_price: 0.1, tax_rate: 20 }])).toEqual({
      subtotal: 0.3,
      tax_amount: 0.06,
      total: 0.36,
    });
  });
  it("counts sales as revenue and only validated purchases as costs", () => {
    const sale = {
      ...blankInvoice("a", "sale", "u"),
      status: "issued" as const,
      subtotal: 100,
      total: 120,
      paid_amount: 30,
    };
    const purchase = {
      ...blankInvoice("a", "purchase", "u"),
      status: "validated" as const,
      subtotal: 50,
      total: 60,
    };
    const draft = { ...sale, id: "draft", status: "draft" as const, subtotal: 900 };
    expect(metrics([sale, purchase, draft])).toEqual({
      revenue: 100,
      collected: 30,
      outstanding: 90,
      purchases: 50,
      pending: 0,
    });
  });
  it("detects missing fields, invalid dates and company-scoped duplicates", () => {
    const base = {
      ...blankInvoice("a", "sale", "u"),
      invoice_number: "F1",
      counterparty_name: "Client",
      subtotal: 100,
      tax_amount: 20,
      total: 120,
    };
    expect(issues(base, [])).toEqual([]);
    expect(issues(base, [{ ...base, id: "another" }])).toContain(
      "Doublon possible : même numéro et même tiers.",
    );
    expect(issues(base, [{ ...base, id: "another", organization_id: "b" }])).toEqual([]);
    expect(issues({ ...base, due_date: "2000-01-01" }, [])).toContain(
      "Échéance antérieure à la facture.",
    );
  });
});
