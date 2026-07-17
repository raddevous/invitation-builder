"use client";

import { useState, useEffect, useRef } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface DetailsSectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
  editMode?: boolean;
}

interface WeddingProgramItem {
  id: string;
  name: string;
  eventDetails: string;
  place: string;
  time: string;
  imageVariant: number;
}

interface WeddingProgramContainer {
  id: string;
  title: string;
  item: WeddingProgramItem;
  isExpanded: boolean;
}

export default function DetailsSection({ data, onChange, panelPosition = "left", desktopMode = false, editMode = false }: DetailsSectionProps) {
  const { isDarkMode, accentColor } = useTheme();
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);
  const [weddingProgram, setWeddingProgram] = useState<WeddingProgramContainer[]>([]);
  const [showScalePanel, setShowScalePanel] = useState(false);
  const [isScalePanelClosing, setIsScalePanelClosing] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load wedding program from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('weddingProgram');
      if (stored) {
        setWeddingProgram(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load wedding program:', error);
    }
  }, []);

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  const handleCloseScalePanel = () => {
    setIsScalePanelClosing(true);
    setTimeout(() => {
      setShowScalePanel(false);
      setIsScalePanelClosing(false);
    }, 300);
  };

  // Long press handlers for timeline grid
  const handleTimelineMouseDown = () => {
    if (!editMode) return;
    longPressTimer.current = setTimeout(() => {
      setShowScalePanel(true);
    }, 600);
  };

  const handleTimelineMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Fetch predefined options from Supabase
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedImages } = usePredefinedOptions('background_images');
  const { options: predefinedVideos } = usePredefinedOptions('background_videos');
  const { options: predefinedDividerImagesCentered } = usePredefinedOptions('dividers_centeredsingle');
  const { options: predefinedDividerImagesSplit } = usePredefinedOptions('dividers_splithorizontal');
  const { options: predefinedDividerImagesMirrored } = usePredefinedOptions('dividers_mirroredcorners');

  const [predefinedImageIndex, setPredefinedImageIndex] = useState(0);
  const [predefinedVideoIndex, setPredefinedVideoIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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

  const handleCloseTypographyPanel = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
    setIsTypographyClosing(true);
    setTimeout(() => {
      setShowTypographyPanel(false);
      setIsTypographyClosing(false);
    }, 300);
  };

  const handleChange = (key: keyof InvitationData, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    onChange?.(key, value);
  };

  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingChanges };

  // Timeline color based on Event Details heading color
  const timelineColor = mergedData.eventDetailsUseMainColor !== false
    ? data.mainColor2
    : (mergedData.eventDetailsHeadingColor || data.mainColor2);

  // Timeline accent mode: 0=none, 1=title, 2=image, 3=bullet, 4=dashes and bullet
  const accentMode = mergedData.eventDetailsTimelineAccentMode ?? 0;
  const timelineScale = (mergedData.eventDetailsTimelineScale ?? 100) / 100;

  const cycleTimelineAccentMode = () => {
    const nextMode = (accentMode + 1) % 5;
    handleChange("eventDetailsTimelineAccentMode", nextMode);
  };

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.eventDetailsBackgroundType === "color" && !mergedData.eventDetailsBackgroundColor) {
      handleChange("eventDetailsBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.eventDetailsBackgroundType === "gradient" && !mergedData.eventDetailsGradient) {
      handleChange("eventDetailsGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.eventDetailsBackgroundType === "image" && !mergedData.eventDetailsImage) {
      handleChange("eventDetailsImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("eventDetailsGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.eventDetailsBackgroundType === "video" && !mergedData.eventDetailsVideo) {
      handleChange("eventDetailsVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("eventDetailsGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.eventDetailsBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.eventDetailsBackgroundType === "image" && mergedData.eventDetailsImage?.urls && mergedData.eventDetailsImage.urls.length > 1) {
      const validUrls = mergedData.eventDetailsImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.eventDetailsBackgroundType, mergedData.eventDetailsImage?.urls]);

  const eventDetailsUseDefaultDivider = data.eventDetailsDividerUseDefault ?? true;
  const effectivePullDown = eventDetailsUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.eventDetailsDividerPullDown ?? 0);
  const effectiveVerticalFlip = eventDetailsUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.eventDetailsDividerVerticalFlip ?? false);

  return (
    <>
      <section
        className="pt-0 pb-8 px-8 text-center relative min-h-[200px]"
        style={{
          backgroundColor: mergedData.eventDetailsUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.eventDetailsBackgroundType === "gradient"
              ? undefined
              : mergedData.eventDetailsBackgroundType === "image"
                ? undefined
                : mergedData.eventDetailsBackgroundType === "video"
                  ? undefined
                  : (mergedData.eventDetailsBackgroundColor || "transparent"),
          background: mergedData.eventDetailsUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.eventDetailsBackgroundType === "gradient" && mergedData.eventDetailsGradient
              ? `linear-gradient(135deg, ${mergedData.eventDetailsGradient.firstColor || "#ffffff"}, ${mergedData.eventDetailsGradient.secondColor || "#ffffff"})`
              : undefined,
          ...(mergedData.eventDetailsBackgroundType === "image" && mergedData.eventDetailsImage?.urls && mergedData.eventDetailsImage.urls.length > 0 ? {
            backgroundImage: `url(${mergedData.eventDetailsImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          } : {}),
          transition: 'background 1s ease-in-out'
        }}
      >
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.eventDetailsBackgroundType === "image" || mergedData.eventDetailsBackgroundType === "video") && mergedData.eventDetailsGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.eventDetailsGradient.firstColor || "#ffffff", (mergedData.eventDetailsGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.eventDetailsGradient.secondColor || "#ffffff", (mergedData.eventDetailsGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.eventDetailsBackgroundType === "video" && mergedData.eventDetailsVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.eventDetailsVideo.url)}
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
        type={eventDetailsUseDefaultDivider ? (data.universalDivider || "none") : (data.eventDetailsDivider || "none")} 
        color={data.mainColor2} 
        id="event-details-cssid" 
        offset={eventDetailsUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.eventDetailsDividerOffset ?? 0)}
        tintColor={eventDetailsUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.eventDetailsDividerTintColor || data.mainColor2)}
        tintOpacity={eventDetailsUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.eventDetailsDividerTintOpacity ?? 100)}
        dividerStyle={eventDetailsUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.eventDetailsDividerStyle || "centered-single")}
        flip={eventDetailsUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.eventDetailsDividerFlip ?? false)}
        spacing={eventDetailsUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.eventDetailsDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={eventDetailsUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.eventDetailsDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={eventDetailsUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.eventDetailsDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={eventDetailsUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.eventDetailsDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={eventDetailsUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.eventDetailsDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={eventDetailsUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.eventDetailsDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (eventDetailsUseDefaultDivider) {
            onChange?.("eventDetailsDividerUseDefault", false);
          }
          onChange?.("eventDetailsDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('event-details-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Event Details Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.eventDetailsDivider && data.eventDetailsDivider !== "none" ? data.eventDetailsDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("eventDetailsDivider", value)}
          tintColor={data.eventDetailsDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("eventDetailsDividerTintColor", value)}
          tintOpacity={data.eventDetailsDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("eventDetailsDividerTintOpacity", value)}
          dividerStyle={data.eventDetailsDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("eventDetailsDividerStyle", value)}
          flip={data.eventDetailsDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("eventDetailsDividerFlip", value)}
          spacing={data.eventDetailsDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("eventDetailsDividerSpacing", value)}
          pullDown={data.eventDetailsDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("eventDetailsDividerPullDown", value)}
          verticalFlip={data.eventDetailsDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("eventDetailsDividerVerticalFlip", value)}
          imageSize={data.eventDetailsDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("eventDetailsDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.eventDetailsDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("eventDetailsDividerCustomImageUrl1", value)}
          customImageUrl2={data.eventDetailsDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("eventDetailsDividerCustomImageUrl2", value)}
          customImageUrl3={data.eventDetailsDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("eventDetailsDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.eventDetailsDivider === "divider-1" ? predefinedDividerImagesCentered : data.eventDetailsDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={eventDetailsUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("eventDetailsDividerUseDefault", value)}
          colorBlend={data.eventDetailsDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("eventDetailsDividerColorBlend", value)}
        />
      )}
      <h2
        className="text-2xl font-bold uppercase mb-1 md:mb-8 scale-[0.55] md:scale-100"
        style={{
          color: mergedData.eventDetailsUseMainColor !== false ? data.mainColor2 : (mergedData.eventDetailsHeadingColor || data.mainColor2),
          fontFamily: mergedData.eventDetailsUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.eventDetailsHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.eventDetailsHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('event-details-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.eventDetailsHeading || "Event Details"}
        </span>
      </h2>

      {mergedData.eventDetailsMessage && (
        <p
          className="text-center mb-8 leading-relaxed scale-[0.7] md:scale-100"
          style={{
            color: mergedData.eventDetailsUseMainColor !== false ? data.neutralColor1 : (mergedData.eventDetailsMessageColor || data.neutralColor1),
            fontFamily: mergedData.eventDetailsUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.eventDetailsMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.eventDetailsMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.eventDetailsMessage}
        </p>
      )}

      {/* Wedding Program Timeline */}
      {weddingProgram.length > 0 && (
        <div className="relative w-full max-w-4xl mx-auto py-8 px-4 md:px-0">
          {/* Vertical spine line */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: 0,
              bottom: 0,
              width: '2px',
              transform: 'translateX(-50%)',
              backgroundColor: data.mainColor2,
              opacity: 0.3,
              zIndex: 1
            }}
          />
          <div
            className={`relative w-full ${editMode ? "cursor-pointer" : ""}`}
            onClick={editMode ? cycleTimelineAccentMode : undefined}
            onMouseDown={editMode ? handleTimelineMouseDown : undefined}
            onMouseUp={editMode ? handleTimelineMouseUp : undefined}
            onMouseLeave={editMode ? handleTimelineMouseUp : undefined}
            onTouchStart={editMode ? handleTimelineMouseDown : undefined}
            onTouchEnd={editMode ? handleTimelineMouseUp : undefined}
          >
          {weddingProgram.map((container, index) => {
            const item = container.item;
            const isEven = index % 2 === 0;
            const iconSrc = `/assets/ico-timeslot-${item.imageVariant + 1}.png`;

            // Text block content
            const TextBlock = ({ alignRight = false }: { alignRight?: boolean }) => (
              <div className={`flex flex-col text-wrap ${alignRight ? "text-right" : "text-left"}`}>
                <p
                  className="font-bold uppercase tracking-wider text-sm"
                  style={{
                    color: accentMode === 1 ? timelineColor : data.mainColor2,
                    fontFamily: getFontFamily(mergedData.eventDetailsHeadingTypography || data.headingFont, "heading")
                  }}
                >
                  {item.name || "Timeline Event"}
                </p>
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{
                    color: data.neutralColor1,
                    fontFamily: getFontFamily(mergedData.eventDetailsMessageTypography || data.bodyFont, "body")
                  }}
                >
                  {item.eventDetails}
                </p>
                <p
                  className="text-xs mt-1 font-medium"
                  style={{
                    color: data.mainColor2,
                    fontFamily: getFontFamily(mergedData.eventDetailsMessageTypography || data.bodyFont, "body"),
                    opacity: 0.8
                  }}
                >
                  {item.time}
                </p>
                <p
                  className={`text-xs mt-1 italic flex items-center gap-1 ${alignRight ? "justify-end" : "justify-start"}`}
                  style={{
                    color: data.neutralColor1,
                    fontFamily: getFontFamily(mergedData.eventDetailsMessageTypography || data.bodyFont, "body"),
                    opacity: 0.7
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={data.neutralColor1} strokeWidth="2" opacity="0.7">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {item.place}
                </p>
              </div>
            );

            // Icon block
            const IconBlock = () => (
              accentMode === 2 ? (
                <div
                  className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0"
                  style={{
                    backgroundColor: timelineColor,
                    WebkitMaskImage: `url(${iconSrc})`,
                    maskImage: `url(${iconSrc})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                />
              ) : (
                <img
                  src={iconSrc}
                  alt=""
                  className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )
            );

            return (
              <div key={container.id} className="relative flex items-center mb-8 md:mb-12">
                {/* Desktop layout */}
                <div className="timeline-grid grid md:grid-cols-[1fr_auto_auto_auto_1fr] md:items-center w-full gap-2">
                  {isEven ? (
                    <>
                      {/* Column 1: Icon right-aligned */}
                      <div className="flex justify-end items-center pr-4">
                        <IconBlock />
                      </div>
                      {/* Column 2: Horizontal line to center */}
                      <div className="flex items-center justify-end h-full">
                        <div style={{ height: '2px', backgroundColor: accentMode === 4 ? timelineColor : data.mainColor2, opacity: 0.3, width: '100%' }} />
                      </div>
                      {/* Column 3: Center bullet node */}
                      <div className="flex items-center justify-center">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: accentMode === 3 || accentMode === 4 ? timelineColor : data.mainColor2, zIndex: 2 }}
                        />
                      </div>
                      {/* Column 4: Horizontal line to right */}
                      <div className="flex items-center justify-start h-full">
                        <div style={{ height: '2px', backgroundColor: accentMode === 4 ? timelineColor : data.mainColor2, opacity: 0.3, width: '100%' }} />
                      </div>
                      {/* Column 5: Text left-aligned */}
                      <div className="flex justify-start items-center pl-4 text-left">
                        <TextBlock alignRight={false} />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Column 1: Text right-aligned */}
                      <div className="flex justify-end items-center pr-4 text-right">
                        <TextBlock alignRight={true} />
                      </div>
                      {/* Column 2: Horizontal line to center */}
                      <div className="flex items-center justify-end h-full">
                        <div style={{ height: '2px', backgroundColor: accentMode === 4 ? timelineColor : data.mainColor2, opacity: 0.3, width: '100%' }} />
                      </div>
                      {/* Column 3: Center bullet node */}
                      <div className="flex items-center justify-center">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: accentMode === 3 || accentMode === 4 ? timelineColor : data.mainColor2, zIndex: 2 }}
                        />
                      </div>
                      {/* Column 4: Horizontal line to right */}
                      <div className="flex items-center justify-start h-full">
                        <div style={{ height: '2px', backgroundColor: accentMode === 4 ? timelineColor : data.mainColor2, opacity: 0.3, width: '100%' }} />
                      </div>
                      {/* Column 5: Icon left-aligned */}
                      <div className="flex justify-start items-center pl-4">
                        <IconBlock />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          .timeline-grid {
            grid-template-columns: 1fr auto auto auto 1fr !important;
            gap: 0.5rem !important;
          }

          .timeline-grid .w-16 {
            width: 48px !important;
            height: 48px !important;
          }

          .timeline-grid .md\\:w-20 {
            width: 48px !important;
            height: 48px !important;
          }

          .timeline-grid .text-sm {
            font-size: 0.75rem !important;
          }

          .timeline-grid .text-xs {
            font-size: 0.625rem !important;
          }
        }

        @media (max-width: 480px) {
          .timeline-grid .w-16,
          .timeline-grid .md\\:w-20 {
            width: 32px !important;
            height: 32px !important;
          }

          .timeline-grid .text-sm {
            font-size: 0.7rem !important;
          }

          .timeline-grid .text-xs {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
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
              Event Details - Section Design
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
                    value={mergedData.eventDetailsHeading ?? ""}
                    onChange={(e) => handleChange("eventDetailsHeading", e.target.value)}
                    placeholder="Event Details"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Event Details",
                        "Wedding Details",
                        "Our Wedding Day",
                        "Save the Date",
                        "Join Us",
                        "Celebration Details",
                        "The Big Day"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.eventDetailsHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleChange("eventDetailsHeading", predefinedHeadings[nextIndex]);
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
                  value={mergedData.eventDetailsHeadingTypography || data.headingFont}
                  onChange={(value) => handleChange("eventDetailsHeadingTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.eventDetailsUseMainColor !== false}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>
              
              {/* Heading Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.eventDetailsHeadingFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.eventDetailsHeadingFontSize || 100}
                  onChange={(e) => handleChange("eventDetailsHeadingFontSize", parseInt(e.target.value))}
                  disabled={mergedData.eventDetailsUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.eventDetailsHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.eventDetailsHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Heading Color */}
              <ColorControl
                label="Heading Color"
                value={mergedData.eventDetailsHeadingColor || data.mainColor2}
                onChange={(value) => handleChange("eventDetailsHeadingColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.eventDetailsUseMainColor !== false}
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
                    value={mergedData.eventDetailsMessage ?? ""}
                    onChange={(e) => handleChange("eventDetailsMessage", e.target.value)}
                    placeholder="We're so excited to celebrate our special day with you..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedMessages = [
                        "We're so excited to celebrate our special day with you...",
                        "We can't wait to share this moment with our favorite people. Here are all the details for our celebration.",
                        "The day we've been dreaming of is almost here. We're honored to have you join us for our wedding.",
                        "Thank you for being part of our journey. We're looking forward to celebrating with you on our special day.",
                        "Our wedding day wouldn't be complete without you. Here's everything you need to know about the celebration.",
                        "We're counting down the days until we say 'I do' in front of our loved ones. Here are the event details."
                      ];
                      const currentIndex = predefinedMessages.indexOf(mergedData.eventDetailsMessage ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                      handleChange("eventDetailsMessage", predefinedMessages[nextIndex]);
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
                  value={mergedData.eventDetailsMessageTypography || data.bodyFont}
                  onChange={(value) => handleChange("eventDetailsMessageTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.eventDetailsUseMainColor !== false}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
              </div>
              
              {/* Message Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.eventDetailsMessageFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.eventDetailsMessageFontSize || 100}
                  onChange={(e) => handleChange("eventDetailsMessageFontSize", parseInt(e.target.value))}
                  disabled={mergedData.eventDetailsUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.eventDetailsMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.eventDetailsMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Message Color */}
              <ColorControl
                label="Message Color"
                value={mergedData.eventDetailsMessageColor || data.neutralColor1}
                onChange={(value) => handleChange("eventDetailsMessageColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.eventDetailsUseMainColor !== false}
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
                  value={mergedData.eventDetailsBackgroundType || "color"}
                  onChange={(e) => handleChange("eventDetailsBackgroundType", e.target.value)}
                  disabled={mergedData.eventDetailsUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.eventDetailsBackgroundType === "image" || mergedData.eventDetailsBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.eventDetailsGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, firstColor: e.target.value })}
                            disabled={mergedData.eventDetailsUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.eventDetailsGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, firstColor: value });
                          }}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.eventDetailsGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.eventDetailsGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.eventDetailsGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.eventDetailsGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.eventDetailsGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, secondColor: e.target.value })}
                            disabled={mergedData.eventDetailsUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.eventDetailsGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, secondColor: value });
                          }}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.eventDetailsGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.eventDetailsGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.eventDetailsGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.eventDetailsGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.eventDetailsBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.eventDetailsBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("eventDetailsBackgroundColor", e.target.value)}
                        disabled={mergedData.eventDetailsUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.eventDetailsBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("eventDetailsBackgroundColor", value);
                      }}
                      disabled={mergedData.eventDetailsUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.eventDetailsBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.eventDetailsGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, firstColor: e.target.value })}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.eventDetailsGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, firstColor: value });
                        }}
                        disabled={mergedData.eventDetailsUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.eventDetailsGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, secondColor: e.target.value })}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.eventDetailsGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("eventDetailsGradient", { ...mergedData.eventDetailsGradient, secondColor: value });
                        }}
                        disabled={mergedData.eventDetailsUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.eventDetailsBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.eventDetailsImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.eventDetailsImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("eventDetailsImage", { urls: newUrls });
                          }}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.eventDetailsImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("eventDetailsImage", { urls: newUrls });
                          }}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.eventDetailsImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.eventDetailsImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("eventDetailsImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.eventDetailsImage?.urls?.length || 1) - 1 && (mergedData.eventDetailsImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.eventDetailsImage?.urls || [""]), ""];
                            handleChange("eventDetailsImage", { urls: newUrls });
                          }}
                          disabled={mergedData.eventDetailsUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {mergedData.eventDetailsBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.eventDetailsVideo?.url || ""}
                      onChange={(e) => handleChange("eventDetailsVideo", { url: e.target.value })}
                      disabled={mergedData.eventDetailsUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("eventDetailsVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.eventDetailsUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.eventDetailsUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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

          {/* Apply Default Design Checkbox and Close button - outside scrollable area */}
          <div className="px-5 py-4 shrink-0 border-t flex items-center justify-between" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  id="useMainColor"
                  checked={mergedData.eventDetailsUseMainColor !== false}
                  onChange={(e) => handleChange("eventDetailsUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("eventDetailsUseMainColor", !(mergedData.eventDetailsUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.eventDetailsUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: accentColor,
                  }}
                >
                  {mergedData.eventDetailsUseMainColor !== false && (
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
            <button
              type="button"
              onClick={handleCloseTypographyPanel}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
              style={{
                fontFamily: "Inter, sans-serif",
                backgroundColor: accentColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(0.9)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)"
              }}
            >
              Close
            </button>
          </div>
        </div>
      </>
    )}

    {/* Timeline Scale Panel */}
    {showScalePanel && (
      <>
        {/* Backdrop */}
        {!isScalePanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseScalePanel} onWheel={handleCloseScalePanel} />}

        {/* Sheet */}
        <div
          className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
            desktopMode 
              ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isScalePanelClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
              : `bottom-0 left-0 right-0 rounded-t-3xl ${isScalePanelClosing ? "animate-slide-down" : "animate-slide-up"}`
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
              Event Details Settings
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Scale</label>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.eventDetailsTimelineScale ?? 100}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={mergedData.eventDetailsTimelineScale ?? 100}
                onChange={(e) => handleChange("eventDetailsTimelineScale", parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.eventDetailsTimelineScale ?? 100) - 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.eventDetailsTimelineScale ?? 100) - 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                }}
              />
            </div>
          </div>

          {/* Close button */}
          <div className="px-5 py-4 shrink-0 border-t flex items-center justify-end" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <button
              type="button"
              onClick={handleCloseScalePanel}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
              style={{
                fontFamily: "Inter, sans-serif",
                backgroundColor: accentColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(0.9)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)"
              }}
            >
              Close
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
}
