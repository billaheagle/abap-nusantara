"use client";

import type { DebugStep, DebugValue } from "./protocol";
import styles from "./playground.module.css";

export type StepKind = "first" | "back" | "into" | "over" | "out" | "cont";

export function DebugBar({
  pos,
  total,
  step,
  atEnd,
  onStep,
  onSeek,
  onStop,
}: {
  pos: number;
  total: number;
  step: DebugStep;
  atEnd: boolean;
  onStep: (k: StepKind) => void;
  onSeek: (pos: number) => void;
  onStop: () => void;
}) {
  return (
    <div className={styles.dbg}>
      <button type="button" disabled={pos === 0} onClick={() => onStep("first")} title="Ke awal">
        ⏮<span className={styles.lbl}> Awal</span>
      </button>
      <button type="button" disabled={pos === 0} onClick={() => onStep("back")} title="Mundur satu langkah (Shift+F5)">
        ◀<span className={styles.lbl}> Mundur</span> <kbd>⇧F5</kbd>
      </button>
      <button type="button" disabled={atEnd} onClick={() => onStep("into")} title="Satu langkah, masuk ke method (F5)">
        Langkah <kbd>F5</kbd>
      </button>
      <button type="button" disabled={atEnd} onClick={() => onStep("over")} title="Langkah tanpa masuk ke method (F6)">
        Lewati <kbd>F6</kbd>
      </button>
      <button type="button" disabled={atEnd} onClick={() => onStep("out")} title="Selesaikan method ini (F7)">
        Keluar <kbd>F7</kbd>
      </button>
      <button type="button" disabled={atEnd} onClick={() => onStep("cont")} title="Lanjut ke breakpoint berikutnya (F8)">
        Lanjut <kbd>F8</kbd>
      </button>
      <button type="button" className={styles.stop} onClick={onStop} title="Selesai debug (Esc)">
        Selesai
      </button>
      <div className={styles.where}>
        <span>
          Langkah <b>{pos + 1}</b>/{total} · baris <b>{step.l}</b> · {step.f}
        </span>
        <input type="range" min={0} max={total - 1} value={pos} onChange={(e) => onSeek(Number(e.target.value))} aria-label="Posisi langkah" />
      </div>
    </div>
  );
}

function Value({ v }: { v: DebugValue | undefined }) {
  if (!v) return null;
  switch (v.k) {
    case "v":
      return v.v ? <>{v.v}</> : <span className={styles.muted}>(kosong)</span>;
    case "s":
      return (
        <details>
          <summary>struktur · {v.f.length} komponen</summary>
          <div className={styles.sub}>
            {v.f.map(([n, x]) => (
              <div key={n}>
                <span className={styles.k}>{n}</span> = <Value v={x} />
              </div>
            ))}
          </div>
        </details>
      );
    case "r":
      return v.f.length ? (
        <details>
          <summary>{v.v}</summary>
          <div className={styles.sub}>
            {v.f.map(([n, x]) => (
              <div key={n}>
                <span className={styles.k}>{n}</span> = <Value v={x} />
              </div>
            ))}
          </div>
        </details>
      ) : (
        <>{v.v}</>
      );
    case "t":
      if (!v.n) return <span className={styles.muted}>tabel kosong</span>;
      return (
        <details>
          <summary>tabel · {v.n} baris</summary>
          <div className={styles.gridWrap}>
            <table className={styles.grid}>
              <thead>
                <tr>
                  {v.c.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {v.r.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {v.n > v.r.length && <div className={styles.gridFoot}>dan {v.n - v.r.length} baris lainnya</div>}
        </details>
      );
  }
}

const GROUPS: [string, string][] = [
  ["fs", "Field-symbol"],
  ["local", "Variabel lokal"],
  ["me", "Atribut objek (me)"],
  ["global", "Data global"],
  ["sy", "Field sistem"],
];

export function VariablesView({ step, prev, vals }: { step: DebugStep; prev: DebugStep | null; vals: DebugValue[] }) {
  const before = new Map<string, number>();
  if (prev) for (const [sc, n, , id] of prev.v) before.set(`${sc}/${n}`, id);
  return (
    <>
      <div className={styles.callstack}>
        {step.f} · kedalaman {step.d}
      </div>
      {GROUPS.map(([key, title]) => {
        const rows = step.v.filter((x) => x[0] === key);
        if (!rows.length) return null;
        return (
          <div key={key} className={styles.vgroup}>
            <h3>{title}</h3>
            <table className={styles.vtable}>
              <tbody>
                {rows.map(([sc, n, ty, id]) => {
                  const k = `${sc}/${n}`;
                  const changed = prev !== null && before.has(k) && before.get(k) !== id;
                  return (
                    <tr key={k} className={changed ? styles.changed : undefined}>
                      <td className={styles.vname}>{n}</td>
                      <td className={styles.vtype}>{ty}</td>
                      <td className={styles.vval}>
                        <Value v={vals[id]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
