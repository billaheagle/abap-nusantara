export type GuidFlavour = "raw16" | "char32" | "char22" | "uuidv4" | "uuidUpper";

export const GUID_FLAVOURS: { value: GuidFlavour; label: string; note: string }[] = [
  { value: "char32", label: "SAP GUID · CHAR32", note: "32 uppercase hex chars — cl_system_uuid=>create_uuid_c32_static" },
  { value: "raw16", label: "SAP GUID · RAW16 (hex)", note: "Same 16 bytes as CHAR32; stored in RAW(16) columns" },
  { value: "char22", label: "SAP GUID · CHAR22", note: "Base64-ish 22-char form — create_uuid_c22_static" },
  { value: "uuidv4", label: "UUID v4 (lowercase, dashed)", note: "RFC 4122 — Edm.Guid / CAP style" },
  { value: "uuidUpper", label: "UUID v4 (uppercase, dashed)", note: "8-4-4-4-12, uppercase" },
];

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateGuid(flavour: GuidFlavour): string {
  const bytes = randomBytes(16);
  // set v4 + variant bits so every flavour is a valid UUIDv4 under the hood
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = toHex(bytes);

  switch (flavour) {
    case "char32":
      return hex.toUpperCase();
    case "raw16":
      return hex.toUpperCase();
    case "char22": {
      const b64 = btoa(String.fromCharCode(...bytes)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
      return b64.slice(0, 22);
    }
    case "uuidUpper":
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toUpperCase();
    default:
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}

export function generateBatch(flavour: GuidFlavour, count: number): string[] {
  return Array.from({ length: Math.min(Math.max(count, 1), 500) }, () => generateGuid(flavour));
}

export interface NumberRangeConfig {
  prefix: string;
  from: number;
  count: number;
  width: number;
  step: number;
}

export function simulateNumberRange(cfg: NumberRangeConfig): string[] {
  const count = Math.min(Math.max(cfg.count, 1), 500);
  return Array.from({ length: count }, (_, i) => {
    const n = cfg.from + i * (cfg.step || 1);
    return `${cfg.prefix}${String(n).padStart(cfg.width, "0")}`;
  });
}
