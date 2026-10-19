"use client";

/* eslint-disable @next/next/no-img-element -- bike photos are remote user content; plain img avoids remote-pattern churn. */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

// SOT:photo-viewer
// WHAT: Full-screen photo viewer — zoom, pan, swipe/keyboard/arrow navigation.
// WHY:  Inspect bike condition closely without leaving the drawer (FR-M3).
// HOW:  Fixed overlay above the drawer; zoom via buttons/wheel/keys, navigate
//       via arrows/keys/swipe. Zoom resets on every photo change.
// WHERE: Opened from PhotoCarousel inside LeadDrawer.

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export function PhotoViewer({
  photos,
  alt,
  initialIndex = 0,
  onClose,
}: {
  photos: string[];
  alt: string;
  initialIndex?: number;
  onClose: () => void;
}) {
  const count = photos.length;
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), count - 1));
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragFrom = useRef({ x: 0, y: 0 });
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + count) % count);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    },
    [count],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + 0.5));
      else if (e.key === "-") setZoom((z) => clampZoom(z - 0.5));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleWheel(e: React.WheelEvent) {
    setZoom((z) => clampZoom(z + (e.deltaY < 0 ? 0.25 : -0.25)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    setDragging(true);
    dragFrom.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const limit = 400 * zoom;
    setOffset({
      x: Math.min(limit, Math.max(-limit, e.clientX - dragFrom.current.x)),
      y: Math.min(limit, Math.max(-limit, e.clientY - dragFrom.current.y)),
    });
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (touch) touchX.current = touch.clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchX.current;
    const touch = e.changedTouches[0];
    touchX.current = null;
    if (start === null || !touch || count < 2) return;
    const dx = touch.clientX - start;
    if (dx <= -40) go(1);
    else if (dx >= 40) go(-1);
  }

  const src = photos[index];
  if (!src || typeof document === "undefined") return null;

  // Portalled to body: the drawer Sheet marks the app root inert, which would
  // remove an inline viewer from the accessibility tree and block its clicks.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
    >
      <div
        className="flex items-center justify-between gap-2 p-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-base font-medium tabular-nums" aria-live="polite">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => clampZoom(z - 0.5))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Minus />
          </Button>
          <span className="w-12 text-center text-base tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => clampZoom(z + 0.5))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close viewer"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <X />
          </Button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-14 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {count > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
            >
              <ChevronRight />
            </Button>
          </>
        ) : null}
        <img
          src={src}
          alt={index === 0 ? alt : `${alt} (${index + 1})`}
          draggable={false}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          className={`max-h-full max-w-full object-contain transition-transform select-none ${zoom > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        />
      </div>
    </div>,
    document.body,
  );
}
