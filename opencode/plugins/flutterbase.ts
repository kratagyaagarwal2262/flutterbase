import type { Plugin } from "@opencode-ai/plugin";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * flutterbase hooks for opencode.
 *
 * Source of truth: this file. `scripts/kit.py install --for opencode` links it into
 * `~/.config/opencode/plugins/`; never hand-edit the installed copy.
 *
 * Parity with the kit's command hooks (`hooks/flutterbase-hook.py`):
 * - `format` (after Edit|Write) → below: after an `edit` or `write` of a
 *   `.dart` file, run `dart format` on it when `dart` is on PATH. Done here
 *   rather than through opencode's `formatter` key, which would switch on
 *   every built-in formatter in every project the user opens.
 * - `fixtures` (before Bash) → below: before a `git commit`
 *   or `git push`, scan `lib/` for fixture-mode artefacts and surface a
 *   heads-up in the tool output. Never blocks, never fails closed.
 *   The hook matches `input.tool === "bash"`: that is opencode's shell tool id
 *   (`packages/opencode/src/tool/shell/id.ts` keeps `ToolID = "bash"` for
 *   compatibility; the `shell.ts` filename and the registry's local variable
 *   name are not the id).
 *
 * Everything here fails open: any unexpected
 * error in the fixture scan is swallowed so the tool still runs.
 */

// Walk up from the session directory to the Flutter project root.
function findProjectRoot(startDir: string): string {
  let dir = path.resolve(startDir);
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "pubspec.yaml"))) return dir;
    } catch {
      return startDir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

function listDartFiles(root: string, out: string[], budget: { n: number }): void {
  if (budget.n <= 0) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (budget.n <= 0) return;
    if (e.name.startsWith(".")) continue;
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      if (e.name === "build" || e.name === ".dart_tool") continue;
      listDartFiles(full, out, budget);
    } else if (e.isFile() && e.name.endsWith(".dart")) {
      out.push(full);
      budget.n -= 1;
    }
  }
}

// Mirror of the `fixtures` check in hooks/flutterbase-hook.py: features whose README still says
// "fixture mode", plus dangling FIXTURE_START / FIXTURE_END markers.
function fixtureHeadsUp(projectRoot: string): string | null {
  const featuresDir = path.join(projectRoot, "lib", "features");
  const libDir = path.join(projectRoot, "lib");
  if (!fs.existsSync(libDir)) return null;

  const fixtureFeatures: string[] = [];
  try {
    for (const feature of fs.readdirSync(featuresDir)) {
      const readme = path.join(featuresDir, feature, "README.md");
      try {
        if (fs.readFileSync(readme, "utf8").includes("fixture mode")) {
          fixtureFeatures.push(feature);
        }
      } catch {
        // No README for this feature; nothing to report.
      }
    }
  } catch {
    // No lib/features yet (greenfield); fall through to the marker count.
  }

  let markerCount = 0;
  const dartFiles: string[] = [];
  listDartFiles(libDir, dartFiles, { n: 2000 });
  for (const f of dartFiles) {
    try {
      const text = fs.readFileSync(f, "utf8");
      const m = text.match(/FIXTURE_(START|END)/g);
      if (m) markerCount += m.length;
    } catch {
      // Unreadable file; skip it.
    }
  }

  if (fixtureFeatures.length === 0 && markerCount === 0) return null;

  let message = "Heads up: this repo still has fixture-mode artefacts.";
  if (fixtureFeatures.length > 0) {
    message += ` Features in fixture mode: ${fixtureFeatures.join(",")}.`;
  }
  if (markerCount > 0) {
    message += ` ${markerCount} FIXTURE_START/FIXTURE_END marker(s) remain in lib/.`;
  }
  message +=
    " If shipping fixtures is intentional, proceed - otherwise upgrade them with /fk-build first.";
  return message;
}

export default (async ({ client, directory }) => {
  // The documented place to read a tool's args is `tool.execute.before`, so the
  // .dart path is recorded there and formatted once the write has landed.
  const pendingFormat = new Map<string, string>();
  return {
    "tool.execute.after": async (input: any) => {
      const key = String(input?.callID ?? input?.tool ?? "");
      const file = pendingFormat.get(key);
      if (!file) return;
      pendingFormat.delete(key);
      try {
        if (fs.existsSync(file)) {
          spawnSync("dart", ["format", file], { stdio: "ignore", timeout: 60_000 });
        }
      } catch {
        // Fail open: formatting never breaks an edit.
      }
    },
    "tool.execute.before": async (input: any, output: any) => {
      const tool = input?.tool as string | undefined;
      const args = (output?.args ?? {}) as Record<string, unknown>;

      // The shell tool's registry id is `bash` (see the header comment);
      // `shell` is only its filename. Match the id.
      if (tool === "bash") {
        const command = String(args["command"] ?? "");
        // Only act on commit / push, not status / log / diff.
        if (/git\s+(commit|push)/.test(command)) {
          try {
            const message = fixtureHeadsUp(findProjectRoot(directory));
            if (message) {
              try {
                await client.app.log({
                  body: {
                    service: "flutterbase",
                    level: "warn",
                    message,
                  },
                });
              } catch {
                // Logging must never break the tool call.
              }
              // Surface the heads-up where the agent will see it: stderr of
              // this same invocation. The git command itself runs unchanged.
              const escaped = message.replace(/'/g, `'\\''`);
              output.args["command"] = `echo '${escaped}' >&2; ${command}`;
            }
          } catch {
            // Fail open: a broken scan never blocks a commit.
          }
        }
        return;
      }

      // File-write tools: `edit` and `write` (ids are literal).
      if (tool === "edit" || tool === "write") {
        const file = String(args["filePath"] ?? "");
        if (file.endsWith(".dart")) {
          pendingFormat.set(String(input?.callID ?? tool), path.resolve(directory, file));
        }
      }

    },
  };
}) satisfies Plugin;
