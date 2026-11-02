# Changelog

What changed in each Flutterbase version, and what a project or an install has to do about it. A
**Migration** line means something you already have stops working until you act on it.

## 1.0.0

First release: the Flutter and Supabase stack kit.

- 24 skills for Flutter apps and Supabase backends: architecture, feature scaffolds, state, models, repositories, screens, navigation, design, tests, performance, security, accessibility, localization, dependency upgrades, build failures and store compliance.
- Six slot skills (`flutter-supabase-setup`, `-conventions`, `-design`, `-build`, `-verify`, `-release`) that answer Spec-to-Ship's `project-stack`, and also fire on their own.
- Five layer agents: state, repository, UI, test, and the store-document writer.
- Works alone: no skill calls a Spec-to-Ship skill or names a Spec-to-Ship command.
- Hooks: `dart format` after an edit, and a heads-up before a commit when fixture-mode code remains, with an opencode plugin equivalent.
- Installs once per user for Claude Code, Codex, opencode, Antigravity and Cursor.

**Migration:** none. This is the first release.
