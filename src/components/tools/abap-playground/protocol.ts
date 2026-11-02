// Wire format of the LokalCraft engine (see lokalcraft/src/lib.rs, module `web`)
// and the small parsers the playground UI needs. No React here, so it can be
// tested on its own.

export type EngineFn = "lc_run" | "lc_test" | "lc_debug" | "lc_format" | "lc_check" | "lc_complete" | "lc_help" | "lc_screen";

export type Tables = Record<string, string>;

const GS = "\x1D"; // sections
const RS = "\x1E"; // records
const US = "\x1F"; // fields

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local time as YYYYMMDDHHMMSS+HHMM for sy-datum / sy-uzeit and the UTC offset (time stamps). */
export function nowStamp(d = new Date()) {
  const off = -d.getTimezoneOffset();
  const zone = `${off < 0 ? "-" : "+"}${pad(Math.floor(Math.abs(off) / 60))}${pad(Math.abs(off) % 60)}`;
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${zone}`;
}

/** A click on an ALV grid, replayed by running the program again (see lc_run). */
export interface AlvEvent {
  grid: number;
  kind: "DOUBLE_CLICK" | "LINK_CLICK" | "ADDED_FUNCTION" | "LINE_SELECTION";
  /** row in the internal table, 1-based (0 for a toolbar function) */
  row: number;
  /** column, the function name for ADDED_FUNCTION, or the clicked lines per list ("5,7") for LINE_SELECTION */
  column: string;
}

/** Selection screen input by field name: [[value]] for PARAMETERS, [sign, option, low, high] rows for SELECT-OPTIONS. */
export type ScreenValues = Record<string, string[][]>;

export function makeInput(code: string, tables: Tables, now = nowStamp(), event?: AlvEvent, screen?: ScreenValues) {
  const wire = Object.entries(tables)
    .map(([name, csv]) => name + US + csv)
    .join(RS);
  const ev = event ? [event.grid, event.kind, event.row, event.column].join(US) : "";
  let tail = event || screen ? GS + ev : "";
  if (screen) {
    const recs: string[] = [];
    for (const [name, rows] of Object.entries(screen)) {
      if (!rows.length) recs.push(name);
      for (const r of rows) recs.push([name, ...r].join(US));
    }
    tail += GS + recs.join(RS);
  }
  return now + GS + code + GS + wire + tail;
}

/** A field of the selection screen (lc_screen). */
export interface ScreenField {
  name: string;
  /** P parameter, S select-options, C checkbox, R radio button */
  kind: "P" | "S" | "C" | "R";
  /** c n d t i p f s */
  ty: string;
  len: number;
  dec: number;
  group: string;
  obl: boolean;
  lower: boolean;
  noint: boolean;
  noext: boolean;
  hidden: boolean;
  /** text of the " comment on the declaration line */
  label: string;
  /** SELECTION-SCREEN block ("" outside blocks) */
  block?: string;
  /** default values after INITIALIZATION, same shape as ScreenValues */
  rows: string[][];
}

export interface Screen {
  err: EngineError | null;
  fields: ScreenField[];
  /** SELECTION-SCREEN BEGIN OF BLOCK: name and frame title */
  blocks?: { name: string; title: string }[];
}

export function makeScreenInput(code: string, tables: Tables) {
  const wire = Object.entries(tables)
    .map(([name, csv]) => name + US + csv)
    .join(RS);
  return code + GS + wire;
}

/** One database statement of a run (SQL trace). */
export interface SqlStatement {
  line: number;
  op: string;
  table: string;
  rows: number;
}

export interface EngineError {
  line: number;
  msg: string;
}

function head(text: string): EngineError | null {
  const [st, line, ...rest] = text.split(US);
  return st === "ERR" ? { line: Number(line) || 0, msg: rest.join(US) } : null;
}

export interface RunResult {
  error: EngineError | null;
  output: string;
  /** tables written back by COMMIT WORK or the end of the program */
  saved: Tables;
  sql: SqlStatement[];
}

export function parseRun(text: string): RunResult {
  const [h, output = "", tables = "", sqlRaw = ""] = text.split(GS);
  const saved: Tables = {};
  for (const rec of tables.split(RS)) {
    const i = rec.indexOf(US);
    if (i > 0) saved[rec.slice(0, i)] = rec.slice(i + 1);
  }
  const sql = sqlRaw
    .split(RS)
    .filter(Boolean)
    .map((r) => {
      const [line, op, table, rows] = r.split(US);
      return { line: Number(line) || 0, op, table, rows: Number(rows) || 0 };
    });
  return { error: head(h), output, saved, sql };
}

export interface TestCase {
  cls: string;
  method: string;
  status: "pass" | "fail" | "error";
  line: number;
  msg: string;
}

export interface Coverage {
  /** lines of METHOD / FORM / FUNCTION statements (test classes excluded) */
  lines: number[];
  covered: number[];
}

export interface TestRun {
  error: EngineError | null;
  output: string;
  results: TestCase[];
  coverage: Coverage;
}

export function parseTest(text: string): TestRun {
  const [h, output = "", rows = "", cov = ""] = text.split(GS);
  const [all = "", hit = ""] = cov.split(US);
  const nums = (s: string) => s.split(",").filter(Boolean).map(Number);
  const coverage = { lines: nums(all), covered: nums(hit) };
  const results = rows
    .split(RS)
    .filter(Boolean)
    .map((r) => {
      const [cls, method, status, line, msg] = r.split(US);
      return { cls, method, status: status as TestCase["status"], line: Number(line) || 0, msg: msg ?? "" };
    });
  return { error: head(h), output, results, coverage };
}

/** A value in the debugger: elementary, structure, table or object reference. */
export type DebugValue =
  | { k: "v"; v: string }
  | { k: "s"; f: [string, DebugValue][] }
  | { k: "t"; n: number; c: string[]; r: string[][] }
  | { k: "r"; v: string; c: string; f: [string, DebugValue][] };

export interface DebugStep {
  /** line */
  l: number;
  /** call depth */
  d: number;
  /** frame label, e.g. lcl_account->withdraw */
  f: string;
  /** characters of output written before this step */
  o: number;
  /** [scope, name, type, value id] */
  v: [string, string, string, number][];
}

export interface DebugRun {
  trace: { steps: DebugStep[]; vals: DebugValue[]; truncated: boolean } | null;
  out: string;
  err: EngineError | null;
}

export function parseDebug(text: string): DebugRun {
  return JSON.parse(text) as DebugRun;
}

/** An ALV grid from cl_salv_table->display( ). */
export interface AlvData {
  /** number of the grid in the program's output (0 = first display( )) */
  id: number;
  /** events with a SET HANDLER: DOUBLE_CLICK, LINK_CLICK, ADDED_FUNCTION */
  events: string[];
  /** row of the internal table (1-based) for each displayed row */
  idx: number[];
  title: string;
  striped: boolean;
  /** toolbar functions (sort / filter) switched on with get_functions( )->set_all( ) */
  functions: boolean;
  /** own toolbar buttons from add_function( ): [name, text, tooltip] */
  buttons?: [string, string, string][];
  /** hot: a hotspot column (set_cell_type( if_salv_c_cell_type=>hotspot )) */
  cols: { name: string; text: string; num: boolean; hot?: boolean }[];
  rows: string[][];
  /** [column, descending] */
  sort: [string, boolean][];
  /** [column, aggregation, value] */
  totals: [string, string, string][];
}

export type OutputBlock =
  | { kind: "text"; text: string; firstLine?: number }
  | { kind: "grid"; title: string; headers: string[]; numeric: boolean[]; rows: string[][] }
  | { kind: "alv"; alv: AlvData };

/**
 * A program with AT LINE-SELECTION marks its list output with \x10level\x11: the
 * list's lines can be double-clicked. Returns the level and the output after the mark.
 */
export function listOf(output: string): { level: number | null; body: string } {
  const m = /^\x10(\d+)\x11/.exec(output);
  return m ? { level: Number(m[1]), body: output.slice(m[0].length) } : { level: null, body: output };
}

/** Splits program output into plain list text and cl_demo_output tables. */
export function splitOutput(body: string, keepLines = false): OutputBlock[] {
  const blocks: OutputBlock[] = [];
  let lineNo = 1;
  for (const part of body.split(/(\x02[\s\S]*?\x03|\x0E[\s\S]*?\x0F)/)) {
    if (!part) continue;
    const startLine = lineNo;
    lineNo += part.split("\n").length - 1;
    if (part.startsWith("\x0E")) {
      try {
        blocks.push({ kind: "alv", alv: JSON.parse(part.slice(1, -1)) as AlvData });
      } catch {
        blocks.push({ kind: "text", text: "(ALV output could not be read)" });
      }
    } else if (part.startsWith("\x02")) {
      const [title, heads = "", nums = "", ...rows] = part.slice(1, -1).split(RS);
      blocks.push({
        kind: "grid",
        title,
        headers: heads.split(US),
        numeric: nums.split(US).map((x) => x === "1"),
        rows: rows.map((r) => r.split(US)),
      });
    } else {
      if (keepLines) {
        // interactive lists: keep every line, so line numbers match the engine's
        blocks.push({ kind: "text", text: part, firstLine: startLine });
      } else {
        const text = part.replace(/^\n+/, "").replace(/\n+$/, "");
        if (text) blocks.push({ kind: "text", text });
      }
    }
  }
  return blocks;
}

/** Output written before the n-th character (the debugger counts characters, not UTF-16 units). */
export function outputUpTo(out: string, chars: number) {
  let i = 0;
  let c = 0;
  for (const ch of out) {
    if (c === chars) break;
    i += ch.length;
    c++;
  }
  return out.slice(0, i);
}

/** base64url of UTF-8 text, used for #kode= links from articles. */
export function encodeCode(code: string) {
  const bytes = new TextEncoder().encode(code);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCode(b64: string) {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm + "=".repeat((4 - (norm.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface Finding {
  level: "E" | "W" | "I";
  line: number;
  msg: string;
}

/** lc_check output: level \x1F line \x1F message, \x1E between findings. */
export function parseCheck(text: string): Finding[] {
  return text
    .split(RS)
    .filter(Boolean)
    .map((r) => {
      const [level, line, ...msg] = r.split(US);
      return { level: (level as Finding["level"]) || "I", line: Number(line) || 0, msg: msg.join(US) };
    });
}

/** lc_format input: "U" keeps keywords upper case, "L" writes everything lower case. */
export function makeFormatInput(code: string, upper = true) {
  return (upper ? "U" : "L") + GS + code;
}

export interface CompletionItem {
  /** label */
  l: string;
  /** kind: keyword, snippet, variable, method, attribute, function, class, table, type, field, constant */
  k: string;
  /** detail */
  d: string;
  /** text to insert; $0 marks the cursor */
  i: string;
}

export interface Completions {
  from: number;
  items: CompletionItem[];
}

export function makeCompleteInput(code: string, line: number, col: number, tables: Tables) {
  const wire = Object.entries(tables)
    .map(([name, csv]) => name + US + csv)
    .join(RS);
  return `${line}${US}${col}${GS}${code}${GS}${wire}`;
}

export interface HelpEntry {
  word: string;
  title?: string;
  syntax?: string;
  text?: string;
  example?: string;
}

export function makeHelpInput(code: string, line: number, col: number) {
  return `${line}${US}${col}${GS}${code}`;
}

/** What a share link carries: the program and the tables that differ from the defaults. */
export interface Shared {
  code: string;
  tables?: Tables;
}

function b64url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string) {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm + "=".repeat((4 - (norm.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** #bagi= value: "z" + deflate-raw + base64url, or "p" + base64url where CompressionStream is missing. */
export async function encodeShare(data: Shared) {
  const raw = new TextEncoder().encode(JSON.stringify(data));
  if (typeof CompressionStream !== "undefined") return "z" + b64url(await pipe(raw, new CompressionStream("deflate-raw")));
  return "p" + b64url(raw);
}

export async function decodeShare(value: string): Promise<Shared> {
  const bytes = unb64url(value.slice(1));
  const raw = value[0] === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes;
  const data = JSON.parse(new TextDecoder().decode(raw)) as Shared;
  if (typeof data.code !== "string") throw new Error("link tidak berisi program");
  return data;
}
