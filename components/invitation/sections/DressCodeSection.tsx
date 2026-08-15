"use client";

import { useState, useEffect, useRef } from "react";
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
import { useHeadingDrag } from "@/lib/hooks/useHeadingDrag";

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
  accentImages?: { variant: string; label: string; image: DressCodeImage }[];
}

const DRESS_CODE_IMAGE_SETS: Record<string, DressCodeImageSet> = {
  set0: {
    name: "Suit & Gown",
    images: [
      { id: "set0-o", filename: "dcode0-o.png", clickable: true },
      { id: "set0-w", filename: "dcode0-w.png", clickable: false },
      { id: "set0-m", filename: "dcode0-m.png", clickable: false },
      { id: "set0-d", filename: "dcode0-d.png", clickable: false },
    ],
    tintableImages: ["set0-m", "set0-w"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set0-a1", filename: "dcode0-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set0-a2", filename: "dcode0-a2.png", clickable: false } },
    ],
  },
  visitors: {
    name: "Traditional Formal (Pair of 2)",
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
    name: "Tuxedo & Dress A",
    images: [
      { id: "set2-o", filename: "dcode2-o.png", clickable: true },
      { id: "set2-w", filename: "dcode2-w.png", clickable: false },
      { id: "set2-m", filename: "dcode2-m.png", clickable: false },
      { id: "set2-d", filename: "dcode2-d.png", clickable: false },
    ],
    tintableImages: ["set2-m", "set2-w"],
  },
  set3: {
    name: "Suit & Dress A",
    images: [
      { id: "set3-o", filename: "dcode3-o.png", clickable: true },
      { id: "set3-w", filename: "dcode3-w.png", clickable: false },
      { id: "set3-m", filename: "dcode3-m.png", clickable: false },
      { id: "set3-d", filename: "dcode3-d.png", clickable: false },
    ],
    tintableImages: ["set3-m", "set3-w"],
  },
  set4: {
    name: "Suit & Dress B",
    images: [
      { id: "set4-o", filename: "dcode4-o.png", clickable: true },
      { id: "set4-w", filename: "dcode4-w.png", clickable: false },
      { id: "set4-m", filename: "dcode4-m.png", clickable: false },
      { id: "set4-d", filename: "dcode4-d.png", clickable: false },
    ],
    tintableImages: ["set4-m", "set4-w"],
  },
  set5: {
    name: "Tuxedo & Dress B",
    images: [
      { id: "set5-o", filename: "dcode5-o.png", clickable: true },
      { id: "set5-w", filename: "dcode5-w.png", clickable: false },
      { id: "set5-m", filename: "dcode5-m.png", clickable: false },
      { id: "set5-d", filename: "dcode5-d.png", clickable: false },
    ],
    tintableImages: ["set5-m", "set5-w"],
  },
  set6: {
    name: "Barong & Dress",
    images: [
      { id: "set6-o", filename: "dcode6-o.png", clickable: true },
      { id: "set6-w", filename: "dcode6-w.png", clickable: false },
      { id: "set6-m", filename: "dcode6-m.png", clickable: false },
      { id: "set6-d", filename: "dcode6-d.png", clickable: false },
    ],
    tintableImages: ["set6-m", "set6-w"],
  },
  set7: {
    name: "Shirt & Dress",
    images: [
      { id: "set7-o", filename: "dcode7-o.png", clickable: true },
      { id: "set7-w", filename: "dcode7-w.png", clickable: false },
      { id: "set7-m", filename: "dcode7-m.png", clickable: false },
      { id: "set7-d", filename: "dcode7-d.png", clickable: false },
    ],
    tintableImages: ["set7-m", "set7-w"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set7-a1", filename: "dcode7-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set7-a2", filename: "dcode7-a2.png", clickable: false } },
    ],
  },
  set8: {
    name: "Shirt Dress & Barong (Pair of 2)",
    images: [
      { id: "set8-o", filename: "dcode8-o.png", clickable: true },
      { id: "set8-w2", filename: "dcode8-w2.png", clickable: false },
      { id: "set8-w1", filename: "dcode8-w1.png", clickable: false },
      { id: "set8-m2", filename: "dcode8-m2.png", clickable: false },
      { id: "set8-m1", filename: "dcode8-m1.png", clickable: false },
      { id: "set8-d", filename: "dcode8-d.png", clickable: false },
    ],
    tintableImages: ["set8-m1", "set8-w1", "set8-m2", "set8-w2"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set8-a1", filename: "dcode8-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set8-a2", filename: "dcode8-a2.png", clickable: false } },
    ],
  },
  set9: {
    name: "Shirt & Dress (Pair of 2)",
    images: [
      { id: "set9-o", filename: "dcode9-o.png", clickable: true },
      { id: "set9-w2", filename: "dcode9-w2.png", clickable: false },
      { id: "set9-w1", filename: "dcode9-w1.png", clickable: false },
      { id: "set9-m2", filename: "dcode9-m2.png", clickable: false },
      { id: "set9-m1", filename: "dcode9-m1.png", clickable: false },
      { id: "set9-d", filename: "dcode9-d.png", clickable: false },
    ],
    tintableImages: ["set9-m1", "set9-w1", "set9-m2", "set9-w2"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set9-a1", filename: "dcode9-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set9-a2", filename: "dcode9-a2.png", clickable: false } },
      { variant: "a3", label: "Bow Tie & Neck Tie", image: { id: "set9-a3", filename: "dcode9-a3.png", clickable: false } },
    ],
  },
  set10: {
    name: "Suit & Long Dress A",
    images: [
      { id: "set10-o", filename: "dcode10-o.png", clickable: true },
      { id: "set10-w", filename: "dcode10-w.png", clickable: false },
      { id: "set10-m", filename: "dcode10-m.png", clickable: false },
      { id: "set10-d", filename: "dcode10-d.png", clickable: false },
    ],
    tintableImages: ["set10-m", "set10-w"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set10-a1", filename: "dcode10-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set10-a2", filename: "dcode10-a2.png", clickable: false } },
    ],
  },
  set11: {
    name: "Suit & Long Dress B",
    images: [
      { id: "set11-o", filename: "dcode11-o.png", clickable: true },
      { id: "set11-w", filename: "dcode11-w.png", clickable: false },
      { id: "set11-m", filename: "dcode11-m.png", clickable: false },
      { id: "set11-d", filename: "dcode11-d.png", clickable: false },
    ],
    tintableImages: ["set11-m", "set11-w"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set11-a1", filename: "dcode11-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set11-a2", filename: "dcode11-a2.png", clickable: false } },
    ],
  },
  set12: {
    name: "Suit & Long Dress (Pair of 2)",
    images: [
      { id: "set12-o", filename: "dcode12-o.png", clickable: true },
      { id: "set12-w2", filename: "dcode12-w2.png", clickable: false },
      { id: "set12-w1", filename: "dcode12-w1.png", clickable: false },
      { id: "set12-m2", filename: "dcode12-m2.png", clickable: false },
      { id: "set12-m1", filename: "dcode12-m1.png", clickable: false },
      { id: "set12-d", filename: "dcode12-d.png", clickable: false },
    ],
    tintableImages: ["set12-m1", "set12-w1", "set12-m2", "set12-w2"],
    accentImages: [
      { variant: "a1", label: "Neck Tie", image: { id: "set12-a1", filename: "dcode12-a1.png", clickable: false } },
      { variant: "a2", label: "Bow Tie", image: { id: "set12-a2", filename: "dcode12-a2.png", clickable: false } },
      { variant: "a3", label: "Bow Tie & Neck Tie", image: { id: "set12-a3", filename: "dcode12-a3.png", clickable: false } },
    ],
  },
};

