"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bug, FlaskConical, ListChecks, Play, Share2, WandSparkles } from "lucide-react";
import { AbapEngine, EngineTimeout } from "./engine";
import {
  decodeCode,
  makeInput,
  outputUpTo,
  parseDebug,
  parseRun,
  parseTest,
  parseCheck,
  makeFormatInput,
  type Finding,
  type AlvEvent,
  makeCompleteInput,
  makeHelpInput,
  makeScreenInput,
  encodeShare,
  decodeShare,
  type Screen,
  type ScreenField,
  type ScreenValues,
  type SqlStatement,
  type Completions,
  type HelpEntry,
  type DebugRun,
  type EngineError,
  type EngineFn,
  type Tables,
} from "./protocol";
import { CodeEditor, type Jump } from "./code-editor";
import { ErrorBox, OutputView } from "./output-view";
import { DebugBar, VariablesView, type StepKind } from "./debug-view";
import { TablesEditor } from "./tables-editor";
import { TestsView, type Exercise, type TestOutcome } from "./tests-view";
import { ScreenView, SqlView } from "./screen-view";
import examplesJson from "./content/examples.json";
import exercisesJson from "./content/exercises.json";
import tablesJson from "./content/tables.json";
import styles from "./playground.module.css";

interface Example {
  id: string;
  title: string;
  code: string;
}

const EXAMPLES = examplesJson as Example[];
const EXERCISES = exercisesJson as Exercise[];
const DEFAULT_TABLES = tablesJson as Tables;
const STORE_KEY = "an-abap-playground-v1";
/** program id for code opened from an article's "Coba di Playground" link */
const ARTICLE = "artikel";

interface Saved {
  program: string;
  code: Record<string, string>;
  breakpoints: Record<string, number[]>;
  done: Record<string, boolean>;
  tables: Tables;
  /** last selection screen input per program */
  screens: Record<string, ScreenValues>;
}

function loadSaved(): Saved {
  const base: Saved = { program: EXAMPLES[0].id, code: {}, breakpoints: {}, done: {}, tables: { ...DEFAULT_TABLES }, screens: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Saved>;
      // tables added in a newer version (CDS views, programs for SUBMIT ...) show up next to the saved ones
      return { ...base, ...saved, tables: { ...DEFAULT_TABLES, ...(saved.tables ?? {}) } };
    }
  } catch {
    // private mode or corrupted entry: start fresh
  }
  return base;
}

function exerciseOf(program: string) {
  return program.startsWith("ex:") ? EXERCISES.find((x) => `ex:${x.id}` === program) ?? null : null;
}

function initialCode(program: string, saved: Saved) {
  const own = saved.code[program];
  if (own !== undefined) return own;
  const ex = exerciseOf(program);
  if (ex) return ex.starter;
  return (EXAMPLES.find((x) => x.id === program) ?? EXAMPLES[0]).code;
}

function knownProgram(program: string, saved: Saved) {
  if (program === ARTICLE) return saved.code[ARTICLE] !== undefined;
  return !!exerciseOf(program) || EXAMPLES.some((x) => x.id === program);
}

type Status = { kind: "" | "ok" | "err" | "busy" | "dbg"; text: ReactNode };
type RightTab = "out" | "vars" | "tests" | "check" | "help" | "screen" | "sql";
type OutView = { output: string; error: EngineError | null; note?: ReactNode } | null;
interface Debugging {
  run: DebugRun & { trace: NonNullable<DebugRun["trace"]> };
  pos: number;
}

/** Reads storage and the deep link (#kode=, ?latihan=, ?contoh=). The tool is rendered client-only. */
function boot(): Saved {
  const s = loadSaved();
  const url = new URL(window.location.href);
  const fromHash = new URLSearchParams(url.hash.slice(1)).get("kode");
  const latihan = url.searchParams.get("latihan");
  const contoh = url.searchParams.get("contoh");
  if (fromHash) {
    try {
      s.code[ARTICLE] = decodeCode(fromHash);
      s.program = ARTICLE;
    } catch {
      // a broken link: just open the playground normally
    }
  } else if (latihan && exerciseOf(`ex:${latihan}`)) {
    s.program = `ex:${latihan}`;
  } else if (contoh && EXAMPLES.some((x) => x.id === contoh)) {
    s.program = contoh;
  }
  if (!knownProgram(s.program, s)) s.program = EXAMPLES[0].id;
  return s;
}

function firstBreak(steps: { l: number }[], from: number, bps: number[]) {
  const b = new Set(bps);
  let i = from + 1;
  if (from >= 0) while (i < steps.length && steps[i].l === steps[from].l) i++; // leave the current line first
  for (; i < steps.length; i++) if (b.has(steps[i].l)) return i;
  return -1;
}

