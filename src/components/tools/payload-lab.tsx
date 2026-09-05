"use client";

import { useState } from "react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import {
  base64ToUtf8,
  formatJson,
  formatXml,
  fromHex,
  hashText,
  jsonToXml,
  lineDiff,
  minifyJson,
  runJsonPath,
  runXPath,
  toHex,
  utf8ToBase64,
  xmlToJson,
  type HashAlgo,
} from "@/lib/tools/payload";

type Mode = "format" | "convert" | "query" | "encode" | "hash" | "diff";

const SAMPLE_JSON = '{"d":{"results":[{"Matnr":"000000000000004711","Name":"Widget","Price":"9.90"},{"Matnr":"000000000000004712","Name":"Gadget","Price":"14.50"}]}}';
const SAMPLE_XML = '<Order id="4500001234"><Header><Currency>IDR</Currency></Header><Items><Item pos="10"><Material>4711</Material><Qty>5</Qty></Item></Items></Order>';

function safe(fn: () => string): { out: string; err: string | null } {
  try {
    return { out: fn(), err: null };
  } catch (e) {
    return { out: "", err: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export function PayloadLab() {
  const [mode, setMode] = useState<Mode>("format");

  return (
    <div className="space-y-5">
      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: "format", label: "Format" },
          { value: "convert", label: "Convert" },
          { value: "query", label: "Query" },
          { value: "encode", label: "Encode" },
          { value: "hash", label: "Hash" },
          { value: "diff", label: "Diff" },
        ]}
      />
      {mode === "format" && <FormatMode />}
      {mode === "convert" && <ConvertMode />}
      {mode === "query" && <QueryMode />}
      {mode === "encode" && <EncodeMode />}
      {mode === "hash" && <HashMode />}
      {mode === "diff" && <DiffMode />}
    </div>
  );
}

function FormatMode() {
  const [lang, setLang] = useState<"json" | "xml">("json");
  const [text, setText] = useState(SAMPLE_JSON);
  const [indent, setIndent] = useState(2);

  const pretty = safe(() => (lang === "json" ? formatJson(text, indent) : formatXml(text, indent)));
  const mini = lang === "json" ? safe(() => minifyJson(text)) : { out: "", err: "Minify is JSON-only" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={lang} onChange={setLang} options={[{ value: "json", label: "JSON" }, { value: "xml", label: "XML" }]} />
        <Field label="Indent">
          <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className="tool-input w-20">
            {[2, 4, 0].map((n) => (
              <option key={n} value={n}>{n === 0 ? "tab" : n}</option>
            ))}
          </select>
        </Field>
      </div>
      <Panel title="Input">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>
      <Panel
        title={pretty.err ? "Invalid" : "Formatted & validated ✓"}
        action={!pretty.err && <CopyButton value={pretty.out} />}
      >
        {pretty.err ? <p className="text-sm text-negative">{pretty.err}</p> : <pre className="tool-output">{pretty.out}</pre>}
      </Panel>
      {lang === "json" && !mini.err && (
        <Panel title="Minified" action={<CopyButton value={mini.out} />}>
          <pre className="tool-output">{mini.out}</pre>
        </Panel>
      )}
    </div>
  );
}

function ConvertMode() {
  const [dir, setDir] = useState<"x2j" | "j2x">("x2j");
  const [text, setText] = useState(SAMPLE_XML);

  const result = safe(() => (dir === "x2j" ? xmlToJson(text) : jsonToXml(text)));

  return (
    <div className="space-y-4">
      <Segmented
        value={dir}
        onChange={(d) => {
          setDir(d);
          setText(d === "x2j" ? SAMPLE_XML : SAMPLE_JSON);
        }}
        options={[
          { value: "x2j", label: "XML → JSON" },
          { value: "j2x", label: "JSON → XML" },
        ]}
      />
      <p className="text-xs text-foreground-muted">
        Attributes become <code className="tool-code">@name</code> keys; mixed text content becomes <code className="tool-code">#text</code>. Repeated elements collapse into an array.
      </p>
      <Panel title="Input">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>
      <Panel title={result.err ? "Invalid" : "Output"} action={!result.err && <CopyButton value={result.out} />}>
        {result.err ? <p className="text-sm text-negative">{result.err}</p> : <pre className="tool-output">{result.out}</pre>}
      </Panel>
    </div>
  );
}

