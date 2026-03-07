# REGISTRY_CONSISTENCY_AUDIT

Stand: 2026-03-07
Status: Phase 0.1 read-only audit
Scope basis:
- `M01` Registry Core
- `M02` Taxonomy & Alias Layer
- `M03` Validation & Generation
- `M04` read-only only insofar as existing browse/query foundations are assessable

## 1. Purpose

This document audits the current registry for internal consistency before Phase 1.

It is a read-only audit.
It does not perform fixes.
It does not introduce runtime, UI, API, packet work, or structural migration.

Its purpose is to identify drift between:
- source cards
- generated artifacts
- README self-description
- taxonomy declarations
- alias mappings
- existing generator/validator logic

## 2. Scope

Included in scope:
- `cards/`
- `index/INDEX.json`
- `index/ALIASES.json`
- `human/REGISTRY.md`
- `taxonomies/domains.json`
- `taxonomies/tags.json`
- `tools/generate-index.js`
- `tools/generate-human-registry.js`
- `tools/validate-taxonomy.js`
- `README.md`

Excluded from scope:
- runtime modules
- UI implementation
- API implementation
- packet schema design
- architectural freeze docs
- direct content corrections

## 3. Checked Sources

The following sources were checked directly:
- `README.md`
- `human/REGISTRY.md`
- `index/INDEX.json`
- `index/ALIASES.json`
- `cards/errors/*.json`
- `cards/solutions/*.json`
- `cards/meta/*.json`
- `taxonomies/domains.json`
- `taxonomies/tags.json`
- `tools/generate-index.js`
- `tools/generate-human-registry.js`
- `tools/validate-taxonomy.js`

The following read-only checks were performed locally:
- card counts by directory and type
- index counts by type
- alias target existence
- taxonomy validator run
- broken link scan across card references
- generated artifact marker check
- README statistics extraction
- `human/REGISTRY.md` statistics extraction

## 4. Consistency Checks Performed

- compared `README.md` statistics against actual card counts
- compared `README.md` statistics against `human/REGISTRY.md`
- compared actual `cards/` population against `index/INDEX.json`
- checked `ALIASES.json` for dead targets
- ran taxonomy validation against actual card usage
- checked tools logic against documented behavior in `README.md`
- checked whether generated artifacts are consistently marked as generated
- scanned card link references for obvious broken targets

## 5. Findings

### Factual drift

1. **README statistics are outdated.**
   - `README.md` states `17` error patterns, `60` solution proofs, `6` meta principles, `83` total cards.
   - Actual current card population is `17` errors, `70` solutions, `7` meta, `94` total.
   - `human/REGISTRY.md` also reports `94` total cards.

2. **`INDEX.json` and actual `cards/` are aligned at the current total, but README is not.**
   - Actual cards: `94`
   - `index/INDEX.json` entries: `94`
   - Type counts also align between cards and index:
     - `error_pattern`: `17`
     - `solution_proof`: `70`
     - `meta_principle`: `7`

3. **Taxonomy validation currently fails.**
   - `tools/validate-taxonomy.js` reports `12` unknown domains and `197` unknown tag warnings in total output terms, with final status `Validation failed`.
   - Consolidated unique drift from used card values includes at least:
     - `5` unknown domains: `biology`, `learning`, `memory`, `multi_agent`, `optimization`
     - `137` unique unknown tags detected from actual card usage

4. **Broken card references exist.**
   - Broken reference scan found `19` unresolved link references.
   - Examples:
     - `err-api-01 -> fixes -> sol-api-01`
     - `sol-cross-029 -> fixes -> err-ui-02`
     - `sol-dev-006 -> related -> meta-008`
     - `sol-trading-001 -> related -> sol-trading-002`
     - multiple `sol-bio-047` through `sol-bio-052` links point to missing `sol-cross-047` to `sol-cross-052` targets

5. **`ALIASES.json` target mappings are alive, but limited in scope.**
   - No dead alias targets were found.
   - Existing aliases resolve only the `sol-maya-*` to `meta-*` migration set.

