"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { InvitationData, EaselElement, EaselData } from "@/lib/types/invitation";
import { buildInviteUrl } from "@/lib/utils";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import HybridFontControl from "@/components/shared/HybridFontControl";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";

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

// Available easel decorative images
const EASEL_IMAGES = [
  { name: "Image 1", url: "/assets/easl/img/img01.png" },
];

// Date structures (same as hero section)
const DATE_STRUCTURES = [
  { id: "default" as const, name: "Default" },
  { id: "alternative" as const, name: "Alternative" },
  { id: "icon" as const, name: "Icon" },
  { id: "elegant" as const, name: "Elegant" },
  { id: "modern" as const, name: "Modern" },
  { id: "huge" as const, name: "Huge" },
];

// Parse date into components for structured rendering
function parseDateComponents(dateStr: string) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const suffix = (n: number) => {
      const last = n % 10;
      if (n % 100 >= 11 && n % 100 <= 13) return "th";
      if (last === 1) return "st";
      if (last === 2) return "nd";
      if (last === 3) return "rd";
      return "th";
    };
    return {
      month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      monthFull: date.toLocaleString("en-US", { month: "long" }),
      day: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      dayFull: date.toLocaleString("en-US", { weekday: "long" }),
      date: date.getDate(),
      year: date.getFullYear(),
      suffix: suffix(date.getDate()),
    };
  } catch {
    return null;
  }
}

// Render date text based on structure (for PDF export)
function renderDateText(dateStr: string, structure: string, time?: string): string {
  const dc = parseDateComponents(dateStr);
  if (!dc) return dateStr;
  const t = time || "";
  const suffix = (n: number) => {
    const last = n % 10;
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    if (last === 1) return "st";
    if (last === 2) return "nd";
    if (last === 3) return "rd";
    return "th";
  };
  switch (structure) {
    case "default":
      return `${dc.month}\n${dc.day}  |  ${dc.date}  |  ${dc.year}`;
    case "alternative":
      return `On the ${dc.date}${suffix(dc.date)} of ${dc.monthFull} ${dc.year}\n${dc.dayFull} @ ${t || "4:00 PM"}`;
    case "icon":
      return `${dc.date}${suffix(dc.date)} of ${dc.monthFull} ${dc.year}\n${dc.dayFull} @ ${t || "4:00 PM"}`;
    case "elegant":
      return `${dc.month}  |  ${String(dc.date).padStart(2, "0")}  |  ${dc.year}`;
    case "modern":
      return `${dc.dayFull}  ${t ? t.split(" ")[0] : "2:00"}  |  ${dc.date}  |  ${dc.monthFull}  ${dc.year}`;
    case "huge":
      return `${dc.month}\n${dc.day}  |  ${dc.date}  |  ${t || "4:00 PM"}\n${dc.year}`;
    default:
      return `${dc.monthFull} ${dc.date}, ${dc.year}`;
  }
}

// Visual celebrant name renderer with ampersand styling
function CelebrantNameRenderer({ nameType, hisName, herName, coupleName, andText, fontFamily, color, fontWeight, ampersandTypography, ampersandPosition, ampersandOpacity, reverseNames }: {
  nameType: "couple" | "event";
  hisName: string;
  herName: string;
  coupleName: string;
  andText: string;
  fontFamily: string;
  color: string;
  fontWeight: string;
  ampersandTypography: string;
  ampersandPosition: "default" | "first-line" | "middle-line" | "second-line";
  ampersandOpacity: number;
  reverseNames: boolean;
}) {
  if (nameType !== "couple") {
    return <div style={{ fontFamily, color, fontWeight, textAlign: "center" }}>{coupleName || "Celebrant Name"}</div>;
  }
  const name1 = reverseNames ? (herName || "") : (hisName || "");
  const name2 = reverseNames ? (hisName || "") : (herName || "");
  const amp = andText || "&";
  const ampOpacity = Math.max(0, Math.min(1, ampersandOpacity / 100));
  const ampStyle: React.CSSProperties = {
    display: "inline-block",
    opacity: ampOpacity,
    fontFamily: ampersandTypography || fontFamily,
  };

  if (ampersandPosition === "first-line") {
    return (
      <div style={{ fontFamily, color, fontWeight, textAlign: "center", lineHeight: 1.2 }}>
        {name1} <span style={ampStyle}>{amp}</span>
        <br />
        {name2}
      </div>
    );
  }
  if (ampersandPosition === "middle-line") {
    return (
      <div style={{ fontFamily, color, fontWeight, textAlign: "center", lineHeight: 1.2 }}>
        {name1}
        <br />
        <span style={ampStyle}>{amp}</span>
        <br />
        {name2}
      </div>
    );
  }
  if (ampersandPosition === "second-line") {
    return (
      <div style={{ fontFamily, color, fontWeight, textAlign: "center", lineHeight: 1.2 }}>
        {name1}
        <br />
        <span style={ampStyle}>{amp}</span> {name2}
      </div>
    );
  }
  return (
    <div style={{ fontFamily, color, fontWeight, textAlign: "center", lineHeight: 1.2 }}>
      {name1} <span style={ampStyle}>{amp}</span> {name2}
    </div>
  );
}

