"""Run existing Supabase SQL migrations in a disposable local PostgreSQL cluster.
No production DB is used. Requires PG_BIN. Auth/storage stubs are test-only.
"""
import os, socket, subprocess, tempfile
from pathlib import Path

pg = Path(os.environ["PG_BIN"])
root = Path(__file__).resolve().parents[4]
migrations = root / "frontend/modules/acces-entreprises-supervision/drizzle/migrations"
folder = Path(tempfile.mkdtemp(prefix="mizane-pg-test-"))
with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0)); port = sock.getsockname()[1]
def run(name, *args, text=None):
    if name == "pg_ctl.exe":
        with (folder/"control.log").open("a") as output:
            result = subprocess.run([str(pg/name), *args], stdout=output, stderr=output, timeout=60)
        if result.returncode: raise RuntimeError((folder/"control.log").read_text())
        return ""
    result = subprocess.run([str(pg/name), *args], input=text, text=True, encoding="utf-8", errors="replace", capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr)
    return result.stdout
run("initdb.exe", "-D", str(folder/"data"), "-A", "trust", "-U", "test_admin", "--no-locale", "--encoding=UTF8")
started = False
try:
    run("pg_ctl.exe", "-D", str(folder/"data"), "-l", str(folder/"log"), "-o", f"-h 127.0.0.1 -p {port}", "-w", "start")
    started = True
    def sql(text):
        return run("psql.exe", "-X", "-h", "127.0.0.1", "-p", str(port), "-U", "test_admin", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-Atq", text=text)
    sql("""
CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE TABLE auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth,public TO authenticated;
CREATE TABLE storage.objects(bucket_id text,name text);
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
""")
    for migration in sorted(migrations.glob("*.sql")):
        sql(migration.read_text(encoding="utf-8-sig"))
    a="00000000-0000-0000-0000-000000000001"; b="00000000-0000-0000-0000-000000000002"
    sql(f"INSERT INTO auth.users(id) VALUES ('{a}'),('{b}');")
    def scoped(uid, statement):
        return sql(f"SET ROLE authenticated; SET request.jwt.claim.sub='{uid}'; {statement}")
    for uid in (a,b):
        scoped(uid, f"INSERT INTO organizations(id,name,kind,owner_id) VALUES ('{uid}','Fictive','company','{uid}');")
    for own, other in ((a,b),(b,a)):
        assert scoped(own,"SELECT id FROM organizations;").strip() == own
        assert scoped(own,f"SELECT can_manage_organization('{other}');").strip() == 'f'
        assert scoped(own,f"SELECT count(*) FROM organization_members WHERE organization_id='{other}';").strip() == '0'
        try:
            scoped(own,f"SELECT create_organization_invitation('{other}');")
        except RuntimeError:
            pass
        else: raise AssertionError("Foreign invitation allowed")
    token=scoped(a,f"SELECT create_organization_invitation('{a}');").strip()
    assert scoped(b,f"SELECT accept_organization_invitation('{token}');").strip() == a
    assert scoped(b,f"SELECT is_organization_member('{a}');").strip() == 't'
    assert scoped(a,f"SELECT is_organization_member('{b}');").strip() == 'f'
    print("PASS: five migrations, two users/two organizations, isolation, refused invitation, explicit invitation acceptance")
finally:
    if started: run("pg_ctl.exe", "-D", str(folder/"data"), "-m", "fast", "-w", "stop")
    print("Stopped temporary cluster; test files retained at", folder)
