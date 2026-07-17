"use client";

import { useState, useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface MapSectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
  editMode?: boolean;
}

export default function MapSection({ data, onChange, panelPosition = "left", desktopMode = false, editMode = false }: MapSectionProps) {
  if (!data.sections.map) return null;

  const { isDarkMode, accentColor } = useTheme();
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
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
  const [backgroundImageIndex, setBackgroundImageIndex] = useState(0);

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

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.mapBackgroundType === "color" && !mergedData.mapBackgroundColor) {
      handleChange("mapBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.mapBackgroundType === "gradient" && !mergedData.mapGradient) {
      handleChange("mapGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.mapBackgroundType === "image" && !mergedData.mapImage) {
      handleChange("mapImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("mapGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.mapBackgroundType === "video" && !mergedData.mapVideo) {
      handleChange("mapVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("mapGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.mapBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.mapBackgroundType === "image" && mergedData.mapImage?.urls && mergedData.mapImage.urls.length > 1) {
      const validUrls = mergedData.mapImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setBackgroundImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.mapBackgroundType, mergedData.mapImage?.urls]);

  // Filter valid image URLs
  const validImages = (data.venueImages || []).filter(url => url && url.trim() !== "");
  const hasImages = validImages.length > 0;

  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && currentImageIndex < validImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Navigation handlers
  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  // Auto-advance slideshow
  useEffect(() => {
    if (!hasImages || validImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [hasImages, validImages.length]);

  // Fallback to venue name/address for map
  const mapQuery = `${data.venueName} ${data.venueAddress}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const mapUseDefaultDivider = data.mapDividerUseDefault ?? true;
  const effectivePullDown = mapUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.mapDividerPullDown ?? 0);
  const effectiveVerticalFlip = mapUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.mapDividerVerticalFlip ?? false);

  return (
    <>
      <section
        className="px-6 pt-0 pb-8 text-center min-h-[200px]"
        style={{
          backgroundColor: mergedData.mapUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.mapBackgroundType === "gradient"
              ? undefined
              : mergedData.mapBackgroundType === "image"
                ? undefined
                : mergedData.mapBackgroundType === "video"
                  ? undefined
                  : (mergedData.mapBackgroundColor || "transparent"),
          background: mergedData.mapUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.mapBackgroundType === "gradient" && mergedData.mapGradient
              ? `linear-gradient(135deg, ${mergedData.mapGradient.firstColor || "#ffffff"}, ${mergedData.mapGradient.secondColor || "#ffffff"})`
              : undefined,
          ...(mergedData.mapBackgroundType === "image" && mergedData.mapImage?.urls && mergedData.mapImage.urls.length > 0 ? {
            backgroundImage: `url(${mergedData.mapImage.urls.filter(url => url.trim() !== "")[backgroundImageIndex]})`,
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          } : {}),
          transition: 'background 1s ease-in-out'
        }}
      >
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.mapBackgroundType === "image" || mergedData.mapBackgroundType === "video") && mergedData.mapGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.mapGradient.firstColor || "#ffffff", (mergedData.mapGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.mapGradient.secondColor || "#ffffff", (mergedData.mapGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.mapBackgroundType === "video" && mergedData.mapVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.mapVideo.url)}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      )}

      {/* Content Wrapper - positioned above gradient overlay */}
      <div style={{ position: 'relative', zIndex: 42 }}>
      <Divider 
        type={mapUseDefaultDivider ? (data.universalDivider || "none") : (data.mapDivider || "none")} 
        color={data.mainColor2} 
        id="map-cssid" 
        offset={mapUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.mapDividerOffset ?? 0)}
        tintColor={mapUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.mapDividerTintColor || data.mainColor2)}
        tintOpacity={mapUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.mapDividerTintOpacity ?? 100)}
        dividerStyle={mapUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.mapDividerStyle || "centered-single")}
        flip={mapUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.mapDividerFlip ?? false)}
        spacing={mapUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.mapDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={mapUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.mapDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={mapUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.mapDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={mapUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.mapDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={mapUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.mapDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={mapUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.mapDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (mapUseDefaultDivider) {
            onChange?.("mapDividerUseDefault", false);
          }
          onChange?.("mapDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('map-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      <h2
        className="text-2xl mb-1 md:mb-8 text-center font-bold uppercase scale-[0.55] md:scale-100"
        style={{
          color: mergedData.mapUseMainColor !== false ? data.mainColor2 : (mergedData.mapHeadingColor || data.mainColor2),
          fontFamily: mergedData.mapUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.mapHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.mapHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('map-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.mapHeading || "How to Get There"}
        </span>
      </h2>

      {mergedData.mapMessage && (
        <p
          className="text-center mb-6 leading-relaxed scale-[0.7] md:scale-100"
          style={{
            color: mergedData.mapUseMainColor !== false ? data.neutralColor1 : (mergedData.mapMessageColor || data.neutralColor1),
            fontFamily: mergedData.mapUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.mapMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.mapMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.mapMessage}
        </p>
      )}

      <div className="mt-4 mb-6">
        <p
          className="text-xl mb-1"
          style={{ color: data.mainColor2, fontFamily: getFontFamily(data.headingFont, "heading") }}
        >
          {data.venueName}
        </p>
        <p
          className="text-sm"
          style={{ color: data.neutralColor1, opacity: 0.7, fontFamily: getFontFamily(data.bodyFont, "body") }}
        >
          {data.venueAddress}
        </p>
      </div>

      {/* Venue Images Slideshow - Above Map */}
      {hasImages && (
        <div
          className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden mb-6 relative group"
          style={{ height: "300px" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {validImages.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Venue image ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          
          {/* Desktop Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/30"
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/30"
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}
          
          {/* Slideshow indicators */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {validImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Google Maps - Always Show */}
      <div
        className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden mb-6 relative"
        style={{ height: "300px" }}
      >
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
        />
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm tracking-wide transition-all duration-300 active:scale-95 relative overflow-hidden backdrop-blur-md border shadow-lg"
        style={{
          backgroundColor: `${data.mainColor2}20`,
          borderColor: `${data.mainColor2}40`,
          color: data.mainColor2,
          fontFamily: `${data.bodyFont}, serif`,
        }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></span>
        <span className="relative z-10 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Open in Maps
        </span>
      </a>
      </div>

      {/* Spacer below open in maps button */}
      <div style={{ height: '50px' }} />
    </section>

    {/* Divider Settings Panel - outside section to escape stacking context */}
    {showDividerSettingsPanel && (
      <DividerSettingsPanel
        title="Map Divider Settings"
        isClosing={isDividerSettingsClosing}
        onClose={handleCloseDividerSettingsPanel}
        isDarkMode={isDarkMode}
        desktopMode={desktopMode}
        panelPosition={panelPosition}
        dividerType={data.mapDivider && data.mapDivider !== "none" ? data.mapDivider : "divider-1"}
        onDividerTypeChange={(value) => onChange?.("mapDivider", value)}
        tintColor={data.mapDividerTintColor || data.mainColor2}
        onTintColorChange={(value) => onChange?.("mapDividerTintColor", value)}
        tintOpacity={data.mapDividerTintOpacity ?? 100}
        onTintOpacityChange={(value) => onChange?.("mapDividerTintOpacity", value)}
        dividerStyle={data.mapDividerStyle || "centered-single"}
        onDividerStyleChange={(value) => onChange?.("mapDividerStyle", value)}
        flip={data.mapDividerFlip ?? false}
        onFlipChange={(value) => onChange?.("mapDividerFlip", value)}
        spacing={data.mapDividerSpacing ?? -80}
        onSpacingChange={(value) => onChange?.("mapDividerSpacing", value)}
        pullDown={data.mapDividerPullDown ?? 0}
        onPullDownChange={(value) => onChange?.("mapDividerPullDown", value)}
        verticalFlip={data.mapDividerVerticalFlip ?? false}
        onVerticalFlipChange={(value) => onChange?.("mapDividerVerticalFlip", value)}
        imageSize={data.mapDividerImageSize ?? 100}
        onImageSizeChange={(value) => onChange?.("mapDividerImageSize", value)}
        predefinedColors={predefinedSectionColors.map(c => c.value)}
        accentColor={accentColor}
        customImageUrl1={data.mapDividerCustomImageUrl1 || "/assets/divdr-1.png"}
        onCustomImageUrl1Change={(value) => onChange?.("mapDividerCustomImageUrl1", value)}
        customImageUrl2={data.mapDividerCustomImageUrl2 || "/assets/divdr-2.png"}
        onCustomImageUrl2Change={(value) => onChange?.("mapDividerCustomImageUrl2", value)}
        customImageUrl3={data.mapDividerCustomImageUrl3 || "/assets/divdr-3.png"}
        onCustomImageUrl3Change={(value) => onChange?.("mapDividerCustomImageUrl3", value)}
        predefinedDividerImages={data.mapDivider === "divider-1" ? predefinedDividerImagesCentered : data.mapDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
        useDefault={mapUseDefaultDivider}
        onUseDefaultChange={(value) => onChange?.("mapDividerUseDefault", value)}
        colorBlend={data.mapDividerColorBlend ?? false}
        onColorBlendChange={(value) => onChange?.("mapDividerColorBlend", value)}
      />
    )}

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
              Location - Section Design
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
                    value={mergedData.mapHeading ?? ""}
                    onChange={(e) => handleChange("mapHeading", e.target.value)}
                    placeholder="Location"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Location",
                        "Venue",
                        "Where We'll Celebrate",
                        "Our Wedding Venue",
                        "The Location",
                        "Celebration Venue",
                        "Reception Location"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.mapHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleChange("mapHeading", predefinedHeadings[nextIndex]);
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
                  value={mergedData.mapHeadingTypography || data.headingFont}
                  onChange={(value) => handleChange("mapHeadingTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.mapUseMainColor !== false}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>
              
              {/* Heading Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.mapHeadingFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.mapHeadingFontSize || 100}
                  onChange={(e) => handleChange("mapHeadingFontSize", parseInt(e.target.value))}
                  disabled={mergedData.mapUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.mapHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.mapHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Heading Color */}
              <ColorControl
                label="Heading Color"
                value={mergedData.mapHeadingColor || data.mainColor2}
                onChange={(value) => handleChange("mapHeadingColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.mapUseMainColor !== false}
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
                    value={mergedData.mapMessage ?? ""}
                    onChange={(e) => handleChange("mapMessage", e.target.value)}
                    placeholder="We look forward to celebrating with you at this beautiful venue..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedMessages = [
                        "We look forward to celebrating with you at this beautiful venue...",
                        "Join us at this stunning location for our special day. Your presence will make our celebration complete.",
                        "We've chosen this beautiful venue to celebrate our love. We can't wait to share this special moment with you.",
                        "The ceremony and reception will take place at this lovely venue. We're excited to celebrate with you!",
                        "Please join us at this beautiful location as we begin our journey together. Your presence means the world to us.",
                        "We're thrilled to celebrate our wedding at this wonderful venue. Thank you for being part of our special day."
                      ];
                      const currentIndex = predefinedMessages.indexOf(mergedData.mapMessage ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                      handleChange("mapMessage", predefinedMessages[nextIndex]);
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
                  value={mergedData.mapMessageTypography || data.bodyFont}
                  onChange={(value) => handleChange("mapMessageTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.mapUseMainColor !== false}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
              </div>
              
              {/* Message Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.mapMessageFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.mapMessageFontSize || 100}
                  onChange={(e) => handleChange("mapMessageFontSize", parseInt(e.target.value))}
                  disabled={mergedData.mapUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.mapMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.mapMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Message Color */}
              <ColorControl
                label="Message Color"
                value={mergedData.mapMessageColor || data.neutralColor1}
                onChange={(value) => handleChange("mapMessageColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.mapUseMainColor !== false}
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
                  value={mergedData.mapBackgroundType || "color"}
                  onChange={(e) => handleChange("mapBackgroundType", e.target.value)}
                  disabled={mergedData.mapUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.mapBackgroundType === "image" || mergedData.mapBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.mapGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("mapGradient", { ...mergedData.mapGradient, firstColor: e.target.value })}
                            disabled={mergedData.mapUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.mapGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("mapGradient", { ...mergedData.mapGradient, firstColor: value });
                          }}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.mapGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("mapGradient", { ...mergedData.mapGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.mapGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.mapGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.mapGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.mapGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("mapGradient", { ...mergedData.mapGradient, secondColor: e.target.value })}
                            disabled={mergedData.mapUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.mapGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("mapGradient", { ...mergedData.mapGradient, secondColor: value });
                          }}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.mapGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("mapGradient", { ...mergedData.mapGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.mapGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.mapGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.mapGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.mapBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.mapBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("mapBackgroundColor", e.target.value)}
                        disabled={mergedData.mapUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.mapBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("mapBackgroundColor", value);
                      }}
                      disabled={mergedData.mapUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.mapBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.mapGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("mapGradient", { ...mergedData.mapGradient, firstColor: e.target.value })}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.mapGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("mapGradient", { ...mergedData.mapGradient, firstColor: value });
                        }}
                        disabled={mergedData.mapUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.mapGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("mapGradient", { ...mergedData.mapGradient, secondColor: e.target.value })}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.mapGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("mapGradient", { ...mergedData.mapGradient, secondColor: value });
                        }}
                        disabled={mergedData.mapUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.mapBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.mapImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.mapImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("mapImage", { urls: newUrls });
                          }}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.mapImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("mapImage", { urls: newUrls });
                          }}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.mapImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.mapImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("mapImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.mapImage?.urls?.length || 1) - 1 && (mergedData.mapImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.mapImage?.urls || [""]), ""];
                            handleChange("mapImage", { urls: newUrls });
                          }}
                          disabled={mergedData.mapUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {mergedData.mapBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.mapVideo?.url || ""}
                      onChange={(e) => handleChange("mapVideo", { url: e.target.value })}
                      disabled={mergedData.mapUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("mapVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.mapUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.mapUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  checked={mergedData.mapUseMainColor !== false}
                  onChange={(e) => handleChange("mapUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("mapUseMainColor", !(mergedData.mapUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.mapUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: accentColor,
                  }}
                >
                  {mergedData.mapUseMainColor !== false && (
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
    </>
  );
}
