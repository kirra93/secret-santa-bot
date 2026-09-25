---
type: standard
status: seed
owner: repository maintainers
last_reviewed: 2026-08-08
canonical_for: "repository documentation structure, metadata, and lifecycle"
canonical: true
translations: [project-documentation-standard.ru.md]
---

# Project documentation standard

> Audience: maintainers, engineers, and coding agents
> Scope: stack-agnostic repository documentation
> Install as: `docs/standards/documentation.md`
> Canonical version: this file (English). Translation:
> [Русская версия](project-documentation-standard.ru.md)
> Canonical language: choose one per repository; English is recommended for
> engineering sources of truth

## 1. Goal

Documentation should help an engineer answer five questions quickly:

1. What is this project and how do I run it?
2. What are its current boundaries and invariants?
3. Why were durable decisions made?
4. What work is active and how is it verified?
5. How do I diagnose and recover a failing system?

Prefer a small connected set of trustworthy documents over a large collection
of notes. Every rule or fact should have one canonical source; other documents
link to it instead of copying it.

## 2. Bootstrap order

Create documentation in this order:

1. `README.md` — human entry point and runnable quickstart.
2. `AGENTS.md` — concise instructions and source-of-truth routing for coding
   agents.
3. `docs/INDEX.md` — documentation map.
4. `docs/architecture/overview.md` — current system boundaries and dependency
   direction.
5. `docs/standards/` — only conventions the project actually enforces.
6. `docs/runbooks/local-development.md` — when setup, device testing, services,
   configuration, recovery, or deployment no longer fit a short README.
7. Add ADRs, Tasks, contracts, and other documents only when real work needs
   them.

Do not create empty directories or speculative documents merely to reproduce
the complete tree below.

## 3. Root files

### `README.md`

The README is for a new human contributor. Keep it short and executable:

- project purpose and current maturity;
- prerequisites;
- installation and local startup;
- required configuration without real secrets;
- test, lint, and build commands;
- shutdown commands only when local services require an explicit shutdown flow;
- links to `AGENTS.md` and `docs/INDEX.md`;
- the most common setup failure or a link to its runbook.

Do not turn the README into an architecture history, complete API reference, or
operational handbook.

### `AGENTS.md`

`AGENTS.md` is a routing and working-policy document, not a duplicate of the
architecture or coding standards. It should contain:

- required reading and instruction priority;
- project purpose, durable boundaries, and explicit non-goals;
- small, repository-wide working rules;
- links to canonical architecture, style, testing, documentation, and runbook
  sources;
- exact verification entry points;
- archive/context rules;
- required final handoff content.

Place additional `AGENTS.md` files only in packages or modules that need more
specific rules. A nested file extends or overrides the root policy for its
subtree. Do not repeat unchanged root rules.

Keep changing priorities in Roadmap or active Tasks. Do not turn `AGENTS.md`
into a live backlog.

`AGENTS.md` is read on every agent turn, so it has a size budget: keep it under
roughly 150 lines (about 2,000 tokens), and keep `docs/INDEX.md` under roughly
100 lines. If it does not fit, rules from canonical documents have been copied
into it. Move them back and leave a link.

Copyable skeleton:

````markdown
# <Project> agent instructions

## Required reading

Before changing code, read:

1. `docs/architecture/overview.md`;
2. relevant project standards;
3. the nearest ADR, Task, contract, code, and tests.

Follow the nearest applicable `AGENTS.md`. Do not infer current architecture
from prompts, archived Tasks, or superseded documents.

## Project scope

Purpose: <one concrete paragraph>.

Out of scope unless explicitly requested:

- <non-goal>.

## Working rules

- Inspect existing behavior before editing.
- Prefer the smallest coherent change.
- Preserve unrelated worktree changes.
- Keep code, tests, contracts, and documentation consistent.
- Change `status` and `last_reviewed` only on documents you actually verified;
  report the rest as needing review.
- Do not add dependencies, commit, push, or perform destructive operations
  without the authority required by this project.

## Sources of truth

- Architecture: `docs/architecture/overview.md`.
- Code style: `docs/standards/<code-style>.md`.
- Testing: `docs/standards/testing.md`.
- Documentation: `docs/standards/documentation.md`.
- Local operations: `docs/runbooks/local-development.md`.

