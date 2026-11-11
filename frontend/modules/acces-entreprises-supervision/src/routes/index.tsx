import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCheck,
  FileUp,
  ChartNoAxesCombined,
  ShieldCheck,
  Layers,
  Building2,
} from "lucide-react";
import illustration from "@/assets/flow-illustration.jpg";
export const Route = createFileRoute("/")({ component: Home });
function Home() {
  return (
    <div className="finance landing">
      <nav className="public-nav">
        <a className="brand" href="/">
          <Layers /> mizane<span>Finance & comptabilité</span>
        </a>
        <div>
          <a href="#parcours">Comment ça marche</a>
          <a href="/connexion">Se connecter</a>
          <a className="btn primary" href="/connexion?inscription=1">
            Créer mon espace <ArrowRight size={16} />
          </a>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">POUR LES ENTREPRISES ET CABINETS AU MAROC</span>
            <h1>
              Vos factures en ordre.
              <br />
              <em>
                Votre activité
                <br />
                en clair.
              </em>
            </h1>
            <p>
              De la première facture aux comptes validés, gardez le fil de vos finances. Un espace
              partagé avec votre comptable, pensé pour avancer ensemble.
            </p>
            <div className="actions">
              <a className="btn primary" href="/connexion?inscription=1">
                Commencer <ArrowRight size={18} />
              </a>
              <a className="btn" href="/demo">
                Explorer la démonstration
              </a>
            </div>
            <p className="micro">
              <ShieldCheck size={16} /> Des documents privés. Des accès par entreprise.
            </p>
          </div>
          <div className="hero-visual">
            <div className="visual-label">
              <span className="dot" /> DU DOCUMENT À LA DÉCISION
            </div>
            <img src={illustration} alt="Des documents vers un tableau de bord financier" />
            <div className="visual-note">
              <CheckCheck />
              <div>
                <strong>Chaque pièce trouve sa place.</strong>
                <span>Importez. Vérifiez. Avancez.</span>
              </div>
            </div>
          </div>
        </section>
        <section className="steps" id="parcours">
          <div className="section-top">
            <div>
              <span className="eyebrow">UN PARCOURS SIMPLE</span>
              <h2>Moins de saisie. Plus de visibilité.</h2>
            </div>
            <p>
              Tout votre suivi financier,
              <br />
              dans un seul espace.
            </p>
          </div>
          <div className="step-grid">
            {[
              [FileUp, "01", "Importer", "Déposez vos factures PDF ou images."],
              [ShieldCheck, "02", "Contrôler", "Complétez les données et repérez les anomalies."],
              [CheckCheck, "03", "Valider", "Votre comptable vérifie chaque pièce."],
              [ChartNoAxesCombined, "04", "Suivre", "Retrouvez vos ventes, achats et paiements."],
            ].map(([Icon, n, t, d]) => {
              const I = Icon as typeof FileUp;
              return (
                <article key={String(n)}>
                  <div className="step-icon">
                    <I size={23} />
                    <span>{String(n)}</span>
                  </div>
                  <h3>{String(t)}</h3>
                  <p>{String(d)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="audiences">
          <div>
            <Building2 />
            <h2>
              Votre entreprise,
              <br />
              une vue d’ensemble.
            </h2>
            <p>Facturez, rassemblez vos pièces et suivez vos encaissements.</p>
            <a href="/connexion?inscription=1">
              Espace entreprise <ArrowRight size={16} />
            </a>
          </div>
          <div>
            <Layers />
            <h2>
              Votre cabinet,
              <br />
              un travail mieux organisé.
            </h2>
            <p>Retrouvez les dossiers clients et les pièces à valider.</p>
            <a href="/connexion?inscription=1&cabinet=1">
              Espace cabinet comptable <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="/">
          mizane
        </a>
        <span>La clarté, au quotidien. · Montants en MAD</span>
      </footer>
    </div>
  );
}
