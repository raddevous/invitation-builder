"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import ColorControl from "@/components/shared/ColorControl";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface DressCodeSectionProps {
  data: InvitationData;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
  onChange?: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  editMode?: boolean;
}

interface DressCodeImage {
  id: string;
  filename: string;
  clickable: boolean;
}

interface DressCodeImageSet {
  name: string;
  images: DressCodeImage[];
  tintableImages: string[];
}

const DRESS_CODE_IMAGE_SETS: Record<string, DressCodeImageSet> = {
  visitors: {
    name: "Traditional Formal",
    images: [
      { id: "vis-o", filename: "dcode-o.png", clickable: true },
      { id: "vis-w2", filename: "dcode-w2.png", clickable: false },
      { id: "vis-w1", filename: "dcode-w1.png", clickable: false },
      { id: "vis-m2", filename: "dcode-m2.png", clickable: false },
      { id: "vis-m1", filename: "dcode-m1.png", clickable: false },
      { id: "vis-d", filename: "dcode-d.png", clickable: false },
    ],
    tintableImages: ["vis-m1", "vis-w1", "vis-m2", "vis-w2"],
  },
  set2: {
    name: "Bow Tie & Dress",
    images: [
      { id: "set2-o", filename: "dcode2-o.png", clickable: true },
      { id: "set2-w", filename: "dcode2-w.png", clickable: false },
      { id: "set2-m", filename: "dcode2-m.png", clickable: false },
      { id: "set2-d", filename: "dcode2-d.png", clickable: false },
    ],
    tintableImages: ["set2-m", "set2-w"],
  },
  set3: {
    name: "Neck Tie & Dress",
    images: [
      { id: "set3-o", filename: "dcode3-o.png", clickable: true },
      { id: "set3-w", filename: "dcode3-w.png", clickable: false },
      { id: "set3-m", filename: "dcode3-m.png", clickable: false },
      { id: "set3-d", filename: "dcode3-d.png", clickable: false },
    ],
    tintableImages: ["set3-m", "set3-w"],
  },
  set4: {
    name: "Neck Tie - Dark Slacks",
    images: [
      { id: "set4-o", filename: "dcode4-o.png", clickable: true },
      { id: "set4-w", filename: "dcode4-w.png", clickable: false },
      { id: "set4-m", filename: "dcode4-m.png", clickable: false },
      { id: "set4-d", filename: "dcode4-d.png", clickable: false },
    ],
    tintableImages: ["set4-m", "set4-w"],
  },
  set5: {
    name: "Bow Tie - Dark Slacks",
    images: [
      { id: "set5-o", filename: "dcode5-o.png", clickable: true },
      { id: "set5-w", filename: "dcode5-w.png", clickable: false },
      { id: "set5-m", filename: "dcode5-m.png", clickable: false },
      { id: "set5-d", filename: "dcode5-d.png", clickable: false },
    ],
    tintableImages: ["set5-m", "set5-w"],
  },
};

