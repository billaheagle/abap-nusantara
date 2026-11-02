"use client";

import { useState, type FormEvent } from "react";
import type { ScreenField, ScreenValues, SqlStatement } from "./protocol";
import styles from "./playground.module.css";

const OPTIONS = ["", "EQ", "NE", "GT", "GE", "LT", "LE", "BT", "NB", "CP", "NP"];
const OPTION_LABEL: Record<string, string> = {
  "": "otomatis",
  EQ: "= sama dengan",
  NE: "≠ tidak sama",
  GT: "> lebih dari",
  GE: "≥ minimal",
  LT: "< kurang dari",
  LE: "≤ maksimal",
  BT: "antara",
  NB: "di luar",
  CP: "pola (*)",
  NP: "bukan pola",
};

/** Engine value (YYYYMMDD / HHMMSS) -> HTML input value and back. */
function toInput(ty: string, v: string) {
  if (ty === "d") return /^\d{8}$/.test(v) && v !== "00000000" ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}` : "";
  if (ty === "t") return /^\d{6}$/.test(v) ? `${v.slice(0, 2)}:${v.slice(2, 4)}:${v.slice(4)}` : "";
  return v;
}
function fromInput(ty: string, v: string) {
  if (ty === "d" || ty === "t") return v.replace(/[-:]/g, "");
  // 1.250.000,50 (Indonesian) or 1250000.50
  if (ty === "i" || ty === "p" || ty === "f") return v.includes(",") ? v.trim().replace(/\./g, "").replace(",", ".") : v.trim();
  return v;
}

function FieldInput({
  f,
  value,
  onChange,
  label,
}: {
  f: ScreenField;
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const common = { "aria-label": label, className: styles.scrInput };
  if (f.ty === "d") return <input type="date" {...common} value={toInput("d", value)} onChange={(e) => onChange(fromInput("d", e.target.value))} />;
  if (f.ty === "t")
    return <input type="time" step={1} {...common} value={toInput("t", value)} onChange={(e) => onChange(fromInput("t", e.target.value))} />;
  if (f.ty === "i" || f.ty === "p" || f.ty === "f")
    return (
      <input
        type="text"
        inputMode="decimal"
        {...common}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(fromInput(f.ty, e.target.value))}
      />
    );
  return (
    <input
      type="text"
      {...common}
      value={value}
      maxLength={f.ty === "c" || f.ty === "n" ? f.len : undefined}
      style={f.lower ? undefined : { textTransform: "uppercase" }}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** The selection screen of a program with PARAMETERS / SELECT-OPTIONS, shown before it runs. */
export function ScreenView({
  fields,
  blocks = [],
  values,
  onChange,
  onRun,
  onReset,
  disabled,
}: {
  fields: ScreenField[];
  blocks?: { name: string; title: string }[];
  values: ScreenValues;
  onChange: (v: ScreenValues) => void;
  onRun: () => void;
  onReset: () => void;
  disabled: boolean;
}) {
  const [missing, setMissing] = useState<string[]>([]);
  const shown = fields.filter((f) => !f.hidden);
  const get = (f: ScreenField) => values[f.name] ?? f.rows;
  const set = (name: string, rows: string[][]) => onChange({ ...values, [name]: rows });
  const labelOf = (f: ScreenField) => f.label || f.name;

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const empty = shown
      .filter((f) => f.obl)
      .filter((f) => {
        const r = get(f);
        return f.kind === "S" ? !r.some((x) => (x[2] ?? "") !== "" || (x[3] ?? "") !== "") : !(r[0]?.[0] ?? "").trim();
      })
      .map((f) => f.name);
    setMissing(empty);
    if (!empty.length) onRun();
  }

  return (
    <form className={styles.scr} onSubmit={submit}>
      <div className={styles.scrHead}>
        <b>Layar seleksi</b>
        <span className={styles.muted}>Isi lalu tekan Jalankan (F8). Field bertanda * wajib.</span>
      </div>
      {groups(shown).map((g, gi) =>
        g.block ? (
          <fieldset key={`b-${gi}`} className={styles.scrBlock}>
            {blocks.find((b) => b.name === g.block)?.title && <legend>{blocks.find((b) => b.name === g.block)!.title}</legend>}
            {g.fields.map(renderField)}
          </fieldset>
        ) : (
          g.fields.map(renderField)
        ),
      )}
      {missing.length > 0 && <p className={styles.scrMsg}>Isi semua field wajib: {missing.map((m) => m.toLowerCase()).join(", ")}</p>}
      <div className={styles.acts}>
        <button type="submit" className={styles.run} disabled={disabled}>
          Jalankan <span className={styles.kbd}>F8</span>
        </button>
        <button type="button" className={styles.btn2} onClick={onReset}>
          Nilai awal
        </button>
      </div>
    </form>
  );

  function renderField(f: ScreenField) {
    const label = labelOf(f);
    const req = f.obl ? <span className={styles.req}>*</span> : null;
    const bad = missing.includes(f.name);
    if (f.kind === "C") {
      const on = (get(f)[0]?.[0] ?? "") !== "";
      return (
        <label key={f.name} className={styles.scrCheck}>
          <input type="checkbox" checked={on} onChange={(e) => set(f.name, [[e.target.checked ? "X" : ""]])} />
          <span>{label}</span>
          <code>{f.name}</code>
        </label>
      );
    }
    if (f.kind === "R") {
      const on = (get(f)[0]?.[0] ?? "") !== "";
      return (
        <label key={f.name} className={styles.scrCheck}>
          <input
            type="radio"
            name={`grp-${f.group}`}
            checked={on}
            onChange={() => {
              const next = { ...values };
              for (const o of fields) if (o.kind === "R" && o.group === f.group) next[o.name] = [[o.name === f.name ? "X" : ""]];
              onChange(next);
            }}
          />
          <span>{label}</span>
          <code>{f.name}</code>
        </label>
      );
    }
    if (f.kind === "P") {
      return (
        <div key={f.name} className={`${styles.scrRow} ${bad ? styles.scrBad : ""}`}>
          <label className={styles.scrLabel}>
            {label}
            {req} <code>{f.name}</code>
          </label>
          <FieldInput f={f} label={label} value={get(f)[0]?.[0] ?? ""} onChange={(v) => set(f.name, [[v]])} />
        </div>
      );
    }
    // SELECT-OPTIONS: rows of sign, option, low, high
    const rows = get(f).length ? get(f) : [["I", "", "", ""]];
    const setRow = (i: number, k: number, v: string) => set(f.name, rows.map((r, j) => (j === i ? r.map((x, n) => (n === k ? v : x)) : r)));
    return (
      <div key={f.name} className={`${styles.scrRow} ${bad ? styles.scrBad : ""}`}>
        <label className={styles.scrLabel}>
          {label}
          {req} <code>{f.name}</code>
        </label>
        <div className={styles.scrRanges}>
          {rows.map((r, i) => (
            <div key={i} className={styles.scrRange}>
              <div className={styles.scrOps}>
                <select aria-label={`${label}: sertakan atau kecualikan`} value={r[0] || "I"} onChange={(e) => setRow(i, 0, e.target.value)}>
                  <option value="I">sertakan</option>
                  <option value="E">kecualikan</option>
                </select>
                <select aria-label={`${label}: operator`} value={r[1] ?? ""} onChange={(e) => setRow(i, 1, e.target.value)}>
                  {OPTIONS.filter((o) => !f.noint || (o !== "BT" && o !== "NB")).map((o) => (
                    <option key={o} value={o}>
                      {OPTION_LABEL[o]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.scrVals}>
                <FieldInput f={f} label={`${label} dari`} value={r[2] ?? ""} onChange={(v) => setRow(i, 2, v)} />
                {!f.noint && (
                  <>
                    <span className={styles.muted}>s/d</span>
                    <FieldInput f={f} label={`${label} sampai`} value={r[3] ?? ""} onChange={(v) => setRow(i, 3, v)} />
                  </>
                )}
                {rows.length > 1 && (
                  <button type="button" className={styles.scrX} aria-label="Hapus baris" onClick={() => set(f.name, rows.filter((_, j) => j !== i))}>
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          {!f.noext && (
            <button type="button" className={styles.scrAdd} onClick={() => set(f.name, [...rows, ["I", "", "", ""]])}>
              + baris
            </button>
          )}
        </div>
      </div>
    );
  }
}

/** consecutive fields of the same SELECTION-SCREEN block */
function groups(fields: ScreenField[]) {
  const out: { block: string; fields: ScreenField[] }[] = [];
  for (const f of fields) {
    const b = f.block ?? "";
    if (out.length && out[out.length - 1].block === b) out[out.length - 1].fields.push(f);
    else out.push({ block: b, fields: [f] });
  }
  return out;
}

/** SQL trace of the last run, like ST05: statements grouped by source line. */
export function SqlView({ sql, onShowLine }: { sql: SqlStatement[] | null; onShowLine: (l: number) => void }) {
  if (!sql) {
    return (
      <p className={styles.empty}>
        Jalankan program (F8): setiap <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>MODIFY</code> dan <code>DELETE</code> ke tabel
        database dicatat di sini, seperti ST05.
      </p>
    );
  }
  if (!sql.length) return <p className={styles.empty}>Program terakhir tidak mengakses database.</p>;
  const groups: { line: number; op: string; table: string; times: number; rows: number }[] = [];
  for (const s of sql) {
    const g = groups.find((x) => x.line === s.line && x.op === s.op && x.table === s.table);
    if (g) {
      g.times++;
      g.rows += s.rows;
    } else groups.push({ ...s, times: 1 });
  }
  const repeated = groups.filter((g) => g.times > 1 && g.op.startsWith("SELECT"));
  const total = sql.reduce((a, s) => a + s.rows, 0);
  return (
    <div>
      <div className={`${styles.box} ${repeated.length ? styles.warnBox : styles.info}`}>
        <div className={styles.boxMsg}>
          <b>
            {sql.length} perintah database, {total} baris
          </b>
          {repeated.length > 0 && (
            <>
              <br />
              {repeated.map((g) => `SELECT di baris ${g.line} dijalankan ${g.times} kali`).join("; ")}. Biasanya ini SELECT di dalam LOOP: baca semua data
              sekaligus sebelum loop (JOIN atau FOR ALL ENTRIES).
            </>
          )}
        </div>
      </div>
      <div className={styles.gridWrap}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th>Baris</th>
              <th>Perintah</th>
              <th>Tabel</th>
              <th className={styles.numCell}>Kali</th>
              <th className={styles.numCell}>Baris data</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={i} className={g.times > 1 && g.op.startsWith("SELECT") ? styles.hotRow : undefined}>
                <td>
                  <button type="button" className={styles.hotspot} onClick={() => onShowLine(g.line)}>
                    {g.line}
                  </button>
                </td>
                <td>{g.op}</td>
                <td>{g.table}</td>
                <td className={styles.numCell}>{g.times}</td>
                <td className={styles.numCell}>{g.rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
