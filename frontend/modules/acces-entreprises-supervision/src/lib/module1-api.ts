import { supabase } from "@/integrations/supabase/client";

export type Organization = { id: string; name: string; kind: "company" | "accounting_firm" };
export type Supervision = { organization_id: string; pending: number; needs_correction: number };

export async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  // Auth stays common until the other modules migrate. No second identity/token store.
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const response = await fetch(`/api/module1${path}`, {
    method,
    headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Votre session a expiré. Reconnectez-vous.");
    if (response.status === 403) throw new Error("Vous n’avez pas accès à cette organisation ou à cette action.");
    throw new Error("Le service est indisponible ou l’opération a été refusée.");
  }
  return response.json();
}

export const module1 = {
  organizations: () => request<Organization[]>("/organizations"),
  createOrganization: (body: { name: string; kind: Organization["kind"] }) => request("/organizations", "POST", body),
  permissions: (id: string) => request<{ manager: boolean; processor: boolean; role: string | null }>(`/organizations/${id}/permissions`),
  members: (id: string) => request<{ user_id: string; role: string }[]>(`/organizations/${id}/members`),
  changeRole: (id: string, user: string, role: "accountant" | "firm_manager") => request(`/organizations/${id}/members/${user}`, "PATCH", { role }),
  invite: (id: string) => request<{ token: string }>(`/organizations/${id}/invitations`, "POST"),
  accept: (token: string) => request<{ organization_id: string }>("/invitations/accept", "POST", { token }),
  profile: () => request<{ full_name: string; avatar_url: string | null }>("/me"),
  saveProfile: (full_name: string, avatar_url: string | null) => request("/me", "PATCH", { full_name, avatar_url }),
  supervision: () => request<Supervision[]>("/supervision"),
};
