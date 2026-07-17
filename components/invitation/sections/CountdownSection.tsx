"use client";

import { useState, useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import HybridDropdown from "@/components/shared/HybridDropdown";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

// Add CSS for flip animation
const flipAnimationStyles = `
  @keyframes flipCard {
    0% {
      transform: rotateX(0deg);
    }
    50% {
      transform: rotateX(90deg);
    }
    100% {
      transform: rotateX(0deg);
    }
  }
  
  .flip-card-inner {
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }
`;

interface CountdownSectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
  editMode?: boolean;
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onPendingChangesChange?: (changes: Partial<InvitationData>) => void;
}

export default function CountdownSection({ data, onChange, panelPosition = "left", desktopMode = false, editMode = false, onHasUnsavedChangesChange, onPendingChangesChange }: CountdownSectionProps) {
  if (!data.sections.countdown) return null;

  const { isDarkMode, accentColor } = useTheme();
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [showCountdownSettingsPanel, setShowCountdownSettingsPanel] = useState(false);
  const [isCountdownSettingsClosing, setIsCountdownSettingsClosing] = useState(false);
  const [showIconPanel, setShowIconPanel] = useState(false);
  const [isIconPanelClosing, setIsIconPanelClosing] = useState(false);
  
  // Typography panel state
  const [hasUnsavedTypographyChanges, setHasUnsavedTypographyChanges] = useState(false);
  const [pendingTypographyChanges, setPendingTypographyChanges] = useState<Partial<InvitationData>>({});
  
  // Countdown Settings panel state
  const [hasUnsavedCountdownChanges, setHasUnsavedCountdownChanges] = useState(false);
  const [pendingCountdownChanges, setPendingCountdownChanges] = useState<Partial<InvitationData>>({});
  
  // Icon panel state
  const [hasUnsavedIconChanges, setHasUnsavedIconChanges] = useState(false);
  const [pendingIconChanges, setPendingIconChanges] = useState<Partial<InvitationData>>({});
  
  const [activePanel, setActivePanel] = useState<"typography" | "countdown" | "icon" | null>(null);

  // Fetch predefined options from Supabase
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedImages } = usePredefinedOptions('background_images');
  const { options: predefinedVideos } = usePredefinedOptions('background_videos');
  const { options: predefinedDividerImagesCentered } = usePredefinedOptions('dividers_centeredsingle');
  const { options: predefinedDividerImagesMirrored } = usePredefinedOptions('dividers_mirroredcorners');
  const { options: predefinedDividerImagesSplit } = usePredefinedOptions('dividers_splithorizontal');

  const [predefinedImageIndex, setPredefinedImageIndex] = useState(0);
  const [predefinedVideoIndex, setPredefinedVideoIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [countdownStructure, setCountdownStructure] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdownCrystalColor, setCountdownCrystalColor] = useState<string>("");
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  // Helper function to get crystal color based on selection
  const getCountdownCrystalColor = () => {
    // Use the custom countdown crystal color if set, otherwise default to mainColor2
    const mergedData = { ...data, ...pendingCountdownChanges };
    return mergedData.countdownCrystalColor || data.mainColor2 || "#ffffff";
  };

  // Handler for countdown changes - saves to local state for live preview and queues for global apply
  const handleCountdownChange = (key: keyof InvitationData, value: any) => {
    console.log('CountdownSettings: handleCountdownChange called', key, value);
    setPendingCountdownChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedCountdownChanges(true);
    if (onHasUnsavedChangesChange) {
      onHasUnsavedChangesChange(true);
    }
    onChange?.(key, value);
    console.log('CountdownSettings: hasUnsavedCountdownChanges set to true');
  };

  // Notify parent of pending changes when they change
  useEffect(() => {
    if (onPendingChangesChange) {
      onPendingChangesChange(pendingCountdownChanges);
    }
  }, [pendingCountdownChanges, onPendingChangesChange]);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const countdownStructures = [
    { id: 0, name: "Classic Glass Cards" },
    { id: 1, name: "Circular Orbs" },
    { id: 2, name: "Minimal Timeline" },
    { id: 3, name: "Layered Cards" },
    { id: 4, name: "Diamond Rotations" },
    { id: 5, name: "Frame Design" },
    { id: 6, name: "Compact Layout" },
    { id: 7, name: "Split Layout" },
    { id: 8, name: "Flip Cards" },
  ];

  // Helper function to normalize video URLs
  const normalizeVideoUrl = (url: string) => {
    if (!url) return url;

    // Pexels download URLs - they already return the video file directly
    // Format: https://www.pexels.com/download/video/{id}/
    if (url.includes('pexels.com/download/video/')) {
      return url;
    }

    // Pexels regular video page - convert to download URL
    // Format: https://www.pexels.com/video/{id}/
    const pexelsMatch = url.match(/pexels\.com\/video\/(\d+)/);
    if (pexelsMatch) {
      return `https://www.pexels.com/download/video/${pexelsMatch[1]}/`;
    }

    // Return original URL if no pattern matches
    return url;
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

  const handleCloseTypographyPanel = () => {
    setPendingTypographyChanges({});
    setHasUnsavedTypographyChanges(false);
    setIsTypographyClosing(true);
    setTimeout(() => {
      setShowTypographyPanel(false);
      setIsTypographyClosing(false);
    }, 300);
  };

  const handleCloseCountdownSettingsPanel = () => {
    setPendingCountdownChanges({});
    setHasUnsavedCountdownChanges(false);
    setIsCountdownSettingsClosing(true);
    setTimeout(() => {
      setShowCountdownSettingsPanel(false);
      setIsCountdownSettingsClosing(false);
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

  // Handler for icon changes - saves to local state for live preview and queues for global apply
  const handleIconChange = (key: keyof InvitationData, value: any) => {
    setPendingIconChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedIconChanges(true);
    if (onHasUnsavedChangesChange) {
      onHasUnsavedChangesChange(true);
    }
    onChange?.(key, value);
  };

  const handleCountdownCrystalColorChange = () => {
    // This function is no longer needed since we're using the settings panel
    // Keeping it for backward compatibility but it won't be used
  };

  // Handle right-click for desktop and long-press for mobile
  const handleCountdownStructureChange = (e: React.MouseEvent | React.TouchEvent) => {
    if (!editMode) return;
    
    // Prevent default context menu for right-click
    if ('preventDefault' in e) {
      e.preventDefault();
    }
    
    setCountdownStructure((prev) => (prev + 1) % 9);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    
    // Only start long-press timer for left click (button 0)
    if (e.button === 0) {
      const timer = setTimeout(() => {
        setCountdownStructure((prev) => (prev + 1) % 9);
      }, 500); // 500ms long-press
      setLongPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!editMode) return;
    
    const timer = setTimeout(() => {
      setCountdownStructure((prev) => (prev + 1) % 9);
    }, 500); // 500ms long-press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingCountdownChanges, ...pendingIconChanges };

  // Initialize crystal color from saved data
  useEffect(() => {
    if (data.countdownCrystalColor) {
      setCountdownCrystalColor(data.countdownCrystalColor);
    }
  }, [data.countdownCrystalColor]);

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.countdownBackgroundType === "color" && !mergedData.countdownBackgroundColor) {
      handleCountdownChange("countdownBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.countdownBackgroundType === "gradient" && !mergedData.countdownGradient) {
      handleCountdownChange("countdownGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.countdownBackgroundType === "image" && !mergedData.countdownImage) {
      handleCountdownChange("countdownImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleCountdownChange("countdownGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.countdownBackgroundType === "video" && !mergedData.countdownVideo) {
      handleCountdownChange("countdownVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleCountdownChange("countdownGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.countdownBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.countdownBackgroundType === "image" && mergedData.countdownImage?.urls && mergedData.countdownImage.urls.length > 1) {
      const validUrls = mergedData.countdownImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.countdownBackgroundType, mergedData.countdownImage?.urls]);

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const parseDate = (dateStr: string, timeStr: string) => {
      // Parse YYYY-MM-DD format with time
      if (!dateStr) return new Date();
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const timeMatch = timeStr?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      
      if (!timeMatch) return new Date(year, month - 1, day, 0, 0);
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const meridiem = timeMatch[3]?.toUpperCase();
      
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      return new Date(year, month - 1, day, hours, minutes);
    };

    const targetDate = parseDate(data.date, data.time).getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [data.date, data.time]);

  // Handle click outside and scroll outside for Countdown Settings panel
  useEffect(() => {
    if (!showCountdownSettingsPanel) return;

    const handleClickOutside = (e: MouseEvent) => {
      const panel = document.querySelector('[data-countdown-settings-panel="true"]');
      if (panel && !panel.contains(e.target as Node)) {
        handleCloseCountdownSettingsPanel();
      }
    };

    const handleScrollOutside = (e: Event) => {
      const panel = document.querySelector('[data-countdown-settings-panel="true"]');
      if (panel) {
        // Check if the scroll is happening outside the panel
        const scrollTarget = e.target as Element;
        const isScrollingInsidePanel = panel.contains(scrollTarget) || panel === scrollTarget;
        
        // Also check if we're scrolling the document/window (not the panel)
        const isDocumentScroll = scrollTarget === document.documentElement || scrollTarget === document.body;
        
        if (!isScrollingInsidePanel || isDocumentScroll) {
          handleCloseCountdownSettingsPanel();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const panel = document.querySelector('[data-countdown-settings-panel="true"]');
      if (panel && !panel.contains(e.target as Node)) {
        handleCloseCountdownSettingsPanel();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const panel = document.querySelector('[data-countdown-settings-panel="true"]');
      if (panel && !panel.contains(e.target as Node)) {
        handleCloseCountdownSettingsPanel();
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScrollOutside, true);
    window.addEventListener('scroll', handleScrollOutside, true);
    document.addEventListener('wheel', handleWheel, true);
    document.addEventListener('touchmove', handleTouchMove, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScrollOutside, true);
      window.removeEventListener('scroll', handleScrollOutside, true);
      document.removeEventListener('wheel', handleWheel, true);
      document.removeEventListener('touchmove', handleTouchMove, true);
    };
  }, [showCountdownSettingsPanel, hasUnsavedCountdownChanges, handleCloseCountdownSettingsPanel]);

  const countdownUseDefaultDivider = data.countdownDividerUseDefault ?? true;
  const effectivePullDown = countdownUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.countdownDividerPullDown ?? 0);
  const effectiveVerticalFlip = countdownUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.countdownDividerVerticalFlip ?? false);

  return (
    <>
      <style>{flipAnimationStyles}</style>
      <section className="pt-0 pb-8 px-8 text-center relative min-h-[200px]" style={{
        backgroundColor: mergedData.countdownUseMainColor !== false
          ? (data.mainColor1 || "transparent")
          : mergedData.countdownBackgroundType === "gradient"
            ? undefined
            : mergedData.countdownBackgroundType === "image"
              ? undefined
              : mergedData.countdownBackgroundType === "video"
                ? undefined
                : (mergedData.countdownBackgroundColor || "transparent"),
        background: mergedData.countdownUseMainColor !== false
          ? (data.mainColor1 || "transparent")
          : mergedData.countdownBackgroundType === "gradient" && mergedData.countdownGradient
            ? `linear-gradient(135deg, ${mergedData.countdownGradient.firstColor || "#ffffff"}, ${mergedData.countdownGradient.secondColor || "#ffffff"})`
            : undefined,
        ...(mergedData.countdownBackgroundType === "image" && mergedData.countdownImage?.urls && mergedData.countdownImage.urls.length > 0 ? {
          backgroundImage: `url(${mergedData.countdownImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        } : {}),
        transition: 'background 1s ease-in-out'
      }}>
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.countdownBackgroundType === "image" || mergedData.countdownBackgroundType === "video") && mergedData.countdownGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.countdownGradient.firstColor || "#ffffff", (mergedData.countdownGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.countdownGradient.secondColor || "#ffffff", (mergedData.countdownGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.countdownBackgroundType === "video" && mergedData.countdownVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.countdownVideo.url)}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      )}

      {/* Content Wrapper - positioned above gradient overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>
      
      <Divider 
        type={countdownUseDefaultDivider ? (data.universalDivider || "none") : (data.countdownDivider || "none")} 
        color={getCountdownCrystalColor()} 
        id="countdown-cssid" 
        offset={countdownUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.countdownDividerOffset ?? 0)}
        tintColor={countdownUseDefaultDivider ? (data.universalDividerTintColor || getCountdownCrystalColor()) : (data.countdownDividerTintColor || getCountdownCrystalColor())}
        tintOpacity={countdownUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.countdownDividerTintOpacity ?? 100)}
        dividerStyle={countdownUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.countdownDividerStyle || "centered-single")}
        flip={countdownUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.countdownDividerFlip ?? false)}
        spacing={countdownUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.countdownDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={countdownUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.countdownDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={countdownUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.countdownDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={countdownUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.countdownDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={countdownUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.countdownDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={countdownUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.countdownDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (countdownUseDefaultDivider) {
            onChange?.("countdownDividerUseDefault", false);
          }
          onChange?.("countdownDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('countdown-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Countdown Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.countdownDivider && data.countdownDivider !== "none" ? data.countdownDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("countdownDivider", value)}
          tintColor={data.countdownDividerTintColor || getCountdownCrystalColor()}
          onTintColorChange={(value) => onChange?.("countdownDividerTintColor", value)}
          tintOpacity={data.countdownDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("countdownDividerTintOpacity", value)}
          dividerStyle={data.countdownDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("countdownDividerStyle", value)}
          flip={data.countdownDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("countdownDividerFlip", value)}
          spacing={data.countdownDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("countdownDividerSpacing", value)}
          pullDown={data.countdownDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("countdownDividerPullDown", value)}
          verticalFlip={data.countdownDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("countdownDividerVerticalFlip", value)}
          imageSize={data.countdownDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("countdownDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.countdownDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("countdownDividerCustomImageUrl1", value)}
          customImageUrl2={data.countdownDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("countdownDividerCustomImageUrl2", value)}
          customImageUrl3={data.countdownDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("countdownDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.countdownDivider === "divider-1" ? predefinedDividerImagesCentered : data.countdownDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={countdownUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("countdownDividerUseDefault", value)}
          colorBlend={data.countdownDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("countdownDividerColorBlend", value)}
        />
      )}
      
      {/* Icon */}
      {mergedData.heroIconType === "image" && mergedData.heroIcon ? (
        <div
          id="countdown-icon"
          className={`w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 relative mx-auto ${editMode ? "cursor-pointer" : ""}`}
          onClick={editMode ? () => {
            setShowIconPanel(true);
            document.getElementById('countdown-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } : undefined}
            style={{ filter: `drop-shadow(0 4px 6px rgba(0, 0, 0, ${mergedData.heroTextShadowOpacity ?? 0.1}))`, marginBottom: `${30 + (mergedData.heroIconMarginAdjustment || 0)}px`, transform: `scale(${(mergedData.heroIconSize || 100) / 100})` }}
          >
            {mergedData.heroIconColorTint ? (
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: mergedData.heroIconTextColor || mergedData.heroIconColorTint,
                  opacity: mergedData.heroIconTextColor ? 1 : (mergedData.heroIconColorTintOpacity ?? 1),
                  WebkitMaskImage: `url(${mergedData.heroIcon})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url(${mergedData.heroIcon})`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat",
                }}
              />
            ) : (
              <img
                src={mergedData.heroIcon}
                alt="Countdown icon"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ) : mergedData.heroIconType === "initial" ? (
          <div
            id="countdown-icon"
            className={`w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 flex items-center justify-center mx-auto ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? () => {
              setShowIconPanel(true);
              document.getElementById('countdown-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                    const separator = mergedData.heroIconAddAmpersand
                      ? `<span style="font-size: 0.6em; display: inline-block; vertical-align: middle;">${data.andText || "&"}</span>`
                      : "";
                    return `${initial1}${separator}${initial2}`;
                  }
                  return (data.coupleName || "").charAt(0).toUpperCase();
                })()
              }}
            />
          </div>
        ) : null}
      
      <h2
        className="text-2xl mb-1 md:mb-8 font-bold uppercase scale-[0.55] md:scale-100"
        style={{
          color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
          fontFamily: mergedData.countdownUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.countdownHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.countdownHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2',
          marginTop: '50px'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('countdown-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.countdownHeading || "Counting Down"}
        </span>
      </h2>

      {mergedData.countdownMessage && (
        <p
          className="text-center mb-6 leading-relaxed scale-[0.7] md:scale-100"
          style={{
            color: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1),
            fontFamily: mergedData.countdownUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.countdownMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.countdownMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.countdownMessage}
        </p>
      )}
      {/* Countdown Display - Multiple Structures */}
      <div 
        className={`${editMode ? "cursor-pointer" : ""} transition-all duration-300`}
        onClick={editMode ? () => {
          setShowCountdownSettingsPanel(true);
          const element = document.getElementById('countdown-cssid');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } : undefined}
        onContextMenu={editMode ? handleCountdownStructureChange : undefined}
        onMouseDown={editMode ? handleMouseDown : undefined}
        onMouseUp={editMode ? handleMouseUp : undefined}
        onMouseLeave={editMode ? handleMouseUp : undefined}
        onTouchStart={editMode ? handleTouchStart : undefined}
        onTouchEnd={editMode ? handleTouchEnd : undefined}
      >
        {/* Structure 1: Classic Glass Cards */}
        {countdownStructure === 0 && (
          <div className="flex justify-center gap-4 md:gap-8">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Seconds" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center min-w-[70px] md:min-w-[90px]"
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl mb-2 backdrop-blur-xl"
                  style={{
                    backgroundColor: hexToRgba(getCountdownCrystalColor(), 0.1),
                    border: `1px solid ${hexToRgba(getCountdownCrystalColor(), 0.2)}`,
                    boxShadow: `0 8px 32px ${hexToRgba(getCountdownCrystalColor(), 0.1)}`,
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: getFontFamily(data.headingFont, "heading"),
                  }}
                >
                  <span className="text-2xl md:text-3xl font-bold">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{
                    color: data.neutralColor1,
                    opacity: 0.7,
                    fontFamily: getFontFamily(data.bodyFont, "body"),
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Structure 2: Circular Pills */}
        {countdownStructure === 1 && (
          <div className="flex justify-center gap-3 md:gap-6">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Seconds" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center"
              >
                <div
                  className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center backdrop-blur-xl mb-2"
                  style={{
                    backgroundColor: hexToRgba(getCountdownCrystalColor(), 0.15),
                    border: `2px solid ${hexToRgba(getCountdownCrystalColor(), 0.3)}`,
                    boxShadow: `0 12px 40px ${hexToRgba(getCountdownCrystalColor(), 0.15)}`,
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: getFontFamily(data.headingFont, "heading"),
                    borderRadius: '50%',
                  }}
                >
                  <span className="text-2xl md:text-3xl font-bold">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: getFontFamily(data.bodyFont, "body"),
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Structure 3: Minimalist Lines */}
        {countdownStructure === 2 && (
          <div className="flex justify-center items-center gap-6 md:gap-12">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Seconds" },
            ].map((item, index) => (
              <div
                key={item.label}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div
                    className="flex items-center justify-center px-4 md:px-6 py-2 backdrop-blur-xl"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor(), 0.05),
                      borderTop: `2px solid ${getCountdownCrystalColor()}`,
                      borderBottom: `2px solid ${getCountdownCrystalColor()}`,
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    <span className="text-3xl md:text-4xl font-bold">
                      {String(item.value).padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className="text-xs uppercase tracking-wider mt-2 font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className="hidden md:block absolute top-1/2 -translate-y-1/2 w-8 h-0.5"
                    style={{
                      backgroundColor: getCountdownCrystalColor(),
                      left: '100%',
                      marginLeft: '1rem',
                      opacity: 0.3
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Structure 4: Stacked Cards */}
        {countdownStructure === 3 && (
          <div className="flex justify-center gap-2 md:gap-4">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Seconds" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center relative"
              >
                <div className="relative">
                  {/* Shadow layers */}
                  <div
                    className="absolute inset-0 backdrop-blur-xl rounded-xl"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.05),
                      transform: 'translate(2px, 4px)',
                      zIndex: 1,
                    }}
                  />
                  <div
                    className="absolute inset-0 backdrop-blur-xl rounded-xl"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.08),
                      transform: 'translate(1px, 2px)',
                      zIndex: 2,
                    }}
                  />
                  {/* Main card */}
                  <div
                    className="relative w-16 h-20 md:w-20 md:h-24 flex items-center justify-center backdrop-blur-xl rounded-xl"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.12),
                      border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.2)}`,
                      boxShadow: `0 4px 20px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.1)}`,
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                      zIndex: 3,
                    }}
                  >
                    <span className="text-2xl md:text-3xl font-bold">
                      {String(item.value).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <span
                  className="text-xs uppercase tracking-wider mt-2 font-medium"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: getFontFamily(data.bodyFont, "body"),
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Structure 5: Diamond Shape */}
        {countdownStructure === 4 && (
          <div className="flex justify-center gap-4 md:gap-8">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Seconds" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center"
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center backdrop-blur-xl mb-8 transform rotate-45"
                  style={{
                    backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.1),
                    border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.25)}`,
                    boxShadow: `0 8px 32px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.12)}`,
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: getFontFamily(data.headingFont, "heading"),
                  }}
                >
                  <span 
                    className="text-2xl md:text-3xl font-bold transform -rotate-45"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    }}
                  >
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: getFontFamily(data.bodyFont, "body"),
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Structure 6: Elegant Framed */}
        {countdownStructure === 5 && (
          <div className="flex justify-center gap-6 md:gap-10">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Seconds" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  {/* Frame */}
                  <div
                    className="w-20 h-24 md:w-24 md:h-28 flex items-center justify-center backdrop-blur-xl"
                    style={{
                      backgroundColor: 'transparent',
                      border: `3px solid ${getCountdownCrystalColor()}`,
                      borderRadius: '8px',
                      position: 'relative',
                    }}
                  >
                    {/* Inner background */}
                    <div
                      className="absolute inset-1 flex items-center justify-center"
                      style={{
                        backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.08),
                      }}
                    >
                      <span
                        className="text-3xl md:text-4xl font-bold"
                        style={{
                          color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                          fontFamily: getFontFamily(data.headingFont, "heading"),
                        }}
                      >
                        {String(item.value).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className="text-xs uppercase tracking-wider mt-2 font-medium"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.bodyFont}, serif`,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Structure 7: Clock-like Columns */}
        {countdownStructure === 6 && (
          <div className="flex justify-center">
            <div
              className="backdrop-blur-xl px-12 py-8 rounded-2xl"
              style={{
                backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.05),
                border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.15)}`,
                boxShadow: `0 8px 32px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.08)}`,
              }}
            >
              {/* Column layout with numbers above labels and colons aligned to numbers */}
              <div className="flex items-start justify-center">
                {/* Days Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.days).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    DAYS
                  </div>
                </div>

                {/* Colon 1 - aligned to number height */}
                <div
                  className="text-4xl md:text-6xl font-bold mx-3 md:mx-4"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.headingFont}, serif`,
                    alignSelf: 'flex-start'
                  }}
                >
                  :
                </div>

                {/* Hours Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    HOURS
                  </div>
                </div>

                {/* Colon 2 - aligned to number height */}
                <div
                  className="text-4xl md:text-6xl font-bold mx-3 md:mx-4"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.headingFont}, serif`,
                    alignSelf: 'flex-start'
                  }}
                >
                  :
                </div>

                {/* Minutes Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    MINUTES
                  </div>
                </div>

                {/* Colon 3 - aligned to number height */}
                <div
                  className="text-4xl md:text-6xl font-bold mx-3 md:mx-4"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.headingFont}, serif`,
                    alignSelf: 'flex-start'
                  }}
                >
                  :
                </div>

                {/* Seconds Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    SECONDS
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Structure 8: Fully Transparent Container (same as 7) */}
        {countdownStructure === 7 && (
          <div className="flex justify-center">
            <div
              className="px-12 py-8 rounded-2xl"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              {/* Column layout with numbers above labels and colons aligned to numbers */}
              <div className="flex items-start justify-center">
                {/* Days Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.days).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    DAYS
                  </div>
                </div>

                {/* Colon 1 - aligned to number height */}
                <div
                  className="text-4xl md:text-6xl font-bold mx-3 md:mx-4"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.headingFont}, serif`,
                    alignSelf: 'flex-start'
                  }}
                >
                  :
                </div>

                {/* Hours Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    HOURS
                  </div>
                </div>

                {/* Colon 2 - aligned to number height */}
                <div
                  className="text-4xl md:text-6xl font-bold mx-3 md:mx-4"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.headingFont}, serif`,
                    alignSelf: 'flex-start'
                  }}
                >
                  :
                </div>

                {/* Minutes Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    MINUTES
                  </div>
                </div>

                {/* Colon 3 - aligned to number height */}
                <div
                  className="text-4xl md:text-6xl font-bold mx-3 md:mx-4"
                  style={{
                    color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                    fontFamily: `${data.headingFont}, serif`,
                    alignSelf: 'flex-start'
                  }}
                >
                  :
                </div>

                {/* Seconds Column */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl md:text-6xl font-bold mb-2"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.headingFont, "heading"),
                    }}
                  >
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{
                      color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                      fontFamily: getFontFamily(data.bodyFont, "body"),
                    }}
                  >
                    SECONDS
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Structure 9: Individual Digit Containers with Flipping Calendar Animation */}
        {countdownStructure === 8 && (
          <div className="flex items-center justify-center gap-4 md:gap-6">
            {/* Days Section */}
            <div className="flex flex-col items-center">
              {/* Days - 2 digits */}
              <div className="flex gap-1 md:gap-2 mb-2">
                {String(timeLeft.days).padStart(2, "0").split('').map((digit, index) => (
                  <div
                    key={`days-${index}`}
                    className="w-12 h-16 md:w-16 md:h-20 flex items-center justify-center backdrop-blur-xl rounded-lg"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.1),
                      border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.2)}`,
                      boxShadow: `0 4px 16px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.1)}`,
                      perspective: '1000px',
                    }}
                  >
                    <div className="flip-card-inner" style={{ animation: 'flipCard 0.6s ease-in-out' }}>
                      <span
                        className="text-3xl md:text-4xl font-bold"
                        style={{
                          color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                          fontFamily: getFontFamily(data.headingFont, "heading"),
                        }}
                      >
                        {digit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Days Label */}
              <span
                className="text-xs uppercase tracking-wider font-medium"
                style={{
                  color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                  fontFamily: `${data.bodyFont}, serif`,
                }}
              >
                DAYS
              </span>
            </div>

            {/* Colon separator */}
            <div
              className="text-3xl md:text-4xl font-bold"
              style={{
                color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                fontFamily: `${data.headingFont}, serif`,
                transform: 'translateY(-8px)'
              }}
            >
              :
            </div>

            {/* Hours Section */}
            <div className="flex flex-col items-center">
              {/* Hours - 2 digits */}
              <div className="flex gap-1 md:gap-2 mb-2">
                {String(timeLeft.hours).padStart(2, "0").split('').map((digit, index) => (
                  <div
                    key={`hours-${index}`}
                    className="w-12 h-16 md:w-16 md:h-20 flex items-center justify-center backdrop-blur-xl rounded-lg"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.1),
                      border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.2)}`,
                      boxShadow: `0 4px 16px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.1)}`,
                      perspective: '1000px',
                    }}
                  >
                    <div className="flip-card-inner" style={{ animation: 'flipCard 0.6s ease-in-out' }}>
                      <span
                        className="text-3xl md:text-4xl font-bold"
                        style={{
                          color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                          fontFamily: getFontFamily(data.headingFont, "heading"),
                        }}
                      >
                        {digit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Hours Label */}
              <span
                className="text-xs uppercase tracking-wider font-medium"
                style={{
                  color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                  fontFamily: `${data.bodyFont}, serif`,
                }}
              >
                HOURS
              </span>
            </div>

            {/* Colon separator */}
            <div
              className="text-3xl md:text-4xl font-bold"
              style={{
                color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                fontFamily: `${data.headingFont}, serif`,
                transform: 'translateY(-8px)'
              }}
            >
              :
            </div>

            {/* Minutes Section */}
            <div className="flex flex-col items-center">
              {/* Minutes - 2 digits */}
              <div className="flex gap-1 md:gap-2 mb-2">
                {String(timeLeft.minutes).padStart(2, "0").split('').map((digit, index) => (
                  <div
                    key={`minutes-${index}`}
                    className="w-12 h-16 md:w-16 md:h-20 flex items-center justify-center backdrop-blur-xl rounded-lg"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.1),
                      border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.2)}`,
                      boxShadow: `0 4px 16px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.1)}`,
                      perspective: '1000px',
                    }}
                  >
                    <div className="flip-card-inner" style={{ animation: 'flipCard 0.6s ease-in-out' }}>
                      <span
                        className="text-3xl md:text-4xl font-bold"
                        style={{
                          color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                          fontFamily: getFontFamily(data.headingFont, "heading"),
                        }}
                      >
                        {digit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Minutes Label */}
              <span
                className="text-xs uppercase tracking-wider font-medium"
                style={{
                  color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                  fontFamily: `${data.bodyFont}, serif`,
                }}
              >
                MINUTES
              </span>
            </div>

            {/* Colon separator */}
            <div
              className="text-3xl md:text-4xl font-bold"
              style={{
                color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                fontFamily: `${data.headingFont}, serif`,
                transform: 'translateY(-8px)'
              }}
            >
              :
            </div>

            {/* Seconds Section */}
            <div className="flex flex-col items-center">
              {/* Seconds - 2 digits */}
              <div className="flex gap-1 md:gap-2 mb-2">
                {String(timeLeft.seconds).padStart(2, "0").split('').map((digit, index) => (
                  <div
                    key={`seconds-${index}`}
                    className="w-12 h-16 md:w-16 md:h-20 flex items-center justify-center backdrop-blur-xl rounded-lg"
                    style={{
                      backgroundColor: hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.1),
                      border: `1px solid ${hexToRgba(getCountdownCrystalColor() || "#ffffff", 0.2)}`,
                      boxShadow: `0 4px 16px ${hexToRgba(getCountdownCrystalColor() || "#000000", 0.1)}`,
                      perspective: '1000px',
                    }}
                  >
                    <div className="flip-card-inner" style={{ animation: 'flipCard 0.6s ease-in-out' }}>
                      <span
                        className="text-3xl md:text-4xl font-bold"
                        style={{
                          color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                          fontFamily: getFontFamily(data.headingFont, "heading"),
                        }}
                      >
                        {digit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Seconds Label */}
              <span
                className="text-xs uppercase tracking-wider font-medium"
                style={{
                  color: mergedData.countdownUseMainColor !== false ? getCountdownCrystalColor() : (mergedData.countdownHeadingColor || getCountdownCrystalColor()),
                  fontFamily: `${data.bodyFont}, serif`,
                }}
              >
                SECONDS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Date Display - Below Countdown */}
      {mergedData.countdownShowDate && dateComponents && (
        <div className="mt-8">
          {/* Date - Box Layout (Default Structure) */}
          {mergedData.countdownDateStructure !== "alternative" && mergedData.countdownDateStructure !== "icon" && mergedData.countdownDateStructure !== "elegant" && mergedData.countdownDateStructure !== "modern" && (
            <div
              className={`flex flex-col items-center gap-1 font-sans ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? () => handleCountdownChange("countdownDateStructure", "alternative") : undefined}
              style={{ color: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1) }}
            >
              {/* Top box - Month */}
              <div className="text-[10px] md:text-xs lg:text-sm tracking-[0.2em] uppercase font-bold text-center">
                {dateComponents.month}
              </div>

              {/* Middle row - 5 boxes */}
              <div className="flex items-center gap-0 w-full max-w-sm">
                {/* Box 1: Day with left-fading line */}
                <div className="flex items-center justify-end shrink-0 w-32">
                  <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" />
                  <div className="text-[8px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase text-right">
                    {dateComponents.day}
                  </div>
                </div>

                {/* Box 2: Line divider */}
                <div className="flex justify-center shrink-0">
                  <div className="w-4 h-[1px] bg-current opacity-50" />
                </div>

                {/* Box 3: Date number (largest) */}
                <div className="flex-1 flex items-center justify-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-[0.1em]">
                  {dateComponents.date}
                </div>

                {/* Box 4: Line divider */}
                <div className="flex justify-center shrink-0">
                  <div className="w-4 h-[1px] bg-current opacity-50" />
                </div>

                {/* Box 5: Time with right-fading line */}
                <div className="flex items-center justify-start shrink-0 w-32">
                  <div className="text-[8px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase text-left whitespace-nowrap">
                    {data.time || "4:00 PM"}
                  </div>
                  <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" />
                </div>
              </div>

              {/* Bottom box - Year */}
              <div className="text-[10px] md:text-xs lg:text-sm tracking-[0.2em] uppercase font-bold text-center">
                {dateComponents.year}
              </div>
            </div>
          )}

          {/* Date - Alternative Structure */}
          {mergedData.countdownDateStructure === "alternative" && (
            <div
              className={`flex flex-col items-center gap-1 font-sans text-center ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? () => handleCountdownChange("countdownDateStructure", "icon") : undefined}
              style={{ color: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1) }}
            >
              <div className="text-xs md:text-sm lg:text-base tracking-[0.1em]">
                On the {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
              </div>
              <div className="text-[10px] md:text-xs lg:text-sm tracking-[0.1em]">
                {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
              </div>
            </div>
          )}

          {/* Date - Icon Structure */}
          {mergedData.countdownDateStructure === "icon" && (
            <div
              className={`flex flex-col items-center gap-1 font-sans text-center ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? () => handleCountdownChange("countdownDateStructure", "elegant") : undefined}
              style={{ color: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1) }}
            >
              <div
                className="w-6 h-6"
                style={{
                  backgroundColor: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1),
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
              <div className="text-xs md:text-sm lg:text-base tracking-[0.1em]">
                The {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
              </div>
              <div className="text-[10px] md:text-xs lg:text-sm tracking-[0.1em]">
                {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
              </div>
            </div>
          )}

          {/* Date - Elegant Structure */}
          {mergedData.countdownDateStructure === "elegant" && (
            <div
              className={`inline-flex items-center font-sans text-center p-4 ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? () => handleCountdownChange("countdownDateStructure", "modern") : undefined}
              style={{ color: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1) }}
            >
              {/* Box 1: Month (aligned right) */}
              <div className="text-right text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase font-light" style={{ width: '2.5rem' }}>
                {dateComponents.month}
              </div>

              {/* Divider 1 */}
              <div className="text-xs md:text-sm lg:text-base font-light mx-0.5">|</div>

              {/* Box 2: Date (centered) */}
              <div className="text-center text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.1em]" style={{ width: '3rem' }}>
                {String(dateComponents.date).padStart(2, '0')}
              </div>

              {/* Divider 2 */}
              <div className="text-xs md:text-sm lg:text-base font-light mx-0.5">|</div>

              {/* Box 3: Year (aligned left) */}
              <div className="text-left text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase font-light" style={{ width: '2.5rem' }}>
                {dateComponents.year}
              </div>
            </div>
          )}

          {/* Date - Modern Structure */}
          {mergedData.countdownDateStructure === "modern" && (
            <div
              className={`inline-flex items-center font-sans text-center p-4 ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? () => handleCountdownChange("countdownDateStructure", "default") : undefined}
              style={{ color: mergedData.countdownUseMainColor !== false ? data.neutralColor1 : (mergedData.countdownMessageColor || data.neutralColor1) }}
            >
              {/* Box 1: Day and time (aligned right) */}
              <div className="text-right flex flex-col items-end gap-0" style={{ width: '3rem' }}>
                <div className="text-[8px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase font-light">
                  {dateComponents.dayFull || dateComponents.day}
                </div>
                <div className="text-[8px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase font-light">
                  {data.time ? data.time.split(' ')[0] : "2:00"}
                </div>
              </div>

              {/* Divider 1 */}
              <div className="text-lg md:text-xl lg:text-2xl font-light opacity-50 mx-0.5">|</div>

              {/* Box 2: Date (centered, 4x huge) */}
              <div className="text-center text-2xl md:text-3xl lg:text-4xl font-bold tracking-[0.1em]" style={{ width: '3rem' }}>
                {dateComponents.date}
              </div>

              {/* Divider 2 */}
              <div className="text-lg md:text-xl lg:text-2xl font-light opacity-50 mx-0.5">|</div>

              {/* Box 3: Month and year (aligned left) */}
              <div className="text-left flex flex-col items-start gap-0" style={{ width: '3rem' }}>
                <div className="text-[8px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase font-light">
                  {dateComponents.monthFull || dateComponents.month}
                </div>
                <div className="text-[8px] md:text-[10px] lg:text-xs tracking-[0.2em] uppercase font-light">
                  {dateComponents.year}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spacer below countdown date */}
      <div style={{ height: '50px' }} />
      </div>
    </section>

    {/* Typography panel */}
    {showTypographyPanel && (
      <>
        {/* Backdrop */}
        {!isTypographyClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseTypographyPanel} onWheel={handleCloseTypographyPanel} />}

        {/* Sheet */}
        <div
          className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
            desktopMode 
              ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isTypographyClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
              : `bottom-0 left-0 right-0 rounded-t-3xl ${isTypographyClosing ? "animate-slide-down" : "animate-slide-up"}`
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
              Countdown - Section Design
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
            {/* Section Heading */}
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>SECTION HEADING</h4>
              
              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Text</label>
                <div className="relative">
                  <input
                    type="text"
                    value={mergedData.countdownHeading ?? ""}
                    onChange={(e) => handleCountdownChange("countdownHeading", e.target.value)}
                    placeholder="Counting Down"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Counting Down",
                        "Countdown",
                        "Time Until",
                        "Our Special Day",
                        "The Big Day",
                        "Coming Soon",
                        "Days Until"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.countdownHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleCountdownChange("countdownHeading", predefinedHeadings[nextIndex]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Generate heading"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE</label>
                <HybridFontControl
                  label=""
                  value={mergedData.countdownHeadingTypography || data.headingFont}
                  onChange={(value) => handleCountdownChange("countdownHeadingTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.countdownUseMainColor !== false}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>
              
              {/* Heading Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.countdownHeadingFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.countdownHeadingFontSize || 100}
                  onChange={(e) => handleCountdownChange("countdownHeadingFontSize", parseInt(e.target.value))}
                  disabled={mergedData.countdownUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.countdownHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.countdownHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Heading Color */}
              <ColorControl
                label="Heading Color"
                value={mergedData.countdownHeadingColor || getCountdownCrystalColor()}
                onChange={(value) => handleCountdownChange("countdownHeadingColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.countdownUseMainColor !== false}
                predefinedColors={predefinedSectionColors.map(c => c.value)}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

            {/* Message Section */}
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
              
              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Text</label>
                <div className="relative">
                  <textarea
                    value={mergedData.countdownMessage ?? ""}
                    onChange={(e) => handleCountdownChange("countdownMessage", e.target.value)}
                    placeholder="Counting down the days until our special moment together..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedMessages = [
                        "Counting down the days until our special moment together...",
                        "Every moment brings us closer to our special day. We can't wait to celebrate with you!",
                        "The countdown to our wedding has begun. We're so excited to share this day with you.",
                        "Days, hours, and moments until we say 'I do'. Thank you for being part of our journey.",
                        "As we count down to our wedding day, we're filled with joy and anticipation. See you soon!",
                        "Our special day is approaching fast. We're counting down the moments until we celebrate with you."
                      ];
                      const currentIndex = predefinedMessages.indexOf(mergedData.countdownMessage ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                      handleCountdownChange("countdownMessage", predefinedMessages[nextIndex]);
                    }}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    title="Generate message"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE</label>
                <HybridFontControl
                  label=""
                  value={mergedData.countdownMessageTypography || data.bodyFont}
                  onChange={(value) => handleCountdownChange("countdownMessageTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.countdownUseMainColor !== false}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
              </div>
              
              {/* Message Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.countdownMessageFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.countdownMessageFontSize || 100}
                  onChange={(e) => handleCountdownChange("countdownMessageFontSize", parseInt(e.target.value))}
                  disabled={mergedData.countdownUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.countdownMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.countdownMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Message Color */}
              <ColorControl
                label="Message Color"
                value={mergedData.countdownMessageColor || data.neutralColor1}
                onChange={(value) => handleCountdownChange("countdownMessageColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.countdownUseMainColor !== false}
                predefinedColors={predefinedSectionColors.map(c => c.value)}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

            {/* Background Section */}
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>BACKGROUND</h4>
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Type</label>
                <select
                  value={mergedData.countdownBackgroundType || "color"}
                  onChange={(e) => handleCountdownChange("countdownBackgroundType", e.target.value)}
                  disabled={mergedData.countdownUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.countdownBackgroundType === "image" || mergedData.countdownBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.countdownGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, firstColor: e.target.value })}
                            disabled={mergedData.countdownUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.countdownGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, firstColor: value });
                          }}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.countdownGradient?.firstOpacity || 50}
                          onChange={(e) => handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.countdownGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.countdownGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.countdownGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.countdownGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, secondColor: e.target.value })}
                            disabled={mergedData.countdownUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.countdownGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, secondColor: value });
                          }}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.countdownGradient?.secondOpacity || 50}
                          onChange={(e) => handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.countdownGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.countdownGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.countdownGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.countdownBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.countdownBackgroundColor || "#ffffff"}
                        onChange={(e) => handleCountdownChange("countdownBackgroundColor", e.target.value)}
                        disabled={mergedData.countdownUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.countdownBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleCountdownChange("countdownBackgroundColor", value);
                      }}
                      disabled={mergedData.countdownUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.countdownBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.countdownGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, firstColor: e.target.value })}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.countdownGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, firstColor: value });
                        }}
                        disabled={mergedData.countdownUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Second Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.countdownGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, secondColor: e.target.value })}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.countdownGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleCountdownChange("countdownGradient", { ...mergedData.countdownGradient, secondColor: value });
                        }}
                        disabled={mergedData.countdownUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.countdownBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.countdownImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.countdownImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleCountdownChange("countdownImage", { urls: newUrls });
                          }}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.countdownImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleCountdownChange("countdownImage", { urls: newUrls });
                          }}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{ color: accentColor }}
                          title="Cycle predefined images"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </button>
                      </div>
                      {(mergedData.countdownImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.countdownImage?.urls.filter((_, i) => i !== index) || [];
                            handleCountdownChange("countdownImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.countdownImage?.urls?.length || 1) - 1 && (mergedData.countdownImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.countdownImage?.urls || [""]), ""];
                            handleCountdownChange("countdownImage", { urls: newUrls });
                          }}
                          disabled={mergedData.countdownUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{ color: accentColor }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>More than 1 image will create a slideshow</p>
                </div>
              )}

              {/* Video Option */}
              {mergedData.countdownBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.countdownVideo?.url || ""}
                      onChange={(e) => handleCountdownChange("countdownVideo", { url: e.target.value })}
                      disabled={mergedData.countdownUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleCountdownChange("countdownVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.countdownUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.countdownUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ color: accentColor }}
                      title="Cycle predefined videos"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Apply Default Design Checkbox - outside scrollable area */}
          <div className="px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-between" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  id="useMainColor"
                  checked={mergedData.countdownUseMainColor !== false}
                  onChange={(e) => handleCountdownChange("countdownUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleCountdownChange("countdownUseMainColor", !(mergedData.countdownUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.countdownUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: accentColor,
                  }}
                >
                  {mergedData.countdownUseMainColor !== false && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <label htmlFor="useMainColor" className={`text-sm cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Apply Default Design
              </label>
            </div>
          </div>
        </div>

      </>
    )}

    {/* Countdown Settings panel */}
    {showCountdownSettingsPanel && (
      <>
        {/* Backdrop */}
        {!isCountdownSettingsClosing && (
          <div 
            className="fixed inset-0 bg-transparent z-[45]" 
            onMouseDown={handleCloseCountdownSettingsPanel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        )}

        {/* Sheet */}
        <div
          data-countdown-settings-panel="true"
          className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
            desktopMode 
              ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isCountdownSettingsClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
              : `bottom-0 left-0 right-0 rounded-t-3xl ${isCountdownSettingsClosing ? "animate-slide-down" : "animate-slide-up"}`
          }`}
          style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar - only show in mobile mode */}
          {!desktopMode && (
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            </div>
          )}

          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Countdown Settings
            </h3>
            <button
              onClick={handleCloseCountdownSettingsPanel}
              className={`p-1 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Main Color Section */}
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>CRYSTAL EFFECT</h4>
              
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Main Color</label>
                
                {/* Color Picker Box */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={mergedData.countdownCrystalColor || '#ffffff'}
                      onChange={(e) => handleCountdownChange("countdownCrystalColor", e.target.value)}
                      className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    />
                  </div>
                  <input
                    type="text"
                    value={mergedData.countdownCrystalColor || ''}
                    onChange={(e) => {
                      let color = e.target.value.trim();
                      // Add # if not present and it's a valid hex code
                      if (color && !color.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(color)) {
                        color = '#' + color;
                      }
                      handleCountdownChange("countdownCrystalColor", color);
                    }}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
                
                {/* Predefined Colors */}
                <div className="flex flex-wrap gap-1.5 pt-1 justify-start">
                  {predefinedSectionColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleCountdownChange("countdownCrystalColor", color.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90`}
                      style={{
                        backgroundColor: color.value,
                        borderColor: mergedData.countdownCrystalColor === color.value ? data.accentColor : "transparent",
                        boxShadow: mergedData.countdownCrystalColor === color.value ? `0 0 0 1px ${data.accentColor}` : "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Countdown Design Section */}
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>COUNTDOWN DESIGN</h4>
              
              <div className="space-y-2">
                <HybridDropdown
                  label="Structure"
                  value={countdownStructure}
                  onChange={(value) => {
                    const index = typeof value === 'string' ? parseInt(value) : value;
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCountdownStructure(index);
                      handleCountdownChange("countdownDateStructure", index === 0 ? "default" : index === 1 ? "alternative" : index === 2 ? "icon" : index === 3 ? "elegant" : "modern");
                      setTimeout(() => setIsTransitioning(false), 50);
                    }, 150);
                  }}
                  options={countdownStructures.map(structure => ({
                    name: structure.name,
                    value: structure.id
                  }))}
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={data.accentColor}
                  disabled={isTransitioning}
                />
              </div>
            </div>
          </div>

        </div>
      </>
    )}

    {/* Icon panel */}
    {showIconPanel && (
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
              Display Icon Settings
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
                      handleIconChange("heroIconType", options[prevIndex]);
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
                    onChange={(e) => handleIconChange("heroIconType", e.target.value as "image" | "initial" | "none")}
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
                      handleIconChange("heroIconType", options[nextIndex]);
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
                      onChange={(e) => handleIconChange("heroIcon", e.target.value)}
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
                          onChange={(e) => handleIconChange("heroIconAddAmpersand", e.target.checked)}
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
                        onChange={(v) => handleIconChange("heroIconTypography", v)}
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
                onChange={(e) => handleIconChange('heroIconName2First', e.target.checked)}
                className={`w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#b88a78] ${
                  isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                }`}
                style={{
                  accentColor: accentColor
                }}
              />
              <label htmlFor="reverseNames" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Reverse names</label>
            </div>

            {/* Text color picker */}
            <div className="space-y-2">
              <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Color</label>
              <ColorControl
                value={mergedData.heroIconTextColor ?? ""}
                onChange={(value: string) => handleIconChange('heroIconTextColor', value)}
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
                onChange={(e) => handleIconChange('heroTextShadowOpacity', e.target.valueAsNumber / 100)}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.heroTextShadowOpacity ?? 0.1) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.heroTextShadowOpacity ?? 0.1) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                }}
              />
            </div>

            {/* Icon Size Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Icon Size</label>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroIconSize || 100}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={mergedData.heroIconSize || 100}
                onChange={(e) => {
                  const size = parseInt(e.target.value);
                  handleIconChange('heroIconSize', size);
                }}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroIconSize || 100) - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.heroIconSize || 100) - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                }}
              />
            </div>

            {/* Icon Margin Adjustment Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Icon Margin Adjustment</label>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.heroIconMarginAdjustment || 0}px</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={mergedData.heroIconMarginAdjustment || 0}
                onChange={(e) => {
                  const adjustment = parseInt(e.target.value);
                  handleIconChange('heroIconMarginAdjustment', adjustment);
                }}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.heroIconMarginAdjustment || 0) + 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.heroIconMarginAdjustment || 0) + 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}
