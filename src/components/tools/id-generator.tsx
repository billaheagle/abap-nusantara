"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import { generateBatch, GUID_FLAVOURS, simulateNumberRange, type GuidFlavour } from "@/lib/tools/ids";

export function IdGenerator() {
  const [tab, setTab] = useState<"guid" | "range">("guid");
  return (
    <div className="space-y-5">
      <Segmented value={tab} onChange={setTab} options={[{ value: "guid", label: "GUIDs" }, { value: "range", label: "Number range" }]} />
      {tab === "guid" ? <Guids /> : <Range />}
    </div>
  );
}

function Guids() {
  const [flavour, setFlavour] = useState<GuidFlavour>("char32");
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>(() => generateBatch("char32", 5));

  const regen = () => setValues(generateBatch(flavour, count));
  const note = GUID_FLAVOURS.find((f) => f.value === flavour)?.note;

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Flavour">
            <select value={flavour} onChange={(e) => setFlavour(e.target.value as GuidFlavour)} className="tool-input w-auto">
              {GUID_FLAVOURS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Count">
            <input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="tool-input w-24" />
          </Field>
          <button type="button" onClick={regen} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <RefreshCw className="h-4 w-4" /> Generate
          </button>
        </div>
        {note && <p className="mt-2 text-xs text-foreground-muted">{note}</p>}
      </Panel>
      <Panel title={`${values.length} value${values.length === 1 ? "" : "s"}`} action={<CopyButton value={values.join("\n")} label="Copy all" />}>
        <div className="space-y-1">
          {values.map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5">
              <span className="font-mono text-[0.8125rem] break-all">{v}</span>
              <CopyButton value={v} label="" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Range() {
  const [prefix, setPrefix] = useState("INV-");
  const [from, setFrom] = useState(1);
  const [count, setCount] = useState(10);
  const [width, setWidth] = useState(8);
  const [step, setStep] = useState(1);

  const values = simulateNumberRange({ prefix, from, count, width, step });

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Prefix"><input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="tool-input tool-mono" /></Field>
          <Field label="From"><input type="number" value={from} onChange={(e) => setFrom(Number(e.target.value) || 0)} className="tool-input" /></Field>
          <Field label="Count"><input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="tool-input" /></Field>
          <Field label="Digits"><input type="number" min={1} max={30} value={width} onChange={(e) => setWidth(Math.max(1, Number(e.target.value) || 1))} className="tool-input" /></Field>
          <Field label="Step"><input type="number" min={1} value={step} onChange={(e) => setStep(Math.max(1, Number(e.target.value) || 1))} className="tool-input" /></Field>
        </div>
        <p className="mt-2 text-xs text-foreground-muted">Mimics a NUMC / NRIV number range: fixed prefix + zero-padded incrementing counter.</p>
      </Panel>
      <Panel title="Preview" action={<CopyButton value={values.join("\n")} label="Copy all" />}>
        <pre className="tool-output">{values.join("\n")}</pre>
      </Panel>
    </div>
  );
}
