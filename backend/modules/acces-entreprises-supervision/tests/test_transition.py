import httpx
import pytest
from fastapi.testclient import TestClient
from app import transition

A = "00000000-0000-0000-0000-000000000001"
B = "00000000-0000-0000-0000-000000000002"

@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://local.example.test")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "public-test-key")
    def upstream(req):
        token = req.headers.get("authorization")
        uid = {"Bearer fictif-a": A, "Bearer fictif-b": B}.get(token)
        if not uid: return httpx.Response(401)
        if req.url.path == "/auth/v1/user": return httpx.Response(200, json={"id": uid})
        if "/rpc/" in req.url.path:
            import json
            org = json.loads(req.content)["_organization_id"]
            return httpx.Response(200, json=org == uid)
        if req.url.path == "/rest/v1/organizations":
            return httpx.Response(200, json=[{"id": uid, "name": "Fictive", "kind": "company"}])
        if req.url.path == "/rest/v1/invoices":
            assert req.url.params["organization_id"] == "eq." + uid
            return httpx.Response(200, json=[{"status": "needs_review"}])
        if req.url.path == "/rest/v1/organization_members":
            assert req.url.params["organization_id"] == "eq." + uid
            return httpx.Response(200, json=[{"user_id": uid, "role": "company_owner"}])
        raise AssertionError(req.url)
    monkeypatch.setattr(transition, "upstream_client", lambda **kwargs: httpx.Client(transport=httpx.MockTransport(upstream), **kwargs))
    with TestClient(transition.app) as client:
        yield client

def test_single_identity_and_forbidden_access(client):
    for token, own, other in (("fictif-a", A, B), ("fictif-b", B, A)):
        headers = {"Authorization": "Bearer " + token}
        assert client.get("/organizations", headers=headers).json()[0]["id"] == own
        assert client.get(f"/organizations/{own}/members", headers=headers).status_code == 200
        assert client.get(f"/organizations/{other}/members", headers=headers).status_code == 403
        assert client.post(f"/organizations/{other}/invitations", headers=headers).status_code == 403
        assert client.get(f"/organizations/{other}/permissions", headers=headers).status_code == 403
        assert client.patch(f"/organizations/{other}/members/{own}", headers=headers, json={"role": "firm_manager"}).status_code == 403
        assert client.get("/supervision", headers=headers).json() == [{"organization_id": own, "pending": 1, "needs_correction": 0}]

def test_prototype_registration_is_not_exposed(client):
    assert client.post("/auth/register", json={}).status_code == 404
    assert client.post("/auth/login", json={}).status_code == 404
    assert client.get("/organizations").status_code == 401
    assert client.get("/organizations", headers={"Authorization": "Bearer unknown"}).status_code == 401
