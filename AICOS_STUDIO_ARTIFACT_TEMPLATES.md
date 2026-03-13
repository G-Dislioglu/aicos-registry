# AICOS Studio Artifact Templates

## Status

This document defines repo-near templates for bounded AICOS Studio artifacts.
These templates standardize proposal-layer outputs.
They do not define runtime execution, truth mutation, or provider orchestration.

## Purpose

The purpose of these templates is to make later Studio outputs easier to read, compare, and gate.
They provide a stable artifact family without turning formatting into authority.

## Template 1 — Conversation artifact

### Purpose

A conversation artifact preserves what happened during a Studio discussion before deeper distillation or handoff.
It is a trace artifact, not a truth artifact.

### Required fields

- `topic`
- `participants`
- `source_mode`
- `conversation_scope`
- `turn_summary`
- `claim_status`
- `evidence_status`
- `challenge_status`
- `open_conflicts`
- `proposal_status`

### Optional fields

- `packet_id`
- `created_at`
- `source_refs`
- `moderator_notes`
- `observer_notes`
- `challenge_notes`
- `user_gate_decision`

### Forbidden content

- direct card write instructions
- direct `index/INDEX.json` mutation instructions
- direct `index/ALIASES.json` mutation instructions
- runtime review object creation instructions
- claims that provider agreement is canon truth
- implied auto-promotion language

### Truth/proposal status

This artifact is conversation-layer and proposal-adjacent only.
It is not registry truth and not a runtime review object.

### Allowed next destinations

- studio intake packet
- proposal artifact
- reference artifact
- archived conversation-only retention

### Forbidden destinations

- registry truth
- runtime review object
- direct index mutation
- direct alias mutation

## Template 2 — Proposal artifact

### Purpose

A proposal artifact distills the strongest bounded candidate that emerged from Studio work.
It is used to carry a proposal forward without implying canonization.

### Required fields

- `topic`
- `participants`
- `proposal_type`
- `claim_status`
- `evidence_status`
- `challenge_status`
- `drift_risk`
- `recommendation_scope`
- `promotion_state`
- `distilled_summary`
- `open_conflicts`
- `next_review_target`

### Optional fields

- `packet_id`
- `created_at`
- `source_refs`
- `distillator_notes`
- `user_gate_decision`
- `handoff_notes`

### Forbidden content

- any claim that the artifact is now canon truth
- automatic promotion wording
- runtime object identifiers presented as live writes
- hidden removal of unresolved conflicts
- truth mutation instructions

### Truth/proposal status

This artifact remains proposal-only.
It may support later human review but it is not registry truth.

### Allowed next destinations

- handoff artifact
- reference artifact
- card review target artifact
- manual design followup
- request human decision

### Forbidden destinations

- registry truth
- runtime review object
- direct index mutation
- direct alias mutation

## Template 3 — Handoff artifact

### Purpose

A handoff artifact packages a bounded Studio result for a later human-owned review context.
It clarifies what is being handed forward and what is still unresolved.

### Required fields

- `handoff_scope`
- `origin_artifact_type`
- `topic`
- `proposal_type`
- `evidence_status`
- `challenge_status`
- `open_conflicts`
- `handoff_reason`
- `required_gate_state`
- `next_review_target`
- `proposal_status`

### Optional fields

- `packet_id`
- `created_at`
- `source_refs`
- `user_gate_decision`
- `handoff_notes`
- `reader_notes`

### Forbidden content

- direct runtime write payloads
- direct review state mutations
- direct registry mutation instructions
- language that treats handoff as approval
- erased contradiction or evidence gaps

### Truth/proposal status

This artifact is a relay artifact only.
It remains proposal-only and does not itself authorize any write.

### Allowed next destinations

- manual design followup
- request human decision
- human registry review nomination
- reference artifact

### Forbidden destinations

- runtime review object
- registry truth
- direct card write
- direct index mutation
- direct alias mutation

## Template 4 — Reference artifact

### Purpose

A reference artifact keeps supporting context, rationale, comparison notes, or reading guidance near the repo for later human interpretation.
It helps explain a proposal without claiming to decide it.

### Required fields

- `reference_scope`
- `topic`
- `artifact_source`
- `summary`
- `evidence_status`
- `open_conflicts`
- `proposal_status`

### Optional fields

- `packet_id`
- `created_at`
- `source_refs`
- `comparison_notes`
- `reader_notes`
- `user_gate_decision`

### Forbidden content

- direct truth mutation language
- direct runtime write language
- disguised promotion recommendation presented as fact
- provider-consensus-as-truth claims

### Truth/proposal status

This artifact is reference-only.
It is not a truth surface and not a review state object.

### Allowed next destinations

- proposal artifact
- manual design followup
- archived reference retention

### Forbidden destinations

- registry truth
- runtime review object
- direct card write
- direct index mutation
- direct alias mutation

## Template 5 — Card review target artifact

### Purpose

A card review target artifact is a bounded nomination for later human truth-facing review of an existing or proposed card boundary.
It names the target without mutating it.

### Required fields

- `review_target_type`
- `topic`
- `proposal_type`
- `target_scope`
- `evidence_status`
- `challenge_status`
- `open_conflicts`
- `review_reason`
- `required_gate_state`
- `next_review_target`
- `promotion_state`

### Optional fields

- `packet_id`
- `created_at`
- `source_refs`
- `user_gate_decision`
- `review_notes`
- `distillator_notes`

### Forbidden content

- direct mutation of `cards/`
- direct mutation of `index/INDEX.json`
- direct mutation of `index/ALIASES.json`
- runtime review state creation
- language equating nomination with approval

### Truth/proposal status

This artifact is a review nomination only.
It is not itself a card change and not canon truth.

### Allowed next destinations

- human registry review
- request human decision
- manual design followup

### Forbidden destinations

- direct card write
- direct index mutation
- direct alias mutation
- runtime review object
- registry truth without separate human action

## Reading note

A cleaner artifact is not a stronger authority level.
These templates are intended to standardize shape and boundary discipline, not to create a hidden promotion path.
