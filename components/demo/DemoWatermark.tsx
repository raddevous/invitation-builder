"use client";

import { useEffect, useRef } from "react";

/**
 * DemoWatermark - Renders a centered 2-line watermark overlay with tamper protection.
 * Uses MutationObserver to re-inject itself if removed from the DOM.
 */
export default function DemoWatermark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = ref.current;
    if (!overlay) return;

    const parent = overlay.parentElement;
    if (!parent) return;

    // Mark with data attribute for identification
    overlay.setAttribute("data-demo-watermark", "true");

    // CSS injection to enforce visibility
    const style = document.createElement("style");
    style.setAttribute("data-demo-watermark-style", "true");
    style.textContent = `
      [data-demo-watermark] {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // MutationObserver to re-inject if removed
    const observer = new MutationObserver(() => {
      if (!parent.contains(overlay)) {
        parent.appendChild(overlay);
      }
      // Re-apply inline styles if tampered
      overlay.style.position = "absolute";
      overlay.style.top = "50%";
      overlay.style.left = "50%";
      overlay.style.zIndex = "9999";
      overlay.style.pointerEvents = "none";
    });

    observer.observe(parent, { childList: true, subtree: false });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also observe attribute changes on the overlay itself
    const attrObserver = new MutationObserver(() => {
      overlay.style.position = "absolute";
      overlay.style.top = "50%";
      overlay.style.left = "50%";
      overlay.style.transform = "translate(-50%, -50%)";
      overlay.style.zIndex = "9999";
      overlay.style.pointerEvents = "none";
      overlay.style.display = "block";
      overlay.style.opacity = "1";
      overlay.style.visibility = "visible";
      overlay.style.mixBlendMode = "difference";
    });

    attrObserver.observe(overlay, {
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });

    return () => {
      observer.disconnect();
      attrObserver.disconnect();
      style.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-demo-watermark
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        pointerEvents: "none",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: "24px",
        fontWeight: 700,
        letterSpacing: "0.15em",
        lineHeight: 1.8,
        color: "rgba(255, 255, 255, 0.15)",
        mixBlendMode: "difference",
        userSelect: "none",
      }}
    >
      <div>INSTAVOW.COM</div>
      <div>DEMO INSTAVOW</div>
    </div>
  );
}