export default function DressCodeSection({ data, desktopMode = false, panelPosition = "left", onChange, editMode = false }: DressCodeSectionProps) {
  if (!data.sections.dresscode) return null;

  const { isDarkMode, accentColor } = useTheme();
  const categories = data.dressCodeCategories || [];

  if (categories.length === 0) return null;

  const [selectedImage, setSelectedImage] = useState<{ categoryIndex: number; imageId: string } | null>(null);
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [selectedImageSet, setSelectedImageSet] = useState<string>("visitors");
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialColors, setInitialColors] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const itemsPerPage = 1;
  const totalPages = Math.ceil(categories.length / itemsPerPage);
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

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = categories.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage) {
      setSlideDirection("left");
    } else {
      setSlideDirection("right");
    }
    setCurrentPage(newPage);
    setTimeout(() => setSlideDirection(null), 300);
  };

  const handleImageSetChange = (newImageSet: string) => {
    setSelectedImageSet(newImageSet);
    if (selectedImage && onChange) {
      const categoryIndex = selectedImage.categoryIndex;
      const newCategories = [...categories];
      const imageSet = DRESS_CODE_IMAGE_SETS[newImageSet];
      
      // Filter colors to only include those that match the new image set's tintable images
      const categoryColors = (newCategories[categoryIndex] as any).colors || {};
      const filteredColors: Record<string, string> = {};
      
      if (typeof categoryColors === 'object' && !Array.isArray(categoryColors)) {
        imageSet.tintableImages.forEach(imgId => {
          if (categoryColors[imgId]) {
            filteredColors[imgId] = categoryColors[imgId];
          }
        });
      }
      
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        imageSet: newImageSet,
        colors: filteredColors,
      };
      onChange("dressCodeCategories", newCategories as unknown as string);
      
      // Update selected colors to match filtered colors
      const newSelectedColors: Record<string, string> = {};
      imageSet.tintableImages.forEach(imgId => {
        const colorKey = `${categoryIndex}-${imgId}`;
        newSelectedColors[colorKey] = filteredColors[imgId] || "";
      });
      setSelectedColors(newSelectedColors);
      setInitialColors(newSelectedColors);
    }
  };

  const handleImageClick = (categoryIndex: number, imageId: string) => {
    const category = categories[categoryIndex];
    setSelectedImageSet((category as any).imageSet || "visitors");
    setSelectedImage({ categoryIndex, imageId });
    
    // Scroll to dress code section when image is clicked
    const element = document.getElementById('dresscode-cssid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Store initial colors for unsaved changes detection
    const initialColorState: Record<string, string> = {};
    const imageSet = DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "visitors"];
    const categoryColors = (category as any).colors || {};
    
    imageSet.tintableImages.forEach(img => {
      const colorKey = `${categoryIndex}-${img}`;
      // Handle both object format (new) and array format (old)
      if (typeof categoryColors === 'object' && !Array.isArray(categoryColors)) {
        initialColorState[colorKey] = categoryColors[img] || "";
      } else if (Array.isArray(categoryColors)) {
        // Old array format - map by index
        const imgIndex = imageSet.tintableImages.indexOf(img);
        initialColorState[colorKey] = categoryColors[imgIndex] || "";
      } else {
        initialColorState[colorKey] = "";
      }
    });
    setInitialColors(initialColorState);
    setSelectedColors(initialColorState);
  };

  const handleColorSelect = (imageId: string, color: string) => {
    if (selectedImage) {
      setSelectedColors(prev => ({
        ...prev,
        [`${selectedImage.categoryIndex}-${imageId}`]: color
      }));
    }
  };

  const handleClosePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedImage(null);
      setIsClosing(false);
    }, 300);
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
    if (mergedData.dresscodeBackgroundType === "color" && !mergedData.dresscodeBackgroundColor) {
      handleChange("dresscodeBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.dresscodeBackgroundType === "gradient" && !mergedData.dresscodeGradient) {
      handleChange("dresscodeGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.dresscodeBackgroundType === "image" && !mergedData.dresscodeImage) {
      handleChange("dresscodeImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("dresscodeGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.dresscodeBackgroundType === "video" && !mergedData.dresscodeVideo) {
      handleChange("dresscodeVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("dresscodeGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.dresscodeBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.dresscodeBackgroundType === "image" && mergedData.dresscodeImage?.urls && mergedData.dresscodeImage.urls.length > 1) {
      const validUrls = mergedData.dresscodeImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.dresscodeBackgroundType, mergedData.dresscodeImage?.urls]);

  const handleSaveColors = (closePanel = true) => {
    if (selectedImage && onChange) {
      const categoryIndex = selectedImage.categoryIndex;
      const imageSet = DRESS_CODE_IMAGE_SETS[selectedImageSet];
      
      const newCategories = [...categories];
      
      // Update the category with the selected colors and image set
      // Store colors as an object with image IDs as keys
      const colorsObject: Record<string, string> = {};
      imageSet.tintableImages.forEach(imgId => {
        const colorKey = `${categoryIndex}-${imgId}`;
        if (selectedColors[colorKey]) {
          colorsObject[imgId] = selectedColors[colorKey];
        }
      });
      
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        imageSet: selectedImageSet,
        colors: colorsObject,
      };
      
      onChange("dressCodeCategories", newCategories as unknown as string);
      
      // Update initial colors to match saved colors
      setInitialColors({ ...selectedColors });
      
      if (closePanel) {
        handleClosePanel();
      }
    }
  };

  const dresscodeUseDefaultDivider = data.dresscodeDividerUseDefault ?? true;
  const effectivePullDown = dresscodeUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.dresscodeDividerPullDown ?? 0);
  const effectiveVerticalFlip = dresscodeUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.dresscodeDividerVerticalFlip ?? false);

  return (
    <>
    <section className="pt-0 pb-8 px-8 text-center min-h-[200px]" style={{
      backgroundColor: mergedData.dresscodeUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.dresscodeBackgroundType === "gradient"
          ? undefined
          : mergedData.dresscodeBackgroundType === "image"
            ? undefined
            : mergedData.dresscodeBackgroundType === "video"
              ? undefined
              : (mergedData.dresscodeBackgroundColor || "transparent"),
      background: mergedData.dresscodeUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.dresscodeBackgroundType === "gradient" && mergedData.dresscodeGradient
          ? `linear-gradient(135deg, ${mergedData.dresscodeGradient.firstColor || "#ffffff"}, ${mergedData.dresscodeGradient.secondColor || "#ffffff"})`
          : undefined,
      ...(mergedData.dresscodeBackgroundType === "image" && mergedData.dresscodeImage?.urls && mergedData.dresscodeImage.urls.length > 0 ? {
        backgroundImage: `url(${mergedData.dresscodeImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      } : {}),
      transition: 'background 1s ease-in-out'
    }}>
    {/* Gradient Overlay - positioned behind content */}
    {(mergedData.dresscodeBackgroundType === "image" || mergedData.dresscodeBackgroundType === "video") && mergedData.dresscodeGradient && (
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `linear-gradient(135deg, ${hexToRgba(mergedData.dresscodeGradient.firstColor || "#ffffff", (mergedData.dresscodeGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.dresscodeGradient.secondColor || "#ffffff", (mergedData.dresscodeGradient.secondOpacity || 50) / 100)})`,
        opacity: 1,
        zIndex: 1
      }} />
    )}

    {/* Background Video */}
    {mergedData.dresscodeBackgroundType === "video" && mergedData.dresscodeVideo?.url && (
      <video
        src={normalizeVideoUrl(mergedData.dresscodeVideo.url)}
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
      type={dresscodeUseDefaultDivider ? (data.universalDivider || "none") : (data.dresscodeDivider || "none")} 
      color={data.mainColor2} 
      id="dresscode-cssid" 
      offset={dresscodeUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.dresscodeDividerOffset ?? 0)}
      tintColor={dresscodeUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.dresscodeDividerTintColor || data.mainColor2)}
      tintOpacity={dresscodeUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.dresscodeDividerTintOpacity ?? 100)}
      dividerStyle={dresscodeUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.dresscodeDividerStyle || "centered-single")}
      flip={dresscodeUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.dresscodeDividerFlip ?? false)}
      spacing={dresscodeUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.dresscodeDividerSpacing ?? 0)}
      pullDown={effectivePullDown}
      verticalFlip={effectiveVerticalFlip}
      imageSize={dresscodeUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.dresscodeDividerImageSize ?? 100)}
      baseHeight={desktopMode ? 200 : 120}
      horizontalMargin={desktopMode ? 80 : 48}
      customImageUrl1={dresscodeUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.dresscodeDividerCustomImageUrl1 || "/assets/divdr-1.png")}
      customImageUrl2={dresscodeUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.dresscodeDividerCustomImageUrl2 || "/assets/divdr-2.png")}
      customImageUrl3={dresscodeUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.dresscodeDividerCustomImageUrl3 || "/assets/divdr-3.png")}
      colorBlend={dresscodeUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.dresscodeDividerColorBlend ?? false)}
      onClick={editMode ? (newType) => {
        if (dresscodeUseDefaultDivider) {
          onChange?.("dresscodeDividerUseDefault", false);
        }
        onChange?.("dresscodeDivider", newType);
      } : undefined}
      onLongPress={editMode ? () => {
        setShowDividerSettingsPanel(true);
        const element = document.getElementById('dresscode-cssid');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      } : undefined}
    />
    {showDividerSettingsPanel && (
      <DividerSettingsPanel
        title="Dress Code Divider Settings"
        isClosing={isDividerSettingsClosing}
        onClose={handleCloseDividerSettingsPanel}
        isDarkMode={isDarkMode}
        desktopMode={desktopMode}
        panelPosition={panelPosition}
        dividerType={data.dresscodeDivider && data.dresscodeDivider !== "none" ? data.dresscodeDivider : "divider-1"}
        onDividerTypeChange={(value) => onChange?.("dresscodeDivider", value)}
        tintColor={data.dresscodeDividerTintColor || data.mainColor2}
        onTintColorChange={(value) => onChange?.("dresscodeDividerTintColor", value)}
        tintOpacity={data.dresscodeDividerTintOpacity ?? 100}
        onTintOpacityChange={(value) => onChange?.("dresscodeDividerTintOpacity", value)}
        dividerStyle={data.dresscodeDividerStyle || "centered-single"}
        onDividerStyleChange={(value) => onChange?.("dresscodeDividerStyle", value)}
        flip={data.dresscodeDividerFlip ?? false}
        onFlipChange={(value) => onChange?.("dresscodeDividerFlip", value)}
        spacing={data.dresscodeDividerSpacing ?? -80}
        onSpacingChange={(value) => onChange?.("dresscodeDividerSpacing", value)}
        pullDown={data.dresscodeDividerPullDown ?? 0}
        onPullDownChange={(value) => onChange?.("dresscodeDividerPullDown", value)}
        verticalFlip={data.dresscodeDividerVerticalFlip ?? false}
        onVerticalFlipChange={(value) => onChange?.("dresscodeDividerVerticalFlip", value)}
        imageSize={data.dresscodeDividerImageSize ?? 100}
        onImageSizeChange={(value) => onChange?.("dresscodeDividerImageSize", value)}
        predefinedColors={predefinedSectionColors.map(c => c.value)}
        accentColor={accentColor}
        customImageUrl1={data.dresscodeDividerCustomImageUrl1 || "/assets/divdr-1.png"}
        onCustomImageUrl1Change={(value) => onChange?.("dresscodeDividerCustomImageUrl1", value)}
        customImageUrl2={data.dresscodeDividerCustomImageUrl2 || "/assets/divdr-2.png"}
        onCustomImageUrl2Change={(value) => onChange?.("dresscodeDividerCustomImageUrl2", value)}
        customImageUrl3={data.dresscodeDividerCustomImageUrl3 || "/assets/divdr-3.png"}
        onCustomImageUrl3Change={(value) => onChange?.("dresscodeDividerCustomImageUrl3", value)}
        predefinedDividerImages={data.dresscodeDivider === "divider-1" ? predefinedDividerImagesCentered : data.dresscodeDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
        useDefault={dresscodeUseDefaultDivider}
        onUseDefaultChange={(value) => onChange?.("dresscodeDividerUseDefault", value)}
        colorBlend={data.dresscodeDividerColorBlend ?? false}
        onColorBlendChange={(value) => onChange?.("dresscodeDividerColorBlend", value)}
      />
    )}
      <h2
        className="text-2xl text-center font-bold uppercase mb-1 md:mb-2 scale-[0.55] md:scale-100"
        style={{
          color: mergedData.dresscodeUseMainColor !== false ? data.mainColor2 : (mergedData.dresscodeHeadingColor || data.mainColor2),
          fontFamily: mergedData.dresscodeUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.dresscodeTitlesTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.dresscodeTitlesFontSize || 100) * 3}%`,
          lineHeight: '1.2'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('dresscode-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.dresscodeHeading || "Dress Code"}
        </span>
      </h2>

      {/* Body text */}
      <p
        className="text-sm mb-6 leading-relaxed scale-[0.7] md:scale-100"
        style={{ 
          color: mergedData.dresscodeUseMainColor !== false ? data.neutralColor1 : (mergedData.dresscodeBodyColor || data.neutralColor1), 
          fontFamily: mergedData.dresscodeUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.dresscodeBodyTypography || data.bodyFont, "body"),
          fontSize: `${mergedData.dresscodeBodyFontSize || 100}%`
        }}
        dangerouslySetInnerHTML={{
          __html: (mergedData.dresscodeBody || "We look forward to seeing everyone dressed in their finest!<br>Details below:").replace(/\n/g, "<br>")
        }}
      />

      {/* Categories as carousel */}
      <div className="max-w-2xl mx-auto">
        <div>
          {currentCategories.map((category, pageIndex) => {
            const categoryIndex = startIndex + pageIndex;
            return (
              <div key={categoryIndex} className="pb-0 md:pb-8">
                {/* Image container with side arrows and bottom pagination */}
                <div className="flex flex-col items-center mt-8">
                  <div className="flex items-start justify-center gap-4 w-full">
                    {/* Previous button */}
                    {totalPages > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-300 hover:bg-white/30 ${currentPage === 0 ? "opacity-50 cursor-not-allowed" : "opacity-100 hover:scale-110"}`}
                        style={{ marginTop: "60px" }}
                      >
                        <img src="/assets/ico-pag-prev.png" alt="Previous" className="w-5 h-5" />
                      </button>
                    )}

                    {/* Image stack for category with image set */}
                    {((category as any).imageSet || "visitors") && (
                      <div className={`relative transition-all duration-300 ${slideDirection === "left" ? "animate-slide-in-side-right" : slideDirection === "right" ? "animate-slide-in-side" : ""} flex-1`} style={{ width: "100%", maxWidth: "650px", height: "250px" }}>
                        {DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "visitors"].images.map((image, imageIndex) => {
                          const colorKey = `${categoryIndex}-${image.id}`;
                          const selectedColor = selectedColors[colorKey];
                          const imageSet = DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "visitors"];
                          const isTintable = imageSet.tintableImages.includes(image.id);
                          
                          // Get saved color from category data when panel is not open
                          let savedColor = selectedColor;
                          if (!selectedImage && (category as any).colors && isTintable) {
                            const categoryColors = (category as any).colors;
                            if (typeof categoryColors === 'object' && !Array.isArray(categoryColors)) {
                              savedColor = categoryColors[image.id] || "";
                            }
                          }
                          
                          return (
                            <div
                              key={image.id}
                              className={`absolute left-0 ${editMode ? "cursor-pointer" : ""}`}
                              style={{
                                top: "0",
                                zIndex: DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "visitors"].images.length - imageIndex,
                              }}
                              onClick={() => editMode && image.clickable && handleImageClick(categoryIndex, image.id)}
                            >
                              <div className="relative">
                                <img
                                  src={`/assets/${image.filename}`}
                                  alt={image.id}
                                  className="w-full h-auto"
                                />
                                {savedColor && isTintable && (
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: savedColor,
                                      WebkitMaskImage: `url(/assets/${image.filename})`,
                                      WebkitMaskSize: "contain",
                                      WebkitMaskRepeat: "no-repeat",
                                      WebkitMaskPosition: "center",
                                      maskImage: `url(/assets/${image.filename})`,
                                      maskSize: "contain",
                                      maskRepeat: "no-repeat",
                                      maskPosition: "center",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Next button */}
                    {totalPages > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-300 hover:bg-white/30 ${currentPage === totalPages - 1 ? "opacity-50 cursor-not-allowed" : "opacity-100 hover:scale-110"}`}
                        style={{ marginTop: "60px" }}
                      >
                        <img src="/assets/ico-pag-next.png" alt="Next" className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  </div>

                {/* Spacer div for mobile only */}
                <div className="md:hidden h-24"></div>

                {/* Spacer div for desktop only */}
                <div className="hidden md:block h-48"></div>

                {/* Dot pagination below image category but before color circles */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 md:mt-16 mt-8 mb-10">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${currentPage === index ? (isDarkMode ? "bg-white" : "bg-gray-800") : (isDarkMode ? "bg-gray-600" : "bg-gray-300")}`}
                      />
                    ))}
                  </div>
                )}

                {/* Category label */}
                <p
                  className="text-lg font-medium text-center mt-4 mb-2"
                  style={{ color: mergedData.dresscodeUseMainColor !== false ? data.mainColor2 : (mergedData.dresscodeHeadingColor || data.mainColor2), fontFamily: mergedData.dresscodeUseMainColor !== false ? `${data.headingFont}, serif` : `${mergedData.dresscodeTitlesTypography || data.headingFont}, serif` }}
                >
                  {category.label}
                </p>

                {/* Dress code tip */}
                {(category as any).tip && (
                  <p
                    className="text-sm text-center mb-6 italic"
                    style={{ color: mergedData.dresscodeUseMainColor !== false ? data.neutralColor1 : (mergedData.dresscodeBodyColor || data.neutralColor1), fontFamily: mergedData.dresscodeUseMainColor !== false ? `${data.bodyFont}, serif` : `${mergedData.dresscodeBodyTypography || data.bodyFont}, serif` }}
                  >
                    ({(category as any).tip})
                  </p>
                )}

                {/* Color circle container below image stack */}
                {((category as any).imageSet || "visitors") && (category as any).colors && typeof (category as any).colors === 'object' && !Array.isArray((category as any).colors) && (
                  <div className="flex justify-center gap-3 mt-0 md:mt-4 mb-16">
                    {DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "visitors"].tintableImages.map(image => {
                      const categoryColors = (category as any).colors;
                      const color = categoryColors[image];
                      if (!color) return null;
                      return (
                        <div
                          key={image}
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      );
                    })}
                  </div>
                )}

                </div>
            );
          })}
        </div>
      </div>
    </div>
    </section>

      {/* Color selection panel */}
      {selectedImage && editMode && createPortal(
        <div>
          {/* Backdrop */}
          {!isClosing && <div className="fixed inset-0 bg-transparent" style={{ zIndex: 999999 }} onMouseDown={() => handleClosePanel()} onWheel={() => handleClosePanel()} />}

          {/* Sheet */}
          <div
            className={`fixed shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
            }`}
            style={{ ...desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }, zIndex: 1000000 }}
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
                Dress Code Setting
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Image set selector */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>DRESS CODE</label>
                <div className="flex items-center gap-2">
                  {/* Previous Arrow */}
                  <button
                    type="button"
                    onClick={() => {
                      const keys = Object.keys(DRESS_CODE_IMAGE_SETS);
                      const currentIndex = keys.indexOf(selectedImageSet);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : keys.length - 1;
                      handleImageSetChange(keys[prevIndex]);
                    }}
                    className={`p-2 rounded-lg transition-all duration-200 border ${isDarkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" : "hover:bg-gray-100 text-gray-600 border-gray-200"}`}
                    onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                  >
                    <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <select
                    value={selectedImageSet}
                    onChange={(e) => handleImageSetChange(e.target.value)}
                    className={`flex-1 px-3 py-2.5 border rounded-lg text-sm appearance-none cursor-pointer text-center transition-all duration-200 ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={{
                      ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
                      fontFamily: "Inter, sans-serif",
                      backgroundImage: 'none',
                      paddingRight: '12px',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.boxShadow = `0 0 0 1px ${accentColor}`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    {Object.keys(DRESS_CODE_IMAGE_SETS).map(key => (
                      <option key={key} value={key}>{DRESS_CODE_IMAGE_SETS[key].name}</option>
                    ))}
                  </select>

                  {/* Next Arrow */}
                  <button
                    type="button"
                    onClick={() => {
                      const keys = Object.keys(DRESS_CODE_IMAGE_SETS);
                      const currentIndex = keys.indexOf(selectedImageSet);
                      const nextIndex = currentIndex < keys.length - 1 ? currentIndex + 1 : 0;
                      handleImageSetChange(keys[nextIndex]);
                    }}
                    className={`p-2 rounded-lg transition-all duration-200 border ${isDarkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" : "hover:bg-gray-100 text-gray-600 border-gray-200"}`}
                    onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                  >
                    <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Dress Code Tip */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>DRESS CODE TIP</label>
                <input
                  type="text"
                  value={(categories[selectedImage.categoryIndex] as any)?.tip || ""}
                  onChange={(e) => {
                    if (selectedImage && onChange) {
                      const newCategories = [...categories];
                      newCategories[selectedImage.categoryIndex] = {
                        ...newCategories[selectedImage.categoryIndex],
                        tip: e.target.value,
                      };
                      onChange("dressCodeCategories", newCategories as unknown as string);
                    }
                  }}
                  placeholder="e.g. Dusty Blue Suit"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 bg-gray-900 text-gray-200" : "border-gray-200 bg-white"}`}
                  style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                />
              </div>

              {/* Color selections for each tintable image */}
              {(() => {
                const imageSet = DRESS_CODE_IMAGE_SETS[selectedImageSet];
                
                return imageSet.tintableImages.map((imageId) => {
                  const colorKey = `${selectedImage.categoryIndex}-${imageId}`;
                  const selectedColor = selectedColors[colorKey];
                  
                  // Map image IDs to MALE/FEMALE labels
                  const getLabel = (id: string) => {
                    const match = id.match(/([mw])(\d?)/);
                    if (match) {
                      const gender = match[1] === 'm' ? 'MALE' : 'FEMALE';
                      const number = match[2] || '';
                      return number ? `${gender} ${number}` : gender;
                    }
                    return id.toUpperCase();
                  };
                  const imageLabel = getLabel(imageId.replace("vis-", "").replace("set2-", "").replace("set3-", "").replace("set4-", "").replace("set5-", ""));
                  
                  return (
                    <div key={imageId}>
                      <ColorControl
                        label={imageLabel}
                        value={selectedColor || "#000000"}
                        onChange={(value) => handleColorSelect(imageId, value)}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                        predefinedColors={predefinedSectionColors.map(c => c.value)}
                      />
                    </div>
                  );
                });
              })()}

              </div>

            {/* Close button - outside scrollable area */}
            <div className="px-5 py-4 border-t shrink-0 flex items-center justify-end" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <button
                type="button"
                onClick={() => handleSaveColors()}
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
        </div>,
        document.body
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
            <div className={`flex items-center justify-start px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Dress Code - Section Design
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Titles Section */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>SECTION HEADING</h4>
                
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Text</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.dresscodeHeading ?? ""}
                      onChange={(e) => handleChange("dresscodeHeading", e.target.value)}
                      placeholder="Dress Code"
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const suggestions = [
                          "Dress to Celebrate",
                          "Our Wedding Vision",
                          "Palette & Presentation",
                          "Sartorial Details",
                          "Style Guide",
                          "The Look Book",
                          "Wedding Attire",
                          "What to Wear"
                        ];
                        const currentIndex = suggestions.indexOf(mergedData.dresscodeHeading ?? "");
                        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % suggestions.length;
                        handleChange("dresscodeHeading", suggestions[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Generate heading suggestion"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE</label>
                  <HybridFontControl
                    label=""
                    value={mergedData.dresscodeTitlesTypography || data.headingFont}
                    onChange={(value) => handleChange("dresscodeTitlesTypography", value)}
                    type="heading"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.dresscodeUseMainColor !== false}
                    predefinedFonts={predefinedHeadingFonts}
                  />
                </div>
                
                {/* Titles Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Titles Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.dresscodeTitlesFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.dresscodeTitlesFontSize || 100}
                    onChange={(e) => handleChange("dresscodeTitlesFontSize", parseInt(e.target.value))}
                    disabled={mergedData.dresscodeUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.dresscodeTitlesFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.dresscodeTitlesFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Heading Color */}
                <ColorControl
                  label="Heading Color"
                  value={mergedData.dresscodeHeadingColor || data.mainColor2}
                  onChange={(value) => handleChange("dresscodeHeadingColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.dresscodeUseMainColor !== false}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

              {/* Body Section */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
                
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Text</label>
                  <div className="relative">
                    <textarea
                      value={mergedData.dresscodeBody ?? ""}
                      onChange={(e) => handleChange("dresscodeBody", e.target.value)}
                      placeholder="We look forward to seeing everyone dressed in their finest!&#10;Details below:"
                      rows={3}
                      className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const suggestions = [
                          "Dress code details can be found below.",
                          "Find our look book details below.",
                          "Friendly & Casual",
                          "Help us match the vibe below.",
                          "Kindly refer to the details below.",
                          "Kindly review our wardrobe guidelines below.",
                          "Modern & Direct",
                          "Our dress code details are below.",
                          "Please dress according to below.",
                          "Please follow the style notes below.",
                          "Please see our attire guide below.",
                          "See below for wardrobe details."
                        ];
                        const currentIndex = suggestions.indexOf(mergedData.dresscodeBody ?? "");
                        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % suggestions.length;
                        handleChange("dresscodeBody", suggestions[nextIndex]);
                      }}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      title="Generate body text suggestion"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE</label>
                  <HybridFontControl
                    label=""
                    value={mergedData.dresscodeBodyTypography || data.bodyFont}
                    onChange={(value) => handleChange("dresscodeBodyTypography", value)}
                    type="body"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.dresscodeUseMainColor !== false}
                    predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                  />
                </div>
                
                {/* Body Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE SIZE</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.dresscodeBodyFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.dresscodeBodyFontSize || 100}
                    onChange={(e) => handleChange("dresscodeBodyFontSize", parseInt(e.target.value))}
                    disabled={mergedData.dresscodeUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.dresscodeBodyFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.dresscodeBodyFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Body Color */}
                <ColorControl
                  label="Message Color"
                  value={mergedData.dresscodeBodyColor || data.neutralColor1}
                  onChange={(value) => handleChange("dresscodeBodyColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.dresscodeUseMainColor !== false}
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
                  value={mergedData.dresscodeBackgroundType || "color"}
                  onChange={(e) => handleChange("dresscodeBackgroundType", e.target.value)}
                  disabled={mergedData.dresscodeUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.dresscodeBackgroundType === "image" || mergedData.dresscodeBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.dresscodeGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, firstColor: e.target.value })}
                            disabled={mergedData.dresscodeUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.dresscodeGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, firstColor: value });
                          }}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.dresscodeGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.dresscodeGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.dresscodeGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.dresscodeGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.dresscodeGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, secondColor: e.target.value })}
                            disabled={mergedData.dresscodeUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.dresscodeGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, secondColor: value });
                          }}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.dresscodeGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.dresscodeGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.dresscodeGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.dresscodeGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.dresscodeBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.dresscodeBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("dresscodeBackgroundColor", e.target.value)}
                        disabled={mergedData.dresscodeUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.dresscodeBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("dresscodeBackgroundColor", value);
                      }}
                      disabled={mergedData.dresscodeUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.dresscodeBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.dresscodeGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, firstColor: e.target.value })}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.dresscodeGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, firstColor: value });
                        }}
                        disabled={mergedData.dresscodeUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.dresscodeGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, secondColor: e.target.value })}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.dresscodeGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("dresscodeGradient", { ...mergedData.dresscodeGradient, secondColor: value });
                        }}
                        disabled={mergedData.dresscodeUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.dresscodeBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.dresscodeImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.dresscodeImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("dresscodeImage", { urls: newUrls });
                          }}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.dresscodeImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("dresscodeImage", { urls: newUrls });
                          }}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.dresscodeImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.dresscodeImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("dresscodeImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.dresscodeImage?.urls?.length || 1) - 1 && (mergedData.dresscodeImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.dresscodeImage?.urls || [""]), ""];
                            handleChange("dresscodeImage", { urls: newUrls });
                          }}
                          disabled={mergedData.dresscodeUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {mergedData.dresscodeBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.dresscodeVideo?.url || ""}
                      onChange={(e) => handleChange("dresscodeVideo", { url: e.target.value })}
                      disabled={mergedData.dresscodeUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("dresscodeVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.dresscodeUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.dresscodeUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  checked={mergedData.dresscodeUseMainColor !== false}
                  onChange={(e) => handleChange("dresscodeUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("dresscodeUseMainColor", !(mergedData.dresscodeUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.dresscodeUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: accentColor
                  }}
                >
                  {mergedData.dresscodeUseMainColor !== false && (
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
