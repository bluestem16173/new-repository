# MedIntel Data Classification

## Classes

| Class | Label | Examples | Default searchability |
|---|---|---|---|
| PUBLIC_SCIENTIFIC | `public_scientific` | Published literature metadata, public trial references, synthetic teaching corpus labeled as such | Broad authenticated read |
| INTERNAL_APPROVED | `internal_approved` | Approved reusable knowledge items, internal educational content within scope | Shared Knowledge Network after human approval |
| RESTRICTED | `restricted` | Raw MSL–KOL inquiries, unpublished evidence, SI response drafts, potential safety reports, proprietary ops | Owner/assignee/privileged roles only; **not** shared knowledge search |

## Enforcement points

- Schema columns added in `007_enterprise_security_foundation.sql`.
- Knowledge approval trigger rejects publishing `restricted` classification as reusable knowledge.
- Application helper: `canEnterSharedKnowledgeNetwork()` in `src/domain/security/data-classification.ts`.
- Matching services search **approved** knowledge items only (internal_approved intent).

## Separation rule

Original restricted field/MI inquiries remain separate entities from approved reusable scientific content. Similarity never equals approval.
