import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated")({ component: SessionGate });
function SessionGate() {
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user) location.replace("/connexion");
        else setSessionVerified(true);
      })
      .catch(() => {
        if (active) setSessionError("Impossible de vérifier votre session. Actualisez la page.");
      });
    return () => {
      active = false;
    };
  }, []);
  return sessionVerified ? (
    <Outlet />
  ) : (
    <main className="finance auth-page" role="status">
      {sessionError || "Vérification de votre session…"}
    </main>
  );
}
