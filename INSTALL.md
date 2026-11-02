# Installing the Flutterbase

You are an agent installing this kit for the user. It installs once per user, never into a
project folder, and works with Claude Code, Codex, opencode, Antigravity and Cursor in any
combination.

## 1. Find out which harnesses to install for

Run the detector first, so the question you ask is about this machine rather than a guess:

```bash
curl -fsSL https://raw.githubusercontent.com/kratagyaagarwal2262/flutterbase/main/install.sh | bash -s -- list
```

It prints each supported harness and marks the ones found. Ask the user which of them they want
the kit in, recommending the detected ones. The choice is theirs: a harness can be installed but
unused, and installing for it only adds files.

The step is done when you have a list of harness ids from `claude`, `codex`, `opencode`,
`antigravity`, `cursor`.

## 2. Install

```bash
curl -fsSL https://raw.githubusercontent.com/kratagyaagarwal2262/flutterbase/main/install.sh | bash -s -- --for <ids, comma-separated>
```

For **Claude Code**, the kit is a managed plugin. When the `claude` command is on PATH the
installer adds it; otherwise it prints two `/plugin` commands. Tell the user to type those inside
Claude Code, since only they can run a slash command there.

The step is done when the installer's summary lists every chosen harness with no `failed` line.

## 3. Check it

```bash
~/.flutterbase/bin/kit doctor
```

Report its result to the user as it stands. `all good` means every chosen harness sees all the
kit's skills once. A line starting with `!` is a problem to report, with the fix it names.

## 4. Models (optional)

Until models are chosen, every Flutterbase sub-agent outside Claude Code runs on whatever model the
session uses. `install/roles.json` says what each agent's role needs. `~/.flutterbase/bin/kit models show`
prints the current choice; `kit models set <models.json>` pins one in every installed harness. Skip
this step unless the user asks for it.

## 5. Tell the user what changed and what is next

- Restart each harness so it loads the new skills.
- In each Flutter or Supabase project, ask the agent to set the project up with Flutterbase. It calls
  `flutter-supabase-setup`, which records the project's stack so every skill writes code the way the
  project already does.
- For delivery work (proposals, sprints, QA gates), also install Spec-to-Ship
  (`https://raw.githubusercontent.com/kratagyaagarwal2262/spec-to-ship/main/INSTALL.md`). Flutterbase works
  without it and answers its stack slots when both are installed.
- To update later, run `~/.flutterbase/bin/kit update`. It installs the latest release for the
  same harnesses and lists what changed.

## Updating

```bash
~/.flutterbase/bin/kit update
```

It installs the newest release for every harness already installed, prints the changelog entries
since the installed version, and reminds the user to restart. A **Migration** line in that output
names a step for projects set up before that release.

## Removing it

```bash
~/.flutterbase/bin/kit uninstall              # every harness
~/.flutterbase/bin/kit uninstall --for codex  # one harness
```

Uninstall removes exactly the files and config entries the install recorded. Settings the user
changed themselves stay.
