type ToolStatus = "live" | "beta" | "planned";

export type ToolCategory = "Integration" | "ABAP" | "OData & CDS" | "BTP & Security" | "Reference";

export const CATEGORY_ORDER: ToolCategory[] = ["ABAP", "Integration", "OData & CDS", "BTP & Security", "Reference"];

export interface ToolMeta {
  slug: string;
  name: string;
  blurb: string;
  category: ToolCategory;
  /** lucide-react icon name, resolved by the tools index. */
  icon: string;
  status: ToolStatus;
}

export const TOOL_REGISTRY: ToolMeta[] = [
  {
    slug: "sap-date-converter",
    name: "SAP Date & Time Converter",
    blurb: "Convert between SAP internal date/time/timestamp formats, ISO 8601 and Unix epoch — with timezone and ABAP literals.",
    category: "ABAP",
    icon: "CalendarClock",
    status: "live",
  },
  {
    slug: "alpha-converter",
    name: "Conversion Exit (ALPHA) Simulator",
    blurb: "Add or strip leading zeros the way domain conversion exits do — for material, customer and account numbers. Batch-friendly.",
    category: "ABAP",
    icon: "Binary",
    status: "live",
  },
  {
    slug: "payload-lab",
    name: "Payload Lab",
    blurb: "Format & validate JSON/XML, convert XML↔JSON, run JSONPath / XPath, Base64 & URL encode, hash, and diff — the integration dev's bench.",
    category: "Integration",
    icon: "FlaskConical",
    status: "live",
  },
  {
    slug: "odata-query-builder",
    name: "OData Query Builder",
    blurb: "Assemble $filter, $select, $expand, $orderby, $top/$skip and $search visually, validate the expression, and copy the encoded URL.",
    category: "OData & CDS",
    icon: "Link2",
    status: "live",
  },
  {
    slug: "edmx-explorer",
    name: "OData $metadata Explorer",
    blurb: "Paste an EDMX document (V2 or V4) and browse entity types, keys, properties, complex types, entity sets and function imports.",
    category: "OData & CDS",
    icon: "Network",
    status: "live",
  },
  {
    slug: "jwt-inspector",
    name: "JWT / XSUAA Token Inspector",
    blurb: "Decode a bearer token's header and claims, see expiry in plain language, and list the granted scopes. Signature is not verified.",
    category: "BTP & Security",
    icon: "KeyRound",
    status: "live",
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    blurb: "Test a pattern against sample text with live match highlighting and a groups table, plus notes on how ABAP's PCRE2 engine differs.",
    category: "ABAP",
    icon: "Regex",
    status: "live",
  },
  {
    slug: "cds-annotations",
    name: "CDS & RAP Annotation Helper",
    blurb: "A searchable reference of the annotations you actually use, and a generator for a Fiori Elements List Report @UI block.",
    category: "OData & CDS",
    icon: "Tags",
    status: "live",
  },
  {
    slug: "abap-type-mapper",
    name: "ABAP ↔ Edm ↔ JSON Type Mapper",
    blurb: "Look up how an ABAP or DDIC type maps to OData Edm (V2 & V4), JSON and TypeScript — length, decimals and the usual gotchas.",
    category: "OData & CDS",
    icon: "ArrowLeftRight",
    status: "live",
  },
  {
    slug: "groovy-snippets",
    name: "CPI Groovy Snippets",
    blurb: "A categorised, copy-ready library of the Groovy patterns that show up in almost every Integration Suite iFlow.",
    category: "Integration",
    icon: "Code2",
    status: "live",
  },
  {
    slug: "bapiret2-formatter",
    name: "BAPIRET2 & Message Formatter",
    blurb: "Turn a raw BAPIRET2 table into a clean, grouped message list — and build MESSAGE / RAP reported snippets from a message key.",
    category: "ABAP",
    icon: "MessageSquareWarning",
    status: "live",
  },
  {
    slug: "id-generator",
    name: "SAP GUID & ID Generator",
    blurb: "Generate SAP-style GUIDs (RAW16, CHAR32, CHAR22, UUID v4) one at a time or in bulk, plus a simple number-range simulator.",
    category: "ABAP",
    icon: "Fingerprint",
    status: "live",
  },
  {
    slug: "sap-codes",
    name: "Language / Country / Currency Codes",
    blurb: "SAP language keys ↔ ISO, ISO 3166 country codes and ISO 4217 currencies (with the non-two-decimal ones flagged). Searchable.",
    category: "Reference",
    icon: "Globe2",
    status: "live",
  },
  {
    slug: "x509-inspector",
    name: "X.509 / PEM Certificate Inspector",
    blurb: "Decode a PEM certificate — subject, issuer, validity, SANs and fingerprint — for Cloud Connector and CPI trust debugging.",
    category: "BTP & Security",
    icon: "ShieldCheck",
    status: "planned",
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOL_REGISTRY.find((t) => t.slug === slug);
}

export const LIVE_TOOL_SLUGS = TOOL_REGISTRY.filter((t) => t.status !== "planned").map((t) => t.slug);
