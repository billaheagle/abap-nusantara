"use client";

import { useMemo, useState } from "react";
import { Panel, Segmented } from "./primitives";
import { COUNTRIES, CURRENCIES, LANGUAGES } from "@/lib/tools/sap-codes";

type Tab = "lang" | "country" | "currency";

export function SapCodesTool() {
  const [tab, setTab] = useState<Tab>("lang");
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const langs = useMemo(() => LANGUAGES.filter((l) => !needle || `${l.sap} ${l.iso2} ${l.name}`.toLowerCase().includes(needle)), [needle]);
  const countries = useMemo(() => COUNTRIES.filter((c) => !needle || `${c.iso2} ${c.iso3} ${c.num} ${c.name}`.toLowerCase().includes(needle)), [needle]);
  const currencies = useMemo(() => CURRENCIES.filter((c) => !needle || `${c.code} ${c.num} ${c.name}`.toLowerCase().includes(needle)), [needle]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "lang", label: "Languages" },
            { value: "country", label: "Countries" },
            { value: "currency", label: "Currencies" },
          ]}
        />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="tool-input max-w-xs" />
      </div>

      {tab === "lang" && (
        <Panel title="SAP language keys ↔ ISO 639-1">
          <Table
            head={["SAP key", "ISO", "Language"]}
            rows={langs.map((l) => [l.sap, l.iso2, l.name])}
          />
        </Panel>
      )}
      {tab === "country" && (
        <Panel title="ISO 3166 country codes">
          <Table head={["α-2", "α-3", "Numeric", "Country"]} rows={countries.map((c) => [c.iso2, c.iso3, c.num, c.name])} />
        </Panel>
      )}
      {tab === "currency" && (
        <Panel title="ISO 4217 currencies">
          <Table
            head={["Code", "Numeric", "Decimals", "Currency"]}
            rows={currencies.map((c) => [c.code, c.num, String(c.decimals), c.name])}
          />
          <p className="mt-3 text-xs text-foreground-muted">
            Currencies where <span className="font-medium text-foreground">decimals ≠ 2</span> need a matching entry in table <code className="tool-code">TCURX</code>, otherwise SAP stores and displays them with the wrong scale.
          </p>
        </Panel>
      )}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="admin-th text-left">
            {head.map((h) => <th key={h} className="px-3 py-1.5">{h}</th>)}
          </tr>
        </thead>
        <tbody className="font-mono text-[0.8125rem]">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-1.5 ${j === r.length - 1 ? "font-sans text-foreground-muted" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="px-3 py-8 text-center font-sans text-foreground-muted">No match.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
