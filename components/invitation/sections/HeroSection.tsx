import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import EditableZone from "../EditableZone";
import { useState, useEffect } from "react";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";

interface HeroSectionProps {
  data: InvitationData;
  editMode?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  printResizeScale?: number;
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
  onUpdateHeroIconMarginAdjustment?: (value: number) => void;
  onUpdateHeroIconSize?: (value: number) => void;
  onUpdateHeroDateStructure?: (value: "default" | "alternative" | "icon" | "elegant" | "modern" | "huge") => void;
  onUpdateHeroDateStructureSize?: (value: number) => void;
  onUpdateHeroDateStructureSpacing?: (value: number) => void;
  onUpdateHeroVenueStructure?: (value: "default" | "icon") => void;
  onUpdateHeroHostLineImage?: (value: "hostline-00" | "hostline-01" | "hostline-02" | "hostline-03" | "hostline-04" | "hostline-05" | "hostline-06" | "hostline-07" | "hostline-08" | "hostline-09") => void;
  onUpdateHeroHostLineImageOpacity?: (value: number) => void;
  onUpdateHeroClosingSentimentImage?: (value: "fsentiment-00" | "fsentiment-01" | "fsentiment-02" | "fsentiment-03" | "fsentiment-04" | "fsentiment-05" | "fsentiment-06" | "fsentiment-07") => void;
  onUpdateHeroClosingSentimentImageOpacity?: (value: number) => void;
  onUpdateHeroIconType?: (value: "image" | "initial" | "none") => void;
  onUpdateHeroIcon?: (value: string) => void;
  onUpdateHeroIconTypography?: (value: string) => void;
  onUpdateHeroIconAddAmpersand?: (value: boolean) => void;
  onChange?: (key: keyof InvitationData, value: any) => void;
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onPendingChangesChange?: (changes: Partial<InvitationData>) => void;
}

