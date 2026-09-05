/* Payload Lab helpers. DOM-using functions (XML, XPath) are only called from
   event handlers in the browser, never during SSR. */

// ---- JSON ------------------------------------------------------------------

export function formatJson(input: string, indent: number): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

// ---- XML ------------------------------------------------------------------

function parseXml(input: string): Document {
  const doc = new DOMParser().parseFromString(input, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error(err.textContent?.replace(/\s+/g, " ").trim() || "Invalid XML");
  return doc;
}

export function formatXml(input: string, indent: number): string {
  const doc = parseXml(input);
  const pad = " ".repeat(indent);
  const walk = (node: Node, depth: number): string => {
    const p = pad.repeat(depth);
    if (node.nodeType === 3) {
      const t = node.nodeValue?.trim();
      return t ? `${p}${t}\n` : "";
    }
    if (node.nodeType === 8) return `${p}<!--${node.nodeValue}-->\n`;
    if (node.nodeType === 4) return `${p}<![CDATA[${node.nodeValue}]]>\n`;
    if (node.nodeType !== 1) return "";
    const el = node as Element;
    const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
    const kids = Array.from(el.childNodes);
    const richKids = kids.filter((k) => k.nodeType === 1 || k.nodeType === 8 || k.nodeType === 4);
    if (kids.length === 0) return `${p}<${el.nodeName}${attrs}/>\n`;
    if (richKids.length === 0) return `${p}<${el.nodeName}${attrs}>${el.textContent}</${el.nodeName}>\n`;
    return `${p}<${el.nodeName}${attrs}>\n${kids.map((k) => walk(k, depth + 1)).join("")}${p}</${el.nodeName}>\n`;
  };
  return Array.from(doc.childNodes).map((n) => walk(n, 0)).join("").trimEnd();
}

export function xmlToJson(input: string): string {
  const doc = parseXml(input);
  const conv = (el: Element): unknown => {
    const obj: Record<string, unknown> = {};
    for (const a of Array.from(el.attributes)) obj[`@${a.name}`] = a.value;
    const kids = Array.from(el.children);
    if (kids.length === 0) {
      const text = el.textContent?.trim() ?? "";
      if (Object.keys(obj).length === 0) return text;
      if (text) obj["#text"] = text;
      return obj;
    }
    for (const k of kids) {
      const val = conv(k);
      if (k.nodeName in obj) {
        const cur = obj[k.nodeName];
        obj[k.nodeName] = Array.isArray(cur) ? [...cur, val] : [cur, val];
      } else obj[k.nodeName] = val;
    }
    return obj;
  };
  return JSON.stringify({ [doc.documentElement.nodeName]: conv(doc.documentElement) }, null, 2);
}

export function jsonToXml(input: string): string {
  const value = JSON.parse(input);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pad = "  ";
  const build = (v: unknown, name: string, depth: number): string => {
    const p = pad.repeat(depth);
    if (v === null || v === undefined) return `${p}<${name}/>`;
    if (Array.isArray(v)) return v.map((item) => build(item, name, depth)).join("\n");
    if (typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>);
      const attrs = entries.filter(([k]) => k.startsWith("@")).map(([k, val]) => ` ${k.slice(1)}="${esc(String(val))}"`).join("");
      const kids = entries.filter(([k]) => !k.startsWith("@") && k !== "#text");
      const text = (v as Record<string, unknown>)["#text"];
      if (kids.length === 0) return `${p}<${name}${attrs}>${text !== undefined ? esc(String(text)) : ""}</${name}>`;
      return `${p}<${name}${attrs}>\n${kids.map(([k, val]) => build(val, k, depth + 1)).join("\n")}\n${p}</${name}>`;
    }
    return `${p}<${name}>${esc(String(v))}</${name}>`;
  };
  let rootName = "root";
  let payload: unknown = value;
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1) {
    rootName = Object.keys(value)[0];
    payload = (value as Record<string, unknown>)[rootName];
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${build(payload, rootName, 0)}`;
}

// ---- Path queries --------------------------------------------------------

export function runJsonPath(input: string, path: string): string {
  const data = JSON.parse(input);
  let p = path.trim();
  if (p === "" || p === "$") return JSON.stringify(data, null, 2);
  if (!p.startsWith("$")) p = "$" + (p.startsWith("[") ? "" : ".") + p;

  type Tok = { t: "child" | "index" | "wild" | "recurse"; v?: string | number };
  const toks: Tok[] = [];
  let i = 1;
  const readName = () => {
    let name = "";
    while (i < p.length && /[^.[\]]/.test(p[i])) name += p[i++];
    return name;
  };
  while (i < p.length) {
    if (p[i] === "." && p[i + 1] === ".") {
      toks.push({ t: "recurse" });
      i += 2;
      if (p[i] === "*") { toks.push({ t: "wild" }); i++; }
      else if (p[i] && p[i] !== "." && p[i] !== "[") {
        const name = readName();
        if (name) toks.push({ t: "child", v: name });
      }
    } else if (p[i] === ".") {
      i++;
      if (p[i] === "*") { toks.push({ t: "wild" }); i++; }
      else {
        const name = readName();
        if (name) toks.push({ t: "child", v: name });
      }
    } else if (p[i] === "[") {
      const end = p.indexOf("]", i);
      if (end === -1) throw new Error("Unbalanced '[' in path");
      const inner = p.slice(i + 1, end).trim();
      i = end + 1;
      if (inner === "*") toks.push({ t: "wild" });
      else if (/^-?\d+$/.test(inner)) toks.push({ t: "index", v: +inner });
      else toks.push({ t: "child", v: inner.replace(/^['"]|['"]$/g, "") });
    } else i++;
  }

  let cur: unknown[] = [data];
  for (const tok of toks) {
    const next: unknown[] = [];
    for (const node of cur) {
      if (tok.t === "child") {
        const key = tok.v as string;
        if (node && typeof node === "object" && !Array.isArray(node) && key in node) next.push((node as Record<string, unknown>)[key]);
      } else if (tok.t === "index") {
        if (Array.isArray(node)) {
          const idx = (tok.v as number) < 0 ? node.length + (tok.v as number) : (tok.v as number);
          if (idx >= 0 && idx < node.length) next.push(node[idx]);
        }
      } else if (tok.t === "wild") {
        if (Array.isArray(node)) next.push(...node);
        else if (node && typeof node === "object") next.push(...Object.values(node as object));
      } else {
        const all: unknown[] = [];
        const walk = (n: unknown) => {
          all.push(n);
          if (Array.isArray(n)) n.forEach(walk);
          else if (n && typeof n === "object") Object.values(n as object).forEach(walk);
        };
        walk(node);
        next.push(...all);
      }
    }
    cur = next;
  }

  if (cur.length === 0) return "(no matches)";
  if (cur.length === 1) return JSON.stringify(cur[0], null, 2);
  return JSON.stringify(cur, null, 2);
}

export function runXPath(xml: string, expr: string): string {
  const doc = parseXml(xml);
  const res = doc.evaluate(expr, doc, null, XPathResult.ANY_TYPE, null);
  if (res.resultType === XPathResult.NUMBER_TYPE) return String(res.numberValue);
  if (res.resultType === XPathResult.STRING_TYPE) return res.stringValue;
  if (res.resultType === XPathResult.BOOLEAN_TYPE) return String(res.booleanValue);
  const out: string[] = [];
  let n = res.iterateNext();
  while (n) {
    out.push(n.nodeType === 1 ? (n as Element).outerHTML : (n.nodeValue ?? n.textContent ?? ""));
    n = res.iterateNext();
  }
  return out.length ? out.join("\n\n") : "(no matches)";
}

// ---- Encoding -----------------------------------------------------------

export function utf8ToBase64(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}
export function base64ToUtf8(s: string): string {
  const clean = s.trim().replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(clean);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
export function toHex(s: string): string {
  return Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join(" ");
}
export function fromHex(s: string): string {
  const bytes = s.trim().split(/[\s,]+/).filter(Boolean).map((h) => parseInt(h, 16));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

// ---- Hashing -----------------------------------------------------------

export type HashAlgo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export async function hashText(text: string, algo: HashAlgo): Promise<string> {
  if (algo === "MD5") return md5(text);
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Compact MD5 (public domain, after Joseph Myers / blueimp). */
function md5(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const n = bytes.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8));
  words[n >> 2] = (words[n >> 2] || 0) | (0x80 << ((n % 4) * 8));
  words[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8;

  const add = (a: number, b: number) => (a + b) & 0xffffffff;
  const rol = (x: number, c: number) => (x << c) | (x >>> (32 - c));
  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) =>
    add(rol(add(add(a, q), add(x, t)), s), b);
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(c ^ (b | ~d), a, b, x, s, t);

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < words.length; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    const w = (j: number) => words[i + j] || 0;
    a = ff(a, b, c, d, w(0), 7, -680876936); d = ff(d, a, b, c, w(1), 12, -389564586); c = ff(c, d, a, b, w(2), 17, 606105819); b = ff(b, c, d, a, w(3), 22, -1044525330);
    a = ff(a, b, c, d, w(4), 7, -176418897); d = ff(d, a, b, c, w(5), 12, 1200080426); c = ff(c, d, a, b, w(6), 17, -1473231341); b = ff(b, c, d, a, w(7), 22, -45705983);
    a = ff(a, b, c, d, w(8), 7, 1770035416); d = ff(d, a, b, c, w(9), 12, -1958414417); c = ff(c, d, a, b, w(10), 17, -42063); b = ff(b, c, d, a, w(11), 22, -1990404162);
    a = ff(a, b, c, d, w(12), 7, 1804603682); d = ff(d, a, b, c, w(13), 12, -40341101); c = ff(c, d, a, b, w(14), 17, -1502002290); b = ff(b, c, d, a, w(15), 22, 1236535329);
    a = gg(a, b, c, d, w(1), 5, -165796510); d = gg(d, a, b, c, w(6), 9, -1069501632); c = gg(c, d, a, b, w(11), 14, 643717713); b = gg(b, c, d, a, w(0), 20, -373897302);
    a = gg(a, b, c, d, w(5), 5, -701558691); d = gg(d, a, b, c, w(10), 9, 38016083); c = gg(c, d, a, b, w(15), 14, -660478335); b = gg(b, c, d, a, w(4), 20, -405537848);
    a = gg(a, b, c, d, w(9), 5, 568446438); d = gg(d, a, b, c, w(14), 9, -1019803690); c = gg(c, d, a, b, w(3), 14, -187363961); b = gg(b, c, d, a, w(8), 20, 1163531501);
    a = gg(a, b, c, d, w(13), 5, -1444681467); d = gg(d, a, b, c, w(2), 9, -51403784); c = gg(c, d, a, b, w(7), 14, 1735328473); b = gg(b, c, d, a, w(12), 20, -1926607734);
    a = hh(a, b, c, d, w(5), 4, -378558); d = hh(d, a, b, c, w(8), 11, -2022574463); c = hh(c, d, a, b, w(11), 16, 1839030562); b = hh(b, c, d, a, w(14), 23, -35309556);
    a = hh(a, b, c, d, w(1), 4, -1530992060); d = hh(d, a, b, c, w(4), 11, 1272893353); c = hh(c, d, a, b, w(7), 16, -155497632); b = hh(b, c, d, a, w(10), 23, -1094730640);
    a = hh(a, b, c, d, w(13), 4, 681279174); d = hh(d, a, b, c, w(0), 11, -358537222); c = hh(c, d, a, b, w(3), 16, -722521979); b = hh(b, c, d, a, w(6), 23, 76029189);
    a = hh(a, b, c, d, w(9), 4, -640364487); d = hh(d, a, b, c, w(12), 11, -421815835); c = hh(c, d, a, b, w(15), 16, 530742520); b = hh(b, c, d, a, w(2), 23, -995338651);
    a = ii(a, b, c, d, w(0), 6, -198630844); d = ii(d, a, b, c, w(7), 10, 1126891415); c = ii(c, d, a, b, w(14), 15, -1416354905); b = ii(b, c, d, a, w(5), 21, -57434055);
    a = ii(a, b, c, d, w(12), 6, 1700485571); d = ii(d, a, b, c, w(3), 10, -1894986606); c = ii(c, d, a, b, w(10), 15, -1051523); b = ii(b, c, d, a, w(1), 21, -2054922799);
    a = ii(a, b, c, d, w(8), 6, 1873313359); d = ii(d, a, b, c, w(15), 10, -30611744); c = ii(c, d, a, b, w(6), 15, -1560198380); b = ii(b, c, d, a, w(13), 21, 1309151649);
    a = ii(a, b, c, d, w(4), 6, -145523070); d = ii(d, a, b, c, w(11), 10, -1120210379); c = ii(c, d, a, b, w(2), 15, 718787259); b = ii(b, c, d, a, w(9), 21, -343485551);
    a = add(a, oa); b = add(b, ob); c = add(c, oc); d = add(d, od);
  }
  const hex = (x: number) => Array.from({ length: 4 }, (_, j) => ((x >> (j * 8)) & 0xff).toString(16).padStart(2, "0")).join("");
  return hex(a) + hex(b) + hex(c) + hex(d);
}

// ---- Diff -------------------------------------------------------------

export type DiffLine = { type: "same" | "add" | "del"; text: string };

export function lineDiff(a: string, b: string): DiffLine[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length;
  const m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: A[i++] });
    } else {
      out.push({ type: "add", text: B[j++] });
    }
  }
  while (i < n) out.push({ type: "del", text: A[i++] });
  while (j < m) out.push({ type: "add", text: B[j++] });
  return out;
}