// Ordered dress code sets by category for dropdown
const DRESS_CODE_SETS_ORDERED: Array<{ key: string; isDivider?: boolean }> = [
  { key: "set0" },
  { key: "divider1", isDivider: true },
  { key: "set6" },
  { key: "divider2", isDivider: true },
  { key: "set7" },
  { key: "divider3", isDivider: true },
  { key: "set3" },
  { key: "set4" },
  { key: "set10" },
  { key: "set11" },
  { key: "set2" },
  { key: "set5" },
  { key: "divider4", isDivider: true },
  { key: "set8" },
  { key: "set9" },
  { key: "set12" },
  { key: "visitors" },
];

export default function DressCodeSection({ data, desktopMode = false, panelPosition = "left", onChange, editMode = false }: DressCodeSectionProps) {
  if (!data.sections.dresscode) return null;

  const { isDarkMode, accentColor } = useTheme();
  let categories = data.dressCodeCategories || [];

  // Ensure Bride & Groom is always the first category
  if (categories.length === 0) {
    categories = [{ label: "Bride & Groom", imageSet: "set0", colors: {}, accentVariant: "", accentColor: "" }];
  } else if (categories[0].label !== "Bride & Groom") {
    categories = [{ label: "Bride & Groom", imageSet: "set0", colors: {}, accentVariant: "", accentColor: "" }, ...categories];
  }

  const [selectedImage, setSelectedImage] = useState<{ categoryIndex: number; imageId: string } | null>(null);
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [selectedImageSet, setSelectedImageSet] = useState<string>("set0");
  const [selectedAccentVariant, setSelectedAccentVariant] = useState<string>("");
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
  const [activeTipCategory, setActiveTipCategory] = useState<number | null>(null);
  const tipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const [gridVisible, setGridVisible] = useState(false);
  const gridSectionRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Auto-show slideshow if dresscodeShowGrid is false and there are categories
    if (!(data.dresscodeShowGrid ?? true) && categories.length > 0 && !showSlideshow) {
      setShowSlideshow(true);
    }
  }, [data.dresscodeShowGrid, categories.length, showSlideshow]);

  useEffect(() => {
    if (showSlideshow) return;
    const el = gridSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setGridVisible(entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [showSlideshow]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && showSlideshow) {
          setShowSlideshow(false);
          setSelectedImage(null);
        }
      });
    }, { threshold: 0.01 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [showSlideshow]);

  const centerGridScroll = () => {
    const el = gridScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: (el.scrollWidth - el.clientWidth) / 2, behavior: 'smooth' });
  };

  useEffect(() => {
    if (showSlideshow) return;
    const el = gridScrollRef.current;
    if (!el) return;
    // Center immediately (in case images are cached)
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    // Re-center after images load
    const imgs = el.querySelectorAll('img');
    let loadedCount = 0;
    const onImgLoad = () => {
      loadedCount++;
      if (loadedCount >= imgs.length) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      }
    };
    imgs.forEach(img => {
      if (img.complete) onImgLoad();
      else {
        img.addEventListener('load', onImgLoad);
        img.addEventListener('error', onImgLoad);
      }
    });
    // Fallback: center after a short delay
    const timeout = setTimeout(() => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }, 300);
    return () => clearTimeout(timeout);
  }, [showSlideshow]);

  useEffect(() => {
    const el = gridScrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [showSlideshow]);

  const showTipWithAutoHide = (categoryIndex: number) => {
    if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
    setActiveTipCategory(categoryIndex);
    tipTimeoutRef.current = setTimeout(() => {
      setActiveTipCategory(null);
      tipTimeoutRef.current = null;
    }, 2500);
  };

  // Swipe state for category page navigation
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0 && currentPage > 0) {
        handlePageChange(currentPage - 1);
      } else if (deltaX < 0 && currentPage < totalPages - 1) {
        handlePageChange(currentPage + 1);
      }
    }
  };

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
    showTipWithAutoHide(newPage);
  };

  const handleImageSetChange = (newImageSet: string) => {
    setSelectedImageSet(newImageSet);
    const newImageSetData = DRESS_CODE_IMAGE_SETS[newImageSet];
    // Default to a1 (Neck Tie) when switching to a set with accent images, otherwise clear
    const defaultAccent = newImageSetData.accentImages ? "a1" : "";
    setSelectedAccentVariant(defaultAccent);
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
      
      // Also preserve accent color if the new set has accent images
      const newAccentColor = imageSet.accentImages ? ((newCategories[categoryIndex] as any).accentColor || "") : "";
      
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        imageSet: newImageSet,
        colors: filteredColors,
        accentVariant: imageSet.accentImages ? defaultAccent : undefined,
        accentColor: imageSet.accentImages ? newAccentColor : undefined,
      };
      onChange("dressCodeCategories", newCategories as unknown as string);
      
      // Update selected colors to match filtered colors
      const newSelectedColors: Record<string, string> = {};
      imageSet.tintableImages.forEach(imgId => {
        const colorKey = `${categoryIndex}-${imgId}`;
        newSelectedColors[colorKey] = filteredColors[imgId] || "";
      });
      // Also load accent color into selected colors
      if (imageSet.accentImages) {
        const accentPrefix = newImageSet; // e.g. "set7" or "set8"
        const accentImgId = `${accentPrefix}-${defaultAccent}`;
        newSelectedColors[`${categoryIndex}-${accentImgId}`] = newAccentColor || "";
      }
      setSelectedColors(newSelectedColors);
      setInitialColors(newSelectedColors);
    }
  };

  const handleImageClick = (categoryIndex: number, imageId: string) => {
    const category = categories[categoryIndex];
    const imgSetKey = (category as any).imageSet || "set0";
    setSelectedImageSet(imgSetKey);
    const accentVariant = (category as any).accentVariant || "";
    setSelectedAccentVariant(accentVariant);
    setSelectedImage({ categoryIndex, imageId });
    
    // Scroll to dress code section when image is clicked
    const element = document.getElementById('dresscode-cssid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Store initial colors for unsaved changes detection
    const initialColorState: Record<string, string> = {};
    const imageSet = DRESS_CODE_IMAGE_SETS[imgSetKey];
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
    // Also load accent color
    if (imageSet.accentImages) {
      const accentPrefix = imgSetKey; // e.g. "set7" or "set8"
      const accentImgId = `${accentPrefix}-${accentVariant}`;
      initialColorState[`${categoryIndex}-${accentImgId}`] = (category as any).accentColor || "";
    }
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

  const predefinedMessages = [
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

  const cycleMessage = () => {
    const currentIndex = predefinedMessages.indexOf(mergedData.dresscodeBody ?? "");
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % predefinedMessages.length;
    handleChange("dresscodeBody", predefinedMessages[nextIndex]);
  };

  const headingDrag = useHeadingDrag({
    editMode,
    desktopMode,
    getSize: () => desktopMode ? (mergedData.dresscodeTitlesFontSizeMobile ?? mergedData.dresscodeTitlesFontSize ?? 100) : (mergedData.dresscodeTitlesFontSize ?? 100),
    onSizeChange: (size, isDesktop) => onChange?.(isDesktop ? 'dresscodeTitlesFontSizeMobile' : 'dresscodeTitlesFontSize', size),
    arrowClassPrefix: 'dresscode',
  });

  const messageDrag = useHeadingDrag({
    editMode,
    desktopMode,
    getSize: () => desktopMode ? (mergedData.dresscodeBodyFontSizeMobile ?? mergedData.dresscodeBodyFontSize ?? 100) : (mergedData.dresscodeBodyFontSize ?? 100),
    onSizeChange: (size, isDesktop) => onChange?.(isDesktop ? 'dresscodeBodyFontSizeMobile' : 'dresscodeBodyFontSize', size),
    arrowClassPrefix: 'dresscode-msg',
  });

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
      
      const update: any = {
        imageSet: selectedImageSet,
        colors: colorsObject,
      };
      
      // Save accent variant and accent color if the set has accent images and a variant is selected
      if (imageSet.accentImages && selectedAccentVariant) {
        update.accentVariant = selectedAccentVariant;
        const accentPrefix = selectedImageSet; // e.g. "set7" or "set8"
        const accentImgId = `${accentPrefix}-${selectedAccentVariant}`;
        update.accentColor = selectedColors[`${categoryIndex}-${accentImgId}`] || "";
      }
      
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        ...update,
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
    <style>{`
      @keyframes dc-grid-slide-fade {
        from {
          opacity: 0;
          transform: translateY(-12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .dc-grid-scroll::-webkit-scrollbar {
        display: none;
      }
    `}</style>
    <section
      ref={sectionRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="pt-0 pb-8 px-8 max-[440px]:px-4 text-center min-h-[200px] relative" style={{
      backgroundColor: mergedData.dresscodeUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.dresscodeBackgroundType === "gradient"
          ? undefined
          : mergedData.dresscodeBackgroundType === "image"
            ? undefined
            : mergedData.dresscodeBackgroundType === "video"
              ? undefined
              : (mergedData.dresscodeBackgroundColor || "transparent"),
      backgroundImage: mergedData.dresscodeUseMainColor !== false
        ? undefined
        : mergedData.dresscodeBackgroundType === "gradient" && mergedData.dresscodeGradient
          ? `linear-gradient(135deg, ${mergedData.dresscodeGradient.firstColor || "#ffffff"}, ${mergedData.dresscodeGradient.secondColor || "#ffffff"})`
          : undefined,
      ...(mergedData.dresscodeBackgroundType === "image" && mergedData.dresscodeImage?.urls && mergedData.dresscodeImage.urls.length > 0 ? {
        backgroundImage: `url(${mergedData.dresscodeImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      } : {}),
      transition: 'background 1s ease-in-out'
    }}>
    {/* Gradient Overlay - positioned behind content */}
    {(mergedData.dresscodeBackgroundType === "image" || mergedData.dresscodeBackgroundType === "video") && mergedData.dresscodeGradient && (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `linear-gradient(135deg, ${hexToRgba(mergedData.dresscodeGradient.firstColor || "#ffffff", (mergedData.dresscodeGradient.firstOpacity !== undefined ? mergedData.dresscodeGradient.firstOpacity : 50) / 100)}, ${hexToRgba(mergedData.dresscodeGradient.secondColor || "#ffffff", (mergedData.dresscodeGradient.secondOpacity !== undefined ? mergedData.dresscodeGradient.secondOpacity : 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      </div>
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
      baseHeight={desktopMode ? 150 : 100}
      horizontalMargin={desktopMode ? 80 : 48}
      customImageUrl1={dresscodeUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.dresscodeDividerCustomImageUrl1 || "/assets/divdr-1.png")}
      customImageUrl2={dresscodeUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.dresscodeDividerCustomImageUrl2 || "/assets/divdr-2.png")}
      customImageUrl3={dresscodeUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.dresscodeDividerCustomImageUrl3 || "/assets/divdr-3.png")}
      colorBlend={dresscodeUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.dresscodeDividerColorBlend ?? false)}
      predefinedImages={(dresscodeUseDefaultDivider ? data.universalDivider : data.dresscodeDivider) === "divider-1" ? predefinedDividerImagesCentered : (dresscodeUseDefaultDivider ? data.universalDivider : data.dresscodeDivider) === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
      onImageCycle={editMode ? (newImageUrl: string) => {
        const currentType = dresscodeUseDefaultDivider ? (data.universalDivider || "divider-1") : (data.dresscodeDivider || "divider-1");
        if (dresscodeUseDefaultDivider) {
          onChange?.("dresscodeDividerUseDefault", false);
          onChange?.("dresscodeDivider", currentType);
        }
        if (currentType === "divider-1") {
          onChange?.("dresscodeDividerCustomImageUrl1", newImageUrl);
        } else if (currentType === "divider-2") {
          onChange?.("dresscodeDividerCustomImageUrl2", newImageUrl);
        } else {
          onChange?.("dresscodeDividerCustomImageUrl3", newImageUrl);
        }
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
    {/* Deep-link anchor — sits above the section content so scroll lands cleanly */}
    <div id="dresscode-anchor" style={{ scrollMarginTop: '20px' }} />
      {headingDrag.renderArrowStyles()}
      {headingDrag.renderDragToast()}
      <h2
        className="text-2xl text-center font-bold uppercase mb-1 max-[400px]:mb-1 max-[768px]:mb-0.5 md:mb-2 max-[320px]:scale-[0.4] scale-[0.55] md:scale-100 max-[400px]:scale-100"
        style={{
          color: mergedData.dresscodeUseMainColor !== false ? data.mainColor2 : (mergedData.dresscodeHeadingColor || data.mainColor2),
          fontFamily: mergedData.dresscodeUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.dresscodeTitlesTypography || data.headingFont, "heading"),
          fontSize: `${headingDrag.effectiveSize * 3}%`,
          lineHeight: '1.2',
          position: 'relative',
          touchAction: editMode ? 'pan-y' : 'auto',
          WebkitTouchCallout: 'none',
        } as React.CSSProperties}
        {...headingDrag.headingDragProps}
      >
        {headingDrag.dragging && headingDrag.renderArrowOverlay()}
        <span
          className={editMode ? "cursor-pointer select-none" : ""}
          onClick={editMode ? (e) => {
            if (headingDrag.clickGuard(e)) return;
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
      {messageDrag.renderArrowStyles()}
      {messageDrag.renderDragToast()}
      <div
        className="text-sm mb-6 leading-relaxed scale-[0.7] md:scale-100 max-[400px]:scale-100 select-none"
        style={{ 
          color: mergedData.dresscodeUseMainColor !== false ? data.neutralColor1 : (mergedData.dresscodeBodyColor || data.neutralColor1), 
          fontFamily: mergedData.dresscodeUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.dresscodeBodyTypography || data.bodyFont, "body"),
          fontSize: `${messageDrag.effectiveSize}%`,
          position: 'relative',
          touchAction: editMode ? 'pan-y' : 'auto',
          WebkitTouchCallout: 'none',
        } as React.CSSProperties}
        {...messageDrag.headingDragProps}
      >
        {messageDrag.dragging && messageDrag.renderArrowOverlay()}
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? (e) => {
            if (messageDrag.clickGuard(e)) return;
            cycleMessage();
          } : undefined}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: (mergedData.dresscodeBody || "We look forward to seeing everyone dressed in their finest!<br>Details below:").replace(/\n/g, "<br>")
            }}
          />
        </span>
      </div>

      {/* Dress Code Grid View (shown when showSlideshow is false and dresscodeShowGrid is true) */}
      {!showSlideshow && (mergedData.dresscodeShowGrid ?? true) && (
        <div ref={gridSectionRef}>
        <div ref={gridScrollRef} className="dc-grid-scroll mt-8 w-full overflow-x-auto" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', textAlign: 'center' }}>
          <div className="inline-block w-max" style={{ margin: '0 auto' }}>
            <div className="flex flex-row items-end">
            {(() => {
              const GRID_LABELS_LEFT = ["Bride & Groom", "Guests", "Immediate Family", "Usher and Usherettes", "Entourage"];
              const GRID_LABELS_RIGHT = ["Bride & Groom", "Entourage", "Usher and Usherettes", "Immediate Family", "Guests"];

              // Filter grid labels to only show categories that exist
              const existingCategories = categories.map((cat, idx) => {
                if (idx === 0) return "Bride & Groom";
                return cat.label === "Custom Category" ? (cat as any).customLabel : cat.label;
              });

              const filterGridLabels = (labels: string[]): string[] => {
                return labels.filter(label => existingCategories.includes(label));
              };

              const GRID_LABELS_LEFT_FILTERED = filterGridLabels(GRID_LABELS_LEFT);
              const GRID_LABELS_RIGHT_FILTERED = filterGridLabels(GRID_LABELS_RIGHT);

              const findCategoryIndex = (label: string): number => {
                if (label === "Bride & Groom") return 0;
                // Search in categories array (starting from index 1 since 0 is Bride & Groom)
                for (let i = 1; i < categories.length; i++) {
                  const cat = categories[i];
                  if (cat.label === label || (cat.label === "Custom Category" && (cat as any).customLabel === label)) {
                    return i;
                  }
                }
                return -1;
              };

              const getOutlineFilename = (catIndex: number): string | null => {
                const category = categories[catIndex];
                if (!category) return null;
                const imageSetKey = (category as any).imageSet || "set0";
                const imageSet = DRESS_CODE_IMAGE_SETS[imageSetKey];
                if (!imageSet) return null;
                const outlineImage = imageSet.images.find(img => img.clickable);
                return outlineImage ? outlineImage.filename : null;
              };

              const renderGridCell = (label: string, flipped: boolean, keySuffix: string, animationDelay: number) => {
                const catIndex = findCategoryIndex(label);
                if (catIndex === -1 || catIndex >= categories.length) return <div key={`${label}-${keySuffix}`} className="flex-shrink-0 w-[60px] md:w-[100px]" />;
                const category = categories[catIndex];
                const imageSetKey = (category as any).imageSet || "set0";
                const imageSet = DRESS_CODE_IMAGE_SETS[imageSetKey];
                if (!imageSet) return <div key={`${label}-${keySuffix}`} className="flex-shrink-0 w-[60px] md:w-[100px]" />;
                const categoryColors = (category as any).colors;
                const accentVariant = (category as any).accentVariant || "";
                const accentColor = (category as any).accentColor || "";
                const accentData = imageSet.accentImages?.find(a => a.variant === accentVariant);

                return (
                  <div
                    key={`${label}-${keySuffix}`}
                    className={`flex-shrink-0 ${editMode ? "cursor-pointer" : "cursor-pointer"}`}
                    style={{
                      animationName: gridVisible ? 'dc-grid-slide-fade' : 'none',
                      animationDuration: '0.5s',
                      animationTimingFunction: 'ease-out',
                      animationFillMode: 'both',
                      animationDelay: `${animationDelay}s`,
                      opacity: gridVisible ? undefined : 0,
                    }}
                    onClick={() => {
                      if (categories.length > 0) {
                        setCurrentPage(catIndex);
                        setShowSlideshow(true);
                        const outlineImage = imageSet.images.find(img => img.clickable);
                        if (editMode && outlineImage) {
                          handleImageClick(catIndex, outlineImage.id);
                        }
                      }
                    }}
                  >
                    <div
                      className="relative h-[80px] md:h-[180px]"
                      style={{ transform: flipped ? 'scaleX(-1)' : undefined }}
                    >
                      {imageSet.images.map((image, imageIndex) => {
                        const isTintable = imageSet.tintableImages.includes(image.id);
                        let savedColor = "";
                        if (categoryColors && typeof categoryColors === 'object' && !Array.isArray(categoryColors) && isTintable) {
                          savedColor = categoryColors[image.id] || "";
                        }
                        const isFirst = imageIndex === 0;
                        return (
                          <div
                            key={image.id}
                            className={isFirst ? "relative h-full" : "absolute inset-0"}
                            style={{ zIndex: imageSet.images.length - imageIndex }}
                          >
                            <img
                              src={`/assets/dcodem/${image.filename}`}
                              alt={image.id}
                              className="h-full w-auto object-contain"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            {savedColor && (
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  backgroundColor: savedColor,
                                  WebkitMaskImage: `url(/assets/dcodem/${image.filename})`,
                                  WebkitMaskSize: "contain",
                                  WebkitMaskRepeat: "no-repeat",
                                  WebkitMaskPosition: "center",
                                  maskImage: `url(/assets/dcodem/${image.filename})`,
                                  maskSize: "contain",
                                  maskRepeat: "no-repeat",
                                  maskPosition: "center",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                      {/* Accent image */}
                      {accentData && accentData.image.filename && (
                        <div className="absolute inset-0" style={{ zIndex: 100 }}>
                          <img
                            src={`/assets/dcodem/${accentData.image.filename}`}
                            alt={accentData.image.id}
                            className="h-full w-auto object-contain"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                          {accentColor && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundColor: accentColor,
                                WebkitMaskImage: `url(/assets/dcodem/${accentData.image.filename})`,
                                WebkitMaskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                                maskImage: `url(/assets/dcodem/${accentData.image.filename})`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center",
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {GRID_LABELS_LEFT_FILTERED.map((label, i) => renderGridCell(label, true, "left", 0.6 - i * 0.1))}
                  {/* Bride & Groom center */}
                  <div className="flex-shrink-0" style={{ animationName: gridVisible ? 'dc-grid-slide-fade' : 'none', animationDuration: '0.5s', animationTimingFunction: 'ease-out', animationFillMode: 'both', animationDelay: '0s', opacity: gridVisible ? undefined : 0 }}
                    onClick={() => {
                      if (categories.length > 0) {
                        setCurrentPage(0);
                        setShowSlideshow(true);
                        if (editMode) {
                          const firstCat = categories[0];
                          const imageSetKey = (firstCat as any).imageSet || "set0";
                          const imageSet = DRESS_CODE_IMAGE_SETS[imageSetKey];
                          const outlineImage = imageSet?.images.find(img => img.clickable);
                          if (outlineImage) {
                            handleImageClick(0, outlineImage.id);
                          }
                        }
                      }
                    }}
                  >
                    <div className="relative h-[80px] md:h-[180px]">
                      {(() => {
                        const firstCat = categories[0];
                        if (!firstCat) return null;
                        const imageSetKey = (firstCat as any).imageSet || "set0";
                        const imageSet = DRESS_CODE_IMAGE_SETS[imageSetKey];
                        const categoryColors = (firstCat as any).colors || {};
                        const accentVariant = (firstCat as any).accentVariant || "";
                        const accentColor = (firstCat as any).accentColor || "";

                        return (
                          <>
                            {/* Outline */}
                            <div className="relative h-full" style={{ zIndex: 1 }}>
                              <img
                                src={`/assets/dcodem/${imageSet.images.find(img => img.clickable)?.filename || "dcode0-o.png"}`}
                                alt="Outline"
                                className="h-full w-auto object-contain"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                              />
                            </div>
                            {/* Dress */}
                            <div className="absolute inset-0" style={{ zIndex: 2 }}>
                              <img
                                src={`/assets/dcodem/${imageSet.images.find(img => img.id.includes("-d"))?.filename || "dcode0-d.png"}`}
                                alt="Dress"
                                className="h-full w-auto object-contain"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                              />
                              {typeof categoryColors === 'object' && !Array.isArray(categoryColors) && categoryColors[imageSet.images.find(img => img.id.includes("-d"))?.id || ""] && (
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    backgroundColor: categoryColors[imageSet.images.find(img => img.id.includes("-d"))?.id || ""],
                                    WebkitMaskImage: `url(/assets/dcodem/${imageSet.images.find(img => img.id.includes("-d"))?.filename || "dcode0-d.png"})`,
                                    WebkitMaskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                    maskImage: `url(/assets/dcodem/${imageSet.images.find(img => img.id.includes("-d"))?.filename || "dcode0-d.png"})`,
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                  }}
                                />
                              )}
                            </div>
                            {/* Male(s) */}
                            {imageSet.images.filter(img => img.id.includes("-m")).reverse().map((image, idx) => {
                              const colorKey = image.id;
                              const savedColor = typeof categoryColors === 'object' && !Array.isArray(categoryColors) ? categoryColors[colorKey] : "";
                              return (
                                <div key={image.id} className="absolute inset-0" style={{ zIndex: 3 + idx }}>
                                  <img
                                    src={`/assets/dcodem/${image.filename}`}
                                    alt={image.id}
                                    className="h-full w-auto object-contain"
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                  />
                                  {savedColor && (
                                    <div
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        backgroundColor: savedColor,
                                        WebkitMaskImage: `url(/assets/dcodem/${image.filename})`,
                                        WebkitMaskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskImage: `url(/assets/dcodem/${image.filename})`,
                                        maskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                            {/* Female(s) */}
                            {imageSet.images.filter(img => img.id.includes("-w")).reverse().map((image, idx) => {
                              const colorKey = image.id;
                              const savedColor = typeof categoryColors === 'object' && !Array.isArray(categoryColors) ? categoryColors[colorKey] : "";
                              return (
                                <div key={image.id} className="absolute inset-0" style={{ zIndex: 6 + idx }}>
                                  <img
                                    src={`/assets/dcodem/${image.filename}`}
                                    alt={image.id}
                                    className="h-full w-auto object-contain"
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                  />
                                  {savedColor && (
                                    <div
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        backgroundColor: savedColor,
                                        WebkitMaskImage: `url(/assets/dcodem/${image.filename})`,
                                        WebkitMaskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskImage: `url(/assets/dcodem/${image.filename})`,
                                        maskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                            {/* Accent/Tie */}
                            {imageSet.accentImages && accentVariant && (() => {
                              const accentData = imageSet.accentImages.find(a => a.variant === accentVariant);
                              if (!accentData || !accentData.image.filename) return null;
                              return (
                                <div className="absolute inset-0" style={{ zIndex: 10 }}>
                                  <img
                                    src={`/assets/dcodem/${accentData.image.filename}`}
                                    alt="Accent"
                                    className="h-full w-auto object-contain"
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                  />
                                  {accentColor && (
                                    <div
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        backgroundColor: accentColor,
                                        WebkitMaskImage: `url(/assets/dcodem/${accentData.image.filename})`,
                                        WebkitMaskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskImage: `url(/assets/dcodem/${accentData.image.filename})`,
                                        maskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {GRID_LABELS_RIGHT_FILTERED.map((label, i) => renderGridCell(label, false, "right", 0.1 + i * 0.1))}
                </>
              );
            })()}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Categories as carousel (shown when slideshow is active OR dresscodeShowGrid is false) */}
      {(showSlideshow || !(mergedData.dresscodeShowGrid ?? true)) && (
      <div className="max-w-2xl mx-auto">
        <div>
          {currentCategories.map((category, pageIndex) => {
            const categoryIndex = startIndex + pageIndex;
            const categoryLabel = categoryIndex === 0 ? "Bride & Groom" : (category as any).label || (category as any).customLabel || "";
            return (
              <div key={categoryIndex} className="pb-0 md:pb-8">
                {/* Category label */}
                <div className="text-center mb-4">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: mergedData.dresscodeUseMainColor !== false ? data.neutralColor1 : (mergedData.dresscodeHeadingColor || data.neutralColor1),
                      fontFamily: `${mergedData.bodyFont}, serif`,
                    }}
                  >
                    {categoryLabel}
                  </p>
                </div>
                {/* Image container with side arrows and bottom pagination */}
                <div className="flex flex-col items-center mt-8 relative">
                  {/* Previous button - overlay */}
                  {totalPages > 1 && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 items-center justify-center transition-all duration-300 hover:bg-white/30 ${currentPage === 0 ? "opacity-50 cursor-not-allowed" : "opacity-100 hover:scale-110"}`}
                    >
                      <img src="/assets/ico-pag-prev.png" alt="Previous" className="w-5 h-5" />
                    </button>
                  )}

                  {/* Image stack for category with image set */}
                  {((category as any).imageSet || "set0") && (
                      <div
                      key={`${categoryIndex}-${slideDirection}`}
                      className={`relative overflow-hidden w-full max-w-[650px] aspect-[29/23] max-h-[400px] mx-auto ${slideDirection === "left" ? "animate-image-slide-glow-left" : slideDirection === "right" ? "animate-image-slide-glow-right" : ""}`}
                      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
                      onMouseEnter={!editMode ? () => setActiveTipCategory(categoryIndex) : undefined}
                      onMouseLeave={!editMode ? () => setActiveTipCategory(null) : undefined}
                      onClick={!editMode ? () => {
                        if (activeTipCategory === categoryIndex) {
                          setActiveTipCategory(null);
                          if (tipTimeoutRef.current) { clearTimeout(tipTimeoutRef.current); tipTimeoutRef.current = null; }
                        } else {
                          showTipWithAutoHide(categoryIndex);
                        }
                      } : undefined}
                    >
                        {DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "set0"].images.map((image, imageIndex) => {
                          const colorKey = `${categoryIndex}-${image.id}`;
                          const selectedColor = selectedColors[colorKey];
                          const imageSet = DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "set0"];
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
                              className={`absolute inset-0 ${editMode ? "cursor-pointer" : ""}`}
                              style={{
                                zIndex: DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "set0"].images.length - imageIndex,
                              }}
                              onClick={() => editMode && image.clickable && handleImageClick(categoryIndex, image.id)}
                            >
                              <div className="relative w-full h-full">
                                <img
                                  src={`/assets/${image.filename}`}
                                  alt={image.id}
                                  className="w-full h-full object-contain"
                                  draggable={false}
                                  onContextMenu={(e) => e.preventDefault()}
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
                        {/* Accent image (for sets with accentImages, e.g. set7) */}
                        {(() => {
                          const imageSet = DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "set0"];
                          if (!imageSet.accentImages) return null;
                          const isPanelOpen = selectedImage && selectedImage.categoryIndex === categoryIndex;
                          const accentVariant = isPanelOpen ? selectedAccentVariant : ((category as any).accentVariant || "");
                          const accentData = imageSet.accentImages.find(a => a.variant === accentVariant);
                          if (!accentData || !accentData.image.filename) return null;
                          const accentImage = accentData.image;
                          const colorKey = `${categoryIndex}-${accentImage.id}`;
                          const selectedColor = selectedColors[colorKey];
                          let savedColor = selectedColor;
                          if (!selectedImage && (category as any).accentColor) {
                            savedColor = (category as any).accentColor;
                          }
                          return (
                            <div
                              key={accentImage.id}
                              className={`absolute inset-0 ${editMode ? "cursor-pointer" : ""}`}
                              style={{
                                zIndex: 100,
                              }}
                              onClick={() => editMode && handleImageClick(categoryIndex, accentImage.id)}
                            >
                              <div className="relative w-full h-full">
                                <img
                                  src={`/assets/${accentImage.filename}`}
                                  alt={accentImage.id}
                                  className="w-full h-full object-contain"
                                  draggable={false}
                                  onContextMenu={(e) => e.preventDefault()}
                                />
                                {savedColor && (
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: savedColor,
                                      WebkitMaskImage: `url(/assets/${accentImage.filename})`,
                                      WebkitMaskSize: "contain",
                                      WebkitMaskRepeat: "no-repeat",
                                      WebkitMaskPosition: "center",
                                      maskImage: `url(/assets/${accentImage.filename})`,
                                      maskSize: "contain",
                                      maskRepeat: "no-repeat",
                                      maskPosition: "center",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Next button - overlay */}
                    {totalPages > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 items-center justify-center transition-all duration-300 hover:bg-white/30 ${currentPage === totalPages - 1 ? "opacity-50 cursor-not-allowed" : "opacity-100 hover:scale-110"}`}
                      >
                        <img src="/assets/ico-pag-next.png" alt="Next" className="w-5 h-5" />
                      </button>
                    )}

                  </div>

                {/* Dot pagination below image category but before color circles */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-16 mb-10">
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
                  key={`label-${categoryIndex}-${slideDirection}`}
                  className={`text-lg font-medium text-center mt-4 mb-4 ${slideDirection === "left" ? "animate-label-slide-fade-left" : slideDirection === "right" ? "animate-label-slide-fade-right" : ""}`}
                  style={{ color: mergedData.dresscodeUseMainColor !== false ? data.mainColor2 : (mergedData.dresscodeHeadingColor || data.mainColor2), fontFamily: mergedData.dresscodeUseMainColor !== false ? `${data.headingFont}, serif` : `${mergedData.dresscodeTitlesTypography || data.headingFont}, serif` }}
                >
                  {category.label === "Custom Category" ? ((category as any).customLabel || "Custom Category") : category.label}
                </p>

                {/* Dress code tip */}
                {(category as any).tip && activeTipCategory === categoryIndex && (
                  <p
                    className="text-sm text-center mb-6 italic animate-tip-blur-glow-in"
                    style={{ color: mergedData.dresscodeUseMainColor !== false ? data.neutralColor1 : (mergedData.dresscodeBodyColor || data.neutralColor1), fontFamily: mergedData.dresscodeUseMainColor !== false ? `${data.bodyFont}, serif` : `${mergedData.dresscodeBodyTypography || data.bodyFont}, serif` }}
                  >
                    ({(category as any).tip})
                  </p>
                )}

                {/* Color circle container below image stack */}
                {((category as any).imageSet || "set0") && (category as any).colors && typeof (category as any).colors === 'object' && !Array.isArray((category as any).colors) && (
                  <div
                    className="flex justify-center gap-3 mt-2 md:mt-6 mb-16"
                    style={{
                      transform: activeTipCategory === categoryIndex ? "translateY(0)" : "translateY(-10px)",
                      transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {DRESS_CODE_IMAGE_SETS[(category as any).imageSet || "set0"].tintableImages.map(image => {
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
      )}
      <p
        className="text-center text-[10px] mt-0 opacity-60"
        style={{ fontFamily: `${mergedData.bodyFont}, serif`, color: mergedData.dresscodeUseMainColor !== false ? data.neutralColor1 : (mergedData.dresscodeHeadingColor || data.neutralColor1) }}
      >
        {(!showSlideshow && (mergedData.dresscodeShowGrid ?? true)) ? (desktopMode ? "Click anywhere to see your dress code" : "Tap anywhere to see your dress code") : ""}
      </p>
      {!showSlideshow && <div style={{ height: 50 }} />}
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
                      const currentIndex = DRESS_CODE_SETS_ORDERED.findIndex(item => !item.isDivider && item.key === selectedImageSet);
                      const nonDividerKeys = DRESS_CODE_SETS_ORDERED.filter(item => !item.isDivider).map(item => item.key);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : nonDividerKeys.length - 1;
                      handleImageSetChange(nonDividerKeys[prevIndex]);
                      setShowTypographyPanel(false);
                    }}
                    className={`p-2 rounded-lg transition-all duration-200 border ${isDarkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" : "hover:bg-gray-100 text-gray-600 border-gray-200"}`}
                    onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                  >
                    <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Custom Dropdown */}
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setShowTypographyPanel(!showTypographyPanel)}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm text-center transition-all duration-200 ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={{
                        ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
                        fontFamily: "Inter, sans-serif",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.boxShadow = `0 0 0 1px ${accentColor}`; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      {DRESS_CODE_IMAGE_SETS[selectedImageSet]?.name}
                    </button>

                    {/* Dropdown List */}
                    {showTypographyPanel && (
                      <div
                        className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto ${
                          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                        style={{ border: "1px solid " + hexToRgba(accentColor, 0.3) }}
                      >
                        {DRESS_CODE_SETS_ORDERED.map((item, index) => {
                          if (item.isDivider) {
                            return (
                              <div
                                key={`divider-${index}`}
                                className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                                style={{ margin: "4px 0" }}
                              />
                            );
                          }
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                handleImageSetChange(item.key);
                                setShowTypographyPanel(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                selectedImageSet === item.key
                                  ? isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                                  : isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                              }`}
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {DRESS_CODE_IMAGE_SETS[item.key]?.name || item.key}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Next Arrow */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = DRESS_CODE_SETS_ORDERED.findIndex(item => !item.isDivider && item.key === selectedImageSet);
                      const nonDividerKeys = DRESS_CODE_SETS_ORDERED.filter(item => !item.isDivider).map(item => item.key);
                      const nextIndex = currentIndex < nonDividerKeys.length - 1 ? currentIndex + 1 : 0;
                      handleImageSetChange(nonDividerKeys[nextIndex]);
                      setShowTypographyPanel(false);
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

              {/* Accent selector (only for sets with accentImages, e.g. set7) */}
              {DRESS_CODE_IMAGE_SETS[selectedImageSet].accentImages && selectedAccentVariant && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>TIE</label>
                  <div className="flex items-center gap-2">
                    {/* Previous Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        const accents = DRESS_CODE_IMAGE_SETS[selectedImageSet].accentImages!;
                        const allOptions = ["", ...accents.map(a => a.variant)];
                        const currentIndex = allOptions.indexOf(selectedAccentVariant || "");
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : allOptions.length - 1;
                        const newVariant = allOptions[prevIndex];
                        setSelectedAccentVariant(newVariant);
                        if (selectedImage) {
                          const accentPrefix = selectedImageSet;
                          const accentImgId = newVariant ? `${accentPrefix}-${newVariant}` : null;
                          const colorKey = accentImgId ? `${selectedImage.categoryIndex}-${accentImgId}` : null;
                          const oldAccentImgId = selectedAccentVariant ? `${accentPrefix}-${selectedAccentVariant}` : null;
                          const oldColorKey = oldAccentImgId ? `${selectedImage.categoryIndex}-${oldAccentImgId}` : null;
                          setSelectedColors(prev => {
                            const updated = { ...prev };
                            if (oldColorKey && updated[oldColorKey] && colorKey) {
                              updated[colorKey] = updated[oldColorKey];
                            }
                            return updated;
                          });
                        }
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
                      value={selectedAccentVariant}
                      onChange={(e) => {
                        const newVariant = e.target.value;
                        setSelectedAccentVariant(newVariant);
                        if (selectedImage) {
                          const accentPrefix = selectedImageSet;
                          const accentImgId = newVariant ? `${accentPrefix}-${newVariant}` : null;
                          const colorKey = accentImgId ? `${selectedImage.categoryIndex}-${accentImgId}` : null;
                          const oldAccentImgId = selectedAccentVariant ? `${accentPrefix}-${selectedAccentVariant}` : null;
                          const oldColorKey = oldAccentImgId ? `${selectedImage.categoryIndex}-${oldAccentImgId}` : null;
                          setSelectedColors(prev => {
                            const updated = { ...prev };
                            if (oldColorKey && updated[oldColorKey] && colorKey) {
                              updated[colorKey] = updated[oldColorKey];
                            }
                            return updated;
                          });
                        }
                      }}
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
                      <option value="">No Tie</option>
                      {DRESS_CODE_IMAGE_SETS[selectedImageSet].accentImages!.map(acc => (
                        <option key={acc.variant} value={acc.variant}>{acc.label}</option>
                      ))}
                    </select>

                    {/* Next Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        const accents = DRESS_CODE_IMAGE_SETS[selectedImageSet].accentImages!;
                        const allOptions = ["", ...accents.map(a => a.variant)];
                        const currentIndex = allOptions.indexOf(selectedAccentVariant || "");
                        const nextIndex = currentIndex < allOptions.length - 1 ? currentIndex + 1 : 0;
                        const newVariant = allOptions[nextIndex];
                        setSelectedAccentVariant(newVariant);
                        if (selectedImage) {
                          const accentPrefix = selectedImageSet;
                          const accentImgId = newVariant ? `${accentPrefix}-${newVariant}` : null;
                          const colorKey = accentImgId ? `${selectedImage.categoryIndex}-${accentImgId}` : null;
                          const oldAccentImgId = selectedAccentVariant ? `${accentPrefix}-${selectedAccentVariant}` : null;
                          const oldColorKey = oldAccentImgId ? `${selectedImage.categoryIndex}-${oldAccentImgId}` : null;
                          setSelectedColors(prev => {
                            const updated = { ...prev };
                            if (oldColorKey && updated[oldColorKey] && colorKey) {
                              updated[colorKey] = updated[oldColorKey];
                            }
                            return updated;
                          });
                        }
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

                  {/* Tie Color Picker - hidden when No Tie is selected */}
                  {(() => {
                    if (selectedAccentVariant === "none") return null;
                    const accentPrefix = selectedImageSet;
                    const accentImgId = `${accentPrefix}-${selectedAccentVariant}`;
                    const colorKey = `${selectedImage.categoryIndex}-${accentImgId}`;
                    const accentColorValue = selectedColors[colorKey] || "#000000";
                    return (
                      <div className="mt-3">
                        <ColorControl
                          label="TIE COLOR"
                          value={accentColorValue}
                          onChange={(value) => handleColorSelect(accentImgId, value)}
                          isDarkMode={isDarkMode}
                          accentColor={accentColor}
                          predefinedColors={predefinedSectionColors.map(c => c.value)}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

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
                  const imageLabel = getLabel(imageId.replace("vis-", "").replace(/set\d+-/, ""));
                  
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
