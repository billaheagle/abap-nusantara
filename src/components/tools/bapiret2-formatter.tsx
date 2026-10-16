"use client";

import { useMemo, useState } from "react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import { CodeOutput } from "./code-output";
import {
  buildMessageSnippets,
  parseBapiret2,
  SEVERITY_LABEL,
  sortBySeverity,
  type Severity,
} from "@/lib/tools/bapiret2";

const SAMPLE = `[
  { "TYPE": "E", "ID": "ZORDER", "NUMBER": "010", "MESSAGE": "Customer 4711 diblokir untuk order" },
  { "TYPE": "W", "ID": "ZORDER", "NUMBER": "021", "MESSAGE": "Tanggal yang diminta sudah lewat" },
  { "TYPE": "S", "ID": "ZORDER", "NUMBER": "000", "MESSAGE": "Order 4500001234 berhasil dibuat" }
]`;

const TONE: Record<string, string> = {
  E: "text-negative",
  A: "text-negative",
  W: "text-critical",
  I: "text-brand",
  S: "text-positive",
};

export function Bapiret2Formatter() {
  const [tab, setTab] = useState<"parse" | "build">("parse");
  return (
    <div className="space-y-5">
      <Segmented value={tab} onChange={setTab} options={[{ value: "parse", label: "Rapikan tabel return" }, { value: "build", label: "Susun message" }]} />
      {tab === "parse" ? <Parse /> : <Build />}
    </div>
  );
}

function Parse() {
  const [raw, setRaw] = useState(SAMPLE);
  const parsed = useMemo(() => parseBapiret2(raw), [raw]);
  const sorted = useMemo(() => sortBySeverity(parsed.messages), [parsed.messages]);

  return (
    <div className="space-y-4">
      <Panel title="BAPIRET2 mentah">
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={7} spellCheck={false} className="tool-input tool-mono resize-y" />
        <p className="mt-2 text-xs text-foreground-muted">
          Menerima array JSON berisi baris, atau baris biasa seperti <code className="tool-code">E ZORDER 010 Customer diblokir</code> atau <code className="tool-code">W: tanggal sudah lewat</code>.
        </p>
      </Panel>

      {parsed.error ? (
        <Panel><p className="text-sm text-negative">{parsed.error}</p></Panel>
      ) : (
        <Panel title={`${sorted.length} message`}>
          <ul className="space-y-2">
            {sorted.map((m, i) => (
              <li key={i} className="flex gap-3 rounded-md border border-border p-3 text-sm">
                <span className={`mt-0.5 shrink-0 font-semibold ${TONE[m.type] ?? "text-foreground-muted"}`}>
                  {m.type} · {SEVERITY_LABEL[m.type] ?? "Message"}
                </span>
                <span className="min-w-0">
                  <span>{m.message}</span>
                  {(m.id || m.number) && (
                    <span className="ml-2 font-mono text-xs text-foreground-muted">
                      {m.id}
                      {m.number ? `-${m.number}` : ""}
                    </span>
                  )}
                  {m.field && <span className="ml-2 font-mono text-xs text-foreground-muted">field: {m.field}</span>}
                </span>
              </li>
            ))}
          </ul>
          {sorted.length === 0 && <p className="text-sm text-foreground-muted">Tidak ada yang ditampilkan.</p>}
        </Panel>
      )}
    </div>
  );
}

function Build() {
  const [cls, setCls] = useState("ZORDER");
  const [num, setNum] = useState("010");
  const [type, setType] = useState<Severity>("E");
  const [textVal, setTextVal] = useState("Customer &1 diblokir untuk order");

  const snippets = useMemo(() => buildMessageSnippets(cls, num, type), [cls, num, type]);

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Field label="Message class"><input value={cls} onChange={(e) => setCls(e.target.value.toUpperCase())} className="tool-input tool-mono" /></Field>
          <Field label="Nomor"><input value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 3))} className="tool-input tool-mono" /></Field>
          <Field label="Tipe">
            <select value={type} onChange={(e) => setType(e.target.value as Severity)} className="tool-input">
              {(["E", "W", "I", "S", "A"] as Severity[]).map((t) => (
                <option key={t} value={t}>{t} — {SEVERITY_LABEL[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Teks (&1 &2 = placeholder)"><input value={textVal} onChange={(e) => setTextVal(e.target.value)} className="tool-input" /></Field>
        </div>
      </Panel>
      {snippets.map((s) => (
        <Panel key={s.label} title={s.label} action={<CopyButton value={s.code} />}>
          <CodeOutput code={s.code} lang="abap" />
        </Panel>
      ))}
    </div>
  );
}
