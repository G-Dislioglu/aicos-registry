# MEC Phase 4J Review Action Obligation Surface Acceptance

## Accepted user-visible value

This block extends the existing 4I action posture read by making the current manual review obligation structure visible as one compact, canonical, read-only obligation surface: the workspace now exposes what proof burden, evidence expectation, blocker, defer reason, contradiction watchpoint, and reviewer attention remains attached to visible manual review actions.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `review_action_obligation_surface`
- a primary candidate can show one compact manual obligation read for the current posture state
- a counterexample contribution can show the same obligation surface without losing linked primary-candidate context
- required evidence, blocking gaps, contradiction watchpoints, and defer reasons remain visible instead of being silently implied
- the obligation layer stays descriptive and reviewer-facing
- no recommendation layer, automatic action selection, queue engine, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to 4I:
- a visible **Review action obligations** section
- readable `manual_action_obligations`
- readable `required_evidence_by_action`
- readable `blocking_gaps_by_action`
- readable `reviewer_attention_points`
- readable `contradiction_watchpoints`
- readable `action_risk_notes`
- readable `action_readiness_summary`
- readable `defer_reasons`

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, refutation, challenge dossier, challenge dossier delta, challenge dossier review digest, review gate signal surface, review gate threshold trace, review gate decision packet, review action posture, review trace, raw review, or raw candidate surfaces.

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

Phase 4J is only accepted when:
- the new value stays additive and workspace-derived
- the obligation surface stays compact and reviewer-readable
- action burden fields stay structured rather than prose-heavy
- defer reasons, contradiction watchpoints, and evidence expectations stay visible without becoming automation
- the operator, CLI, and HTTP surfaces expose the same canonical Phase 4J obligation surface
- Phase 4I does not regress
- Phase 4H does not regress

## Executable proof

Run:

```bash
node tools/verify-mec-phase4j-review-action-obligation-surface.js
```

The proof verifies:
- canonical workspace exposes additive `review_action_obligation_surface`
- a primary candidate exposes readable manual action obligations, required evidence, blocking gaps, attention points, contradiction watchpoints, risk notes, readiness summary, and defer reasons
- a counterexample contribution preserves readable obligation context
- CLI exposes obligation readability
- HTTP exposes the same canonical obligation object
- the review desk renders the visible Phase 4J obligation surface
- existing Phase 4I and Phase 4H surfaces do not regress
- no outcome, workflow, ranking, reopen, queue, or write-path drift is introduced
