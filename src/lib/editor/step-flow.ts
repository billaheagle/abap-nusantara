/**
 * Articles sketch iFlow step sequences in ```text blocks:
 *
 *   Start
 *    → GS_ReadOrderRequest         simpan p_orderId
 *    → PC_EnsureAccessToken        → LIP_EnsureAccessToken
 *    → RTR_ByStoredAction
 *        FromStore → CM_UseStoredResult → End_FromStore
 *        ├─ Token baru (p_tokenValid = 'false')
 *        │    → RR_FetchToken      POST …/auth/token
 *   End
 *   EXS_HandleError                (dibuat ulang)
 *
 * or as one line: `CM_SetAuthHeader → GS_BuildStringToSign → SGN_SignRequest`.
 * This turns such a block into rows the renderer draws as a step list, so the
 * markdown stays plain text and new articles get the look for free. Anything
 * that doesn't look like a step sketch stays a normal code block. Pure and
 * client-safe.
 */

export type StepKind = "event" | "step" | "branch" | "section" | "more";

export interface StepRow {
  kind: StepKind;
  /** Nesting level, 0 for the main line. */
  depth: number;
  /** Step or event name; for a branch, its label. */
  name: string;
  /** Text after the name (two or more spaces in the source), or a branch condition. */
  note?: string;
}

/** Step names follow <PREFIX>_<Name>: GS_, CM_, RR_, LIP_, EXS_, End_… */
const STEP_NAME = /^(?:[A-Z]{2,4}_[A-Za-z0-9_]+|End_[A-Za-z0-9_]+|LIP_[A-Za-z0-9_]+)/;
const EVENT = /^(Start|End)\b/;
const ARROW = /\s*→\s*/;
const TREE = /^[│├└─\s]+/;

const splitNote = (text: string) => {
  const m = text.match(/^(\S+(?: \S+)*?)\s{2,}(.+)$/);
  return m ? { name: m[1], note: m[2].trim() } : { name: text.trim() };
};

function stepRow(name: string, depth: number, note?: string): StepRow {
  const n = name.trim();
  if (/^(\.{3}|…)$/.test(n)) return { kind: "more", depth, name: "…" };
  return { kind: EVENT.test(n) && !STEP_NAME.test(n) ? "event" : "step", depth, name: n, note };
}

/** Whether a code block reads as a step sketch (and should be drawn as one). */
export function isStepFlow(language: string | null | undefined, text: string): boolean {
  if (language && !["text", "plaintext", "txt"].includes(language)) return false;
  if (!text.includes("→")) return false;
  const lines = text.split("\n").filter((l) => l.trim());
  const names = (text.match(/\b[A-Z]{2,4}_[A-Za-z0-9]/g) ?? []).length;
  const arrowLines = lines.filter((l) => /^\s*(?:[│├└─]\s*)*→/.test(l)).length;
  const chain = lines.length === 1 && lines[0].split("→").length >= 3;
  return names >= 2 && (arrowLines >= 2 || chain);
}

export function parseStepFlow(text: string): StepRow[] {
  const lines = text.replace(/\s+$/gm, "").split("\n").filter((l) => l.trim());

  // Column where each line's content starts (the arrow counts as content);
  // distinct columns become nesting levels, with 0 and 1 both the main line.
  const columns = lines.map((l) => {
    const afterTree = l.replace(TREE, (m) => " ".repeat(m.length));
    return afterTree.search(/\S/);
  });
  const levels = [...new Set(columns.map((c) => (c <= 1 ? 0 : c)))].sort((a, b) => a - b);
  const depthOf = (col: number) => levels.indexOf(col <= 1 ? 0 : col);

  const rows: StepRow[] = [];
  lines.forEach((line, i) => {
    const depth = depthOf(columns[i]);
    const content = line.replace(TREE, "").trim();

    if (/^\.{3}|^…/.test(content) && !content.includes("→")) {
      rows.push({ kind: "more", depth, name: "…" });
      return;
    }

    // Several steps on one line ("A → B → C", "→ GS_X → End Message") become
    // one row each, so every sketch reads as the same vertical list. A note
    // (after two spaces) belongs to the last step on the line.
    const pushSteps = (steps: string[], at: number) => {
      const last = splitNote(steps[steps.length - 1]);
      steps[steps.length - 1] = last.name;
      steps.forEach((s, k) => rows.push(stepRow(s, at, k === steps.length - 1 ? last.note : undefined)));
    };

    // "→ STEP  note": a step on the current line of the flow. A note that
    // itself starts with an arrow ("→ LIP_X") stays a note.
    if (content.startsWith("→")) {
      const rest = content.replace(/^→\s*/, "");
      const { name, note } = splitNote(rest);
      if (note) rows.push(...name.split(ARROW).map((s, k, all) => stepRow(s, depth, k === all.length - 1 ? note : undefined)));
      else pushSteps(rest.split(ARROW), depth);
      return;
    }

    const parts = content.split(ARROW).filter(Boolean);
    if (parts.length > 1) {
      const first = parts[0];
      if (STEP_NAME.test(first) || /^(\.{3}|…)$/.test(first)) {
        pushSteps(parts, depth);
      } else {
        // A branch label followed by its steps: "Resolved → A → B", "Send → CM_X   note".
        rows.push({ kind: "branch", depth, name: first });
        pushSteps(parts.slice(1), depth + 1);
      }
      return;
    }

    // "├─ Token baru (p_tokenValid = 'false')", "└─ Default: token masih berlaku".
    if (/^[├└]/.test(line.trim())) {
      const m = content.match(/^([^(:]+?)(?:\s*[(:]\s*(.+?)\)?)?$/);
      rows.push({ kind: "branch", depth, name: (m?.[1] ?? content).trim(), note: m?.[2]?.trim() });
      return;
    }

    if (EVENT.test(content)) {
      const m = content.match(/^(Start|End)(?:\s+(.*))?$/);
      rows.push({ kind: "event", depth, name: m?.[1] ?? content, note: m?.[2]?.replace(/^\((.*)\)$/, "$1") });
      return;
    }

    const { name, note } = splitNote(content);
    // A step name on its own line at the main level starts a separate part:
    // the Exception Subprocess, or a LIP described after the main flow.
    rows.push({ kind: depth === 0 && STEP_NAME.test(name) ? "section" : "step", depth, name, note });
  });
  return rows;
}

/** What a step name's prefix stands for, shown as the badge colour and tooltip. */
export function stepType(name: string): { tag: string; tone: string; title: string } {
  const prefix = name.split("_")[0];
  const table: Record<string, [string, string]> = {
    GS: ["script", "Groovy Script"],
    CM: ["modifier", "Content Modifier"],
    RR: ["call", "Request Reply"],
    PC: ["process", "Process Call"],
    LPC: ["process", "Looping Process Call"],
    IPC: ["process", "Idempotent Process Call"],
    LIP: ["process", "Local Integration Process"],
    RTR: ["router", "Router"],
    DSW: ["store", "Data Store Write"],
    DSG: ["store", "Data Store Get"],
    DSD: ["store", "Data Store Delete"],
    DSS: ["store", "Data Store Select"],
    SPL: ["split", "Splitter"],
    GTH: ["split", "Gather"],
    SGN: ["sign", "Simple Signer"],
    VAR: ["store", "Write Variables"],
    EXS: ["error", "Exception Subprocess"],
    End: ["event", "End"],
  };
  const [tone, title] = table[prefix] ?? ["step", "Step"];
  return { tag: prefix === "End" ? "" : prefix, tone, title };
}
