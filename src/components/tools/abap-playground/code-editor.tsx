"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { highlightLine } from "./highlight";
import type { Completions, CompletionItem } from "./protocol";
import styles from "./playground.module.css";

export interface Jump {
  line: number;
  /** select the line's text (after "Lihat baris"); otherwise only scroll it into view */
  select: boolean;
  /** changes on every request so the same line can be jumped to twice */
  nonce: number;
}

/**
 * A textarea laid over a highlighted <pre>. Line numbers double as
 * breakpoint toggles.
 */
export function CodeEditor({
  value,
  onChange,
  readOnly,
  curLine,
  errLine,
  breakpoints,
  onToggleBreakpoint,
  jump,
  complete,
  onHelp,
  coverage,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  curLine: number;
  errLine: number;
  breakpoints: number[];
  onToggleBreakpoint: (line: number) => void;
  jump: Jump | null;
  /** code completion from the engine (lc_complete) */
  complete?: (code: string, line: number, col: number) => Promise<Completions | null>;
  /** F1 on a word */
  onHelp?: (code: string, line: number, col: number) => void;
  /** code coverage of the last test run: line -> reached */
  coverage?: Map<number, boolean> | null;
}) {
  const [ac, setAc] = useState<{ items: CompletionItem[]; sel: number; from: number; line: number; col: number; pos: CSSProperties } | null>(null);
  const acReq = useRef(0);
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acList = useRef<HTMLDivElement>(null);
  const charW = useRef(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => value.split("\n"), [value]);
  const highlighted = useMemo(() => lines.map(highlightLine), [lines]);
  const bp = useMemo(() => new Set(breakpoints), [breakpoints]);

  const sync = () => {
    const t = ta.current;
    if (!t) return;
    if (pre.current) {
      pre.current.scrollTop = t.scrollTop;
      pre.current.scrollLeft = t.scrollLeft;
    }
    if (gutter.current) gutter.current.scrollTop = t.scrollTop;
  };

  useEffect(sync, [value]);

  // Keep the current debugger line, or a requested line, in view.
  useEffect(() => {
    const t = ta.current;
    const target = jump?.line ?? curLine;
    if (!t || !target) return;
    const lh = parseFloat(getComputedStyle(t).lineHeight) || 21;
    const top = (target - 1) * lh;
    if (top < t.scrollTop + lh || top > t.scrollTop + t.clientHeight - 3 * lh) t.scrollTop = Math.max(0, top - t.clientHeight / 3);
    if (jump?.select) {
      let pos = 0;
      for (let k = 0; k < target - 1 && k < lines.length; k++) pos += lines[k].length + 1;
      t.focus();
      t.setSelectionRange(pos, pos + (lines[target - 1] ?? "").length);
    }
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump?.nonce, curLine]);

  function caret(t: HTMLTextAreaElement) {
    const before = t.value.slice(0, t.selectionStart);
    const line = before.split("\n").length - 1;
    const col = before.length - (before.lastIndexOf("\n") + 1);
    return { line, col };
  }

  function requestCompletion(force: boolean) {
    const t = ta.current;
    if (!t || !complete || readOnly) return;
    if (acTimer.current) clearTimeout(acTimer.current);
    const { line, col } = caret(t);
    const lineText = t.value.split("\n")[line] ?? "";
    const left = lineText.slice(0, col);
    // open on Ctrl+Space, after -> => - ~ or once a word has two letters
    const trigger = force || /(->|=>|[\w\]\)]-|~)$/.test(left) || /[A-Za-z_<][\w]+$/.test(left) || /CALL FUNCTION '\w*$/i.test(left);
    if (!trigger) {
      setAc(null);
      return;
    }
    const id = ++acReq.current;
    acTimer.current = setTimeout(async () => {
      const r = await complete(t.value, line, col);
      if (id !== acReq.current) return;
      if (!r || !r.items.length) {
        setAc(null);
        return;
      }
      setAc({ items: r.items, sel: 0, from: r.from, line, col, pos: acPosition(t, line, r.from) });
    }, force ? 0 : 120);
  }

  function accept(item: CompletionItem) {
    const t = ta.current;
    if (!t || !ac) return;
    const pos = t.selectionStart;
    const lineStart = t.value.lastIndexOf("\n", pos - 1) + 1;
    const indent = (t.value.slice(lineStart).match(/^[ \t]*/) ?? [""])[0];
    let text = item.i.replace(/\n/g, "\n" + indent);
    const mark = text.indexOf("$0");
    text = text.replace("$0", "");
    const start = lineStart + ac.from;
    t.setRangeText(text, start, pos, "end");
    if (mark >= 0) t.setSelectionRange(start + mark, start + mark);
    setAc(null);
    onChange(t.value);
    t.focus();
  }

  useEffect(() => {
    acList.current?.querySelector(`[data-i="${ac?.sel ?? 0}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ac?.sel]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "F1" && !e.shiftKey && onHelp) {
      e.preventDefault();
      const { line, col } = caret(e.currentTarget);
      onHelp(e.currentTarget.value, line, col);
      return;
    }
    if (readOnly) return;
    const t = e.currentTarget;
    if (ac) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = ac.items.length;
        setAc({ ...ac, sel: (ac.sel + (e.key === "ArrowDown" ? 1 : n - 1)) % n });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        accept(ac.items[ac.sel]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setAc(null);
        return;
      }
    }
    if (e.key === " " && e.ctrlKey) {
      e.preventDefault();
      requestCompletion(true);
      return;
    }
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      t.setRangeText("  ", t.selectionStart, t.selectionEnd, "end");
      onChange(t.value);
    } else if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      const s = t.selectionStart;
      const lineStart = t.value.lastIndexOf("\n", s - 1) + 1;
      const indent = (t.value.slice(lineStart, s).match(/^\s*/) ?? [""])[0];
      if (indent) {
        e.preventDefault();
        t.setRangeText("\n" + indent, s, t.selectionEnd, "end");
        onChange(t.value);
      }
    }
  }

  const lineClass = (n: number) => (n === curLine ? styles.curLine : n === errLine ? styles.badLine : "");
  const covClass = (n: number) => {
    const c = coverage?.get(n);
    return c === undefined ? "" : c ? styles.covHit : styles.covMiss;
  };
  /** buttons for touch screens, where Ctrl+Space and F1 do not exist */
  const keep = (e: { preventDefault: () => void }) => e.preventDefault();
  function helpAtCaret() {
    const t = ta.current;
    if (!t || !onHelp) return;
    const { line, col } = caret(t);
    onHelp(t.value, line, col);
  }

  /** where the completion list opens; measured when it opens (the list closes on scroll) */
  function acPosition(t: HTMLTextAreaElement, line: number, from: number): CSSProperties {
    const cs = getComputedStyle(t);
    const lh = parseFloat(cs.lineHeight) || 21;
    if (!charW.current) {
      const c = document.createElement("canvas").getContext("2d");
      if (c) {
        c.font = `${cs.fontSize} ${cs.fontFamily}`;
        charW.current = c.measureText("MMMMMMMMMM").width / 10;
      }
    }
    const lineTop = parseFloat(cs.paddingTop) + line * lh - t.scrollTop;
    const left = Math.max(4, Math.min(parseFloat(cs.paddingLeft) + from * (charW.current || 8) - t.scrollLeft, t.clientWidth - 260));
    // near the bottom of the editor the list opens above the line
    if (lineTop + lh + 170 > t.clientHeight && lineTop > 170) return { bottom: t.clientHeight - lineTop + 2, left };
    return { top: lineTop + lh + 2, left };
  }

  return (
    <div className={styles.editor}>
      <div ref={gutter} className={styles.gutter} aria-label="Nomor baris, klik untuk breakpoint">
        {lines.map((_, k) => (
          <div
            key={k}
            className={[bp.has(k + 1) ? styles.bp : "", lineClass(k + 1), covClass(k + 1)].join(" ").trim() || undefined}
            title={coverage?.has(k + 1) ? (coverage.get(k + 1) ? "Dijalankan oleh tes" : "Belum tersentuh tes") : undefined}
            onClick={() => onToggleBreakpoint(k + 1)}
          >
            {k + 1}
          </div>
        ))}
      </div>
      <div className={styles.code}>
        <pre ref={pre} aria-hidden="true">
          {highlighted.map((tokens, k) => (
            <span key={k} className={`${styles.ln} ${lineClass(k + 1)}`}>
              {tokens.length ? tokens.map((t, j) => (
                <span key={j} className={styles[t.kind]}>
                  {t.text}
                </span>
              )) : " "}
            </span>
          ))}
        </pre>
        <textarea
          ref={ta}
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            onChange(e.target.value);
            requestCompletion(false);
          }}
          onBlur={() => setTimeout(() => setAc(null), 150)}
          onClick={() => setAc(null)}
          onScroll={() => {
            sync();
            setAc(null);
          }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap="off"
          aria-label="Kode ABAP"
          aria-autocomplete="list"
          aria-expanded={!!ac}
        />
        {!readOnly && (complete || onHelp) && (
          <div className={styles.touchKeys}>
            {complete && (
              <button type="button" onMouseDown={keep} onClick={() => requestCompletion(true)} title="Saran kode (Ctrl+Space)">
                Saran
              </button>
            )}
            {onHelp && (
              <button type="button" onMouseDown={keep} onClick={helpAtCaret} title="Bantuan keyword (F1)">
                Bantuan
              </button>
            )}
          </div>
        )}
        {ac && (
          <div
            ref={acList}
            className={styles.ac}
            role="listbox"
            style={ac.pos}
          >
            {ac.items.map((it, i) => (
              <div
                key={`${it.k}-${it.l}-${i}`}
                data-i={i}
                role="option"
                aria-selected={i === ac.sel}
                className={`${styles.acItem} ${i === ac.sel ? styles.acSel : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  accept(it);
                }}
              >
                <span className={`${styles.acKind} ${styles[`k_${it.k}`] ?? ""}`}>{KIND_SHORT[it.k] ?? it.k[0]}</span>
                <span className={styles.acLabel}>{it.l}</span>
                {it.d && <span className={styles.acDetail}>{it.d}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const KIND_SHORT: Record<string, string> = {
  keyword: "K",
  snippet: "S",
  variable: "V",
  method: "M",
  attribute: "A",
  function: "F",
  class: "C",
  table: "T",
  type: "Ty",
  field: "f",
  constant: "c",
  operator: "*",
};