Do not duplicate detailed rules from these documents here.

## Verification

Run the narrowest relevant check first:

```text
<project test command>
<project lint command>
<project full quality command>
```

Do not weaken quality gates to make a change pass.

## Documentation archives

Treat every documentation `archive/` directory as history, not current
guidance. Open a specific archived document only when the task explicitly
requires known historical context.

## Handoff

Report changed behavior, decisions, checks run, checks not run, documentation
updates, remaining risks, and follow-up work.
````

### Tool-specific instruction files

`AGENTS.md` is the only source of agent rules. Files that individual tools read
must not carry rules of their own:

- `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`,
  `.cursor/rules/*.mdc`, `.clinerules`, `CONVENTIONS.md`;
- make each one a symlink to `AGENTS.md`, or a single line: `See AGENTS.md`.

Never maintain parallel rule sets per tool. They diverge silently, and each
agent then follows a different version of the project.

## 4. Recommended documentation tree

```text
docs/
├── INDEX.md                    # required discovery map
├── architecture/              # current structure and boundaries
│   └── overview.md
├── adr/                       # durable decision history
│   └── README.md
├── product/                   # optional product context and requirements
├── roadmap/                   # optional ordered outcomes and milestones
├── tasks/                     # bounded implementation work
│   ├── README.md
│   └── archive/               # history; excluded from routine discovery
├── contracts/                 # optional APIs, events, schemas, compatibility
├── runbooks/                  # executable operations and recovery
└── standards/                 # repository-wide conventions
    └── templates/             # maintained copyable document templates
```

Use domain subdirectories when a section becomes large, for example
`architecture/catalog/` or `runbooks/payments/`. Do not mirror the source tree
mechanically.

`docs/INDEX.md` and a section `README.md` have different jobs and must not
overlap:

- `INDEX.md` is the only navigation surface: it lists the entry points a reader
  or agent needs and links to them.
- A section `README.md` describes only the conventions of its own section —
  naming and numbering, allowed statuses, when to create a document there, how
  it is archived. It does not list the section's documents.

Two places listing the same documents is the same defect as two places stating
the same rule: one of them will be wrong.

## 5. What belongs where

| Location | Question it answers | Must not become |
|---|---|---|
| `architecture/` | How does the current system work and who owns what? | Future plan or decision diary |
| `adr/` | Why was a durable choice made over alternatives? | Implementation checklist |
| `product/` | What problem, user outcome, and scope matter? | Technical architecture |
| `roadmap/` | Which outcomes come next and why in that order? | Detailed Task backlog |
| `tasks/` | What bounded outcome will be implemented and verified? | Permanent architecture source |
| `contracts/` | What do callers and providers exchange? | Internal implementation notes |
| `runbooks/` | How does someone safely operate or recover the system? | Conceptual overview |
| `standards/` | Which repository-wide conventions are enforced? | Generic advice with no project effect |

Use Tasks as the repository implementation unit. If the team works in calendar
sprints, keep scheduling in exactly one place: either the repository Roadmap or
an external project-management system. Link scheduling items to Tasks and do not
maintain duplicate `tasks/` and `sprints/` specifications.

Do not create a Task document for every small edit. Use one when work spans
multiple phases or changes architecture, contracts, persistence, operations, or
a substantial user workflow. A focused fix may be documented by code, tests,
and its commit or pull request.

## 6. D.O.C.S. relevance checklist

For each non-trivial feature or development stage, preserve the applicable
D.O.C.S. knowledge:

1. **Design Decisions** — chosen solution, rejected alternatives, reasons,
   trade-offs, and compatibility.
2. **Operational Context** — environment, configuration and secret names,
   dependencies, ports, deployment, and runtime constraints.
3. **Code Understanding** — non-obvious data flow, lifecycle, algorithms,
   invariants, failure handling, and fallbacks.
4. **Support Information** — symptoms, causes, diagnostics, recovery, rollback,
   backfill, and verification.

These are a checklist, not four mandatory headings. A small Task may need none
or one block. Remove irrelevant sections instead of writing filler.

