"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import { ANNOTATIONS, ANNOTATION_GROUPS, generateUiAnnotations, type UiField } from "@/lib/tools/cds-annotations";

export function CdsAnnotationsTool() {
  const [tab, setTab] = useState<"reference" | "generator">("reference");
  return (
    <div className="space-y-5">
      <Segmented value={tab} onChange={setTab} options={[{ value: "reference", label: "Annotation reference" }, { value: "generator", label: "List Report generator" }]} />
      {tab === "reference" ? <Reference /> : <Generator />}
    </div>
  );
}

function Reference() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ANNOTATION_GROUPS.map((g) => ({
      group: g,
      items: ANNOTATIONS.filter((a) => a.group === g && (!needle || [a.name, a.purpose, a.example].some((v) => v.toLowerCase().includes(needle)))),
    })).filter((g) => g.items.length);
  }, [q]);

  return (
    <div className="space-y-4">
      <Panel>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — 'lineItem', 'currency', 'search', 'value help'…" className="tool-input" />
      </Panel>
      {groups.map(({ group, items }) => (
        <Panel key={group} title={group}>
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.name} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <code className="tool-mono text-[0.8125rem] font-semibold">{a.name}</code>
                  <CopyButton value={a.example} label="" />
                </div>
                <p className="mt-1 text-sm text-foreground-muted">{a.purpose}</p>
                <pre className="tool-output mt-2">{a.example}</pre>
              </div>
            ))}
          </div>
        </Panel>
      ))}
      {groups.length === 0 && <p className="text-sm text-foreground-muted">No annotation matches “{q}”.</p>}
    </div>
  );
}

function Generator() {
  const [entity, setEntity] = useState("Product");
  const [fields, setFields] = useState<UiField[]>([
    { name: "Product", label: "Product", lineItem: true, selectionField: true, identification: true },
    { name: "ProductType", label: "Type", lineItem: true, selectionField: true, identification: false },
    { name: "Price", label: "Price", lineItem: true, selectionField: false, identification: true },
    { name: "Description", label: "Description", lineItem: false, selectionField: false, identification: true },
  ]);

  const output = useMemo(() => generateUiAnnotations(entity, fields), [entity, fields]);
  const patch = (i: number, p: Partial<UiField>) => setFields(fields.map((f, idx) => (idx === i ? { ...f, ...p } : f)));

  return (
    <div className="space-y-4">
      <Panel>
        <Field label="Source entity / view"><input value={entity} onChange={(e) => setEntity(e.target.value)} className="tool-input tool-mono" /></Field>
      </Panel>
      <Panel title="Fields">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-th text-left">
                <th className="px-2 py-1.5">Field</th>
                <th className="px-2 py-1.5">Label</th>
                <th className="px-2 py-1.5 text-center">Column</th>
                <th className="px-2 py-1.5 text-center">Filter</th>
                <th className="px-2 py-1.5 text-center">Object Page</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-2 py-1.5"><input value={f.name} onChange={(e) => patch(i, { name: e.target.value })} className="tool-input tool-mono py-1" /></td>
                  <td className="px-2 py-1.5"><input value={f.label} onChange={(e) => patch(i, { label: e.target.value })} className="tool-input py-1" /></td>
                  <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={f.lineItem} onChange={(e) => patch(i, { lineItem: e.target.checked })} /></td>
                  <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={f.selectionField} onChange={(e) => patch(i, { selectionField: e.target.checked })} /></td>
                  <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={f.identification} onChange={(e) => patch(i, { identification: e.target.checked })} /></td>
                  <td className="px-2 py-1.5"><button type="button" onClick={() => setFields(fields.filter((_, idx) => idx !== i))} className="text-foreground-muted hover:text-negative"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setFields([...fields, { name: "Field", label: "", lineItem: true, selectionField: false, identification: false }])}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add field
        </button>
      </Panel>
      <Panel title="Generated CDS" action={<CopyButton value={output} />}>
        <pre className="tool-output">{output}</pre>
      </Panel>
    </div>
  );
}
