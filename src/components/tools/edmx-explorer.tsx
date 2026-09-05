"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Panel } from "./primitives";
import { parseEdmx, type EdmModel, type EdmStructured } from "@/lib/tools/edmx";

const SAMPLE = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">
  <edmx:DataServices xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
    <Schema Namespace="API_PRODUCT_SRV" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">
      <EntityType Name="A_ProductType">
        <Key><PropertyRef Name="Product"/></Key>
        <Property Name="Product" Type="Edm.String" Nullable="false" MaxLength="40"/>
        <Property Name="ProductType" Type="Edm.String" MaxLength="4"/>
        <Property Name="CreationDate" Type="Edm.DateTime"/>
        <Property Name="NetWeight" Type="Edm.Decimal" Precision="13" Scale="3"/>
        <NavigationProperty Name="to_Description" Relationship="API_PRODUCT_SRV.assoc_Desc"/>
      </EntityType>
      <EntitySet Name="A_Product" EntityType="API_PRODUCT_SRV.A_ProductType"/>
      <FunctionImport Name="ActivateProduct" ReturnType="API_PRODUCT_SRV.A_ProductType" m:HttpMethod="POST">
        <Parameter Name="Product" Type="Edm.String"/>
      </FunctionImport>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

function StructuredCard({ item }: { item: EdmStructured }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-surface">
        <ChevronRight className={`h-4 w-4 shrink-0 text-foreground-muted transition ${open ? "rotate-90" : ""}`} />
        {item.name}
        <span className="ml-auto text-xs font-normal text-foreground-muted">
          {item.properties.length} props{item.navigations.length ? ` · ${item.navigations.length} nav` : ""}
        </span>
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-th text-left">
                <th className="px-3 py-1.5">Property</th>
                <th className="px-3 py-1.5">Type</th>
                <th className="px-3 py-1.5">Facets</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[0.8125rem]">
              {item.properties.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-0">
                  <td className="px-3 py-1.5">
                    {p.isKey && <span className="mr-1 text-gold-strong" title="key">🔑</span>}
                    {p.name}
                  </td>
                  <td className="px-3 py-1.5 text-foreground-muted">{p.type}</td>
                  <td className="px-3 py-1.5 font-sans text-xs text-foreground-muted">
                    {[
                      !p.nullable && "not null",
                      p.maxLength && `maxLength ${p.maxLength}`,
                      p.precision && `precision ${p.precision}`,
                      p.scale && `scale ${p.scale}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                </tr>
              ))}
              {item.navigations.map((n) => (
                <tr key={n.name} className="border-b border-border last:border-0">
                  <td className="px-3 py-1.5 text-brand">→ {n.name}</td>
                  <td className="px-3 py-1.5 text-foreground-muted" colSpan={2}>{n.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function EdmxExplorer() {
  const [xml, setXml] = useState(SAMPLE);

  const model = useMemo<EdmModel | { error: string }>(() => {
    if (!xml.trim()) return { error: "Paste a $metadata document above." };
    try {
      return parseEdmx(xml);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not parse EDMX" };
    }
  }, [xml]);

  return (
    <div className="space-y-5">
      <Panel title="EDMX / $metadata">
        <textarea value={xml} onChange={(e) => setXml(e.target.value)} rows={8} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>

      {"error" in model ? (
        <Panel><p className="text-sm text-negative">{model.error}</p></Panel>
      ) : (
        <>
          <p className="text-xs text-foreground-muted">
            EDMX {model.version} · {model.namespaces.join(", ") || "no namespace"} · {model.entityTypes.length} entity types · {model.entitySets.length} entity sets
          </p>

          {model.entitySets.length > 0 && (
            <Panel title="Entity sets">
              <div className="flex flex-wrap gap-2 text-sm">
                {model.entitySets.map((es) => (
                  <span key={es.name} className="rounded-md bg-surface px-2.5 py-1 font-mono text-[0.8125rem]">
                    {es.name} <span className="text-foreground-muted">: {es.type.split(".").pop()}</span>
                  </span>
                ))}
              </div>
            </Panel>
          )}

          {model.entityTypes.length > 0 && (
            <Panel title="Entity types">
              <div className="space-y-2">
                {model.entityTypes.map((t) => <StructuredCard key={t.name} item={t} />)}
              </div>
            </Panel>
          )}

          {model.complexTypes.length > 0 && (
            <Panel title="Complex types">
              <div className="space-y-2">
                {model.complexTypes.map((t) => <StructuredCard key={t.name} item={t} />)}
              </div>
            </Panel>
          )}

          {model.operations.length > 0 && (
            <Panel title="Functions & actions">
              <ul className="space-y-2 text-sm">
                {model.operations.map((op) => (
                  <li key={op.name} className="font-mono text-[0.8125rem]">
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-sans font-medium text-foreground-muted">{op.kind}</span>{" "}
                    {op.name}({op.parameters.map((p) => `${p.name}: ${p.type.split(".").pop()}`).join(", ")})
                    {op.returnType && <span className="text-foreground-muted"> → {op.returnType.split(".").pop()}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
