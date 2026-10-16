"use client";

import { useMemo, useState } from "react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import { CodeOutput } from "./code-output";
import {
  abapSnippet,
  epochMillis,
  epochSeconds,
  parseSapInput,
  relativeTime,
  viewIn,
  type Interpret,
  type Zone,
} from "@/lib/tools/sap-dates";

const EXAMPLES = ["20260903", "20260903143000", "20260903143000.5000000", "1788445800", "2026-09-03T14:30:00Z"];

export function SapDateConverter() {
  const [raw, setRaw] = useState("20260903143000");
  const [interpret, setInterpret] = useState<Interpret>("utc");

  const parsed = useMemo(() => parseSapInput(raw, interpret), [raw, interpret]);
  const nowBtn = () => setRaw(String(Math.floor(Date.now() / 1000)));

  return (
    <div className="space-y-5">
      <Panel>
        <Field label="Input" hint="Tanggal, jam, atau timestamp SAP, string ISO 8601, atau Unix epoch (detik atau milidetik). Formatnya dikenali otomatis.">
          <input value={raw} onChange={(e) => setRaw(e.target.value)} className="tool-input tool-mono" spellCheck={false} />
        </Field>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Segmented<Interpret>
            value={interpret}
            onChange={setInterpret}
            options={[
              { value: "utc", label: "Input dalam UTC" },
              { value: "local", label: "Input dalam waktu lokal" },
            ]}
          />
          <button type="button" onClick={nowBtn} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">
            Sekarang
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setRaw(ex)}
              className="rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-foreground-muted hover:bg-brand-tint hover:text-brand"
            >
              {ex.length > 22 ? `${ex.slice(0, 22)}…` : ex}
            </button>
          ))}
        </div>
      </Panel>

      {"error" in parsed ? (
        <Panel>
          <p className="text-sm text-negative">{parsed.error}</p>
        </Panel>
      ) : (
        <>
          <p className="text-xs text-foreground-muted">
            Terdeteksi: <span className="font-medium text-foreground">{parsed.detected}</span> · {relativeTime(parsed.instant)}
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(["UTC", "Local"] as Zone[]).map((zone) => {
              const v = viewIn(parsed.instant, zone);
              const rows: [string, string][] = [
                ["SAP date", v.sapDate],
                ["SAP time", v.sapTime],
                ["SAP timestamp", v.sapTimestamp],
                ["SAP timestampL", v.sapTimestampL],
                ["ISO 8601", v.iso],
                ["Hari", `${v.weekday}, minggu ISO ${v.isoWeek}, hari ke-${v.dayOfYear}`],
              ];
              return (
                <Panel key={zone} title={zone === "Local" ? `Lokal (${v.offset})` : "UTC"}>
                  <table className="w-full text-sm">
                    <tbody>
                      {rows.map(([k, val]) => (
                        <tr key={k} className="border-b border-border last:border-0">
                          <td className="py-1.5 pr-3 align-top text-foreground-muted">{k}</td>
                          <td className="py-1.5 font-mono text-[0.8125rem] break-all">{val}</td>
                          <td className="py-1.5 pl-2 text-right">
                            <CopyButton value={val} label="" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              );
            })}
          </div>

          <Panel title="Unix epoch">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["Detik", String(epochSeconds(parsed.instant))],
                  ["Milidetik", String(epochMillis(parsed.instant))],
                ] as [string, string][]
              ).map(([k, val]) => (
                <div key={k} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <span className="text-xs text-foreground-muted">{k}</span>
                  <span className="font-mono text-sm">{val}</span>
                  <CopyButton value={val} label="" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="ABAP" action={<CopyButton value={abapSnippet(viewIn(parsed.instant, "UTC"), parsed.hasDate, parsed.hasTime)} />}>
            <CodeOutput code={abapSnippet(viewIn(parsed.instant, "UTC"), parsed.hasDate, parsed.hasTime)} lang="abap" />
          </Panel>
        </>
      )}
    </div>
  );
}
