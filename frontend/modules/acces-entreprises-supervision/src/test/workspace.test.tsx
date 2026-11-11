import { fireEvent, render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Workspace } from "@/components/workspace";
afterEach(cleanup);
describe("Demo priority workflow", () => {
  it("imports a PDF, guides manual entry and validates it", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:test-invoice") }));
    render(<Workspace demo />);
    fireEvent.click(await screen.findByRole("button", { name: /Importer des pièces/ }));
    fireEvent.change(screen.getByLabelText("Importer des factures"), {
      target: { files: [new File(["test"], "achat-test.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Ouvrir achat-test.pdf" }));
    const d = screen.getByRole("dialog");
    expect(within(d).getByRole("button", { name: /^Valider$/ })).toBeDisabled();
    fireEvent.change(within(d).getByLabelText("Numéro"), { target: { value: "ACH-TEST" } });
    fireEvent.change(within(d).getByLabelText("Fournisseur"), {
      target: { value: "Fournisseur test" },
    });
    fireEvent.change(within(d).getByLabelText("Prix HT"), { target: { value: "100" } });
    fireEvent.click(within(d).getByRole("button", { name: /^Valider$/ }));
    await within(d).findByText("Facture enregistrée.");
    expect(within(d).getByLabelText("Numéro")).toBeDisabled();
    fireEvent.click(within(d).getByRole("button", { name: "Fermer la facture" }));
    fireEvent.click(screen.getByRole("button", { name: "Tableau de bord" }));
    expect(screen.getByText("100,00 MAD", { exact: false })).toBeTruthy();
  });
  it("corrects and validates a purchase and refreshes dashboard purchases", async () => {
    render(<Workspace demo />);
    fireEvent.click(await screen.findByRole("button", { name: "Ouvrir FA-018" }));
    const d = screen.getByRole("dialog");
    fireEvent.change(within(d).getByLabelText("Fournisseur"), {
      target: { value: "Fournisseur corrigé" },
    });
    fireEvent.click(within(d).getByRole("button", { name: /^Valider$/ }));
    await screen.findByText("Facture enregistrée.");
    expect(within(d).getByLabelText("Fournisseur")).toBeDisabled();
    fireEvent.click(within(d).getByRole("button", { name: "Fermer la facture" }));
    expect(screen.getByText("2.400,00 MAD", { exact: false })).toBeTruthy();
  });
  it("records a partial payment and updates the outstanding amount", async () => {
    render(<Workspace demo />);
    fireEvent.click(await screen.findByRole("button", { name: "Ouvrir FV-042" }));
    const d = screen.getByRole("dialog");
    fireEvent.change(within(d).getByLabelText("Montant MAD"), { target: { value: "200" } });
    fireEvent.click(within(d).getByRole("button", { name: "Enregistrer le paiement" }));
    await screen.findByText("Paiement enregistré.");
    expect(within(d).getByText("Solde TTC : 22.000,00 MAD", { exact: false })).toBeTruthy();
  });
});
