"use client";

import { useMemo, useState } from "react";
import { CopyButton, Panel } from "./primitives";
import { decodeJwt, isExpired, scopesOf, timeClaims } from "@/lib/tools/jwt";

export function JwtInspector() {
  const [token, setToken] = useState("");

  const decoded = useMemo(() => decodeJwt(token), [token]);

  return (
    <div className="space-y-5">
      <Panel title="Bearer token">
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder="eyJhbGciOiJSUzI1Ni... — paste an XSUAA / IAS / any JWT"
          className="tool-input tool-mono resize-y"
        />
      </Panel>

      {"error" in decoded ? (
        token.trim() && <Panel><p className="text-sm text-negative">{decoded.error}</p></Panel>
      ) : (
        <>
          {(() => {
            const claims = timeClaims(decoded.payload);
            const exp = claims.find((c) => c.key === "exp");
            const expired = isExpired(decoded.payload);
            return (
              <Panel>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${expired ? "text-negative" : exp ? "text-positive" : "text-foreground-muted"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {expired ? "Expired" : exp ? "Not expired" : "No exp claim"}
                  </span>
                  {claims.map((c) => (
                    <span key={c.key} className="text-foreground-muted">
                      <span className="font-medium text-foreground">{c.label}:</span> {c.when.toISOString().replace(".000Z", "Z")}{" "}
                      <span className="text-xs">({c.relative})</span>
                    </span>
                  ))}
                </div>
              </Panel>
            );
          })()}

          {(() => {
            const scopes = scopesOf(decoded.payload);
            return scopes.length ? (
              <Panel title={`Scopes (${scopes.length})`}>
                <div className="flex flex-wrap gap-1.5">
                  {scopes.map((s) => (
                    <span key={s} className="rounded-md bg-brand-tint px-2 py-1 font-mono text-[11px] text-brand">{s}</span>
                  ))}
                </div>
              </Panel>
            ) : null;
          })()}

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Header" action={<CopyButton value={JSON.stringify(decoded.header, null, 2)} />}>
              <pre className="tool-output">{JSON.stringify(decoded.header, null, 2)}</pre>
            </Panel>
            <Panel title="Payload" action={<CopyButton value={JSON.stringify(decoded.payload, null, 2)} />}>
              <pre className="tool-output">{JSON.stringify(decoded.payload, null, 2)}</pre>
            </Panel>
          </div>

          <p className="text-xs text-foreground-muted">
            The signature is <span className="font-medium text-foreground">not verified</span> — that needs the issuer&rsquo;s public key, which this browser tool does not have. Treat decoded claims as unauthenticated.
          </p>
        </>
      )}
    </div>
  );
}
