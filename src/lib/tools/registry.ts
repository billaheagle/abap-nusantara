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
    blurb: "Konversi format tanggal, jam, dan timestamp internal SAP ke ISO 8601 dan Unix epoch, lengkap dengan zona waktu dan literal ABAP.",
    category: "ABAP",
    icon: "CalendarClock",
    status: "live",
  },
  {
    slug: "alpha-converter",
    name: "Conversion Exit (ALPHA) Simulator",
    blurb: "Tambah atau buang nol di depan seperti conversion exit domain, untuk nomor material, customer, dan akun. Bisa banyak sekaligus.",
    category: "ABAP",
    icon: "Binary",
    status: "live",
  },
  {
    slug: "payload-lab",
    name: "Payload Lab",
    blurb: "Format dan validasi JSON/XML, konversi XML↔JSON, JSONPath/XPath, encode Base64 dan URL, hash, serta diff. Meja kerja developer integrasi.",
    category: "Integration",
    icon: "FlaskConical",
    status: "live",
  },
  {
    slug: "odata-query-builder",
    name: "OData Query Builder",
    blurb: "Susun $filter, $select, $expand, $orderby, $top/$skip, dan $search secara visual, validasi ekspresinya, lalu salin URL yang sudah di-encode.",
    category: "OData & CDS",
    icon: "Link2",
    status: "live",
  },
  {
    slug: "edmx-explorer",
    name: "OData $metadata Explorer",
    blurb: "Tempel dokumen EDMX (V2 atau V4), lalu jelajahi entity type, key, property, complex type, entity set, dan function import.",
    category: "OData & CDS",
    icon: "Network",
    status: "live",
  },
  {
    slug: "jwt-inspector",
    name: "JWT / XSUAA Token Inspector",
    blurb: "Decode header dan claim bearer token, lihat masa berlakunya dalam bahasa biasa, dan daftar scope yang diberikan. Signature tidak diverifikasi.",
    category: "BTP & Security",
    icon: "KeyRound",
    status: "live",
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    blurb: "Uji pola regex pada teks contoh dengan sorotan langsung dan tabel grup, plus catatan perbedaan engine PCRE2 di ABAP.",
    category: "ABAP",
    icon: "Regex",
    status: "live",
  },
  {
    slug: "cds-annotations",
    name: "CDS & RAP Annotation Helper",
    blurb: "Referensi annotation yang benar-benar dipakai, bisa dicari, plus generator blok @UI untuk List Report Fiori Elements.",
    category: "OData & CDS",
    icon: "Tags",
    status: "live",
  },
  {
    slug: "abap-type-mapper",
    name: "ABAP ↔ Edm ↔ JSON Type Mapper",
    blurb: "Cari padanan tipe ABAP atau DDIC di OData Edm (V2 dan V4), JSON, dan TypeScript, termasuk panjang, desimal, dan jebakan yang biasa muncul.",
    category: "OData & CDS",
    icon: "ArrowLeftRight",
    status: "live",
  },
  {
    slug: "groovy-snippets",
    name: "CPI Groovy Snippets",
    blurb: "Kumpulan pola Groovy siap salin, dikelompokkan per kategori, yang muncul di hampir setiap iFlow Integration Suite.",
    category: "Integration",
    icon: "Code2",
    status: "live",
  },
  {
    slug: "bapiret2-formatter",
    name: "BAPIRET2 & Message Formatter",
    blurb: "Ubah tabel BAPIRET2 mentah jadi daftar pesan yang rapi dan dikelompokkan, plus buat snippet MESSAGE atau RAP reported dari message key.",
    category: "ABAP",
    icon: "MessageSquareWarning",
    status: "live",
  },
  {
    slug: "id-generator",
    name: "SAP GUID & ID Generator",
    blurb: "Buat GUID gaya SAP (RAW16, CHAR32, CHAR22, UUID v4) satu per satu atau banyak sekaligus, plus simulator number range sederhana.",
    category: "ABAP",
    icon: "Fingerprint",
    status: "live",
  },
  {
    slug: "sap-codes",
    name: "Language / Country / Currency Codes",
    blurb: "Language key SAP ↔ ISO, kode negara ISO 3166, dan mata uang ISO 4217 (yang desimalnya bukan dua ditandai). Bisa dicari.",
    category: "Reference",
    icon: "Globe2",
    status: "live",
  },
  {
    slug: "x509-inspector",
    name: "X.509 / PEM Certificate Inspector",
    blurb: "Decode sertifikat PEM (subject, issuer, masa berlaku, SAN, dan fingerprint) untuk debugging trust Cloud Connector dan CPI.",
    category: "BTP & Security",
    icon: "ShieldCheck",
    status: "planned",
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOL_REGISTRY.find((t) => t.slug === slug);
}

export const LIVE_TOOL_SLUGS = TOOL_REGISTRY.filter((t) => t.status !== "planned").map((t) => t.slug);
