"use client";

import { useState } from "react";
import type { TestRun } from "./protocol";
import { ErrorBox, OutputView } from "./output-view";
import styles from "./playground.module.css";

export interface Exercise {
  id: string;
  title: string;
  level: string;
  /** trusted HTML from content/exercises.json */
  brief: string;
  starter: string;
  solution: string;
  tests: string;
  hint: string;
}

export interface TestOutcome {
  run: TestRun;
  /** lines of the user's code; results past it come from the hidden exercise tests */
  lines: number;
  exercise: string | null;
}

type Extra = "hint" | "reset" | "solution" | null;

function ExerciseCard({
  ex,
  done,
  onCheck,
  onReset,
  onSolution,
}: {
  ex: Exercise;
  done: boolean;
  onCheck: () => void;
  onReset: () => void;
  onSolution: () => void;
}) {
  const [extra, setExtra] = useState<Extra>(null);
  return (
    <div className={styles.task}>
      <span className={styles.lvl}>
        Latihan · {ex.level}
        {done ? " · selesai" : ""}
      </span>
      <h2>{ex.title}</h2>
      <p dangerouslySetInnerHTML={{ __html: ex.brief }} />
      <div className={styles.acts}>
        <button type="button" className={styles.btn2} onClick={onCheck}>
          Periksa jawaban
        </button>
        <button type="button" className={styles.btn2} onClick={() => setExtra("hint")}>
          Petunjuk
        </button>
        <button type="button" className={styles.btn2} onClick={() => setExtra("reset")}>
          Mulai ulang
        </button>
        <button type="button" className={styles.btn2} onClick={() => setExtra("solution")}>
          Lihat solusi
        </button>
      </div>
      {extra === "hint" && (
        <div className={`${styles.box} ${styles.info}`}>
          <div className={styles.boxMsg}>{ex.hint}</div>
        </div>
      )}
      {extra === "reset" && (
        <div className={`${styles.box} ${styles.info}`}>
          <div className={styles.boxMsg}>Kembalikan kode ke awal? Perubahanmu akan hilang.</div>
          <button
            type="button"
            onClick={() => {
              setExtra(null);
              onReset();
            }}
          >
            Ya, mulai ulang
          </button>
        </div>
      )}
      {extra === "solution" && (
        <div className={`${styles.box} ${styles.info}`}>
          <div className={styles.boxMsg}>Ganti kode di editor dengan solusi contoh?</div>
          <button
            type="button"
            onClick={() => {
              setExtra(null);
              onSolution();
            }}
          >
            Ya, tampilkan
          </button>
        </div>
      )}
    </div>
  );
}

export function TestsView({
  exercise,
  done,
  outcome,
  onCheck,
  onReset,
  onSolution,
  onShowLine,
  showCoverage,
  onToggleCoverage,
}: {
  exercise: Exercise | null;
  done: boolean;
  outcome: TestOutcome | null;
  onCheck: () => void;
  onReset: () => void;
  onSolution: () => void;
  onShowLine: (line: number) => void;
  showCoverage: boolean;
  onToggleCoverage: (on: boolean) => void;
}) {
  // coverage of the user's own code (exercise tests are appended after it)
  const cov = outcome && !outcome.run.error ? outcome.run.coverage : null;
  const own = cov ? cov.lines.filter((l) => l <= outcome!.lines) : [];
  const hit = cov ? cov.covered.filter((l) => l <= outcome!.lines) : [];
  const pct = own.length ? Math.round((hit.length * 100) / own.length) : 0;
  const ownLine = (l: number) => (outcome && l > 0 && l <= outcome.lines ? l : 0);
  const results = outcome?.run.results ?? [];
  const pass = results.filter((r) => r.status === "pass").length;
  const bad = results.length - pass;
  return (
    <>
      {exercise ? (
        <ExerciseCard key={exercise.id} ex={exercise} done={done} onCheck={onCheck} onReset={onReset} onSolution={onSolution} />
      ) : (
        !outcome && (
          <p className={styles.empty}>
            Tombol <b>Tes</b> menjalankan ABAP Unit: setiap kelas <code>FOR TESTING</code> beserta method <code>FOR TESTING</code>-nya, tanpa menjalankan{" "}
            <code>START-OF-SELECTION</code>. Coba contoh <b>Unit test (abapGit)</b>, atau pilih salah satu latihan.
          </p>
        )
      )}
      {outcome?.run.error && (
        <ErrorBox error={{ line: ownLine(outcome.run.error.line), msg: outcome.run.error.msg }} onShowLine={onShowLine} />
      )}
      {outcome && !outcome.run.error && !results.length && (
        <div className={`${styles.box} ${styles.info}`}>
          <div className={styles.boxMsg}>
            Tidak ada tes. Buat kelas <code>CLASS ltcl_... DEFINITION FOR TESTING</code> dengan method <code>FOR TESTING</code>.
          </div>
        </div>
      )}
      {outcome && results.length > 0 &&
        (outcome.exercise ? (
          bad ? (
            <div className={`${styles.box} ${styles.err}`}>
              <div className={styles.boxMsg}>
                <b>
                  {bad} dari {results.length} tes belum lulus.
                </b>{" "}
                Baca pesannya, perbaiki kodenya, lalu periksa lagi.
              </div>
            </div>
          ) : (
            <div className={`${styles.box} ${styles.ok}`}>
              <div className={styles.boxMsg}>
                <b>Semua {pass} tes lulus.</b> Latihan selesai, lanjut ke latihan berikutnya lewat menu Program.
              </div>
            </div>
          )
        ) : (
          <div className={styles.summary}>
            {results.length} tes · {pass} lulus · {bad} gagal
          </div>
        ))}
      {results.length > 0 && own.length > 0 && (
        <div className={styles.cov}>
          <span>
            Cakupan kode <b>{pct}%</b> ({hit.length} dari {own.length} pernyataan di method, FORM dan fungsi)
          </span>
          <span className={styles.covBar} aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
          <label className={styles.scrCheck}>
            <input type="checkbox" checked={showCoverage} onChange={(e) => onToggleCoverage(e.target.checked)} />
            tandai di editor
          </label>
        </div>
      )}
      {results.length > 0 && (
        <div>
          {results.map((r, i) => (
            <div key={i} className={styles.trow}>
              <span className={`${styles.pill} ${styles[r.status]}`}>{r.status === "pass" ? "Lulus" : r.status === "fail" ? "Gagal" : "Error"}</span>
              <div>
                <div className={styles.tname}>
                  {r.cls}-&gt;{r.method}
                </div>
                {r.msg && <div className={styles.tmsg}>{r.msg}</div>}
              </div>
              {r.status !== "pass" && ownLine(r.line) ? (
                <button type="button" onClick={() => onShowLine(r.line)}>
                  Lihat baris
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      )}
      {outcome && outcome.run.output.trim() && <OutputView output={outcome.run.output} />}
    </>
  );
}
