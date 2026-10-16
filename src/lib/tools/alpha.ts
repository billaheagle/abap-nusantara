/** Conversion-exit style leading-zero handling (CONVERSION_EXIT_ALPHA_INPUT / _OUTPUT). */

export type AlphaMode = "input" | "output" | "numc";

export interface AlphaRow {
  raw: string;
  result: string;
  note?: string;
}

/**
 * ALPHA INPUT: right-justify and pad with leading zeros — but only when the
 * value is purely numeric (letters are left untouched, matching the real exit).
 * ALPHA OUTPUT: strip leading zeros from a purely numeric value.
 * NUMC: always left-pad with zeros to the field length, truncating overflow.
 */
function convertAlpha(value: string, mode: AlphaMode, length: number): AlphaRow {
  const raw = value;
  const trimmed = value.trim();

  if (trimmed === "") return { raw, result: "", note: "kosong" };

  if (mode === "numc") {
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly !== trimmed) {
      return { raw, result: digitsOnly.slice(-length).padStart(length, "0"), note: "karakter non-angka dibuang" };
    }
    return {
      raw,
      result: digitsOnly.slice(-length).padStart(length, "0"),
      note: digitsOnly.length > length ? "dipotong sesuai panjang field" : undefined,
    };
  }

  const isNumeric = /^\d+$/.test(trimmed);

  if (mode === "input") {
    if (!isNumeric) return { raw, result: trimmed, note: "bukan murni angka, dibiarkan" };
    if (trimmed.length > length) return { raw, result: trimmed, note: "lebih panjang dari field, tidak diisi nol" };
    return { raw, result: trimmed.padStart(length, "0") };
  }

  // output
  if (!isNumeric) return { raw, result: trimmed, note: "bukan murni angka, dibiarkan" };
  const stripped = trimmed.replace(/^0+/, "");
  return { raw, result: stripped === "" ? "0" : stripped };
}

export function convertAlphaBatch(input: string, mode: AlphaMode, length: number): AlphaRow[] {
  return input
    .split(/\r?\n/)
    .filter((line, _i, all) => line.trim() !== "" || all.length === 1)
    .map((line) => convertAlpha(line, mode, length));
}

export const COMMON_FIELDS: { label: string; length: number }[] = [
  { label: "MATNR — Material (18)", length: 18 },
  { label: "MATNR40 — Material panjang (40)", length: 40 },
  { label: "KUNNR / LIFNR — Business partner (10)", length: 10 },
  { label: "BELNR — Nomor dokumen (10)", length: 10 },
  { label: "BUKRS — Company code (4)", length: 4 },
  { label: "WERKS — Plant (4)", length: 4 },
  { label: "EBELN — Dokumen pembelian (10)", length: 10 },
  { label: "VBELN — Dokumen penjualan (10)", length: 10 },
];