Place information in its strongest long-term home: a durable choice in an ADR,
current boundaries in Architecture, commands in a Runbook, and only
task-specific details in a Task.

## 7. Document metadata

Every maintained document of a type listed below must begin with YAML
frontmatter. `README.md`, `AGENTS.md`, `docs/INDEX.md`, and templates are
exempt. Archived and superseded documents retain their metadata but are not
current sources of truth.

Frontmatter is the machine-readable source of truth about a document: it can be
linted, filtered, and queried by tooling and agents. Do not restate its values
in prose.

```yaml
---
type: adr                  # architecture|adr|task|roadmap|runbook|contract|standard
status: accepted
owner: payments-team       # team, module, or role
last_reviewed: 2026-08-08
canonical_for: "access token issuance and validation"
supersedes: [adr/0007-jwt-in-cookie.md]
superseded_by: null
related: [../architecture/overview.md]
---
```

Field rules:

- `type` and `status` are always required, and `status` must be valid for
  `type`.
- `canonical_for` states the exact scope this document owns. A non-canonical
  working document omits it and names its owning Task or archive location
  instead of claiming source-of-truth status.
- `superseded_by` is required when `status` is `superseded` or `deprecated`.
- Omit `related`, `supersedes`, and `superseded_by` when they add nothing.
- Paths must resolve from the document's own location.

Use type-specific statuses:

| Document | Statuses |
|---|---|
| Architecture | `draft`, `active`, `superseded`, `archived` |
| ADR | `proposed`, `accepted`, `rejected`, `superseded` |
| Task | `planned`, `active`, `blocked`, `completed`, `cancelled`, `archived` |
| Roadmap | `draft`, `active`, `superseded` |
| Runbook | `draft`, `active`, `deprecated` |
| Contract | `draft`, `active`, `deprecated`, `superseded` |
| Standard | `seed`, `draft`, `active`, `superseded` |

`seed` marks a portable recipe that no project has adopted yet.

Use lowercase kebab-case filenames. Use numeric prefixes for ordered ADRs and
Tasks. Avoid `notes.md`, `final-v2.md`, `new-plan.md`, and dates that do not form
part of the subject.

`last_reviewed` means the content was checked against current reality, not that
punctuation changed.

Changing `status` or `last_reviewed` asserts that someone confirmed the document
against reality, so an agent may do it on its own only when it actually
performed that confirmation and the confirmation was simple: it ran the runbook
commands, it finished the Task it is closing, it corrected a command it had just
executed. When correctness cannot be established inside the task — architecture,
contracts, ADRs, standards, or anything depending on decisions made outside the
change — the agent proposes the change and leaves it to a human. Never move a
date merely because the file was edited.

## 8. Templates

Keep copyable templates in `docs/standards/templates/`, separate from the prose
standard. Recommended templates are:

- `architecture.md`;
- `adr.md`;
- `task.md`;
- `runbook.md`;
- contract or migration templates only if the project repeatedly needs them.

Mark template sections as:

- `Required` — always provide concrete content;
- `Optional` — remove when it adds no value;
- `Conditional` — required only when its stated condition applies.

Remove instructions, unused headings, and placeholders after copying. Never add
`Not applicable` everywhere merely to make a template look complete.

## 9. Lifecycle and archives

- Architecture describes current reality and is edited as the system changes.
- An accepted ADR is immutable apart from clarification; replace a changed
  decision with a new ADR that supersedes it.
- A Task may evolve while active, then records its result before archival.
- A Runbook is updated and reverified whenever its commands or runtime change.
- Roadmap status changes as outcomes move, but completed history stays concise.

An `archive/` directory is historical storage:

- exclude it from routine discovery, agent context, planning, and indexes;
- open only a specific known file for an explicit historical question;
- mark archived documents as not current sources of truth;
- link a superseding active document where one exists;
- never use cancelled work as current implementation guidance.

## 10. Change workflow

When behavior changes:

1. identify the canonical affected documents before implementation;
2. update code, tests, contracts, and docs in the same coherent change;
3. add an ADR only for a durable choice with meaningful alternatives;
4. verify commands and examples where practical;
5. update `last_reviewed` only on documents actually checked;
6. update `docs/INDEX.md` when discovery changes;
7. report documentation changes and remaining gaps in the handoff.

