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

interface StoryTimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  photoUrl: string;
}

interface StoryTimelineContainer {
  id: string;
  title: string;
  item: StoryTimelineItem;
  isExpanded: boolean;
}

interface TimelineSectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
  editMode?: boolean;
}

export default function TimelineSection({ data, onChange, panelPosition = "left", desktopMode = false, editMode = false }: TimelineSectionProps) {
  const { isDarkMode, accentColor } = useTheme();
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);
  const [storyTimeline, setStoryTimeline] = useState<StoryTimelineContainer[]>([]);
  const [timelineState, setTimelineState] = useState(0);

  // Load story timeline from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('storyTimeline');
      if (stored) {
        setStoryTimeline(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load story timeline:', error);
    }
  }, []);

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

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.timelineBackgroundType === "color" && !mergedData.timelineBackgroundColor) {
      handleChange("timelineBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.timelineBackgroundType === "gradient" && !mergedData.timelineGradient) {
      handleChange("timelineGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.timelineBackgroundType === "image" && !mergedData.timelineImage) {
      handleChange("timelineImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("timelineGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.timelineBackgroundType === "video" && !mergedData.timelineVideo) {
      handleChange("timelineVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("timelineGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.timelineBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.timelineBackgroundType === "image" && mergedData.timelineImage?.urls && mergedData.timelineImage.urls.length > 1) {
      const validUrls = mergedData.timelineImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.timelineBackgroundType, mergedData.timelineImage?.urls]);

  if (!data.sections.timeline) return null;

  const events = storyTimeline.map(container => container.item).filter(
    event => event.title.trim() !== "" || event.description.trim() !== ""
  );

  if (events.length === 0) return null;

  const timelineUseDefaultDivider = data.timelineDividerUseDefault ?? true;
  const effectivePullDown = timelineUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.timelineDividerPullDown ?? 0);
  const effectiveVerticalFlip = timelineUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.timelineDividerVerticalFlip ?? false);

  return (
    <>
      <section className="pt-0 pb-8 px-8 relative min-h-[200px]" style={{
        backgroundColor: mergedData.timelineUseMainColor !== false
          ? (data.mainColor1 || "transparent")
          : mergedData.timelineBackgroundType === "gradient"
            ? undefined
            : mergedData.timelineBackgroundType === "image"
              ? undefined
              : mergedData.timelineBackgroundType === "video"
                ? undefined
                : (mergedData.timelineBackgroundColor || "transparent"),
        background: mergedData.timelineUseMainColor !== false
          ? (data.mainColor1 || "transparent")
          : mergedData.timelineBackgroundType === "gradient" && mergedData.timelineGradient
            ? `linear-gradient(135deg, ${mergedData.timelineGradient.firstColor || "#ffffff"}, ${mergedData.timelineGradient.secondColor || "#ffffff"})`
            : undefined,
        ...(mergedData.timelineBackgroundType === "image" && mergedData.timelineImage?.urls && mergedData.timelineImage.urls.length > 0 ? {
          backgroundImage: `url(${mergedData.timelineImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        } : {}),
        transition: 'background 1s ease-in-out'
      }}>
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.timelineBackgroundType === "image" || mergedData.timelineBackgroundType === "video") && mergedData.timelineGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.timelineGradient.firstColor || "#ffffff", (mergedData.timelineGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.timelineGradient.secondColor || "#ffffff", (mergedData.timelineGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.timelineBackgroundType === "video" && mergedData.timelineVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.timelineVideo.url)}
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
        type={timelineUseDefaultDivider ? (data.universalDivider || "none") : (data.timelineDivider || "none")} 
        color={data.mainColor2} 
        id="timeline-cssid" 
        offset={timelineUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.timelineDividerOffset ?? 0)}
        tintColor={timelineUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.timelineDividerTintColor || data.mainColor2)}
        tintOpacity={timelineUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.timelineDividerTintOpacity ?? 100)}
        dividerStyle={timelineUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.timelineDividerStyle || "centered-single")}
        flip={timelineUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.timelineDividerFlip ?? false)}
        spacing={timelineUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.timelineDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={timelineUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.timelineDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={timelineUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.timelineDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={timelineUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.timelineDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={timelineUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.timelineDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={timelineUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.timelineDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (timelineUseDefaultDivider) {
            onChange?.("timelineDividerUseDefault", false);
          }
          onChange?.("timelineDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('timeline-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Timeline Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.timelineDivider && data.timelineDivider !== "none" ? data.timelineDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("timelineDivider", value)}
          tintColor={data.timelineDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("timelineDividerTintColor", value)}
          tintOpacity={data.timelineDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("timelineDividerTintOpacity", value)}
          dividerStyle={data.timelineDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("timelineDividerStyle", value)}
          flip={data.timelineDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("timelineDividerFlip", value)}
          spacing={data.timelineDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("timelineDividerSpacing", value)}
          pullDown={data.timelineDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("timelineDividerPullDown", value)}
          verticalFlip={data.timelineDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("timelineDividerVerticalFlip", value)}
          imageSize={data.timelineDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("timelineDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.timelineDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("timelineDividerCustomImageUrl1", value)}
          customImageUrl2={data.timelineDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("timelineDividerCustomImageUrl2", value)}
          customImageUrl3={data.timelineDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("timelineDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.timelineDivider === "divider-1" ? predefinedDividerImagesCentered : data.timelineDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={timelineUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("timelineDividerUseDefault", value)}
          colorBlend={data.timelineDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("timelineDividerColorBlend", value)}
        />
      )}
      <h2
        className="text-2xl font-bold uppercase mb-1 lg:mb-12 text-center scale-[0.55] lg:scale-100"
        style={{
          color: mergedData.timelineUseMainColor !== false ? data.mainColor2 : (mergedData.timelineHeadingColor || data.mainColor2),
          fontFamily: mergedData.timelineUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.timelineHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.timelineHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('timeline-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.timelineHeading || "Our Story"}
        </span>
      </h2>

      {mergedData.timelineMessage && (
        <p
          className="text-center mb-12 leading-relaxed scale-[0.7] lg:scale-100"
          style={{
            color: mergedData.timelineUseMainColor !== false ? data.neutralColor1 : (mergedData.timelineMessageColor || data.neutralColor1),
            fontFamily: mergedData.timelineUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.timelineMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.timelineMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.timelineMessage}
        </p>
      )}

      <div className="max-w-4xl mx-auto py-8">
        <div className={`timeline-container state-${timelineState}`}>
          {events.map((event, index) => (
            <div key={event.id} className="timeline-row cursor-pointer" onClick={() => setTimelineState(prev => (prev + 1) % 4)}>
              {/* Column 1: Left Content Area (45%) */}
              <div className="timeline-col timeline-col-left">
                <div className="timeline-content">
                  <p className="timeline-title">{event.title}</p>
                  {event.date && (
                    <p className="timeline-date">{event.date}</p>
                  )}
                  <div className="timeline-image-block">
                    {event.photoUrl && (
                      <img
                        src={event.photoUrl}
                        alt=""
                        className="timeline-photo"
                      />
                    )}
                  </div>
                  <p className="timeline-description">{event.description}</p>
                </div>
              </div>

              {/* Column 2: Center Spine/Node (10%) */}
              <div className="timeline-col timeline-col-center">
                <div className="timeline-node">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="timeline-heart">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
              </div>

              {/* Column 3: Right Content Area (45%) */}
              <div className="timeline-col timeline-col-right">
                <div className="timeline-content">
                  <p className="timeline-title">{event.title}</p>
                  {event.date && (
                    <p className="timeline-date">{event.date}</p>
                  )}
                  <div className="timeline-image-block">
                    {event.photoUrl && (
                      <img
                        src={event.photoUrl}
                        alt=""
                        className="timeline-photo"
                      />
                    )}
                  </div>
                  <p className="timeline-description">{event.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* Shared: Continuous vertical spine using pseudo-element */
        .timeline-container {
          position: relative;
          padding: 0;
        }

        .timeline-container::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: ${data.neutralColor2};
          opacity: 0.3;
          transform: translateX(-50%);
          z-index: 0;
        }

        .timeline-row {
          display: grid;
          grid-template-columns: 45% 10% 45%;
          align-items: center;
          margin-bottom: 3rem;
          position: relative;
          z-index: 1;
        }

        .timeline-col {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timeline-col-left {
          padding-right: 1rem;
        }

        .timeline-col-right {
          padding-left: 1rem;
        }

        .timeline-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
        }

        /* Heart icon node */
        .timeline-node {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timeline-heart {
          color: ${data.neutralColor2};
          width: 32px;
          height: 32px;
        }

        /* Image and text blocks */
        .timeline-image-block {
          display: none;
          max-width: 100%;
          overflow: hidden;
        }

        .timeline-photo {
          max-width: 280px;
          max-height: 280px;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 1023px) {
          .timeline-photo {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
          }
        }

        .timeline-date {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${data.neutralColor1};
          opacity: 0.6;
          font-family: 'Inter', sans-serif;
          margin-bottom: 0.5rem;
        }

        .timeline-title {
          font-size: 1rem;
          font-weight: 400;
          color: ${data.mainColor2};
          font-family: 'Inter', sans-serif;
          margin-bottom: 0.5rem;
        }

        .timeline-description {
          font-size: 0.875rem;
          color: ${data.neutralColor1};
          opacity: 0.8;
          font-family: 'Inter', sans-serif;
          line-height: 1.5;
        }

        /* State 0: Show only image on one side, text on the other */
        /* Odd rows: Image on left, Text (title/date/description) on right */
        .timeline-container.state-0 .timeline-row:nth-child(odd) .timeline-col-left .timeline-image-block {
          display: flex;
          justify-content: center;
        }

        .timeline-container.state-0 .timeline-row:nth-child(odd) .timeline-col-left .timeline-title,
        .timeline-container.state-0 .timeline-row:nth-child(odd) .timeline-col-left .timeline-date,
        .timeline-container.state-0 .timeline-row:nth-child(odd) .timeline-col-left .timeline-description {
          display: none;
        }

        .timeline-container.state-0 .timeline-row:nth-child(odd) .timeline-col-right .timeline-image-block {
          display: none;
        }

        /* Even rows: Text on left, Image on right */
        .timeline-container.state-0 .timeline-row:nth-child(even) .timeline-col-right .timeline-image-block {
          display: flex;
          justify-content: center;
        }

        .timeline-container.state-0 .timeline-row:nth-child(even) .timeline-col-right .timeline-title,
        .timeline-container.state-0 .timeline-row:nth-child(even) .timeline-col-right .timeline-date,
        .timeline-container.state-0 .timeline-row:nth-child(even) .timeline-col-right .timeline-description {
          display: none;
        }

        .timeline-container.state-0 .timeline-row:nth-child(even) .timeline-col-left .timeline-image-block {
          display: none;
        }

        /* State 1: Alternating Single-Column Layout */
        .timeline-container.state-1 .timeline-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .timeline-container.state-1 .timeline-image-block {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
        }

        /* Ensure all text elements are visible in State 1 */
        .timeline-container.state-1 .timeline-title,
        .timeline-container.state-1 .timeline-date,
        .timeline-container.state-1 .timeline-description {
          display: block;
        }

        .timeline-container.state-1 .timeline-col-left,
        .timeline-container.state-1 .timeline-col-right {
          padding: 0;
        }

        .timeline-container.state-1 .timeline-col-left {
          padding-right: 1rem;
        }

        .timeline-container.state-1 .timeline-col-right {
          padding-left: 1rem;
        }

        .timeline-container.state-1 .timeline-row {
          margin-bottom: 0;
        }

        /* Odd rows: Content in left column, right column empty */
        .timeline-container.state-1 .timeline-row:nth-child(odd) .timeline-col-left .timeline-content {
          display: flex;
        }

        .timeline-container.state-1 .timeline-row:nth-child(odd) .timeline-col-right .timeline-content {
          display: none;
        }

        /* Even rows: Content in right column, left column empty */
        .timeline-container.state-1 .timeline-row:nth-child(even) .timeline-col-left .timeline-content {
          display: none;
        }

        .timeline-container.state-1 .timeline-row:nth-child(even) .timeline-col-right .timeline-content {
          display: flex;
        }

        /* State 1 content order: Title, Date, Photo, Description */
        .timeline-container.state-1 .timeline-content .timeline-title {
          order: 1;
        }

        .timeline-container.state-1 .timeline-content .timeline-date {
          order: 2;
        }

        .timeline-container.state-1 .timeline-content .timeline-image-block {
          order: 3;
        }

        .timeline-container.state-1 .timeline-content .timeline-description {
          order: 4;
        }

        /* State 2: Non-Alternating Photo Paper Layout */
        /* All rows: Image in column 1, Text in column 3 */
        .timeline-container.state-2 .timeline-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* Column padding */
        .timeline-container.state-2 .timeline-col-left {
          padding-right: 2rem;
        }

        .timeline-container.state-2 .timeline-col-right {
          padding-left: 2rem;
        }

        /* Show image in column 1 for all rows */
        .timeline-container.state-2 .timeline-col-left .timeline-image-block {
          display: flex;
          justify-content: center;
        }

        .timeline-container.state-2 .timeline-col-left .timeline-title,
        .timeline-container.state-2 .timeline-col-left .timeline-date,
        .timeline-container.state-2 .timeline-col-left .timeline-description {
          display: none;
        }

        /* Hide image in column 3 for all rows */
        .timeline-container.state-2 .timeline-col-right .timeline-image-block {
          display: none;
        }

        /* Show only date and title in column 3, hide description */
        .timeline-container.state-2 .timeline-col-right .timeline-title,
        .timeline-container.state-2 .timeline-col-right .timeline-date {
          display: block;
        }

        .timeline-container.state-2 .timeline-col-right .timeline-description {
          display: none;
        }

        /* Text order: Year first, then Title */
        .timeline-container.state-2 .timeline-col-right .timeline-content .timeline-date {
          order: 1;
        }

        .timeline-container.state-2 .timeline-col-right .timeline-content .timeline-title {
          order: 2;
        }

        /* Photo paper design: white container with padding */
        .timeline-container.state-2 .timeline-image-block {
          background: white;
          padding: 12px 12px 40px 12px;
          box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.2);
          display: inline-flex;
          justify-content: center;
        }

        .timeline-container.state-2 .timeline-photo {
          width: 180px;
          height: 180px;
          object-fit: cover;
          max-width: none;
          max-height: none;
          border-radius: 0;
        }

        /* Alternating rotation: odd rows tilt right, even rows tilt left */
        .timeline-container.state-2 .timeline-row:nth-child(odd) .timeline-image-block {
          transform: rotate(4deg);
        }

        .timeline-container.state-2 .timeline-row:nth-child(even) .timeline-image-block {
          transform: rotate(-4deg);
        }

        .timeline-container.state-2 .timeline-row {
          margin-bottom: 0.5rem;
        }

        .timeline-container.state-2 .timeline-row:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 1023px) {
          .timeline-container.state-2 .timeline-col-left {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .timeline-container.state-2 .timeline-image-block {
            padding: 8px 8px 28px 8px;
            max-width: 100%;
            box-sizing: border-box;
          }

          .timeline-container.state-2 .timeline-photo {
            width: 100%;
            height: auto;
            aspect-ratio: 1;
            max-width: 140px;
          }
        }

        /* State 3: Mirror of State 2 - Image in column 3, Text in column 1 */
        .timeline-container.state-3 .timeline-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .timeline-container.state-3 .timeline-col-left {
          padding-right: 2rem;
        }

        .timeline-container.state-3 .timeline-col-right {
          padding-left: 2rem;
        }

        /* Show text in column 1, hide image */
        .timeline-container.state-3 .timeline-col-left .timeline-title,
        .timeline-container.state-3 .timeline-col-left .timeline-date {
          display: block;
        }

        .timeline-container.state-3 .timeline-col-left .timeline-description {
          display: none;
        }

        .timeline-container.state-3 .timeline-col-left .timeline-image-block {
          display: none;
        }

        /* Text order in column 1: Year first, then Title */
        .timeline-container.state-3 .timeline-col-left .timeline-content .timeline-date {
          order: 1;
        }

        .timeline-container.state-3 .timeline-col-left .timeline-content .timeline-title {
          order: 2;
        }

        /* Show image in column 3, hide text */
        .timeline-container.state-3 .timeline-col-right .timeline-image-block {
          display: flex;
          justify-content: center;
        }

        .timeline-container.state-3 .timeline-col-right .timeline-title,
        .timeline-container.state-3 .timeline-col-right .timeline-date,
        .timeline-container.state-3 .timeline-col-right .timeline-description {
          display: none;
        }

        /* Photo paper design */
        .timeline-container.state-3 .timeline-image-block {
          background: white;
          padding: 12px 12px 40px 12px;
          box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.2);
          display: inline-flex;
          justify-content: center;
        }

        .timeline-container.state-3 .timeline-photo {
          width: 180px;
          height: 180px;
          object-fit: cover;
          max-width: none;
          max-height: none;
          border-radius: 0;
        }

        /* Alternating rotation */
        .timeline-container.state-3 .timeline-row:nth-child(odd) .timeline-image-block {
          transform: rotate(-4deg);
        }

        .timeline-container.state-3 .timeline-row:nth-child(even) .timeline-image-block {
          transform: rotate(4deg);
        }

        .timeline-container.state-3 .timeline-row {
          margin-bottom: 0.5rem;
        }

        .timeline-container.state-3 .timeline-row:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 1023px) {
          .timeline-container.state-3 .timeline-col-right {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .timeline-container.state-3 .timeline-image-block {
            padding: 8px 8px 28px 8px;
            max-width: 100%;
            box-sizing: border-box;
          }

          .timeline-container.state-3 .timeline-photo {
            width: 100%;
            height: auto;
            aspect-ratio: 1;
            max-width: 140px;
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
              Timeline - Section Design
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
                    value={mergedData.timelineHeading ?? ""}
                    onChange={(e) => handleChange("timelineHeading", e.target.value)}
                    placeholder="Our Story"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Our Story",
                        "Love Story",
                        "Our Journey",
                        "Our Timeline",
                        "How We Met",
                        "Our Path Together",
                        "Our Love Journey"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.timelineHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleChange("timelineHeading", predefinedHeadings[nextIndex]);
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
                  value={mergedData.timelineHeadingTypography || data.headingFont}
                  onChange={(value) => handleChange("timelineHeadingTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.timelineUseMainColor !== false}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>
              
              {/* Heading Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.timelineHeadingFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.timelineHeadingFontSize || 100}
                  onChange={(e) => handleChange("timelineHeadingFontSize", parseInt(e.target.value))}
                  disabled={mergedData.timelineUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.timelineHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.timelineHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Heading Color */}
              <ColorControl
                label="Heading Color"
                value={mergedData.timelineHeadingColor || data.mainColor2}
                onChange={(value) => handleChange("timelineHeadingColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={mergedData.timelineUseMainColor !== false}
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
                    value={mergedData.timelineMessage ?? ""}
                    onChange={(e) => handleChange("timelineMessage", e.target.value)}
                    placeholder="From our first meeting to this special day, here's our journey together..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedMessages = [
                        "From our first meeting to this special day, here's our journey together...",
                        "Every moment we've shared has led us here. This is our love story in milestones.",
                        "Our journey began with a single moment and has grown into a beautiful adventure. Here are the highlights.",
                        "From strangers to soulmates, our timeline captures the moments that brought us together.",
                        "Each milestone in our journey has been a step toward forever. Here's our story.",
                        "The path that led us to this day has been filled with love, laughter, and unforgettable moments."
                      ];
                      const currentIndex = predefinedMessages.indexOf(mergedData.timelineMessage ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                      handleChange("timelineMessage", predefinedMessages[nextIndex]);
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
                  value={mergedData.timelineMessageTypography || data.bodyFont}
                  onChange={(value) => handleChange("timelineMessageTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.timelineUseMainColor !== false}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
              </div>
              
              {/* Message Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.timelineMessageFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.timelineMessageFontSize || 100}
                  onChange={(e) => handleChange("timelineMessageFontSize", parseInt(e.target.value))}
                  disabled={mergedData.timelineUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.timelineMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.timelineMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Message Color */}
              <ColorControl
                label="Message Color"
                value={mergedData.timelineMessageColor || data.neutralColor1}
                onChange={(value) => handleChange("timelineMessageColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={mergedData.timelineUseMainColor !== false}
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
                  value={mergedData.timelineBackgroundType || "color"}
                  onChange={(e) => handleChange("timelineBackgroundType", e.target.value)}
                  disabled={mergedData.timelineUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.timelineBackgroundType === "image" || mergedData.timelineBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.timelineGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("timelineGradient", { ...mergedData.timelineGradient, firstColor: e.target.value })}
                            disabled={mergedData.timelineUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.timelineGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("timelineGradient", { ...mergedData.timelineGradient, firstColor: value });
                          }}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.timelineGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("timelineGradient", { ...mergedData.timelineGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.timelineGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.timelineGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.timelineGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.timelineGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("timelineGradient", { ...mergedData.timelineGradient, secondColor: e.target.value })}
                            disabled={mergedData.timelineUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.timelineGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("timelineGradient", { ...mergedData.timelineGradient, secondColor: value });
                          }}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.timelineGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("timelineGradient", { ...mergedData.timelineGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.timelineGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.timelineGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.timelineGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.timelineBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.timelineBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("timelineBackgroundColor", e.target.value)}
                        disabled={mergedData.timelineUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.timelineBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("timelineBackgroundColor", value);
                      }}
                      disabled={mergedData.timelineUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.timelineBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.timelineGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("timelineGradient", { ...mergedData.timelineGradient, firstColor: e.target.value })}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.timelineGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("timelineGradient", { ...mergedData.timelineGradient, firstColor: value });
                        }}
                        disabled={mergedData.timelineUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.timelineGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("timelineGradient", { ...mergedData.timelineGradient, secondColor: e.target.value })}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.timelineGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("timelineGradient", { ...mergedData.timelineGradient, secondColor: value });
                        }}
                        disabled={mergedData.timelineUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.timelineBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.timelineImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.timelineImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("timelineImage", { urls: newUrls });
                          }}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.timelineImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("timelineImage", { urls: newUrls });
                          }}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.timelineImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.timelineImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("timelineImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.timelineImage?.urls?.length || 1) - 1 && (mergedData.timelineImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.timelineImage?.urls || [""]), ""];
                            handleChange("timelineImage", { urls: newUrls });
                          }}
                          disabled={mergedData.timelineUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {mergedData.timelineBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.timelineVideo?.url || ""}
                      onChange={(e) => handleChange("timelineVideo", { url: e.target.value })}
                      disabled={mergedData.timelineUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("timelineVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.timelineUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.timelineUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  checked={mergedData.timelineUseMainColor !== false}
                  onChange={(e) => handleChange("timelineUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("timelineUseMainColor", !(mergedData.timelineUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.timelineUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: accentColor,
                  }}
                >
                  {mergedData.timelineUseMainColor !== false && (
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