export default function HeroSection({
  data,
  editMode = false,
  isDarkMode = false,
  accentColor = "#B88A78",
  printResizeScale = 100,
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
  onUpdateHeroIconMarginAdjustment,
  onUpdateHeroIconSize,
  onUpdateHeroDateStructure,
  onUpdateHeroDateStructureSize,
  onUpdateHeroDateStructureSpacing,
  onUpdateHeroVenueStructure,
  onUpdateHeroHostLineImage,
  onUpdateHeroHostLineImageOpacity,
  onUpdateHeroClosingSentimentImage,
  onUpdateHeroClosingSentimentImageOpacity,
  onUpdateHeroIconType,
  onUpdateHeroIcon,
  onUpdateHeroIconTypography,
  onUpdateHeroIconAddAmpersand,
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
  const [showIconPanel, setShowIconPanel] = useState(false);
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
  const [isNamePanelClosing, setIsNamePanelClosing] = useState(false);
  const [isIconPanelClosing, setIsIconPanelClosing] = useState(false);
  const [isDateStructurePanelClosing, setIsDateStructurePanelClosing] = useState(false);
  const [hasUnsavedNameChanges, setHasUnsavedNameChanges] = useState(false);
  const [pendingNameChanges, setPendingNameChanges] = useState<Partial<InvitationData>>({});
  const [hasUnsavedDateStructureChanges, setHasUnsavedDateStructureChanges] = useState(false);
  const [pendingDateStructureChanges, setPendingDateStructureChanges] = useState<Partial<InvitationData>>({});
  const [hasUnsavedIconChanges, setHasUnsavedIconChanges] = useState(false);
  const [pendingIconChanges, setPendingIconChanges] = useState<Partial<InvitationData>>({});
  const [activePanel, setActivePanel] = useState<"name" | "date" | "icon" | null>(null);

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

  const handleCloseNamePanel = () => {
    setPendingNameChanges({});
    setHasUnsavedNameChanges(false);
    setIsNamePanelClosing(true);
    setTimeout(() => {
      setShowNamePanel(false);
      setIsNamePanelClosing(false);
    }, 300);
  };

  const handleCloseIconPanel = () => {
    setPendingIconChanges({});
    setHasUnsavedIconChanges(false);
    setIsIconPanelClosing(true);
    setTimeout(() => {
      setShowIconPanel(false);
      setIsIconPanelClosing(false);
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

  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingNameChanges, ...pendingDateStructureChanges, ...pendingIconChanges };

  console.log('heroHostLineImage:', data.heroHostLineImage);

  // Handler for icon changes - saves to local state for live preview and queues for global apply
  const handleIconChange = (key: keyof InvitationData, value: any) => {
    setPendingIconChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedIconChanges(true);
    onChange?.(key, value);
  };

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
  const getOverlayStyle = () => {
    const opacity1 = data.heroOverlayOpacity1 ?? 0.7;
    const opacity2 = data.heroOverlayOpacity2 ?? 0.7;
    const overlayType = data.heroBackgroundOverlay ?? "solid";

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    if (overlayType === "gradient" && data.heroOverlayColor1 && data.heroOverlayColor2) {
      return {
        background: `linear-gradient(135deg, ${hexToRgba(data.heroOverlayColor1, opacity1)}, ${hexToRgba(data.heroOverlayColor2, opacity2)})`,
      };
    } else if (data.heroOverlayColor1) {
      return {
        backgroundColor: hexToRgba(data.heroOverlayColor1, opacity1),
      };
    }
    return {};
  };

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center pb-16 text-center relative"
    >
      {/* Background color */}
      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: data.mainColor1 }}
      />

      {/* Background images with overlay */}
      {(() => {
        const imagesToUse = isMobile ? bgImagesMobile : bgImages;
        const cropDataArray = isMobile ? data.heroBackgroundImagesMobileCrop : data.heroBackgroundImagesCrop;
        
        if (imagesToUse.length > 0 && imagesToUse.filter(Boolean).length > 0) {
          return (
            <>
              {imagesToUse.filter(Boolean).map((bgImage, index) => {
                const cropData = cropDataArray?.[index];
                
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 z-0 transition-opacity duration-1000 ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      backgroundImage: `url(${bgImage})`,
                      backgroundSize: isMobile && cropData ? `${100 / cropData.zoom}%` : "cover",
                      backgroundPosition: isMobile && cropData 
                        ? `${cropData.x}% ${cropData.y}%` 
                        : "center",
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                );
              })}
              <div
                className="absolute inset-0 z-0"
                style={getOverlayStyle()}
              />
            </>
          );
        }
        return (
          <div
            className="absolute inset-0 z-0"
            style={getOverlayStyle()}
          />
        );
      })()}

      {/* Background image edit zone */}
      <EditableZone field="backgroundImage" category="backgrounds" label="Background Image" className="absolute inset-0 z-0" />

      {/* Content */}
      <div className="relative z-10 w-full mx-auto px-4 md:px-8 lg:px-16 flex flex-col items-center gap-6 md:gap-8 lg:gap-10" style={{ transform: `${previewMode ? 'scale(0.75)' : `scale(${printResizeScale / 100})`}`, transformOrigin: "top center" }}>
        {/* Spacer above icon */}
        <div style={{ height: '5px' }} />

        {/* Icon */}
        {data.heroIconType === "image" && data.heroIcon ? (
          <div 
            id="hero-icon"
            className={`w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 relative ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowIconPanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{ filter: `drop-shadow(0 4px 6px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1}))`, marginBottom: `${30 + (mergedData.heroIconMarginAdjustment || 0)}px`, transform: `scale(${(mergedData.heroIconSize || 100) / 100})` }}
          >
            {data.heroIconColorTint ? (
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: data.heroIconTextColor || data.heroIconColorTint,
                  opacity: data.heroIconTextColor ? 1 : (data.heroIconColorTintOpacity ?? 1),
                  WebkitMaskImage: `url(${data.heroIcon})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url(${data.heroIcon})`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat",
                }}
              />
            ) : (
              <img
                src={data.heroIcon}
                alt="Hero icon"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ) : data.heroIconType === "initial" ? (
          <div
            id="hero-icon"
            className={`w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 flex items-center justify-center ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowIconPanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: `${30 + (mergedData.heroIconMarginAdjustment || 0)}px`, transform: `scale(${(mergedData.heroIconSize || 100) / 100})` }}
          >
            <span
              className="text-3xl md:text-5xl lg:text-6xl font-bold"
              style={{
                fontFamily: mergedData.heroIconTypography || data.headingFont,
                color: mergedData.heroIconTextColor || data.mainColor2,
                display: "flex",
                alignItems: "center",
                textShadow: `0 4px 6px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`
              }}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  if (data.nameType === "couple") {
                    const name1 = (data.hisName || "").charAt(0).toUpperCase();
                    const name2 = (data.herName || "").charAt(0).toUpperCase();
                    const initial1 = mergedData.heroIconName2First ? name2 : name1;
                    const initial2 = mergedData.heroIconName2First ? name1 : name2;
                    const separator = data.heroIconAddAmpersand
                      ? `<span style="font-size: 0.6em; display: inline-block; vertical-align: middle;">${data.andText || "&"}</span>`
                      : "";
                    return `${initial1}${separator}${initial2}`;
                  }
                  return displayName.charAt(0).toUpperCase();
                })()
              }}
            />
          </div>
        ) : null}

        {/* Host Line Image */}
        {data.heroHostLineImage && data.heroHostLineImage !== "hostline-00" && (
          <div
            className={`w-56 h-32 max-w-[80vw] ${editMode ? "cursor-pointer" : "pointer-events-none"}`}
            onClick={editMode ? () => {
              const images: ("hostline-01" | "hostline-02" | "hostline-03" | "hostline-04" | "hostline-05" | "hostline-06" | "hostline-07" | "hostline-08" | "hostline-09")[] = ["hostline-01", "hostline-02", "hostline-03", "hostline-04", "hostline-05", "hostline-06", "hostline-07", "hostline-08", "hostline-09"];
              // If current is hostline-00 or not found, start with hostline-01
              const currentImage = heroMergedData.heroHostLineImage === "hostline-00" ? "hostline-01" : heroMergedData.heroHostLineImage || "hostline-01";
              const currentIndex = images.indexOf(currentImage as any);
              const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % images.length;
              handleHeroChange("heroHostLineImage", images[nextIndex]);
            } : undefined}
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
        )}

        {/* Invite message */}
        <p
          id="hero-message"
          className={`text-[9px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase ${editMode ? "cursor-pointer" : ""}`}
          onClick={editMode ? () => {
            const currentOpacity = heroMergedData.heroHostLineImageOpacity ?? 1;
            const newOpacity = currentOpacity > 0.5 ? 0 : 1;
            handleHeroChange("heroHostLineImageOpacity", newOpacity);
          } : undefined}
          style={{
            color: heroMergedData.heroIconTextColor || "white",
            fontFamily: getFontFamily(heroMergedData.heroOthersTypography || data.bodyFont, "body"),
            textShadow: `0 2px 4px rgba(0, 0, 0, ${heroMergedData.heroTextShadowOpacity ?? 0.1})`,
            marginTop: heroMergedData.heroHostLineImage && heroMergedData.heroHostLineImage !== "hostline-00" ? -60 : 0,
            fontSize: `${(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1) * (heroMergedData.heroOthersTextSize ?? 1) * 100}%`
          }}
        >
          {data.heroMessage || "We are getting married!"}
        </p>

        {/* Couple Name */}
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl leading-tight ${editMode ? "cursor-pointer" : ""}`}
          onClick={editMode ? () => {
            setShowNamePanel(true);
            document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } : undefined}
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
          dangerouslySetInnerHTML={{
            __html: (() => {
              if (data.nameType === "couple") {
                const name1 = mergedData.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                const name2 = mergedData.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                const andText = data.andText || "&";
                const ampersandScale = (mergedData.heroAmpersandSize || 100) / 100;
                const ampersandOpacity = (mergedData.heroAmpersandOpacity || 100) / 100;
                
                switch (mergedData.heroAmpersandPosition) {
                  case "first-line":
                    return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(mergedData.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                  case "middle-line":
                    return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(mergedData.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                  case "second-line":
                    return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(mergedData.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                  case "default":
                  default:
                    return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(mergedData.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                }
              }
              return displayName;
            })()
          }}
        />

        {/* Date - Box Layout (Default Structure) */}
        {dateComponents && mergedData.heroDateStructure !== "alternative" && mergedData.heroDateStructure !== "icon" && mergedData.heroDateStructure !== "elegant" && mergedData.heroDateStructure !== "modern" && mergedData.heroDateStructure !== "huge" && (
          <div 
            id="hero-date"
            className={`flex flex-col items-center gap-1 font-sans ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowDateStructurePanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{ 
              color: mergedData.heroOthersColor || "white", 
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`
            }}
          >
            {/* Top box - Month */}
            <div
              className="text-xs md:text-sm tracking-[0.2em] uppercase font-bold text-center"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
              }}
            >
              {dateComponents.month}
            </div>

            {/* Middle row - 5 boxes */}
            <div className="flex items-center gap-0 w-full max-w-sm">
              {/* Box 1: Day with left-fading line */}
              <div className="flex items-center justify-end shrink-0 w-20 md:w-32">
                <div className="w-16 md:w-24 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" />
                <div 
                  className="text-xs md:text-xs tracking-[0.2em] uppercase text-right"
                  style={{
                    fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                  }}
                >
                  {dateComponents.day}
                </div>
              </div>

              {/* Box 2: Line divider */}
              <div className="flex justify-center shrink-0">
                <div className="w-3 md:w-4 h-[1px] bg-current opacity-50" />
              </div>

              {/* Box 3: Date number (largest) */}
              <div className="flex-1 flex items-center justify-center text-2xl md:text-4xl font-bold tracking-[0.1em]">
                {dateComponents.date}
              </div>

              {/* Box 4: Line divider */}
              <div className="flex justify-center shrink-0">
                <div className="w-3 md:w-4 h-[1px] bg-current opacity-50" />
              </div>

              {/* Box 5: Time with right-fading line */}
              <div className="flex items-center justify-start shrink-0 w-20 md:w-32">
                <div 
                  className="text-xs md:text-xs tracking-[0.2em] uppercase text-left whitespace-nowrap"
                  style={{
                    fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body")
                  }}
                >
                  {data.time || "4:00 PM"}
                </div>
                <div className="w-16 md:w-24 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" />
              </div>
            </div>

            {/* Bottom box - Year */}
            <div 
              className="text-xs md:text-sm tracking-[0.2em] uppercase font-bold text-center"
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
            className={`flex flex-col items-center gap-1 font-sans text-center ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowDateStructurePanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{ 
              color: mergedData.heroOthersColor || "white", 
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`
            }}
          >
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
            className={`flex flex-col items-center gap-1 font-sans text-center ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowDateStructurePanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`
            }}
          >
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
            className={`flex items-center gap-0 font-sans text-center ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowDateStructurePanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`
            }}
          >
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
            className={`flex items-center gap-0 font-sans text-center ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowDateStructurePanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`
            }}
          >
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
            className={`flex flex-col items-center gap-3 font-sans ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowDateStructurePanel(true);
              document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } : undefined}
            style={{
              color: mergedData.heroOthersColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(mergedData.heroOthersTextSize ?? 1) * (!isMobile ? 24 : 16)}px`,
              transform: `scale(${(mergedData.heroDateStructureSize ?? 100) / 100})`,
              marginTop: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.8}px`,
              marginBottom: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.8}px`,
              marginLeft: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`,
              marginRight: `${(mergedData.heroDateStructureSpacing ?? 100) * 0.4}px`
            }}
          >
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
            className={`flex flex-col items-center gap-1 ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => onUpdateHeroVenueStructure?.(data.heroVenueStructure === "icon" ? "default" : "icon") : undefined}
          >
            {/* Icon structure */}
            {data.heroVenueStructure === "icon" && (
              <div 
                className="w-6 h-6"
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
              className="text-[8px] tracking-[0.1em] uppercase font-bold"
              style={{
                fontFamily: getFontFamily(mergedData.heroOthersTypography || data.bodyFont, "body"),
                color: mergedData.heroIconTextColor || "white",
                textShadow: `0 2px 4px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1})`,
                fontSize: `${(mergedData.heroOthersTextSize ?? 1) * 100}%`
              }}
            >
              {data.venueName}
            </p>
          </div>
        )}

        {/* Closing Sentiment */}
        {data.heroClosingSentiment && (
          <p
            className={`text-[9px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              const currentOpacity = heroMergedData.heroClosingSentimentImageOpacity ?? 1;
              const newOpacity = currentOpacity > 0.5 ? 0 : 1;
              handleHeroChange("heroClosingSentimentImageOpacity", newOpacity);
            } : undefined}
            style={{
              fontFamily: getFontFamily(heroMergedData.heroOthersTypography || data.bodyFont, "body"),
              color: heroMergedData.heroIconTextColor || "white",
              textShadow: `0 2px 4px rgba(0, 0, 0, ${heroMergedData.heroTextShadowOpacity ?? 0.1})`,
              fontSize: `${(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1) * (heroMergedData.heroOthersTextSize ?? 1) * 100}%`
            }}
          >
            {data.heroClosingSentiment}
          </p>
        )}

        {/* Closing Sentiment Image */}
        {data.heroClosingSentimentImage && data.heroClosingSentimentImage !== "fsentiment-00" && (
          <div
            className={`w-56 h-32 max-w-[80vw] ${editMode ? "cursor-pointer" : "pointer-events-none"}`}
            onClick={editMode ? () => {
              const images: ("fsentiment-01" | "fsentiment-02" | "fsentiment-03" | "fsentiment-04" | "fsentiment-05" | "fsentiment-06" | "fsentiment-07")[] = ["fsentiment-01", "fsentiment-02", "fsentiment-03", "fsentiment-04", "fsentiment-05", "fsentiment-06", "fsentiment-07"];
              // If current is fsentiment-00 or not found, start with fsentiment-01
              const currentImage = heroMergedData.heroClosingSentimentImage === "fsentiment-00" ? "fsentiment-01" : heroMergedData.heroClosingSentimentImage || "fsentiment-01";
              const currentIndex = images.indexOf(currentImage as any);
              const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % images.length;
              handleHeroChange("heroClosingSentimentImage", images[nextIndex]);
            } : undefined}
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
              maskRepeat: "no-repeat",
              marginTop: -60
            }}
          />
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
              {/* Display Logo */}
              <div className="space-y-3">
                <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>DISPLAY LOGO</label>
                <div className="space-y-3">
                  {/* Icon Type Hybrid Control */}
                  <div className="flex items-center gap-2">
                    {/* Previous Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        const options: ("none" | "image" | "initial")[] = ["none", "image", "initial"];
                        const currentIndex = options.indexOf(mergedData.heroIconType ?? "image");
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                        handleNameChange("heroIconType", options[prevIndex]);
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 border ${
                        isDarkMode 
                          ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                          : "hover:bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = accentColor;
                        e.currentTarget.style.borderColor = accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '';
                        e.currentTarget.style.borderColor = '';
                      }}
                    >
                      <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    <select
                      value={mergedData.heroIconType ?? "image"}
                      onChange={(e) => handleNameChange("heroIconType", e.target.value as "image" | "initial" | "none")}
                      className={`flex-1 px-3 py-2.5 border rounded-lg text-sm appearance-none cursor-pointer text-center transition-all duration-200 ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"}`}
                      style={{
                        ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
                        fontFamily: "Inter, sans-serif",
                        backgroundImage: 'none',
                        paddingRight: '12px'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = accentColor;
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${accentColor}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <option value="none">None</option>
                      <option value="image">Use Image Icon</option>
                      <option value="initial">Use Name Initial</option>
                    </select>

                    {/* Next Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        const options: ("none" | "image" | "initial")[] = ["none", "image", "initial"];
                        const currentIndex = options.indexOf(mergedData.heroIconType ?? "image");
                        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                        handleNameChange("heroIconType", options[nextIndex]);
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 border ${
                        isDarkMode 
                          ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                          : "hover:bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = accentColor;
                        e.currentTarget.style.borderColor = accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '';
                        e.currentTarget.style.borderColor = '';
                      }}
                    >
                      <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Upload Image Options */}
                  {mergedData.heroIconType === "image" && (
                    <>
                      {/* URL Input */}
                      <input
                        type="text"
                        value={mergedData.heroIcon || ""}
                        onChange={(e) => handleNameChange("heroIcon", e.target.value)}
                        placeholder="Paste icon URL here..."
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "border-gray-200"}`}
                        style={{ fontFamily: "Inter, sans-serif" }}
                      />
                    </>
                  )}

                  {/* Name Initial Options */}
                  {mergedData.heroIconType === "initial" && (
                    <>
                      {/* Add & Checkbox */}
                      {data.nameType === "couple" && (
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="heroIconAddAmpersand"
                            checked={mergedData.heroIconAddAmpersand ?? true}
                            onChange={(e) => handleNameChange("heroIconAddAmpersand", e.target.checked)}
                            className={`w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#b88a78] ${
                              isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                            }`}
                            style={{
                              accentColor: accentColor
                            }}
                          />
                          <label htmlFor="heroIconAddAmpersand" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Add '&'</label>
                        </div>
                      )}
                      {/* Typography */}
                      <div className="space-y-2">
                        <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Typography</label>
                        <HybridFontControl
                          value={mergedData.heroIconTypography || data.headingFont}
                          onChange={(v) => handleNameChange("heroIconTypography", v)}
                          type="heading"
                          label=""
                          showPreview={false}
                          isDarkMode={isDarkMode}
                          accentColor={accentColor}
                          predefinedFonts={predefinedHeadingFonts}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

              {/* Reverse names checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="reverseNames"
                  checked={mergedData.heroIconName2First ?? false}
                  onChange={(e) => handleNameChange('heroIconName2First', e.target.checked)}
                  className={`w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#b88a78] ${
                    isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  }`}
                  style={{
                    accentColor: accentColor
                  }}
                />
                <label htmlFor="reverseNames" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Reverse names</label>
              </div>

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
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Ampersand(&) position</label>
                <select
                  value={data.heroAmpersandPosition ?? "default"}
                  onChange={(e) => handleNameChange('heroAmpersandPosition', e.target.value as "default" | "first-line" | "middle-line" | "second-line")}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "border-gray-200"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <option value="default">Default (same line)</option>
                  <option value="first-line">First line</option>
                  <option value="middle-line">Middle line</option>
                  <option value="second-line">Second line</option>
                </select>
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

              {/* Name Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Name Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroNameSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={mergedData.heroNameSize || 100}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    handleNameChange('heroNameSize', size);
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroNameSize || 100) - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.heroNameSize || 100) - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Ampersand Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Ampersand (&) Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroAmpersandSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={mergedData.heroAmpersandSize || 100}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    handleNameChange('heroAmpersandSize', size);
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroAmpersandSize || 100) - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.heroAmpersandSize || 100) - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Ampersand Visibility Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Ampersand (&) Visibility</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroAmpersandOpacity || 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mergedData.heroAmpersandOpacity || 100}
                  onChange={(e) => {
                    const opacity = parseInt(e.target.value);
                    handleNameChange('heroAmpersandOpacity', opacity);
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.heroAmpersandOpacity || 100)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.heroAmpersandOpacity || 100)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

              {/* Others Section */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>Others</label>
                </div>
                
                {/* Size */}
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Size</label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="1"
                      value={(mergedData.heroOthersTextSize ?? 1) * 100}
                      onChange={(e) => handleNameChange('heroOthersTextSize', parseInt(e.target.value) / 100)}
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                      style={{
                        accentColor: accentColor,
                        background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroOthersTextSize ?? 1) * 100 - 50) / 100 * 100}%, ${isDarkMode ? "#374151" : "#E5E7EB"} ${((mergedData.heroOthersTextSize ?? 1) * 100 - 50) / 100 * 100}%, ${isDarkMode ? "#374151" : "#E5E7EB"} 100%)`
                      }}
                    />
                    <div className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {Math.round((mergedData.heroOthersTextSize ?? 1) * 100)}%
                    </div>
                  </div>
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

              {/* Instruction text - only in desktop mode, inside scrollable area */}
              {desktopMode && (
                <div className="px-5 pt-2 pb-4">
                  <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Change the Host line and Final sentiment message in Details tab → MESSAGE section
                  </p>
                </div>
              )}
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

            {/* Instruction text - only in mobile mode, outside scrollable area */}
            {!desktopMode && (
              <div className="px-5 pt-2 pb-4 shrink-0">
                <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Change the Host line and Final sentiment message in Details tab → MESSAGE section
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Icon Adjustment Panel */}
      {editMode && showIconPanel && (
        <>
          {/* Backdrop */}
          {!isIconPanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseIconPanel} onWheel={handleCloseIconPanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isIconPanelClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isIconPanelClosing ? "animate-slide-down" : "animate-slide-up"}`
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
                Display Icon
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Icon Type Dropdown */}
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Icon Type</label>
                <select
                  value={mergedData.heroIconType ?? "image"}
                  onChange={(e) => handleIconChange('heroIconType', e.target.value as "image" | "initial" | "none")}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "border-gray-200"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <option value="none">None</option>
                  <option value="image">Use Image Icon</option>
                  <option value="initial">Use Name Initial</option>
                </select>
              </div>

              {/* Instruction when None is selected */}
              {mergedData.heroIconType === "none" && (
                <p className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  You can also bring back the icon in the:<br />
                  Section Tab - Hero Section
                </p>
              )}

              {/* Upload Image Options */}
              {data.heroIconType === "image" && (
                <>
                  <div className="space-y-2">
                    {/* URL Input and Upload Button side by side */}
                    <input
                      type="text"
                      value={mergedData.heroIcon || ""}
                      onChange={(e) => handleIconChange('heroIcon', e.target.value)}
                      placeholder="Paste icon URL here..."
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                </>
              )}

              {/* Name Initial Options */}
              {mergedData.heroIconType === "initial" && (
                <>
                  {/* Typography dropdown */}
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Typography</label>
                    <FontControl
                      value={mergedData.heroIconTypography || data.headingFont}
                      onChange={(v) => handleIconChange('heroIconTypography', v)}
                      type="heading"
                      label=""
                      showPreview={false}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Add & checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="addAmpersand"
                      checked={mergedData.heroIconAddAmpersand ?? false}
                      onChange={(e) => handleIconChange('heroIconAddAmpersand', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-[#b88a78]"
                    />
                    <label htmlFor="addAmpersand" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Add &</label>
                  </div>
                </>
              )}

              {/* Icon Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Icon Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroIconSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.heroIconSize || 100}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    handleIconChange('heroIconSize', size);
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: data.accentColor || "#B88A78",
                    background: `linear-gradient(to right, ${data.accentColor || "#b88a78"} 0%, ${data.accentColor || "#b88a78"} ${((mergedData.heroIconSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.heroIconSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Icon Margin Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Icon Margin</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroIconMarginAdjustment || 0}px</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={mergedData.heroIconMarginAdjustment || 0}
                  onChange={(e) => {
                    const adjustment = parseInt(e.target.value);
                    handleIconChange('heroIconMarginAdjustment', adjustment);
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: data.accentColor || "#B88A78",
                    background: `linear-gradient(to right, ${data.accentColor || "#b88a78"} 0%, ${data.accentColor || "#b88a78"} ${((mergedData.heroIconMarginAdjustment || 0) + 30) / 60 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.heroIconMarginAdjustment || 0) + 30) / 60 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>
            </div>
            
            {/* Close Button */}
            <div className={`px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-end ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <button
                type="button"
                onClick={handleCloseIconPanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:brightness-90"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: data.accentColor
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
                max="150"
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
