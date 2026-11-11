import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.main import prototype_app as app, db

@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    def test_db():
        with factory() as session:
            yield session
    app.dependency_overrides[db] = test_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()

def account(client, email):
    response = client.post("/auth/register", json={"email": email, "password": "fictif-mot-de-passe", "full_name": "Compte fictif"})
    assert response.status_code == 201, response.text
    return {"Authorization": "Bearer " + response.json()["access_token"]}

def organization(client, headers, name):
    response = client.post("/organizations", headers=headers, json={"name": name, "kind": "company"})
    assert response.status_code == 201, response.text
    return response.json()["id"]

def test_two_accounts_are_isolated_and_invitations_are_single_use(client):
    alice = account(client, "alice@example.test")
    bob = account(client, "bob@example.test")
    org_a = organization(client, alice, "Organisation A")
    org_b = organization(client, bob, "Organisation B")
    assert [o["id"] for o in client.get("/organizations", headers=alice).json()] == [org_a]
    assert [o["id"] for o in client.get("/organizations", headers=bob).json()] == [org_b]
    assert client.get(f"/organizations/{org_b}", headers=alice).status_code == 403
    assert client.get(f"/organizations/{org_a}/members", headers=bob).status_code == 403
    assert client.post(f"/organizations/{org_a}/invitations", headers=bob).status_code == 403
    assert [o["id"] for o in client.get("/supervision", headers=alice).json()["organizations"]] == [org_a]
    invitation = client.post(f"/organizations/{org_a}/invitations", headers=alice).json()["token"]
    assert client.post("/invitations/accept", headers=bob, json={"token": invitation}).status_code == 200
    assert client.post("/invitations/accept", headers=bob, json={"token": invitation}).status_code == 400
    assert client.get(f"/organizations/{org_a}", headers=bob).status_code == 200
    assert client.post(f"/organizations/{org_a}/invitations", headers=bob).status_code == 403
    bob_id = client.get("/me", headers=bob).json()["id"]
    assert client.patch(f"/organizations/{org_a}/members/{bob_id}", headers=bob, json={"role": "company_owner"}).status_code == 403
    assert client.get(f"/organizations/{org_b}", headers=alice).status_code == 403

def test_authentication_and_logout(client):
    headers = account(client, "alice@example.test")
    assert client.get("/me").status_code == 401
    assert client.post("/auth/login", json={"email": "alice@example.test", "password": "wrong-password"}).status_code == 401
    assert client.get("/auth/session", headers=headers).status_code == 200
    assert client.post("/auth/logout", headers=headers).status_code == 204
    assert client.get("/auth/session", headers=headers).status_code == 401
    assert client.post("/auth/login", json={"email": "alice@example.test", "password": "fictif-mot-de-passe"}).status_code == 200
