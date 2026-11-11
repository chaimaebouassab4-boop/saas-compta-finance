"""Module 1 API, isolated from the existing Supabase application."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from typing import Literal
import bcrypt
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession
from .database import database_url, make_session_factory
from .models import User, Organization, Membership, Session, Invitation, now

app = FastAPI(title="Mizane - module 1 (prototype, tests uniquement)")
_factory = None

def db():
    global _factory
    if _factory is None:
        _factory = make_session_factory(database_url())
    with _factory() as session:
        yield session

def digest(token: str) -> str:
    return sha256(token.encode()).hexdigest()

def valid_time(value: datetime) -> bool:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value > now()

def identity(authorization: str | None = Header(default=None), session: DbSession = Depends(db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentification requise")
    saved = session.get(Session, digest(authorization[7:]))
    if not saved or not valid_time(saved.expires_at):
        raise HTTPException(401, "Session invalide ou expirée")
    user = session.get(User, saved.user_id)
    if not user:
        raise HTTPException(401, "Session invalide")
    return user

def member(session: DbSession, org_id: str, user: User, manager=False):
    membership = session.get(Membership, (org_id, user.id))
    if not membership or (manager and membership.role not in ("company_owner", "firm_manager")):
        raise HTTPException(403, "Accès interdit")
    return membership

def user_data(user):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "avatar_url": user.avatar_url}

def org_data(org, role):
    return {"id": org.id, "name": org.name, "kind": org.kind, "role": role}

def issue_session(session, user):
    token = token_urlsafe(32)
    session.add(Session(token_hash=digest(token), user_id=user.id, expires_at=now() + timedelta(hours=8)))
    session.commit()
    return {"access_token": token, "token_type": "bearer", "user": user_data(user)}

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=72)

class Registration(Credentials):
    full_name: str = Field(min_length=1, max_length=150)

class OrgIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    kind: Literal["company", "accounting_firm"]

class ProfileIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=2048)

class InviteIn(BaseModel):
    token: str = Field(min_length=1, max_length=200)

class RoleIn(BaseModel):
    role: Literal["accountant", "firm_manager", "company_owner"]

@app.post("/auth/register", status_code=201)
def register(body: Registration, session: DbSession = Depends(db)):
    email = body.email.strip().lower()
    if "@" not in email or len(body.password.encode()) > 72 or not body.full_name.strip():
        raise HTTPException(422, "Données invalides")
    user = User(email=email, full_name=body.full_name.strip(), password_hash=bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode())
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "Compte déjà existant")
    return issue_session(session, user)

@app.post("/auth/login")
def login(body: Credentials, session: DbSession = Depends(db)):
    user = session.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or len(body.password.encode()) > 72 or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Identifiants invalides")
    return issue_session(session, user)

@app.get("/auth/session")
@app.get("/me")
def me(user: User = Depends(identity)):
    return user_data(user)

@app.post("/auth/logout", status_code=204)
def logout(authorization: str = Header(), user: User = Depends(identity), session: DbSession = Depends(db)):
    saved = session.get(Session, digest(authorization[7:]))
    session.delete(saved)
    session.commit()

@app.patch("/me")
def profile(body: ProfileIn, user: User = Depends(identity), session: DbSession = Depends(db)):
    if not body.full_name.strip(): raise HTTPException(422, "Nom requis")
    user.full_name, user.avatar_url = body.full_name.strip(), body.avatar_url
    session.commit()
    return user_data(user)

@app.post("/organizations", status_code=201)
def create_org(body: OrgIn, user: User = Depends(identity), session: DbSession = Depends(db)):
    if not body.name.strip(): raise HTTPException(422, "Nom requis")
    org = Organization(name=body.name.strip(), kind=body.kind, owner_id=user.id)
    session.add(org)
    session.flush()
    role = "company_owner" if org.kind == "company" else "firm_manager"
    session.add(Membership(organization_id=org.id, user_id=user.id, role=role))
    session.commit()
    return org_data(org, role)

@app.get("/organizations")
def list_orgs(user: User = Depends(identity), session: DbSession = Depends(db)):
    rows = session.execute(select(Organization, Membership.role).join(Membership, Membership.organization_id == Organization.id).where(Membership.user_id == user.id)).all()
    return [org_data(org, role) for org, role in rows]

@app.get("/organizations/{org_id}")
def get_org(org_id: str, user: User = Depends(identity), session: DbSession = Depends(db)):
    membership = member(session, org_id, user)
    return org_data(session.get(Organization, org_id), membership.role)

@app.get("/organizations/{org_id}/members")
def members(org_id: str, user: User = Depends(identity), session: DbSession = Depends(db)):
    member(session, org_id, user, manager=True)
    rows = session.execute(select(User, Membership.role).join(Membership, Membership.user_id == User.id).where(Membership.organization_id == org_id)).all()
    return [{**user_data(person), "role": role} for person, role in rows]

@app.patch("/organizations/{org_id}/members/{user_id}")
def change_role(org_id: str, user_id: str, body: RoleIn, user: User = Depends(identity), session: DbSession = Depends(db)):
    member(session, org_id, user, manager=True)
    org = session.get(Organization, org_id)
    target = session.get(Membership, (org_id, user_id))
    if not target: raise HTTPException(404, "Membre introuvable")
    if user_id == org.owner_id or body.role == "company_owner" or (body.role == "firm_manager" and org.kind != "accounting_firm"):
        raise HTTPException(403, "Modification de rôle non autorisée")
    target.role = body.role
    session.commit()
    return {"user_id": user_id, "role": target.role}

@app.post("/organizations/{org_id}/invitations", status_code=201)
def invite(org_id: str, user: User = Depends(identity), session: DbSession = Depends(db)):
    member(session, org_id, user, manager=True)
    token = token_urlsafe(32)
    expires = now() + timedelta(days=7)
    session.add(Invitation(token_hash=digest(token), organization_id=org_id, invited_by=user.id, expires_at=expires, accepted=False))
    session.commit()
    return {"token": token, "expires_at": expires}

@app.post("/invitations/accept")
def accept(body: InviteIn, user: User = Depends(identity), session: DbSession = Depends(db)):
    key = digest(body.token)
    result = session.execute(update(Invitation).where(Invitation.token_hash == key, Invitation.accepted == False, Invitation.expires_at > now()).values(accepted=True))
    if result.rowcount != 1:
        session.rollback()
        raise HTTPException(400, "Invitation invalide, expirée ou déjà utilisée")
    invitation = session.get(Invitation, key)
    existing = session.get(Membership, (invitation.organization_id, user.id))
    if not existing:
        existing = Membership(organization_id=invitation.organization_id, user_id=user.id, role="accountant")
        session.add(existing)
    session.commit()
    return {"organization_id": invitation.organization_id, "role": existing.role}

@app.get("/supervision")
def supervision(user: User = Depends(identity), session: DbSession = Depends(db)):
    # Invoice indicators are supplied later by module 3; never invent financial data.
    return {"organizations": list_orgs(user, session), "indicators": None}

# The production entry point never exposes the independent prototype identity.
prototype_app = app
from .transition import app  # noqa: E402,F811
