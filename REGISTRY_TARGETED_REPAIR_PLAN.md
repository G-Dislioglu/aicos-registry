# REGISTRY_TARGETED_REPAIR_PLAN

Stand: 2026-03-07
Status: Phase 0.2C planning only
Scope basis:
- `M01` Registry Core
- `M02` Taxonomy & Alias Layer
- `M03` Validation & Generation
- `M04` read-only only insofar as repair validation affects browse/reference readability

## 1. Purpose

This document defines a targeted low-risk repair plan derived from the Phase 0.2B classification.

It is intentionally a planning document only.
It does not execute repairs.
It does not commit or push.

Its goal is to isolate only those repair actions that have high enough confidence to be considered safe for a small 0.2C pass.

## 2. Scope

Included in scope:
- `taxonomies/domains.json`
- `taxonomies/tags.json`
- `cards/` only if a broken reference case is high-confidence and non-speculative
- validator/report tooling in `tools/` only if a minimal improvement directly helps show the repaired state
- generated outputs that would need regeneration after approved repairs

Excluded from scope:
- new card creation
- speculative alias creation
- bulk admission of unknown `theme:*` tags
- schema redesign
- structure migration
- runtime/UI/API changes
- lock / architecture / MVP plan changes

## 3. Repair Eligibility Rules

A repair is eligible for 0.2C only if all of the following are true:
- the issue is directly evidenced by current repository state
- the repair does not require inventing missing content
- the repair does not depend on guessing semantic intent
- there is a single clearly preferable repair direction
- the affected files are small in number and obvious in scope
- the post-repair state can be validated deterministically

A repair is **not** eligible for 0.2C if any of the following apply:
- multiple plausible semantic targets exist
- the case may represent planned-but-missing concept work
- the case would require alias speculation
- the case would trigger broad vocabulary expansion without admission rules
- the case depends on deciding future product/runtime behavior

Confidence terms used here:
- **high**: direct repo evidence and low semantic ambiguity
- **medium**: partly supported but still choice-dependent
- **low**: not safe for a targeted low-risk pass

## 4. Safe Taxonomy Repairs

### Safe candidate 1

- **Target item**: domain value `biology`
- **Reason**: used by six active cards (`sol-bio-047` through `sol-bio-052`) as a stable cluster; this looks like an intentional domain family rather than one-off drift
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/domains.json`
- **Repair type**: add taxonomy entry

### Safe candidate 2

- **Target item**: domain value `multi_agent`
- **Reason**: used across at least two active cards (`sol-bio-052`, `sol-cross-055`) and aligned with a clearly recurring architectural concept already present in card content
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/domains.json`
- **Repair type**: add taxonomy entry

### Safe candidate 3

