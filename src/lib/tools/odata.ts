/** OData query-string builder + $filter validation. */

export type ODataVersion = "v2" | "v4";

export const FILTER_OPS = [
  { value: "eq", label: "= sama dengan" },
  { value: "ne", label: "≠ tidak sama dengan" },
  { value: "gt", label: "> lebih besar" },
  { value: "ge", label: "≥ lebih besar atau sama" },
  { value: "lt", label: "< lebih kecil" },
  { value: "le", label: "≤ lebih kecil atau sama" },
  { value: "contains", label: "mengandung" },
  { value: "startswith", label: "diawali" },
  { value: "endswith", label: "diakhiri" },
];

export interface FilterRow {
  field: string;
  op: string;
  value: string;
  conn: "and" | "or";
}

export interface OrderRow {
  field: string;
  dir: "asc" | "desc";
}

export interface ODataInput {
  baseUrl: string;
  entitySet: string;
  version: ODataVersion;
  select: string;
  expand: string;
  filterRows: FilterRow[];
  rawFilter: string;
  useRaw: boolean;
  orderRows: OrderRow[];
  top: string;
  skip: string;
  count: boolean;
  search: string;
  format: string;
}

function formatValue(raw: string, version: ODataVersion): string {
  const v = raw.trim();
  if (v === "") return "''";
  if (v === "true" || v === "false" || v === "null") return v;
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    return version === "v2" ? `guid'${v}'` : v;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
    return version === "v2" ? `datetime'${v}'` : v;
  }
  return `'${v.replace(/'/g, "''")}'`;
}

function buildFilterFromRows(rows: FilterRow[], version: ODataVersion): string {
  return rows
    .filter((r) => r.field.trim())
    .map((r, i) => {
      const prefix = i === 0 ? "" : ` ${r.conn} `;
      const val = formatValue(r.value, version);
      let clause: string;
      if (r.op === "contains") {
        clause = version === "v2" ? `substringof(${val}, ${r.field}) eq true` : `contains(${r.field}, ${val})`;
      } else if (r.op === "startswith" || r.op === "endswith") {
        clause = `${r.op}(${r.field}, ${val})${version === "v2" ? " eq true" : ""}`;
      } else {
        clause = `${r.field} ${r.op} ${val}`;
      }
      return prefix + clause;
    })
    .join("");
}

function validateFilter(expr: string): string[] {
  const issues: string[] = [];
  if (!expr.trim()) return issues;

  let depth = 0;
  let inString = false;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === "'") {
      if (inString && expr[i + 1] === "'") {
        i++;
        continue;
      }
      inString = !inString;
    } else if (!inString) {
      if (c === "(") depth++;
      else if (c === ")") depth--;
      if (depth < 0) {
        issues.push("Ada ')' tanpa pasangan '('.");
        depth = 0;
      }
    }
  }
  if (inString) issues.push("String literal tidak ditutup. Periksa tanda kutip tunggalnya.");
  if (depth > 0) issues.push(`${depth} '(' belum ditutup. Jumlah kurungnya tidak seimbang.`);

  const bareWords = expr
    .replace(/'[^']*'/g, "")
    .match(/\b(and|or|eq|ne|gt|ge|lt|le|not)\b/gi);
  const tokens = expr.replace(/'[^']*'/g, "").split(/\s+/).filter(Boolean);
  if (tokens.length >= 3 && !bareWords) {
    issues.push("Tidak ada operator yang dikenali (eq, ne, gt, ge, lt, le, and, or). Apakah ini $filter yang valid?");
  }
  return issues;
}

export interface BuiltQuery {
  query: string;
  url: string;
  warnings: string[];
}

export function buildQuery(input: ODataInput): BuiltQuery {
  const warnings: string[] = [];
  const params: [string, string][] = [];

  const select = input.select.split(",").map((s) => s.trim()).filter(Boolean);
  if (select.length) params.push(["$select", select.join(",")]);

  const expand = input.expand.split(",").map((s) => s.trim()).filter(Boolean);
  if (expand.length) params.push(["$expand", expand.join(",")]);

  const filter = input.useRaw ? input.rawFilter.trim() : buildFilterFromRows(input.filterRows, input.version);
  if (filter) {
    params.push(["$filter", filter]);
    warnings.push(...validateFilter(filter));
  }

  const orderby = input.orderRows
    .filter((r) => r.field.trim())
    .map((r) => `${r.field} ${r.dir}`)
    .join(",");
  if (orderby) params.push(["$orderby", orderby]);

  if (input.top.trim()) {
    if (!/^\d+$/.test(input.top.trim())) warnings.push("$top harus bilangan bulat, tidak boleh negatif.");
    params.push(["$top", input.top.trim()]);
  }
  if (input.skip.trim()) {
    if (!/^\d+$/.test(input.skip.trim())) warnings.push("$skip harus bilangan bulat, tidak boleh negatif.");
    params.push(["$skip", input.skip.trim()]);
  }
  if (input.count) params.push([input.version === "v2" ? "$inlinecount" : "$count", input.version === "v2" ? "allpages" : "true"]);
  if (input.search.trim()) {
    if (input.version === "v2") warnings.push("$search hanya ada di OData V4. SAP Gateway V2 memakai parameter custom 'search'.");
    params.push(["$search", input.search.trim()]);
  }
  if (input.format.trim()) params.push(["$format", input.format.trim()]);

  const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

  const base = input.baseUrl.trim().replace(/\/+$/, "");
  const set = input.entitySet.trim().replace(/^\/+/, "");
  const path = [base, set].filter(Boolean).join("/");
  const url = path ? `${path}${query ? `?${query}` : ""}` : query ? `?${query}` : "";

  return { query: query || "(belum ada parameter)", url: url || "(isi base URL dan entity set)", warnings };
}
