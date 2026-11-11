import { beforeEach, describe, expect, it, vi } from "vitest";
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession } } }));
import { module1 } from "@/lib/module1-api";

describe("Module 1 FastAPI client", () => {
  beforeEach(() => { vi.unstubAllGlobals(); getSession.mockReset(); });
  it("reuses the common session for both fictitious users", async () => {
    for (const token of ["fictif-a", "fictif-b"]) {
      getSession.mockResolvedValue({ data: { session: { access_token: token } }, error: null });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: token }] });
      vi.stubGlobal("fetch", fetchMock);
      expect(await module1.organizations()).toEqual([{ id: token }]);
      expect(fetchMock).toHaveBeenCalledWith("/api/module1/organizations", expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${token}` }) }));
    }
  });
  it("surfaces forbidden access without retrying against Supabase", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "fictif-a" } }, error: null });
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    vi.stubGlobal("fetch", fetchMock);
    await expect(module1.members("organisation-b")).rejects.toThrow("accès");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not send a request without a session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(module1.organizations()).rejects.toThrow("session");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
