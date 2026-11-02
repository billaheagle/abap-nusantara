"use client";

import { useMemo, useState } from "react";
import type { AlvData, AlvEvent } from "./protocol";
import styles from "./playground.module.css";

function decimals(s: string) {
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

function aggregate(kind: string, values: string[]) {
  const nums = values.map(Number).filter((n) => !Number.isNaN(n));
  const d = values.reduce((m, v) => Math.max(m, decimals(v)), 0);
  let v: number;
  switch (kind) {
    case "AVERAGE":
      v = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      return v.toFixed(Math.max(d, 2));
    case "MINIMUM":
      v = nums.length ? Math.min(...nums) : 0;
      break;
    case "MAXIMUM":
      v = nums.length ? Math.max(...nums) : 0;
      break;
    case "COUNT":
      return String(nums.length);
    default:
      v = nums.reduce((a, b) => a + b, 0);
  }
  return v.toFixed(d);
}

const KIND_LABEL: Record<string, string> = { TOTAL: "Σ", AVERAGE: "Ø", MINIMUM: "min", MAXIMUM: "maks", COUNT: "jumlah" };

/** cl_salv_table->display( ): sortable, filterable grid with totals. */
export function AlvGrid({ alv, onEvent }: { alv: AlvData; onEvent?: (e: AlvEvent) => void }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ col: number; desc: boolean } | null>(null);

  // positions in alv.rows, after filtering and sorting
  const order = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = alv.rows.map((_, i) => i);
    if (q) r = r.filter((i) => alv.rows[i].some((c) => c.toLowerCase().includes(q)));
    if (sort) {
      const num = alv.cols[sort.col].num;
      r = r.slice().sort((a, b) => {
        const x = alv.rows[a][sort.col];
        const y = alv.rows[b][sort.col];
        const o = num ? Number(x) - Number(y) : x.localeCompare(y, "id");
        return sort.desc ? -o : o;
      });
    }
    return r;
  }, [alv, query, sort]);
  const rows = order.map((i) => alv.rows[i]);
  const dbl = !!onEvent && alv.events?.includes("DOUBLE_CLICK");
  const link = !!onEvent && alv.events?.includes("LINK_CLICK");
  const fnOn = !!onEvent && alv.events?.includes("ADDED_FUNCTION");
  const buttons = alv.buttons ?? [];
  const fire = (kind: AlvEvent["kind"], pos: number, col: number) =>
    onEvent?.({ grid: alv.id, kind, row: alv.idx?.[pos] ?? pos + 1, column: alv.cols[col]?.name ?? "" });

  const totals = alv.totals.length
    ? alv.cols.map((c, i) => {
        const t = alv.totals.find(([n]) => n === c.name);
        return t ? { kind: t[1], value: aggregate(t[1], rows.map((r) => r[i])) } : null;
      })
    : null;

  function toggle(i: number) {
    setSort((s) => (s?.col !== i ? { col: i, desc: false } : s.desc ? null : { col: i, desc: true }));
  }

  const preset = (name: string) => alv.sort.find(([c]) => c === name);

  return (
    <div className={styles.alv}>
      {alv.title && <div className={styles.gridTitle}>{alv.title}</div>}
      {(dbl || link) && (
        <div className={styles.alvHint}>
          {dbl && "Klik dua kali sebuah baris"}
          {dbl && link && " atau "}
          {link && (dbl ? "klik tautan" : "Klik tautan")} untuk menjalankan handler event-nya.
        </div>
      )}
      {(alv.functions || buttons.length > 0) && (
        <div className={styles.alvBar}>
          {buttons.map(([name, text, tip]) => (
            <button
              key={name}
              type="button"
              className={styles.alvFn}
              disabled={!fnOn}
              title={fnOn ? tip || `ADDED_FUNCTION: ${name.toLowerCase()}` : "Belum ada handler: SET HANDLER ... FOR EVENT added_function"}
              onClick={() => onEvent?.({ grid: alv.id, kind: "ADDED_FUNCTION", row: 0, column: name })}
            >
              {text}
            </button>
          ))}
          {alv.functions && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Saring baris…"
              aria-label="Saring baris ALV"
            />
          )}
          {sort && (
            <button type="button" onClick={() => setSort(null)}>
              Urutan awal
            </button>
          )}
        </div>
      )}
      <div className={styles.gridWrap}>
        <table className={`${styles.grid} ${alv.striped ? styles.striped : ""}`}>
          <thead>
            <tr>
              {alv.cols.map((c, i) => {
                const mark = sort?.col === i ? (sort.desc ? " ▼" : " ▲") : !sort && preset(c.name) ? (preset(c.name)![1] ? " ▽" : " △") : "";
                return (
                  <th
                    key={c.name}
                    className={`${c.num ? styles.numCell : ""} ${styles.sortable}`}
                    onClick={() => toggle(i)}
                    aria-sort={sort?.col === i ? (sort.desc ? "descending" : "ascending") : "none"}
                    title={`Urutkan menurut ${c.text}`}
                  >
                    {c.text}
                    {mark}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, j) => (
              <tr
                key={order[j]}
                className={dbl ? styles.clickable : undefined}
                onDoubleClick={dbl ? (e) => fire("DOUBLE_CLICK", order[j], Number((e.target as HTMLElement).closest("td")?.dataset.c ?? 0)) : undefined}
                title={dbl ? "Klik dua kali: DOUBLE_CLICK" : undefined}
              >
                {r.map((cell, k) => (
                  <td key={k} data-c={k} className={alv.cols[k]?.num ? styles.numCell : undefined}>
                    {link && alv.cols[k]?.hot ? (
                      <button
                        type="button"
                        className={styles.hotspot}
                        onClick={(e) => {
                          e.stopPropagation();
                          fire("LINK_CLICK", order[j], k);
                        }}
                      >
                        {cell}
                      </button>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr className={styles.totalRow}>
                {totals.map((t, i) => (
                  <td key={i} className={alv.cols[i].num ? styles.numCell : undefined}>
                    {t ? (
                      <>
                        <span className={styles.aggKind}>{KIND_LABEL[t.kind] ?? t.kind}</span> {t.value}
                      </>
                    ) : i === 0 ? (
                      "Total"
                    ) : (
                      ""
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className={styles.gridFoot}>
        {rows.length === alv.rows.length ? `${rows.length} baris` : `${rows.length} dari ${alv.rows.length} baris`}
      </div>
    </div>
  );
}
