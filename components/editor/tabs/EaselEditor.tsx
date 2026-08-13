"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { InvitationData, EaselElement, EaselData } from "@/lib/types/invitation";
import { buildInviteUrl } from "@/lib/utils";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

interface EaselEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  onImmediateSave?: (updatedData: InvitationData) => Promise<void>;
  isDarkMode?: boolean;
  accentColor?: string;
  slug: string;
  isDemoMode?: boolean;
  onClose: () => void;
}

// Print dimensions: 2ft x 3ft portrait
// 2ft = 24in, 3ft = 36in
const PRINT_WIDTH_IN = 24;
const PRINT_HEIGHT_IN = 36;

// Easel background image
const EASEL_BG = "/assets/easl/bg.jpg";

// Tarp is centered on the easel, occupying ~60% width, ~70% height
const TARP_WIDTH_PCT = 60;
const TARP_HEIGHT_PCT = 70;

const FONTS = [
  "Inter",
  "Playfair Display",
  "Cinzel",
  "Lato",
  "Montserrat",
  "Raleway",
  "Libre Baskerville",
  "Source Sans Pro",
  "Style Script",
];

function genId() {
  return `easel-el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultEaselData(slug: string): EaselData {
  const rsvpUrl = typeof window !== "undefined" ? `${buildInviteUrl(slug)}/#rsvp` : `/invite/${slug}/#rsvp`;
  return {
    backgroundColor: "#ffffff",
    elements: [
      {
        id: genId(),
        type: "text",
        text: "Find Your Seat",
        x: 50,
        y: 10,
        width: 80,
        fontFamily: "Playfair Display",
        fontSize: 48,
        color: "#1B3B5F",
        textAlign: "center",
        fontWeight: "bold",
        zIndex: 1,
      },
      {
        id: genId(),
        type: "qr",
        qrUrl: rsvpUrl,
        x: 50,
        y: 45,
        width: 25,
        height: 25,
        zIndex: 2,
      },
      {
        id: genId(),
        type: "text",
        text: "Scan to find your seat",
        x: 50,
        y: 75,
        width: 80,
        fontFamily: "Inter",
        fontSize: 18,
        color: "#666666",
        textAlign: "center",
        fontWeight: "normal",
        zIndex: 3,
      },
    ],
  };
}