- **Target item**: tag value `tech:database`
- **Reason**: used symmetrically in paired error/solution cards (`err-db-01`, `sol-db-01`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 4

- **Target item**: tag value `tech:json`
- **Reason**: used symmetrically in paired frontend error/solution cards (`err-frontend-01`, `sol-frontend-01`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 5

- **Target item**: tag value `tech:native_module`
- **Reason**: used symmetrically in paired dev error/solution cards (`err-dev-02`, `sol-dev-02`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 6

- **Target item**: tag value `tech:security`
- **Reason**: used symmetrically in paired auth error/solution cards (`err-auth-01`, `sol-auth-01`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 7

- **Target item**: tag value `tech:tts`
- **Reason**: used symmetrically in paired audio error/solution cards (`err-audio-02`, `sol-audio-02`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 8

- **Target item**: tag value `tech:vite`
- **Reason**: used symmetrically in paired dev error/solution cards (`err-dev-01`, `sol-dev-01`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 9

- **Target item**: tag value `tech:web_speech_api`
- **Reason**: used symmetrically in paired audio error/solution cards (`err-audio-01`, `sol-audio-01`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Safe candidate 10

- **Target item**: tag value `tech:websocket`
- **Reason**: used symmetrically in paired websocket error/solution cards (`err-ws-01`, `sol-ws-01`); clear durable technology label
- **Confidence**: high
- **Expected file(s)**:
  - `taxonomies/tags.json`
- **Repair type**: add taxonomy entry

### Optional low-risk tooling follow-up

This is only eligible if kept minimal and directly tied to visibility of the repaired state.

- **Target item**: taxonomy validator output clarity
- **Reason**: after approved taxonomy repairs, a rerun should clearly show remaining unresolved drift; a minimal report improvement would help distinguish repaired high-confidence cases from deferred ambiguous ones
- **Confidence**: high for usefulness, medium for necessity
- **Expected file(s)**:
  - `tools/validate-taxonomy.js`
- **Repair type**: normalize value

This tooling item is optional because the current validator already produces deterministic pass/fail output.

## 5. Safe Broken Reference Repairs

No broken-reference repair currently qualifies as high-confidence low-risk for direct execution.

Reason:
- all currently unresolved references still require semantic choice between removal, remap, intentional future creation, or explicit preservation
- no current case has strong enough evidence for a single safe mechanical action
- no current case is backed by an existing alias trail that would make remap obvious

Result for 0.2C:
- **no direct broken-reference edit should be pre-authorized in the targeted pass**

The only acceptable low-risk broken-reference follow-up is diagnostic visibility.

### Optional visibility-only candidate

- **Target item**: dedicated broken-link report in `M03`
- **Reason**: unresolved links are a confirmed integrity issue, and a deterministic report would make the remaining deferred cases explicit after any taxonomy cleanup
- **Confidence**: high for usefulness, medium for inclusion in 0.2C because it is tooling enhancement rather than data repair
- **Expected file(s)**:
  - `tools/` validator script area, likely a new minimal read-only check or a narrow extension of existing validation tooling
- **Repair type**: normalize value

This should be included only if 0.2C is allowed to touch tooling for visibility improvements.

## 6. Deferred Cases Requiring Manual Judgment

These cases are real, but not safe enough for targeted low-risk repair.

### Domain decisions

- `optimization`
  - could be a real domain or should normalize into `systems`
- `memory`
  - may be domain-level or should remain conceptual/tag-level
- `learning`
  - may be domain-level or should normalize into broader existing domains

### Broken references

- `err-api-01 -> links.fixes -> sol-api-01`
- `sol-cross-029 -> links.fixes -> err-ui-02`
- `sol-ux-002 -> links.fixes -> err-ui-02`
- `sol-cross-040 -> links.related -> sol-dev-004`
- `sol-dev-006 -> links.related -> meta-008`
- `sol-trading-001 -> links.related -> sol-trading-002`

Reason for deferral:
- each requires a semantic decision about whether the target should exist, should be remapped, or should be removed

### Taxonomy policy questions

- whether `risk:*` should encode severity, failure mode, or both
- whether `env:*` values belong in controlled vocabulary at all
- whether singleton `tech:*` values like `tech:proof_core`, `tech:pine_script`, `tech:stepstack`, `tech:desktop_app`, `tech:overlay` should be admitted now or only after broader policy review

## 7. Cases That Should Remain Unresolved For Now

These should not be repaired in 0.2C.

- the missing conceptual block `sol-cross-047` through `sol-cross-052`
- the long tail of unknown `theme:*` tags
- any speculative alias addition for unresolved targets
- any repair that would invent missing cards
- any case where “remove stale reference” would erase a potentially intentional conceptual relation without confirmation

Reason:
- these are precisely the classes most likely to convert data integrity work into accidental content redesign

## 8. Proposed Repair Order

1. **Apply safe domain additions**
   - `biology`
   - `multi_agent`

2. **Apply clearly durable repeated `tech:*` tag additions**
   - `tech:database`
   - `tech:json`
   - `tech:native_module`
   - `tech:security`
   - `tech:tts`
   - `tech:vite`
   - `tech:web_speech_api`
   - `tech:websocket`

3. **Re-run taxonomy validation**
   - confirm the high-confidence repairs reduced known drift

4. **Optionally improve validator/report visibility**
   - only if kept minimal and directly useful for showing remaining deferred cases

5. **Stop**
   - do not continue into ambiguous reference or theme-tag cleanup inside the same pass

## 9. Expected Files Affected

If the plan is executed with only the safe repair core:
- `taxonomies/domains.json`
- `taxonomies/tags.json`

If the optional visibility improvement is approved:
- `tools/validate-taxonomy.js` and/or one minimal link-integrity report script in `tools/`

If generated artifacts are intentionally regenerated after taxonomy-only repair:
- likely none required for taxonomy file edits alone
- validator output would change, but generated content files should not need semantic regeneration unless tooling/report behavior is altered

## 10. Validation After Repair

Minimum validation after execution of the approved 0.2C subset:
- rerun taxonomy validation and confirm the approved additions no longer appear as unknown
- verify JSON validity for all touched taxonomy files
- confirm no new unknown domain/tag values were introduced by the repair itself
- confirm that deferred cases still remain visible and were not silently papered over

If optional tooling visibility is included:
- verify the report deterministically lists unresolved broken-reference cases
- verify the report does not auto-rewrite data

## 11. Stop Conditions

Stop the 0.2C pass immediately if any of the following occurs:
- a candidate repair turns out to need semantic choice
- a broken reference has more than one plausible remap target
- the repair would require creating a missing card
- the repair would require speculative aliasing
- the repair expands into bulk `theme:*` admission
- the repair causes follow-up changes outside the narrow `M01–M03` integrity scope
- validation results suggest the taxonomy policy is broader than this targeted pass can safely resolve
