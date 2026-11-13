# MedIntel database architecture

## Connected project

- Supabase project ID: `gnrkhekyjhfbisvsxowc`
- Access path: environment variables + `@supabase/ssr` / `@supabase/supabase-js` (MCP not used)

## Entity mapping (app → database)

| Application concept | Database entity | Status |
| --- | --- | --- |
| User profile / role | `profiles` | In `001` (reuse; do not invent parallel `user_profiles`) |
| Organization | `organizations`, `organization_memberships` | In `007` |
| Medical Information inquiries | `medical_inquiries`, `review_decisions`, `audit_events` | In `001`–`002` |
| Evidence library (MI) | `evidence_documents`, `evidence_citations` | In `001` |
| Scientific Intelligence evidence | `si_evidence_documents`, `si_evidence_passages`, … | In `005` |
| Field Medical / MSL readiness | `fm_msl_profiles`, `fm_*` tables | In `003`–`004` |
| Knowledge Network | `knowledge_items`, versions, matches, reuse, review | In `006` |
| Security audit | `security_audit_events` | In `007` |
| Homepage therapeutic areas | `therapeutic_areas` | Prepared in `008` |
| Diagnostics specialty | `scientific_specialties` | Prepared in `008` |
| AI Agent Center runs | `ai_agent_definitions`, `ai_agent_runs`, budgets/events | Prepared in `008` |
| Pharmacovigilance demo | `safety_case_*` | Prepared in `008` |
| Clinical development demo | `clinical_protocols`, `protocol_*` | Prepared in `008` |

## Design rules

- UUID PKs, FKs, timestamps, indexes
- RLS on exposed tables; service role never in the browser
- Reuse existing names (`profiles`, `knowledge_items`, `fm_*`, `si_*`) — no duplicate concept tables
- Synthetic demo data must set `is_demo` / `dataset_source` when present
- Never insert into `auth.users` via SQL seeds
- Formal readiness / knowledge approval remain human-gated in app workflows

## Migration inventory

| File | Purpose | Applied to remote? |
| --- | --- | --- |
| `001_initial_schema.sql` | MI core | **Not yet** (remote empty at last check) |
| `002_rls_policies.sql` | MI RLS | Applied |
| `003_field_medical_schema.sql` | Field Medical | Applied |
| `004_field_medical_rls.sql` | FM RLS | Applied |
| `005_scientific_intelligence.sql` | SI engine | Applied |
| `006_scientific_knowledge_network.sql` | Knowledge Network | Applied |
| `007_enterprise_security_foundation.sql` | Orgs + security audit | Applied |
| `008_database_foundation_alignment.sql` | Taxonomy, AI, PV, clinical demo | Applied |
| `009_api_role_grants.sql` | API role GRANTs | Applied |

## Next steps after secure apply path

1. Apply `001`→`008` in order via Dashboard SQL Editor
2. Seed synthetic org/personnel in a dedicated seed migration
3. Generate TypeScript types from live schema
4. Point dashboards at RLS-scoped queries with explicit empty/error states
