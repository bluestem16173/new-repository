/** Isolated PostgreSQL integration checks. Never connects to a hosted database. */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";

const container = process.env.MEDINTEL_TEST_DB_CONTAINER;
if (!container?.startsWith("medintel-auth-db-verify")) throw new Error("Set MEDINTEL_TEST_DB_CONTAINER to the isolated test container.");
const info = JSON.parse(execFileSync("docker", ["inspect", container], { encoding: "utf8" }))[0];
assert.equal(info.HostConfig.NetworkMode, "none", "Test database must have no network access");
const database = `medintel_auth_verify_${Date.now()}`;
execFileSync("docker", ["exec", container, "createdb", "-U", "postgres", database]);
function sql(query, expectedError) {
  const result = spawnSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-At"], { input: query, encoding: "utf8" });
  if (expectedError) { assert.notEqual(result.status, 0); assert.match(result.stderr, expectedError); return; }
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function asUser(id, query, expectedError) {
  return sql(`begin; select set_config('request.jwt.claim.sub', '${id}', true); set local role authenticated; ${query}; rollback;`, expectedError);
}
const a = "10000000-0000-4000-8000-000000000001";
const b = "10000000-0000-4000-8000-000000000002";
const reviewer = "10000000-0000-4000-8000-000000000003";
const pending = "10000000-0000-4000-8000-000000000004";
const orphan = "10000000-0000-4000-8000-000000000005";
const orgA = "20000000-0000-4000-8000-000000000001";
const orgB = "20000000-0000-4000-8000-000000000002";
const item = "30000000-0000-4000-8000-000000000001";
// These are stand-in test tables on an isolated PostgreSQL instance, not Supabase Auth users.
sql(`do $$ begin
if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
create schema auth; grant usage on schema auth to authenticated, anon;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to authenticated, anon;`);
for (const name of readdirSync("supabase/migrations").sort().filter(n => /^00[1-9]_/.test(n))) sql(readFileSync(`supabase/migrations/${name}`, "utf8"));
sql(`insert into auth.users(id,email) values ('${a}','a@example.invalid'),('${b}','b@example.invalid'),('${reviewer}','reviewer@example.invalid'),('${orphan}','orphan@example.invalid');
insert into public.organizations(id,slug,name) values ('${orgA}','fixture-a','Fixture A'),('${orgB}','fixture-b','Fixture B');
insert into public.profiles(id,email,full_name,role,organization_id) values ('${a}','a@example.invalid','Fixture A','msl','${orgA}'),('${b}','b@example.invalid','Fixture B','msl','${orgB}'),('${reviewer}','reviewer@example.invalid','Reviewer','medical_reviewer','${orgA}');
insert into public.organization_memberships(organization_id,profile_id) values ('${orgA}','${a}'),('${orgB}','${b}'),('${orgA}','${reviewer}');`);
asUser(a, "select count(*) from public.organization_memberships", /infinite recursion/);
console.log("PASS: baseline reproduces recursive membership policy");
for (const name of ["010_identity_and_tenant_guards.sql", "011_registration_profiles.sql"]) sql(readFileSync(`supabase/migrations/${name}`, "utf8"));
assert.match(asUser(a, "select 'visible=' || count(*) from public.organization_memberships"), /visible=1/);
console.log("PASS: membership lookup no longer recurses and shows only self membership");
asUser(a, `update public.profiles set role='admin' where id='${a}'`, /authority fields/);
asUser(a, `update public.profiles set organization_id='${orgB}' where id='${a}'`, /authority fields/);
assert.match(asUser(a, "select 'profiles=' || count(*) from public.profiles"), /profiles=2/);
console.log("PASS: role/tenant escalation denied; other tenant profiles invisible");
// The local stand-in Auth insertion exercises exactly the new-user database trigger.
sql(`insert into auth.users(id,email,raw_user_meta_data) values ('${pending}','pending@example.invalid','{"full_name":"Pending User","role":"admin","organization_id":"${orgA}"}');`);
assert.match(sql(`select role::text || ':' || (organization_id is null)::text from public.profiles where id='${pending}'`), /msl:true/);
assert.match(sql(`select count(*) from public.organization_memberships where profile_id='${pending}'`), /^0$/);
assert.match(asUser(pending, "select 'visible=' || count(*) from public.knowledge_items"), /visible=0/);
console.log("PASS: signup ignores hostile role/tenant metadata and grants no operational access");
const originalProfiles = sql("select count(*) from public.profiles");
for (let pass = 0; pass < 2; pass++) sql(readFileSync("supabase/migrations/012_backfill_pending_profiles.sql", "utf8"));
assert.equal(Number(sql("select count(*) from public.profiles")), Number(originalProfiles) + 1);
assert.match(sql(`select role::text || ':' || (organization_id is null)::text from public.profiles where id='${orphan}'`), /msl:true/);
assert.match(sql(`select count(*) from public.organization_memberships where profile_id='${orphan}'`), /^0$/);
console.log("PASS: missing-profile backfill is idempotent and grants no tenant access");
sql(`insert into public.knowledge_items(id,slug,title,question_summary,therapeutic_area,jurisdiction,applicability_scope,currency_status,owner_profile_id,organization_id) values ('${item}','fixture','Fixture','Question','Oncology','US','Internal','current','${a}','${orgA}');`);
assert.match(asUser(b, "select 'visible=' || count(*) from public.knowledge_items"), /visible=0/);
assert.match(asUser(a, `update public.knowledge_items set status='approved' where id='${item}'`), /UPDATE 0/);
asUser(reviewer, `update public.knowledge_items set owner_profile_id='${reviewer}' where id='${item}'`, /authorship cannot be reassigned/);
console.log("PASS: cross-tenant knowledge access, MSL approval and ownership reassignment denied");
assert.match(asUser(reviewer, `update public.knowledge_items set status='approved' where id='${item}'; select 'status=' || status::text from public.knowledge_items where id='${item}'`), /status=approved/);
console.log("PASS: independent authorized human reviewer can approve");
sql(`insert into public.knowledge_items(slug,title,question_summary,therapeutic_area,jurisdiction,applicability_scope,currency_status,owner_profile_id,organization_id) values ('reviewer-owned','Reviewer fixture','Question','Oncology','US','Internal','current','${reviewer}','${orgA}');`);
asUser(reviewer, "update public.knowledge_items set status='approved' where slug='reviewer-owned'", /Independent authorized/);
console.log("PASS: reviewer cannot approve their own scientific content");
sql(`insert into public.evidence_documents(title,source_name) values ('Fixture document','Synthetic test');
insert into public.medical_inquiries(reference_code,title,question_text,product_name,therapeutic_area,requester_type,requester_name,channel,created_by_id,organization_id)
values ('FIXTURE-A','Fixture A','Internal test question','Synthetic','Oncology','internal','Fixture','portal','${a}','${orgA}'),('FIXTURE-B','Fixture B','Internal test question','Synthetic','Oncology','internal','Fixture','portal','${b}','${orgB}');`);
assert.match(asUser(a, "select 'evidence=' || count(*) from public.evidence_documents"), /evidence=1/);
assert.match(asUser(pending, "select 'evidence=' || count(*) from public.evidence_documents"), /evidence=0/);
assert.match(asUser(reviewer, "select 'inquiries=' || count(*) from public.medical_inquiries"), /inquiries=1/);
assert.match(asUser(reviewer, "update public.medical_inquiries set title='Blocked' where reference_code='FIXTURE-B'"), /UPDATE 0/);
console.log("PASS: pending accounts see no evidence and reviewers cannot read/update another tenant's inquiries");
console.log("All isolated database authentication checks passed.");
