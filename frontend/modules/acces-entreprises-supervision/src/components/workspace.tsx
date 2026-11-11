import { useEffect, useState, useRef } from "react";
import {
  Layers,
  LayoutDashboard,
  FileUp,
  ReceiptText,
  History,
  Building2,
  Settings,
  LogOut,
  Plus,
  ArrowUpRight,
  Search,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Json } from "@/integrations/supabase/types";
import {
  blankInvoice,
  demoInvoices,
  issues,
  labels,
  metrics,
  money,
  today,
  totals,
} from "@/lib/finance";
import type { Invoice, Line } from "@/lib/finance";
import { module1, type Organization as Org, type Supervision } from "@/lib/module1-api";
type Event = Pick<Tables<"invoice_events">, "action" | "created_at" | "user_id" | "details">;
const nav = [
  ["dashboard", "Tableau de bord", LayoutDashboard],
  ["import", "Importer des pièces", FileUp],
  ["invoices", "Factures", ReceiptText],
  ["clients", "Entreprises", Building2],
  ["history", "Historique", History],
  ["profile", "Mon profil", Settings],
] as const;
const newLine = (): Line => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 20 });
function fail(error: unknown) {
  if (error) throw error;
}
export function Workspace({ demo }: { demo: boolean }) {
  const [tab, T] = useState("dashboard"),
    [orgs, O] = useState<Org[]>([]),
    [orgId, OI] = useState(""),
    [invoices, I] = useState<Invoice[]>([]),
    [user, U] = useState(""),
    [name, N] = useState(""),
    [avatar, AV] = useState(""),
    [role, R] = useState("Entreprise"),
    [processor, PR] = useState(false),
    [manager, MA] = useState(false),
    [busy, B] = useState(true),
    [message, M] = useState(""),
    [selected, S] = useState<Invoice | null>(null),
    [lines, L] = useState<Line[]>([]),
    [preview, V] = useState(""),
    [events, E] = useState<Event[]>([]),
    [blobs, BL] = useState<Record<string, string>>({}),
    [query, Q] = useState(""),
    [status, ST] = useState(""),
    [kind, K] = useState(""),
    [period, PE] = useState(""),
    [importKind, IK] = useState<Invoice["kind"]>("purchase"),
    [invite, IN] = useState("");
  const [supervision, setSupervision] = useState<Supervision[]>([]);
  const org = orgs.find((o) => o.id === orgId),
    scoped = invoices.filter((i) => i.organization_id === orgId),
    stats = metrics(scoped);
  const demoHistory = useRef<Record<string, Event[]>>({});
  useEffect(() => {
    if (demo && selected) demoHistory.current[selected.id] = events;
  }, [events, selected, demo]);
  async function load() {
    const [a, b] = await Promise.all([
      module1.organizations(),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    ]);
    fail(b.error);
    O(a);
    I(b.data || []);
    OI((prev) => prev || a[0]?.id || "");
    setSupervision(await module1.supervision());
  }
  useEffect(() => {
    let active = true;
    if (demo) {
      O([{ id: "demo", name: "Atlas Studio · Démonstration", kind: "company" }]);
      OI("demo");
      I(demoInvoices());
      U("demo");
      N("Salma");
      PR(true);
      MA(true);
      R("Comptable · Démo");
      B(false);
      return;
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && !session) location.assign("/connexion");
    });
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        fail(error);
        if (!data.user) {
          location.assign("/connexion");
          return;
        }
        if (!active) return;
        U(data.user.id);
        const profile = await module1.profile();
        N(profile.full_name || data.user.user_metadata["full_name"] || "");
        AV(profile.avatar_url || "");
        await load();
      } catch (e) {
        M("Chargement impossible : " + errorText(e));
      } finally {
        if (active) B(false);
      }
    })();
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [demo]);
  useEffect(() => {
    if (!orgId || demo) return;
    PR(false);
    MA(false);
    let active = true;
    (async () => {
      try {
        const permissions = await module1.permissions(orgId);
        if (active) {
          PR(permissions.processor);
          MA(permissions.manager);
          R(permissions.role === "firm_manager" ? "Responsable du cabinet" : permissions.processor ? "Comptable" : "Entreprise");
        }
      } catch (e) {
        M(errorText(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [orgId, user, demo]);
  async function action(fn: () => Promise<void>) {
    B(true);
    M("");
    try {
      await fn();
    } catch (e) {
      M(errorText(e));
    } finally {
      B(false);
    }
  }
  async function open(i: Invoice) {
    S({ ...i });
    const saved = i.extracted_fields;
    L(
      Array.isArray(saved) && saved.length
        ? (saved as unknown as Line[])
        : [
            {
              description: "Montant de la pièce",
              quantity: 1,
              unit_price: i.subtotal,
              tax_rate: i.subtotal ? Math.round((i.tax_amount / i.subtotal) * 100) : 20,
            },
          ],
    );
    E(demoHistory.current[i.id] || []);
    M("");
    V(blobs[i.id] || "");
    if (!demo) {
      await action(async () => {
        const r = await supabase
          .from("invoice_events")
          .select("*")
          .eq("invoice_id", i.id)
          .order("created_at", { ascending: false });
        fail(r.error);
        E(r.data || []);
        if (i.document_path) {
          const d = await supabase.storage
            .from("finance-documents")
            .createSignedUrl(i.document_path, 600);
          fail(d.error);
          V(d.data?.signedUrl || "");
        }
      });
    }
  }
  const current = selected ? { ...selected, ...totals(lines) } : null;
  const problems = current ? issues(current, invoices) : [];
  const locked = selected
    ? ["validated", "issued", "partially_paid", "paid"].includes(selected.status)
    : false;
  async function save(next: Invoice["status"]) {
    if (!current) return;
    await action(async () => {
      if (["validated", "issued"].includes(next) && problems.length)
        throw new Error(problems.join(" "));
      if (
        !lines.length ||
        lines.some(
          (l) =>
            !l.description.trim() ||
            !Number.isFinite(l.quantity) ||
            l.quantity <= 0 ||
            !Number.isFinite(l.unit_price) ||
            l.unit_price < 0 ||
            !Number.isFinite(l.tax_rate) ||
            l.tax_rate < 0 ||
            l.tax_rate > 100,
        )
      )
        throw new Error(
          "Complétez les lignes : description, quantité positive, prix et taxe valides.",
        );
      if (next === "validated" && !processor)
        throw new Error("La validation est réservée au comptable.");
      const payload = {
        invoice_number: current.invoice_number,
        counterparty_name: current.counterparty_name,
        invoice_date: current.invoice_date,
        due_date: current.due_date,
        notes: current.notes,
        ...totals(lines),
        extracted_fields: lines as unknown as Json,
        status: next,
      };
      if (demo) {
        const updated = {
          ...current,
          ...payload,
          validated_by: next === "validated" ? user : current.validated_by,
          validated_at: next === "validated" ? new Date().toISOString() : current.validated_at,
        };
        I((a) => [updated, ...a.filter((x) => x.id !== updated.id)]);
        E((a) => [
          {
            action: labels[next],
            created_at: new Date().toISOString(),
            user_id: user,
            details: {},
          },
          ...a,
        ]);
        S(updated);
      } else {
        const existing = invoices.some((i) => i.id === current.id);
        const r = existing
          ? await supabase.from("invoices").update(payload).eq("id", current.id).select().single()
          : await supabase
              .from("invoices")
              .insert({ ...current, ...payload })
              .select()
              .single();
        fail(r.error);
        if (r.data) {
          S(r.data);
          await load();
        }
      }
      M("Facture enregistrée.");
    });
  }
  async function upload(files: FileList | null) {
    if (!files || !orgId) return;
    await action(async () => {
      let count = 0;
      for (const f of Array.from(files)) {
        if (
          !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 10 * 1024 * 1024
        )
          throw new Error(
            "Utilisez un PDF, JPG, PNG ou WebP de moins de 10 Mo. " +
              count +
              " pièce(s) déjà importée(s).",
          );
        const i = {
          ...blankInvoice(orgId, importKind, user),
          status: "needs_review" as const,
          document_name: f.name,
        };
        if (demo) {
          const url = URL.createObjectURL(f);
          BL((a) => ({ ...a, [i.id]: url }));
          I((a) => [i, ...a]);
        } else {
          const path = orgId + "/" + i.id + "/" + f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const u = await supabase.storage.from("finance-documents").upload(path, f);
          fail(u.error);
          const r = await supabase.from("invoices").insert({ ...i, document_path: path });
          fail(r.error);
        }
        count++;
      }
      if (!demo) await load();
      M(count + " pièce(s) importée(s). Complétez les champs en ouvrant chaque facture.");
    });
  }
  function newInvoice() {
    S(blankInvoice(orgId, "sale", user));
    L([newLine()]);
    V("");
    E([]);
  }
  async function payment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget),
      amount = Number(f.get("amount")),
      invoice = selected;
    await action(async () => {
      const cents = Math.round(amount * 100),
        remaining = Math.round((invoice.total - invoice.paid_amount) * 100);
      if (!Number.isFinite(amount) || cents <= 0 || cents > remaining)
        throw new Error("Montant supérieur au solde ou invalide.");
      if (demo) {
        const paid = (Math.round(invoice.paid_amount * 100) + cents) / 100;
        const updated = {
          ...invoice,
          paid_amount: paid,
          status: (paid >= invoice.total ? "paid" : "partially_paid") as Invoice["status"],
        };
        I((a) => a.map((x) => (x.id === invoice.id ? updated : x)));
        S(updated);
        E((a) => [
          {
            action: "Paiement : " + money(amount),
            created_at: new Date().toISOString(),
            user_id: user,
            details: {},
          },
          ...a,
        ]);
      } else {
        const r = await supabase.from("invoice_payments").insert({
          invoice_id: invoice.id,
          amount: cents / 100,
          created_by: user,
          paid_at: String(f.get("date")),
          method: String(f.get("method")),
        });
        fail(r.error);
        await load();
        const s = await supabase.from("invoices").select("*").eq("id", invoice.id).single();
        fail(s.error);
        S(s.data);
      }
      M("Paiement enregistré.");
    });
  }
  const filtered = scoped.filter(
    (i) =>
      (i.invoice_number + " " + i.counterparty_name + " " + (i.document_name || ""))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || i.status === status) &&
      (!kind || i.kind === kind) &&
      (!period || i.invoice_date?.startsWith(period)),
  );
  function table(items: Invoice[]) {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Facture / document</th>
              <th>Client ou fournisseur</th>
              <th>Date</th>
              <th>Type</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.invoice_number || "À compléter"}</strong>
                  <small>
                    {i.document_name ||
                      (i.kind === "sale" ? "Facture de vente" : "Facture d’achat")}
                  </small>
                </td>
                <td>{i.counterparty_name || "Tiers à renseigner"}</td>
                <td>{i.invoice_date || "—"}</td>
                <td>{i.kind === "sale" ? "Vente" : "Achat"}</td>
                <td className="amount">{money(i.total)}</td>
                <td>
                  <span className={"badge " + i.status}>{labels[i.status]}</span>
                  {i.kind === "sale" &&
                    ["issued", "partially_paid"].includes(i.status) &&
                    i.due_date &&
                    i.due_date < today() && <small className="danger">En retard</small>}
                </td>
                <td>
                  <button
                    aria-label={"Ouvrir " + (i.invoice_number || i.document_name)}
                    className="icon-btn"
                    onClick={() => void open(i)}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <div className="empty">
            <ReceiptText />
            <h3>Aucune facture pour le moment</h3>
            <p>Importez une pièce ou créez votre première facture de vente.</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="finance workspace">
      <aside className="sidebar">
        <a href="/" className="brand">
          <Layers /> mizane
        </a>
        <div className="workspace-label">VOTRE ESPACE {demo ? "DÉMO" : ""}</div>
        <div className="org-pill">
          <Building2 size={18} />
          <span>
            {org?.name || "Mon organisation"}
            <small>{role}</small>
          </span>
        </div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => {
                T(id);
                M("");
              }}
              className={tab === id ? "active" : ""}
            >
              <Icon size={19} />
              {label}
              {id === "import" && stats.pending > 0 && <b>{stats.pending}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">{name.slice(0, 1) || "M"}</div>
          <div>
            <strong>{name || "Mon compte"}</strong>
            <small>{role}</small>
          </div>
          <button
            className="icon-btn"
            aria-label="Se déconnecter"
            onClick={() =>
              demo
                ? location.assign("/")
                : void action(async () => {
                    const r = await supabase.auth.signOut();
                    fail(r.error);
                  })
            }
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="work-main">
        <header className="work-header">
          <span>
            Mon espace <span className="crumb">/ {nav.find((n) => n[0] === tab)?.[1]}</span>
          </span>
          <div className="header-right">
            <span className="currency">MAD · Maroc</span>
            {orgs.length > 0 && (
              <select
                aria-label="Entreprise active"
                value={orgId}
                onChange={(e) => {
                  OI(e.target.value);
                  S(null);
                }}
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>
        <main className="work-content">
          {demo && (
            <div className="demo-banner">
              <span>
                Mode démonstration · Données fictives, conservées uniquement pendant cette session.
                Aucun OCR actif.
              </span>
              <a href="/connexion?inscription=1">Créer un vrai compte →</a>
            </div>
          )}
          {message && !selected && (
            <div className="notice" role="status">
              {message}
            </div>
          )}
          {busy && (
            <p role="status" className="loading">
              Traitement en cours…
            </p>
          )}
          <div className="page-title">
            <div>
              <span className="eyebrow">
                {tab === "dashboard"
                  ? "UNE VUE CLAIRE SUR VOTRE ACTIVITÉ"
                  : "VOTRE GESTION AU QUOTIDIEN"}
              </span>
              <h1>{nav.find((n) => n[0] === tab)?.[1]}</h1>
              <p>
                {tab === "dashboard"
                  ? `Bonjour ${name.split(" ")[0] || ""}, voici où en sont vos finances.`
                  : "Retrouvez chaque pièce, chaque détail, chaque action."}
              </p>
            </div>
            {orgId && (
              <button disabled={busy} className="btn primary" onClick={newInvoice}>
                <Plus size={18} /> Nouvelle facture
              </button>
            )}
          </div>
          {!orgId && !busy && (
            <section className="panel">
              <h2>Créons votre espace de travail</h2>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void action(async () => {
                    await module1.createOrganization({
                      name: String(f.get("org")),
                      kind: String(f.get("kind")) as "company" | "accounting_firm",
                    });
                    await load();
                  });
                }}
              >
                <label>
                  Nom de l’organisation
                  <input name="org" required />
                </label>
                <label>
                  Type
                  <select name="kind">
                    <option value="company">Entreprise</option>
                    <option value="accounting_firm">Cabinet comptable</option>
                  </select>
                </label>
                <button className="btn primary" disabled={busy}>
                  Créer mon espace
                </button>
              </form>
            </section>
          )}
          {orgId && tab === "dashboard" && (
            <>
              <div className="stat-grid">
                {[
                  ["Chiffre d’affaires HT", money(stats.revenue), "Ventes validées ou émises"],
                  ["Montants encaissés", money(stats.collected), "Paiements enregistrés"],
                  ["Reste à encaisser TTC", money(stats.outstanding), "Sur les factures de vente"],
                  ["Achats HT", money(stats.purchases), "Pièces validées"],
                ].map(([t, v, s], j) => (
                  <article className="stat-card" key={t}>
                    <span>{t}</span>
                    <div className={"stat-symbol s" + j}>
                      {j === 0 ? "↗" : j === 1 ? "↓" : j === 2 ? "◷" : "↙"}
                    </div>
                    <strong>{v}</strong>
                    <small>{s}</small>
                  </article>
                ))}
              </div>
              <div className="dashboard-middle">
                <section className="panel">
                  <div className="section-top">
                    <div>
                      <h2>Ventes & achats</h2>
                      <p>Montants HT par mois · {new Date().getFullYear()}</p>
                    </div>
                    <span className="legend">
                      ● Ventes <b>● Achats</b>
                    </span>
                  </div>
                  <div className="bar-chart" role="img" aria-label="Ventes et achats HT par mois">
                    {Array.from({ length: 12 }, (_, m) => {
                      const prefix =
                        new Date().getFullYear() + "-" + String(m + 1).padStart(2, "0");
                      const value = metrics(
                        scoped.filter((i) => i.invoice_date?.startsWith(prefix)),
                      );
                      const max = Math.max(stats.revenue, stats.purchases, 1);
                      return (
                        <div className="bar-group" key={m}>
                          <div className="bars">
                            <i
                              title={"Ventes : " + money(value.revenue)}
                              style={{ height: Math.max(2, (value.revenue / max) * 150) + "px" }}
                            />
                            <i
                              title={"Achats : " + money(value.purchases)}
                              style={{ height: Math.max(2, (value.purchases / max) * 150) + "px" }}
                            />
                          </div>
                          <small>
                            {
                              [
                                "Jan",
                                "Fév",
                                "Mar",
                                "Avr",
                                "Mai",
                                "Juin",
                                "Juil",
                                "Août",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Déc",
                              ][m]
                            }
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="review-card">
                  <span className="round-icon">
                    <Check size={24} />
                  </span>
                  <h2>Un regard sur vos pièces</h2>
                  <p>
                    <strong>{stats.pending}</strong> pièce(s) attendent une vérification. Faites
                    avancer votre comptabilité, une facture à la fois.
                  </p>
                  <button className="btn" onClick={() => T("import")}>
                    Voir les pièces <ArrowUpRight size={16} />
                  </button>
                </section>
              </div>
              <section className="panel">
                <div className="section-top">
                  <div>
                    <h2>Dernières factures</h2>
                    <p>Vos pièces les plus récentes</p>
                  </div>
                  <button className="text-btn" onClick={() => T("invoices")}>
                    Tout voir →
                  </button>
                </div>
                {table(scoped.slice(0, 5))}
              </section>
            </>
          )}
          {orgId && ["import", "invoices", "history"].includes(tab) && (
            <>
              {tab === "import" && (
                <section className="panel import-box">
                  <FileUp size={34} />
                  <h2>Vos pièces, au même endroit.</h2>
                  <p>PDF, JPG, PNG ou WebP · 10 Mo maximum par fichier</p>
                  <p className="micro">
                    Aucune extraction automatique : les champs sont à compléter manuellement.
                  </p>
                  <label>
                    Type de document
                    <select
                      value={importKind}
                      onChange={(e) => IK(e.target.value as Invoice["kind"])}
                    >
                      <option value="purchase">Facture d’achat</option>
                      <option value="sale">Facture de vente</option>
                    </select>
                  </label>
                  <label className="btn primary upload-label">
                    Choisir des fichiers
                    <input
                      aria-label="Importer des factures"
                      type="file"
                      multiple
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={(e) => {
                        void upload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </section>
              )}
              <section className="panel">
                <div className="filters">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Rechercher une facture"
                      placeholder="Rechercher un numéro, un tiers, un document…"
                      value={query}
                      onChange={(e) => Q(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrer par statut"
                    value={status}
                    onChange={(e) => ST(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    {Object.entries(labels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Type de facture"
                    value={kind}
                    onChange={(e) => K(e.target.value)}
                  >
                    <option value="">Tous les types</option>
                    <option value="sale">Ventes</option>
                    <option value="purchase">Achats</option>
                  </select>
                  <input
                    aria-label="Filtrer par mois"
                    type="month"
                    value={period}
                    onChange={(e) => PE(e.target.value)}
                  />
                </div>
                {table(filtered)}
              </section>
            </>
          )}
          {tab === "clients" && (
            <section className="panel">
              <h2>Vos entreprises accessibles</h2>
              <p>Les accès sont limités aux organisations auxquelles vous êtes rattaché.</p>
              <div className="client-grid">
                {orgs.map((o) => {
                  const a = invoices.filter((i) => i.organization_id === o.id);
                  const summary = supervision.find((entry) => entry.organization_id === o.id);
                  return (
                    <button
                      className="client-card"
                      key={o.id}
                      onClick={() => {
                        OI(o.id);
                        T("import");
                      }}
                    >
                      <Building2 />
                      <h3>{o.name}</h3>
                      <p>
                        {demo ? metrics(a).pending : summary?.pending ?? "—"} pièces à traiter ·{" "}
                        {demo ? a.filter((i) => i.status === "needs_correction").length : summary?.needs_correction ?? "—"} à corriger
                      </p>
                      <span>Ouvrir le dossier →</span>
                    </button>
                  );
                })}
              </div>
              <h3>Rejoindre une entreprise</h3>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const token = String(new FormData(e.currentTarget).get("token"));
                  void action(async () => {
                    if (demo) throw new Error("Les invitations nécessitent un vrai compte.");
                    const accepted = await module1.accept(token);
                    await load();
                    OI(accepted.organization_id);
                    M("Invitation acceptée.");
                  });
                }}
              >
                <label>
                  Code d’invitation
                  <input name="token" required placeholder="Code transmis par l’entreprise" />
                </label>
                <button disabled={busy} className="btn">
                  Accepter l’invitation
                </button>
              </form>
              {manager && (
                <>
                  <h3>Donner accès à un comptable</h3>
                  <p>
                    Ce code donne un accès comptable à l’entreprise active. Transmettez-le
                    uniquement à votre comptable.
                  </p>
                  <button
                    className="btn"
                    disabled={busy || demo}
                    onClick={() =>
                      void action(async () => {
                        const invitation = await module1.invite(orgId);
                        IN(invitation.token);
                      })
                    }
                  >
                    Créer un code d’invitation
                  </button>
                  {invite && (
                    <p className="notice">
                      Code (valable 7 jours) : <code>{invite}</code>
                    </p>
                  )}
                </>
              )}
            </section>
          )}
          {tab === "profile" && (
            <section className="panel">
              <h2>Informations personnelles</h2>
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    if (!demo) {
                      await module1.saveProfile(name, avatar || null);
                    }
                    M("Profil enregistré" + (demo ? " pour cette session." : "."));
                  });
                }}
              >
                <label>
                  Nom complet
                  <input required value={name} onChange={(e) => N(e.target.value)} />
                </label>
                <label>
                  URL de l’avatar
                  <input type="url" value={avatar} onChange={(e) => AV(e.target.value)} />
                </label>
                <label>
                  Langue
                  <select>
                    <option>Français</option>
                  </select>
                </label>
                <p>Rôle : {role} · Devise : MAD</p>
                <button className="btn primary" disabled={busy}>
                  Enregistrer le profil
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
      {current && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                S(null);
                return;
              }
              if (e.key !== "Tab") return;
              const nodes = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, iframe",
                ),
              ).filter((n) => !n.closest("fieldset:disabled"));
              const first = nodes[0],
                last = nodes[nodes.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }}
            aria-modal="true"
            aria-labelledby="invoice-title"
            className="invoice-modal"
          >
            <header>
              <div>
                <span className="eyebrow">
                  {current.kind === "sale" ? "VENTE" : "ACHAT"} · {labels[current.status]}
                </span>
                <h2 id="invoice-title">{current.invoice_number || "Vérifier la facture"}</h2>
              </div>
              <button
                autoFocus
                className="icon-btn"
                aria-label="Fermer la facture"
                onClick={() => S(null)}
              >
                <X />
              </button>
            </header>
            <div className="invoice-columns">
              <div className="document-preview">
                {preview ? (
                  current.document_name?.toLowerCase().endsWith(".pdf") ? (
                    <iframe title="Document original" src={preview} />
                  ) : (
                    <img src={preview} alt="Document original importé" />
                  )
                ) : (
                  <div className="paper">
                    <span className="brand">{org?.name}</span>
                    <h2>FACTURE</h2>
                    <p>
                      {current.invoice_number || "Brouillon"} · {current.invoice_date}
                    </p>
                    <hr />
                    <h3>{current.counterparty_name || "Client à renseigner"}</h3>
                    {lines.map((l, i) => (
                      <p key={i}>
                        {l.description || "Ligne à compléter"}
                        <strong>{money(l.quantity * l.unit_price)}</strong>
                      </p>
                    ))}
                    <hr />
                    <p>
                      HT <strong>{money(current.subtotal)}</strong>
                    </p>
                    <p>
                      Taxes <strong>{money(current.tax_amount)}</strong>
                    </p>
                    <h3>
                      Total TTC <strong>{money(current.total)}</strong>
                    </h3>
                    <small>
                      {current.document_name
                        ? "Aperçu indisponible : réimportez le fichier dans cette session de démonstration."
                        : "Aperçu de la facture · Ne constitue pas une certification comptable."}
                    </small>
                  </div>
                )}
              </div>
              <div className="invoice-editor">
                {message && (
                  <p className="notice" role="status">
                    {message}
                  </p>
                )}
                <p className="notice subtle">
                  Saisie guidée · Aucun champ n’a été extrait automatiquement.
                </p>
                {problems.length > 0 && (
                  <div className="validation-alert">
                    <strong>Points à vérifier</strong>
                    {problems.map((p) => (
                      <p key={p}>• {p}</p>
                    ))}
                  </div>
                )}
                <fieldset disabled={busy || locked}>
                  <div className="form-grid">
                    <label>
                      Numéro
                      <input
                        required
                        value={current.invoice_number}
                        onChange={(e) => S({ ...current, invoice_number: e.target.value })}
                      />
                    </label>
                    <label>
                      {current.kind === "sale" ? "Client" : "Fournisseur"}
                      <input
                        required
                        value={current.counterparty_name}
                        onChange={(e) => S({ ...current, counterparty_name: e.target.value })}
                      />
                    </label>
                    <label>
                      Date
                      <input
                        type="date"
                        required
                        value={current.invoice_date || ""}
                        onChange={(e) => S({ ...current, invoice_date: e.target.value })}
                      />
                    </label>
                    <label>
                      Échéance
                      <input
                        type="date"
                        required
                        value={current.due_date || ""}
                        onChange={(e) => S({ ...current, due_date: e.target.value })}
                      />
                    </label>
                  </div>
                  <h3>Lignes de la facture</h3>
                  {lines.map((l, i) => (
                    <div className="line-item" key={i}>
                      <label>
                        Désignation
                        <input
                          value={l.description}
                          onChange={(e) =>
                            L((a) =>
                              a.map((x, j) =>
                                j === i ? { ...x, description: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <div className="form-grid three">
                        {[
                          ["quantity", "Qté"],
                          ["unit_price", "Prix HT"],
                          ["tax_rate", "TVA %"],
                        ].map(([key, label]) => (
                          <label key={key}>
                            {label}
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={l[key as keyof Line]}
                              onChange={(e) =>
                                L((a) =>
                                  a.map((x, j) =>
                                    j === i ? { ...x, [key!]: Number(e.target.value) } : x,
                                  ),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        className="text-btn danger"
                        onClick={() => L((a) => a.filter((_, j) => j !== i))}
                      >
                        Supprimer la ligne
                      </button>
                    </div>
                  ))}
                  <button className="btn" onClick={() => L((a) => [...a, newLine()])}>
                    <Plus size={16} /> Ajouter une ligne
                  </button>
                  <label>
                    Notes / correction demandée
                    <textarea
                      value={current.notes}
                      onChange={(e) => S({ ...current, notes: e.target.value })}
                    />
                  </label>
                </fieldset>
                <div className="total-strip">
                  <span>HT {money(current.subtotal)}</span>
                  <span>TVA {money(current.tax_amount)}</span>
                  <strong>TTC {money(current.total)}</strong>
                </div>
                {!locked && (
                  <div className="actions">
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() => void save(current.status)}
                    >
                      Enregistrer
                    </button>
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() => void save("needs_correction")}
                    >
                      Demander une correction
                    </button>
                    {processor && (
                      <button
                        className="btn primary"
                        disabled={busy || problems.length > 0}
                        onClick={() => void save("validated")}
                      >
                        Valider
                      </button>
                    )}
                    {current.kind === "sale" && (
                      <button
                        className="btn primary"
                        disabled={busy || problems.length > 0}
                        onClick={() => void save("issued")}
                      >
                        Émettre la facture
                      </button>
                    )}
                  </div>
                )}
                {current.kind === "sale" && current.status === "validated" && (
                  <button
                    className="btn primary"
                    disabled={busy}
                    onClick={() => void save("issued")}
                  >
                    Émettre pour encaissement
                  </button>
                )}
                {locked && (
                  <p className="micro">Facture finalisée : les champs sont verrouillés.</p>
                )}
                {current.validated_at && (
                  <p className="notice">
                    Validée le {new Date(current.validated_at).toLocaleString("fr-FR")} · Auteur :{" "}
                    {current.validated_by}
                  </p>
                )}
                {current.kind === "sale" &&
                  ["issued", "partially_paid"].includes(current.status) && (
                    <form onSubmit={payment} className="payment-form">
                      <h3>Enregistrer un paiement</h3>
                      <p>Solde TTC : {money(current.total - current.paid_amount)}</p>
                      <div className="form-grid">
                        <label>
                          Montant MAD
                          <input
                            name="amount"
                            required
                            type="number"
                            min="0.01"
                            max={current.total - current.paid_amount}
                            step="0.01"
                          />
                        </label>
                        <label>
                          Date
                          <input name="date" required type="date" defaultValue={today()} />
                        </label>
                      </div>
                      <label>
                        Moyen
                        <select name="method">
                          <option>Virement</option>
                          <option>Chèque</option>
                          <option>Espèces</option>
                        </select>
                      </label>
                      <button disabled={busy} className="btn primary">
                        Enregistrer le paiement
                      </button>
                    </form>
                  )}
                <h3>Historique des actions</h3>
                {events.length ? (
                  events.map((a, i) => (
                    <details key={i}>
                      <summary>
                        {a.action} · {new Date(a.created_at).toLocaleString("fr-FR")}
                      </summary>
                      <small>Auteur : {a.user_id}</small>
                      <pre>{JSON.stringify(a.details, null, 2)}</pre>
                    </details>
                  ))
                ) : (
                  <p className="micro">Aucune modification enregistrée.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function errorText(e: unknown) {
  return e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String(e.message)
      : "Une erreur est survenue. Réessayez.";
}
