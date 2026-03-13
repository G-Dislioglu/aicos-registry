# AICOS Studio Summary Report Spec

## Status

This document defines the deterministic Markdown summary report generated from a valid Studio dossier.
It is a local human-readable review output only.
It does not define runtime execution, approval authority, forwarding, or truth mutation.

## Purpose

The purpose of a summary report is to turn one valid Studio dossier into a readable Markdown review surface with stable sections and explicit boundary language.
The report shortens human reading.
It does not replace the dossier or the underlying source artifacts.

## Input boundary

A summary report may be generated only from a valid `studio_dossier` artifact.
It may not be generated directly from runtime objects, provider execution outputs, registry truth, or card mutation requests.

## Output boundary

A summary report is:

- deterministic Markdown only
- local and repo-near
- human-readable
- proposal-only
- non-executive and non-mutating

A summary report is not:

- an approval artifact
- a runtime review object
- a truth record
- a forwarding command
- a hidden promotion layer

## Required sections

A valid summary report must contain these headings in deterministic order:

- `# Studio Dossier Summary Report`
- `## Dossier Metadata`
- `## Source Packet Summary`
- `## Included Proposal Artifacts`
- `## Included Review Records`
- `## Included Gate Reports`
- `## Bundle Context`
- `## Open Conflicts`
- `## Gate Outcomes`
- `## Recommended Human Next Step`
- `## Forbidden Automated Next Steps`
- `## Boundary Flags`

## Optional sections

A summary report may additionally contain:

- `## Notes`

Optional sections may clarify reading but must not add execution semantics.

## Forbidden sections and language

A summary report must not contain:

- approval claims
- auto-forward language
- runtime execution instructions
- provider execution instructions
- truth mutation instructions
- card write instructions
- index write instructions
- alias write instructions
- suppression of known open conflicts

## Rendering rules

A summary report must:

- preserve the dossier title and topic
- preserve visible source packet summary
- list included proposal artifacts explicitly
- list included review records explicitly
- list included gate reports explicitly
- surface all dossier open conflicts
- surface all summarized gate outcomes
- preserve the recommended human next step as descriptive only
- preserve the forbidden automated next steps explicitly
- restate the proposal-only, no-runtime-write, and no-truth-mutation flags

## Boundary language

The report must keep boundary language explicit.
It should make clear that:

- the report is local human review material only
- it does not authorize forwarding
- it does not authorize runtime action
- it does not authorize registry mutation

## Closure statement

This summary report spec exists to make bounded Studio dossiers easier for humans to read without creating a UI layer, execution layer, or hidden approval mechanism.
