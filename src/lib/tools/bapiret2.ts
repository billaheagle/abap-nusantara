export type Severity = "E" | "W" | "I" | "S" | "A";

export interface Bapiret2Message {
  type: Severity | string;
  id: string;
  number: string;
  message: string;
  field?: string;
}

export const SEVERITY_LABEL: Record<string, string> = {
  E: "Error",
  A: "Abort",
  W: "Warning",
  I: "Information",
  S: "Success",
};

const SEVERITY_RANK: Record<string, number> = { A: 0, E: 1, W: 2, I: 3, S: 4 };

/** Accepts a JSON array of BAPIRET2 rows, or plain "TYPE ID NUMBER TEXT" / "TYPE: TEXT" lines. */
export function parseBapiret2(input: string): { messages: Bapiret2Message[]; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { messages: [] };

  // JSON form
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.results) ? parsed.results : [parsed];
      return {
        messages: rows.map((r: Record<string, unknown>) => ({
          type: String(r.TYPE ?? r.type ?? r.Type ?? "I").toUpperCase().slice(0, 1) || "I",
          id: String(r.ID ?? r.id ?? r.MessageClass ?? ""),
          number: String(r.NUMBER ?? r.number ?? r.MessageNumber ?? ""),
          message: String(r.MESSAGE ?? r.message ?? r.MessageText ?? r.MESSAGE_V1 ?? ""),
          field: r.FIELD || r.field ? String(r.FIELD ?? r.field) : undefined,
        })),
      };
    } catch {
      return { messages: [], error: "Looks like JSON but could not be parsed." };
    }
  }

  // Line form
  const messages: Bapiret2Message[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    const l = line.trim();
    if (!l) continue;

    let m = l.match(/^([EWISA])\s*[:|]\s*(.+)$/i);
    if (m) {
      messages.push({ type: m[1].toUpperCase(), id: "", number: "", message: m[2].trim() });
      continue;
    }
    m = l.match(/^([EWISA])\s+(\S+)\s+(\d{1,3})\s+(.+)$/i);
    if (m) {
      messages.push({ type: m[1].toUpperCase(), id: m[2], number: m[3], message: m[4].trim() });
      continue;
    }
    messages.push({ type: "I", id: "", number: "", message: l });
  }
  return { messages };
}

export function sortBySeverity(messages: Bapiret2Message[]): Bapiret2Message[] {
  return [...messages].sort((a, b) => (SEVERITY_RANK[a.type] ?? 9) - (SEVERITY_RANK[b.type] ?? 9));
}

// ---- Message statement builder ----------------------------------------

export function buildMessageSnippets(cls: string, num: string, type: Severity): { label: string; code: string }[] {
  const c = cls || "ZMY_CLASS";
  const n = num || "001";
  return [
    {
      label: "Classic MESSAGE statement",
      code: `MESSAGE ${type}${n}(${c}) WITH lv_v1 lv_v2.`,
    },
    {
      label: "MESSAGE … INTO (no dialog)",
      code: `MESSAGE ${type}${n}(${c}) WITH lv_v1 INTO DATA(lv_msg).`,
    },
    {
      label: "Raise as exception (T100 message)",
      code: `RAISE EXCEPTION TYPE cx_my_exception\n  MESSAGE ${type}${n}(${c}) WITH lv_v1 lv_v2.`,
    },
    {
      label: "RAP — reported / failed",
      code: `APPEND VALUE #( %tky = key-%tky\n                %msg = new_message( id       = '${c}'\n                                    number   = '${n}'\n                                    severity = if_abap_behv_message=>severity-${type === "E" ? "error" : type === "W" ? "warning" : type === "S" ? "success" : "information"}\n                                    v1       = lv_v1 ) )\n       TO reported-entity.`,
    },
    {
      label: "BAPIRET2 fill",
      code: `APPEND VALUE bapiret2( type   = '${type}'\n                       id     = '${c}'\n                       number = '${n}'\n                       message_v1 = lv_v1 ) TO et_return.`,
    },
  ];
}