export default function EaselEditor({
  data,
  onChange,
  onImmediateSave,
  isDarkMode = true,
  accentColor = "#6998EE",
  slug,
  isDemoMode = false,
  onClose,
}: EaselEditorProps) {
  const easelData: EaselData = data.easelData || defaultEaselData(slug);
  const elements = easelData.elements || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const tarpRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  // Generate QR codes for qr-type elements
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === "qr" && el.qrUrl && !qrCache[el.id]) {
        QRCode.toDataURL(el.qrUrl, { width: 512, margin: 1 })
          .then((url) => setQrCache((prev) => ({ ...prev, [el.id]: url })))
          .catch(() => {});
      }
    });
  }, [elements, qrCache]);

  const updateElements = useCallback(
    (newElements: EaselElement[]) => {
      onChange("easelData", { ...easelData, elements: newElements });
    },
    [easelData, onChange]
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<EaselElement>) => {
      updateElements(elements.map((el) => (el.id === id ? { ...el, ...patch } : el)));
    },
    [elements, updateElements]
  );

  const addElement = (type: EaselElement["type"]) => {
    const newEl: EaselElement = {
      id: genId(),
      type,
      x: 50,
      y: 50,
      width: type === "qr" ? 20 : 60,
      height: type === "qr" ? 20 : undefined,
      zIndex: elements.length + 1,
    };
    if (type === "text") {
      newEl.text = "New Text";
      newEl.fontFamily = "Inter";
      newEl.fontSize = 24;
      newEl.color = "#333333";
      newEl.textAlign = "center";
      newEl.fontWeight = "normal";
    } else if (type === "qr") {
      newEl.qrUrl = typeof window !== "undefined" ? `${buildInviteUrl(slug)}/#rsvp` : `/invite/${slug}/#rsvp`;
    }
    updateElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setShowAddMenu(false);
  };

  const deleteElement = (id: string) => {
    updateElements(elements.filter((el) => el.id !== id));
    setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl: EaselElement = {
      ...el,
      id: genId(),
      x: Math.min(el.x + 5, 95),
      y: Math.min(el.y + 5, 95),
      zIndex: elements.length + 1,
    };
    updateElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  // Drag handling
  const handlePointerDown = (e: React.PointerEvent, el: EaselElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setDraggingId(el.id);
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, elX: el.x, elY: el.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragStartRef.current || !tarpRef.current) return;
    const rect = tarpRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
    let newX = dragStartRef.current.elX + dxPct;
    let newY = dragStartRef.current.elY + dyPct;
    // Clamp to 0-100
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    updateElement(draggingId, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      dragStartRef.current = null;
      // Save on drag end
      if (onImmediateSave) {
        onImmediateSave({ ...data, easelData });
      }
    }
  };

  const selected = elements.find((el) => el.id === selectedId);

  // Export to PDF — tarp only at 2ft x 3ft
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Create PDF at 2ft x 3ft (in points: 1in = 72pt)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [PRINT_WIDTH_IN * 72, PRINT_HEIGHT_IN * 72],
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // White background (tarp)
      pdf.setFillColor(easelData.backgroundColor || "#ffffff");
      pdf.rect(0, 0, pdfW, pdfH, "F");

      // Sort elements by zIndex
      const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      for (const el of sorted) {
        const elX = (el.x / 100) * pdfW;
        const elY = (el.y / 100) * pdfH;

        if (el.type === "text") {
          const fontSizePt = el.fontSize || 24;
          pdf.setFont(el.fontFamily || "Inter", el.fontWeight === "bold" ? "bold" : "normal");
          pdf.setFontSize(fontSizePt);
          pdf.setTextColor(el.color || "#333333");

          const maxWidth = ((el.width || 60) / 100) * pdfW;
          const lines = pdf.splitTextToSize(el.text || "", maxWidth);
          const align = el.textAlign || "center";
          let textX = elX;
          if (align === "center") {
            pdf.text(lines, elX, elY + fontSizePt, { align: "center" });
          } else if (align === "right") {
            pdf.text(lines, elX, elY + fontSizePt, { align: "right" });
          } else {
            pdf.text(lines, elX, elY + fontSizePt);
          }
        } else if (el.type === "qr") {
          const qrUrl = qrCache[el.id];
          if (qrUrl) {
            const qrSize = ((el.width || 20) / 100) * pdfW;
            pdf.addImage(qrUrl, "PNG", elX - qrSize / 2, elY - qrSize / 2, qrSize, qrSize);
          }
        } else if (el.type === "image" && el.imageUrl) {
          const imgW = ((el.width || 30) / 100) * pdfW;
          const imgH = ((el.height || 30) / 100) * pdfH;
          try {
            pdf.addImage(el.imageUrl, "JPEG", elX - imgW / 2, elY - imgH / 2, imgW, imgH);
          } catch {
            // skip invalid images
          }
        }
      }

      pdf.save(`easel-find-your-seat-${slug}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    if (onImmediateSave) {
      await onImmediateSave({ ...data, easelData });
    }
  };

  return (
    <div className={`w-full ${isDemoMode ? "h-full" : "h-dvh"} flex flex-col overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
            Find Your Seat Easel
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
            Design your reception easel display — print-ready at 2ft × 3ft
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: accentColor, color: "white" }}
        >
          Save
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: accentColor, color: "white" }}
        >
          {exporting ? "Exporting..." : "Download PDF"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area — easel background with tarp overlay */}
        <div
          className="flex-1 relative overflow-hidden flex items-center justify-center p-4"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={() => setSelectedId(null)}
        >
          <div className="relative h-full flex items-center justify-center">
            {/* Easel background */}
            <img
              src={EASEL_BG}
              alt="Easel"
              className="max-h-full max-w-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            {/* Tarp container — centered on easel */}
            <div
              ref={tarpRef}
              className="absolute"
              style={{
                width: `${TARP_WIDTH_PCT}%`,
                height: `${TARP_HEIGHT_PCT}%`,
                backgroundColor: easelData.backgroundColor || "#ffffff",
                cursor: "default",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Elements */}
              {[...elements]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((el) => (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    className={`absolute cursor-move ${selectedId === el.id ? "ring-2 ring-blue-500" : ""}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: "translate(-50%, -50%)",
                      width: el.width ? `${el.width}%` : "auto",
                      height: el.height ? `${el.height}%` : "auto",
                      zIndex: el.zIndex || 0,
                      touchAction: "none",
                    }}
                  >
                    {el.type === "text" && (
                      <div
                        style={{
                          fontFamily: el.fontFamily || "Inter",
                          fontSize: `clamp(8px, ${(el.fontSize || 24) / 8}cqw, ${(el.fontSize || 24) * 2}px)`,
                          color: el.color || "#333333",
                          textAlign: el.textAlign || "center",
                          fontWeight: el.fontWeight || "normal",
                          width: "100%",
                          wordBreak: "break-word",
                          lineHeight: 1.2,
                        }}
                      >
                        {el.text || ""}
                      </div>
                    )}
                    {el.type === "qr" && (
                      <div style={{ width: "100%", height: "100%" }}>
                        {qrCache[el.id] ? (
                          <img src={qrCache[el.id]} alt="QR" className="w-full h-full object-contain" draggable={false} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">
                            Loading QR...
                          </div>
                        )}
                      </div>
                    )}
                    {el.type === "image" && (
                      <div style={{ width: "100%", height: "100%" }}>
                        {el.imageUrl ? (
                          <img src={el.imageUrl} alt="" className="w-full h-full object-contain" draggable={false} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">
                            No image
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Add button */}
          <div className="absolute bottom-4 left-4">
            {showAddMenu ? (
              <div className={`flex flex-col gap-2 p-2 rounded-xl shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <button
                  onClick={() => addElement("text")}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Text
                </button>
                <button
                  onClick={() => addElement("qr")}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + RSVP QR Code
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const newEl: EaselElement = {
                          id: genId(),
                          type: "image",
                          x: 50,
                          y: 50,
                          width: 30,
                          height: 30,
                          imageUrl: reader.result as string,
                          zIndex: elements.length + 1,
                        };
                        updateElements([...elements, newEl]);
                        setSelectedId(newEl.id);
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                    setShowAddMenu(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Image
                </button>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddMenu(true);
                }}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: accentColor }}
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Properties panel */}
        {selected && (
          <div
            className={`w-72 shrink-0 overflow-y-auto p-4 space-y-4 border-l ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            style={{ fontFamily: "Inter, sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                {selected.type === "text" ? "Text Element" : selected.type === "qr" ? "QR Code" : "Image"}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => duplicateElement(selected.id)}
                  className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                  title="Duplicate"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteElement(selected.id)}
                  className="p-1.5 rounded text-red-500 hover:bg-red-500/10"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>X (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(selected.x)}
                  onChange={(e) => updateElement(selected.id, { x: Number(e.target.value) })}
                  className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Y (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(selected.y)}
                  onChange={(e) => updateElement(selected.id, { y: Number(e.target.value) })}
                  className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                />
              </label>
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Width (%)</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={Math.round(selected.width || 0)}
                  onChange={(e) => updateElement(selected.id, { width: Number(e.target.value) })}
                  className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                />
              </label>
              {(selected.type === "qr" || selected.type === "image") && (
                <label className="flex flex-col gap-1">
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Height (%)</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={Math.round(selected.height || 0)}
                    onChange={(e) => updateElement(selected.id, { height: Number(e.target.value) })}
                    className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                  />
                </label>
              )}
            </div>

            {/* Text-specific properties */}
            {selected.type === "text" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Text</span>
                  <textarea
                    value={selected.text || ""}
                    onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                    rows={3}
                    className={`px-2 py-1 rounded text-sm resize-none ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Font</span>
                  <select
                    value={selected.fontFamily || "Inter"}
                    onChange={(e) => updateElement(selected.id, { fontFamily: e.target.value })}
                    className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Size (pt)</span>
                    <input
                      type="number"
                      min={6}
                      max={200}
                      step={1}
                      value={selected.fontSize || 24}
                      onChange={(e) => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                      className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Weight</span>
                    <select
                      value={selected.fontWeight || "normal"}
                      onChange={(e) => updateElement(selected.id, { fontWeight: e.target.value })}
                      className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Color</span>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selected.color || "#333333"}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selected.color || "#333333"}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className={`flex-1 px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1">
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Alignment</span>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => updateElement(selected.id, { textAlign: a })}
                        className={`flex-1 py-1 rounded text-xs ${selected.textAlign === a ? "text-white" : isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"}`}
                        style={selected.textAlign === a ? { backgroundColor: accentColor } : {}}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </label>
              </>
            )}

            {/* QR-specific properties */}
            {selected.type === "qr" && (
              <label className="flex flex-col gap-1">
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>QR Link URL</span>
                <input
                  type="text"
                  value={selected.qrUrl || ""}
                  onChange={(e) => {
                    updateElement(selected.id, { qrUrl: e.target.value });
                    // Clear cache so it regenerates
                    setQrCache((prev) => {
                      const next = { ...prev };
                      delete next[selected.id];
                      return next;
                    });
                  }}
                  className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                />
              </label>
            )}

            {/* Image-specific properties */}
            {selected.type === "image" && (
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => updateElement(selected.id, { imageUrl: reader.result as string });
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
                className={`w-full py-2 rounded-lg text-sm ${isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}
              >
                Replace Image
              </button>
            )}

            {/* Z-index */}
            <label className="flex flex-col gap-1">
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Layer Order</span>
              <input
                type="number"
                min={0}
                step={1}
                value={selected.zIndex || 0}
                onChange={(e) => updateElement(selected.id, { zIndex: Number(e.target.value) })}
                className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
