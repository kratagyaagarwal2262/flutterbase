# CLAUDE.md — Flutterbase

This repo is a Claude Code plugin, not an app. Its product is the skills under `skills/` and the agents
under `agents/`.

## Where it sits

Flutterbase is a **stack kit**: the Flutter + Supabase half of a pair. It fills the slots Spec-to-Ship's
`project-stack` calls as `flutter-supabase-<slot>` (`setup`, `conventions`, `design`, `build`,
`verify`, `release`) and owns every Flutter and Supabase skill. **It never calls a Spec-to-Ship skill or
names a Spec-to-Ship command**, so it works alone. Check 23 fails on either.

## The portability rule

**No client or project name appears anywhere in this repo,** and **a project fact never goes in a
skill.** If something is true of one client's app but not of every Flutter app, it belongs in that
project's `docs/agents/project.md`, and the skill reads it from there. Check 8 scans for client terms
kept in the gitignored `.kit-private/{client-names,project-symbols}.txt`.

Fixed kit conventions (feature-first, a single barrel, sizing tokens, no hardcoded values, fixture
mode) are the exception: `flutter-core-architecture` owns them, and every other skill cites that
skill rather than restating them.

## The stack rule

**A skill never names a state-management library.** Which one a project uses is a project fact, so
it lives in the Architecture table of `docs/agents/project.md`, and a skill reaches it by calling
`flutter-supabase-conventions`. `flutter_bloc` is the kit's *default* for a greenfield repo, not its
assumption. Where a skill genuinely needs per-stack code, it goes in `skills/<name>/templates/<stack>.md`
and `SKILL.md` becomes a stack-neutral procedure routing to it. `flutter-create-state-layer` is the
worked example. Check 10 enforces this, and its exemption list is a **ratchet**: remove a name when
that skill is restructured, never add one.

## Repo invariants

- Every `skills/<name>/SKILL.md` has `name:` exactly equal to its directory name, and is registered
  in `.claude-plugin/plugin.json`'s `skills` array.
- Every skill is model-invoked: there are no commands here (check 19).
- An **invocation** is always an instruction to call the Skill tool with the name, never a link to
  `../other/SKILL.md` and never a bare `/name`.
- A skill carries every file it reads, inside its own folder. Nothing links out to `../../`.
- `README.md`'s Reference lists every skill, with the bullet text equal to the frontmatter
  description minus its trailing trigger sentence. Check 9 compares them.
- Agents obey the same rules: they reach a skill by calling the Skill tool, never by a harness path,
  and name no state library (check 18).
- No skill names a model. `install/roles.json` says what each kind of work needs and puts every
  agent in exactly one role (check 21).
- The opencode plugin matches opencode's **literal** tool ids: `bash` for the shell tool. A source
  filename (`shell.ts`) and a registry variable are not ids. Checks 13 and 17 hold this.
- Run `claude plugin validate . --strict` after touching either manifest.

Run `python3 scripts/validate-kit.py` before committing.

## Installing

The kit installs once per user, never into a project. `scripts/kit.py` is the installer: Claude Code
gets the managed plugin; Codex, opencode, Antigravity and Cursor get the skills linked from a
generated build under `~/.flutterbase/build`, plus agents and hooks converted to the shape each one
reads. `install/harnesses.json` is the one list of harnesses. `hooks/flutterbase-hook.py` is the one
hook for every command-hook harness (`format`, `fixtures`); `opencode/plugins/flutterbase.ts` is its
opencode equivalent. The root `install.sh` downloads a pinned tarball and delegates to
`scripts/kit.py`. It carries no kit content itself, so keep it that way.

## Versioning

Bump `version` in `.claude-plugin/plugin.json` when skill behaviour changes, and set
`FALLBACK_VERSION` in `install.sh` to match in the same commit (check 15 holds this). Add the
CHANGELOG entry. A release is a `vX.Y.Z` tag; `install.sh` and `kit update` install the highest tag,
and `main` takes only release-ready merges.
