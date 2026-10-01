"use client";

import { Fragment, useMemo, useState } from "react";
import { Panel } from "./primitives";
import { TYPE_MAP } from "@/lib/tools/abap-types";

export function AbapTypeMapper() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TYPE_MAP;
    return TYPE_MAP.filter((r) =>
      [r.abap, r.ddic, r.edmV2, r.edmV4, r.json, r.ts, r.notes].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [q]);

  return (
    <div className="space-y-5">
      <Panel>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter — e.g. 'decimal', 'DATS', 'Edm.Guid', 'currency'"
          className="tool-input"
        />
      </Panel>

      {/* Phones: one card per type instead of a six-column sideways-scrolling table */}
      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <div key={r.abap} className="tool-panel p-3">
            <p className="break-all font-mono text-[0.8125rem] font-semibold">{r.abap}</p>
            <dl className="mt-2 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
              {(
                [
                  ["DDIC", r.ddic],
                  ["Edm V2", r.edmV2],
                  ["Edm V4", r.edmV4],
                  ["JSON", r.json],
                  ["TS", r.ts],
                ] as const
              ).map(([label, value]) => (
                <Fragment key={label}>
                  <dt className="text-foreground-muted">{label}</dt>
                  <dd className="break-words font-mono text-[0.8125rem]">{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        ))}
        {rows.length === 0 && <p className="tool-panel px-3 py-8 text-center text-sm text-foreground-muted">No type matches “{q}”.</p>}
      </div>

      <div className="tool-panel hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="admin-th text-left">
              <th className="px-3 py-2">ABAP</th>
              <th className="px-3 py-2">DDIC</th>
              <th className="px-3 py-2">Edm V2</th>
              <th className="px-3 py-2">Edm V4</th>
              <th className="px-3 py-2">JSON</th>
              <th className="px-3 py-2">TS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.abap} className="border-t border-border align-top">
                <td className="px-3 py-2.5 font-mono text-[0.8125rem]">{r.abap}</td>
                <td className="px-3 py-2.5 font-mono text-[0.8125rem] text-foreground-muted">{r.ddic}</td>
                <td className="px-3 py-2.5 font-mono text-[0.8125rem]">{r.edmV2}</td>
                <td className="px-3 py-2.5 font-mono text-[0.8125rem]">{r.edmV4}</td>
                <td className="px-3 py-2.5 font-mono text-[0.8125rem]">{r.json}</td>
                <td className="px-3 py-2.5 font-mono text-[0.8125rem]">{r.ts}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-foreground-muted">No type matches “{q}”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <details key={r.abap} className="tool-panel px-4 py-2 text-sm">
            <summary className="cursor-pointer font-mono text-[0.8125rem]">{r.abap} <span className="text-foreground-muted">— notes</span></summary>
            <p className="mt-2 text-foreground-muted">{r.notes}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
