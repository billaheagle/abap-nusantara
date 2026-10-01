"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import {
  buildQuery,
  FILTER_OPS,
  type FilterRow,
  type ODataInput,
  type ODataVersion,
  type OrderRow,
} from "@/lib/tools/odata";

const initial: ODataInput = {
  baseUrl: "https://host/sap/opu/odata/sap/API_PRODUCT_SRV",
  entitySet: "A_Product",
  version: "v2",
  select: "Product, ProductType, ProductGroup",
  expand: "to_Description",
  filterRows: [{ field: "ProductType", op: "eq", value: "FERT", conn: "and" }],
  rawFilter: "",
  useRaw: false,
  orderRows: [{ field: "Product", dir: "asc" }],
  top: "50",
  skip: "",
  count: false,
  search: "",
  format: "json",
};

export function ODataQueryBuilder() {
  const [s, setS] = useState<ODataInput>(initial);
  const set = <K extends keyof ODataInput>(k: K, v: ODataInput[K]) => setS((prev) => ({ ...prev, [k]: v }));

  const built = useMemo(() => buildQuery(s), [s]);

  function updateFilter(i: number, patch: Partial<FilterRow>) {
    set("filterRows", s.filterRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateOrder(i: number, patch: Partial<OrderRow>) {
    set("orderRows", s.orderRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Service base URL"><input value={s.baseUrl} onChange={(e) => set("baseUrl", e.target.value)} className="tool-input tool-mono" /></Field>
          <Field label="Entity set"><input value={s.entitySet} onChange={(e) => set("entitySet", e.target.value)} className="tool-input tool-mono" /></Field>
        </div>
        <div className="mt-3">
          <span className="mb-1 block text-xs font-medium text-foreground-muted">OData version</span>
          <Segmented<ODataVersion> value={s.version} onChange={(v) => set("version", v)} options={[{ value: "v2", label: "V2 (SAP Gateway)" }, { value: "v4", label: "V4 (RAP / CAP)" }]} />
        </div>
      </Panel>

      <Panel title="$select / $expand">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="$select (comma-separated)"><input value={s.select} onChange={(e) => set("select", e.target.value)} className="tool-input tool-mono" /></Field>
          <Field label="$expand (comma-separated)"><input value={s.expand} onChange={(e) => set("expand", e.target.value)} className="tool-input tool-mono" /></Field>
        </div>
      </Panel>

      <Panel
        title="$filter"
        action={
          <Segmented value={s.useRaw ? "raw" : "builder"} onChange={(m) => set("useRaw", m === "raw")} options={[{ value: "builder", label: "Builder" }, { value: "raw", label: "Raw" }]} fill={false} />
        }
      >
        {s.useRaw ? (
          <textarea value={s.rawFilter} onChange={(e) => set("rawFilter", e.target.value)} rows={3} spellCheck={false} className="tool-input tool-mono resize-y" placeholder="Product eq 'X' and Price gt 100" />
        ) : (
          <div className="space-y-2">
            {s.filterRows.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                {i > 0 && (
                  <select value={r.conn} onChange={(e) => updateFilter(i, { conn: e.target.value as "and" | "or" })} className="tool-input w-20 shrink-0">
                    <option value="and">and</option>
                    <option value="or">or</option>
                  </select>
                )}
                <input value={r.field} onChange={(e) => updateFilter(i, { field: e.target.value })} placeholder="field" className="tool-input tool-mono min-w-0 flex-1 sm:flex-none sm:w-40" />
                <select value={r.op} onChange={(e) => updateFilter(i, { op: e.target.value })} className="tool-input w-auto shrink-0">
                  {FILTER_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input value={r.value} onChange={(e) => updateFilter(i, { value: e.target.value })} placeholder="value" className="tool-input tool-mono min-w-0 flex-1 sm:flex-none sm:w-40" />
                <button type="button" onClick={() => set("filterRows", s.filterRows.filter((_, idx) => idx !== i))} className="text-foreground-muted hover:text-negative">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("filterRows", [...s.filterRows, { field: "", op: "eq", value: "", conn: "and" }])}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add condition
            </button>
          </div>
        )}
      </Panel>

      <Panel title="$orderby / paging">
        <div className="space-y-2">
          {s.orderRows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input value={r.field} onChange={(e) => updateOrder(i, { field: e.target.value })} placeholder="field" className="tool-input tool-mono min-w-0 flex-1 sm:flex-none sm:w-48" />
              <select value={r.dir} onChange={(e) => updateOrder(i, { dir: e.target.value as "asc" | "desc" })} className="tool-input w-28 shrink-0">
                <option value="asc">asc</option>
                <option value="desc">desc</option>
              </select>
              <button type="button" onClick={() => set("orderRows", s.orderRows.filter((_, idx) => idx !== i))} className="text-foreground-muted hover:text-negative">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set("orderRows", [...s.orderRows, { field: "", dir: "asc" }])} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add sort field
          </button>
        </div>
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Field label="$top"><input value={s.top} onChange={(e) => set("top", e.target.value)} className="tool-input" /></Field>
          <Field label="$skip"><input value={s.skip} onChange={(e) => set("skip", e.target.value)} className="tool-input" /></Field>
          <Field label="$search"><input value={s.search} onChange={(e) => set("search", e.target.value)} className="tool-input" /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={s.count} onChange={(e) => set("count", e.target.checked)} /> include count
          </label>
        </div>
      </Panel>

      {built.warnings.length > 0 && (
        <Panel title="Checks">
          <ul className="space-y-1 text-sm text-critical">
            {built.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </Panel>
      )}

      <Panel title="Query string" action={<CopyButton value={built.query} />}>
        <pre className="tool-output">{built.query}</pre>
      </Panel>
      <Panel title="Full URL" action={<CopyButton value={built.url} />}>
        <pre className="tool-output">{built.url}</pre>
      </Panel>
    </div>
  );
}
