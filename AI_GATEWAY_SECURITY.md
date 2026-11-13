# AI Gateway Security

## Principle

Browser clients must not call LLM providers directly. All agent inference goes through server-side `authorizeAiGatewayRequest`.

## Modes

| Mode | Credentials | Notes |
|---|---|---|
| DEMO | None from visitors | Synthetic/cached responses; tight per-user and global quotas |
| BYOK | Server secret reference or session-scoped server credential | Never store raw keys in `localStorage`; never log keys |
| ENTERPRISE | Org-managed credentials | Budgets, allowlists, role permissions (scaffolded) |

Set `MEDINTEL_AI_MODE=demo|byok|enterprise`.

## Controls implemented

- Model allowlist
- Per-user daily request quota
- Global daily request quota
- Input size caps (Zod)
- Cost **estimate** logging (explicitly not a hard billing guarantee)
- Fail-closed on quota/model denial
- Security audit events without prompts/secrets

## Provider-side safeguards (required operationally)

Configure provider billing caps, project budgets, and key rotation outside the app. Application estimates alone are insufficient.

## Prompt-injection posture

Retrieved literature and KOL notes are untrusted. Matching/retrieval return structured Zod-validated results; LLMs must not execute SQL or approve scientific content. Provisional outputs require human review.
