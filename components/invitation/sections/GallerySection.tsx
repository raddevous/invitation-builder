"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import { useEditMode } from "../EditModeContext";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface GallerySectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
}

const MAX_GALLERY = 30;

export default function GallerySection({ data, onChange, panelPosition = "left", desktopMode = false }: GallerySectionProps) {
  const { isDarkMode, accentColor } = useTheme();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [showGallerySettingsPanel, setShowGallerySettingsPanel] = useState(false);
  const [isGallerySettingsClosing, setIsGallerySettingsClosing] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [galleryDialogIndex, setGalleryDialogIndex] = useState(0);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close gallery dialog
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showGalleryDialog) {
        setShowGalleryDialog(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showGalleryDialog]);

  // Disable body scroll when gallery dialog or lightbox is open
  useEffect(() => {
    if (showGalleryDialog || activeIdx !== null) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showGalleryDialog, activeIdx]);

  // Handle scroll to change image in gallery dialog
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!showGalleryDialog) return;
      
      const currentImages = data.galleryImages || [];
      
      if (e.deltaY > 0) {
        // Scroll down - next image (no loop)
        setGalleryDialogIndex((prev) => (prev < currentImages.length - 1 ? prev + 1 : prev));
      } else {
        // Scroll up - previous image (no loop)
        setGalleryDialogIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };
    
    if (showGalleryDialog) {
      window.addEventListener('wheel', handleWheel, { passive: true });
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [showGalleryDialog, data.galleryImages]);

  // Scroll selected thumbnail to center
  useEffect(() => {
    if (thumbnailStripRef.current && showGalleryDialog) {
      const strip = thumbnailStripRef.current;
      const thumbnails = strip.querySelectorAll('button[data-thumbnail]');
      const selectedThumbnail = thumbnails[galleryDialogIndex] as HTMLElement;
      
      if (selectedThumbnail) {
        const stripWidth = strip.clientWidth;
        const thumbnailWidth = selectedThumbnail.offsetWidth;
        const thumbnailLeft = selectedThumbnail.offsetLeft;
        const scrollLeft = thumbnailLeft - (stripWidth / 2) + (thumbnailWidth / 2);
        
        strip.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [galleryDialogIndex, showGalleryDialog]);

  // Handle touch swipe on full-size image
  useEffect(() => {
    if (!showGalleryDialog) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const currentImages = data.galleryImages || [];
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next image
          setGalleryDialogIndex((prev) => (prev < currentImages.length - 1 ? prev + 1 : prev));
        } else {
          // Swipe right - previous image
          setGalleryDialogIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showGalleryDialog, data.galleryImages]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const { editMode } = useEditMode();
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingChanges };

  const images = data.galleryImages || [];

  // Calculate mobile display limit (even numbers only, max 10)
  const mobileDisplayLimit = Math.min(
    Math.floor(mergedData.galleryImages?.length / 2) * 2,
    10
  );

  const defaultImageUrls = [
    "https://images.pexels.com/photos/4280819/pexels-photo-4280819.jpeg",
    "https://images.pexels.com/photos/31743603/pexels-photo-31743603.jpeg",
    "https://images.pexels.com/photos/31743593/pexels-photo-31743593.jpeg",
    "https://images.pexels.com/photos/10344056/pexels-photo-10344056.jpeg",
    "https://images.pexels.com/photos/28390405/pexels-photo-28390405.jpeg",
    "https://images.pexels.com/photos/28390404/pexels-photo-28390404.jpeg",
    "https://images.pexels.com/photos/31451901/pexels-photo-31451901.jpeg",
    "https://images.pexels.com/photos/31451872/pexels-photo-31451872.jpeg",
    "https://images.pexels.com/photos/11914376/pexels-photo-11914376.jpeg",
    "https://images.pexels.com/photos/30723350/pexels-photo-30723350.jpeg",
    "https://images.pexels.com/photos/30818920/pexels-photo-30818920.jpeg",
    "https://images.pexels.com/photos/20004302/pexels-photo-20004302.jpeg"
  ];

  const gridLayouts = [
    { label: "1x1", rows: 1, cols: 1, maxImages: 1 },
    { label: "1x2", rows: 1, cols: 2, maxImages: 2 },
    { label: "1x3", rows: 1, cols: 3, maxImages: 3 },
    { label: "2x2", rows: 2, cols: 2, maxImages: 4 },
    { label: "2x3", rows: 2, cols: 3, maxImages: 6 },
    { label: "3x3", rows: 3, cols: 3, maxImages: 9 },
    { label: "3x4", rows: 3, cols: 4, maxImages: 12 },
    { label: "4x4", rows: 4, cols: 4, maxImages: 16 },
    { label: "5x5", rows: 5, cols: 5, maxImages: 25 }
  ];

  const currentLayoutIndex = gridLayouts.findIndex(l => l.label === (data.galleryGridLayout || "3x3"));
  const currentLayout = gridLayouts[currentLayoutIndex] || gridLayouts[5];

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

  const handleCloseGallerySettingsPanel = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
    setIsGallerySettingsClosing(true);
    setTimeout(() => {
      setShowGallerySettingsPanel(false);
      setIsGallerySettingsClosing(false);
    }, 300);
  };

  const handleAddImage = () => {
    const currentImages = mergedData.galleryImages || [];
    if (currentImages.length < MAX_GALLERY) {
      const nextIndex = currentImages.length;
      const defaultUrl = defaultImageUrls[nextIndex] || "";
      handleChange("galleryImages", [...currentImages, defaultUrl]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = mergedData.galleryImages || [];
    // Prevent removing the last image
    if (currentImages.length <= 1) return;
    const newImages = currentImages.filter((_, i) => i !== index);
    handleChange("galleryImages", newImages);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const currentImages = mergedData.galleryImages || [];
    const newImages = [...currentImages];
    newImages[index] = value;
    handleChange("galleryImages", newImages);
  };


  const handleChange = (key: keyof InvitationData, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    onChange?.(key, value);
  };

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.galleryBackgroundType === "color" && !mergedData.galleryBackgroundColor) {
      handleChange("galleryBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.galleryBackgroundType === "gradient" && !mergedData.galleryGradient) {
      handleChange("galleryGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.galleryBackgroundType === "image" && !mergedData.galleryImage) {
      handleChange("galleryImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("galleryGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.galleryBackgroundType === "video" && !mergedData.galleryVideo) {
      handleChange("galleryVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("galleryGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.galleryBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Ensure at least 1 image exists
  useEffect(() => {
    if (!data.galleryImages || data.galleryImages.length === 0) {
      onChange && onChange("galleryImages", [""]);
    }
  }, []);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.galleryBackgroundType === "image" && mergedData.galleryImage?.urls && mergedData.galleryImage.urls.length > 1) {
      const validUrls = mergedData.galleryImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.galleryBackgroundType, mergedData.galleryImage?.urls]);

  if (!data.sections.gallery) return null;

  const galleryUseDefaultDivider = data.galleryDividerUseDefault ?? true;
  const effectivePullDown = galleryUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.galleryDividerPullDown ?? 0);
  const effectiveVerticalFlip = galleryUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.galleryDividerVerticalFlip ?? false);

  return (
    <>
      <section
        className="pt-0 pb-8 px-8 relative min-h-[200px]"
        style={{
          backgroundColor: mergedData.galleryUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.galleryBackgroundType === "gradient"
              ? undefined
              : mergedData.galleryBackgroundType === "image"
                ? undefined
                : mergedData.galleryBackgroundType === "video"
                  ? undefined
                  : (mergedData.galleryBackgroundColor || "transparent"),
          background: mergedData.galleryUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.galleryBackgroundType === "gradient" && mergedData.galleryGradient
              ? `linear-gradient(135deg, ${mergedData.galleryGradient.firstColor || "#ffffff"}, ${mergedData.galleryGradient.secondColor || "#ffffff"})`
              : undefined,
          ...(mergedData.galleryBackgroundType === "image" && mergedData.galleryImage?.urls && mergedData.galleryImage.urls.length > 0 ? {
            backgroundImage: `url(${mergedData.galleryImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          } : {}),
          transition: 'background 1s ease-in-out'
        }}
      >
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.galleryBackgroundType === "image" || mergedData.galleryBackgroundType === "video") && mergedData.galleryGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.galleryGradient.firstColor || "#ffffff", (mergedData.galleryGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.galleryGradient.secondColor || "#ffffff", (mergedData.galleryGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.galleryBackgroundType === "video" && mergedData.galleryVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.galleryVideo.url)}
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
        type={galleryUseDefaultDivider ? (data.universalDivider || "none") : (data.galleryDivider || "none")} 
        color={data.mainColor2} 
        id="gallery-cssid" 
        offset={galleryUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.galleryDividerOffset ?? 0)}
        tintColor={galleryUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.galleryDividerTintColor || data.mainColor2)}
        tintOpacity={galleryUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.galleryDividerTintOpacity ?? 100)}
        dividerStyle={galleryUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.galleryDividerStyle || "centered-single")}
        flip={galleryUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.galleryDividerFlip ?? false)}
        spacing={galleryUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.galleryDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={galleryUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.galleryDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={galleryUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.galleryDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={galleryUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.galleryDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={galleryUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.galleryDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={galleryUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.galleryDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (galleryUseDefaultDivider) {
            onChange?.("galleryDividerUseDefault", false);
          }
          onChange?.("galleryDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('gallery-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Gallery Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.galleryDivider && data.galleryDivider !== "none" ? data.galleryDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("galleryDivider", value)}
          tintColor={data.galleryDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("galleryDividerTintColor", value)}
          tintOpacity={data.galleryDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("galleryDividerTintOpacity", value)}
          dividerStyle={data.galleryDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("galleryDividerStyle", value)}
          flip={data.galleryDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("galleryDividerFlip", value)}
          spacing={data.galleryDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("galleryDividerSpacing", value)}
          pullDown={data.galleryDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("galleryDividerPullDown", value)}
          verticalFlip={data.galleryDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("galleryDividerVerticalFlip", value)}
          imageSize={data.galleryDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("galleryDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.galleryDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("galleryDividerCustomImageUrl1", value)}
          customImageUrl2={data.galleryDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("galleryDividerCustomImageUrl2", value)}
          customImageUrl3={data.galleryDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("galleryDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.galleryDivider === "divider-1" ? predefinedDividerImagesCentered : data.galleryDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={galleryUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("galleryDividerUseDefault", value)}
          colorBlend={data.galleryDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("galleryDividerColorBlend", value)}
        />
      )}
      <h2
        className="text-2xl mb-1 md:mb-8 text-center font-bold uppercase scale-[0.55] md:scale-100"
        style={{
          color: mergedData.galleryUseMainColor !== false ? data.mainColor2 : (mergedData.galleryHeadingColor || data.mainColor2),
          fontFamily: mergedData.galleryUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.galleryHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.galleryHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('gallery-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.galleryHeading || "Our Moments"}
        </span>
      </h2>

      {mergedData.galleryMessage && (
        <div className="max-w-2xl mx-auto">
          <p
            className="text-center mb-10 leading-relaxed scale-[0.7] md:scale-100"
            style={{
              color: mergedData.galleryUseMainColor !== false ? data.neutralColor1 : (mergedData.galleryMessageColor || data.neutralColor1),
              fontFamily: mergedData.galleryUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.galleryMessageTypography || data.bodyFont, "body"),
              fontSize: `${mergedData.galleryMessageFontSize || 100}%`,
              opacity: 0.85
            }}
          >
            {mergedData.galleryMessage}
          </p>
        </div>
      )}

      {(() => {
        const previewLayoutIndex = gridLayouts.findIndex(l => l.label === (mergedData.galleryGridLayout || "3x3"));
        const previewLayout = gridLayouts[previewLayoutIndex] || gridLayouts[5];
        const displayImages = mergedData.galleryImages.slice(0, desktopMode ? previewLayout.maxImages : mobileDisplayLimit);
        return (
          <div 
            className={`mx-auto ${displayImages.length === 1 ? 'flex justify-center' : 'grid gap-3 grid-cols-2'}`}
            style={{ 
              '--cols': previewLayout.cols,
              width: displayImages.length === 1 ? 'auto' : 'fit-content'
            } as React.CSSProperties}
          >
            <style jsx>{`
              @media (min-width: 768px) {
                div {
                  grid-template-columns: repeat(var(--cols), minmax(0, 1fr)) !important;
                }
              }
            `}</style>
              {/* Existing images - show based on grid layout (desktop) or mobile limit (mobile) */}
              {displayImages.map((imgId, idx) => (
            <div
              key={idx}
              className="rounded-lg overflow-hidden cursor-pointer shrink-0 w-[150px] h-[150px] md:w-[180px] md:h-[180px] relative group"
              onClick={() => {
                if (editMode) {
                  setShowGallerySettingsPanel(true);
                  const element = document.getElementById('gallery-cssid');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
            >
              {imgId ? (
                <>
                  <img
                    src={imgId.startsWith("http") || imgId.startsWith("/") ? imgId : `/stock/gallery/${imgId}`}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onClick={(e) => {
                      if (!editMode) {
                        setActiveIdx(idx);
                      }
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none group-hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-shadow duration-300" />
                </>
              ) : (
                <div
                  className="w-full h-full rounded-lg flex items-center justify-center border-2 border-dashed"
                  style={{ borderColor: accentColor, backgroundColor: accentColor + "30" }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={data.neutralColor2} strokeWidth="1" opacity="0.4">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Static placeholders when not in edit mode and no images */}
          {!editMode && mergedData.galleryImages.length === 0 &&
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg flex items-center justify-center"
                style={{ backgroundColor: accentColor + "60" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={data.neutralColor2} strokeWidth="1" opacity="0.4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            ))
          }
        </div>
        );
      })()}

        {/* Spacer */}
        <div style={{ height: '50px' }} />

        {/* Open Gallery Button - shown when there are more images than can be displayed */}
        {(() => {
          const previewLayoutIndex = gridLayouts.findIndex(l => l.label === (mergedData.galleryGridLayout || "3x3"));
          const previewLayout = gridLayouts[previewLayoutIndex] || gridLayouts[5];
          const buttonColor = mergedData.galleryButtonColor || data.mainColor2;
          return mergedData.galleryImages.length > (desktopMode ? previewLayout.maxImages : mobileDisplayLimit) && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowGalleryDialog(true);
                setGalleryDialogIndex(0);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm tracking-wide transition-all duration-300 active:scale-95 relative overflow-hidden backdrop-blur-md border shadow-lg cursor-pointer hover:shadow-xl hover:scale-105"
              style={{
                backgroundColor: `${buttonColor}20`,
                borderColor: `${buttonColor}40`,
                color: 'white',
                fontFamily: `${data.bodyFont}, serif`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${buttonColor}30`;
                e.currentTarget.style.borderColor = `${buttonColor}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${buttonColor}20`;
                e.currentTarget.style.borderColor = `${buttonColor}40`;
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full pointer-events-none"></span>
              <span className="relative z-10 flex items-center gap-2">
                OPEN GALLERY
              </span>
            </button>
          </div>
          );
        })()}

        {/* Spacer */}
        <div style={{ height: '50px' }} />

      {/* Lightbox */}
      {activeIdx !== null && createPortal(
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={() => setActiveIdx(null)}
        >
          <img
            src={mergedData.galleryImages[activeIdx].startsWith("http") || mergedData.galleryImages[activeIdx].startsWith("/") ? mergedData.galleryImages[activeIdx] : `/stock/gallery/${mergedData.galleryImages[activeIdx]}`}
            alt="Gallery"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>,
        document.body
      )}

      {/* Gallery Dialog */}
      {showGalleryDialog && createPortal(
        <div 
          className="fixed inset-0 bg-black/95 flex flex-col"
          style={{ zIndex: 99999 }}
          onClick={() => setShowGalleryDialog(false)}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowGalleryDialog(false);
            }}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Full-size image */}
          <div 
            className="flex-1 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={mergedData.galleryImages[galleryDialogIndex].startsWith("http") || mergedData.galleryImages[galleryDialogIndex].startsWith("/") ? mergedData.galleryImages[galleryDialogIndex] : `/stock/gallery/${mergedData.galleryImages[galleryDialogIndex]}`}
              alt={`Gallery ${galleryDialogIndex + 1}`}
              className="max-w-full max-h-full object-contain max-w-4xl max-h-[70vh]"
            />
          </div>

          {/* Thumbnail strip */}
          <div 
            ref={thumbnailStripRef}
            className="h-28 bg-black/80 flex items-center gap-2 px-4 overflow-x-auto snap-x snap-mandatory"
            style={{ 
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: `${accentColor} #1a1a1a`,
              '--scrollbar-thumb': accentColor,
              '--scrollbar-track': '#1a1a1a'
            } as React.CSSProperties}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                height: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #1a1a1a;
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb {
                background: ${accentColor};
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: ${accentColor}dd;
              }
            `}</style>
            {mergedData.galleryImages.map((img, idx) => (
              <button
                key={idx}
                data-thumbnail
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryDialogIndex(idx);
                }}
                className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all snap-center ${
                  idx === galleryDialogIndex ? 'border-white ring-2 ring-white/50' : 'border-transparent hover:border-white/50'
                }`}
              >
                <img
                  src={img.startsWith("http") || img.startsWith("/") ? img : `/stock/gallery/${img}`}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
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
              Photo Gallery - Section Design
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
                    value={mergedData.galleryHeading ?? ""}
                    onChange={(e) => handleChange("galleryHeading", e.target.value)}
                    placeholder="Our Moments"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Our Moments",
                        "Photo Gallery",
                        "Our Memories",
                        "Captured Moments",
                        "Our Story in Photos",
                        "Wedding Gallery",
                        "Special Moments"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.galleryHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleChange("galleryHeading", predefinedHeadings[nextIndex]);
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
                  value={mergedData.galleryHeadingTypography || data.headingFont}
                  onChange={(value) => handleChange("galleryHeadingTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.galleryUseMainColor !== false}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>
              
              {/* Heading Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.galleryHeadingFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.galleryHeadingFontSize || 100}
                  onChange={(e) => handleChange("galleryHeadingFontSize", parseInt(e.target.value))}
                  disabled={mergedData.galleryUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.galleryHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.galleryHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Heading Color */}
              <ColorControl
                label="Heading Color"
                value={mergedData.galleryHeadingColor || data.mainColor2}
                onChange={(value) => handleChange("galleryHeadingColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.galleryUseMainColor !== false}
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
                    value={mergedData.galleryMessage ?? ""}
                    onChange={(e) => handleChange("galleryMessage", e.target.value)}
                    placeholder="A collection of our favorite moments together..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedMessages = [
                        "A collection of our favorite moments together...",
                        "These photos capture the beautiful memories we've shared. Each one tells a story of our journey.",
                        "Moments frozen in time, memories that will last forever. Here's our story in pictures.",
                        "From our first meeting to this special day, every moment has been precious. These are our memories.",
                        "A glimpse into our life together - the laughter, the love, and all the beautiful moments in between.",
                        "These photos represent the journey that brought us here and the love that keeps us together."
                      ];
                      const currentIndex = predefinedMessages.indexOf(mergedData.galleryMessage ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                      handleChange("galleryMessage", predefinedMessages[nextIndex]);
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
                  value={mergedData.galleryMessageTypography || data.bodyFont}
                  onChange={(value) => handleChange("galleryMessageTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.galleryUseMainColor !== false}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
              </div>
              
              {/* Message Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.galleryMessageFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.galleryMessageFontSize || 100}
                  onChange={(e) => handleChange("galleryMessageFontSize", parseInt(e.target.value))}
                  disabled={mergedData.galleryUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.galleryMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.galleryMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              {/* Message Color */}
              <ColorControl
                label="Message Color"
                value={mergedData.galleryMessageColor || data.neutralColor1}
                onChange={(value) => handleChange("galleryMessageColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.galleryUseMainColor !== false}
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
                  value={mergedData.galleryBackgroundType || "color"}
                  onChange={(e) => handleChange("galleryBackgroundType", e.target.value)}
                  disabled={mergedData.galleryUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.galleryBackgroundType === "image" || mergedData.galleryBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.galleryGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("galleryGradient", { ...mergedData.galleryGradient, firstColor: e.target.value })}
                            disabled={mergedData.galleryUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.galleryGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("galleryGradient", { ...mergedData.galleryGradient, firstColor: value });
                          }}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.galleryGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("galleryGradient", { ...mergedData.galleryGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.galleryGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.galleryGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.galleryGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.galleryGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("galleryGradient", { ...mergedData.galleryGradient, secondColor: e.target.value })}
                            disabled={mergedData.galleryUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.galleryGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("galleryGradient", { ...mergedData.galleryGradient, secondColor: value });
                          }}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.galleryGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("galleryGradient", { ...mergedData.galleryGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.galleryGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.galleryGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.galleryGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.galleryBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.galleryBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("galleryBackgroundColor", e.target.value)}
                        disabled={mergedData.galleryUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.galleryBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("galleryBackgroundColor", value);
                      }}
                      disabled={mergedData.galleryUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.galleryBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.galleryGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("galleryGradient", { ...mergedData.galleryGradient, firstColor: e.target.value })}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.galleryGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("galleryGradient", { ...mergedData.galleryGradient, firstColor: value });
                        }}
                        disabled={mergedData.galleryUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.galleryGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("galleryGradient", { ...mergedData.galleryGradient, secondColor: e.target.value })}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.galleryGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("galleryGradient", { ...mergedData.galleryGradient, secondColor: value });
                        }}
                        disabled={mergedData.galleryUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.galleryBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.galleryImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.galleryImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("galleryImage", { urls: newUrls });
                          }}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.galleryImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("galleryImage", { urls: newUrls });
                          }}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.galleryImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.galleryImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("galleryImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.galleryImage?.urls?.length || 1) - 1 && (mergedData.galleryImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.galleryImage?.urls || [""]), ""];
                            handleChange("galleryImage", { urls: newUrls });
                          }}
                          disabled={mergedData.galleryUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {mergedData.galleryBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.galleryVideo?.url || ""}
                      onChange={(e) => handleChange("galleryVideo", { url: e.target.value })}
                      disabled={mergedData.galleryUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("galleryVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.galleryUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.galleryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  checked={mergedData.galleryUseMainColor !== false}
                  onChange={(e) => handleChange("galleryUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("galleryUseMainColor", !(mergedData.galleryUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.galleryUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: data.accentColor,
                  }}
                >
                  {mergedData.galleryUseMainColor !== false && (
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

    {/* Photo Gallery Settings panel */}
    {showGallerySettingsPanel && (
      <>
        {/* Backdrop */}
        {!isGallerySettingsClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseGallerySettingsPanel} onWheel={handleCloseGallerySettingsPanel} />}

        {/* Sheet */}
        <div
          className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
            desktopMode 
              ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isGallerySettingsClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
              : `bottom-0 left-0 right-0 rounded-t-3xl ${isGallerySettingsClosing ? "animate-slide-down" : "animate-slide-up"}`
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
              Photo Gallery Settings
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-4">
            <div className="space-y-4">
              <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>GRID LAYOUT</label>
              
              {(() => {
                const gallerySettingsLayoutIndex = gridLayouts.findIndex(l => l.label === (mergedData.galleryGridLayout || "3x3"));
                const gallerySettingsLayout = gridLayouts[gallerySettingsLayoutIndex] || gridLayouts[5];
                return (
                  <div className="flex items-center gap-2">
                    {/* Previous Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        const prevIndex = gallerySettingsLayoutIndex > 0 ? gallerySettingsLayoutIndex - 1 : gridLayouts.length - 1;
                        handleChange("galleryGridLayout", gridLayouts[prevIndex].label);
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 border ${
                        isDarkMode 
                          ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                          : "hover:bg-gray-100 text-gray-600 border-gray-200"
                      }`}
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
                      value={gallerySettingsLayout.label}
                      onChange={(e) => handleChange("galleryGridLayout", e.target.value)}
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
                      {gridLayouts.map((layout) => (
                        <option key={layout.label} value={layout.label}>
                          {layout.label}
                        </option>
                      ))}
                    </select>

                    {/* Next Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = gallerySettingsLayoutIndex < gridLayouts.length - 1 ? gallerySettingsLayoutIndex + 1 : 0;
                        handleChange("galleryGridLayout", gridLayouts[nextIndex].label);
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 border ${
                        isDarkMode 
                          ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                          : "hover:bg-gray-100 text-gray-600 border-gray-200"
                      }`}
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
                );
              })()}
            </div>

            <div className="space-y-4">
              <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>BUTTON COLOR</label>
              
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Main Color</label>
                
                {/* Color Picker Box */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={mergedData.galleryButtonColor || data.mainColor2 || '#ffffff'}
                      onChange={(e) => handleChange("galleryButtonColor", e.target.value)}
                      className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    />
                  </div>
                  <input
                    type="text"
                    value={mergedData.galleryButtonColor || data.mainColor2 || ''}
                    onChange={(e) => {
                      let color = e.target.value.trim();
                      // Add # if not present and it's a valid hex code
                      if (color && !color.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(color)) {
                        color = '#' + color;
                      }
                      handleChange("galleryButtonColor", color);
                    }}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>

                {/* Predefined Colors */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {predefinedSectionColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleChange("galleryButtonColor", color.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90`}
                      style={{
                        backgroundColor: color.value,
                        borderColor: mergedData.galleryButtonColor === color.value ? accentColor : "transparent",
                        boxShadow: mergedData.galleryButtonColor === color.value ? `0 0 0 1px ${accentColor}` : "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Close Button - outside scrollable area */}
          <div className="px-5 pt-4 pb-4 shrink-0 border-t flex justify-end" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <button
              type="button"
              onClick={handleCloseGallerySettingsPanel}
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
