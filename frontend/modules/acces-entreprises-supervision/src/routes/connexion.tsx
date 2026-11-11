import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
export const Route = createFileRoute("/connexion")({ component: ConnexionPage });
function ConnexionPage() {
  const [isSigningUp, setIsSigningUp] = useState(false),
    [isSubmitting, setIsSubmitting] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => setIsSigningUp(location.search.includes("inscription")), []);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    try {
      const email = String(formData.get("email")),
        password = String(formData.get("password"));
      if (isSigningUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(formData.get("name")), workspace_kind: String(formData.get("kind")) },
            emailRedirectTo: location.origin + "/espace",
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Consultez votre e-mail pour confirmer votre compte, puis connectez-vous.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      location.assign("/espace");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="finance auth-page">
      <a className="brand" href="/">
        ◈ mizane
      </a>
      <section className="panel auth-card">
        <span className="eyebrow">VOTRE ESPACE FINANCIER</span>
        <h1>{isSigningUp ? "Bienvenue chez vous." : "Heureux de vous retrouver."}</h1>
        <p>Entreprises et comptables, avançons ensemble.</p>
        <div className="tabs">
          <button onClick={() => setIsSigningUp(false)} className={!isSigningUp ? "active" : ""}>
            Connexion
          </button>
          <button onClick={() => setIsSigningUp(true)} className={isSigningUp ? "active" : ""}>
            Inscription
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {isSigningUp && (
            <>
              <label>
                Nom complet
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                Type d’espace
                <select
                  name="kind"
                  defaultValue={
                    typeof window !== "undefined" && location.search.includes("cabinet")
                      ? "accounting_firm"
                      : "company"
                  }
                >
                  <option value="company">Entreprise</option>
                  <option value="accounting_firm">Cabinet comptable</option>
                </select>
              </label>
            </>
          )}
          <label>
            E-mail
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete={isSigningUp ? "new-password" : "current-password"}
            />
          </label>
          <button className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? "Veuillez patienter…" : isSigningUp ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>
        <button
          className="btn"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: location.origin + "/espace",
              });
              if (result.error) throw result.error;
              if (!result.redirected) location.assign("/espace");
            } catch (e) {
              setMessage(String(e));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          Continuer avec Google
        </button>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <a href="/demo">Découvrir sans créer de compte →</a>
      </section>
    </main>
  );
}