// Visual date structure renderer component (for canvas)
function DateStructureRenderer({ dateStr, structure, time, color, fontFamily }: {
  dateStr: string;
  structure: string;
  time?: string;
  color: string;
  fontFamily: string;
}) {
  const dc = parseDateComponents(dateStr);
  if (!dc) return <div>{dateStr}</div>;
  const fontFam = fontFamily || "Inter";
  const suffix = (n: number) => {
    const last = n % 10;
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    if (last === 1) return "st";
    if (last === 2) return "nd";
    if (last === 3) return "rd";
    return "th";
  };

  if (structure === "default") {
    return (
      <div className="flex flex-col items-center gap-1" style={{ color, fontFamily: fontFam, width: "100%" }}>
        <div className="text-[0.7em] tracking-[0.2em] uppercase font-bold text-center">{dc.month}</div>
        <div className="flex items-center gap-0 w-full">
          <div className="flex items-center justify-end shrink-0" style={{ width: "25%" }}>
            <div className="flex-1 h-[1px] bg-current opacity-50" />
            <div className="text-[0.5em] whitespace-nowrap tracking-[0.2em] uppercase text-right">{dc.day}</div>
          </div>
          <div className="shrink-0 w-2 h-[1px] bg-current opacity-50" />
          <div className="flex-1 text-center text-[1.2em] font-bold">{dc.date}</div>
          <div className="shrink-0 w-2 h-[1px] bg-current opacity-50" />
          <div className="flex items-center justify-start shrink-0" style={{ width: "25%" }}>
            <div className="text-[0.5em] whitespace-nowrap tracking-[0.2em] uppercase text-left">{time || "4:00 PM"}</div>
            <div className="flex-1 h-[1px] bg-current opacity-50" />
          </div>
        </div>
        <div className="text-[0.7em] tracking-[0.2em] uppercase font-bold text-center">{dc.year}</div>
      </div>
    );
  }

  if (structure === "alternative") {
    return (
      <div className="flex flex-col items-center gap-1 text-center" style={{ color, fontFamily: fontFam, width: "100%" }}>
        <div className="text-[0.8em] tracking-[0.1em]">On the {dc.date}{suffix(dc.date)} of {dc.monthFull} {dc.year}</div>
        <div className="text-[0.6em] tracking-[0.1em]">{dc.dayFull} @ {time || "4:00 PM"}</div>
      </div>
    );
  }

  if (structure === "icon") {
    return (
      <div className="flex flex-col items-center gap-1 text-center" style={{ color, fontFamily: fontFam, width: "100%" }}>
        <div className="w-4 h-4" style={{ backgroundColor: color, WebkitMaskImage: "url(/assets/date.svg)", WebkitMaskSize: "contain", WebkitMaskPosition: "center", WebkitMaskRepeat: "no-repeat", maskImage: "url(/assets/date.svg)", maskSize: "contain", maskPosition: "center", maskRepeat: "no-repeat" }} />
        <div className="text-[0.8em] tracking-[0.1em]">The {dc.date}{suffix(dc.date)} of {dc.monthFull} {dc.year}</div>
        <div className="text-[0.6em] tracking-[0.1em]">{dc.dayFull} @ {time || "4:00 PM"}</div>
      </div>
    );
  }

  if (structure === "elegant") {
    return (
      <div className="flex items-center gap-0 text-center whitespace-nowrap" style={{ color, fontFamily: fontFam, width: "auto" }}>
        <div className="text-right pr-2 text-[0.7em] tracking-[0.2em] uppercase font-light">{dc.month}</div>
        <div className="text-[0.5em] font-light">|</div>
        <div className="text-center px-2 text-[1.5em] font-light tracking-[0.1em]">{String(dc.date).padStart(2, "0")}</div>
        <div className="text-[0.5em] font-light">|</div>
        <div className="text-left pl-2 text-[0.7em] tracking-[0.2em] uppercase font-light">{dc.year}</div>
      </div>
    );
  }

  if (structure === "modern") {
    return (
      <div className="flex items-center gap-0 text-center whitespace-nowrap" style={{ color, fontFamily: fontFam, width: "auto" }}>
        <div className="text-right pr-2 flex flex-col items-end gap-0">
          <div className="text-[0.5em] tracking-[0.2em] uppercase font-light">{dc.dayFull}</div>
          <div className="text-[0.5em] tracking-[0.2em] uppercase font-light">{time ? time.split(" ")[0] : "2:00"}</div>
        </div>
        <div className="text-[0.8em] font-light opacity-50">|</div>
        <div className="text-center px-2 text-[1.5em] font-bold tracking-[0.1em]">{dc.date}</div>
        <div className="text-[0.8em] font-light opacity-50">|</div>
        <div className="text-left pl-2 flex flex-col items-start gap-0">
          <div className="text-[0.5em] tracking-[0.2em] uppercase font-light">{dc.monthFull}</div>
          <div className="text-[0.5em] tracking-[0.2em] uppercase font-light">{dc.year}</div>
        </div>
      </div>
    );
  }

  if (structure === "huge") {
    return (
      <div className="flex flex-col items-center gap-2" style={{ color, fontFamily: fontFam, width: "100%" }}>
        <div className="text-[0.7em] tracking-[0.2em] uppercase font-bold text-center">{dc.month}</div>
        <div className="flex items-center gap-0 w-full">
          <div className="flex items-center justify-end shrink-0" style={{ width: "25%" }}>
            <div className="flex-1 h-[1px] bg-current opacity-50" />
            <div className="text-[0.5em] tracking-[0.2em] uppercase text-right">{dc.day}</div>
          </div>
          <div className="shrink-0 w-2 h-[1px] bg-current opacity-50" />
          <div className="flex-1 text-center text-[2.5em] tracking-[0.1em]">{dc.date}</div>
          <div className="shrink-0 w-2 h-[1px] bg-current opacity-50" />
          <div className="flex items-center justify-start shrink-0" style={{ width: "25%" }}>
            <div className="text-[0.5em] tracking-[0.2em] uppercase text-left">{time || "4:00 PM"}</div>
            <div className="flex-1 h-[1px] bg-current opacity-50" />
          </div>
        </div>
        <div className="text-[0.7em] tracking-[0.2em] uppercase font-bold text-center">{dc.year}</div>
      </div>
    );
  }

  return <div style={{ color, fontFamily: fontFam }}>{dc.monthFull} {dc.date}, {dc.year}</div>;
}

// Tarp is centered on the easel, maintaining 2:3 aspect ratio (2ft x 3ft)
const TARP_WIDTH_PCT = 21.4;
const TARP_HEIGHT_PCT = TARP_WIDTH_PCT * 3 / 2; // 32.1cqh

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

