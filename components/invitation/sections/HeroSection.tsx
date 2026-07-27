import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import EditableZone from "../EditableZone";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import HybridFontControl from "@/components/shared/HybridFontControl";
import HybridDropdown from "@/components/shared/HybridDropdown";
import ColorControl from "@/components/shared/ColorControl";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";

interface HeroSectionProps {
  data: InvitationData;
  editMode?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  printResizeScale?: number;
  prePrintActive?: boolean;
  tempRemoveBackground?: boolean;
  tempBackgroundImage?: string | null;
  tempBackgroundYPosition?: number;
  tempBackgroundXPosition?: number;
  tempBackgroundZoom?: number;
  tempColorOverlayEnabled?: boolean;
  tempOverlayType?: "solid" | "gradient";
  tempOverlayColor1?: string | null;
  tempOverlayColor2?: string | null;
  tempOverlayOpacity1?: number;
  tempOverlayOpacity2?: number;
  tempTextColor?: string | null;
  tempLogoTransparency?: number;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
  previewMode?: boolean;
  onUpdateHeroNameSize?: (size: number) => void;
  onUpdateHeroAmpersandSize?: (size: number) => void;
  onUpdateHeroAmpersandOpacity?: (opacity: number) => void;
  onUpdateHeroIconName2First?: (value: boolean) => void;
  onUpdateHeroAmpersandPosition?: (value: "default" | "first-line" | "middle-line" | "second-line") => void;
  onUpdateHeroDisplayNameTypography?: (value: string) => void;
  onUpdateHeroAmpersandTypography?: (value: string) => void;
  onUpdateHeroIconTextColor?: (value: string) => void;
  onUpdateHeroOthersColor?: (value: string) => void;
  onUpdateHeroOthersTextSize?: (value: number) => void;
  onUpdateHeroTextShadowOpacity?: (value: number) => void;
  onUpdateHeroDateStructure?: (value: "default" | "alternative" | "icon" | "elegant" | "modern" | "huge") => void;
  onUpdateHeroDateStructureSize?: (value: number) => void;
  onUpdateHeroDateStructureSpacing?: (value: number) => void;
  onUpdateHeroVenueStructure?: (value: "default" | "icon") => void;
  onUpdateHeroVenueSize?: (value: number) => void;
  onUpdateHeroVenueSpacing?: (value: number) => void;
  onUpdateHeroHostLineImage?: (value: "hostline-00" | "hostline-01" | "hostline-02" | "hostline-03" | "hostline-04" | "hostline-05" | "hostline-06" | "hostline-07" | "hostline-08" | "hostline-09") => void;
  onUpdateHeroHostLineImageOpacity?: (value: number) => void;
  onUpdateHeroHostLineImageSize?: (value: number) => void;
  onUpdateHeroHostLineImageSpacing?: (value: number) => void;
  onUpdateHeroHostLineTextSize?: (value: number) => void;
  onUpdateHeroHostLineTextSpacing?: (value: number) => void;
  onUpdateHeroClosingSentimentImage?: (value: "fsentiment-00" | "fsentiment-01" | "fsentiment-02" | "fsentiment-03" | "fsentiment-04" | "fsentiment-05" | "fsentiment-06" | "fsentiment-07") => void;
  onUpdateHeroClosingSentimentImageOpacity?: (value: number) => void;
  onUpdateHeroClosingSentimentImageSize?: (value: number) => void;
  onUpdateHeroClosingSentimentImageSpacing?: (value: number) => void;
  onUpdateHeroClosingSentimentTextSize?: (value: number) => void;
  onUpdateHeroClosingSentimentTextSpacing?: (value: number) => void;
  onChange?: (key: keyof InvitationData, value: any) => void;
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onPendingChangesChange?: (changes: Partial<InvitationData>) => void;
}

