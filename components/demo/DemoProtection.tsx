"use client";

import { useEffect, useRef, useState } from "react";

/**
 * DemoProtection - Renders a repeating diagonal watermark overlay and applies
 * anti-screenshot + tamper protection measures to prevent unauthorized use of
 * demo invitation pages.
 *
 * Protections:
 * 1. Repeating diagonal "DEMO" watermark across entire viewport
 * 2. Anti-screenshot: PrintScreen detection, blur on visibility change
 * 3. Tamper protection: DevTools, context menu, drag, selection, copy/save
 * 4. MutationObserver to re-inject overlay if removed from DOM
 */

export default function DemoProtection() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);

  useEffect(() => {
    // --- Anti-screenshot: PrintScreen detection ---
    const handlePrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        setShowScreenshotOverlay(true);
        // Clear clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        setTimeout(() => setShowScreenshotOverlay(false), 2000);
      }
      // Block screenshot shortcuts (Windows Snipping Tool, Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "s" || e.key === "S" || e.key === "3" || e.key === "4" || e.key === "5")) {
        e.preventDefault();
        setShowScreenshotOverlay(true);
        setTimeout(() => setShowScreenshotOverlay(false), 2000);
      }
      // Windows snipping tool: Win + Shift + S
      if (e.shiftKey && (e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey) {
        // Can't reliably detect Windows key, but blur covers this
      }
    };

    // --- Anti-screenshot: blur on visibility change (alt-tab, minimize) ---
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowScreenshotOverlay(true);
      } else {
        setShowScreenshotOverlay(false);
      }
    };

    const handleBlur = () => {
      setShowScreenshotOverlay(true);
    };

    const handleFocus = () => {
      setShowScreenshotOverlay(false);
    };

    // --- Tamper protection ---
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();

    const preventDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.tagName === "VIDEO" || target.tagName === "A") {
        e.preventDefault();
      }
    };

    const preventKeyShortcuts = (e: KeyboardEvent) => {
      // DevTools
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "i" || e.key === "I" || e.key === "j" || e.key === "J" || e.key === "c" || e.key === "C")) {
        e.preventDefault();
        return false;
      }
      // Save, View Source, Print, Copy
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "u" || e.key === "p" || e.key === "c")) {
        e.preventDefault();
        return false;
      }
    };

    // --- MutationObserver: re-inject overlay if removed ---
    const observer = new MutationObserver((mutations) => {
      if (!overlayRef.current || !document.body.contains(overlayRef.current)) {
        // Overlay was removed - re-append it
        if (overlayRef.current) {
          document.body.appendChild(overlayRef.current);
        }
      }
      // Check if overlay styles were tampered
      if (overlayRef.current) {
        const el = overlayRef.current;
        const computed = window.getComputedStyle(el);
        if (computed.display === "none" || computed.visibility === "hidden" || computed.opacity === "0" || parseInt(computed.zIndex) < 9999) {
          el.style.setProperty("display", "block", "important");
          el.style.setProperty("visibility", "visible", "important");
          el.style.setProperty("opacity", "1", "important");
          el.style.setProperty("z-index", "99999", "important");
          el.style.setProperty("pointer-events", "none", "important");
        }
      }
    });

    if (overlayRef.current) {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden"] });
    }

    // --- Apply listeners ---
    document.addEventListener("keydown", handlePrintScreen);
    document.addEventListener("keydown", preventKeyShortcuts);
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Disable text selection on the entire page
    document.body.style.setProperty("user-select", "none", "important");
    document.body.style.setProperty("-webkit-user-select", "none", "important");
    document.body.style.setProperty("-webkit-touch-callout", "none", "important");

    return () => {
      document.removeEventListener("keydown", handlePrintScreen);
      document.removeEventListener("keydown", preventKeyShortcuts);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("dragstart", preventDrag);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      observer.disconnect();
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("-webkit-user-select");
      document.body.style.removeProperty("-webkit-touch-callout");
    };
  }, []);

  return (
    <>
      {/* Watermark overlay - repeating diagonal DEMO text */}
      <div
        ref={overlayRef}
        data-demo-overlay
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 99999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            transform: "rotate(-30deg)",
            pointerEvents: "none",
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="350" height="100" viewBox="0 0 350 100"><text x="0" y="20" font-family="Inter, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="rgba(0,0,0,0.07)">INSTAVOW DEMO</text><text x="0" y="60" font-family="Inter, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="rgba(0,0,0,0.07)">INSTAVOW.COM</text></svg>')}")`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      {/* Screenshot detection overlay */}
      {showScreenshotOverlay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            zIndex: 100000,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              color: "#F5315F",
              fontSize: "18px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}
          >
            SCREENSHOTS DISABLED IN DEMO MODE
          </p>
        </div>
      )}
    </>
  );
}