6. **Generated artifact marking is inconsistent.**
   - `human/REGISTRY.md` is explicitly marked `GENERATED - DO NOT EDIT`.
   - `README.md` describes `index/INDEX.json` as generated.
   - `INDEX.json` itself does not contain an in-file generated marker.

### Likely drift

7. **Generator logic appears inconsistent with documented link semantics.**
   - `README.md` documents error-to-solution linkage via `links.fixes`.
   - `tools/generate-index.js` includes top-level field `fixes` in `INDEX_FIELDS`, not `links.fixes`.
   - `tools/generate-human-registry.js` also renders the error `Fixes` column from `card.fixes`, not from `card.links.fixes`.
   - This strongly suggests the generator/human layer is not aligned with the current card schema usage.

8. **The browse/query foundation is only partial.**
   - `M04` has usable raw sources via `INDEX.json`, `ALIASES.json`, and card link fields.
   - But current browse/query usability is still implicit and file-based rather than implemented as a dedicated consistent read layer.

9. **Tooling coverage is uneven across consistency dimensions.**
   - Taxonomy validation exists.
   - Basic card required-field validation exists in `generate-index.js`.
   - But no dedicated link integrity validator exists, even though broken card references are present.

### Needs manual confirmation

10. **The exact intended source for `Fixes` in generated human output should be confirmed.**
   - It is unclear whether cards are expected to carry a top-level `fixes` field for index/human generation, or whether generators were supposed to derive that value from `links.fixes`.
   - Current documentation and current generator logic are not clearly aligned.

11. **Unknown domains/tags may be either legitimate taxonomy debt or unintended uncontrolled expansion.**
   - The audit confirms the mismatch.
   - It does not by itself decide whether taxonomy files should be extended or card metadata narrowed.

12. **Some broken references may reflect planned-but-missing cards rather than accidental typos.**
   - The audit confirms unresolved targets.
   - Human review is still needed to decide whether each should be removed, aliased, or implemented later.

## 6. Drift Classification

- **High-confidence factual drift**
  - README statistics vs actual cards
  - README statistics vs `human/REGISTRY.md`
  - broken card references
  - taxonomy mismatch against actual used values
  - inconsistent generated marking for `INDEX.json`

- **High-confidence likely drift**
  - generators use `fixes` while README documents `links.fixes`
  - no dedicated link integrity validation in tooling despite real broken references

- **Needs manual confirmation**
  - intended schema authority for `fixes` vs `links.fixes`
  - whether unknown taxonomy values should be added or normalized away
  - whether each broken card reference is typo, stale legacy, or deferred target

## 7. Minimal Fix Recommendations

1. **Update README statistics to current real counts.**
   - Minimal scope: statistics section only

2. **Add or confirm a single authority for fix-link representation.**
   - Either generators should read `links.fixes`, or card/index schema should explicitly support top-level `fixes`
   - Do not keep both implied without a rule

3. **Add a dedicated link integrity check to `M03`.**
   - Minimal scope: read-only validator that flags unresolved `fixes`, `causes`, `related`, `supersedes`

4. **Resolve taxonomy drift intentionally.**
   - Either extend taxonomy files to cover active real usage or normalize card metadata
   - Do not leave validator failure as a permanent baseline

5. **Mark generated artifacts consistently.**
   - At minimum, confirm whether `INDEX.json` should carry a generated marker comment or whether README alone is the intended marker source

6. **Review all currently broken references before Phase 1.**
   - The count is small enough for a controlled manual pass

## 8. Safe Next Step Recommendation

The safe next step is **Phase 0.2 – small fix pass**.

Recommended scope for Phase 0.2:
- repair factual registry self-description drift
- repair or explicitly classify broken card references
- decide and normalize `fixes` vs `links.fixes`
- bring taxonomy validation to a consciously passing or consciously accepted baseline
- keep all changes within `M01–M03`
- remain read-heavy and avoid runtime/UI/API work

Phase 1 should not start until the registry is at least consistent enough that:
- README self-description matches reality
- generator expectations match actual card structure
- broken link drift is understood and reduced
- taxonomy validation status is no longer ambiguous