function clock() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function AbapPlayground() {
  const [saved, setSaved] = useState<Saved>(boot);
  const [code, setCode] = useState(() => initialCode(saved.program, saved));
  const [status, setStatus] = useState<Status>({ kind: "busy", text: "Menyiapkan mesin ABAP…" });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leftTab, setLeftTab] = useState<"src" | "db">("src");
  const [rightTab, setRightTab] = useState<RightTab>(() => (exerciseOf(saved.program) ? "tests" : "out"));
  const [out, setOut] = useState<OutView>(null);
  const [tests, setTests] = useState<TestOutcome | null>(null);
  const [dbg, setDbg] = useState<Debugging | null>(null);
  const [errLine, setErrLine] = useState(0);
  const [jump, setJump] = useState<Jump | null>(null);
  const [when, setWhen] = useState("");
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [help, setHelp] = useState<HelpEntry | null>(null);
  // selection screen of the program being started, and the code it was read from
  const [screen, setScreen] = useState<{ fields: ScreenField[]; code: string; blocks: { name: string; title: string }[] } | null>(null);
  // AT LINE-SELECTION: the lines clicked so far, one per list level
  const linePath = useRef<number[]>([]);
  const [sql, setSql] = useState<SqlStatement[] | null>(null);
  const [showCov, setShowCov] = useState(true);
  const engine = useRef<AbapEngine | null>(null);
  // code, tables and screen input of the last run: an ALV click replays exactly that run plus the event
  const lastRun = useRef<{ code: string; tables: Tables; screen?: ScreenValues } | null>(null);
  const booted = useRef(false);
  const testedCode = useRef("");

  // Keep #kode= out of the address bar, so a refresh keeps the user's edits.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const bagi = hash.get("bagi");
    const clear = () => history.replaceState(null, "", window.location.pathname + window.location.search);
    if (bagi) {
      // a link from "Bagikan": the program and the tables it needs
      decodeShare(bagi)
        .then((d) => {
          setSaved((s) => ({ ...s, program: ARTICLE, code: { ...s.code, [ARTICLE]: d.code }, tables: { ...s.tables, ...(d.tables ?? {}) } }));
          setCode(d.code);
          setOut(null);
          setStatus({ kind: "", text: <>Program dari link dibuka. Tekan <strong>Jalankan</strong> (F8).</> });
        })
        .catch(() => setStatus({ kind: "err", text: "Link program rusak atau terpotong, jadi tidak bisa dibuka." }))
        .finally(clear);
    } else if (hash.has("kode")) clear();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    } catch {
      // storage full or blocked; the playground still works for this visit
    }
  }, [saved]);

  const program = saved.program;
  const exercise = exerciseOf(program);
  const breakpoints = saved.breakpoints[program] ?? [];

  const update = (fn: (s: Saved) => Saved) => setSaved(fn);

  // ---------- engine ----------
  useEffect(() => {
    const e = new AbapEngine((state, detail) => {
      if (state === "ready") {
        setReady(true);
        // The first run happens once the engine is up, so the page never opens empty.
        if (!booted.current) {
          booted.current = true;
          keys.current.boot();
        } else setStatus({ kind: "", text: "Siap." });
      } else setStatus({ kind: "err", text: `Mesin ABAP tidak bisa berjalan di browser ini: ${detail ?? ""}` });
    });
    engine.current = e;
    e.start();
    return () => e.dispose();
  }, []);

  async function call(fn: EngineFn, src: string, label: string, raw = false) {
    const e = engine.current;
    if (!e || !e.ready) {
      setStatus({ kind: "busy", text: "Mesin masih disiapkan…" });
      return null;
    }
    setBusy(true);
    setStatus({ kind: "busy", text: label });
    try {
      return await e.call(fn, raw ? src : makeInput(src, saved.tables));
    } catch (err) {
      const msg =
        err instanceof EngineTimeout
          ? "Dihentikan setelah 15 detik. Cek apakah ada loop yang tidak pernah selesai."
          : `Terjadi galat internal pada mesin: ${err instanceof Error ? err.message : String(err)}`;
      setOut({ output: "", error: { line: 0, msg } });
      setStatus({ kind: "err", text: msg });
      setRightTab("out");
      return null;
    } finally {
      setBusy(false);
      setWhen(clock());
    }
  }

  /** Completion for the editor: quiet engine call, no busy state. */
  async function complete(src: string, line: number, col: number): Promise<Completions | null> {
    const e = engine.current;
    if (!e || !e.ready || busy) return null;
    try {
      const r = await e.call("lc_complete", makeCompleteInput(src, line, col, saved.tables));
      return JSON.parse(r.text) as Completions;
    } catch {
      return null;
    }
  }

  /** F1: explain the keyword under the cursor in the Bantuan tab. */
  async function showHelp(src: string, line: number, col: number) {
    setRightTab("help");
    const e = engine.current;
    if (!e || !e.ready) return;
    try {
      const r = await e.call("lc_help", makeHelpInput(src, line, col));
      setHelp(JSON.parse(r.text) as HelpEntry);
    } catch {
      setHelp(null);
    }
  }

  /** Pretty Printer (Shift+F1 in SE38). */
  async function prettyPrint() {
    if (dbg) return;
    const r = await call("lc_format", makeFormatInput(code), "Merapikan kode…", true);
    if (!r) return;
    if (r.text === code) {
      setStatus({ kind: "ok", text: "Kode sudah rapi." });
    } else {
      editCode(r.text);
      setStatus({ kind: "ok", text: "Kode dirapikan: indentasi dan huruf besar untuk keyword." });
    }
  }

  /** Static checks, like a small ATC (Ctrl+F2 is the syntax check in SE38). */
  async function checkCode() {
    const r = await call("lc_check", code, "Memeriksa kode…", true);
    if (!r) return;
    const f = parseCheck(r.text);
    setFindings(f);
    setRightTab("check");
    const errs = f.filter((x) => x.level === "E").length;
    const warns = f.filter((x) => x.level === "W").length;
    setErrLine(f.find((x) => x.level === "E")?.line ?? 0);
    setStatus(
      errs
        ? { kind: "err", text: <><strong>{errs} error</strong>{warns ? `, ${warns} peringatan` : ""}</> }
        : warns
          ? { kind: "", text: <><strong>{warns} peringatan</strong> dari cek kode</> }
          : { kind: "ok", text: f.length ? `Tidak ada masalah, ${f.length} saran` : "Tidak ada masalah ditemukan." },
    );
  }

  function stopDebug(quiet = false) {
    if (!dbg) return;
    setDbg(null);
    setRightTab("out");
    if (!quiet) setStatus({ kind: "", text: "Debug selesai." });
  }

  /** PARAMETERS / SELECT-OPTIONS of the current code, with values after INITIALIZATION. */
  async function readScreen(): Promise<Screen | null> {
    const e = engine.current;
    if (!e || !e.ready) return null;
    try {
      const r = await e.call("lc_screen", makeScreenInput(code, saved.tables));
      return JSON.parse(r.text) as Screen;
    } catch {
      return null;
    }
  }

  /** values to run with: what the user typed, else the defaults */
  function screenValues(fields: ScreenField[]): ScreenValues {
    const own = saved.screens[program] ?? {};
    const v: ScreenValues = {};
    for (const f of fields) v[f.name] = own[f.name] ?? f.rows;
    return v;
  }

  /** F8: show the selection screen first when the program has one, like SE38. */
  async function start() {
    if (screen && rightTab === "screen" && screen.code === code) return run(undefined, screenValues(screen.fields));
    const scr = await readScreen();
    if (scr && !scr.err && scr.fields.some((f) => !f.hidden)) {
      setDbg(null);
      setScreen({ fields: scr.fields, code, blocks: scr.blocks ?? [] });
      setRightTab("screen");
      setStatus({ kind: "", text: <>Isi <strong>layar seleksi</strong>, lalu tekan Jalankan (F8).</> });
      return;
    }
    setScreen(null);
    return run();
  }

  async function run(event?: AlvEvent, screenInput?: ScreenValues) {
    setDbg(null);
    const base = event && lastRun.current ? lastRun.current : { code, tables: saved.tables, screen: screenInput };
    if (!event) {
      lastRun.current = base;
      linePath.current = [];
    }
    const label = event ? (event.kind === "LINE_SELECTION" ? "Menjalankan AT LINE-SELECTION…" : `Menjalankan handler ${event.kind.toLowerCase()}…`) : "Menjalankan…";
    const r = await call("lc_run", makeInput(base.code, base.tables, undefined, event, base.screen), label, true);
    if (!r) return;
    const res = parseRun(r.text);
    setSql(res.sql);
    if (event?.kind === "LINE_SELECTION") linePath.current = event.column.split(",").filter(Boolean).map(Number);
    const names = Object.keys(res.saved);
    if (names.length) update((s) => ({ ...s, tables: { ...s.tables, ...res.saved } }));
    setErrLine(res.error?.line ?? 0);
    setOut({ output: res.output, error: res.error });
    setRightTab("out");
    if (res.error) {
      setStatus({
        kind: "err",
        text: res.error.line ? (
          <>
            <strong>Baris {res.error.line}:</strong> {res.error.msg}
          </>
        ) : (
          res.error.msg
        ),
      });
    } else {
      setStatus({
        kind: "ok",
        text: (
          <>
            {event ? (
              <>
                {event.kind === "LINE_SELECTION" ? (
                  <>
                    {event.column ? <>Baris {event.row} dipilih (sy-lsind = {event.column.split(",").length}), selesai dalam </> : <>Kembali ke list dasar, selesai dalam </>}
                  </>
                ) : event.kind === "ADDED_FUNCTION" ? (
                  <>
                    Fungsi <strong>{event.column.toLowerCase()}</strong> selesai dalam{" "}
                  </>
                ) : (
                  <>
                    Event <strong>{event.kind.toLowerCase()}</strong> untuk baris {event.row} kolom {event.column.toLowerCase()} selesai dalam{" "}
                  </>
                )}
              </>
            ) : (
              "Program selesai dalam "
            )}
            <strong>{r.ms < 1 ? "<1" : Math.round(r.ms)} ms</strong>
            {names.length ? ` · tabel ${names.join(", ")} disimpan` : ""}
            {res.sql.length ? ` · ${res.sql.length} perintah SQL` : ""}
          </>
        ),
      });
    }
  }

  async function runTests() {
    setDbg(null);
    const src = exercise ? `${code}\n${exercise.tests}` : code;
    const r = await call("lc_test", src, exercise ? "Memeriksa jawaban…" : "Menjalankan ABAP Unit…");
    if (!r) return;
    const t = parseTest(r.text);
    const lines = code.split("\n").length;
    setTests({ run: t, lines, exercise: exercise?.id ?? null });
    setShowCov(true);
    testedCode.current = code;
    setRightTab("tests");
    setErrLine(t.error && t.error.line <= lines ? t.error.line : 0);
    if (t.error) {
      setStatus({ kind: "err", text: `Program belum bisa diperiksa: ${t.error.msg}` });
      return;
    }
    if (!t.results.length) {
      setStatus({ kind: "", text: "Tidak ada tes ABAP Unit di program ini." });
      return;
    }
    const pass = t.results.filter((x) => x.status === "pass").length;
    const bad = t.results.length - pass;
    if (exercise && !bad) {
      const id = exercise.id;
      update((s) => ({ ...s, done: { ...s.done, [id]: true } }));
    }
    setStatus(
      bad
        ? { kind: "err", text: <><strong>{bad} tes gagal</strong> dari {t.results.length}</> }
        : { kind: "ok", text: <><strong>{pass} tes lulus</strong></> },
    );
  }

  async function debug() {
    if (dbg) return stopDebug();
    const r = await call("lc_debug", code, "Merekam jalannya program…");
    if (!r) return;
    let d: DebugRun;
    try {
      d = parseDebug(r.text);
    } catch (e) {
      setOut({ output: "", error: { line: 0, msg: `Rekaman debugger tidak bisa dibaca: ${String(e)}` } });
      return;
    }
    if (!d.trace || !d.trace.steps.length) {
      if (d.err) {
        setErrLine(d.err.line);
        setOut({ output: d.out, error: d.err });
        setStatus({ kind: "err", text: d.err.msg });
        setRightTab("out");
      } else setStatus({ kind: "", text: "Program tidak punya perintah untuk di-debug." });
      return;
    }
    const first = firstBreak(d.trace.steps, -1, breakpoints);
    setErrLine(0);
    setLeftTab("src");
    setRightTab("vars");
    setDbg({ run: d as Debugging["run"], pos: first >= 0 ? first : 0 });
  }

  const dbgStep = dbg ? dbg.run.trace.steps[dbg.pos] : null;
  const dbgLast = dbg ? dbg.pos === dbg.run.trace.steps.length - 1 : false;
  let shownStatus = status;
  if (dbg) {
    const { trace, err } = dbg.run;
    const total = trace.steps.length;
    if (dbgLast && err) shownStatus = { kind: "err", text: `Program berhenti dengan galat di baris ${err.line}` };
    else if (dbgLast) shownStatus = { kind: "ok", text: "Program selesai. Lihat tab Hasil, atau mundur untuk menelusuri lagi." };
    else
      shownStatus = {
        kind: "dbg",
        text: `Debug · langkah ${dbg.pos + 1} dari ${total}${trace.truncated ? ` · rekaman dibatasi ${total} langkah pertama` : ""}`,
      };
  }

  function step(kind: StepKind) {
    setDbg((d) => {
      if (!d) return d;
      const steps = d.run.trace.steps;
      const last = steps.length - 1;
      const cur = steps[d.pos];
      const at = (i: number) => ({ ...d, pos: Math.max(0, Math.min(i, last)) });
      if (kind === "first") return at(0);
      if (kind === "back") return at(d.pos - 1);
      if (kind === "into") return at(d.pos + 1);
      if (kind === "cont") {
        const n = firstBreak(steps, d.pos, breakpoints);
        return at(n >= 0 ? n : last);
      }
      for (let i = d.pos + 1; i < steps.length; i++) {
        if ((kind === "over" && steps[i].d <= cur.d) || (kind === "out" && steps[i].d < cur.d)) return at(i);
      }
      return at(last);
    });
  }

  /** A link with the program and the tables that differ from the defaults. */
  async function share() {
    const tables: Tables = {};
    for (const [n, csv] of Object.entries(saved.tables)) if (DEFAULT_TABLES[n] !== csv) tables[n] = csv;
    try {
      const v = await encodeShare({ code, tables: Object.keys(tables).length ? tables : undefined });
      const url = `${window.location.origin}${window.location.pathname}#bagi=${v}`;
      try {
        await navigator.clipboard.writeText(url);
        const names = Object.keys(tables);
        setStatus({ kind: "ok", text: `Link program disalin. Isinya kode ini${names.length ? ` dan tabel yang diubah (${names.join(", ")})` : ""}.` });
      } catch {
        setStatus({ kind: "", text: <>Salin link ini: <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={styles.shareUrl} aria-label="Link program" /></> });
      }
    } catch (e) {
      setStatus({ kind: "err", text: `Link tidak bisa dibuat: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  /** Double-click on a list line: replay the run with the clicks so far plus this one. */
  function selectLine(line: number, level: number) {
    const path = [...linePath.current.slice(0, level), line];
    void run({ grid: 0, kind: "LINE_SELECTION", row: line, column: path.join(",") });
  }
  function listBack() {
    const path = linePath.current.slice(0, -1);
    void run({ grid: 0, kind: "LINE_SELECTION", row: path[path.length - 1] ?? 0, column: path.join(",") });
  }

  // ---------- program selection ----------
  function selectProgram(next: string) {
    stopDebug(true);
    const s = { ...saved, program: next };
    setSaved(s);
    setCode(initialCode(next, s));
    setErrLine(0);
    setTests(null);
    setOut(null);
    setScreen(null);
    setSql(null);
    setRightTab(exerciseOf(next) ? "tests" : "out");
    setStatus({
      kind: "",
      text: exerciseOf(next) ? <>Pilih <strong>Periksa</strong> untuk mengecek jawaban latihan.</> : "Siap. Tekan F8 untuk menjalankan.",
    });
  }

  function editCode(v: string) {
    setCode(v);
    setErrLine(0);
    update((s) => ({ ...s, code: { ...s.code, [s.program]: v } }));
  }

  function resetExercise() {
    if (!exercise) return;
    update((s) => {
      const c = { ...s.code };
      delete c[s.program];
      return { ...s, code: c };
    });
    setCode(exercise.starter);
    setTests(null);
    setErrLine(0);
  }

  function toggleBreakpoint(line: number) {
    update((s) => {
      const cur = s.breakpoints[s.program] ?? [];
      const next = cur.includes(line) ? cur.filter((l) => l !== line) : [...cur, line];
      return { ...s, breakpoints: { ...s.breakpoints, [s.program]: next } };
    });
  }

  function showLine(line: number) {
    setLeftTab("src");
    setJump({ line, select: true, nonce: Date.now() });
  }

  // ---------- keyboard ----------
  function bootRun() {
    if (exercise) setStatus({ kind: "", text: <>Pilih <strong>Periksa</strong> untuk mengecek jawaban latihan.</> });
    else void start();
  }
  const openHelp = () => setRightTab("help");
  const back = () => {
    if (linePath.current.length && rightTab === "out") listBack();
  };
  const keys = useRef({ run: start, runTests, debug, step, stopDebug, prettyPrint, checkCode, openHelp, back, boot: bootRun, debugging: false, busy: false });
  useEffect(() => {
    keys.current = { run: start, runTests, debug, step, stopDebug, prettyPrint, checkCode, openHelp, back, boot: bootRun, debugging: !!dbg, busy };
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = keys.current;
      if (k.busy) return;
      if (k.debugging) {
        const map: Record<string, StepKind> = { F5: e.shiftKey ? "back" : "into", F6: "over", F7: "out", F8: "cont" };
        if (map[e.key]) {
          e.preventDefault();
          k.step(map[e.key]);
        } else if (e.key === "Escape") {
          e.preventDefault();
          k.stopDebug();
        }
        return;
      }
      if (e.key === "F8") {
        e.preventDefault();
        void k.run();
      } else if (e.key === "F10" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        void k.runTests();
      } else if (e.key === "F1" && !e.shiftKey) {
        // F1 outside the editor: the help tab with the shortcut list
        e.preventDefault();
        k.openHelp();
      } else if (e.key === "F1" && e.shiftKey) {
        e.preventDefault();
        void k.prettyPrint();
      } else if (e.key === "F2" && e.ctrlKey) {
        e.preventDefault();
        void k.checkCode();
      } else if (e.key === "F10" && e.ctrlKey) {
        e.preventDefault();
        void k.debug();
      } else if (e.key === "F3") {
        e.preventDefault();
        k.back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- render ----------
  const tableCount = Object.keys(saved.tables).length;
  const testCount = useMemo(() => {
    if (!tests) return null;
    if (tests.run.error) return { text: "!", bad: true };
    const bad = tests.run.results.filter((r) => r.status !== "pass").length;
    const pass = tests.run.results.length - bad;
    return tests.run.results.length ? { text: bad ? `${bad}✗` : `${pass}✓`, bad: !!bad } : null;
  }, [tests]);

  // coverage marks only while the code is the one that was tested (line numbers would shift)
  const covMap = useMemo(() => {
    if (!tests || !showCov || dbg || tests.run.error || testedCode.current !== code) return null;
    const m = new Map<number, boolean>();
    const hit = new Set(tests.run.coverage.covered);
    for (const l of tests.run.coverage.lines) if (l <= tests.lines) m.set(l, hit.has(l));
    return m.size ? m : null;
  }, [tests, showCov, dbg, code]);

  const shownOutput = dbg ? (dbgLast ? dbg.run.out : outputUpTo(dbg.run.out, dbgStep!.o)) : out?.output ?? "";
  const shownError = dbg ? (dbgLast ? dbg.run.err : null) : out?.error ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <label className={styles.program}>
          <span className="sr-only">Program</span>
          <select value={program} onChange={(e) => selectProgram(e.target.value)} disabled={busy}>
            {saved.code[ARTICLE] !== undefined && (
              <optgroup label="Dari artikel atau link">
                <option value={ARTICLE}>Kode dari artikel / link</option>
              </optgroup>
            )}
            <optgroup label="Contoh">
              {EXAMPLES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Latihan (cek otomatis)">
              {EXERCISES.map((x) => (
                <option key={x.id} value={`ex:${x.id}`}>
                  {saved.done[x.id] ? "✓ " : ""}
                  {x.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn2}
            onClick={() => void prettyPrint()}
            disabled={busy || !ready || !!dbg}
            title="Pretty Printer: rapikan indentasi dan huruf keyword (Shift+F1)"
          >
            <WandSparkles aria-hidden="true" /> Rapikan
          </button>
          <button
            type="button"
            className={styles.btn2}
            onClick={() => void checkCode()}
            disabled={busy || !ready}
            title="Cek kode: error, kode lambat, variabel tak terpakai, sintaks usang (Ctrl+F2)"
          >
            <ListChecks aria-hidden="true" /> Cek kode
          </button>
          <button
            type="button"
            className={styles.btn2}
            onClick={() => void debug()}
            disabled={busy || !ready}
            aria-pressed={!!dbg}
            title="Jalankan langkah demi langkah (Ctrl+F10). Klik nomor baris untuk breakpoint."
          >
            <Bug aria-hidden="true" /> Debug
          </button>
          <button
            type="button"
            className={styles.btn2}
            onClick={() => void runTests()}
            disabled={busy || !ready}
            title={exercise ? "Periksa jawaban dengan tes otomatis (Ctrl+Shift+F10)" : "Jalankan ABAP Unit (Ctrl+Shift+F10)"}
          >
            <FlaskConical aria-hidden="true" /> {exercise ? "Periksa" : "Tes"}
          </button>
          <button type="button" className={styles.btn2} onClick={() => void share()} disabled={!ready} title="Salin link berisi program ini (dan tabel yang diubah)">
            <Share2 aria-hidden="true" /> Bagikan
          </button>
          <button type="button" className={styles.run} onClick={() => void start()} disabled={busy || !ready} title="Jalankan program (F8)">
            <Play aria-hidden="true" /> Jalankan <span className={styles.kbd}>F8</span>
          </button>
        </div>
      </div>

      <div className={styles.work}>
        <section className={`${styles.pane} ${styles.left}`} aria-label="Kode">
          <div className={styles.tabs} role="tablist">
            <button type="button" role="tab" className={styles.tab} aria-selected={leftTab === "src"} onClick={() => setLeftTab("src")}>
              Program
            </button>
            <button
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={leftTab === "db"}
              onClick={() => {
                stopDebug(true);
                setLeftTab("db");
              }}
            >
              Tabel {tableCount > 0 && <span className={styles.count}>{tableCount}</span>}
            </button>
            <span className={styles.spacer} />
            <span className={styles.hint}>{dbg ? "Mode debug: kode tidak bisa diedit" : "Klik nomor baris untuk breakpoint"}</span>
          </div>
          {leftTab === "src" ? (
            <>
              {dbg && dbgStep && (
                <DebugBar
                  pos={dbg.pos}
                  total={dbg.run.trace.steps.length}
                  step={dbgStep}
                  atEnd={dbgLast}
                  onStep={step}
                  onSeek={(pos) => setDbg((d) => (d ? { ...d, pos } : d))}
                  onStop={() => stopDebug()}
                />
              )}
              <CodeEditor
                value={code}
                onChange={editCode}
                readOnly={!!dbg}
                curLine={dbgStep?.l ?? 0}
                errLine={dbg ? (dbgLast && dbg.run.err ? dbg.run.err.line : 0) : errLine}
                breakpoints={breakpoints}
                onToggleBreakpoint={toggleBreakpoint}
                jump={jump}
                complete={complete}
                onHelp={(src, l, c) => void showHelp(src, l, c)}
                coverage={covMap}
              />
            </>
          ) : (
            <TablesEditor tables={saved.tables} defaults={DEFAULT_TABLES} onChange={(tables) => update((s) => ({ ...s, tables }))} />
          )}
        </section>

        <section className={`${styles.pane} ${styles.right}`} aria-label="Hasil">
          <div className={styles.tabs} role="tablist">
            {screen && (
              <button type="button" role="tab" className={styles.tab} aria-selected={rightTab === "screen"} onClick={() => setRightTab("screen")}>
                Layar seleksi
              </button>
            )}
            <button type="button" role="tab" className={styles.tab} aria-selected={rightTab === "out"} onClick={() => setRightTab("out")}>
              Hasil
            </button>
            <button
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={rightTab === "vars"}
              disabled={!dbg}
              onClick={() => setRightTab("vars")}
            >
              Variabel
            </button>
            <button type="button" role="tab" className={styles.tab} aria-selected={rightTab === "tests"} onClick={() => setRightTab("tests")}>
              Tes {testCount && <span className={`${styles.count} ${testCount.bad ? styles.bad : styles.good}`}>{testCount.text}</span>}
            </button>
            <button type="button" role="tab" className={styles.tab} aria-selected={rightTab === "check"} onClick={() => setRightTab("check")}>
              Cek{" "}
              {findings && (
                <span className={`${styles.count} ${findings.some((f) => f.level !== "I") ? styles.bad : styles.good}`}>
                  {findings.filter((f) => f.level !== "I").length || "✓"}
                </span>
              )}
            </button>
            <button type="button" role="tab" className={styles.tab} aria-selected={rightTab === "sql"} onClick={() => setRightTab("sql")}>
              SQL{" "}
              {sql && sql.length > 0 && <span className={styles.count}>{sql.length}</span>}
            </button>
            <button type="button" role="tab" className={styles.tab} aria-selected={rightTab === "help"} onClick={() => setRightTab("help")}>
              Bantuan
            </button>
            <span className={styles.spacer} />
            <span className={styles.hint}>{when}</span>
          </div>
          <div className={styles.panel} role="tabpanel">
            {rightTab === "out" && (
              <>
                {shownError && <ErrorBox error={shownError} onShowLine={showLine} />}
                <OutputView
                  output={shownOutput}
                  onAlvEvent={dbg || busy ? undefined : (ev) => void run(ev)}
                  onLineSelect={dbg || busy ? undefined : selectLine}
                  onBack={dbg || busy ? undefined : listBack}
                />
                {!dbg && out && !out.error && !out.output.trim() && (
                  <p className={styles.empty}>
                    Program berjalan tanpa output. Tambahkan perintah <code>WRITE</code>.
                  </p>
                )}
                {!dbg && !out && (
                  <p className={styles.empty}>
                    Tekan <b>Jalankan</b> (F8) untuk menjalankan program. Output <code>WRITE</code> dan <code>cl_demo_output</code> muncul di sini.
                  </p>
                )}
              </>
            )}
            {rightTab === "vars" && dbg && dbgStep && (
              <VariablesView step={dbgStep} prev={dbg.pos > 0 ? dbg.run.trace.steps[dbg.pos - 1] : null} vals={dbg.run.trace.vals} />
            )}
            {rightTab === "help" && <HelpView help={help} />}
            {rightTab === "sql" && <SqlView sql={sql} onShowLine={showLine} />}
            {rightTab === "screen" && screen && (
              <ScreenView
                fields={screen.fields}
                blocks={screen.blocks}
                values={screenValues(screen.fields)}
                onChange={(v) => update((s) => ({ ...s, screens: { ...s.screens, [s.program]: v } }))}
                onRun={() => void run(undefined, screenValues(screen.fields))}
                onReset={() =>
                  update((s) => {
                    const next = { ...s.screens };
                    delete next[s.program];
                    return { ...s, screens: next };
                  })
                }
                disabled={busy || !ready}
              />
            )}
            {rightTab === "check" && <CheckView findings={findings} onShowLine={showLine} onRun={() => void checkCode()} />}
            {rightTab === "tests" && (
              <TestsView
                exercise={exercise}
                done={!!(exercise && saved.done[exercise.id])}
                outcome={tests}
                onCheck={() => void runTests()}
                onReset={resetExercise}
                onSolution={() => exercise && editCode(exercise.solution)}
                onShowLine={showLine}
                showCoverage={showCov}
                onToggleCoverage={setShowCov}
              />
            )}
          </div>
        </section>
      </div>

      <div className={`${styles.status} ${shownStatus.kind ? styles[`s-${shownStatus.kind}`] : ""}`} role="status" aria-live="polite">
        <span className={styles.statusDot} />
        <span className={styles.statusText}>{shownStatus.text}</span>
      </div>
      <p className={styles.legal}>
        Ditenagai LokalCraft, interpreter ABAP open-source yang berjalan sepenuhnya di browser. Tidak berafiliasi dengan SAP SE; SAP dan ABAP adalah merek dagang SAP SE.
      </p>
    </div>
  );
}

const LEVEL: Record<Finding["level"], { label: string; cls: string }> = {
  E: { label: "Error", cls: "error" },
  W: { label: "Peringatan", cls: "warn" },
  I: { label: "Saran", cls: "info2" },
};

function CheckView({ findings, onShowLine, onRun }: { findings: Finding[] | null; onShowLine: (l: number) => void; onRun: () => void }) {
  if (!findings) {
    return (
      <p className={styles.empty}>
        <b>Cek kode</b> (Ctrl+F2) mencari error sintaks, <code>SELECT</code> di dalam loop, <code>sy-subrc</code> yang tidak dicek, CATCH kosong,
        variabel yang tidak dipakai, dan sintaks usang.{" "}
        <button type="button" className={styles.btn2} onClick={onRun}>
          Cek sekarang
        </button>
      </p>
    );
  }
  if (!findings.length) {
    return (
      <div className={`${styles.box} ${styles.ok}`}>
        <div className={styles.boxMsg}>
          <b>Tidak ada masalah.</b> Kodenya bersih menurut cek LokalCraft.
        </div>
      </div>
    );
  }
  return (
    <div>
      {findings.map((f, i) => (
        <div key={i} className={styles.finding}>
          <span className={`${styles.pill} ${styles[LEVEL[f.level].cls]}`}>{LEVEL[f.level].label}</span>
          <div>
            <div className={styles.fmsg}>{f.msg}</div>
            {f.line > 0 && <div className={styles.fline}>baris {f.line}</div>}
          </div>
          {f.line > 0 ? (
            <button type="button" className={styles.btn2} onClick={() => onShowLine(f.line)}>
              Lihat baris
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}

const SHORTCUTS: [string, string][] = [
  ["F8", "Jalankan program"],
  ["Ctrl+Space", "Saran kode (autocomplete); ↑ ↓ pilih, Enter atau Tab pakai, Esc tutup"],
  ["F1", "Bantuan untuk keyword di posisi kursor"],
  ["Shift+F1", "Rapikan kode (Pretty Printer)"],
  ["Ctrl+F2", "Cek kode"],
  ["Ctrl+F10", "Debug; lalu F5 langkah, F6 lewati, F7 keluar, F8 lanjut, Shift+F5 mundur"],
  ["Ctrl+Shift+F10", "Jalankan ABAP Unit / periksa latihan"],
];

function HelpView({ help }: { help: HelpEntry | null }) {
  return (
    <div className={styles.help}>
      {help?.title ? (
        <>
          <h3>{help.title}</h3>
          <pre>{help.syntax}</pre>
          <p>{help.text}</p>
          {help.example && (
            <>
              <div className={styles.muted}>Contoh</div>
              <pre>{help.example}</pre>
            </>
          )}
        </>
      ) : (
        <p className={styles.empty}>
          {help?.word ? (
            <>
              Belum ada bantuan untuk <code>{help.word.toLowerCase()}</code>.{" "}
            </>
          ) : null}
          Taruh kursor di sebuah keyword (misalnya <code>LOOP</code> atau <code>SELECT</code>) lalu tekan <b>F1</b>.
        </p>
      )}
      <div className={styles.keys}>
        {SHORTCUTS.map(([k, d]) => (
          <div key={k} style={{ display: "contents" }}>
            <kbd>{k}</kbd>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
