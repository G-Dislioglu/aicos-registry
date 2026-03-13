# Studio Dossier Summary Report

## Dossier Metadata

- Dossier ID: `studio-dossier-contradiction-001`
- Title: Contradiction review dossier for bounded evidence hold posture
- Topic: contradiction review keeps provider convergence advisory and evidence-incomplete
- Scope: `local_human_review_only`

## Source Packet Summary

The source packet records a contradiction about provider convergence and keeps the case bounded, conflict-visible, and unsuitable for silent escalation.

## Included Proposal Artifacts

- `proposal_artifact` — `examples/studio/scenarios/contradiction-to-review/proposal.artifact.json`

## Included Review Records

- `examples/studio/scenarios/contradiction-to-review/review-record.hold.json`

## Included Gate Reports

- `examples/studio/scenarios/contradiction-to-review/gate-report.soft-fail.json`

## Bundle Context

- Bundle Manifest: none
- Summary: No bundle manifest is attached; the dossier remains a local contradiction review set only.

## Gate Outcomes

- `gate-contradiction-review-001` — `evidence_gate` => `soft_fail` on `examples/studio/scenarios/contradiction-to-review/proposal.artifact.json` (`not_required`)

## Recommended Human Next Step

- `retain_in_review_layer`

## Forbidden Automated Next Steps

- `runtime_review_object_creation`
- `truth_mutation`
- `card_write`
- `index_write`
- `alias_write`
- `auto_forwarding`
- `provider_execution`

## Boundary Flags

- Proposal Only: `true`
- No Truth Mutation: `true`
- No Runtime Write: `true`