Documentation is part of the definition of done when setup, behavior,
contracts, architecture, persistence, operations, or support procedures change.

## 11. Language and translations

Choose one canonical engineering language per repository. If translations are
necessary:

- label the canonical file explicitly with `canonical: true` and list its
  `translations`;
- mark every translation with `translation_of: <canonical path>` and link back
  to it;
- keep filenames paired, such as `overview.en.md` and `overview.ru.md`;
- update both in one change or mark a translation stale;
- never let two languages become independent sources of truth.

## 12. Code comments and generated references

Use stack-native comments for public contracts, non-obvious invariants,
side effects, retry/concurrency behavior, and integration boundaries. Explain
why; do not narrate obvious code.

Prefer generated OpenAPI, schema, or CLI references when code can reliably
produce them. Keep hand-written docs focused on semantics, examples, decisions,
and operational context the generator cannot explain.

Mark generated files clearly, document their generation command, and do not edit
them manually.

## 13. Sensitive data in documentation

Documentation is copied into prompts, pull requests, tickets, and external
services. Treat every documentation file as something that will eventually be
read outside the team.

- Document configuration by name and shape, never by value: `STRIPE_SECRET_KEY`
  and its format belong in docs; the key itself never does.
- Use obviously synthetic examples. No production identifiers, customer records,
  real addresses, tokens, or personal data — including inside sample logs, stack
  traces, and screenshots.
- Redact pasted production output and mark it as redacted, or replace it with a
  minimal synthetic equivalent.
- Use placeholder hosts and endpoints unless the project explicitly allows real
  ones in a private repository.
- A secret committed to documentation is not fixed by editing the file: rotate
  it first, then remove it.

## 14. Automation and gates

A standard that nothing enforces degrades. Automate what can be checked
mechanically:

- markdownlint on changed markdown;
- a link checker for internal and external links;
- a frontmatter validator: required keys per `type`, allowed `status` values,
  `superseded_by` present when required, referenced paths resolve;
- a staleness warning for `status: active` documents whose `last_reviewed` is
  older than the project's review interval;
- a pull request checklist item naming the canonical documents a change affects.

Cold-start check:

> An agent starting with empty context, given only `README.md`, `AGENTS.md`, and
> `docs/`, must be able to install the project, run it, run its checks, and name
> the current sources of truth for architecture, style, and testing. A failure
> is a documentation defect, not an agent defect: fix the document that should
> have answered the question.

Keep tooling proportional to the project. A small repository can run only the
link checker and the cold-start check and still get most of the value.

## 15. Review checklist

- Is there exactly one current source of truth for each rule?
- Does the architecture describe current, not desired, behavior?
- Do ADRs preserve reasons without becoming implementation plans?
- Is every active Task bounded, verifiable, and linked to dependencies?
- Can a new engineer execute each runbook without tribal knowledge?
- Are commands, environment variable names, ports, and examples current?
- Are archived and superseded documents excluded from normal guidance?
- Do links work, and does `docs/INDEX.md` expose the important entry points?
- Are comments and docs explaining information that code cannot express alone?
- Does any document expose a secret value, production identifier, or personal
  data?
- Would the cold-start check still pass after this change?
- Can any document or section be removed without losing useful knowledge?

## 16. Common failure modes

- `AGENTS.md` repeats the entire architecture and becomes stale.
- each tool keeps its own instruction file, and the rule sets quietly diverge.
- `last_reviewed` is bumped because a file was edited, not because it was
  checked, and the field stops meaning anything.
- README, Task, and Architecture each state a different rule.
- planned architecture is presented as already implemented.
- Tasks and sprints duplicate the same implementation specification.
- accepted ADRs are silently rewritten, destroying decision history.
- every template heading is filled with meaningless `Not applicable` text.
- archives are indexed or automatically loaded as current context.
- commands and configuration examples are never tested.
- temporary notes use names such as `final-v3-really-final.md` and become
  accidental sources of truth.

The remedy is usually consolidation: choose the canonical document, update it,
replace duplicates with links, and archive or remove obsolete material.
