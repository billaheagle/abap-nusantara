// LokalCraft ABAP engine worker for /tools/abap-playground.
// Loads lokalcraft.wasm once and runs programs off the main thread, so a long
// loop never freezes the page (the page terminates this worker after 15 s).
/* eslint-disable no-restricted-globals */
"use strict";

const VERSION = "0.12.0";
const enc = new TextEncoder();
const dec = new TextDecoder();
let ex = null;

const ready = (async () => {
  const res = await fetch(new URL(`lokalcraft.wasm?v=${VERSION}`, self.location.href));
  if (!res.ok) throw new Error(`lokalcraft.wasm: HTTP ${res.status}`);
  const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
  ex = instance.exports;
})();

ready.then(
  () => self.postMessage({ type: "ready" }),
  (err) => self.postMessage({ type: "fatal", msg: String(err) }),
);

self.onmessage = async (e) => {
  const { id, fn, input } = e.data;
  try {
    await ready;
    const bytes = enc.encode(input);
    const p = ex.lc_alloc(bytes.length);
    new Uint8Array(ex.memory.buffer, p, bytes.length).set(bytes);
    const t0 = performance.now();
    const r = ex[fn](p, bytes.length);
    const ms = performance.now() - t0;
    ex.lc_free(p, bytes.length);
    const n = new DataView(ex.memory.buffer).getUint32(r, true);
    const text = dec.decode(new Uint8Array(ex.memory.buffer, r + 4, n).slice());
    self.postMessage({ type: "result", id, text, ms });
  } catch (err) {
    self.postMessage({ type: "crash", id, msg: String(err) });
  }
};
