import type { InvitationData, InvitationSections, DividerType } from "@/lib/types/invitation";
import { useState, useEffect, useCallback } from "react";
import QRUpload from "../QRUpload";
import EditableZone from "@/components/invitation/EditableZone";
import ColorControl from "@/components/shared/ColorControl";
import FontControl from "@/components/shared/FontControl";
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
  accentColor = "#6998EE",
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

export default function SectionsTab({ data, onChange, isDarkMode = false, accentColor = "#6998EE", onPendingEntourageChange, onLocalVisibleSectionsChange, invitationId }: SectionsTabProps) {
  const defaultSectionOrder = ["hero", "event-details", "gallery", "map", "rsvp", "timeline", "countdown", "dresscode", "giftguide", "wedding-directory", "entourage", "footer"];
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [localVisibleSections, setLocalVisibleSections] = useState(data.entourage?.visibleSections || {});
  const [pendingEntourageChanges, setPendingEntourageChanges] = useState(data.entourage || {});
  const baseSectionOrder = Array.from(new Set(["hero", ...(data.sectionOrder || []), ...defaultSectionOrder, "footer"]));
  const sectionOrder = baseSectionOrder;
  const [activeGiftType, setActiveGiftType] = useState<"bank" | "wallet">("bank");
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [tempSectionOrder, setTempSectionOrder] = useState<string[]>(sectionOrder);
  
  // Fetch predefined options from Supabase
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const allSections = ["event-details", "gallery", "map", "rsvp", "timeline", "countdown", "dresscode", "giftguide", "wedding-directory", "entourage", "footer", "hero"];
    const stored = data.collapsedSections;
    if (stored && Array.isArray(stored)) {
      const set = new Set(stored);
      allSections.forEach(s => set.add(s));
      return set;
    }
    return new Set(allSections);
  });
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
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
      [key]: !data.sections?.[key],
    } as unknown as string);
  };

  // Prevent any auto-expansion when sections are toggled
  const handleCheckboxChange = (key: keyof InvitationSections) => {
    const newValue = !data.sections?.[key];
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

  const cycleIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );

  const cycleText = (predefined: string[], current: string): string => {
    const currentIndex = predefined.indexOf(current);
    const nextIndex = currentIndex === -1 || currentIndex === predefined.length - 1 ? 0 : currentIndex + 1;
    return predefined[nextIndex];
  };

  const renderSectionHeadingMessage = (sectionId: string) => {
    const config: Record<string, {
      headingField: keyof InvitationData;
      headingPlaceholder: string;
      headingPredefined: string[];
      messageField?: keyof InvitationData;
      messagePlaceholder?: string;
      messagePredefined?: string[];
      messageEntourageField?: string;
      messageEntouragePredefined?: string[];
      topTextField?: keyof InvitationData;
      topTextEntourageField?: string;
      topTextPlaceholder?: string;
      topTextPredefined?: string[];
      topTextEntouragePredefined?: string[];
      bottomTextLabel?: string;
    }> = {
      "event-details": {
        headingField: "eventDetailsHeading", headingPlaceholder: "Event Details",
        headingPredefined: ["Event Details", "Wedding Details", "Our Wedding Day", "Celebration Details", "The Big Day"],
        messageField: "eventDetailsMessage", messagePlaceholder: "We're so excited to celebrate our special day with you...",
        messagePredefined: ["We're so excited to celebrate our special day with you...", "We can't wait to share this moment with our favorite people. Here are all the details for our celebration.", "The day we've been dreaming of is almost here. We're honored to have you join us for our wedding.", "Our wedding day wouldn't be complete without you. Here's everything you need to know about the celebration.", "We're counting down the days until we say 'I do' in front of our loved ones. Here are the event details."],
      },
      gallery: {
        headingField: "galleryHeading", headingPlaceholder: "Our Moments",
        headingPredefined: ["Our Moments", "Photo Gallery", "Our Memories", "Picture Perfect", "Cherished Moments", "Wedding Gallery", "Special Moments"],
        messageField: "galleryMessage", messagePlaceholder: "A collection of our favorite moments together...",
        messagePredefined: ["A collection of our favorite moments together...", "These photos capture the beautiful memories we've shared. Each one tells a story of our journey.", "Moments frozen in time, memories that will last forever. Here's our story in pictures.", "A glimpse into our life together - the laughter, the love, and all the beautiful moments in between.", "These photos represent the journey that brought us here and the love that keeps us together."],
      },
      map: {
        headingField: "mapHeading", headingPlaceholder: "Location",
        headingPredefined: ["Location", "Venue", "Where We'll Celebrate", "Find Us Here", "The Venue", "Celebration Venue", "Reception Location"],
        messageField: "mapMessage", messagePlaceholder: "We look forward to celebrating with you at this beautiful venue...",
        messagePredefined: ["We look forward to celebrating with you at this beautiful venue...", "Join us at this stunning location for our special day. Your presence will make our celebration complete.", "We've chosen this beautiful venue to celebrate our love. We can't wait to share this special moment with you.", "Please join us at this beautiful location as we begin our journey together. Your presence means the world to us.", "We're thrilled to celebrate our wedding at this wonderful venue. Thank you for being part of our special day."],
      },
      rsvp: {
        headingField: "rsvpHeaderCustom", headingPlaceholder: "RSVP",
        headingPredefined: ["RSVP", "Kindly reply", "Please respond", "Your response", "RSVP request"],
        topTextField: "rsvpTopTextCustom", topTextPlaceholder: "Confirm your attendance",
        topTextPredefined: ["Confirm your attendance", "Reserve your spot", "Lock in your seat", "Verify your attendance", "Secure your invitation", "Register for this event", "Claim your ticket", "Let us know you're coming"],
        messageField: "rsvpBottomTextCustom", messagePlaceholder: "Please respond by...",
        bottomTextLabel: "Bottom Text",
      },
      timeline: {
        headingField: "timelineHeading", headingPlaceholder: "Our Story",
        headingPredefined: ["Our Story", "Love Story", "Our Journey", "How We Met", "Our Path Together", "Our Love Journey"],
        messageField: "timelineMessage", messagePlaceholder: "From our first meeting to this special day, here's our journey together...",
        messagePredefined: ["From our first meeting to this special day, here's our journey together...", "Every moment we've shared has led us here. This is our love story in milestones.", "Our journey began with a single moment and has grown into a beautiful adventure. Here are the highlights.", "Each milestone in our journey has been a step toward forever. Here's our story.", "The path that led us to this day has been filled with love, laughter, and unforgettable moments."],
      },
      countdown: {
        headingField: "countdownHeading", headingPlaceholder: "Countdown",
        headingPredefined: ["Counting Down", "Countdown", "Time Until", "Almost There", "Coming Soon", "Days Until"],
        messageField: "countdownMessage", messagePlaceholder: "Counting down to our special day...",
        messagePredefined: ["Counting down the days until our special moment together...", "Every moment brings us closer to our special day. We can't wait to celebrate with you!", "The countdown to our wedding has begun. We're so excited to share this day with you.", "As we count down to our wedding day, we're filled with joy and anticipation. See you soon!", "Our special day is approaching fast. We're counting down the moments until we celebrate with you."],
      },
      dresscode: {
        headingField: "dresscodeHeading", headingPlaceholder: "Dress Code",
        headingPredefined: ["Dress Code", "Dress to Celebrate", "Our Wedding Vision", "Palette & Presentation", "Wedding Attire", "What to Wear"],
        messageField: "dresscodeBody", messagePlaceholder: "We look forward to seeing everyone dressed in their finest!",
        messagePredefined: ["We look forward to seeing everyone dressed in their finest!\nDetails below:", "Dress code details can be found below.", "Find our look book details below.", "Friendly & Casual", "Please see our attire guide below.", "See below for wardrobe details."],
      },
      giftguide: {
        headingField: "giftguideHeading", headingPlaceholder: "Gift Guide",
        headingPredefined: ["Gift Guide", "For Those Who Wish", "Gifting Information", "Wedding Gifts", "Registry & Gifts", "With Gratitude"],
        messageField: "giftMessage", messagePlaceholder: "Your love, presence, and prayers mean the world to us...",
        messagePredefined: ["Your love and support are the greatest gifts we could ever receive. If you would like to honor us with a gift, a contribution toward building our new life together would be sincerely appreciated and deeply cherished.", "As we begin this beautiful new chapter, your presence and blessings mean everything to us. Should you wish to bless us with a gift, a contribution toward our future home and dreams would be most warmly appreciated.", "Celebrating our wedding day with you is our highest joy. For those who wish to honor us with a token of love, a contribution toward our journey ahead would be a wonderful blessing to our new family.", "Your love and prayers mean the world to us as we marry. If you would like to honor us with a gift, a contribution toward our honeymoon and setting up our future home would be a beautiful blessing.", "We are incredibly grateful for the love that surrounds us. If you wish to bless us with a gift, we kindly ask for a contribution toward our future goals, helping us build a foundation for the life ahead."],
      },
      "wedding-directory": {
        headingField: "weddingDirectoryHeading", headingPlaceholder: "Wedding Directory",
        headingPredefined: ["Wedding Directory", "Our Directory", "Wedding Contacts", "Meet the Team", "The People", "Meet the Family"],
        messageField: "weddingDirectoryMessage", messagePlaceholder: "A special place for our wedding details and contacts...",
        messagePredefined: ["A special place for our wedding details and contacts...", "Here you'll find all the important people and details for our wedding day.", "Meet the wonderful people helping make our day special.", "We're so happy to share this directory with you.", "A guide to the people and details that make our day special."],
      },
      entourage: {
        headingField: "entourageHeading", headingPlaceholder: "Wedding Entourage",
        headingPredefined: ["Wedding Entourage", "Our Entourage", "The Wedding Party", "Our Wedding Party", "Our Special People"],
        topTextEntourageField: "topTextCustom", topTextPlaceholder: "Those who stand with Groom & Bride",
        topTextEntouragePredefined: [
          `Those who stand with ${data.hisName || "Groom"} & ${data.herName || "Bride"}`,
          `The chosen family of ${data.hisName || "Groom"} & ${data.herName || "Bride"}`,
          `With love and gratitude from ${data.hisName || "Groom"} & ${data.herName || "Bride"}`,
          `${data.hisName || "Groom"} & ${data.herName || "Bride"}'s Wedding Squad`,
          `The I Do Crew of ${data.hisName || "Groom"} & ${data.herName || "Bride"}`,
        ],
        messageEntourageField: "bottomTextCustom", messagePlaceholder: "Honoring those who share in our joy",
        messageEntouragePredefined: ["Honoring those who share in our joy", "Forever grateful for your love and guidance", "Our biggest inspirations and guides", "With us for a lifetime", "Rooted in love and friendship", "For your endless support and laughter", "Celebrating the love that surrounds us", "With deepest gratitude for your presence", "Our ultimate support system", "The anchors of our lives"],
        bottomTextLabel: "Bottom Text",
      },
    };

    const cfg = config[sectionId];
    if (!cfg) return null;

    const headingValue = (data[cfg.headingField] as string) ?? "";
    const topTextValue = cfg.topTextEntourageField
      ? ((pendingEntourageChanges as any)?.[cfg.topTextEntourageField] as string ?? "")
      : cfg.topTextField ? ((data[cfg.topTextField] as string) ?? "") : "";
    const messageValue = cfg.messageEntourageField
      ? ((pendingEntourageChanges as any)?.[cfg.messageEntourageField] as string ?? "")
      : cfg.messageField ? ((data[cfg.messageField] as string) ?? "") : "";

    const rsvpBottomPredefined = (() => {
      const deadline = data.rsvpDeadline || "November 30, 2026";
      return [
        `Kindly reply by ${deadline}`,
        `RSVP requested by ${deadline}`,
        `Please respond by ${deadline}`,
        `Kindly confirm by ${deadline}`,
        `Responses due by ${deadline}`,
        `Please RSVP by ${deadline}`,
        `Kindly advise by ${deadline}`,
        `Reply requested: ${deadline}`,
        `Confirm attendance by ${deadline}`,
      ];
    })();

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Heading Text</label>
          <div className="relative">
            <input
              type="text"
              value={headingValue}
              onChange={(e) => onChange(cfg.headingField, e.target.value)}
              placeholder={cfg.headingPlaceholder}
              className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
            />
            <button
              type="button"
              onClick={() => onChange(cfg.headingField, cycleText(cfg.headingPredefined, headingValue))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Generate heading"
            >
              {cycleIcon}
            </button>
          </div>
        </div>
        {(cfg.topTextField || cfg.topTextEntourageField) && (
          <div className="space-y-1">
            <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Top Text</label>
            <div className="relative">
              <input
                type="text"
                value={topTextValue}
                onChange={(e) => {
                  if (cfg.topTextEntourageField) {
                    updateEntourageField(cfg.topTextEntourageField, e.target.value);
                  } else if (cfg.topTextField) {
                    onChange(cfg.topTextField, e.target.value);
                  }
                }}
                placeholder={cfg.topTextPlaceholder}
                className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
              />
              <button
                type="button"
                onClick={() => {
                  const predefined = cfg.topTextEntouragePredefined || cfg.topTextPredefined || [];
                  if (cfg.topTextEntourageField) {
                    updateEntourageField(cfg.topTextEntourageField, cycleText(predefined, topTextValue));
                  } else if (cfg.topTextField) {
                    onChange(cfg.topTextField, cycleText(predefined, topTextValue));
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Generate text"
              >
                {cycleIcon}
              </button>
            </div>
          </div>
        )}
        <div className="space-y-1">
          <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{cfg.bottomTextLabel ?? "Message Text"}</label>
          <div className="relative">
            <textarea
              value={messageValue}
              onChange={(e) => {
                if (cfg.messageEntourageField) {
                  updateEntourageField(cfg.messageEntourageField, e.target.value);
                } else if (cfg.messageField) {
                  onChange(cfg.messageField, e.target.value);
                }
              }}
              placeholder={cfg.messagePlaceholder}
              rows={3}
              className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
              style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
            />
            <button
              type="button"
              onClick={() => {
                const predefined = cfg.messageEntouragePredefined || cfg.messagePredefined || (sectionId === "rsvp" ? rsvpBottomPredefined : []);
                if (cfg.messageEntourageField) {
                  updateEntourageField(cfg.messageEntourageField, cycleText(predefined, messageValue));
                } else if (cfg.messageField) {
                  onChange(cfg.messageField, cycleText(predefined, messageValue));
                }
              }}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              title="Generate text"
            >
              {cycleIcon}
            </button>
          </div>
        </div>
        <div className={`border-t pt-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>
      </div>
    );
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
            onMouseEnter={() => setHoveredSection(sectionId)}
            onMouseLeave={() => setHoveredSection(null)}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${isArrangeMode && !isLocked ? "cursor-move" : ""} ${draggedIndex === index ? "opacity-50 scale-95" : ""} ${dragOverIndex === index ? "border-2" : ""} ${highlightedSection === sectionId ? "ring-2 ring-offset-2" : ""}`}
            style={{
              backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
              borderColor: hoveredSection === sectionId ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
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
            <div className={`flex items-center gap-3 p-4 ${!isArrangeMode && (isHero || isEventDetails || (isFooter && (data.sections?.footer ?? true)) || (isEntourage && (data.sections?.entourage ?? true)) || (!isFooter && !isEntourage && data.sections?.[section.key as keyof typeof data.sections])) ? `cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}` : ""}`}>
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
                  checked={section.id === "event-details" ? (data.sections?.eventdetails ?? true) : (data.sections?.[section.key!] ?? (section.key === "footer" || section.key === "entourage" ? true : false))}
                  onChange={() => handleCheckboxChange(section.id === "event-details" ? "eventdetails" : section.key!)}
                  className="w-5 h-5 rounded border-gray-300 text-[#6998EE] focus:ring-[#6998EE] cursor-pointer shrink-0"
                  style={{ accentColor: accentColor }}
                />
              )}

              {/* Section info - clickable to collapse/expand */}
              {!isArrangeMode && (isHero || isEventDetails || (isFooter && (data.sections?.footer ?? true)) || (isEntourage && (data.sections?.entourage ?? true)) || (!isFooter && !isEntourage && data.sections?.[section.key as keyof typeof data.sections])) ? (
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
                  className="flex-1 flex items-center justify-between text-left cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1"
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

            {/* Hero settings moved to Media tab */}

            {/* Event Details settings in normal mode */}
            {!isArrangeMode && isEventDetails && !collapsedSections.has("event-details") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
              </div>
            )}


            {/* Wedding Directory nested settings */}
            {!isArrangeMode && isWeddingDirectory && !collapsedSections.has("wedding-directory") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
              </div>
            )}


            {/* RSVP nested settings */}
            {!isArrangeMode && isRsvp && !collapsedSections.has("rsvp") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
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
                {renderSectionHeadingMessage(sectionId)}
                {/* Dress Code Categories */}
                <div className="space-y-3">
                  <label className="block text-xs tracking-wide uppercase text-gray-500">Dress Code Categories</label>
                  {(data.dressCodeCategories || []).map((category, index) => (
                    <div key={index} className={`p-3 rounded-lg border space-y-3 ${isDarkMode ? "border-gray-700" : "bg-white border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                      <div className="flex items-center gap-2">
                        <select
                          value={category.label === "Custom Category" ? "Custom Category" : category.label}
                          onChange={(e) => {
                            const newCategories = [...(data.dressCodeCategories || [])];
                            const selected = e.target.value;
                            if (selected === "Custom Category") {
                              newCategories[index] = { ...category, label: "Custom Category", customLabel: "" };
                            } else {
                              newCategories[index] = { ...category, label: selected, customLabel: undefined };
                            }
                            onChange("dressCodeCategories", newCategories as unknown as string);
                          }}
                          className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        >
                          <option value="Entourage">Entourage</option>
                          <option value="Immediate Family">Immediate Family</option>
                          <option value="Usher and Usherettes">Usher and Usherettes</option>
                          <option value="Guests">Guests</option>
                          <option value="Custom Category">Custom Category</option>
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
                      {category.label === "Custom Category" && (
                        <input
                          type="text"
                          value={(category as any).customLabel || ""}
                          onChange={(e) => {
                            const newCategories = [...(data.dressCodeCategories || [])];
                            newCategories[index] = { ...category, customLabel: e.target.value };
                            onChange("dressCodeCategories", newCategories as unknown as string);
                          }}
                          placeholder="Name this category"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"}`}
                          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                        />
                      )}
                    </div>
                  ))}

                  {(data.dressCodeCategories || []).length < 5 && (
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

                {/* Groom & Bride Colors */}
                <div className="space-y-3 pt-2">
                  <ColorControl
                    label="Groom"
                    value={(data as any).groomColor || "#1A2B55"}
                    onChange={(value) => onChange("groomColor", value)}
                    isDarkMode={isDarkMode}
                    accentColor={data.accentColor || "#6998EE"}
                    predefinedColors={predefinedSectionColors.map(opt => opt.value)}
                  />
                  <ColorControl
                    label="Bride"
                    value={(data as any).brideColor || "#FFFFFF"}
                    onChange={(value) => onChange("brideColor", value)}
                    isDarkMode={isDarkMode}
                    accentColor={data.accentColor || "#6998EE"}
                    predefinedColors={predefinedSectionColors.map(opt => opt.value)}
                  />
                </div>
              </div>
            )}

            {/* Dresscode divider selector */}

            {/* Gallery nested settings */}
            {!isArrangeMode && isGallery && !collapsedSections.has("gallery") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
              </div>
            )}


            {/* Map nested settings - heading & message only (venue images managed in Tools tab - Media) */}
            {!isArrangeMode && isMap && !collapsedSections.has("map") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
              </div>
            )}

            {/* Timeline nested settings - heading & message only (timeline events managed in Story Timeline tab) */}
            {!isArrangeMode && isTimeline && !collapsedSections.has("timeline") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
              </div>
            )}


            {/* Countdown nested settings */}
            {!isArrangeMode && isCountdown && !collapsedSections.has("countdown") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
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
                {renderSectionHeadingMessage(sectionId)}
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



            {/* Entourage nested settings */}
            {!isArrangeMode && isEntourage && !collapsedSections.has("entourage") && (
              <div className={`border-t p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100 bg-gray-100"}`}
              style={isDarkMode ? { backgroundColor: "#19212C" } : { backgroundColor: "#ECEDF0" }}>
                {renderSectionHeadingMessage(sectionId)}
              </div>
            )}
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
    </div>
  );
}










