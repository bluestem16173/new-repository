# AI security architecture

The existing central registry defines fifteen agent cards. Their actual implemented paths are deterministic synthetic retrieval, templates, simulations and dashboards, with additional planned capabilities. No paid model was invoked for this repair.

Agent status labels now map existing registry metadata to **Demonstration only**, **Configured but unavailable**, and **Not implemented**. No agent is labeled operational solely because a route exists.

The server gateway retains an allowlist and request validation. It now refuses every live model/non-demo request: provider execution, durable per-user/per-organization quotas, atomic budget reservations and authoritative token/cost accounting are not implemented. Setting an environment mode or a BYOK secret-reference flag is insufficient to enable live calls. Synthetic estimates must not be interpreted as provider bills.

A future provider adapter must resolve identity and tenant from the verified session, authorize the selected agent/purpose, reserve a durable quota before execution, enforce a fixed model/tool allowlist, meter actual tokens/costs and release or settle the reservation atomically. Client-supplied IDs are not an authorization source. Never allow LLM-generated SQL or unrestricted tools; retrieve through scoped parameterized queries/RPCs. Human review remains required for scientific external use and consequential readiness decisions.

API keys belong in server-managed secret storage, not browser state, NEXT_PUBLIC variables, ordinary data tables or logs. KOL discussions and inquiry content remain potentially confidential. Existing audit metadata filtering is not a comprehensive redaction system; do not place raw conversations/prompts in metadata. Supabase-mode security-audit insertion now uses the user-scoped client; full audit immutability and tenant boundaries still require staging verification.

No HIPAA, SOC 2 or enterprise compliance certification is claimed.