// Get natural dimensions of an image URL
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
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
  const defaultEasel = useMemo(() => defaultEaselData(slug), [slug]);
  const easelData: EaselData = data.easelData || defaultEasel;
  const elements = easelData.elements || [];
  const { options: predefinedHeadingFonts } = usePredefinedOptions("heading_fonts");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(100); // temporary edit zoom (100-200)
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerMode, setImagePickerMode] = useState<"images" | "background">("images");
  const [showGrid, setShowGrid] = useState(false); // temporary grid overlay, no save

  const tarpRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
  const pinchRef = useRef<{ initialDist: number; initialZoom: number } | null>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Generate QR codes for qr-type elements
  useEffect(() => {
    const qrElements = elements.filter((el) => el.type === "qr" && el.qrUrl);
    qrElements.forEach((el) => {
      if (!qrCache[el.id]) {
        QRCode.toDataURL(el.qrUrl!, {
          width: 512,
          margin: 1,
          color: {
            dark: el.color || "#000000",
            light: "#00000000",
          },
        })
          .then((url) => setQrCache((prev) => ({ ...prev, [el.id]: url })))
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

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

  // Generate default text for special element types based on invitation data
  const getDefaultText = (type: EaselElement["type"], el?: Partial<EaselElement>): string => {
    if (type === "celebrant-name") {
      if (data.nameType === "couple") {
        const reverse = el?.reverseNames ?? data.heroIconName2First ?? false;
        const name1 = reverse ? (data.herName || "") : (data.hisName || "");
        const name2 = reverse ? (data.hisName || "") : (data.herName || "");
        const andText = data.andText || "&";
        const pos = el?.ampersandPosition ?? data.heroAmpersandPosition ?? "default";
        switch (pos) {
          case "first-line":
            return `${name1} ${andText}\n${name2}`.trim();
          case "middle-line":
            return `${name1}\n${andText}\n${name2}`.trim();
          case "second-line":
            return `${name1}\n${andText} ${name2}`.trim();
          default:
            return `${name1} ${andText} ${name2}`.trim();
        }
      }
      return data.coupleName || "Celebrant Name";
    }
    if (type === "date") {
      return data.date || "Date";
    }
    if (type === "location") {
      const parts = [data.venueName, data.venueAddress].filter(Boolean);
      return parts.join(", ") || "Location";
    }
    return "";
  };

  // Element types that should be unique (only one instance allowed)
  const UNIQUE_TYPES: EaselElement["type"][] = ["celebrant-name", "date", "location", "qr", "background"];

  const addElement = (type: EaselElement["type"]) => {
    // If this type should be unique and one already exists, select it instead
    if (UNIQUE_TYPES.includes(type)) {
      const existing = elements.find((el) => el.type === type);
      if (existing) {
        setSelectedId(existing.id);
        setShowAddMenu(false);
        return;
      }
    }
    const newEl: EaselElement = {
      id: genId(),
      type,
      x: 50,
      y: 50,
      width: type === "qr" ? 20 : 60,
      height: type === "qr" ? 20 : undefined,
      zIndex: type === "background" ? 0 : Math.max(1, elements.length + 1),
    };
    if (type === "text") {
      newEl.text = "New Text";
      newEl.fontFamily = "Inter";
      newEl.fontSize = 24;
      newEl.color = "#333333";
      newEl.textAlign = "center";
      newEl.fontWeight = "normal";
      newEl.scale = 100;
    } else if (type === "qr") {
      newEl.qrUrl = typeof window !== "undefined" ? `${buildInviteUrl(slug)}/#rsvp` : `/invite/${slug}/#rsvp`;
      newEl.color = "#000000";
      newEl.scale = 100;
    } else if (type === "celebrant-name" || type === "date" || type === "location") {
      const isName = type === "celebrant-name";
      const isDate = type === "date";
      newEl.fontFamily = isName ? (data.headingFont || "Playfair Display") : (data.bodyFont || "Inter");
      newEl.fontSize = isName ? 36 : 20;
      newEl.color = isName ? (data.mainColor1 || "#1B3B5F") : "#333333";
      newEl.textAlign = "center";
      newEl.fontWeight = isName ? "bold" : "normal";
      newEl.scale = 100;
      if (isName) {
        // Pull ampersand settings from hero section data
        newEl.ampersandTypography = data.heroAmpersandTypography || data.headingFont || "Playfair Display";
        newEl.ampersandPosition = data.heroAmpersandPosition || "default";
        newEl.ampersandOpacity = data.heroAmpersandOpacity ?? 100;
        newEl.reverseNames = data.heroIconName2First ?? false;
      }
      if (isDate) {
        const structure = data.heroDateStructure || "default";
        newEl.dateStructure = structure;
        newEl.text = renderDateText(data.date, structure, data.time);
      } else {
        newEl.text = getDefaultText(type, newEl);
      }
    }
    updateElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setShowAddMenu(false);
  };

  const deleteElement = (id: string) => {
    updateElements(elements.filter((el) => el.id !== id));
    setSelectedId(null);
  };

  // Cycle date structure for a date element
  const cycleDateStructure = (id: string, direction: 1 | -1) => {
    const el = elements.find((e) => e.id === id);
    if (!el || el.type !== "date") return;
    const currentStructure = el.dateStructure || "default";
    const currentIndex = DATE_STRUCTURES.findIndex((s) => s.id === currentStructure);
    const newIndex = (currentIndex + direction + DATE_STRUCTURES.length) % DATE_STRUCTURES.length;
    const newStructure = DATE_STRUCTURES[newIndex].id;
    updateElement(id, {
      dateStructure: newStructure,
      text: renderDateText(data.date, newStructure, data.time),
    });
  };

  // Update celebrant name element when ampersand settings change
  const updateCelebrantName = (id: string, patch: Partial<EaselElement>) => {
    const el = elements.find((e) => e.id === id);
    if (!el || el.type !== "celebrant-name") return;
    const merged = { ...el, ...patch };
    updateElement(id, {
      ...patch,
      text: getDefaultText("celebrant-name", merged),
    });
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl: EaselElement = {
      ...el,
      id: genId(),
      x: Math.min(el.x + 5, 95),
      y: Math.min(el.y + 5, 95),
      zIndex: el.type === "background" ? 0 : Math.max(1, elements.length + 1),
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
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragStartRef.current || !tarpRef.current) return;
    const rect = tarpRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
    // For background elements, invert drag (objectPosition moves opposite to drag direction)
    const draggedEl = elements.find((el) => el.id === draggingId);
    const isBackground = draggedEl?.type === "background";
    const sign = isBackground ? -1 : 1;
    let newX = dragStartRef.current.elX + sign * dxPct;
    let newY = dragStartRef.current.elY + sign * dyPct;
    // Clamp to 0-100
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    // Snapping: snap anchor points to center grid lines (50%)
    // Anchor points are at center of each edge of the element.
    // Element is positioned at (x, y) with translate(-50%, -50%), so:
    //   left edge   = x - halfWidthPct
    //   right edge  = x + halfWidthPct
    //   top edge    = y - halfHeightPct
    //   bottom edge = y + halfHeightPct
    //   center      = (x, y)
    if (!isBackground && draggedEl && rect.width > 0 && rect.height > 0) {
      // Compute element's width/height as % of tarp
      const elWidthPct = draggedEl.type === "image"
        ? (draggedEl.width || 30) * ((draggedEl.scale || 100) / 100)
        : draggedEl.type === "qr"
          ? (draggedEl.width || 20) * ((draggedEl.scale || 100) / 100)
          : draggedEl.type === "text"
            ? (draggedEl.width || 60)
            : 0; // auto-width elements (celebrant-name, date, location) — use measured size
      const elHeightPct = 0; // height is auto, can't compute from data — use 0 (no vertical snap for edges)

      // For auto-width elements, measure the actual element size
      let measuredHalfWPct = 0;
      let measuredHalfHPct = 0;
      const elNode = tarpRef.current.querySelector(`[data-el-id="${draggingId}"]`) as HTMLElement;
      if (elNode) {
        measuredHalfWPct = (elNode.offsetWidth / 2 / rect.width) * 100;
        measuredHalfHPct = (elNode.offsetHeight / 2 / rect.height) * 100;
      }

      const halfWPct = elWidthPct > 0 ? elWidthPct / 2 : measuredHalfWPct;
      const halfHPct = measuredHalfHPct;

      const SNAP_THRESHOLD = 2; // % within which snapping activates
      const CENTER = 50;

      // Check horizontal snapping (x axis)
      // Left anchor snapping to center: x - halfW = 50 => x = 50 + halfW
      if (Math.abs((newX - halfWPct) - CENTER) < SNAP_THRESHOLD) {
        newX = CENTER + halfWPct;
      }
      // Right anchor snapping to center: x + halfW = 50 => x = 50 - halfW
      else if (Math.abs((newX + halfWPct) - CENTER) < SNAP_THRESHOLD) {
        newX = CENTER - halfWPct;
      }
      // Center snapping to center: x = 50
      else if (Math.abs(newX - CENTER) < SNAP_THRESHOLD) {
        newX = CENTER;
      }

      // Check vertical snapping (y axis)
      // Top anchor snapping to center: y - halfH = 50 => y = 50 + halfH
      if (Math.abs((newY - halfHPct) - CENTER) < SNAP_THRESHOLD) {
        newY = CENTER + halfHPct;
      }
      // Bottom anchor snapping to center: y + halfH = 50 => y = 50 - halfH
      else if (Math.abs((newY + halfHPct) - CENTER) < SNAP_THRESHOLD) {
        newY = CENTER - halfHPct;
      }
      // Center snapping to center: y = 50
      else if (Math.abs(newY - CENTER) < SNAP_THRESHOLD) {
        newY = CENTER;
      }
    }

    updateElement(draggingId, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      dragStartRef.current = null;
    }
  };

  // Pinch-to-zoom (2 fingers)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchRef.current = { initialDist: dist, initialZoom: zoom };
      // Cancel any ongoing drag when pinching
      setDraggingId(null);
      dragStartRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchRef.current.initialDist;
      const newZoom = Math.max(100, Math.min(200, Math.round(pinchRef.current.initialZoom * scale)));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
  };

  const selected = elements.find((el) => el.id === selectedId);
  const dateComponents = parseDateComponents(data.date);

  // Build a clone of the tarp with cqh/cqw converted to %/vw
  // Used by both print (PDF) and JPEG export
  const buildTarpClone = () => {
    const tarp = tarpRef.current;
    if (!tarp) return null;

    // Hide selection ring
    const selectedEls = tarp.querySelectorAll(".ring-2");
    selectedEls.forEach((el) => {
      (el as HTMLElement).style.boxShadow = "none";
    });

    // Measure the tarp's LAYOUT size (offsetWidth/Height ignore parent transforms)
    const tarpW = tarp.offsetWidth;
    const tarpH = tarp.offsetHeight;

    // Clone the tarp
    const tarpClone = tarp.cloneNode(true) as HTMLElement;
    tarpClone.id = "easel-tarp-clone";

    // Remove ring classes and anchor points from clone
    tarpClone.querySelectorAll(".ring-2").forEach((el) => {
      el.classList.remove("ring-2", "ring-blue-500");
    });

    // Walk every element and convert cqh/cqw to % and vw
    const allEls = [tarpClone, ...Array.from(tarpClone.querySelectorAll("*"))] as HTMLElement[];
    const originalEls = [tarp, ...Array.from(tarp.querySelectorAll("*"))] as HTMLElement[];

    for (let i = 0; i < allEls.length; i++) {
      const cloneEl = allEls[i];
      const origEl = originalEls[i];
      if (!origEl) continue;

      const computed = window.getComputedStyle(origEl);
      const inlineStyle = origEl.getAttribute("style") || "";

      // Convert cqw-based font sizes to vw
      if (inlineStyle.includes("cqw") || inlineStyle.includes("clamp")) {
        const origFontSizePx = parseFloat(computed.fontSize);
        const fontVw = (origFontSizePx / tarpW) * 100;
        cloneEl.style.fontSize = `${fontVw}vw`;
      }

      // Convert cqh-based dimensions to % of tarp
      if (inlineStyle.includes("cqh")) {
        const origWPx = parseFloat(computed.width);
        const origHPx = parseFloat(computed.height);
        cloneEl.style.width = `${(origWPx / tarpW) * 100}%`;
        cloneEl.style.height = `${(origHPx / tarpH) * 100}%`;
      }
    }

    return { tarpClone, tarpW, tarpH, selectedEls };
  };

  // Export to PDF — tarp only at 2ft x 3ft
  // Uses window.print() — clones tarp to body with all cqh/cqw converted to %/vw
  const handleExportPDF = async () => {
    setExporting(true);

    const result = buildTarpClone();
    if (!result) {
      alert("Canvas not ready. Please try again.");
      setExporting(false);
      return;
    }
    const { tarpClone, selectedEls } = result;

    // Set the tarp clone to fill the entire page
    tarpClone.style.width = "100%";
    tarpClone.style.height = "100%";
    tarpClone.style.position = "absolute";
    tarpClone.style.top = "0";
    tarpClone.style.left = "0";
    tarpClone.style.transform = "none";
    tarpClone.style.transformOrigin = "top left";
    tarpClone.style.overflow = "hidden";

    // Create print container
    const printContainer = document.createElement("div");
    printContainer.id = "easel-print-container";
    printContainer.style.cssText = "display: none;";
    printContainer.appendChild(tarpClone);
    document.body.appendChild(printContainer);

    // Inject print styles
    const pageStyle = document.createElement("style");
    pageStyle.id = "easel-print-page";
    pageStyle.textContent = `
      @media print {
        @page {
          size: ${PRINT_WIDTH_IN}in ${PRINT_HEIGHT_IN}in;
          margin: 0;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        body * {
          visibility: hidden !important;
        }
        #easel-print-container {
          display: block !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          visibility: visible !important;
          z-index: 99999 !important;
        }
        #easel-tarp-clone,
        #easel-tarp-clone * {
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(pageStyle);

    // Wait a tick for the clone to settle
    await new Promise((r) => setTimeout(r, 100));

    // Trigger print dialog
    window.print();

    // Cleanup after print
    const cleanup = () => {
      document.getElementById("easel-print-container")?.remove();
      document.getElementById("easel-print-page")?.remove();
      selectedEls.forEach((el) => {
        (el as HTMLElement).style.boxShadow = "";
      });
      setExporting(false);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    setTimeout(() => {
      if (document.getElementById("easel-print-container")) {
        cleanup();
      }
    }, 5000);
  };

  // Export to JPEG — uses html2canvas on the clone (which has cqh/cqw already converted)
  const handleExportJPEG = async () => {
    setExporting(true);

    const result = buildTarpClone();
    if (!result) {
      alert("Canvas not ready. Please try again.");
      setExporting(false);
      return;
    }
    const { tarpClone, tarpW, tarpH, selectedEls } = result;

    // Target size in pixels (24in x 36in at 200dpi for high-quality print)
    const targetW = PRINT_WIDTH_IN * 200;  // 4800px
    const targetH = PRINT_HEIGHT_IN * 200; // 7200px

    // Set the clone to the exact target size
    tarpClone.style.width = `${targetW}px`;
    tarpClone.style.height = `${targetH}px`;
    tarpClone.style.position = "absolute";
    tarpClone.style.top = "0";
    tarpClone.style.left = "0";
    tarpClone.style.transform = "none";
    tarpClone.style.transformOrigin = "top left";
    tarpClone.style.overflow = "hidden";
    tarpClone.style.backgroundColor = easelData.backgroundColor || "#ffffff";

    // Create off-screen container (visible but off-screen so html2canvas can render it)
    const exportContainer = document.createElement("div");
    exportContainer.id = "easel-jpeg-container";
    exportContainer.style.cssText = `position: fixed; top: -99999px; left: -99999px; width: ${targetW}px; height: ${targetH}px; overflow: hidden; z-index: -1;`;
    exportContainer.appendChild(tarpClone);
    document.body.appendChild(exportContainer);

    // Wait for fonts and clone to settle
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await new Promise((r) => setTimeout(r, 200));

    try {
      const canvas = await html2canvas(tarpClone, {
        backgroundColor: easelData.backgroundColor || "#ffffff",
        scale: 1, // already at target size
        useCORS: true,
        logging: false,
        width: targetW,
        height: targetH,
        windowWidth: targetW,
        windowHeight: targetH,
      });

      // Convert to JPEG and download
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `easel-find-your-seat-${slug}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("JPEG export failed:", err);
      alert("Failed to export JPEG. Please try again.");
    } finally {
      // Cleanup
      document.getElementById("easel-jpeg-container")?.remove();
      selectedEls.forEach((el) => {
        (el as HTMLElement).style.boxShadow = "";
      });
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
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area — easel background with tarp overlay */}
        <div
          ref={canvasRef}
          id="easel-canvas"
          className="flex-1 relative overflow-hidden flex items-center justify-center"
          style={{ containerType: "size", touchAction: "none" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => { setSelectedId(null); setShowAddMenu(false); }}
        >
          {/* Single container matching image aspect ratio (1:1) — image + tarp scale together */}
          <div
            className="relative"
            style={{
              width: "min(100%, 100cqh)",
              height: "min(100%, 100cqh)",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: pinchRef.current ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* Easel background — fills the container, zoomed via object-cover */}
            <img
              src={EASEL_BG}
              alt="Easel"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{ objectPosition: "center 40%" }}
              draggable={false}
            />
            {/* Tarp container — centered, sized as % of the image container */}
            <div
              ref={tarpRef}
              id="easel-tarp"
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${TARP_WIDTH_PCT}cqh`,
                height: `${TARP_HEIGHT_PCT}cqh`,
                backgroundColor: easelData.backgroundColor || "#ffffff",
                cursor: "default",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grid overlay — temporary, no save */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px),
                      linear-gradient(to right, rgba(0,0,0,0.18) 1.5px, transparent 1.5px),
                      linear-gradient(to bottom, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)
                    `,
                    backgroundSize: "10% 10%, 10% 10%, 50% 50%, 50% 50%",
                  }}
                />
              )}
              {/* Elements */}
              {[...elements]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((el) => (
                  <div
                    key={el.id}
                    data-el-id={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    className={`absolute cursor-move ${selectedId === el.id ? "ring-2 ring-blue-500" : ""}`}
                    style={
                      el.type === "background"
                        ? {
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: el.zIndex || 0,
                            touchAction: "none",
                            overflow: "hidden",
                          }
                        : {
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            transform: "translate(-50%, -50%)",
                            width: el.type === "image" ? `${(el.width || 30) * ((el.scale || 100) / 100)}%` : el.type === "qr" ? `${(el.width || 20) * ((el.scale || 100) / 100)}%` : (el.type === "text" || el.type === "location") ? (el.width ? `${el.width}%` : "max-content") : "max-content",
                            height: "auto",
                            zIndex: el.zIndex || 0,
                            touchAction: "none",
                          }
                    }
                  >
                    {/* Anchor points for alignment — center of each edge */}
                    {selectedId === el.id && el.type !== "background" && (
                      <>
                        <div style={{ position: "absolute", top: -1, left: "50%", transform: "translate(-50%, -50%)", width: 8, height: 8, borderRadius: "50%", backgroundColor: accentColor, border: "1.5px solid white", pointerEvents: "none", zIndex: 99999 }} />
                        <div style={{ position: "absolute", bottom: -1, left: "50%", transform: "translate(-50%, 50%)", width: 8, height: 8, borderRadius: "50%", backgroundColor: accentColor, border: "1.5px solid white", pointerEvents: "none", zIndex: 99999 }} />
                        <div style={{ position: "absolute", left: -1, top: "50%", transform: "translate(-50%, -50%)", width: 8, height: 8, borderRadius: "50%", backgroundColor: accentColor, border: "1.5px solid white", pointerEvents: "none", zIndex: 99999 }} />
                        <div style={{ position: "absolute", right: -1, top: "50%", transform: "translate(50%, -50%)", width: 8, height: 8, borderRadius: "50%", backgroundColor: accentColor, border: "1.5px solid white", pointerEvents: "none", zIndex: 99999 }} />
                      </>
                    )}
                    {el.type === "celebrant-name" ? (
                      <div data-font-size={el.fontSize || 36} data-scale={el.scale || 100} style={{ width: "max-content", height: "auto", fontSize: `clamp(4px, ${(el.fontSize || 36) * ((el.scale || 100) / 100) / 8}cqw, ${(el.fontSize || 36) * ((el.scale || 100) / 100) * 2}px)`, lineHeight: 1.2, textAlign: "center" }}>
                        <CelebrantNameRenderer
                          nameType={data.nameType}
                          hisName={data.hisName}
                          herName={data.herName}
                          coupleName={data.coupleName}
                          andText={data.andText || "&"}
                          fontFamily={el.fontFamily || "Playfair Display"}
                          color={el.color || "#1B3B5F"}
                          fontWeight={el.fontWeight || "bold"}
                          ampersandTypography={el.ampersandTypography || el.fontFamily || "Playfair Display"}
                          ampersandPosition={el.ampersandPosition || "default"}
                          ampersandOpacity={el.ampersandOpacity ?? 100}
                          reverseNames={el.reverseNames ?? false}
                        />
                      </div>
                    ) : el.type === "date" && dateComponents ? (
                      <div data-font-size={el.fontSize || 20} data-scale={el.scale || 100} style={{ width: "max-content", height: "auto", fontSize: `clamp(4px, ${(el.fontSize || 20) * ((el.scale || 100) / 100) / 8}cqw, ${(el.fontSize || 20) * ((el.scale || 100) / 100) * 2}px)`, lineHeight: 1.3, textAlign: "center" }}>
                        <DateStructureRenderer
                          dateStr={data.date}
                          structure={el.dateStructure || "default"}
                          time={data.time}
                          color={el.color || "#333333"}
                          fontFamily={el.fontFamily || "Inter"}
                        />
                      </div>
                    ) : (el.type === "text" || el.type === "location") && (
                      <div
                        data-font-size={el.fontSize || 24}
                        data-scale={el.scale || 100}
                        style={{
                          fontFamily: el.fontFamily || "Inter",
                          fontSize: `clamp(4px, ${(el.fontSize || 24) * ((el.scale || 100) / 100) / 8}cqw, ${(el.fontSize || 24) * ((el.scale || 100) / 100) * 2}px)`,
                          color: el.color || "#333333",
                          textAlign: el.textAlign || "center",
                          fontWeight: el.fontWeight || "normal",
                          width: el.width ? "100%" : "max-content",
                          height: "auto",
                          wordBreak: el.width ? "break-word" : "normal",
                          whiteSpace: el.width ? "pre-wrap" : "nowrap",
                          lineHeight: 1.2,
                        }}
                      >
                        {el.text || ""}
                      </div>
                    )}
                    {el.type === "qr" && (
                      <div style={{ width: "100%", height: "auto" }}>
                        {qrCache[el.id] ? (
                          <img
                            src={qrCache[el.id]}
                            alt="QR"
                            className="w-full h-auto block"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">
                            Loading QR...
                          </div>
                        )}
                      </div>
                    )}
                    {el.type === "image" && (
                      <div style={{ width: "100%", height: "auto", position: "relative" }}>
                        {el.imageUrl ? (
                          <>
                            <img src={el.imageUrl} alt="" className="w-full h-auto block" draggable={false} />
                            {el.color && (
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  backgroundColor: el.color,
                                  opacity: (el.opacity ?? 100) / 100,
                                  WebkitMaskImage: `url(${el.imageUrl})`,
                                  WebkitMaskSize: "contain",
                                  WebkitMaskPosition: "center",
                                  WebkitMaskRepeat: "no-repeat",
                                  maskImage: `url(${el.imageUrl})`,
                                  maskSize: "contain",
                                  maskPosition: "center",
                                  maskRepeat: "no-repeat",
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">
                            No image
                          </div>
                        )}
                      </div>
                    )}
                    {el.type === "background" && (
                      <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", pointerEvents: "none" }}>
                        {el.imageUrl ? (
                          <img
                            src={el.imageUrl}
                            alt=""
                            draggable={false}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: `${el.x}% ${el.y}%`,
                              transform: `scale(${(el.width || 100) / 100})`,
                              transformOrigin: `${el.x}% ${el.y}%`,
                              opacity: (el.opacity ?? 100) / 100,
                              pointerEvents: "none",
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">
                            No background
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Add button */}
          <div className="absolute bottom-4 right-4" style={{ fontFamily: "Inter, sans-serif" }}>
            {showAddMenu ? (
              <div className={`flex flex-col gap-2 p-2 rounded-xl shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <button
                  onClick={() => { handleSave(); setShowAddMenu(false); }}
                  className={`px-4 py-2 rounded-lg text-sm text-left font-medium ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  Save
                </button>
                <button
                  onClick={() => { handleExportPDF(); setShowAddMenu(false); }}
                  disabled={exporting}
                  className={`px-4 py-2 rounded-lg text-sm text-left disabled:opacity-50 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  {exporting ? "Preparing..." : "Print-ready"}
                </button>
                <button
                  onClick={() => { handleExportJPEG(); setShowAddMenu(false); }}
                  disabled={exporting}
                  className={`px-4 py-2 rounded-lg text-sm text-left disabled:opacity-50 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  {exporting ? "Downloading..." : "Download as JPG"}
                </button>
                <div className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />
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
                  onClick={() => { setImagePickerMode("images"); setShowImagePicker(true); setShowAddMenu(false); }}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Images
                </button>
                <button
                  onClick={() => { setImagePickerMode("background"); setShowImagePicker(true); setShowAddMenu(false); }}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Background
                </button>
                <button
                  onClick={() => addElement("celebrant-name")}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Celebrant Name
                </button>
                <button
                  onClick={() => addElement("date")}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Date
                </button>
                <button
                  onClick={() => addElement("location")}
                  className={`px-4 py-2 rounded-lg text-sm text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
                >
                  + Location
                </button>
                <div className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />
                {/* Grid toggle */}
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>+ Grid</span>
                  <button
                    onClick={() => setShowGrid((prev) => !prev)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${showGrid ? "" : "opacity-50"}`}
                    style={{ backgroundColor: showGrid ? accentColor : (isDarkMode ? "#4B5563" : "#E5E7EB") }}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showGrid ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {/* Zoom slider */}
                <div className="px-2 py-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Zoom</span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{zoom}%</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={200}
                    step={1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(zoom - 100) / 100 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(zoom - 100) / 100 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                      borderRadius: '4px',
                      height: '8px'
                    }}
                  />
                </div>
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

      </div>

      {/* Properties panel — sliding bottom sheet (mobile) or side panel (desktop) */}
      {selected && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-transparent z-[999]"
            onClick={() => setSelectedId(null)}
          />
          {/* Sheet */}
          <div
            className={`fixed z-[1000] shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              isMobile
                ? "bottom-0 left-0 right-0 rounded-t-3xl animate-slide-up"
                : "top-0 bottom-0 right-0 border-l animate-slide-in-side-right"
            }`}
            style={isMobile ? { maxWidth: 480, margin: "0 auto", maxHeight: "25vh" } : { width: "320px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar — mobile only */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {selected.type === "text" ? "Text Element" : selected.type === "qr" ? "QR Code" : selected.type === "celebrant-name" ? "Celebrant Name" : selected.type === "date" ? "Date" : selected.type === "location" ? "Location" : selected.type === "background" ? "Background" : "Image"}
              </h3>
              <div className="flex gap-1">
                {selected.type === "text" && (
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
                )}
                <button
                  onClick={() => deleteElement(selected.id)}
                  className="p-1.5 rounded text-red-500 hover:bg-red-500/10"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                  title="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ fontFamily: "Inter, sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >

            {/* Size */}
            <div className="space-y-3">
              {/* Scale slider — for text-like and QR elements (scales as a whole) */}
              {(selected.type === "text" || selected.type === "celebrant-name" || selected.type === "date" || selected.type === "location" || selected.type === "qr") && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Size
                    </label>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {selected.scale || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={1}
                    value={selected.scale || 100}
                    onChange={(e) => updateElement(selected.id, { scale: Number(e.target.value) })}
                    className="w-full"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selected.scale || 100) - 20) / 280 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${((selected.scale || 100) - 20) / 280 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                      borderRadius: '4px',
                      height: '8px'
                    }}
                  />
                </div>
              )}
              {/* Size slider — for image (scales as a whole) */}
              {selected.type === "image" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Size
                    </label>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {selected.scale || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={1}
                    value={selected.scale || 100}
                    onChange={(e) => updateElement(selected.id, { scale: Number(e.target.value) })}
                    className="w-full"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selected.scale || 100) - 10) / 290 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${((selected.scale || 100) - 10) / 290 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                      borderRadius: '4px',
                      height: '8px'
                    }}
                  />
                </div>
              )}
              {/* Background Size slider — uses width as scale (100-300%) */}
              {selected.type === "background" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Size
                    </label>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {selected.width || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={300}
                    step={1}
                    value={selected.width || 100}
                    onChange={(e) => updateElement(selected.id, { width: Number(e.target.value) })}
                    className="w-full"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selected.width || 100) - 100) / 200 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${((selected.width || 100) - 100) / 200 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                      borderRadius: '4px',
                      height: '8px'
                    }}
                  />
                </div>
              )}
              {/* Background Opacity slider */}
              {selected.type === "background" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Opacity
                    </label>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {selected.opacity ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={selected.opacity ?? 100}
                    onChange={(e) => updateElement(selected.id, { opacity: Number(e.target.value) })}
                    className="w-full"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(selected.opacity ?? 100)}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(selected.opacity ?? 100)}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                      borderRadius: '4px',
                      height: '8px'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Text-specific properties */}
            {(selected.type === "text" || selected.type === "celebrant-name" || selected.type === "date" || selected.type === "location") && (
              <>
                {/* Date structure selector — only for date elements */}
                {selected.type === "date" && (
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Date Structure
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cycleDateStructure(selected.id, -1)}
                        className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <span className={`flex-1 text-center text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {DATE_STRUCTURES.find((s) => s.id === (selected.dateStructure || "default"))?.name || "Default"}
                      </span>
                      <button
                        onClick={() => cycleDateStructure(selected.id, 1)}
                        className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {/* Text textarea — hidden for date and celebrant-name (text is auto-generated) */}
                {selected.type !== "date" && selected.type !== "celebrant-name" && (
                <label className="flex flex-col gap-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text</label>
                  <textarea
                    value={selected.text || ""}
                    onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                    rows={3}
                    className={`px-2 py-1 rounded text-sm resize-none ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                  />
                </label>
                )}

                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Font</label>
                  <HybridFontControl
                    value={selected.fontFamily || "Inter"}
                    onChange={(v) => updateElement(selected.id, { fontFamily: v })}
                    type="heading"
                    label=""
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    predefinedFonts={predefinedHeadingFonts}
                  />
                </div>

                <div className="space-y-3">
                  {/* Weight */}
                  <label className="flex flex-col gap-1">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Weight</label>
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
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color</label>
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

                {/* Celebrant name-specific: Ampersand styling */}
                {selected.type === "celebrant-name" && data.nameType === "couple" && (
                  <>
                    {/* Ampersand Typography */}
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Ampersand(&) Typography</label>
                      <HybridFontControl
                        value={selected.ampersandTypography || selected.fontFamily || "Playfair Display"}
                        onChange={(v) => updateCelebrantName(selected.id, { ampersandTypography: v })}
                        type="heading"
                        label=""
                        showPreview={false}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                        predefinedFonts={predefinedHeadingFonts}
                      />
                    </div>

                    {/* Ampersand Position */}
                    <label className="flex flex-col gap-1">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Ampersand(&) Position</label>
                      <select
                        value={selected.ampersandPosition || "default"}
                        onChange={(e) => updateCelebrantName(selected.id, { ampersandPosition: e.target.value as "default" | "first-line" | "middle-line" | "second-line" })}
                        className={`px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                      >
                        <option value="default">Default (same line)</option>
                        <option value="first-line">First line</option>
                        <option value="middle-line">Middle line</option>
                        <option value="second-line">Second line</option>
                      </select>
                    </label>

                    {/* Ampersand Opacity slider (-20 to 100) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          Ampersand(&) Transparency
                        </label>
                        <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {selected.ampersandOpacity ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-20}
                        max={100}
                        step={1}
                        value={selected.ampersandOpacity ?? 100}
                        onChange={(e) => updateCelebrantName(selected.id, { ampersandOpacity: Number(e.target.value) })}
                        className="w-full"
                        style={{
                          accentColor: accentColor,
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selected.ampersandOpacity ?? 100) + 20) / 120 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${((selected.ampersandOpacity ?? 100) + 20) / 120 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                          borderRadius: '4px',
                          height: '8px'
                        }}
                      />
                    </div>

                    {/* Reverse names toggle */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Reverse names</span>
                      <button
                        type="button"
                        onClick={() => updateCelebrantName(selected.id, { reverseNames: !(selected.reverseNames ?? false) })}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none`}
                        style={{
                          backgroundColor: (selected.reverseNames ?? false) ? accentColor : (isDarkMode ? '#4B5563' : '#D1D5DB')
                        }}
                      >
                        <span
                          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            (selected.reverseNames ?? false) ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* QR-specific properties */}
            {selected.type === "qr" && (
              <label className="flex flex-col gap-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>QR Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selected.color || "#000000"}
                    onChange={(e) => {
                      updateElement(selected.id, { color: e.target.value });
                      setQrCache((prev) => { const next = { ...prev }; delete next[selected.id]; return next; });
                    }}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selected.color || "#000000"}
                    onChange={(e) => {
                      updateElement(selected.id, { color: e.target.value });
                      setQrCache((prev) => { const next = { ...prev }; delete next[selected.id]; return next; });
                    }}
                    className={`flex-1 px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                  />
                </div>
              </label>
            )}

            {/* Image-specific properties */}
            {selected.type === "image" && (
              <>
                <button
                  onClick={() => { setImagePickerMode("images"); setShowImagePicker(true); }}
                  className={`w-full py-2 rounded-lg text-sm ${isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}
                >
                  Replace Image
                </button>

                {/* Tint Color */}
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Tint Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selected.color || "#000000"}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selected.color || "#000000"}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className={`flex-1 px-2 py-1 rounded text-sm ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-900"}`}
                    />
                    <button
                      onClick={() => updateElement(selected.id, { color: undefined })}
                      className={`px-2 py-1 rounded text-xs ${isDarkMode ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      title="Clear tint"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Tint Opacity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      Tint Opacity
                    </label>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {selected.opacity ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={selected.opacity ?? 100}
                    onChange={(e) => updateElement(selected.id, { opacity: Number(e.target.value) })}
                    className="w-full"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(selected.opacity ?? 100)}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(selected.opacity ?? 100)}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                      borderRadius: '4px',
                      height: '8px'
                    }}
                  />
                </div>
              </>
            )}

            {/* Background-specific properties */}
            {selected.type === "background" && (
              <button
                onClick={() => { setImagePickerMode("background"); setShowImagePicker(true); }}
                className={`w-full py-2 rounded-lg text-sm ${isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}
              >
                Replace Background
              </button>
            )}

            {/* Z-index */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Layer Order
                </label>
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  {selected.zIndex || 0}
                </span>
              </div>
              <input
                type="range"
                min={selected.type === "background" ? 0 : 1}
                max={20}
                step={1}
                value={selected.zIndex || 0}
                onChange={(e) => updateElement(selected.id, { zIndex: Number(e.target.value) })}
                className="w-full"
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(selected.zIndex || 0) / 20 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(selected.zIndex || 0) / 20 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                  borderRadius: '4px',
                  height: '8px'
                }}
              />
            </div>
            </div>
          </div>
        </>
      , document.body)}

      {/* Image picker — sliding bottom sheet (mobile) or side panel (desktop) */}
      {showImagePicker && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-transparent z-[999]"
            onClick={() => setShowImagePicker(false)}
          />
          {/* Sheet */}
          <div
            className={`fixed z-[1000] shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              isMobile
                ? "bottom-0 left-0 right-0 rounded-t-3xl animate-slide-up"
                : "top-0 bottom-0 right-0 border-l animate-slide-in-side-right"
            }`}
            style={isMobile ? { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" } : { width: "320px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar — mobile only */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {imagePickerMode === "background" ? "Choose Background" : "Choose Image"}
              </h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Image grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {imagePickerMode === "background" ? (
                /* Background picker — photos from media library */
                (data.photosAndImages || []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(data.photosAndImages || []).map((url, i) => (
                      <button
                        key={`bg-${i}`}
                        onClick={() => {
                          const existingBg = elements.find((e) => e.type === "background");
                          if (existingBg) {
                            // Replace existing background
                            updateElement(existingBg.id, { imageUrl: url });
                            setSelectedId(existingBg.id);
                          } else {
                            const newEl: EaselElement = {
                              id: genId(),
                              type: "background",
                              x: 50,
                              y: 50,
                              width: 100,
                              height: 100,
                              imageUrl: url,
                              opacity: 100,
                              zIndex: 0,
                            };
                            updateElements([...elements, newEl]);
                            setSelectedId(newEl.id);
                          }
                          setShowImagePicker(false);
                        }}
                        className={`rounded-lg overflow-hidden border-2 transition-colors ${isDarkMode ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-gray-400"}`}
                      >
                        <img src={url} alt={`Background ${i + 1}`} className="w-full h-24 object-cover" draggable={false} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center text-sm py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    No photos available. Add photos in Media {"->"} Photos & Images.
                  </div>
                )
              ) : (
                /* Images picker — easel decorative images */
                <div className="grid grid-cols-2 gap-3">
                  {EASEL_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      onClick={() => {
                        if (selectedId && elements.find((e) => e.id === selectedId)?.type === "image") {
                          updateElement(selectedId, { imageUrl: img.url });
                        } else {
                          const newEl: EaselElement = {
                            id: genId(),
                            type: "image",
                            x: 50,
                            y: 50,
                            width: 30,
                            height: 30,
                            scale: 100,
                            imageUrl: img.url,
                            zIndex: Math.max(1, elements.length + 1),
                          };
                          updateElements([...elements, newEl]);
                          setSelectedId(newEl.id);
                        }
                        setShowImagePicker(false);
                      }}
                      className={`rounded-lg overflow-hidden border-2 transition-colors ${isDarkMode ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-gray-400"}`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-24 object-contain" draggable={false} />
                      <div className={`text-xs text-center py-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {img.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      , document.body)}
    </div>
  );
}
