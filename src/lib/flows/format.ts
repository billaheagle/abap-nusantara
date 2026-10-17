import type { FlowSpec } from "./types";

/**
 * Formats a flow spec the way 00-plan/ILUSTRASI_ALUR.md asks: top-level keys
 * on their own lines and one step, receiver, slot or frame per line, so a
 * block reads well in review. Client-safe.
 */
export function formatFlow(spec: FlowSpec): string {
  const j = (v: unknown) => JSON.stringify(v);
  const list = (items: unknown[], indent: string) => items.map((x) => indent + j(x)).join(",\n");
  const out: string[] = [];
  const entries = Object.entries(spec) as [keyof FlowSpec, unknown][];
  entries.forEach(([key, value], i) => {
    const comma = i < entries.length - 1 ? "," : "";
    if (key === "steps" || key === "receivers" || key === "slots") {
      out.push(`  "${key}": [\n${list(value as unknown[], "    ")}\n  ]${comma}`);
    } else if (key === "exception") {
      const ex = value as NonNullable<FlowSpec["exception"]>;
      out.push(`  "exception": {"name":${j(ex.name)},"steps":[\n${list(ex.steps, "    ")}\n  ]}${comma}`);
    } else if (key === "scenarios") {
      const scenarios = (value as FlowSpec["scenarios"]).map(
        (sc, k, all) =>
          `    {"label":${j(sc.label)},"outcome":${j(sc.outcome)},"frames":[\n${list(sc.frames, "      ")}\n    ]}${k < all.length - 1 ? "," : ""}`,
      );
      out.push(`  "scenarios": [\n${scenarios.join("\n")}\n  ]${comma}`);
    } else {
      out.push(`  "${key}": ${j(value)}${comma}`);
    }
  });
  return `{\n${out.join("\n")}\n}`;
}
