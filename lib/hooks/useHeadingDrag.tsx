"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type React from "react";

type DragData = {
  timer: ReturnType<typeof setTimeout> | null;
  triggered: boolean;
  pointerId: number;
  element: HTMLElement | null;
  startX: number;
  startY: number;
  startSize: number;
};

type DragToastSegment = { label: string; value: number; atLimit: boolean };

const MIN_SIZE = 50;
const MAX_SIZE = 150;

export function useHeadingDrag(opts: {
  editMode: boolean;
  desktopMode: boolean;
  getSize: () => number;
  onSizeChange: (size: number, isDesktop: boolean) => void;
  arrowClassPrefix: string;
}) {
  const { editMode, desktopMode, getSize, onSizeChange, arrowClassPrefix } = opts;
  const dragRef = useRef<DragData | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localSize, setLocalSize] = useState<number | null>(null);
  const localSizeRef = useRef<number | null>(null);
  const [dragToast, setDragToast] = useState<DragToastSegment[] | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => document.removeEventListener("touchmove", handleTouchMove);
  }, []);

  const effectiveSize = localSize ?? getSize();

  const handleDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
    if (!editMode || (!isTouchLike && e.button !== 0)) return;
    const element = e.currentTarget as HTMLElement;
    dragRef.current = {
      timer: setTimeout(() => {
        const d = dragRef.current;
        if (!d) return;
        d.timer = null;
        d.triggered = true;
        isDraggingRef.current = true;
        setDragging(true);
        try { d.element?.setPointerCapture(d.pointerId); } catch {}
      }, 350),
      triggered: false,
      pointerId: e.pointerId,
      element,
      startX: e.clientX,
      startY: e.clientY,
      startSize: getSize(),
    };
  }, [editMode, getSize]);

  const handleMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.triggered) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 10) {
        if (d.timer) clearTimeout(d.timer);
        dragRef.current = null;
      }
      return;
    }
    e.preventDefault();
    const deltaY = e.clientY - d.startY;
    const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, d.startSize - deltaY * 0.5));
    const rounded = Math.round(newSize);
    localSizeRef.current = rounded;
    setLocalSize(rounded);
    setDragToast([
      { label: "Size", value: Math.round(newSize), atLimit: newSize <= MIN_SIZE || newSize >= MAX_SIZE },
    ]);
  }, []);

  const handleUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    try { d.element?.releasePointerCapture(d.pointerId); } catch {}
    isDraggingRef.current = false;
    setDragging(false);
    setDragToast(null);
    if (localSizeRef.current != null) onSizeChange(localSizeRef.current, desktopMode);
    localSizeRef.current = null;
    setLocalSize(null);
    setTimeout(() => { dragRef.current = null; }, 100);
  }, [desktopMode, onSizeChange]);

  const handleCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    dragRef.current = null;
    isDraggingRef.current = false;
    setDragging(false);
    localSizeRef.current = null;
    setLocalSize(null);
    setDragToast(null);
  }, []);

  const renderArrowOverlay = () => (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      {effectiveSize < MAX_SIZE && (
        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 ${arrowClassPrefix}-arrow-up`} style={{ color: "white", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z" /></svg>
        </div>
      )}
      {effectiveSize > MIN_SIZE && (
        <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 ${arrowClassPrefix}-arrow-down`} style={{ color: "white", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z" /></svg>
        </div>
      )}
    </div>
  );

  const renderDragToast = () => {
    if (!dragToast) return null;
    return createPortal(
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-lg bg-black/80 text-white text-sm font-medium pointer-events-none backdrop-blur-sm shadow-lg whitespace-nowrap" style={{ fontFamily: "Inter, sans-serif" }}>
        {dragToast.map((seg, i) => (
          <span key={i}>
            {i > 0 && "  |  "}
            <span style={{ color: seg.atLimit ? "#ef4444" : "white", transition: "color 0.15s" }}>{seg.label}: {seg.value}%</span>
          </span>
        ))}
      </div>,
      document.body
    );
  };

  const renderArrowStyles = () => (
    <style>{`
      @keyframes ${arrowClassPrefix}-arrow-up-anim {
        0% { transform: translateX(-50%) translateY(0); opacity: 0; }
        20% { opacity: 0.85; }
        60% { opacity: 0.85; }
        100% { transform: translateX(-50%) translateY(-18px); opacity: 0; }
      }
      @keyframes ${arrowClassPrefix}-arrow-down-anim {
        0% { transform: translateX(-50%) translateY(0); opacity: 0; }
        20% { opacity: 0.85; }
        60% { opacity: 0.85; }
        100% { transform: translateX(-50%) translateY(18px); opacity: 0; }
      }
      .${arrowClassPrefix}-arrow-up { animation: ${arrowClassPrefix}-arrow-up-anim 1.2s ease-in-out infinite; }
      .${arrowClassPrefix}-arrow-down { animation: ${arrowClassPrefix}-arrow-down-anim 1.2s ease-in-out infinite; }
    `}</style>
  );

  const clickGuard = (e: React.MouseEvent) => {
    if (dragRef.current?.triggered) {
      e.stopPropagation();
      dragRef.current = null;
      return true;
    }
    return false;
  };

  const headingDragProps = editMode ? {
    onPointerDown: handleDown,
    onPointerMove: handleMove,
    onPointerUp: handleUp,
    onPointerCancel: handleCancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  } : {};

  return {
    dragging,
    effectiveSize,
    dragRef,
    headingDragProps,
    renderArrowOverlay,
    renderDragToast,
    renderArrowStyles,
    clickGuard,
  };
}
