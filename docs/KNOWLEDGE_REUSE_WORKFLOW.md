# Scientific Knowledge Network

The existing implementation is a deterministic synthetic workflow. This repair does not claim database-backed knowledge matching or validated historical ROI. Supabase-mode access to its synthetic stores now fails explicitly.

## Implemented local safeguards

1. Inquiry intake uses the existing Medical Information workflow.
2. Keyword retrieval filters suggestions to approved, current knowledge. Expired/outdated/unknown/pending content is excluded from reuse suggestions. Review browsing can still inspect other statuses separately.
3. Title/question/metadata overlap ranks scientific similarity. It never grants clinical applicability or authorization to send a response.
4. Evidence identifiers and passages come from existing linked corpus records. No new scientific citations were invented or ingested.
5. Accepted/adapted reuse requires approved current content, a linked accessible inquiry and verification notes. A supplied match must reference the same inquiry and item. The same inquiry/item cannot be accepted/adapted twice within the demo store.
6. Authors cannot approve their own knowledge items. A human review role is required; no AI score grants approval or readiness.
7. Standalone item pages explain that accepted/adapted reuse must originate from a linked inquiry; buttons remain disabled until inquiry context and verification notes exist.

## Incomplete operational implementation

Knowledge services still use process memory, without durable transactions, complete tenant columns/authorization or unique database reuse enforcement. No production knowledge search RPC or embedding provider was configured. Synthetic writes never receive real authenticated records after the new adapter guards.

Current leadership analytics include scenario assumptions and search-event proxies. They are not actual inquiry totals or realized savings. The actual full duration model (baseline, search, verification, adaptation, additional review) is not fully collected by the current schema/UI and requires further work. Do not interpret search hits or viewed/rejected/escalated matches as validated reuse. Do not treat equivalent labor capacity as cash savings.

Operational target formula remains:

`net minutes = baseline research - search - verification - adaptation - additional review`

`equivalent labor capacity value = net hours × configured loaded hourly labor cost`

A durable implementation must deduplicate on the authoritative inquiry/item/version event, retain human applicability decisions and scope, derive counts from real inquiries, and link every metric to its underlying records. Negative recovered time must remain negative rather than being hidden. Approval/review dates and currency must be enforceable server-side.

## Tests and limits

Local tests cover related/unrelated keyword questions, current/approved filtering, self-approval prevention, duplicate accepted/adapted events, outdated adaptation, consistent linkage guards and blocking synthetic stores in configured mode. Cross-organization and restricted-inquiry RLS tests against Supabase remain blocked. The demo inquiry access check is not evidence of remote RLS.
