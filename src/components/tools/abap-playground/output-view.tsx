"use client";

import { listOf, splitOutput, type AlvEvent, type EngineError } from "./protocol";
import { AlvGrid } from "./alv-grid";
import styles from "./playground.module.css";

export function ErrorBox({ error, onShowLine }: { error: EngineError; onShowLine?: (line: number) => void }) {
  return (
    <div className={`${styles.box} ${styles.err}`}>
      <div className={styles.boxMsg}>
        <b>{error.line ? `Baris ${error.line}` : "Galat"}</b>
        <br />
        <span className={styles.mono}>{error.msg}</span>
      </div>
      {error.line > 0 && onShowLine && (
        <button type="button" onClick={() => onShowLine(error.line)}>
          Lihat baris
        </button>
      )}
    </div>
  );
}

/** WRITE list output, with cl_demo_output tables shown as grids. */
export function OutputView({
  output,
  onAlvEvent,
  onLineSelect,
  onBack,
}: {
  output: string;
  onAlvEvent?: (e: AlvEvent) => void;
  /** AT LINE-SELECTION: a line of the current list (1-based) was double-clicked */
  onLineSelect?: (line: number, level: number) => void;
  /** F3 / Kembali on a detail list */
  onBack?: () => void;
}) {
  const { level, body } = listOf(output);
  const interactive = level !== null;
  const blocks = splitOutput(body, interactive);
  if (!blocks.length && !interactive) return null;
  return (
    <>
      {interactive && (
        <div className={styles.listBar}>
          <span>
            {level ? `List detail ke-${level}` : "List"} · klik dua kali sebuah baris untuk <code>AT LINE-SELECTION</code>
          </span>
          {level! > 0 && onBack && (
            <button type="button" className={styles.btn2} onClick={onBack} title="Kembali ke list sebelumnya (F3)">
              ← Kembali <span className={styles.kbd}>F3</span>
            </button>
          )}
        </div>
      )}
      {blocks.map((b, i) =>
        b.kind === "alv" ? (
          <AlvGrid key={`${i}-${b.alv.id}`} alv={b.alv} onEvent={onAlvEvent} />
        ) : b.kind === "text" && interactive ? (
          <pre key={i} className={`${styles.list} ${styles.clickList}`}>
            {b.text.split("\n").map((ln, k, all) =>
              k === all.length - 1 && ln === "" ? null : (
                <span
                  key={k}
                  className={styles.listLine}
                  tabIndex={onLineSelect ? 0 : undefined}
                  onDoubleClick={() => onLineSelect?.((b.firstLine ?? 1) + k, level!)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onLineSelect?.((b.firstLine ?? 1) + k, level!);
                  }}
                >
                  {ln || " "}
                  {"\n"}
                </span>
              ),
            )}
          </pre>
        ) : b.kind === "text" ? (
          <pre key={i} className={styles.list}>
            {b.text}
          </pre>
        ) : (
          <div key={i}>
            {b.title && <div className={styles.gridTitle}>{b.title}</div>}
            <div className={styles.gridWrap}>
              <table className={styles.grid}>
                <thead>
                  <tr>
                    {b.headers.map((h, k) => (
                      <th key={k} className={b.numeric[k] ? styles.numCell : undefined}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>
                      {r.map((c, k) => (
                        <td key={k} className={b.numeric[k] ? styles.numCell : undefined}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.gridFoot}>{b.rows.length} baris</div>
          </div>
        ),
      )}
    </>
  );
}
