"""User-scoped gateway: one identity and database throughout the transition."""
import os
from uuid import UUID
from typing import Literal
import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Mizane - module 1")

def upstream_client(**kwargs):
    return httpx.Client(**kwargs)

class Gateway:
    def __init__(self, token):
        url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
        if not url or not key:
            raise HTTPException(503, "Configuration du service manquante")
        self.client = upstream_client(base_url=url, headers={"apikey": key, "Authorization": "Bearer " + token}, timeout=15)
        try:
            self.user = self.call("GET", "/auth/v1/user")
        except Exception:
            self.client.close()
            raise
        if not isinstance(self.user, dict) or not self.user.get("id"):
            self.client.close()
            raise HTTPException(401, "Session invalide")

    def call(self, method, path, **kwargs):
        try:
            response = self.client.request(method, path, **kwargs)
        except httpx.RequestError:
            raise HTTPException(503, "Service de données indisponible")
        if response.status_code >= 400:
            code = response.status_code if response.status_code in (400, 401, 403, 404, 409, 422) else 502
            raise HTTPException(code, "Accès refusé ou opération impossible")
        return response.json() if response.content else None

    def rest(self, method, resource, **kwargs):
        return self.call(method, "/rest/v1/" + resource, **kwargs)

    def rpc(self, name, org):
        return self.rest("POST", "rpc/" + name, json={"_organization_id": str(org)})

    def require(self, org, manage=False):
        name = "can_manage_organization" if manage else "is_organization_member"
        if self.rpc(name, org) is not True:
            raise HTTPException(403, "Accès interdit")


def gateway(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:]:
        raise HTTPException(401, "Authentification requise")
    service = Gateway(authorization[7:])
    try:
        yield service
    finally:
        service.client.close()

class OrgIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    kind: Literal["company", "accounting_firm"]

class InviteIn(BaseModel):
    token: UUID

class ProfileIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=2048)

class RoleIn(BaseModel):
    role: Literal["accountant", "firm_manager"]

@app.get("/organizations")
def organizations(g: Gateway = Depends(gateway)):
    return g.rest("GET", "organizations", params={"select": "id,name,kind", "order": "created_at"})

@app.post("/organizations", status_code=201)
def create_org(body: OrgIn, g: Gateway = Depends(gateway)):
    if not body.name.strip(): raise HTTPException(422, "Nom requis")
    return g.rest("POST", "organizations", json={"name": body.name.strip(), "kind": body.kind, "owner_id": g.user["id"]}, headers={"Prefer": "return=representation"})

@app.get("/organizations/{org}/permissions")
def permissions(org: UUID, g: Gateway = Depends(gateway)):
    g.require(org)
    rows = g.rest("GET", "organization_members", params={"select": "role", "organization_id": "eq." + str(org), "user_id": "eq." + g.user["id"]})
    return {"manager": g.rpc("can_manage_organization", org), "processor": g.rpc("can_process_organization_documents", org), "role": rows[0]["role"] if rows else None}

@app.get("/organizations/{org}/members")
def members(org: UUID, g: Gateway = Depends(gateway)):
    g.require(org, True)
    return g.rest("GET", "organization_members", params={"select": "user_id,role", "organization_id": "eq." + str(org)})

@app.patch("/organizations/{org}/members/{user_id}")
def role(org: UUID, user_id: UUID, body: RoleIn, g: Gateway = Depends(gateway)):
    g.require(org, True)
    rows = g.rest("GET", "organizations", params={"select": "owner_id,kind", "id": "eq." + str(org)})
    if not rows or rows[0]["owner_id"] == str(user_id) or (body.role == "firm_manager" and rows[0]["kind"] != "accounting_firm"):
        raise HTTPException(403, "Modification de rôle interdite")
    result = g.rest("PATCH", "organization_members", params={"organization_id": "eq." + str(org), "user_id": "eq." + str(user_id)}, json={"role": body.role}, headers={"Prefer": "return=representation"})
    if not result: raise HTTPException(404, "Membre introuvable")
    return result

@app.post("/organizations/{org}/invitations", status_code=201)
def invitation(org: UUID, g: Gateway = Depends(gateway)):
    g.require(org, True)
    return {"token": g.rpc("create_organization_invitation", org)}

@app.post("/invitations/accept")
def accept(body: InviteIn, g: Gateway = Depends(gateway)):
    return {"organization_id": g.rest("POST", "rpc/accept_organization_invitation", json={"_token": str(body.token)})}

@app.get("/me")
def profile(g: Gateway = Depends(gateway)):
    rows = g.rest("GET", "profiles", params={"select": "full_name,avatar_url", "user_id": "eq." + g.user["id"]})
    return rows[0] if rows else {"full_name": g.user.get("user_metadata", {}).get("full_name", ""), "avatar_url": None}

@app.patch("/me")
def update_profile(body: ProfileIn, g: Gateway = Depends(gateway)):
    return g.rest("POST", "profiles", params={"on_conflict": "user_id"}, json={"user_id": g.user["id"], "full_name": body.full_name, "avatar_url": body.avatar_url, "preferences": {"language": "fr", "currency": "MAD"}}, headers={"Prefer": "resolution=merge-duplicates,return=representation"})

@app.get("/supervision")
def supervision(g: Gateway = Depends(gateway)):
    # Read-only projection; existing RLS filters invoices using the same identity.
    orgs = organizations(g)
    result = []
    for org in orgs:
        g.require(UUID(org["id"]))
        rows = g.rest("GET", "invoices", params={"select": "status", "organization_id": "eq." + org["id"]})
        result.append({"organization_id": org["id"], "needs_correction": sum(r["status"] == "needs_correction" for r in rows), "pending": sum(r["status"] in ("imported", "needs_review", "needs_correction") for r in rows)})
    return result