function QueryMode() {
  const [lang, setLang] = useState<"json" | "xml">("json");
  const [text, setText] = useState(SAMPLE_JSON);
  const [expr, setExpr] = useState("$.d.results[*].Matnr");

  const result = safe(() => (lang === "json" ? runJsonPath(text, expr) : runXPath(text, expr)));

  return (
    <div className="space-y-4">
      <Segmented
        value={lang}
        onChange={(l) => {
          setLang(l);
          setText(l === "json" ? SAMPLE_JSON : SAMPLE_XML);
          setExpr(l === "json" ? "$.d.results[*].Matnr" : "//Item/Material");
        }}
        options={[
          { value: "json", label: "JSONPath" },
          { value: "xml", label: "XPath" },
        ]}
      />
      <Panel title="Document">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>
      <Field
        label={lang === "json" ? "JSONPath expression" : "XPath expression"}
        hint={
          lang === "json"
            ? "Supports $ . [n] [*] and .. (recursive descent). Filter expressions [?(…)] are not supported yet."
            : "Standard XPath 1.0. For namespaced documents use local-name(), e.g. //*[local-name()='Item']."
        }
      >
        <input value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false} className="tool-input tool-mono" />
      </Field>
      <Panel title={result.err ? "Error" : "Matches"}>
        {result.err ? <p className="text-sm text-negative">{result.err}</p> : <pre className="tool-output">{result.out}</pre>}
      </Panel>
    </div>
  );
}

function EncodeMode() {
  const [kind, setKind] = useState<"base64" | "url" | "hex">("base64");
  const [text, setText] = useState("Halo Nusantara ✨");
  const [encoded, setEncoded] = useState("");

  function run() {
    try {
      if (kind === "base64") setEncoded(utf8ToBase64(text));
      else if (kind === "url") setEncoded(encodeURIComponent(text));
      else setEncoded(toHex(text));
    } catch (e) {
      setEncoded(`Error: ${e instanceof Error ? e.message : "encode failed"}`);
    }
  }
  function decode() {
    try {
      if (kind === "base64") setText(base64ToUtf8(encoded));
      else if (kind === "url") setText(decodeURIComponent(encoded));
      else setText(fromHex(encoded));
    } catch (e) {
      setText(`Error: ${e instanceof Error ? e.message : "decode failed"}`);
    }
  }

  return (
    <div className="space-y-4">
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: "base64", label: "Base64" },
          { value: "url", label: "URL" },
          { value: "hex", label: "Hex" },
        ]}
      />
      <Panel title="Plain text" action={<button type="button" onClick={run} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">Encode ↓</button>}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>
      <Panel
        title="Encoded"
        action={
          <div className="flex gap-2">
            <button type="button" onClick={decode} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">Decode ↑</button>
            <CopyButton value={encoded} />
          </div>
        }
      >
        <textarea value={encoded} onChange={(e) => setEncoded(e.target.value)} rows={4} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>
    </div>
  );
}

const HASH_ALGOS: HashAlgo[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function HashMode() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});

  async function run(t: string) {
    setText(t);
    if (!t) {
      setResults({});
      return;
    }
    const entries = await Promise.all(HASH_ALGOS.map(async (a) => [a, await hashText(t, a)] as const));
    setResults(Object.fromEntries(entries));
  }

  return (
    <div className="space-y-4">
      <Panel title="Text to hash">
        <textarea
          value={text}
          onChange={(e) => run(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder="Type or paste — hashes update live"
          className="tool-input tool-mono resize-y"
        />
      </Panel>
      <Panel title="Digests (hex)">
        <table className="w-full text-sm">
          <tbody>
            {HASH_ALGOS.map((a) => (
              <tr key={a} className="border-b border-border last:border-0">
                <td className="py-2 pr-3 font-medium text-foreground-muted">{a}</td>
                <td className="py-2 font-mono text-[0.8125rem] break-all">{results[a] ?? "—"}</td>
                <td className="py-2 pl-2 text-right">{results[a] && <CopyButton value={results[a]} label="" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function DiffMode() {
  const [a, setA] = useState("Matnr: 4711\nName: Widget\nPrice: 9.90");
  const [b, setB] = useState("Matnr: 4711\nName: Widget Pro\nPrice: 12.50\nActive: X");
  const lines = lineDiff(a, b);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Before">
          <textarea value={a} onChange={(e) => setA(e.target.value)} rows={8} spellCheck={false} className="tool-input tool-mono resize-y" />
        </Panel>
        <Panel title="After">
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={8} spellCheck={false} className="tool-input tool-mono resize-y" />
        </Panel>
      </div>
      <Panel title="Line diff">
        <pre className="tool-output">
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                background: l.type === "add" ? "rgb(26 127 75 / 0.22)" : l.type === "del" ? "rgb(180 35 24 / 0.22)" : "transparent",
              }}
            >
              {l.type === "add" ? "+ " : l.type === "del" ? "- " : "  "}
              {l.text || " "}
            </div>
          ))}
        </pre>
      </Panel>
    </div>
  );
}
