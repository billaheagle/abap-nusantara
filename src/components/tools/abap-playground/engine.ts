import type { EngineFn } from "./protocol";

export class EngineTimeout extends Error {}

interface Pending {
  resolve: (r: { text: string; ms: number }) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Talks to /lokalcraft/worker.js. A run that takes longer than `timeoutMs`
 * kills the worker (the only way to stop a runaway loop) and starts a new one.
 */
export class AbapEngine {
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private seq = 0;
  ready = false;

  constructor(
    private onState: (state: "ready" | "fatal", detail?: string) => void,
    private url = "/lokalcraft/worker.js?v=0.12.0",
    private timeoutMs = 15000,
  ) {}

  start() {
    this.ready = false;
    const w = new Worker(this.url);
    w.onmessage = (e: MessageEvent) => {
      const m = e.data as { type: string; id?: number; text?: string; ms?: number; msg?: string };
      if (m.type === "ready") {
        this.ready = true;
        this.onState("ready");
        return;
      }
      if (m.type === "fatal") {
        this.onState("fatal", m.msg);
        return;
      }
      const p = m.id === undefined ? undefined : this.pending.get(m.id);
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(m.id!);
      if (m.type === "result") p.resolve({ text: m.text ?? "", ms: m.ms ?? 0 });
      else {
        p.reject(new Error(m.msg ?? "engine error"));
        this.restart();
      }
    };
    w.onerror = (e) => this.onState("fatal", e.message);
    this.worker = w;
  }

  private restart() {
    this.worker?.terminate();
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("engine restarted"));
    }
    this.pending.clear();
    this.start();
  }

  call(fn: EngineFn, input: string): Promise<{ text: string; ms: number }> {
    if (!this.worker) this.start();
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new EngineTimeout());
        this.restart();
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.worker!.postMessage({ id, fn, input });
    });
  }

  dispose() {
    for (const p of this.pending.values()) clearTimeout(p.timer);
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}
