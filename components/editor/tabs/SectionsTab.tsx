import type { InvitationData, InvitationSections, DividerType, StockAsset } from "@/lib/types/invitation";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchAssets } from "@/lib/utils";
import QRUpload from "../QRUpload";
import EditableZone from "@/components/invitation/EditableZone";
import ColorControl from "@/components/shared/ColorControl";
import FontControl from "@/components/shared/FontControl";
import ImageCropper, { type CropData } from "../ImageCropper";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function Toggle({
  label,
  description,
  checked,
  onToggle,
  isDarkMode = false,
  accentColor = "#B88A78",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  isDarkMode?: boolean;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{label}</p>
        {description && <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>{description}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "" : (isDarkMode ? "bg-gray-700" : "bg-gray-200")
        }`}
        style={{ backgroundColor: checked ? accentColor : undefined }}
      >
        <div className="absolute inset-0 flex items-center px-0.5">
          <div
            className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              checked ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </div>
      </button>
    </div>
  );
}

interface SectionsTabProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onPendingEntourageChange?: (changes: any) => void;
  onLocalVisibleSectionsChange?: (sections: Record<string, boolean>) => void;
  invitationId?: string;
}

const ALL_SECTIONS = [
  { id: "hero", label: "Hero", description: "Couple names and invitation message", locked: true },
  { id: "event-details", label: "Event Details", description: "Date, time, and venue information", locked: false },
  { key: "gallery" as const, label: "Photo Gallery", description: "Display a grid of couple photos" },
  { key: "map" as const, label: "Map / Location", description: "Show venue map and directions" },
  { key: "rsvp" as const, label: "RSVP Form", description: "Let guests confirm attendance" },
  { key: "timeline" as const, label: "Love Story", description: "Couple timeline & story" },
  { key: "countdown" as const, label: "Countdown", description: "Countdown timer to the wedding day" },
  { key: "dresscode" as const, label: "Dress Code", description: "Specify the dress code for guests" },
  { key: "giftguide" as const, label: "Gift Guide", description: "Bank and wallet information for gifts" },
  { id: "wedding-directory", key: "weddingdirectory" as const, label: "Wedding Directory", description: "Wedding directory and details" },
  { key: "entourage" as const, label: "Entourage", description: "Wedding entourage and participants" },
  { key: "footer" as const, label: "Footer", description: "Couple name and venue at the bottom" },
];

export default function SectionsTab({ data, onChange, isDarkMode = false, accentColor = "#B88A78", onPendingEntourageChange, onLocalVisibleSectionsChange, invitationId }: SectionsTabProps) {
  const defaultSectionOrder = ["hero", "event-details", "gallery", "map", "rsvp", "timeline", "countdown", "dresscode", "giftguide", "wedding-directory", "entourage", "footer"];
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [localVisibleSections, setLocalVisibleSections] = useState(data.entourage?.visibleSections || {});
  const [pendingEntourageChanges, setPendingEntourageChanges] = useState(data.entourage || {});
  const baseSectionOrder = Array.from(new Set(["hero", ...(data.sectionOrder || []), ...defaultSectionOrder, "footer"]));
  const sectionOrder = baseSectionOrder;
  const [activeGiftType, setActiveGiftType] = useState<"bank" | "wallet">("bank");
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [tempSectionOrder, setTempSectionOrder] = useState<string[]>(sectionOrder);
  const [croppingImage, setCroppingImage] = useState<{ url: string; index: number; isMobile: boolean } | null>(null);
  
  // Fetch predefined options from Supabase
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const [isMobileBackgroundMode, setIsMobileBackgroundMode] = useState(false);
  const [showBgImagePicker, setShowBgImagePicker] = useState(false);
  const [bgStockAssets, setBgStockAssets] = useState<StockAsset[]>([]);
  const [bgUploading, setBgUploading] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets("backgrounds").then(setBgStockAssets);
  }, []);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !invitationId) return;
    setBgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("field", "heroBackground");
      fd.append("invitationId", invitationId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      const field = isMobileBackgroundMode ? "heroBackgroundImagesMobile" : "heroBackgroundImages";
      const currentImages = isMobileBackgroundMode ? (data.heroBackgroundImagesMobile || []) : (data.heroBackgroundImages || []);
      onChange(field, [...currentImages, url]);
      setShowBgImagePicker(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBgUploading(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    }
  };

  const handleBgSelect = (url: string) => {
    if (!url) return;
    const field = isMobileBackgroundMode ? "heroBackgroundImagesMobile" : "heroBackgroundImages";
    const currentImages = isMobileBackgroundMode ? (data.heroBackgroundImagesMobile || []) : (data.heroBackgroundImages || []);
    onChange(field, [...currentImages, url]);
    setShowBgImagePicker(false);
  };
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(data.collapsedSections ?? ["event-details", "gallery", "map", "rsvp", "timeline", "countdown", "dresscode", "giftguide", "wedding-directory", "entourage", "footer"]));
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  // Notify parent of local visible sections changes
  useEffect(() => {
    onLocalVisibleSectionsChange?.(localVisibleSections);
  }, [localVisibleSections, onLocalVisibleSectionsChange]);

  // Handle local checkbox changes (queue to global pending state)
  const handleVisibilityCheckboxChange = (section: string, checked: boolean) => {
    const updatedSections = {
      ...localVisibleSections,
      [section]: checked
    };
    setLocalVisibleSections(updatedSections);

    const updatedEntourage = {
      ...pendingEntourageChanges,
      visibleSections: updatedSections
    };
    setPendingEntourageChanges(updatedEntourage);
    onPendingEntourageChange?.(updatedEntourage);
    onChange("entourage", updatedEntourage);
  };

  // Handle divider click to highlight section and scroll to CSS ID
  const handleDividerClick = (sectionId: string) => {
    setHighlightedSection(sectionId);
    
    // Scroll to the section's CSS ID in the live page
    const cssIdMap: Record<string, string> = {
      "event-details": "event-details-cssid",
      gallery: "gallery-cssid",
      map: "map-cssid",
      rsvp: "rsvp-cssid",
      timeline: "timeline-cssid",
      countdown: "countdown-cssid",
      dresscode: "dresscode-cssid",
      giftguide: "gift-guide-cssid",
      "wedding-directory": "wedding-directory-cssid",
      entourage: "entourage-cssid",
      footer: "footer-cssid",
    };
    const cssId = cssIdMap[sectionId];
    if (cssId) {
      const element = document.getElementById(cssId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Remove highlight after 2 seconds
    setTimeout(() => setHighlightedSection(null), 2000);
  };

  // Helper function to update nested entourage data (local only)
  const updateEntourageField = (path: string, value: any) => {
    const entourage = { ...pendingEntourageChanges };
    const keys = path.split('.');
    let current: any = entourage;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setPendingEntourageChanges(entourage);
    onPendingEntourageChange?.(entourage);
    onChange("entourage", entourage);
  };

  // Helper to render editable label with pencil icon
  const renderEditableLabel = (defaultLabel: string, customValue: string | undefined, field: string) => {
    const currentLabel = customValue || defaultLabel;
    const isCustom = !!customValue;

    return (
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium truncate" style={{ color: accentColor }}>{currentLabel}</h4>
        {!showCheckboxes && !isCustom && (
          <button
            type="button"
            onClick={() => {
              const newValue = prompt(`Enter new label for ${defaultLabel}:`, currentLabel);
              if (newValue !== null && newValue.trim() !== "") {
                updateEntourageField(field, newValue.trim());
              } else if (newValue !== null && newValue.trim() === "") {
                updateEntourageField(field, undefined);
              }
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Rename"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {!showCheckboxes && isCustom && (
          <button
            type="button"
            onClick={() => updateEntourageField(field, undefined)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Reset to default"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        )}
      </div>
    );
  };
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Reset temp order when entering arrange mode
  const handleEnterArrangeMode = () => {
    setTempSectionOrder(sectionOrder);
    setIsArrangeMode(true);
  };

  // Save temp order when exiting arrange mode
  // Cancel arrange mode and reset any queued order changes
  const handleCancelArrangeMode = () => {
    setTempSectionOrder(sectionOrder);
    setIsArrangeMode(false);
    onChange("sectionOrder", sectionOrder as unknown as string);
  };

  const handleToggle = (key: keyof InvitationSections) => {
    onChange("sections", {
      ...data.sections,
      [key]: !data.sections[key],
    } as unknown as string);
  };

  // Prevent any auto-expansion when sections are toggled
  const handleCheckboxChange = (key: keyof InvitationSections) => {
    const newValue = !data.sections[key];
    handleToggle(key);
    
    // If unchecking the section, collapse it
    if (!newValue) {
      setCollapsedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(key);
        // Don't call onChange - collapsing shouldn't trigger a save
        return newSet;
      });
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const currentOrder = isArrangeMode ? tempSectionOrder : sectionOrder;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    if (isArrangeMode) {
      setTempSectionOrder(newOrder);
    }
    onChange("sectionOrder", newOrder as unknown as string);
  };

  const moveDown = (index: number) => {
    if (index === (isArrangeMode ? tempSectionOrder : sectionOrder).length - 1) return;
    const currentOrder = isArrangeMode ? tempSectionOrder : sectionOrder;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    if (isArrangeMode) {
      setTempSectionOrder(newOrder);
    }
    onChange("sectionOrder", newOrder as unknown as string);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex || dragIndex === null) return;

    // Hero and footer are locked, prevent dragging them
    const draggedSectionId = tempSectionOrder[dragIndex];
    const droppedSectionId = tempSectionOrder[dropIndex];
    const isDraggedLocked = draggedSectionId === "hero" || draggedSectionId === "footer";
    const isDroppedLocked = droppedSectionId === "hero" || droppedSectionId === "footer";
    
    if (isDraggedLocked || isDroppedLocked) return;

    const newOrder = [...tempSectionOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    
    // Adjust drop index if dragging down (since we removed an item above)
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newOrder.splice(adjustedDropIndex, 0, draggedItem);
    
    setTempSectionOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);

    onChange("sectionOrder", newOrder as unknown as string);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? "bg-gray-800" : ""}`}>
      {/* Scrollable content area */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {(isArrangeMode ? tempSectionOrder : sectionOrder).map((sectionId, index) => {
        const section = ALL_SECTIONS.find(s => s.id === sectionId || s.key === sectionId);
        if (!section) return null;

        const isHero = section.id === "hero";
        const isEventDetails = section.id === "event-details";
        const isRsvp = section.key === "rsvp";
        const isDresscode = section.key === "dresscode";
        const isGallery = section.key === "gallery";
        const isMap = section.key === "map";
        const isTimeline = section.key === "timeline";
        const isCountdown = section.key === "countdown";
        const isGiftguide = section.key === "giftguide";
        const isWeddingDirectory = section.id === "wedding-directory";
        const isEntourage = section.key === "entourage";
        const isFooter = section.key === "footer";
        const isLocked = section.locked || isHero || (isFooter && isArrangeMode);

        return (
          <div
            key={sectionId}
            draggable={isArrangeMode && !isLocked}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${isArrangeMode && !isLocked ? "cursor-move" : ""} ${draggedIndex === index ? "opacity-50 scale-95" : ""} ${dragOverIndex === index ? "border-2" : ""} ${highlightedSection === sectionId ? "ring-2 ring-offset-2" : ""}`}
            style={{
              backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
              ...(dragOverIndex === index ? {
                borderColor: accentColor,
                backgroundColor: isDarkMode 
                  ? hexToRgba(accentColor, 0.2) 
                  : hexToRgba(accentColor, 0.13)
              } : {}),
              ...(!collapsedSections.has(sectionId) && !isArrangeMode ? {
                boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
              } : {}),
              ...(highlightedSection === sectionId ? {
                boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
              } : {})
            }}
          >
            <div className="flex items-center gap-3 p-4">
              {/* Drag handle in arrange mode for non-locked sections, or checkbox for reorderable sections, or lock icon for locked sections */}
              {isArrangeMode && !isLocked ? (
                <div className="flex items-center justify-center w-6 h-6 shrink-0 cursor-grab active:cursor-grabbing">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </div>
              ) : isLocked ? (
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              ) : (
                <input
                  type="checkbox"
                  checked={section.id === "event-details" ? (data.sections.eventdetails ?? true) : (data.sections[section.key!] ?? (section.key === "footer" || section.key === "entourage" ? true : false))}
                  onChange={() => handleCheckboxChange(section.id === "event-details" ? "eventdetails" : section.key!)}
                  className="w-5 h-5 rounded border-gray-300 text-[#B88A78] focus:ring-[#B88A78] cursor-pointer shrink-0"
                  style={{ accentColor: accentColor }}
                />
              )}

              {/* Section info - clickable to collapse/expand */}
              {!isArrangeMode && (isHero || isEventDetails || (isFooter && (data.sections.footer ?? true)) || (isEntourage && (data.sections.entourage ?? true)) || (!isFooter && !isEntourage && data.sections[section.key as keyof typeof data.sections])) ? (
                <button
                  type="button"
                  onClick={() => {
                    setCollapsedSections(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(sectionId)) {
                        // Section is collapsed - expand it and collapse all others (accordion)
                        newSet.clear();
                        // Add all sections except this one to the set (collapse them)
                        ALL_SECTIONS.forEach(s => {
                          const sectionKey = s.id || s.key;
                          if (sectionKey && sectionKey !== sectionId) {
                            newSet.add(sectionKey);
                          }
                        });
                      } else {
                        // Section is expanded - collapse it
                        newSet.add(sectionId);
                      }
                      return newSet;
                    });

                    // Don't call onChange - collapsing/expanding sections shouldn't trigger a save

                    // Scroll to the section's CSS ID in the live page
                    const cssIdMap: Record<string, string> = {
                      "event-details": "event-details-cssid",
                      gallery: "gallery-cssid",
                      map: "map-cssid",
                      rsvp: "rsvp-cssid",
                      timeline: "timeline-cssid",
                      countdown: "countdown-cssid",
                      dresscode: "dresscode-cssid",
                      giftguide: "gift-guide-cssid",
                      "wedding-directory": "wedding-directory-cssid",
                      entourage: "entourage-cssid",
                      footer: "footer-cssid",
                    };
                    const cssId = cssIdMap[sectionId];
                    if (cssId) {
                      const element = document.getElementById(cssId);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className="flex-1 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                >
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{section.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                  </div>
                  <div className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2">
                    {collapsedSections.has(sectionId) ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    )}
                  </div>
                </button>
              ) : (
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>{section.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                </div>
              )}
            </div>

            {/* Hero settings in normal mode */}
            {!isArrangeMode && isHero && !collapsedSections.has("hero") && (
              <div className={`border-t p-4 space-y-8 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {/* Background Images */}
                <div className="space-y-3">
                  <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>BACKGROUND</label>
                  
                  <div className="flex items-center justify-between">
                    <label className="block text-xs tracking-wide uppercase text-gray-500">{isMobileBackgroundMode ? "PHONE SCREEN" : "DESKTOP"}</label>
                    <button
                      type="button"
                      onClick={() => setIsMobileBackgroundMode(!isMobileBackgroundMode)}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"}`}
                      title={isMobileBackgroundMode ? "Switch to Desktop" : "Switch to Phone"}
                    >
                      {isMobileBackgroundMode ? (
                        <div className="w-5 h-5" style={{
                          backgroundColor: accentColor,
                          WebkitMaskImage: "url(/assets/desktop.png)",
                          WebkitMaskSize: "contain",
                          WebkitMaskPosition: "center",
                          WebkitMaskRepeat: "no-repeat",
                          maskImage: "url(/assets/desktop.png)",
                          maskSize: "contain",
                          maskPosition: "center",
                          maskRepeat: "no-repeat"
                        }} />
                      ) : (
                        <div className="w-5 h-5" style={{
                          backgroundColor: accentColor,
                          WebkitMaskImage: "url(/assets/smartphone.png)",
                          WebkitMaskSize: "contain",
                          WebkitMaskPosition: "center",
                          WebkitMaskRepeat: "no-repeat",
                          maskImage: "url(/assets/smartphone.png)",
                          maskSize: "contain",
                          maskPosition: "center",
                          maskRepeat: "no-repeat"
                        }} />
                      )}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(isMobileBackgroundMode ? (data.heroBackgroundImagesMobile || []) : (data.heroBackgroundImages || [])).map((bgImage, index) => (
                      <div key={index} className="relative">
                        {/* Preview with delete button */}
                        {bgImage && (
                          <div className={`relative w-full h-32 rounded-lg overflow-hidden border mb-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <img src={bgImage} alt={`Background ${index + 1}`} className="w-full h-full object-cover" />
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...(isMobileBackgroundMode ? (data.heroBackgroundImagesMobile || []) : (data.heroBackgroundImages || []))];
                                newImages.splice(index, 1);
                                onChange(isMobileBackgroundMode ? "heroBackgroundImagesMobile" : "heroBackgroundImages", newImages);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                              style={{ border: "1px solid #e8cfc3" }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Add button - dashed line style */}
                    {(isMobileBackgroundMode ? (data.heroBackgroundImagesMobile || []) : (data.heroBackgroundImages || [])).filter(Boolean).length < 3 && (
                      <button
                        type="button"
                        onClick={() => setShowBgImagePicker(true)}
                        className={`w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm hover:border-gray-400 hover:text-gray-600 transition-colors ${isDarkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"}`}
                      >
                        + Add background image
                      </button>
                    )}
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {isMobileBackgroundMode ? "The couple or subject must be at the center. Use landscape image" : "Use a high quality landscape image"}
                    </p>
                  </div>
                </div>

                {/* Background Image Picker Sheet */}
                {showBgImagePicker && (
                  <>
                    <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowBgImagePicker(false)} />
                    <div
                      className={`fixed bottom-0 left-0 right-0 z-50 ${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-t-3xl shadow-2xl flex flex-col animate-slide-up`}
                      style={{ maxWidth: 480, margin: "0 auto", maxHeight: "60vh" }}
                    >
                      <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
                      </div>
                      <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                        <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          Select Background Image
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowBgImagePicker(false)}
                          className={`p-1.5 rounded-md transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
                        <div className="grid grid-cols-3 gap-3">
                          {/* Upload slot */}
                          <button
                            onClick={() => bgFileInputRef.current?.click()}
                            disabled={bgUploading}
                            className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
                            style={{ borderColor: `${accentColor}66`, backgroundColor: isDarkMode ? "transparent" : "#fff8f3" }}
                          >
                            {bgUploading ? (
                              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: "transparent" }} />
                            ) : (
                              <>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span className="text-[10px] font-semibold tracking-wide" style={{ color: accentColor }}>Upload</span>
                              </>
                            )}
                          </button>
                          <input
                            ref={bgFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBgUpload}
                          />

                          {/* Gallery images */}
                          {(data.galleryImages || []).filter(Boolean).map((url, i) => (
                            <button
                              key={`gallery-${i}`}
                              onClick={() => handleBgSelect(url)}
                              className="aspect-square rounded-2xl border-2 border-transparent overflow-hidden transition-all active:scale-95 hover:border-gray-300"
                            >
                              <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}

                          {/* Stock background assets */}
                          {bgStockAssets.filter(a => a.url).map((asset) => (
                            <button
                              key={asset.id}
                              onClick={() => handleBgSelect(asset.url)}
                              className="aspect-square rounded-2xl border-2 border-transparent overflow-hidden transition-all active:scale-95 hover:border-gray-300"
                            >
                              <img src={asset.thumbnail || asset.url} alt={asset.label} className="w-full h-full object-cover" />
                            </button>
                          ))}

                          {/* Empty state */}
                          {(data.galleryImages || []).filter(Boolean).length === 0 && bgStockAssets.filter(a => a.url).length === 0 && (
                            <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                              No images available.
                              <br />
                              Upload your own above.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Background Color Overlay */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Background Color Overlay</label>
                  <select
                    value={data.heroBackgroundOverlay ?? "solid"}
                    onChange={(e) => onChange("heroBackgroundOverlay", e.target.value as "solid" | "gradient")}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  >
                    <option value="solid">Solid Color</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                {/* Overlay Color 1 */}
                <ColorControl
                  label="Overlay Color 1"
                  value={data.heroOverlayColor1 ?? ""}
                  onChange={(value: string) => onChange("heroOverlayColor1", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />

                {/* Transparency for Top Color */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs tracking-wide uppercase text-gray-500">Transparency</label>
                    <span className="text-xs text-gray-500">
                      {Math.round((data.heroOverlayOpacity1 ?? 0.7) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={data.heroOverlayOpacity1 ?? 0.7}
                    onChange={(e) => onChange("heroOverlayOpacity1", parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((data.heroOverlayOpacity1 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) ${((data.heroOverlayOpacity1 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) 100%)`,
                    }}
                  />
                </div>

                {/* Overlay Color 2 - only for gradient */}
                {(data.heroBackgroundOverlay ?? "solid") === "gradient" && (
                <ColorControl
                  label="Overlay Color 2"
                  value={data.heroOverlayColor2 ?? ""}
                  onChange={(value: string) => onChange("heroOverlayColor2", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />
                )}

                {/* Transparency for Overlay Color 2 - only for gradient */}
                {(data.heroBackgroundOverlay ?? "solid") === "gradient" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs tracking-wide uppercase text-gray-500">Transparency</label>
                    <span className="text-xs text-gray-500">
                      {Math.round((data.heroOverlayOpacity2 ?? 0.7) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={data.heroOverlayOpacity2 ?? 0.7}
                    onChange={(e) => onChange("heroOverlayOpacity2", parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((data.heroOverlayOpacity2 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) ${((data.heroOverlayOpacity2 ?? 0.7) * 100)}%, rgba(255,255,255,0.3) 100%)`,
                    }}
                  />
                </div>
                )}

              </div>
            )}

            {/* Event Details settings in normal mode */}
            {!isArrangeMode && isEventDetails && !collapsedSections.has("event-details") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
              </div>
            )}


            {/* Nested settings only in normal mode when section is expanded */}
            {!isArrangeMode && !collapsedSections.has(sectionId) && !isDresscode && !isGallery && !isMap && !isRsvp && !isTimeline && !isCountdown && !isGiftguide && !isHero && !isEventDetails && !isEntourage && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {!isFooter && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs tracking-wide uppercase text-gray-500">Section Heading</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={
                            isGallery ? data.galleryHeading ?? ""
                            : isMap ? data.mapHeading ?? ""
                            : isRsvp ? data.rsvpHeading ?? ""
                            : isTimeline ? data.timelineHeading ?? ""
                            : isCountdown ? data.countdownHeading ?? ""
                            : isDresscode ? data.dresscodeHeading ?? ""
                            : isGiftguide ? data.giftguideHeading ?? ""
                            : isWeddingDirectory ? data.weddingDirectoryHeading ?? ""
                            : ""
                          }
                          onChange={(e) => onChange(`${section.key}Heading` as keyof InvitationData, e.target.value)}
                          placeholder={section.label}
                          className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                      </div>
                    </div>

                    {isWeddingDirectory && (
                      <div className="space-y-1">
                        <label className="block text-xs tracking-wide uppercase text-gray-500">Message</label>
                        <textarea
                          value={data.weddingDirectoryMessage ?? ""}
                          onChange={(e) => onChange("weddingDirectoryMessage", e.target.value)}
                          placeholder="A special place for our wedding details and contacts..."
                          rows={3}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            {/* RSVP nested settings */}
            {!isArrangeMode && isRsvp && !collapsedSections.has("rsvp") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-1">
                  <label className="block text-xs tracking-wide uppercase text-gray-500">RSVP Deadline</label>
                  <input
                    type="text"
                    value={data.rsvpDeadline ?? ""}
                    onChange={(e) => onChange("rsvpDeadline", e.target.value)}
                    placeholder="e.g. November 30, 2026"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                </div>

              </div>
            )}

            {/* Dresscode nested settings */}
            {!isArrangeMode && isDresscode && !collapsedSections.has("dresscode") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {/* Dress Code Categories */}
                <div className="space-y-3">
                  <label className="block text-xs tracking-wide uppercase text-gray-500">Dress Code Categories</label>
                  {(data.dressCodeCategories || []).map((category, index) => (
                    <div key={index} className={`p-3 rounded-lg border space-y-3 ${isDarkMode ? "border-gray-700" : "bg-white border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                      <div className="flex items-center gap-2">
                        <select
                          value={category.label}
                          onChange={(e) => {
                            const newCategories = [...(data.dressCodeCategories || [])];
                            newCategories[index] = { ...category, label: e.target.value };
                            onChange("dressCodeCategories", newCategories as unknown as string);
                          }}
                          className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          <option value="Entourage">Entourage</option>
                          <option value="Immediate Family">Immediate Family</option>
                          <option value="Usher and Usherettes">Usher and Usherettes</option>
                          <option value="Visitors">Visitors</option>
                        </select>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newCategories = (data.dressCodeCategories || []).filter((_, i) => i !== index);
                              onChange("dressCodeCategories", newCategories as unknown as string);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(data.dressCodeCategories || []).length < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCategories = [...(data.dressCodeCategories || [])];
                        newCategories.push({ label: "Entourage", imageUrl: "", colors: [] });
                        onChange("dressCodeCategories", newCategories as unknown as string);
                      }}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                      + Add Category
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Dresscode divider selector */}

            {/* Gallery nested settings */}
            {!isArrangeMode && isGallery && !collapsedSections.has("gallery") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
              </div>
            )}


            {/* Map nested settings */}
            {!isArrangeMode && isMap && !collapsedSections.has("map") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Venue Images (Optional)</label>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>Add venue images to show instead of map. Multiple images will slideshow. Maximum 5 images.</p>
                  {(data.venueImages || []).map((imageUrl, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => {
                          const newImages = [...(data.venueImages || [])];
                          newImages[index] = e.target.value;
                          onChange("venueImages", newImages as unknown as string);
                        }}
                        placeholder="https://example.com/venue-image.jpg"
                        className={`flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                      />
                      {index === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if ((data.venueImages || []).length < 5) {
                              const newImages = [...(data.venueImages || []), ""];
                              onChange("venueImages", newImages as unknown as string);
                            }
                          }}
                          disabled={(data.venueImages || []).length >= 5}
                          className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: accentColor }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (data.venueImages || []).filter((_, i) => i !== index);
                            onChange("venueImages", newImages as unknown as string);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {(data.venueImages || []).length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange("venueImages", [""] as unknown as string);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors"
                      style={{ backgroundColor: accentColor }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}


            {/* Timeline nested settings */}
            {!isArrangeMode && isTimeline && !collapsedSections.has("timeline") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-3">
                  <label className="block text-xs tracking-wide uppercase text-gray-500">Timeline Events</label>
                  {Array.from({ length: 4 }).map((_, index) => {
                    const defaultTitles = ["Where We Met", "First Date", "The Proposal", "The Wedding"];
                    const event = (data.timelineEvents || [])[index] || { title: "", description: "" };
                    return (
                      <div key={index} className={`space-y-2 p-3 rounded-lg border ${isDarkMode ? "border-gray-700" : "bg-white border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                        <div className="relative">
                          <input
                            type="text"
                            value={event.title}
                            onChange={(e) => {
                              const newEvents = [...(data.timelineEvents || [])];
                              while (newEvents.length <= index) newEvents.push({ title: "", description: "" });
                              newEvents[index] = { ...newEvents[index], title: e.target.value };
                              onChange("timelineEvents", newEvents as unknown as string);
                            }}
                            placeholder="Event title"
                            className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                          />
                          {event.title && event.title !== defaultTitles[index] && (
                            <button
                              type="button"
                              onClick={() => {
                                const newEvents = [...(data.timelineEvents || [])];
                                while (newEvents.length <= index) newEvents.push({ title: "", description: "" });
                                newEvents[index] = { ...newEvents[index], title: defaultTitles[index] };
                                onChange("timelineEvents", newEvents as unknown as string);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <textarea
                          value={event.description}
                          onChange={(e) => {
                            const newEvents = [...(data.timelineEvents || [])];
                            while (newEvents.length <= index) newEvents.push({ title: "", description: "" });
                            newEvents[index] = { ...newEvents[index], description: e.target.value };
                            onChange("timelineEvents", newEvents as unknown as string);
                          }}
                          placeholder="Event description"
                          rows={2}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Countdown nested settings */}
            {!isArrangeMode && isCountdown && !collapsedSections.has("countdown") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <Toggle
                  label="Show the date"
                  checked={data.countdownShowDate ?? false}
                  onToggle={() => onChange("countdownShowDate", !(data.countdownShowDate ?? false))}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                />
              </div>
            )}


            {/* Gift Guide nested settings */}
            {!isArrangeMode && isGiftguide && !collapsedSections.has("giftguide") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                <div className="space-y-3">
                  <label className="block text-xs tracking-wide uppercase text-gray-500">Bank & Wallet Accounts</label>
                  
                  {/* Type selector dropdown */}
                  <select
                    value={activeGiftType}
                    onChange={(e) => setActiveGiftType(e.target.value as "bank" | "wallet")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200 bg-white"}`}
                  >
                    <option value="bank">Bank</option>
                    <option value="wallet">Wallet</option>
                  </select>

                  {activeGiftType === "bank" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs text-gray-500">Bank Name</label>
                        <input
                          type="text"
                          value={data.giftBank?.name ?? ""}
                          onChange={(e) => {
                            const bank = data.giftBank || {
                              name: "",
                              account1: { qrCode: "", maskedName: "" },
                              account2: { qrCode: "", maskedName: "" },
                            };
                            onChange("giftBank", {
                              ...bank,
                              name: e.target.value
                            } as unknown as string);
                          }}
                          placeholder="Bank"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                      </div>
                      {(["account1", "account2"] as const).map((accountKey) => {
                        const account = data.giftBank?.[accountKey] || { qrCode: "", maskedName: "" };
                        return (
                          <div key={accountKey} className={`p-3 rounded-lg border space-y-2 ${isDarkMode ? "border-gray-700" : "bg-white border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                            <p className="text-xs font-medium text-gray-600">Account {accountKey === "account1" ? "1" : "2"}</p>
                            <QRUpload
                              qrCode={account.qrCode}
                              maskedName={account.maskedName}
                              accentColor={accentColor}
                              isDarkMode={isDarkMode}
                              onQRCodeChange={(qrCode, maskedName) => {
                                const bank = data.giftBank || {
                                  name: "",
                                  account1: { qrCode: "", maskedName: "" },
                                  account2: { qrCode: "", maskedName: "" },
                                };
                                onChange("giftBank", {
                                  ...bank,
                                  [accountKey]: { qrCode, maskedName }
                                } as unknown as string);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeGiftType === "wallet" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs text-gray-500">Wallet Name</label>
                        <input
                          type="text"
                          value={data.giftWallet?.name ?? ""}
                          onChange={(e) => {
                            const wallet = data.giftWallet || {
                              name: "",
                              account1: { qrCode: "", maskedName: "" },
                              account2: { qrCode: "", maskedName: "" },
                            };
                            onChange("giftWallet", {
                              ...wallet,
                              name: e.target.value
                            } as unknown as string);
                          }}
                          placeholder="Wallet"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                      </div>
                      {(["account1", "account2"] as const).map((accountKey) => {
                        const account = data.giftWallet?.[accountKey] || { qrCode: "", maskedName: "" };
                        return (
                          <div key={accountKey} className={`p-3 rounded-lg border space-y-2 ${isDarkMode ? "border-gray-700" : "bg-white border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                            <p className="text-xs font-medium text-gray-600">Account {accountKey === "account1" ? "1" : "2"}</p>
                            <QRUpload
                              qrCode={account.qrCode}
                              maskedName={account.maskedName}
                              accentColor={accentColor}
                              isDarkMode={isDarkMode}
                              onQRCodeChange={(qrCode, maskedName) => {
                                const wallet = data.giftWallet || {
                                  name: "",
                                  account1: { qrCode: "", maskedName: "" },
                                  account2: { qrCode: "", maskedName: "" },
                                };
                                onChange("giftWallet", {
                                  ...wallet,
                                  [accountKey]: { qrCode, maskedName }
                                } as unknown as string);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Entourage section editor - moved to Tools Tab */}
          </div>
        );
      })}
      </div>

      {/* Fixed button area - outside scroll */}
      <div className="p-4">
        <div className="flex justify-center gap-2">
        {isArrangeMode ? (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleCancelArrangeMode}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnterArrangeMode}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Arrange Order
          </button>
        )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {croppingImage && (
        <ImageCropper
          imageUrl={croppingImage.url}
          initialCrop={
            croppingImage.isMobile
              ? (data.heroBackgroundImagesMobileCrop?.[croppingImage.index] || undefined)
              : (data.heroBackgroundImagesCrop?.[croppingImage.index] || undefined)
          }
          onSave={({ crop }) => {
            const cropField = croppingImage.isMobile ? "heroBackgroundImagesMobileCrop" : "heroBackgroundImagesCrop";
            const newCrops = [...(data[cropField as keyof InvitationData] as any || [])];
            newCrops[croppingImage.index] = crop;
            onChange(cropField, newCrops as any);
            setCroppingImage(null);
          }}
          onReset={() => {
            const cropField = croppingImage.isMobile ? "heroBackgroundImagesMobileCrop" : "heroBackgroundImagesCrop";
            const newCrops = [...(data[cropField as keyof InvitationData] as any || [])];
            newCrops[croppingImage.index] = null;
            onChange(cropField, newCrops as any);
            setCroppingImage(null);
          }}
          onCancel={() => setCroppingImage(null)}
        />
      )}
    </div>
  );
}










