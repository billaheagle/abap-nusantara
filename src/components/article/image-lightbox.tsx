"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Maximize, Minimize, Minus, Plus, RotateCcw, X } from "lucide-react";

const MIN = 1;
const MAX = 6;
const STEP = 1.5;
const CLICK_ZOOM = 2.5;

interface View {
  scale: number;
  x: number;
  y: number;
}

const RESET: View = { scale: 1, x: 0, y: 0 };

/**
 * Full-viewport image viewer.
 *  - Zoom: click the image, wheel / trackpad pinch, touch pinch, +/− buttons or keys.
 *  - Pan: drag while zoomed (mouse or one finger). Double-click resets.
 *  - Fullscreen: browser Fullscreen API (F key or button).
 *  - Close: Esc, × button, or clicking the backdrop while not zoomed.
 * The original file is loaded unoptimized so zooming in stays sharp.
 */
export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [view, setViewState] = useState<View>(RESET);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Gesture handlers read the latest view from a ref (never stale); every
  // update goes through setView so ref and state always move together.
  const viewRef = useRef<View>(RESET);
  const setView = useCallback((v: View) => {
    viewRef.current = v;
    setViewState(v);
  }, []);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ startDist: number; startScale: number } | null>(null);
  const moved = useRef(false);
  const natural = useRef<{ w: number; h: number } | null>(null);

  /** Keep the image from being dragged entirely out of view. */
  const clamp = useCallback((v: View): View => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || v.scale <= 1) return RESET;
    const maxX = ((v.scale - 1) * rect.width) / 2;
    const maxY = ((v.scale - 1) * rect.height) / 2;
    return { scale: v.scale, x: Math.max(-maxX, Math.min(maxX, v.x)), y: Math.max(-maxY, Math.min(maxY, v.y)) };
  }, []);

  /** Zoom to `nextScale`, keeping the point (clientX, clientY) fixed on screen. */
  const zoomAt = useCallback(
    (nextScale: number, clientX?: number, clientY?: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      const cur = viewRef.current;
      const scale = Math.max(MIN, Math.min(MAX, nextScale));
      if (!rect) return setView(clamp({ ...cur, scale }));
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = (clientX ?? cx) - cx;
      const py = (clientY ?? cy) - cy;
      const k = scale / cur.scale;
      setView(clamp({ scale, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k }));
    },
    [clamp, setView],
  );

  // Wheel zoom — attached natively because React's onWheel is passive and
  // can't preventDefault the page scroll / browser zoom.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025));
      zoomAt(viewRef.current.scale * factor, e.clientX, e.clientY);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  // Keyboard, scroll lock, fullscreen tracking.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
      else if (e.key === "+" || e.key === "=") zoomAt(viewRef.current.scale * STEP);
      else if (e.key === "-" || e.key === "_") zoomAt(viewRef.current.scale / STEP);
      else if (e.key === "0") setView(RESET);
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    }
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onClose, zoomAt, toggleFullscreen, setView]);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { startDist: Math.hypot(a.x - b.x, a.y - b.y), startScale: viewRef.current.scale };
      moved.current = true;
    }
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((pinch.current.startScale * dist) / pinch.current.startDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    const cur = viewRef.current;
    if (cur.scale > 1) setView(clamp({ ...cur, x: cur.x + dx, y: cur.y + dy }));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }

  /** Is the point on the painted image (not the letterbox around object-contain)? */
  function isOnImage(clientX: number, clientY: number): boolean {
    const box = boxRef.current?.getBoundingClientRect();
    const n = natural.current;
    if (!box || !n) return true;
    const s = Math.min(box.width / n.w, box.height / n.h);
    const w = n.w * s;
    const h = n.h * s;
    const left = box.left + (box.width - w) / 2;
    const top = box.top + (box.height - h) / 2;
    return clientX >= left && clientX <= left + w && clientY >= top && clientY <= top + h;
  }

  function onStageClick(e: React.MouseEvent) {
    if (moved.current || viewRef.current.scale > 1) return; // after a drag/pinch, or while zoomed
    // Not zoomed: click the image to zoom in there, click the backdrop to close.
    if (isOnImage(e.clientX, e.clientY)) zoomAt(CLICK_ZOOM, e.clientX, e.clientY);
    else onClose();
  }

  const zoomed = view.scale > 1;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Image: ${alt}` : "Image preview"}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
    >
      {/* Stage */}
      <div
        ref={stageRef}
        className={`relative flex-1 touch-none select-none overflow-hidden ${zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onStageClick}
        onDoubleClick={() => setView(RESET)}
      >
        <div
          ref={boxRef}
          className={`absolute inset-4 bottom-24 sm:inset-10 sm:bottom-24 ${zoomed ? "pointer-events-none" : "cursor-zoom-in"}`}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: dragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            className="object-contain"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              natural.current = { w: img.naturalWidth, h: img.naturalHeight };
            }}
          />
        </div>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Caption + toolbar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
        {alt && <p className="max-w-2xl text-center text-sm text-white/75">{alt}</p>}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/10 p-1 text-white backdrop-blur">
          <ToolButton label="Zoom out (−)" onClick={() => zoomAt(view.scale / STEP)} disabled={view.scale <= MIN}>
            <Minus />
          </ToolButton>
          <button
            type="button"
            onClick={() => setView(RESET)}
            title="Reset zoom (0)"
            className="min-w-[3.5rem] rounded-full px-2 py-1.5 text-xs font-semibold tabular-nums text-white/90 hover:bg-white/15"
          >
            {Math.round(view.scale * 100)}%
          </button>
          <ToolButton label="Zoom in (+)" onClick={() => zoomAt(view.scale * STEP)} disabled={view.scale >= MAX}>
            <Plus />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-white/20" aria-hidden="true" />
          <ToolButton label="Reset (0)" onClick={() => setView(RESET)} disabled={!zoomed}>
            <RotateCcw />
          </ToolButton>
          <ToolButton label={isFullscreen ? "Exit full screen (F)" : "Full screen (F)"} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize /> : <Maximize />}
          </ToolButton>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent [&_svg]:h-4 [&_svg]:w-4"
    >
      {children}
    </button>
  );
}
