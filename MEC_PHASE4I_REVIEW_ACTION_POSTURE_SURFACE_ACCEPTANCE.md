# MEC Phase 4I Review Action Posture Surface Acceptance

## Accepted user-visible value

This block extends the existing 4H decision packet read by making the current manual review action posture visible as one compact, canonical, read-only posture surface: the workspace now exposes which manual review actions are currently visible, blocked, or preconditioned, plus the hold and escalation reasons that shape that posture.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `review_action_posture_surface`
- a primary candidate can show one compact manual posture read for the current gate state
- a counterexample contribution can show the same posture surface without losing linked primary-candidate context
- hold reasons and escalation reasons remain visible instead of being silently implied
- the posture stays descriptive and reviewer-facing
- no recommendation layer, automatic action selection, queue engine, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to 4H:
- a visible **Review action posture** section
- readable `allowed_manual_actions`
- readable `blocked_manual_actions`
- readable `action_preconditions`
- readable `posture_bucket`
- readable `posture_flags`
- readable `manual_next_step_read`
- readable `hold_reasons`
- readable `escalation_reasons`

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, refutation, challenge dossier, challenge dossier delta, challenge dossier review digest, review gate signal surface, review gate threshold trace, review gate decision packet, review trace, raw review, or raw candidate surfaces.

## Accepted architectural rule

Still true:
- `mec_review_workspace` remains the only canonical derived truth
- raw candidate artifacts remain proposal-origin runtime artifacts
- raw review records remain separate runtime artifacts
- proposal-only `counterexample_candidate` artifacts remain proposal-only
- no new review outcomes
- no registry mutation
- no export / canon promotion
- no workflow / governance / assignment platform
- no queue engine or bulk orchestration layer
- no recommendation engine
- no automatic action selection
- no hidden ranking or scoring machine
- no new challenge write path
- no second truth beside the canonical workspace plus separate raw artifacts

Phase 4I is only accepted when:
- the new value stays additive and workspace-derived
- the posture stays compact and reviewer-readable
- action fields stay structured rather than prose-heavy
- hold and escalation reasons stay visible without becoming automation
- the operator, CLI, and HTTP surfaces expose the same canonical Phase 4I posture surface
- Phase 4H does not regress

## Executable proof

Run:

```bash
node tools/verify-mec-phase4i-review-action-posture-surface.js
```

The proof verifies:
- canonical workspace exposes additive `review_action_posture_surface`
- a primary candidate exposes readable allowed actions, blocked actions, preconditions, posture bucket, flags, hold reasons, escalation reasons, and next-step read
- a counterexample contribution preserves readable posture context
- CLI exposes posture readability
- HTTP exposes the same canonical posture object
- the review desk renders the visible Phase 4I posture surface
- existing Phase 4H surfaces do not regress
- no outcome, workflow, ranking, reopen, queue, or write-path drift is introduced
