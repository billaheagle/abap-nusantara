"use client";

import { useState } from "react";
import type { Tables } from "./protocol";
import styles from "./playground.module.css";

/** The playground's "database": one CSV text per table. */
export function TablesEditor({ tables, defaults, onChange }: { tables: Tables; defaults: Tables; onChange: (t: Tables) => void }) {
  const names = Object.keys(tables).sort();
  const [selected, setSelected] = useState(names[0] ?? "");
  const [creating, setCreating] = useState<"" | "table" | "view">("");
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const current = names.includes(selected) ? selected : names[0] ?? "";
  const text = current ? tables[current] : "";
  const lines = text.split("\n").filter((l) => l.trim());
  const plain = text.replace(/^\s*\/\/.*$/gm, "");
  const isBdef = /^\s*(managed|unmanaged|strict)\b/i.test(plain) && /define\s+behavior\s+for/i.test(plain);
  const isView = !isBdef && /^\s*(@|define\b)/i.test(plain);
  const isAbstract = isView && /define\s+abstract\s+entity/i.test(plain);
  const isProgram = !isBdef && !isView && /^\s*(\*[^\n]*\n\s*)*(report|program)\b/i.test(text);
  const isAbap = !isBdef && !isView && !isProgram && /^\s*(\*|"|class\b)/i.test(text);

  function create() {
    const name = newName.trim().toLowerCase();
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) return setNameError("Gunakan huruf, angka dan _ saja, misalnya zpenjualan");
    if (tables[name]) return setNameError("Tabel dengan nama itu sudah ada");
    const body =
      creating === "view"
        ? `define view entity ${name.toUpperCase()}\n  as select from zflight\n{\n  key carrid,\n  key connid,\n      price\n}\n`
        : "id:n4:key,nama:c30,jumlah:p2\n0001,Contoh baris,100.00\n";
    onChange({ ...tables, [name]: body });
    setSelected(name);
    setNewName("");
    setNameError("");
    setCreating("");
  }

  return (
    <div className={styles.tables}>
      <div className={styles.row}>
        <select value={current} onChange={(e) => setSelected(e.target.value)} aria-label="Tabel">
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="button" className={styles.btn} onClick={() => setCreating("table")}>
          Tabel baru
        </button>
        <button type="button" className={styles.btn} onClick={() => setCreating("view")}>
          View CDS baru
        </button>
        <button type="button" className={styles.btn} onClick={() => onChange({ ...tables, ...defaults })}>
          Kembalikan contoh
        </button>
        {current && !confirmDelete && (
          <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => setConfirmDelete(true)}>
            Hapus
          </button>
        )}
        {confirmDelete && (
          <span className={styles.row}>
            <span className={styles.note}>Hapus {current}?</span>
            <button
              type="button"
              className={`${styles.btn} ${styles.danger}`}
              onClick={() => {
                const next = { ...tables };
                delete next[current];
                onChange(next);
                setConfirmDelete(false);
              }}
            >
              Ya, hapus
            </button>
            <button type="button" className={styles.btn} onClick={() => setConfirmDelete(false)}>
              Batal
            </button>
          </span>
        )}
      </div>
      {creating && (
        <div className={styles.row}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder={creating === "view" ? "zi_penjualan" : "zpenjualan"}
            aria-label={creating === "view" ? "Nama view CDS baru" : "Nama tabel baru"}
            autoFocus
          />
          <button type="button" className={styles.btn} onClick={create}>
            Buat
          </button>
          {nameError && <span className={styles.note}>{nameError}</span>}
        </div>
      )}
      <textarea
        className={styles.csv}
        value={text}
        disabled={!current}
        spellCheck={false}
        wrap="off"
        aria-label="Isi tabel dalam format CSV"
        onChange={(e) => onChange({ ...tables, [current]: e.target.value })}
      />
      <p className={styles.note}>
        {!current
          ? "Belum ada tabel. Buat satu untuk dipakai SELECT."
          : isBdef
            ? `${current}: behavior definition RAP, berlaku untuk READ / MODIFY ENTITIES`
            : isProgram
              ? `${current}: program ABAP, dijalankan dari program lain dengan SUBMIT ${current} [WITH ...] [AND RETURN]`
              : isAbap
              ? `${current}: behavior pool (kelas handler RAP), dipakai otomatis oleh behavior definition-nya`
              : isAbstract
                ? `${current}: abstract entity CDS, tipe parameter action RAP (%param)`
              : isView
                ? `${current}: view CDS, dibaca dengan SELECT ... FROM ${current}`
                : `${current}: ${Math.max(0, lines.length - 1)} baris, ${lines[0] ? lines[0].split(/[,;]/).length : 0} kolom`}
      </p>
      <p className={styles.note}>
        Setiap tabel berformat CSV. Baris pertama berisi nama kolom, boleh diberi tipe dan penanda kunci setelah titik dua, misalnya{" "}
        <code>carrid:c3:key,price:p2,seats:i,fldate:d</code>. Pakai di kode dengan <code>SELECT ... FROM zflight</code>; <code>INSERT</code>,{" "}
        <code>UPDATE</code>, <code>MODIFY</code> dan <code>DELETE</code> disimpan ke sini saat program selesai atau <code>COMMIT WORK</code>.
      </p>
      <p className={styles.note}>
        View CDS ditulis dengan DDL (<code>define view entity ... as select from ... {"{ ... }"}</code>) dan dibaca seperti tabel. Tabel{" "}
        <code>t100</code> berisi teks message class untuk <code>MESSAGE e001(znusa)</code>. Behavior definition RAP (<code>managed ... define behavior for</code>)
        dan behavior pool-nya (kelas <code>lhc_...</code>), composition antar view (<code>composition [0..*] of</code>) dan abstract entity untuk parameter action juga disimpan di sini, begitu juga program lain (<code>REPORT ...</code>) yang dipanggil dengan{" "}
        <code>SUBMIT</code>.
      </p>
    </div>
  );
}