export default function HeroSection({
  data,
  editMode = false,
  isDarkMode = false,
  accentColor = "#6998EE",
  printResizeScale = 100,
  prePrintActive = false,
  tempRemoveBackground = false,
  tempBackgroundImage = null,
  tempBackgroundYPosition = 0,
  tempBackgroundXPosition = 0,
  tempBackgroundZoom = 0,
  tempColorOverlayEnabled = false,
  tempOverlayType = "solid",
  tempOverlayColor1 = null,
  tempOverlayColor2 = null,
  tempOverlayOpacity1 = 0.7,
  tempOverlayOpacity2 = 0.7,
  tempTextColor = null,
  tempLogoTransparency = 100,
  desktopMode = false,
  panelPosition = "left",
  previewMode = false,
  onUpdateHeroNameSize,
  onUpdateHeroAmpersandSize,
  onUpdateHeroAmpersandOpacity,
  onUpdateHeroIconName2First,
  onUpdateHeroAmpersandPosition,
  onUpdateHeroDisplayNameTypography,
  onUpdateHeroAmpersandTypography,
  onUpdateHeroIconTextColor,
  onUpdateHeroOthersColor,
  onUpdateHeroOthersTextSize,
  onUpdateHeroTextShadowOpacity,
  onUpdateHeroDateStructure,
  onUpdateHeroDateStructureSize,
  onUpdateHeroDateStructureSpacing,
  onUpdateHeroVenueStructure,
  onUpdateHeroVenueSize,
  onUpdateHeroVenueSpacing,
  onUpdateHeroHostLineImage,
  onUpdateHeroHostLineImageOpacity,
  onUpdateHeroHostLineImageSize,
  onUpdateHeroHostLineImageSpacing,
  onUpdateHeroHostLineTextSize,
  onUpdateHeroHostLineTextSpacing,
  onUpdateHeroClosingSentimentImage,
  onUpdateHeroClosingSentimentImageOpacity,
  onUpdateHeroClosingSentimentImageSize,
  onUpdateHeroClosingSentimentImageSpacing,
  onUpdateHeroClosingSentimentTextSize,
  onUpdateHeroClosingSentimentTextSpacing,
  onChange,
  onHasUnsavedChangesChange,
  onPendingChangesChange
}: HeroSectionProps) {
  const bgImages = data.heroBackgroundImages || [];
  const bgImagesMobile = data.heroBackgroundImagesMobile || [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [showNamePanel, setShowNamePanel] = useState(false);
  const [showDateStructurePanel, setShowDateStructurePanel] = useState(false);
  const [pendingHeroChanges, setPendingHeroChanges] = useState<Partial<InvitationData>>({});
  const [hasUnsavedHeroChanges, setHasUnsavedHeroChanges] = useState(false);

  // Handler for hero changes - saves to local state for live preview and queues for global apply
  const handleHeroChange = (key: keyof InvitationData, value: any) => {
    setPendingHeroChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedHeroChanges(true);
    if (onHasUnsavedChangesChange) {
      onHasUnsavedChangesChange(true);
    }
    onChange?.(key, value);
  };

  // Notify parent of pending changes when they change
  useEffect(() => {
    if (onPendingChangesChange) {
      onPendingChangesChange(pendingHeroChanges);
    }
  }, [pendingHeroChanges, onPendingChangesChange]);

  // Merge data with pending changes for preview
  const heroMergedData = { ...data, ...pendingHeroChanges };
  type DragToastSegment = { label: string; value: number; atLimit: boolean };
  const [dragToast, setDragToast] = useState<DragToastSegment[] | null>(null);
  const [isNamePanelClosing, setIsNamePanelClosing] = useState(false);
  const [isDateStructurePanelClosing, setIsDateStructurePanelClosing] = useState(false);
  const [hasUnsavedNameChanges, setHasUnsavedNameChanges] = useState(false);
  const [pendingNameChanges, setPendingNameChanges] = useState<Partial<InvitationData>>({});
  const [hasUnsavedDateStructureChanges, setHasUnsavedDateStructureChanges] = useState(false);
  const [pendingDateStructureChanges, setPendingDateStructureChanges] = useState<Partial<InvitationData>>({});
  const [activePanel, setActivePanel] = useState<"name" | "date" | null>(null);

  // Fetch predefined options from Supabase
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');

  // Date structures for arrow navigation
  const dateStructures = [
    { id: "default", name: "Default Layout" },
    { id: "alternative", name: "Alternative Layout" },
    { id: "icon", name: "Icon Layout" },
    { id: "elegant", name: "Elegant Layout" },
    { id: "modern", name: "Modern Layout" },
    { id: "huge", name: "Huge Layout" }
  ];

  const [isDateStructureTransitioning, setIsDateStructureTransitioning] = useState(false);
  const [dateDragging, setDateDragging] = useState(false);

  const handleCloseNamePanel = () => {
    setPendingNameChanges({});
    setHasUnsavedNameChanges(false);
    setIsNamePanelClosing(true);
    setTimeout(() => {
      setShowNamePanel(false);
      setIsNamePanelClosing(false);
    }, 300);
  };

  const handleCloseDateStructurePanel = () => {
    setPendingDateStructureChanges({});
    setHasUnsavedDateStructureChanges(false);
    setIsDateStructurePanelClosing(true);
    setTimeout(() => {
      setShowDateStructurePanel(false);
      setIsDateStructurePanelClosing(false);
    }, 300);
  };

  const handleNameChange = (key: keyof InvitationData, value: any) => {
    setPendingNameChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedNameChanges(true);
    onChange?.(key, value);
  };

  const handleDateStructureChange = (key: keyof InvitationData, value: any) => {
    setPendingDateStructureChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedDateStructureChanges(true);
    onChange?.(key, value);
  };

  // Prevent page scroll during active drag (native listener with passive:false)
  const isAnyDragging = useRef(false);
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isAnyDragging.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove);
  }, []);

  // Date drag-to-resize: up/down = size (50-200), left/right = spacing (100-200)
  type DateDragData = {
    timer: ReturnType<typeof setTimeout> | null;
    triggered: boolean;
    pointerId: number;
    element: HTMLDivElement | null;
    startX: number;
    startY: number;
    startSize: number;
    startSpacing: number;
    didMove: boolean;
  };
  const dateDragRef = useRef<DateDragData | null>(null);

  const handleDatePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
    if (!editMode || (!isTouchLike && e.button !== 0)) return;
    const element = e.currentTarget as HTMLDivElement;
    dateDragRef.current = {
      timer: setTimeout(() => {
        const d = dateDragRef.current;
        if (!d) return;
        d.timer = null;
        d.triggered = true;
        isAnyDragging.current = true;
        setDateDragging(true);
        try {
          d.element?.setPointerCapture(d.pointerId);
        } catch {}
      }, 350),
      triggered: false,
      pointerId: e.pointerId,
      element,
      startX: e.clientX,
      startY: e.clientY,
      startSize: mergedData.heroDateStructureSize ?? 100,
      startSpacing: mergedData.heroDateStructureSpacing ?? 100,
      didMove: false,
    };
  };

  const handleDatePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dateDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.triggered) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 10) {
        if (d.timer) clearTimeout(d.timer);
        dateDragRef.current = null;
      }
      return;
    }
    e.preventDefault();
    d.didMove = true;
    const deltaY = e.clientY - d.startY;
    const deltaX = e.clientX - d.startX;
    const newSize = Math.max(50, Math.min(200, d.startSize - deltaY * 0.5));
    handleDateStructureChange('heroDateStructureSize', Math.round(newSize));
    setDragToast([
      { label: 'Size', value: Math.round(newSize), atLimit: newSize <= 50 || newSize >= 200 },
    ]);
  };

  const handleDatePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dateDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    try {
      d.element?.releasePointerCapture(d.pointerId);
    } catch {}
    setDateDragging(false);
    setDragToast(null);
    isAnyDragging.current = false;
  };

  const handleDatePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dateDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    dateDragRef.current = null;
    isAnyDragging.current = false;
    setDateDragging(false);
    setDragToast(null);
  };

  // Venue drag-to-resize: up/down = size (50-200%), left/right = spacing (100-200%)
  type VenueDragData = {
    timer: ReturnType<typeof setTimeout> | null;
    triggered: boolean;
    pointerId: number;
    element: HTMLDivElement | null;
    startX: number;
    startY: number;
    startSize: number;
    startSpacing: number;
  };
  const venueDragRef = useRef<VenueDragData | null>(null);
  const [venueDragging, setVenueDragging] = useState(false);

  const handleVenuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
    if (!editMode || (!isTouchLike && e.button !== 0)) return;
    const element = e.currentTarget as HTMLDivElement;
    venueDragRef.current = {
      timer: setTimeout(() => {
        const d = venueDragRef.current;
        if (!d) return;
        d.timer = null;
        d.triggered = true;
        isAnyDragging.current = true;
        setVenueDragging(true);
        try {
          d.element?.setPointerCapture(d.pointerId);
        } catch {}
      }, 350),
      triggered: false,
      pointerId: e.pointerId,
      element,
      startX: e.clientX,
      startY: e.clientY,
      startSize: mergedData.heroVenueSize ?? 100,
      startSpacing: mergedData.heroVenueSpacing ?? 100,
    };
  };

  const handleVenuePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = venueDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.triggered) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 10) {
        if (d.timer) clearTimeout(d.timer);
        venueDragRef.current = null;
      }
      return;
    }
    e.preventDefault();
    const deltaY = e.clientY - d.startY;
    const deltaX = e.clientX - d.startX;
    const newSize = Math.max(50, Math.min(200, d.startSize - deltaY * 0.5));
    onUpdateHeroVenueSize?.(Math.round(newSize));
    setDragToast([
      { label: 'Size', value: Math.round(newSize), atLimit: newSize <= 50 || newSize >= 200 },
    ]);
  };

  const handleVenuePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = venueDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    try {
      d.element?.releasePointerCapture(d.pointerId);
    } catch {}
    setVenueDragging(false);
    isAnyDragging.current = false;
    setDragToast(null);
  };

  const handleVenuePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = venueDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    venueDragRef.current = null;
    isAnyDragging.current = false;
    setVenueDragging(false);
    setDragToast(null);
  };

  // Generic drag-to-resize factory for hero elements
  type GenericDragData = {
    timer: ReturnType<typeof setTimeout> | null;
    triggered: boolean;
    pointerId: number;
    element: HTMLElement | null;
    startX: number;
    startY: number;
    startSize: number;
    startSpacing: number;
  };

  function createDragHandlers(
    ref: React.MutableRefObject<GenericDragData | null>,
    setDragging: (v: boolean) => void,
    onSize: (v: number) => void,
    onSpacing: (v: number) => void,
    getSize: () => number,
    getSpacing: () => number
  ) {
    const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
      if (!editMode || (!isTouchLike && e.button !== 0)) return;
      const element = e.currentTarget as HTMLDivElement;
      ref.current = {
        timer: setTimeout(() => {
          const d = ref.current;
          if (!d) return;
          d.timer = null;
          d.triggered = true;
          isAnyDragging.current = true;
          setDragging(true);
          try { d.element?.setPointerCapture(d.pointerId); } catch {}
        }, 350),
        triggered: false,
        pointerId: e.pointerId,
        element,
        startX: e.clientX,
        startY: e.clientY,
        startSize: getSize(),
        startSpacing: getSpacing(),
      };
    };
    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = ref.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.triggered) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.hypot(dx, dy) > 10) {
          if (d.timer) clearTimeout(d.timer);
          ref.current = null;
        }
        return;
      }
      e.preventDefault();
      const deltaY = e.clientY - d.startY;
      const deltaX = e.clientX - d.startX;
      const newSize = Math.max(50, Math.min(200, d.startSize - deltaY * 0.5));
      onSize(Math.round(newSize));
      setDragToast([
        { label: 'Size', value: Math.round(newSize), atLimit: newSize <= 50 || newSize >= 200 },
      ]);
    };
    const handleUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = ref.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.timer) clearTimeout(d.timer);
      try { d.element?.releasePointerCapture(d.pointerId); } catch {}
      setDragging(false);
      isAnyDragging.current = false;
      setDragToast(null);
    };
    const handleCancel = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = ref.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.timer) clearTimeout(d.timer);
      ref.current = null;
      isAnyDragging.current = false;
      setDragging(false);
      setDragToast(null);
    };
    return { handleDown, handleMove, handleUp, handleCancel };
  }

  // Size-only drag factory (no spacing, only up/down)
  function createSizeOnlyDragHandlers(
    ref: React.MutableRefObject<GenericDragData | null>,
    setDragging: (v: boolean) => void,
    onSize: (v: number) => void,
    getSize: () => number
  ) {
    const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
      if (!editMode || (!isTouchLike && e.button !== 0)) return;
      const element = e.currentTarget as HTMLDivElement;
      ref.current = {
        timer: setTimeout(() => {
          const d = ref.current;
          if (!d) return;
          d.timer = null;
          d.triggered = true;
          isAnyDragging.current = true;
          setDragging(true);
          try { d.element?.setPointerCapture(d.pointerId); } catch {}
        }, 350),
        triggered: false,
        pointerId: e.pointerId,
        element,
        startX: e.clientX,
        startY: e.clientY,
        startSize: getSize(),
        startSpacing: 100,
      };
    };
    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = ref.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.triggered) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.hypot(dx, dy) > 10) {
          if (d.timer) clearTimeout(d.timer);
          ref.current = null;
        }
        return;
      }
      e.preventDefault();
      const deltaY = e.clientY - d.startY;
      const newSize = Math.max(50, Math.min(200, d.startSize - deltaY * 0.5));
      onSize(Math.round(newSize));
      setDragToast([
        { label: 'Size', value: Math.round(newSize), atLimit: newSize <= 50 || newSize >= 200 },
      ]);
    };
    const handleUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = ref.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.timer) clearTimeout(d.timer);
      try { d.element?.releasePointerCapture(d.pointerId); } catch {}
      setDragging(false);
      isAnyDragging.current = false;
      setDragToast(null);
    };
    const handleCancel = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = ref.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.timer) clearTimeout(d.timer);
      ref.current = null;
      isAnyDragging.current = false;
      setDragging(false);
      setDragToast(null);
    };
    return { handleDown, handleMove, handleUp, handleCancel };
  }

  // Name drag (size only, no spacing)
  const nameDragRef = useRef<GenericDragData | null>(null);
  const [nameDragging, setNameDragging] = useState(false);
  const nameDrag = createSizeOnlyDragHandlers(
    nameDragRef, setNameDragging,
    (v) => onUpdateHeroNameSize?.(v),
    () => mergedData.heroNameSize ?? 100
  );

  // Ampersand drag (size 50-200 up/down, opacity 0-100 left/right)
  const ampersandDragRef = useRef<GenericDragData | null>(null);
  const [ampersandDragging, setAmpersandDragging] = useState(false);
  const ampersandDrag = (() => {
    const handleDown = (e: React.PointerEvent<HTMLSpanElement>) => {
      const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
      if (!editMode || (!isTouchLike && e.button !== 0)) return;
      const element = e.currentTarget as HTMLSpanElement;
      ampersandDragRef.current = {
        timer: setTimeout(() => {
          const d = ampersandDragRef.current;
          if (!d) return;
          d.timer = null;
          d.triggered = true;
          isAnyDragging.current = true;
          setAmpersandDragging(true);
          try { d.element?.setPointerCapture(d.pointerId); } catch {}
        }, 350),
        triggered: false,
        pointerId: e.pointerId,
        element,
        startX: e.clientX,
        startY: e.clientY,
        startSize: mergedData.heroAmpersandSize ?? 100,
        startSpacing: mergedData.heroAmpersandOpacity ?? 100,
      };
    };
    const handleMove = (e: React.PointerEvent<HTMLSpanElement>) => {
      const d = ampersandDragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.triggered) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.hypot(dx, dy) > 10) {
          if (d.timer) clearTimeout(d.timer);
          ampersandDragRef.current = null;
        }
        return;
      }
      e.preventDefault();
      const deltaY = e.clientY - d.startY;
      const deltaX = e.clientX - d.startX;
      const newSize = Math.max(50, Math.min(250, d.startSize - deltaY * 0.5));
      const newOpacity = Math.max(10, Math.min(100, d.startSpacing + deltaX * 0.5));
      onUpdateHeroAmpersandSize?.(Math.round(newSize));
      onUpdateHeroAmpersandOpacity?.(Math.round(newOpacity));
      setDragToast([
        { label: 'Size', value: Math.round(newSize), atLimit: newSize <= 50 || newSize >= 250 },
        { label: 'Visibility', value: Math.round(newOpacity), atLimit: newOpacity <= 10 || newOpacity >= 100 },
      ]);
    };
    const handleUp = (e: React.PointerEvent<HTMLSpanElement>) => {
      const d = ampersandDragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.timer) clearTimeout(d.timer);
      try { d.element?.releasePointerCapture(d.pointerId); } catch {}
      setAmpersandDragging(false);
      isAnyDragging.current = false;
      setDragToast(null);
    };
    const handleCancel = (e: React.PointerEvent<HTMLSpanElement>) => {
      const d = ampersandDragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (d.timer) clearTimeout(d.timer);
      ampersandDragRef.current = null;
      isAnyDragging.current = false;
      setAmpersandDragging(false);
      setDragToast(null);
    };
    return { handleDown, handleMove, handleUp, handleCancel };
  })();

  // Hostline text drag
  const hostLineTextDragRef = useRef<GenericDragData | null>(null);
  const [hostLineTextDragging, setHostLineTextDragging] = useState(false);
  const hostLineTextDrag = createDragHandlers(
    hostLineTextDragRef, setHostLineTextDragging,
    (v) => onUpdateHeroHostLineTextSize?.(v),
    (v) => onUpdateHeroHostLineTextSpacing?.(v),
    () => mergedData.heroHostLineTextSize ?? 100,
    () => mergedData.heroHostLineTextSpacing ?? 100
  );

  // Hostline image drag
  const hostLineImageDragRef = useRef<GenericDragData | null>(null);
  const [hostLineImageDragging, setHostLineImageDragging] = useState(false);
  const hostLineImageDrag = createDragHandlers(
    hostLineImageDragRef, setHostLineImageDragging,
    (v) => onUpdateHeroHostLineImageSize?.(v),
    (v) => onUpdateHeroHostLineImageSpacing?.(v),
    () => mergedData.heroHostLineImageSize ?? 100,
    () => mergedData.heroHostLineImageSpacing ?? 100
  );

  // Fsentiment text drag
  const fsentimentTextDragRef = useRef<GenericDragData | null>(null);
  const [fsentimentTextDragging, setFsentimentTextDragging] = useState(false);
  const fsentimentTextDrag = createDragHandlers(
    fsentimentTextDragRef, setFsentimentTextDragging,
    (v) => onUpdateHeroClosingSentimentTextSize?.(v),
    (v) => onUpdateHeroClosingSentimentTextSpacing?.(v),
    () => mergedData.heroClosingSentimentTextSize ?? 100,
    () => mergedData.heroClosingSentimentTextSpacing ?? 100
  );

  // Fsentiment image drag
  const fsentimentImageDragRef = useRef<GenericDragData | null>(null);
  const [fsentimentImageDragging, setFsentimentImageDragging] = useState(false);
  const fsentimentImageDrag = createDragHandlers(
    fsentimentImageDragRef, setFsentimentImageDragging,
    (v) => onUpdateHeroClosingSentimentImageSize?.(v),
    (v) => onUpdateHeroClosingSentimentImageSpacing?.(v),
    () => mergedData.heroClosingSentimentImageSize ?? 100,
    () => mergedData.heroClosingSentimentImageSpacing ?? 100
  );

  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingNameChanges, ...pendingDateStructureChanges };

  const renderArrowOverlay = (size: number) => (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      {size < 200 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hero-arrow-up" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z" /></svg>
        </div>
      )}
      {size > 50 && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hero-arrow-down" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z" /></svg>
        </div>
      )}
    </div>
  );

  console.log('heroHostLineImage:', data.heroHostLineImage);

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (day: string): string => {
    const num = parseInt(day, 10);
    if (isNaN(num)) return "";
    const lastTwo = num % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return "th";
    const lastOne = num % 10;
    if (lastOne === 1) return "st";
    if (lastOne === 2) return "nd";
    if (lastOne === 3) return "rd";
    return "th";
  };

  const displayName = data.nameType === "couple"
    ? (() => {
        const name1 = mergedData.heroIconName2First ? (data.herName || "") : (data.hisName || "");
        const name2 = mergedData.heroIconName2First ? (data.hisName || "") : (data.herName || "");
        const andText = data.andText || "&";
        
        switch (data.heroAmpersandPosition) {
          case "first-line":
            return `${name1} ${andText}\n${name2}`.trim();
          case "middle-line":
            return `${name1}\n${andText}\n${name2}`.trim();
          case "second-line":
            return `${name1}\n${andText} ${name2}`.trim();
          case "default":
          default:
            return `${name1} ${andText} ${name2}`.trim();
        }
      })()
    : data.coupleName;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-rotate slideshow
  useEffect(() => {
    const imagesToUse = isMobile ? bgImagesMobile : bgImages;
    if (imagesToUse.filter(Boolean).length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % imagesToUse.filter(Boolean).length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [bgImages, bgImagesMobile, isMobile]);

  // Format date as "The 21st of August 2026"
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      // Get ordinal suffix (st, nd, rd, th)
      const suffix = (n: number) => {
        if (n > 3 && n < 21) return 'th';
        switch (n % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      
      return `The ${day}${suffix(day)} of ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Parse date components for box layout
  const parseDateComponents = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return {
        month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        monthFull: date.toLocaleString('en-US', { month: 'long' }),
        day: date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
        dayFull: date.toLocaleString('en-US', { weekday: 'long' }),
        date: date.getDate(),
        year: date.getFullYear()
      };
    } catch {
      return null;
    }
  };

  const dateComponents = parseDateComponents(data.date);

  // Background overlay style
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const hasTempOverlay = tempColorOverlayEnabled && !!tempOverlayColor1;
  const tempOverlayOpacity1Value = hasTempOverlay ? tempOverlayOpacity1 : undefined;
  const tempOverlayOpacity2Value = hasTempOverlay ? tempOverlayOpacity2 : undefined;
  const getOverlayStyle = () => {
    const opacity1 = tempOverlayOpacity1Value !== undefined ? tempOverlayOpacity1Value : (data.heroOverlayOpacity1 !== undefined ? data.heroOverlayOpacity1 : 0);
    const opacity2 = tempOverlayOpacity2Value !== undefined ? tempOverlayOpacity2Value : (data.heroOverlayOpacity2 !== undefined ? data.heroOverlayOpacity2 : 0);
    const overlayType = hasTempOverlay ? tempOverlayType : (data.heroBackgroundOverlay ?? "solid");
    const color1 = hasTempOverlay ? tempOverlayColor1 : data.heroOverlayColor1;
    const color2 = hasTempOverlay ? tempOverlayColor2 : data.heroOverlayColor2;

    if (overlayType === "gradient" && color1 && color2) {
      return {
        backgroundImage: `linear-gradient(135deg, ${hexToRgba(color1, opacity1)}, ${hexToRgba(color2, opacity2)})`,
      };
    } else if (color1) {
      return {
        backgroundColor: hexToRgba(color1, opacity1),
      };
    }
    return {};
  };

  return (
    <section
      id="hero-section"
      className="min-h-screen flex flex-col items-center justify-start pt-0 pb-16 text-center relative"
    >
      {dragToast && createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-lg bg-black/80 text-white text-sm font-medium pointer-events-none backdrop-blur-sm shadow-lg whitespace-nowrap transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
          {dragToast.map((seg, i) => (
            <span key={i}>
              {i > 0 && '  |  '}
              <span style={{ color: seg.atLimit ? '#ef4444' : 'white', transition: 'color 0.15s' }}>{seg.label}: {seg.value}%</span>
            </span>
          ))}
        </div>,
        document.body
      )}
      {tempTextColor && (
        <style>{`
          #hero-section,
          #hero-section * {
            color: ${tempTextColor} !important;
          }
          #hero-section .temp-mask-color {
            background-color: ${tempTextColor} !important;
          }
        `}</style>
      )}
      <style>{`
        @keyframes hero-arrow-up-anim {
          0% { transform: translateX(-50%) translateY(0); opacity: 0; }
          20% { opacity: 0.85; }
          60% { opacity: 0.85; }
          100% { transform: translateX(-50%) translateY(-18px); opacity: 0; }
        }
        @keyframes hero-arrow-down-anim {
          0% { transform: translateX(-50%) translateY(0); opacity: 0; }
          20% { opacity: 0.85; }
          60% { opacity: 0.85; }
          100% { transform: translateX(-50%) translateY(18px); opacity: 0; }
        }
        @keyframes hero-arrow-left-anim {
          0% { transform: translateY(-50%) translateX(0); opacity: 0; }
          20% { opacity: 0.85; }
          60% { opacity: 0.85; }
          100% { transform: translateY(-50%) translateX(-18px); opacity: 0; }
        }
        @keyframes hero-arrow-right-anim {
          0% { transform: translateY(-50%) translateX(0); opacity: 0; }
          20% { opacity: 0.85; }
          60% { opacity: 0.85; }
          100% { transform: translateY(-50%) translateX(18px); opacity: 0; }
        }
        .hero-arrow-up { animation: hero-arrow-up-anim 1.2s ease-in-out infinite; }
        .hero-arrow-down { animation: hero-arrow-down-anim 1.2s ease-in-out infinite; }
        .hero-arrow-left { animation: hero-arrow-left-anim 1.2s ease-in-out infinite; }
        .hero-arrow-right { animation: hero-arrow-right-anim 1.2s ease-in-out infinite; }
      `}</style>
      {/* Background color */}
      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: data.mainColor1 }}
      />

      {/* Background images with overlay */}
      {(() => {
        const resolveGalleryUrl = (url: string) => {
          if (!url) return "";
          if (url.startsWith("http") || url.startsWith("/")) return url;
          return `/stock/gallery/${url}`;
        };
        const imagesToUse = isMobile ? bgImagesMobile : bgImages;
        const cropDataArray = isMobile ? data.heroBackgroundImagesMobileCrop : data.heroBackgroundImagesCrop;
        const bgZoom = 1 + (tempBackgroundZoom / 100);
        const bgX = 50 + tempBackgroundXPosition;
        const bgY = 50 + tempBackgroundYPosition;
        const resolvedTempBackground = resolveGalleryUrl(tempBackgroundImage || "");
        const hasTempImage = !!resolvedTempBackground;
        const hasTempBackgroundAdjustments = tempBackgroundXPosition !== 0 || tempBackgroundYPosition !== 0 || tempBackgroundZoom !== 0;

        if (tempRemoveBackground && !hasTempImage) {
          return (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, ...getOverlayStyle() }} />
            </div>
          );
        }

        return (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {hasTempImage ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 0,
                  opacity: 1,
                  backgroundImage: `url(${resolvedTempBackground})`,
                  backgroundSize: 'cover',
                  backgroundPosition: `${bgX}% ${bgY}%`,
                  backgroundRepeat: 'no-repeat',
                  transform: `scale(${bgZoom})`,
                  transformOrigin: 'center center',
                }}
              />
            ) : (
              imagesToUse.length > 0 && imagesToUse.filter(Boolean).length > 0 ? (
                imagesToUse.filter(Boolean).map((bgImage, index) => {
                  const cropData = cropDataArray?.[index];
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 0,
                        opacity: index === currentSlide ? 1 : 0,
                        transition: 'opacity 1000ms ease-in-out',
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: isMobile && cropData ? `${100 / cropData.zoom}%` : "cover",
                        backgroundPosition: isMobile && cropData
                          ? `${cropData.x}% ${cropData.y}%`
                          : "center",
                        backgroundRepeat: 'no-repeat',
                        ...(hasTempBackgroundAdjustments ? {
                          transform: `scale(${bgZoom})`,
                          transformOrigin: 'center center',
                        } : {}),
                      }}
                    />
                  );
                })
              ) : null
            )}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, ...getOverlayStyle() }} />
          </div>
        );
      })()}

      {/* Background image edit zone */}
      <EditableZone field="backgroundImage" category="backgrounds" label="Background Image" className="absolute inset-0 z-0" />

      {/* Content */}
      <div className="relative z-10 w-full mx-auto px-4 md:px-8 lg:px-16 flex flex-col items-center gap-6 md:gap-8 lg:gap-10" style={{ transform: `${prePrintActive ? `scale(${printResizeScale / 100})` : 'scale(1)'}`, transformOrigin: "center center" }}>
        {/* Host Line Image */}
        {data.heroHostLineImage && data.heroHostLineImage !== "hostline-00" && (
          <div
            id="hero-hostline-image"
            className={`relative ${editMode ? "cursor-pointer select-none" : "pointer-events-none"}`}
            onClick={editMode ? (e) => {
              if (hostLineImageDragRef.current?.triggered) { e.stopPropagation(); hostLineImageDragRef.current = null; return; }
              const images: ("hostline-01" | "hostline-02" | "hostline-03" | "hostline-04" | "hostline-05" | "hostline-06" | "hostline-07" | "hostline-08" | "hostline-09")[] = ["hostline-01", "hostline-02", "hostline-03", "hostline-04", "hostline-05", "hostline-06", "hostline-07", "hostline-08", "hostline-09"];
              const currentImage = heroMergedData.heroHostLineImage === "hostline-00" ? "hostline-01" : heroMergedData.heroHostLineImage || "hostline-01";
              const currentIndex = images.indexOf(currentImage as any);
              const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % images.length;
              handleHeroChange("heroHostLineImage", images[nextIndex]);
            } : undefined}
            onPointerDown={editMode ? hostLineImageDrag.handleDown : undefined}
            onPointerMove={editMode ? hostLineImageDrag.handleMove : undefined}
            onPointerUp={editMode ? hostLineImageDrag.handleUp : undefined}
            onPointerCancel={editMode ? hostLineImageDrag.handleCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              transform: `scale(${(mergedData.heroHostLineImageSize ?? 100) / 100})`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {hostLineImageDragging && renderArrowOverlay(mergedData.heroHostLineImageSize ?? 100)}
            <div
              className="temp-mask-color w-56 h-32 max-w-[80vw]"
              style={{
                backgroundColor: heroMergedData.heroOthersColor || data.heroIconTextColor || "white",
                opacity: heroMergedData.heroHostLineImageOpacity ?? 1,
                WebkitMaskImage: `url(/assets/${heroMergedData.heroHostLineImage || data.heroHostLineImage}.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url(/assets/${heroMergedData.heroHostLineImage || data.heroHostLineImage}.png)`,
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat"
              }}
            />
          </div>
        )}

        {/* Invite message (hostline text) */}
        <div
          className={`relative -mt-14 ${editMode ? "cursor-pointer select-none" : ""}`}
          onClick={editMode ? (e) => {
            if (hostLineTextDragRef.current?.triggered) { e.stopPropagation(); hostLineTextDragRef.current = null; return; }
            const currentOpacity = heroMergedData.heroHostLineImageOpacity ?? 1;
            const newOpacity = currentOpacity > 0.5 ? 0 : 1;
            handleHeroChange("heroHostLineImageOpacity", newOpacity);
          } : undefined}
          onPointerDown={editMode ? hostLineTextDrag.handleDown : undefined}
          onPointerMove={editMode ? hostLineTextDrag.handleMove : undefined}
          onPointerUp={editMode ? hostLineTextDrag.handleUp : undefined}
          onPointerCancel={editMode ? hostLineTextDrag.handleCancel : undefined}
          onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
          style={{
            transform: `scale(${(mergedData.heroHostLineTextSize ?? 100) / 100})`,
            marginBottom: `${(mergedData.heroHostLineTextSpacing ?? 100) * 0.4}px`,
            touchAction: editMode ? 'pan-y' : 'auto',
            WebkitTouchCallout: 'none',
          } as React.CSSProperties}
        >
          {hostLineTextDragging && renderArrowOverlay(mergedData.heroHostLineTextSize ?? 100)}
          <p
            id="hero-message"
            className={`text-[9px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase`}
            style={{
              color: heroMergedData.heroIconTextColor || "white",
              fontFamily: getFontFamily(heroMergedData.heroOthersTypography || data.bodyFont, "body"),
              textShadow: `0 2px 4px rgba(0, 0, 0, ${heroMergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1) * (heroMergedData.heroOthersTextSize ?? 1) * 100}%`
            }}
          >
            {data.heroMessage || "We are getting married!"}
          </p>
        </div>

        {/* Couple Name */}
        <div
          className={`relative ${editMode ? "cursor-pointer select-none" : ""}`}
          onClick={editMode ? (e) => {
            if (nameDragRef.current?.triggered) { e.stopPropagation(); nameDragRef.current = null; return; }
            setShowNamePanel(true);
            document.getElementById('hero-hostline-image')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } : undefined}
          onPointerDown={editMode ? nameDrag.handleDown : undefined}
          onPointerMove={editMode ? nameDrag.handleMove : undefined}
          onPointerUp={editMode ? nameDrag.handleUp : undefined}
          onPointerCancel={editMode ? nameDrag.handleCancel : undefined}
          onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
          style={{
            touchAction: editMode ? 'pan-y' : 'auto',
            WebkitTouchCallout: 'none',
          } as React.CSSProperties}
        >
          {nameDragging && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
              {(mergedData.heroNameSize ?? 100) < 200 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hero-arrow-up" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z" /></svg>
                </div>
              )}
              {(mergedData.heroNameSize ?? 100) > 50 && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hero-arrow-down" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z" /></svg>
                </div>
              )}
            </div>
          )}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl leading-tight"
            style={{
              fontFamily: getFontFamily(mergedData.heroDisplayNameTypography || data.headingFont, "heading"),
              color: mergedData.heroIconTextColor || "white",
              whiteSpace: mergedData.heroAmpersandPosition === "default" ? "nowrap" : "pre-line",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              transform: `scale(${(mergedData.heroNameSize || 100) / 100 * 1.6})`,
              margin: isMobile 
                ? `${24 + (7.2 * ((mergedData.heroNameSize || 100) - 100) / 10)}px 0`
                : `${24 + (7.2 * Math.floor((mergedData.heroNameSize || 100) / 10) - 10)}px 0`
            }}
          >
            {(() => {
              if (data.nameType === "couple") {
                const name1 = mergedData.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                const name2 = mergedData.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                const andText = data.andText || "&";
                const ampersandScale = (mergedData.heroAmpersandSize || 100) / 100;
                const ampersandOpacity = (mergedData.heroAmpersandOpacity || 100) / 100;
                const ampersandStyle: React.CSSProperties = {
                  display: "inline-block",
                  transform: `scale(${ampersandScale})`,
                  opacity: ampersandOpacity,
                  fontFamily: getFontFamily(mergedData.heroAmpersandTypography || data.headingFont, "heading"),
                  touchAction: editMode ? 'pan-y' : 'auto',
                  WebkitTouchCallout: 'none',
                };
                const ampersandEl = editMode ? (
                  <span
                    className="relative inline-block cursor-pointer select-none"
                    style={ampersandStyle}
                    onClick={(e) => {
                      if (ampersandDragRef.current?.triggered) { e.stopPropagation(); ampersandDragRef.current = null; return; }
                    }}
                    onPointerDown={editMode ? (e) => { e.stopPropagation(); ampersandDrag.handleDown(e); } : undefined}
                    onPointerMove={editMode ? (e) => { e.stopPropagation(); ampersandDrag.handleMove(e); } : undefined}
                    onPointerUp={editMode ? (e) => { e.stopPropagation(); ampersandDrag.handleUp(e); } : undefined}
                    onPointerCancel={editMode ? (e) => { e.stopPropagation(); ampersandDrag.handleCancel(e); } : undefined}
                    onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
                  >
                    {ampersandDragging && (
                      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                        {(mergedData.heroAmpersandSize ?? 100) < 250 && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 hero-arrow-up" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z" /></svg>
                          </div>
                        )}
                        {(mergedData.heroAmpersandSize ?? 100) > 50 && (
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 hero-arrow-down" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z" /></svg>
                          </div>
                        )}
                        {(mergedData.heroAmpersandOpacity ?? 100) > 10 && (
                          <div className="absolute -left-4 top-1/2 -translate-y-1/2 hero-arrow-left" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12l8-8v16z" /></svg>
                          </div>
                        )}
                        {(mergedData.heroAmpersandOpacity ?? 100) < 100 && (
                          <div className="absolute -right-4 top-1/2 -translate-y-1/2 hero-arrow-right" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12l-8-8v16z" /></svg>
                          </div>
                        )}
                      </div>
                    )}
                    {andText}
                  </span>
                ) : (
                  <span style={ampersandStyle}>{andText}</span>
                );

                switch (mergedData.heroAmpersandPosition) {
                  case "first-line":
                    return <>{name1} {ampersandEl}<br/>{name2}</>;
                  case "middle-line":
                    return <>{name1}<br/>{ampersandEl}<br/>{name2}</>;
                  case "second-line":
                    return <>{name1}<br/>{ampersandEl} {name2}</>;
                  case "default":
                  default:
                    return <>{name1} {ampersandEl} {name2}</>;
                }
              }
              return <>{displayName}</>;
            })()}
          </h1>
        </div>

        {/* Date - Box Layout (Default Structure) */}
        {dateComponents && mergedData.heroDateStructure !== "alternative" && mergedData.heroDateStructure !== "icon" && mergedData.heroDateStructure !== "elegant" && mergedData.heroDateStructure !== "modern" && mergedData.heroDateStructure !== "huge" && (
          <div 
            id="hero-date"
            className={`flex flex-col items-center gap-1 font-sans ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (dateDragRef.current?.triggered) { e.stopPropagation(); dateDragRef.current = null; return; }
              const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
              const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
              handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as any);
            } : undefined}
            onPointerDown={editMode ? handleDatePointerDown : undefined}
            onPointerMove={editMode ? handleDatePointerMove : undefined}
            onPointerUp={editMode ? handleDatePointerUp : undefined}
            onPointerCancel={editMode ? handleDatePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{ 
              color: mergedData.heroOthersColor || "white", 
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {dateDragging && renderArrowOverlay(mergedData.heroDateStructureSize ?? 100)}
            {/* Top box - Month */}
            <div
              className="text-[clamp(0.625rem,2.5vw,0.75rem)] md:text-sm tracking-[0.2em] uppercase font-bold text-center"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.month}
            </div>

            {/* Middle row - 5 boxes */}
            <div className="flex items-center gap-0 w-full max-w-sm">
              {/* Box 1: Day with left-fading line */}
              <div className="flex items-center justify-end shrink-0 w-[clamp(80px,25vw,128px)] md:w-32">
                <div className="flex-1 min-w-0 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" />
                <div 
                  className="text-[clamp(0.5rem,2.5vw,0.75rem)] md:text-xs whitespace-nowrap shrink-0 tracking-[0.2em] uppercase text-right"
                  style={{
                    fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                  }}
                >
                  {dateComponents.day}
                </div>
              </div>

              {/* Box 2: Line divider */}
              <div className="flex justify-center shrink-0">
                <div className="w-[clamp(8px,2.5vw,16px)] md:w-4 h-[1px] bg-current opacity-50" />
              </div>

              {/* Box 3: Date number (largest) */}
              <div className="flex-1 flex items-center justify-center text-[clamp(1rem,5vw,1.5rem)] md:text-4xl font-bold tracking-[0.1em]">
                {dateComponents.date}
              </div>

              {/* Box 4: Line divider */}
              <div className="flex justify-center shrink-0">
                <div className="w-[clamp(8px,2.5vw,16px)] md:w-4 h-[1px] bg-current opacity-50" />
              </div>

              {/* Box 5: Time with right-fading line */}
              <div className="flex items-center justify-start shrink-0 w-[clamp(80px,25vw,128px)] md:w-32">
                <div 
                  className="text-[clamp(0.5rem,2.5vw,0.75rem)] md:text-xs whitespace-nowrap shrink-0 tracking-[0.2em] uppercase text-left"
                  style={{
                    fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                  }}
                >
                  {data.time || "4:00 PM"}
                </div>
                <div className="flex-1 min-w-0 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" />
              </div>
            </div>

            {/* Bottom box - Year */}
            <div 
              className="text-[clamp(0.625rem,2.5vw,0.75rem)] md:text-sm tracking-[0.2em] uppercase font-bold text-center"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.year}
            </div>
          </div>
        )}

        {/* Date - Alternative Structure */}
        {dateComponents && mergedData.heroDateStructure === "alternative" && (
          <div 
            id="hero-date"
            className={`flex flex-col items-center gap-1 font-sans text-center ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (dateDragRef.current?.triggered) { e.stopPropagation(); dateDragRef.current = null; return; }
              const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
              const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
              handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as any);
            } : undefined}
            onPointerDown={editMode ? handleDatePointerDown : undefined}
            onPointerMove={editMode ? handleDatePointerMove : undefined}
            onPointerUp={editMode ? handleDatePointerUp : undefined}
            onPointerCancel={editMode ? handleDatePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{ 
              color: mergedData.heroOthersColor || "white", 
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {dateDragging && renderArrowOverlay(mergedData.heroDateStructureSize ?? 100)}
            <div 
              className="text-sm tracking-[0.1em]"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              On the {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
            </div>
            <div
              className="text-xs tracking-[0.1em]"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
            </div>
          </div>
        )}

        {/* Date - Icon Structure */}
        {dateComponents && mergedData.heroDateStructure === "icon" && (
          <div
            id="hero-date"
            className={`flex flex-col items-center gap-1 font-sans text-center ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (dateDragRef.current?.triggered) { e.stopPropagation(); dateDragRef.current = null; return; }
              const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
              const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
              handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as any);
            } : undefined}
            onPointerDown={editMode ? handleDatePointerDown : undefined}
            onPointerMove={editMode ? handleDatePointerMove : undefined}
            onPointerUp={editMode ? handleDatePointerUp : undefined}
            onPointerCancel={editMode ? handleDatePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {dateDragging && renderArrowOverlay(mergedData.heroDateStructureSize ?? 100)}
            <div
              className="w-6 h-6"
              style={{
                backgroundColor: mergedData.heroOthersColor || data.heroIconTextColor || data.heroIconColorTint || data.accentColor || "white",
                WebkitMaskImage: "url(/assets/date.svg)",
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: "url(/assets/date.svg)",
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat"
              }}
            />
            <div
              className="text-sm tracking-[0.1em]"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              The {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
            </div>
            <div
              className="text-xs tracking-[0.1em]"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
            </div>
          </div>
        )}

        {/* Date - Elegant Structure */}
        {dateComponents && mergedData.heroDateStructure === "elegant" && (
          <div
            id="hero-date"
            className={`flex items-center gap-0 font-sans text-center ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (dateDragRef.current?.triggered) { e.stopPropagation(); dateDragRef.current = null; return; }
              const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
              const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
              handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as any);
            } : undefined}
            onPointerDown={editMode ? handleDatePointerDown : undefined}
            onPointerMove={editMode ? handleDatePointerMove : undefined}
            onPointerUp={editMode ? handleDatePointerUp : undefined}
            onPointerCancel={editMode ? handleDatePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {dateDragging && renderArrowOverlay(mergedData.heroDateStructureSize ?? 100)}
            {/* Box 1: Month (aligned right) */}
            <div
              className="flex-1 text-right pr-2 text-sm tracking-[0.2em] uppercase font-light"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.month}
            </div>

            {/* Divider 1 */}
            <div className="text-xs font-light">|</div>

            {/* Box 2: Date (centered) */}
            <div className="flex-1 text-center px-2 text-3xl font-light tracking-[0.1em]">
              {String(dateComponents.date).padStart(2, '0')}
            </div>

            {/* Divider 2 */}
            <div className="text-xs font-light">|</div>

            {/* Box 3: Year (aligned left) */}
            <div
              className="flex-1 text-left pl-2 text-sm tracking-[0.2em] uppercase font-light"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.year}
            </div>
          </div>
        )}

        {/* Date - Modern Structure */}
        {dateComponents && mergedData.heroDateStructure === "modern" && (
          <div
            id="hero-date"
            className={`flex items-center gap-0 font-sans text-center ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (dateDragRef.current?.triggered) { e.stopPropagation(); dateDragRef.current = null; return; }
              const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
              const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
              handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as any);
            } : undefined}
            onPointerDown={editMode ? handleDatePointerDown : undefined}
            onPointerMove={editMode ? handleDatePointerMove : undefined}
            onPointerUp={editMode ? handleDatePointerUp : undefined}
            onPointerCancel={editMode ? handleDatePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {dateDragging && renderArrowOverlay(mergedData.heroDateStructureSize ?? 100)}
            {/* Box 1: Day and time (aligned right) */}
            <div className="flex-1 text-right pr-2 flex flex-col items-end gap-0">
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{
                  fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                }}
              >
                {dateComponents.dayFull || dateComponents.day}
              </div>
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{
                  fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                }}
              >
                {data.time ? data.time.split(' ')[0] : "2:00"}
              </div>
            </div>
            
            {/* Divider 1 */}
            <div className="text-lg font-light opacity-50">|</div>
            
            {/* Box 2: Date (centered, 4x huge) */}
            <div className="flex-1 text-center px-2 text-3xl font-bold tracking-[0.1em]">
              {dateComponents.date}
            </div>
            
            {/* Divider 2 */}
            <div className="text-lg font-light opacity-50">|</div>
            
            {/* Box 3: Month and year (aligned left) */}
            <div className="flex-1 text-left pl-2 flex flex-col items-start gap-0">
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{
                  fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                }}
              >
                {dateComponents.monthFull || dateComponents.month}
              </div>
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{
                  fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                }}
              >
                {dateComponents.year}
              </div>
            </div>
          </div>
        )}

        {/* Date - Huge Structure */}
        {dateComponents && mergedData.heroDateStructure === "huge" && (
          <div
            id="hero-date"
            className={`flex flex-col items-center gap-3 font-sans ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (dateDragRef.current?.triggered) { e.stopPropagation(); dateDragRef.current = null; return; }
              const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
              const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
              handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as any);
            } : undefined}
            onPointerDown={editMode ? handleDatePointerDown : undefined}
            onPointerMove={editMode ? handleDatePointerMove : undefined}
            onPointerUp={editMode ? handleDatePointerUp : undefined}
            onPointerCancel={editMode ? handleDatePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * (!isMobile ? 24 : 16)}px`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.2}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginLeft: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginRight: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {dateDragging && renderArrowOverlay(mergedData.heroDateStructureSize ?? 100)}
            {/* Top box - Month - aligned with date number */}
            <div className="flex items-center gap-0 w-auto">
              {/* Left spacer to match day section */}
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
              {/* Left divider spacer */}
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              {/* Month text - centered where date number will be */}
              <div
                className="flex-1 text-center tracking-[0.2em] uppercase font-bold"
                style={{
                  fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body"),
                  fontSize: '0.875em'
                }}
              >
                {dateComponents.month}
              </div>
              {/* Right divider spacer */}
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              {/* Right spacer to match time section */}
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
            </div>

            {/* Middle row - 5 boxes with centered date number */}
            <div className="flex items-center gap-0 w-auto">
              {/* Box 1: Day with left-fading line */}
              <div className="flex items-center justify-end shrink-0 w-20 md:w-32 lg:w-40">
                <div
                  className="w-16 md:w-24 lg:w-32 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50"
                  style={{
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`
                  }}
                />
                <div
                  className="text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase text-right"
                  style={{
                    fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                  }}
                >
                  {dateComponents.day}
                </div>
              </div>

              {/* Box 2: Line divider */}
              <div className="flex justify-center shrink-0">
              <div 
                className="w-4 md:w-6 h-[1px] bg-current opacity-50"
                style={{
                  textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`
                }}
              />
              </div>

              {/* Box 3: Date number (massive - text-8xl) - centered */}
              <div 
                className="flex-1 flex items-center justify-center text-4xl md:text-6xl lg:text-8xl xl:text-9xl tracking-[0.1em]"
                style={{
                  fontFamily: '"Yeseva One", "Croissant One", serif',
                  fontWeight: 400
                }}
              >
                {dateComponents.date}
              </div>

              {/* Box 4: Line divider */}
              <div className="flex justify-center shrink-0">
              <div 
                className="w-4 md:w-6 h-[1px] bg-current opacity-50"
                style={{
                  textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`
                }}
              />
              </div>

              {/* Box 5: Time with right-fading line */}
              <div className="flex items-center justify-start shrink-0 w-20 md:w-32 lg:w-40">
                <div
                  className="text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase text-left whitespace-nowrap"
                  style={{
                    fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                  }}
                >
                  {data.time || "4:00 PM"}
                </div>
                <div
                  className="w-16 md:w-24 lg:w-32 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50"
                  style={{
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`
                  }}
                />
              </div>
            </div>

            {/* Bottom box - Year - aligned with date number */}
            <div className="flex items-center gap-0 w-auto">
              {/* Left spacer to match day section */}
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
              {/* Left divider spacer */}
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              {/* Year text - centered where date number is */}
              <div
                className="flex-1 text-center text-sm md:text-base lg:text-lg tracking-[0.2em] uppercase font-bold"
                style={{
                  fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                }}
              >
                {dateComponents.year}
              </div>
              {/* Right divider spacer */}
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              {/* Right spacer to match time section */}
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
            </div>

            {/* Divider below year with fade effects */}
            <div className="flex justify-center w-full max-w-xs mt-4">
              <div 
                className="w-20 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-60"
                style={{
                  textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`
                }}
              />
            </div>
          </div>
        )}

        {/* Ceremony Venue */}
        {data.venueName && (
          <div 
            className={`flex flex-col items-center gap-1 -mt-14 ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (venueDragRef.current?.triggered) { e.stopPropagation(); venueDragRef.current = null; return; }
              onUpdateHeroVenueStructure?.(data.heroVenueStructure === "icon" ? "default" : "icon");
            } : undefined}
            onPointerDown={editMode ? handleVenuePointerDown : undefined}
            onPointerMove={editMode ? handleVenuePointerMove : undefined}
            onPointerUp={editMode ? handleVenuePointerUp : undefined}
            onPointerCancel={editMode ? handleVenuePointerCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              transform: `scale(${(mergedData.heroVenueSize ?? 100) / 100})`,
              marginBottom: `${(mergedData.heroVenueSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {venueDragging && renderArrowOverlay(mergedData.heroVenueSize ?? 100)}
            {/* Icon structure */}
            {data.heroVenueStructure === "icon" && (
              <div 
                className="temp-mask-color w-6 h-6"
                style={{ 
                  backgroundColor: mergedData.heroOthersColor || data.heroIconTextColor || data.heroIconColorTint || data.accentColor || "white",
                  WebkitMaskImage: "url(/assets/loc.svg)",
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: "url(/assets/loc.svg)",
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat"
                }}
              />
            )}
            <p
              className="tracking-[0.1em] uppercase font-bold"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body"),
                color: mergedData.heroIconTextColor || "white",
                textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
                fontSize: `calc(10px * ${(mergedData.heroOthersTextSize ?? 1)})`
              }}
            >
              {data.venueName}
            </p>
          </div>
        )}

        {/* Closing Sentiment */}
        {data.heroClosingSentiment && (
          <div
            className={`relative -mt-8 ${editMode ? "cursor-pointer select-none" : ""}`}
            onClick={editMode ? (e) => {
              if (fsentimentTextDragRef.current?.triggered) { e.stopPropagation(); fsentimentTextDragRef.current = null; return; }
              const currentOpacity = heroMergedData.heroClosingSentimentImageOpacity ?? 1;
              const newOpacity = currentOpacity > 0.5 ? 0 : 1;
              handleHeroChange("heroClosingSentimentImageOpacity", newOpacity);
            } : undefined}
            onPointerDown={editMode ? fsentimentTextDrag.handleDown : undefined}
            onPointerMove={editMode ? fsentimentTextDrag.handleMove : undefined}
            onPointerUp={editMode ? fsentimentTextDrag.handleUp : undefined}
            onPointerCancel={editMode ? fsentimentTextDrag.handleCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              transform: `scale(${(mergedData.heroClosingSentimentTextSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroClosingSentimentTextSpacing ?? 100) * 0.1}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {fsentimentTextDragging && renderArrowOverlay(mergedData.heroClosingSentimentTextSize ?? 100)}
            <p
              className="text-[9px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase"
              style={{
                fontFamily: getFontFamily(heroMergedData.heroOthersTypography || data.bodyFont, "body"),
                color: heroMergedData.heroIconTextColor || "white",
                textShadow: `0 2px 4px rgba(0, 0, 0, ${heroMergedData.heroTextShadowOpacity ?? 0.1})`,
                fontSize: `${(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1) * (heroMergedData.heroOthersTextSize ?? 1) * 100}%`
              }}
            >
              {data.heroClosingSentiment}
            </p>
          </div>
        )}

        {/* Closing Sentiment Image */}
        {data.heroClosingSentimentImage && data.heroClosingSentimentImage !== "fsentiment-00" && (
          <div
            className={`relative -mt-14 ${editMode ? "cursor-pointer select-none" : "pointer-events-none"}`}
            onClick={editMode ? (e) => {
              if (fsentimentImageDragRef.current?.triggered) { e.stopPropagation(); fsentimentImageDragRef.current = null; return; }
              const images: ("fsentiment-01" | "fsentiment-02" | "fsentiment-03" | "fsentiment-04" | "fsentiment-05" | "fsentiment-06" | "fsentiment-07")[] = ["fsentiment-01", "fsentiment-02", "fsentiment-03", "fsentiment-04", "fsentiment-05", "fsentiment-06", "fsentiment-07"];
              const currentImage = heroMergedData.heroClosingSentimentImage === "fsentiment-00" ? "fsentiment-01" : heroMergedData.heroClosingSentimentImage || "fsentiment-01";
              const currentIndex = images.indexOf(currentImage as any);
              const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % images.length;
              handleHeroChange("heroClosingSentimentImage", images[nextIndex]);
            } : undefined}
            onPointerDown={editMode ? fsentimentImageDrag.handleDown : undefined}
            onPointerMove={editMode ? fsentimentImageDrag.handleMove : undefined}
            onPointerUp={editMode ? fsentimentImageDrag.handleUp : undefined}
            onPointerCancel={editMode ? fsentimentImageDrag.handleCancel : undefined}
            onContextMenu={editMode ? (e) => e.preventDefault() : undefined}
            style={{
              transform: `scale(${(mergedData.heroClosingSentimentImageSize ?? 100) / 100})`,
              marginBottom: `${(mergedData.heroClosingSentimentImageSpacing ?? 100) * 0.4}px`,
              touchAction: editMode ? 'pan-y' : 'auto',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties}
          >
            {fsentimentImageDragging && renderArrowOverlay(mergedData.heroClosingSentimentImageSize ?? 100)}
            <div
              className="temp-mask-color w-56 h-32 max-w-[80vw]"
              style={{
                backgroundColor: heroMergedData.heroOthersColor || data.heroIconTextColor || "white",
                opacity: heroMergedData.heroClosingSentimentImageOpacity ?? 1,
                WebkitMaskImage: `url(/assets/${heroMergedData.heroClosingSentimentImage || data.heroClosingSentimentImage}.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url(/assets/${heroMergedData.heroClosingSentimentImage || data.heroClosingSentimentImage}.png)`,
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat"
              }}
            />
          </div>
        )}

        {/* Spacer below closing sentiment image */}
        <div style={{ height: '20px' }} />
      </div>

      {/* Name Adjustment Panel */}
      {editMode && showNamePanel && (
        <>
          {/* Backdrop */}
          {!isNamePanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseNamePanel} onWheel={handleCloseNamePanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isNamePanelClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isNamePanelClosing ? "animate-slide-down" : "animate-slide-up"}`
            }`}
            style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          >
            {/* Handle bar - only show in mobile mode */}
            {!desktopMode && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Hero Section Settings
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Typography dropdown */}
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Name Typography</label>
                <HybridFontControl
                  value={mergedData.heroDisplayNameTypography || data.headingFont}
                  onChange={(v) => handleNameChange('heroDisplayNameTypography', v)}
                  type="heading"
                  label=""
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>

              {/* Ampersand Typography dropdown */}
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Ampersand(&) Typography</label>
                <HybridFontControl
                  value={mergedData.heroAmpersandTypography || data.headingFont}
                  onChange={(v) => handleNameChange('heroAmpersandTypography', v)}
                  type="heading"
                  label=""
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>

              {/* Ampersand position dropdown */}
              <HybridDropdown
                label="Ampersand(&) position"
                value={mergedData.heroAmpersandPosition ?? "default"}
                options={[
                  { name: "Default (same line)", value: "default" },
                  { name: "First line", value: "first-line" },
                  { name: "Middle line", value: "middle-line" },
                  { name: "Second line", value: "second-line" }
                ]}
                onChange={(value) => handleNameChange('heroAmpersandPosition', value as "default" | "first-line" | "middle-line" | "second-line")}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
              />

              {/* Reverse names toggle */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Reverse names</span>
                <button
                  type="button"
                  onClick={() => handleNameChange('heroIconName2First', !(mergedData.heroIconName2First ?? false))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none`}
                  style={{
                    backgroundColor: (mergedData.heroIconName2First ?? false) ? accentColor : (isDarkMode ? '#4B5563' : '#D1D5DB')
                  }}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                      (mergedData.heroIconName2First ?? false) ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Text color picker */}
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Color</label>
                <ColorControl
                  value={data.heroIconTextColor ?? ""}
                  onChange={(value: string) => handleNameChange('heroIconTextColor', value)}
                  label=""
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />
              </div>

              {/* Text shadow opacity slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Shadow Opacity</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{Math.round((mergedData.heroTextShadowOpacity ?? 0.1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((mergedData.heroTextShadowOpacity ?? 0.1) * 100)}
                  onChange={(e) => handleNameChange('heroTextShadowOpacity', e.target.valueAsNumber / 100)}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.heroTextShadowOpacity ?? 0.1) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.heroTextShadowOpacity ?? 0.1) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

              {/* Others Section */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>Others</label>
                </div>
                
                {/* Typography */}
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Typography</label>
                  <HybridFontControl
                    value={mergedData.heroOthersTypography || data.bodyFont}
                    onChange={(v) => handleNameChange('heroOthersTypography', v)}
                    type="body"
                    label=""
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    predefinedFonts={predefinedBodyFonts}
                  />
                </div>

                {/* Others Color */}
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Others Color</label>
                  <ColorControl
                    value={mergedData.heroOthersColor ?? ""}
                    onChange={(value: string) => handleNameChange('heroOthersColor', value)}
                    label=""
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    predefinedColors={predefinedSectionColors.map(c => c.value)}
                  />
                </div>
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

              {/* Background Overlay Section */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Overlay</label>
                </div>

                {/* Overlay Type */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Overlay Type</label>
                  <select
                    value={mergedData.heroBackgroundOverlay ?? "solid"}
                    onChange={(e) => handleNameChange("heroBackgroundOverlay", e.target.value as "solid" | "gradient")}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={{ ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }), fontFamily: "Inter, sans-serif" }}
                  >
                    <option value="solid">Solid Color</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                {/* Overlay Color 1 */}
                <ColorControl
                  label="Overlay Color 1"
                  value={mergedData.heroOverlayColor1 ?? ""}
                  onChange={(value: string) => handleNameChange("heroOverlayColor1", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />

                {/* Transparency for Color 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Transparency</label>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {Math.round((mergedData.heroOverlayOpacity1 ?? 0.7) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mergedData.heroOverlayOpacity1 ?? 0.7}
                    onChange={(e) => handleNameChange("heroOverlayOpacity1", parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroOverlayOpacity1 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) ${((mergedData.heroOverlayOpacity1 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) 100%)`,
                    }}
                  />
                </div>

                {/* Overlay Color 2 - only for gradient */}
                {(mergedData.heroBackgroundOverlay ?? "solid") === "gradient" && (
                  <ColorControl
                    label="Overlay Color 2"
                    value={mergedData.heroOverlayColor2 ?? ""}
                    onChange={(value: string) => handleNameChange("heroOverlayColor2", value)}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    predefinedColors={predefinedSectionColors.map(c => c.value)}
                  />
                )}

                {/* Transparency for Color 2 - only for gradient */}
                {(mergedData.heroBackgroundOverlay ?? "solid") === "gradient" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Transparency</label>
                      <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {Math.round((mergedData.heroOverlayOpacity2 ?? 0.7) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={mergedData.heroOverlayOpacity2 ?? 0.7}
                      onChange={(e) => handleNameChange("heroOverlayOpacity2", parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroOverlayOpacity2 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) ${((mergedData.heroOverlayOpacity2 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) 100%)`,
                      }}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Close button - outside scrollable area */}
            <div className={`px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-end ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <button
                type="button"
                onClick={handleCloseNamePanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: accentColor
                }}
              >
                Close
              </button>
            </div>

          </div>
        </>
      )}

      {/* Date Structure Panel */}
      {editMode && showDateStructurePanel && (
        <>
          {/* Backdrop */}
          {!isDateStructurePanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseDateStructurePanel} onWheel={handleCloseDateStructurePanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isDateStructurePanelClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isDateStructurePanelClosing ? "animate-slide-down" : "animate-slide-up"}`
            }`}
            style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          >
            {/* Handle bar - only show in mobile mode */}
            {!desktopMode && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Date Design
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-4">
              {/* Structure Selection */}
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Structure</label>
                
                {/* Structure Selection */}
                <div className="flex items-center justify-center py-4">
                  {/* Previous Arrow */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isDateStructureTransitioning) return;
                      setIsDateStructureTransitioning(true);
                      const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : dateStructures.length - 1;
                      setTimeout(() => {
                        handleDateStructureChange('heroDateStructure', dateStructures[prevIndex].id as "default" | "alternative" | "icon" | "elegant" | "modern" | "huge");
                        setTimeout(() => setIsDateStructureTransitioning(false), 50);
                      }, 150);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                    }`}
                    disabled={dateStructures.length <= 1 || isDateStructureTransitioning}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Structure Name */}
                  <div className="flex-1 px-6 text-center">
                    <span className={`text-sm font-medium transition-opacity duration-150 ${
                      isDateStructureTransitioning ? "opacity-0" : "opacity-100"
                    } ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {dateStructures[dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"))]?.name || "Default Layout"}
                    </span>
                  </div>

                  {/* Next Arrow */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isDateStructureTransitioning) return;
                      setIsDateStructureTransitioning(true);
                      const currentIndex = dateStructures.findIndex(s => s.id === (mergedData.heroDateStructure ?? "default"));
                      const nextIndex = currentIndex < dateStructures.length - 1 ? currentIndex + 1 : 0;
                      setTimeout(() => {
                        handleDateStructureChange('heroDateStructure', dateStructures[nextIndex].id as "default" | "alternative" | "icon" | "elegant" | "modern" | "huge");
                        setTimeout(() => setIsDateStructureTransitioning(false), 50);
                      }, 150);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                    }`}
                    disabled={dateStructures.length <= 1 || isDateStructureTransitioning}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Date Structure Size Slider */}
              <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Size</label>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  {Math.round((mergedData.heroDateStructureSize ?? 100) * 1)}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={mergedData.heroDateStructureSize ?? 100}
                onChange={(e) => handleDateStructureChange('heroDateStructureSize', parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroDateStructureSize ?? 100) - 50) / 100 * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${((mergedData.heroDateStructureSize ?? 100) - 50) / 100 * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                }}
              />
            </div>

            {/* Date Structure Spacing Slider */}
              <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Spacing</label>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  {Math.round((mergedData.heroDateStructureSpacing ?? 100) * 1)}%
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="200"
                step="1"
                value={mergedData.heroDateStructureSpacing ?? 100}
                onChange={(e) => handleDateStructureChange('heroDateStructureSpacing', parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroDateStructureSpacing ?? 100) - 100) / 100 * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${((mergedData.heroDateStructureSpacing ?? 100) - 100) / 100 * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                }}
              />
              </div>
            </div>

            {/* Close Button */}
            <div className={`px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-end ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <button
                type="button"
                onClick={handleCloseDateStructurePanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: accentColor
                }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

    </section>
  );
}
