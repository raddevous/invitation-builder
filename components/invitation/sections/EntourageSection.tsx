import React, { useState, useEffect, useRef, Fragment } from 'react';
import { InvitationData } from '@/lib/types/invitation';
import FontControl from '@/components/shared/FontControl';
import HybridFontControl from '@/components/shared/HybridFontControl';
import ColorControl from '@/components/shared/ColorControl';
import Divider from './Divider';
import DividerSettingsPanel from '@/components/shared/DividerSettingsPanel';
import { usePredefinedOptions } from '@/lib/hooks/usePredefinedOptions';
import { getFontFamily } from '@/lib/utils/fonts';
import { useTheme } from '../ThemeContext';

interface EntourageSectionProps {
  data: InvitationData;
  editMode?: boolean;
  onChange?: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  printResizeScale?: number;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
  onPanelOpen?: () => void;
  onPanelClose?: () => void;
  localVisibleSections?: Record<string, boolean>;
}

const EntourageSection: React.FC<EntourageSectionProps> = ({ data, editMode = false, onChange = () => {}, printResizeScale = 100, desktopMode = false, panelPosition = "left", onPanelOpen = () => {}, onPanelClose = () => {}, localVisibleSections }) => {
  const { isDarkMode, accentColor } = useTheme();
  const entourage = data.entourage || {};
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [isSliderHeld, setIsSliderHeld] = useState(false);
  
  // Print settings state for non-builder mode
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [isPrintSettingsClosing, setIsPrintSettingsClosing] = useState(false);
  const [removeRoundCorners, setRemoveRoundCorners] = useState(false);
  
  // Additional pre-print options
  const [removeShadows, setRemoveShadows] = useState(false);
  const [removePageNumber, setRemovePageNumber] = useState(false);
  const [tempTextResize, setTempTextResize] = useState(100); // 20 to 200
  const [tempBackgroundZoom, setTempBackgroundZoom] = useState(100); // 50 to 150
  const [tempBackgroundYPosition, setTempBackgroundYPosition] = useState(100); // -50 to 150
  
  // Live preview state
  const [originalStyles, setOriginalStyles] = useState<any>(null);
  const [isLivePreviewActive, setIsLivePreviewActive] = useState(false);

  // Scroll to top text when settings panel opens
  useEffect(() => {
    if (showSettingsPanel) {
      const element = document.getElementById('entourage-top-text');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [showSettingsPanel]);

  // Store original styles when print settings panel opens
  useEffect(() => {
    if (showPrintSettings && !originalStyles) {
      setTimeout(() => {
        storeOriginalStyles();
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [showPrintSettings, originalStyles]);

  // Apply live preview when any setting changes
  useEffect(() => {
    if (originalStyles && isLivePreviewActive) {
      applyLivePreview();
    }
  }, [removeRoundCorners, removeShadows, removePageNumber, tempTextResize, tempBackgroundZoom, tempBackgroundYPosition, originalStyles, isLivePreviewActive]);

  // Start live preview when panel opens and styles are stored
  useEffect(() => {
    if (showPrintSettings && originalStyles && !isLivePreviewActive) {
      setIsLivePreviewActive(true);
      applyLivePreview();
    }
  }, [showPrintSettings, originalStyles, isLivePreviewActive]);

  // Handle browser print dialog cancellation
  useEffect(() => {
    const handleAfterPrint = () => {
      // This fires when print dialog is closed (either printed or cancelled)
      if (showPrintSettings && originalStyles) {
        // If print settings panel is still open, revert live preview
        revertLivePreview();
        // Then re-apply if panel is still open
        setTimeout(() => {
          if (showPrintSettings) {
            setIsLivePreviewActive(true);
            applyLivePreview();
          }
        }, 100);
      }
    };

    window.onafterprint = handleAfterPrint;

    return () => {
      window.onafterprint = null;
    };
  }, [showPrintSettings, originalStyles]);

  const handleEntourageClosePanel = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
    setIsClosing(true);
    setTimeout(() => {
      setShowSettingsPanel(false);
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

  // Handle nested entourage property changes
  const handleEntourageChange = (path: string, value: any) => {
    const currentEntourage = pendingChanges.entourage as any || entourage;
    const newEntourage = { ...currentEntourage };
    const keys = path.split('.');
    let current: any = newEntourage;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // If value is undefined, delete the property to restore default
    if (value === undefined) {
      delete current[keys[keys.length - 1]];
    } else {
      current[keys[keys.length - 1]] = value;
    }
    
    setPendingChanges(prev => ({ ...prev, entourage: newEntourage }));
    setHasUnsavedChanges(true);
    onChange?.("entourage", newEntourage);
  };

  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingChanges };
  
  // Create merged entourage object for nested properties
  const mergedEntourage = { ...entourage, ...(mergedData.entourage as any) };
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [tempSectionOrder, setTempSectionOrder] = useState<string[]>([]);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [page1Height, setPage1Height] = useState<number | null>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  // Calculate if there are 2 pages
  const currentOrder = entourage.sectionOrder || [
    "marriageTalkSpeaker",
    "chairman",
    "officiatingMinister",
    "witnesses",
    "bestMan",
    "maidOfHonor",
    "directorOfCeremony",
    "directorOfFeast",
    "ushers",
    "usherettes",
    "groomsmen",
    "bridesmaids",
    "jrGroomsmen",
    "jrBridesmaid",
    "flowerGirls",
    "bibleBearer",
    "ringBearer"
  ];
  // Use localVisibleSections for real-time preview, fall back to saved data
  const effectiveVisibleSections = localVisibleSections || entourage.visibleSections || {};
  
  // Auto-mark sections as visible if they have data but aren't in visibleSections
  const allSectionKeys = [
    "couple", "groomParents", "brideParents", "marriageTalkSpeaker", "officiatingMinister",
    "witnesses", "bestMan", "maidOfHonor", "directorOfCeremony", "directorOfFeast",
    "ushers", "usherettes", "groomsmen", "bridesmaids", "jrGroomsmen", "jrBridesmaid",
    "flowerGirls", "bibleBearer", "ringBearer", "chairman"
  ];
  
  const autoVisibleSections = { ...effectiveVisibleSections };
  allSectionKeys.forEach(key => {
    if ((effectiveVisibleSections as any)[key] === undefined) {
      // Check if section has data
      const sectionData = (entourage as any)[key];
      const hasData = sectionData && (
        (sectionData.name && sectionData.name.trim() !== "") ||
        (sectionData.names && sectionData.names.some((n: string) => n && n.trim() !== "")) ||
        (sectionData.groomName && sectionData.groomName.trim() !== "") ||
        (sectionData.brideName && sectionData.brideName.trim() !== "") ||
        (sectionData.fatherName && sectionData.fatherName.trim() !== "") ||
        (sectionData.motherName && sectionData.motherName.trim() !== "")
      );
      if (hasData) {
        (autoVisibleSections as any)[key] = true;
      }
    }
  });
  
  const visibleSections = entourage.sectionOrder 
    ? entourage.sectionOrder.filter(id => autoVisibleSections[id as keyof typeof autoVisibleSections] && id !== 'page2' && id !== 'page3')
    : currentOrder.filter(id => autoVisibleSections[id as keyof typeof autoVisibleSections]);
  const page2Pos = entourage.page2Position !== undefined ? entourage.page2Position : -1;
  const page3Pos = entourage.page3Position !== undefined ? entourage.page3Position : -1;
  
    
  // Split sections into 3 pages
  // Note: page2Pos and page3Pos are saved relative to reorderable sections only (excluding markers)
  // So we use them directly to slice visibleSections
  const page1Sections = page2Pos >= 0 ? visibleSections.slice(0, page2Pos) : visibleSections;
  
  // For page2Sections: if page3 exists, slice from page2Pos to page3Pos
  // Otherwise, slice from page2Pos to end
  const page2Sections = page2Pos >= 0 && page3Pos >= 0 && page3Pos > page2Pos 
    ? visibleSections.slice(page2Pos, page3Pos) 
    : page2Pos >= 0 && page3Pos < 0
    ? visibleSections.slice(page2Pos)
    : [];
  
  // For page3Sections: only create page3 if page2 exists (page2Pos >= 0)
  // If page2 doesn't exist, page3 should also not exist
  const page3Sections = page3Pos >= 0 && page2Pos >= 0 ? visibleSections.slice(page3Pos) : [];
  
  console.log('page1Sections:', page1Sections);
  console.log('page2Sections:', page2Sections);
  console.log('page3Sections:', page3Sections);
  
  const hasPage2 = page2Sections.length > 0;
  const hasPage3 = page3Sections.length > 0;

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

  // Measure page 1 height when it's visible
  useEffect(() => {
    if (currentPage === 1 && page1Ref.current) {
      setPage1Height(page1Ref.current.offsetHeight);
    }
  }, [currentPage, entourage]);

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

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.entourageBackgroundType === "color" && !mergedData.entourageBackgroundColor) {
      handleChange("entourageBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.entourageBackgroundType === "gradient" && !mergedData.entourageGradient) {
      handleChange("entourageGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.entourageBackgroundType === "image" && !mergedData.entourageImage) {
      handleChange("entourageImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("entourageGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.entourageBackgroundType === "video" && !mergedData.entourageVideo) {
      handleChange("entourageVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("entourageGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.entourageBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.entourageBackgroundType === "image" && mergedData.entourageImage?.urls && mergedData.entourageImage.urls.length > 1) {
      const validUrls = mergedData.entourageImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.entourageBackgroundType, mergedData.entourageImage?.urls]);

  const getTitle = (defaultTitle: string, customTitle?: string) => customTitle || defaultTitle;

  // Helper function to update nested entourage data
  const updateEntourageField = (path: string, value: any) => {
    const newEntourage = { ...entourage };
    const keys = path.split('.');
    let current: any = newEntourage;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // If value is undefined, delete the property to restore default
    if (value === undefined) {
      delete current[keys[keys.length - 1]];
    } else {
      current[keys[keys.length - 1]] = value;
    }
    
    // Preserve critical entourage properties when updating individual fields
    const preservedEntourage = { 
      ...newEntourage, 
      visibleSections: entourage.visibleSections || {},
      page2Position: entourage.page2Position,
      page3Position: entourage.page3Position,
      sectionOrder: entourage.sectionOrder
    };
    onChange("entourage", preservedEntourage);
  };

  const renderTitle = (defaultTitle: string, customTitle: string | undefined) => {
    return customTitle || defaultTitle;
  };

  const renderDivider = () => (
    <div className="flex items-center justify-center my-6" style={{ transform: `scale(${(mergedEntourage.titlesFontSize || 100) / 100})` }}>
      <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
    </div>
  );

  const renderPaperContainer = (children: React.ReactNode, pageNum: number = 1, totalPages: number = 1) => {
    // Calculate height based on paperHeightAdjustment slider (-5 to 5)
    // Base height is 9in, each step adjusts by 0.5in
    const baseHeight = 9;
    const adjustment = (mergedEntourage.paperHeightAdjustment || 0) * 0.5;
    const calculatedHeight = baseHeight + adjustment;
    
    const isPage1 = pageNum === 1;
    
    // Handle click: in edit mode open settings, in share link mode cycle through pages
    const handleClick = () => {
      if (editMode && !rearrangeMode && isPage1) {
        setShowSettingsPanel(true);
      } else if (!editMode && totalPages > 1) {
        // Cycle through pages: 1 → 2 → 3 → 1
        setCurrentPage((prev) => (prev % totalPages) + 1);
      }
    };
    
    return (
    <div
      id="entourage-paper-container"
      className={`rounded-lg p-8 relative mx-auto overflow-hidden flex flex-col [zoom:0.6] md:[zoom:1] ${rearrangeMode ? 'justify-start' : 'justify-center'}`}
      style={{
        cursor: editMode && !rearrangeMode && isPage1 ? "pointer" : (!editMode && totalPages > 1 ? "pointer" : undefined),
        maxWidth: "8in",
        height: rearrangeMode ? "auto" : `${calculatedHeight}in`,
        minHeight: rearrangeMode ? undefined : undefined,
        boxShadow: "0 10px 16px -3px rgba(0, 0, 0, 0.06), 0 6px 10px -3px rgba(0, 0, 0, 0.04), 0 25px 30px -6px rgba(0, 0, 0, 0.06), 0 10px 12px -4px rgba(0, 0, 0, 0.04), -10px 0 16px -3px rgba(0, 0, 0, 0.06), 10px 0 16px -3px rgba(0, 0, 0, 0.06), -6px 0 10px -3px rgba(0, 0, 0, 0.04), 6px 0 10px -3px rgba(0, 0, 0, 0.04), -10px -10px 16px -3px rgba(0, 0, 0, 0.06), 10px -10px 16px -3px rgba(0, 0, 0, 0.06)",
        ...(mergedEntourage.paperBackground && mergedEntourage.paperBackground !== "none" ? {
          backgroundImage: mergedEntourage.paperBackground === "custom"
            ? `url(${mergedEntourage.paperBackgroundCustom || ""})`
            : `url(/assets/texturebg${mergedEntourage.paperBackground.replace('texture', '')}.jpg)`,
          backgroundSize: rearrangeMode ? 'cover' : (desktopMode ? `${mergedEntourage.paperBackgroundZoom || 100}%` : 'cover'),
          backgroundPosition: rearrangeMode ? 'center' : (desktopMode ? `center ${mergedEntourage.paperBackgroundYPosition || 0}%` : 'center'),
          backgroundRepeat: "no-repeat"
        } : {})
      }}
      onClick={handleClick}
    >
      {/* Paper color overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: mergedEntourage.paperColor ? (
            (mergedEntourage.paperOpacity ?? 100) === 100 
              ? mergedEntourage.paperColor 
              : `${mergedEntourage.paperColor}${Math.round((mergedEntourage.paperOpacity ?? 100) / 100 * 255).toString(16).padStart(2, '0')}`
          ) : "#ffffff",
          mixBlendMode: mergedEntourage.paperBlendMode || "hue"
        }}
      />
      {/* Printer icon - only show in non-builder mode */}
      {!editMode && !rearrangeMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Show print settings after a short delay
            setTimeout(() => setShowPrintSettings(true), 300);
          }}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/80 hover:bg-white/90 dark:bg-gray-800/80 hover:dark:bg-gray-800/90 transition-colors shadow-md print:hidden"
          style={{ zIndex: 10 }}
          title="Print Entourage"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      )}
      
      {/* Reset/Cancel/Save buttons in rearrange mode */}
      {rearrangeMode && isPage1 && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {/* Reset List Button - always show in rearrange mode */}
          <button
            onClick={() => {
              // Create a new entourage object with all custom fields removed in a single update
              const newEntourage = { ...entourage };
              
              // Delete section order to restore default order
              delete newEntourage.sectionOrder;
              
              // Delete page2Position and page3Position to reset pages
              delete newEntourage.page2Position;
              delete newEntourage.page3Position;
              
              // Delete custom text fields
              delete newEntourage.topTextCustom;
              delete newEntourage.headerCustom;
              delete newEntourage.bottomTextCustom;
              
              // Delete all custom title fields from each section
              if (newEntourage.couple) {
                delete newEntourage.couple.titleCustom;
                delete newEntourage.couple.groomTitleCustom;
                delete newEntourage.couple.brideTitleCustom;
              }
              if (newEntourage.groomParents) {
                delete newEntourage.groomParents.titleCustom;
                delete newEntourage.groomParents.fatherTitleCustom;
                delete newEntourage.groomParents.motherTitleCustom;
              }
              if (newEntourage.brideParents) {
                delete newEntourage.brideParents.titleCustom;
                delete newEntourage.brideParents.fatherTitleCustom;
                delete newEntourage.brideParents.motherTitleCustom;
              }
              if (newEntourage.marriageTalkSpeaker) {
                delete newEntourage.marriageTalkSpeaker.titleCustom;
              }
              if (newEntourage.officiatingMinister) {
                delete newEntourage.officiatingMinister.titleCustom;
              }
              if (newEntourage.witnesses) {
                delete newEntourage.witnesses.titleCustom;
              }
              if (newEntourage.bestMan) {
                delete newEntourage.bestMan.titleCustom;
              }
              if (newEntourage.maidOfHonor) {
                delete newEntourage.maidOfHonor.titleCustom;
              }
              if (newEntourage.directorOfCeremony) {
                delete newEntourage.directorOfCeremony.titleCustom;
              }
              if (newEntourage.directorOfFeast) {
                delete newEntourage.directorOfFeast.titleCustom;
              }
              if (newEntourage.ushers) {
                delete newEntourage.ushers.titleCustom;
              }
              if (newEntourage.usherettes) {
                delete newEntourage.usherettes.titleCustom;
              }
              if (newEntourage.chairman) {
                delete newEntourage.chairman.titleCustom;
              }
              
              // Single onChange call with all changes
              onChange("entourage", newEntourage);
              setRearrangeMode(false);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="Reset List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.0 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            onClick={() => setRearrangeMode(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Cancel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => {
              // Save the full tempSectionOrder including page markers to preserve custom ordering
              const reorderableSections = tempSectionOrder.filter(id => id !== 'couple' && id !== 'groomParents' && id !== 'brideParents');
              
              // Store the position of page2 relative to reorderable sections only
              const page2IndexInTemp = tempSectionOrder.indexOf('page2');
              // Count only fixed sections that appear BEFORE the page2 marker
              const fixedSectionsBeforePage2 = tempSectionOrder.slice(0, page2IndexInTemp).filter(id => id === 'couple' || id === 'groomParents' || id === 'brideParents').length;
              const page2IndexInReorderable = page2IndexInTemp !== -1 ? page2IndexInTemp - fixedSectionsBeforePage2 : undefined;
              
              // Store the position of page3 relative to reorderable sections only
              const page3IndexInTemp = tempSectionOrder.indexOf('page3');
              // Count only fixed sections AND page2 marker that appear BEFORE the page3 marker
              const fixedSectionsBeforePage3 = tempSectionOrder.slice(0, page3IndexInTemp).filter(id => id === 'couple' || id === 'groomParents' || id === 'brideParents' || id === 'page2').length;
              const page3IndexInReorderable = page3IndexInTemp !== -1 ? page3IndexInTemp - fixedSectionsBeforePage3 : undefined;
              
              console.log('Saving - tempSectionOrder:', tempSectionOrder);
              console.log('Saving - page2IndexInTemp:', page2IndexInTemp, 'fixedSectionsBeforePage2:', fixedSectionsBeforePage2, 'page2IndexInReorderable:', page2IndexInReorderable);
              console.log('Saving - page3IndexInTemp:', page3IndexInTemp, 'fixedSectionsBeforePage3:', fixedSectionsBeforePage3, 'page3IndexInReorderable:', page3IndexInReorderable);
              console.log('Saving - reorderableSections:', reorderableSections);
              console.log('About to save - page2IndexInReorderable:', page2IndexInReorderable, 'page3IndexInReorderable:', page3IndexInReorderable);
              try {
                // Update the entourage object directly with sectionOrder (exclude page markers)
                const sectionOrderWithoutMarkers = reorderableSections.filter(id => id !== 'page2' && id !== 'page3');
                console.log('Saving - sectionOrderWithoutMarkers:', sectionOrderWithoutMarkers);
                const updatedEntourage = { 
                  ...entourage, 
                  sectionOrder: sectionOrderWithoutMarkers,
                  page2Position: page2IndexInReorderable,
                  page3Position: page3IndexInReorderable
                };
                
                // Call onChange to actually save to database
                onChange("entourage", updatedEntourage);
                console.log('Section order saved via onChange');
                
                // Close arrange mode after save
                setTimeout(() => {
                  setRearrangeMode(false);
                }, 100);
              } catch (error) {
                console.error('Save error:', error);
              }
              setRearrangeMode(false);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            title="Save"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
        </div>
      )}

      {/* Rearrange button in edit mode */}
      {editMode && !rearrangeMode && isPage1 && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRearrangeMode(true);
              // Initialize temp section order with current order if it exists, otherwise build from visible sections
              const sections: string[] = [];
              // Always include couple at the top (fixed position)
              sections.push("couple");
              // Always include parents (fixed positions)
              if (autoVisibleSections?.groomParents) sections.push("groomParents");
              if (autoVisibleSections?.brideParents) sections.push("brideParents");
              
              // Add reorderable sections from sectionOrder if it exists, otherwise from visible sections
              let reorderableSections = entourage.sectionOrder && entourage.sectionOrder.length > 0 
                ? [...entourage.sectionOrder].filter(id => id === 'page2' || id === 'page3' || autoVisibleSections?.[id as keyof typeof autoVisibleSections])
                : [
                    "marriageTalkSpeaker",
                    "chairman",
                    "officiatingMinister",
                    "witnesses",
                    "bestMan",
                    "maidOfHonor",
                    "directorOfCeremony",
                    "directorOfFeast",
                    "ushers",
                    "usherettes",
                    "groomsmen",
                    "bridesmaids",
                    "jrGroomsmen",
                    "jrBridesmaid",
                    "flowerGirls",
                    "bibleBearer",
                    "ringBearer"
                  ].filter(id => autoVisibleSections?.[id as keyof typeof autoVisibleSections]);
              
              // Add page2 and page3 markers at their saved positions
              // We need to add them in reverse order (page3 first, then page2) to maintain correct positions
              // because inserting page2 first would shift page3's position
              
              // First, add page3 at its saved position (adjusted for page2 not being there yet)
              if (entourage.page3Position !== undefined && entourage.page3Position >= 0 && entourage.page3Position <= reorderableSections.length) {
                // page3Position is relative to reorderable sections, so we can insert directly
                reorderableSections.splice(entourage.page3Position, 0, 'page3');
              } else if (!reorderableSections.includes('page3')) {
                // Insert page3 at the end by default
                reorderableSections.push('page3');
              }
              
              // Then, add page2 at its saved position
              if (entourage.page2Position !== undefined && entourage.page2Position >= 0 && entourage.page2Position <= reorderableSections.length) {
                // page2Position is relative to reorderable sections, but page3 is now in the array
                // If page2Position >= page3Position, we need to adjust by 1
                const adjustedPage2Pos = (entourage.page3Position !== undefined && entourage.page2Position >= entourage.page3Position)
                  ? entourage.page2Position + 1
                  : entourage.page2Position;
                reorderableSections.splice(adjustedPage2Pos, 0, 'page2');
              } else if (!reorderableSections.includes('page2')) {
                // Insert page2 second-to-last (before page3 if page3 exists)
                const page3Index = reorderableSections.indexOf('page3');
                if (page3Index !== -1) {
                  reorderableSections.splice(page3Index, 0, 'page2');
                } else {
                  reorderableSections.push('page2');
                }
              }
              
              sections.push(...reorderableSections);
              setTempSectionOrder(sections);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Rearrange Sections"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}

      <div 
        id="entourage-content-wrapper"
        style={{ 
          transform: `scale(${printResizeScale / 100}) scale(${tempTextResize / 100})`, 
          transformOrigin: "center center" 
        }}
      >
        {children}
        {/* Page number at bottom - only show if there are 2 pages and not in rearrange mode */}
        {totalPages > 1 && !rearrangeMode && (
          <div 
            className={`absolute -bottom-15 left-0 right-0 flex items-center justify-center ${removePageNumber ? 'hidden' : ''}`}
            style={{ display: removePageNumber ? 'none' : 'flex' }}
          >
            <span 
              className="text-[10px] text-gray-400 font-sans" 
              style={{ 
                fontFamily: "Inter, sans-serif"
              }}
            >
              Page {pageNum} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderDragHandle = (sectionId: string) => {
    if (!rearrangeMode) return null;
    // Show lock icon for couple (always at top) and parents (fixed position)
    if (sectionId === 'couple' || sectionId === 'groomParents' || sectionId === 'brideParents') {
      return (
        <div className="absolute -left-6 top-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      );
    }
    // Don't show drag handle for maid of honor (paired)
    if (sectionId === 'maidOfHonor') return null;
    return (
      <div 
        className={`absolute -left-6 cursor-move ${sectionId === 'bestMan' ? 'top-2' : 'top-0'}`}
        draggable
        onDragStart={(e) => {
          setDraggedSection(sectionId);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setDraggedSection(null)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>
    );
  };

  const handleDragOver = (e: React.DragEvent, targetSection: string) => {
    e.preventDefault();
    // Prevent dragging over couple (always at top) or groomParents (fixed position)
    if (targetSection === 'couple' || targetSection === 'groomParents') return;
    if (draggedSection && draggedSection !== targetSection) {
      const newOrder = [...tempSectionOrder];
      const draggedIndex = newOrder.indexOf(draggedSection);
      const targetIndex = newOrder.indexOf(targetSection);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Boundary check: Page 2 and Page 3 act as boundaries for each other
        const page2Index = newOrder.indexOf('page2');
        const page3Index = newOrder.indexOf('page3');
        
        // If dragging page2, it cannot go below page3
        if (draggedSection === 'page2' && page3Index !== -1 && targetIndex >= page3Index) {
          return; // Block the drag
        }
        
        // If dragging page3, it cannot go above page2
        if (draggedSection === 'page3' && page2Index !== -1 && targetIndex <= page2Index) {
          return; // Block the drag
        }
        
        // If dragging a regular section, prevent it from crossing page boundaries
        // Sections before page2 cannot be dragged to after page3
        if (draggedSection !== 'page2' && draggedSection !== 'page3') {
          if (page2Index !== -1 && page3Index !== -1) {
            // If dragged section is before page2, it cannot go after page3
            if (draggedIndex < page2Index && targetIndex > page3Index) {
              return; // Block the drag
            }
            // If dragged section is after page3, it cannot go before page2
            if (draggedIndex > page3Index && targetIndex < page2Index) {
              return; // Block the drag
            }
          }
        }
        
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedSection);
        setTempSectionOrder(newOrder);
      }
    }
  };

  // Section render functions for reordering
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    couple: () => (
      <>
        <div className="relative" onDragOver={(e) => handleDragOver(e, "couple")}>
          {renderDragHandle("couple")}
          <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
            {renderTitle("THE COUPLE", mergedEntourage.couple?.titleCustom)}
          </h3>
        </div>
        <div className="flex justify-between mb-6 items-center">
          <div className="text-right flex-1 pr-4 flex flex-col justify-center">
            <p className="text-sm font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.couple?.groomName || ""}</p>
            <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
              {renderTitle("GROOM", entourage.couple?.groomTitleCustom)}
            </p>
          </div>
          <div className="text-left flex-1 pl-4 flex flex-col justify-center">
            <p className="text-sm font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.couple?.brideName || ""}</p>
            <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
              {renderTitle("BRIDE", entourage.couple?.brideTitleCustom)}
            </p>
          </div>
        </div>
      </>
    ),
    groomParents: () => (autoVisibleSections?.groomParents) ? (
      <div className="text-right flex-1 pr-4 relative flex flex-col justify-center" onDragOver={(e) => handleDragOver(e, "groomParents")}>
        {renderDragHandle("groomParents")}
        <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("GROOM'S PARENTS", entourage.groomParents?.titleCustom)}
        </h3>
        <p className="text-sm font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.groomParents?.fatherName || ""}</p>
        <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.8}%`, opacity: 0.75 }}>
          {renderTitle("FATHER", entourage.groomParents?.fatherTitleCustom)}
        </p>
        <p className="text-sm mt-2 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.groomParents?.motherName || ""}</p>
        <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.8}%`, opacity: 0.75 }}>
          {renderTitle("MOTHER", entourage.groomParents?.motherTitleCustom)}
        </p>
      </div>
    ) : null,
    brideParents: () => (autoVisibleSections?.brideParents) ? (
      <div className="text-left flex-1 pl-4 relative flex flex-col justify-center" onDragOver={(e) => handleDragOver(e, "brideParents")}>
        {renderDragHandle("brideParents")}
        <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("BRIDE'S PARENTS", entourage.brideParents?.titleCustom)}
        </h3>
        <p className="text-sm font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.brideParents?.fatherName || ""}</p>
        <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.8}%`, opacity: 0.75 }}>
          {renderTitle("FATHER", entourage.brideParents?.fatherTitleCustom)}
        </p>
        <p className="text-sm mt-2 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.brideParents?.motherName || ""}</p>
        <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.8}%`, opacity: 0.75 }}>
          {renderTitle("MOTHER", entourage.brideParents?.motherTitleCustom)}
        </p>
      </div>
    ) : null,
    marriageTalkSpeaker: () => (autoVisibleSections?.marriageTalkSpeaker) ? (
      <div className="mb-6 relative" onDragOver={(e) => handleDragOver(e, "marriageTalkSpeaker")}>
        {renderDragHandle("marriageTalkSpeaker")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("MARRIAGE TALK SPEAKER", entourage.marriageTalkSpeaker?.titleCustom)}
        </h3>
        <p className="text-center">
          {renderSingleNameField(entourage.marriageTalkSpeaker?.name || "", "entourage.marriageTalkSpeaker.name")}
        </p>
      </div>
    ) : null,
    officiatingMinister: () => (autoVisibleSections?.officiatingMinister) ? (
      <div className="mb-6 relative" onDragOver={(e) => handleDragOver(e, "officiatingMinister")}>
        {renderDragHandle("officiatingMinister")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("OFFICIATING MINISTER", entourage.officiatingMinister?.titleCustom)}
        </h3>
        <p className="text-center">
          {renderSingleNameField(entourage.officiatingMinister?.name || "", "entourage.officiatingMinister.name")}
        </p>
      </div>
    ) : null,
    witnesses: () => (autoVisibleSections?.witnesses) ? (
      <div className="mb-6 relative" onDragOver={(e) => handleDragOver(e, "witnesses")}>
        {renderDragHandle("witnesses")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("WITNESSES", entourage.witnesses?.titleCustom)}
        </h3>
        <div className="flex justify-between">
          <div className="text-right flex-1 pr-4">
            {(entourage.witnesses?.names || ["", ""]).filter((_: string, i: number) => i % 2 === 0).map((name: string, i: number) => (
              <div key={i * 2} className="mb-2">
                {renderPersonName(name, i * 2, "entourage.witnesses.names", i === 0, () => addPerson("entourage.witnesses.names"))}
              </div>
            ))}
          </div>
          <div className="text-left flex-1 pl-4">
            {(entourage.witnesses?.names || ["", ""]).filter((_: string, i: number) => i % 2 === 1).map((name: string, i: number) => (
              <div key={i * 2 + 1} className="mb-2">
                {renderPersonName(name, i * 2 + 1, "entourage.witnesses.names", false)}
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null,
    bestMan: () => (effectiveVisibleSections?.bestMan) ? (
      <div className="text-right flex-1 pr-4 flex flex-col justify-center">
        <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
        </h3>
        {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
      </div>
    ) : null,
    maidOfHonor: () => (effectiveVisibleSections?.maidOfHonor) ? (
      <div className="text-left flex-1 pl-4 flex flex-col justify-center">
        <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
        </h3>
        {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
      </div>
    ) : null,
    directorOfCeremony: () => (autoVisibleSections?.directorOfCeremony) ? (
      <div className="mb-6 relative" onDragOver={(e) => handleDragOver(e, "directorOfCeremony")}>
        {renderDragHandle("directorOfCeremony")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("DIRECTOR OF THE CEREMONY", entourage.directorOfCeremony?.titleCustom)}
        </h3>
        <div className="text-center">
          {(entourage.directorOfCeremony?.names || ["", ""]).map((name: string, i: number) => (
            <div key={i} className="mb-2">
              {renderPersonName(name, i, "entourage.directorOfCeremony.names", i === 0, () => addPerson("entourage.directorOfCeremony.names"))}
            </div>
          ))}
        </div>
      </div>
    ) : null,
    directorOfFeast: () => (autoVisibleSections?.directorOfFeast) ? (
      <div className="mb-6 relative" onDragOver={(e) => handleDragOver(e, "directorOfFeast")}>
        {renderDragHandle("directorOfFeast")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("DIRECTOR OF THE FEAST", entourage.directorOfFeast?.titleCustom)}
        </h3>
        <div className="text-center">
          {(entourage.directorOfFeast?.names || ["", ""]).map((name: string, i: number) => (
            <div key={i} className="mb-2">
              {renderPersonName(name, i, "entourage.directorOfFeast.names", i === 0, () => addPerson("entourage.directorOfFeast.names"))}
            </div>
          ))}
        </div>
      </div>
    ) : null,
    ushers: () => (effectiveVisibleSections?.ushers) ? (
      <div className="text-right flex-1 pr-4 flex flex-col justify-center">
        <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("USHERS", entourage.ushers?.titleCustom)}
        </h3>
        {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1">
            {renderPersonName(name, i, "entourage.ushers.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    usherettes: () => (effectiveVisibleSections?.usherettes) ? (
      <div className="text-left flex-1 pl-4 flex flex-col justify-center">
        <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
        </h3>
        {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1">
            {renderPersonName(name, i, "entourage.usherettes.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    groomsmen: () => (effectiveVisibleSections?.groomsmen) ? (
      <div className="text-right flex-1 pr-4 flex flex-col justify-center">
        <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
        </h3>
        {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1">
            {renderPersonName(name, i, "entourage.groomsmen.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    bridesmaids: () => (effectiveVisibleSections?.bridesmaids) ? (
      <div className="text-left flex-1 pl-4 flex flex-col justify-center">
        <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
        </h3>
        {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1">
            {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    jrGroomsmen: () => (effectiveVisibleSections?.jrGroomsmen) ? (
      <div className="text-right flex-1 pr-4 flex flex-col justify-center">
        <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
        </h3>
        {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1">
            {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    jrBridesmaid: () => (effectiveVisibleSections?.jrBridesmaid) ? (
      <div className="text-left flex-1 pl-4 flex flex-col justify-center">
        <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
        </h3>
        {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1">
            {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    flowerGirls: () => (autoVisibleSections?.flowerGirls) ? (
      <div className="relative mb-6" onDragOver={(e) => handleDragOver(e, "flowerGirls")}>
        {renderDragHandle("flowerGirls")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("FLOWER GIRLS", entourage.flowerGirls?.titleCustom)}
        </h3>
        {(entourage.flowerGirls?.names || [""]).map((name: string, i: number) => (
          <div key={i} className="mb-1 text-center">
            {renderPersonName(name, i, "entourage.flowerGirls.names", false)}
          </div>
        ))}
      </div>
    ) : null,
    bibleBearer: () => (autoVisibleSections?.bibleBearer) ? (
      <div className="relative mb-6" onDragOver={(e) => handleDragOver(e, "bibleBearer")}>
        {renderDragHandle("bibleBearer")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("BIBLE BEARER", entourage.bibleBearer?.titleCustom)}
        </h3>
        <p className="text-center">
          {renderSingleNameField(entourage.bibleBearer?.name || "", "entourage.bibleBearer.name")}
        </p>
      </div>
    ) : null,
    ringBearer: () => (autoVisibleSections?.ringBearer) ? (
      <div className="relative mb-6" onDragOver={(e) => handleDragOver(e, "ringBearer")}>
        {renderDragHandle("ringBearer")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("RING BEARER", entourage.ringBearer?.titleCustom)}
        </h3>
        <p className="text-center">
          {renderSingleNameField(entourage.ringBearer?.name || "", "entourage.ringBearer.name")}
        </p>
      </div>
    ) : null,
    chairman: () => (autoVisibleSections?.chairman) ? (
      <div className="relative mb-6" onDragOver={(e) => handleDragOver(e, "chairman")}>
        {renderDragHandle("chairman")}
        <h3 className="text-center mb-2 flex items-center justify-center whitespace-nowrap" style={{ fontFamily: getFontFamily(mergedEntourage.titlesTypography || data.headingFont, "heading"), color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
          {renderTitle("CHAIRMAN", entourage.chairman?.titleCustom)}
        </h3>
        <p className="text-center">
          {renderSingleNameField(entourage.chairman?.name || "", "entourage.chairman.name")}
        </p>
      </div>
    ) : null,
  };

  const renderPersonName = (name: string, index: number, field: string, canAdd: boolean = false, onAdd: () => void = () => {}) => {
    return (
      <div className="mb-2">
        <span className="text-sm font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{name || ""}</span>
      </div>
    );
  };

  const addPerson = (field: string) => {
    const currentNames = field.includes('witnesses') ? entourage.witnesses?.names || [] : 
                        field.includes('directorOfCeremony') ? entourage.directorOfCeremony?.names || [] :
                        field.includes('directorOfFeast') ? entourage.directorOfFeast?.names || [] : [];
    if (currentNames.length < 4) {
      updateEntourageField(field, [...currentNames, "Type the name"]);
    }
  };

  const renderSingleNameField = (name: string, field: string) => {
    return <span className="text-sm font-bold font-sans" style={{ fontFamily: getFontFamily(mergedEntourage.namesTypography || data.bodyFont, "body"), color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{name || ""}</span>;
  };

  // Live preview functions
  const storeOriginalStyles = () => {
    const paperContainer = document.getElementById('entourage-paper-container');
    if (!paperContainer) return;
    
    const styles: any = {
      container: {
        borderRadius: paperContainer.style.borderRadius || '',
        boxShadow: paperContainer.style.boxShadow || '',
        backgroundSize: paperContainer.style.backgroundSize || '',
        backgroundPosition: paperContainer.style.backgroundPosition || '',
      },
      textElements: [],
      shadowElements: [],
      pageElements: []
    };
    
    
    // Store original shadow elements
    const shadowElements = paperContainer.querySelectorAll('*');
    shadowElements.forEach((el: any) => {
      styles.shadowElements.push({
        element: el,
        boxShadow: el.style.boxShadow || '',
        textShadow: el.style.textShadow || ''
      });
    });
    
    // Store original page elements visibility
    const pageElements = paperContainer.querySelectorAll('[class*="page"], [id*="page"]');
    pageElements.forEach((el: any) => {
      styles.pageElements.push({
        element: el,
        display: el.style.display || ''
      });
    });
    
    setOriginalStyles(styles);
  };
  
  const applyLivePreview = () => {
    const paperContainer = document.getElementById('entourage-paper-container');
    if (!paperContainer || !originalStyles) return;
    
    setIsLivePreviewActive(true);
    
    // Apply round corner removal
    if (removeRoundCorners) {
      paperContainer.style.borderRadius = '0px';
    } else {
      paperContainer.style.borderRadius = originalStyles.container.borderRadius;
    }
    
    // Apply shadow removal
    if (removeShadows) {
      paperContainer.style.boxShadow = 'none';
      originalStyles.shadowElements.forEach((item: any) => {
        item.element.style.boxShadow = 'none';
        item.element.style.textShadow = 'none';
      });
    } else {
      paperContainer.style.boxShadow = originalStyles.container.boxShadow;
      originalStyles.shadowElements.forEach((item: any) => {
        item.element.style.boxShadow = item.boxShadow;
        item.element.style.textShadow = item.textShadow;
      });
    }
    
    // Apply text resize to content wrapper only
    const contentWrapper = document.getElementById('entourage-content-wrapper');
    if (contentWrapper) {
      if (tempTextResize !== 100) {
        const scaleFactor = tempTextResize / 100;
        contentWrapper.style.transform = `scale(${printResizeScale / 100}) scale(${scaleFactor})`;
        contentWrapper.style.transformOrigin = 'center center';
      } else {
        contentWrapper.style.transform = `scale(${printResizeScale / 100})`;
        contentWrapper.style.transformOrigin = 'top center';
      }
    }
    
    // Apply background zoom and position
    const bgZoom = tempBackgroundZoom / 100;
    const bgYPos = (tempBackgroundYPosition - 100) / 100;
    
    if (bgZoom !== 1 || bgYPos !== 0) {
      paperContainer.style.backgroundSize = `${bgZoom * 100}% auto`;
      paperContainer.style.backgroundPosition = `center ${50 + bgYPos * 50}%`;
    } else {
      paperContainer.style.backgroundSize = originalStyles.container.backgroundSize;
      paperContainer.style.backgroundPosition = originalStyles.container.backgroundPosition;
    }
    
    // Apply page number removal
    if (removePageNumber) {
      originalStyles.pageElements.forEach((item: any) => {
        item.element.style.display = 'none';
      });
    } else {
      originalStyles.pageElements.forEach((item: any) => {
        item.element.style.display = item.display;
      });
    }
  };
  
  const revertLivePreview = () => {
    if (!originalStyles) return;
    
    const paperContainer = document.getElementById('entourage-paper-container');
    if (!paperContainer) return;
    
    // Revert container styles
    paperContainer.style.borderRadius = originalStyles.container.borderRadius;
    paperContainer.style.boxShadow = originalStyles.container.boxShadow;
    paperContainer.style.backgroundSize = originalStyles.container.backgroundSize;
    paperContainer.style.backgroundPosition = originalStyles.container.backgroundPosition;
    
    // Revert content wrapper transform
    const contentWrapper = document.getElementById('entourage-content-wrapper');
    if (contentWrapper) {
      contentWrapper.style.transform = `scale(${printResizeScale / 100})`;
      contentWrapper.style.transformOrigin = 'top center';
    }
    
    
    // Revert shadow elements
    originalStyles.shadowElements.forEach((item: any) => {
      item.element.style.boxShadow = item.boxShadow;
      item.element.style.textShadow = item.textShadow;
    });
    
    // Revert page elements
    originalStyles.pageElements.forEach((item: any) => {
      item.element.style.display = item.display;
    });
    
    setIsLivePreviewActive(false);
  };

  // Print settings handlers
  const handleClosePrintSettings = () => {
    setIsPrintSettingsClosing(true);
    setTimeout(() => {
      setShowPrintSettings(false);
      setIsPrintSettingsClosing(false);
    }, 300);
  };

  const handleCancelPrint = () => {
    // Revert live preview changes
    revertLivePreview();
    
    // Revert all temporary changes
    setRemoveRoundCorners(false);
    setRemoveShadows(false);
    setRemovePageNumber(false);
    setTempTextResize(100);
    setTempBackgroundZoom(100);
    setTempBackgroundYPosition(100);
    
    // Clear original styles
    setOriginalStyles(null);
    
    handleClosePrintSettings();
  };

  const handleBeginPrinting = () => {
    // Get the paper container
    const paperContainer = document.getElementById('entourage-paper-container');
    if (!paperContainer) {
      console.error('Paper container not found!');
      return;
    }
    
    // Clone the paper container
    const clonedContainer = paperContainer.cloneNode(true) as HTMLElement;
    
    // Apply temporary changes
    if (removeRoundCorners) {
      clonedContainer.style.borderRadius = '0px';
    }
    
    // Apply shadow removal
    if (removeShadows) {
      clonedContainer.style.boxShadow = 'none';
      // Remove shadows from all child elements
      const allElements = clonedContainer.querySelectorAll('*');
      allElements.forEach(el => {
        (el as HTMLElement).style.boxShadow = 'none';
        (el as HTMLElement).style.textShadow = 'none';
      });
    }
    
    // Apply text resize
    if (tempTextResize !== 100) {
      const textElements = clonedContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
      textElements.forEach(el => {
        const currentSize = window.getComputedStyle(el as HTMLElement).fontSize;
        const currentSizeNum = parseFloat(currentSize);
        const newSize = currentSizeNum * (tempTextResize / 100);
        (el as HTMLElement).style.fontSize = `${newSize}px`;
      });
    }
    
    // Apply background zoom and position
    const bgZoom = tempBackgroundZoom / 100;
    const bgYPos = (tempBackgroundYPosition - 100) / 100;
    let bgPosition = 'center';
    let bgSize = 'cover';
    
    if (bgZoom !== 1 || bgYPos !== 0) {
      bgSize = `${bgZoom * 100}% auto`;
      bgPosition = `center ${50 + bgYPos * 50}%`;
    }
    
    // Remove page numbers if enabled
    if (removePageNumber) {
      const pageElements = clonedContainer.querySelectorAll('[class*="page"], [id*="page"]');
      pageElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }
    
    // Copy computed styles from original container
    const computedStyles = window.getComputedStyle(paperContainer);
    const containerStyles = `
      position: relative;
      width: 100%;
      height: auto;
      min-height: auto;
      max-height: none;
      padding: ${computedStyles.padding};
      margin: 0 auto;
      border-radius: ${removeRoundCorners ? '0px' : computedStyles.borderRadius};
      background: ${computedStyles.background};
      background-image: ${computedStyles.backgroundImage};
      background-size: ${bgSize};
      background-position: ${bgPosition};
      background-repeat: no-repeat;
      box-shadow: ${removeShadows ? 'none' : computedStyles.boxShadow};
      overflow: visible;
      aspect-ratio: auto;
    `;
    
    // Get all stylesheets to include in print window
    const stylesheets = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }
    
    // Write the cloned content with all styles to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Entourage Print</title>
          <style>
            ${stylesheets}
            body {
              margin: 0;
              padding: 0;
              font-family: inherit;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              width: 100%;
            }
            .print-container {
              width: 100%;
              height: 100vh;
              max-width: none;
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            #entourage-paper-container {
              ${containerStyles}
              margin: 0 auto !important;
              position: relative !important;
              left: auto !important;
              top: auto !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${clonedContainer.outerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    // Revert all temporary changes after printing
    setRemoveRoundCorners(false);
    setRemoveShadows(false);
    setRemovePageNumber(false);
    setTempTextResize(100);
    setTempBackgroundZoom(100);
    setTempBackgroundYPosition(100);
    
    // Clear original styles and revert live preview
    setOriginalStyles(null);
    revertLivePreview();
    
    handleClosePrintSettings();
  };

  const entourageUseDefaultDivider = data.entourageDividerUseDefault ?? true;
  const effectivePullDown = entourageUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.entourageDividerPullDown ?? 0);
  const effectiveVerticalFlip = entourageUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.entourageDividerVerticalFlip ?? false);

  return (
    <section className="pt-0 pb-8 px-8 text-center relative min-h-[200px]" style={{
      backgroundColor: mergedData.entourageUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.entourageBackgroundType === "gradient"
          ? undefined
          : mergedData.entourageBackgroundType === "image"
            ? undefined
            : mergedData.entourageBackgroundType === "video"
              ? undefined
              : (mergedData.entourageBackgroundColor || "transparent"),
      background: mergedData.entourageUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.entourageBackgroundType === "gradient" && mergedData.entourageGradient
          ? `linear-gradient(135deg, ${mergedData.entourageGradient.firstColor || "#ffffff"}, ${mergedData.entourageGradient.secondColor || "#ffffff"})`
          : undefined,
      ...(mergedData.entourageBackgroundType === "image" && mergedData.entourageImage?.urls && mergedData.entourageImage.urls.length > 0 ? {
        backgroundImage: `url(${mergedData.entourageImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      } : {}),
      transition: 'background 1s ease-in-out'
    }}>
    
    {/* Gradient Overlay - positioned behind content */}
    {(mergedData.entourageBackgroundType === "image" || mergedData.entourageBackgroundType === "video") && mergedData.entourageGradient && (
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `linear-gradient(135deg, ${hexToRgba(mergedData.entourageGradient.firstColor || "#ffffff", (mergedData.entourageGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.entourageGradient.secondColor || "#ffffff", (mergedData.entourageGradient.secondOpacity || 50) / 100)})`,
        opacity: 1,
        zIndex: 1
      }} />
    )}

    {/* Background Video */}
    {mergedData.entourageBackgroundType === "video" && mergedData.entourageVideo?.url && (
      <video
        src={normalizeVideoUrl(mergedData.entourageVideo.url)}
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
        type={entourageUseDefaultDivider ? (data.universalDivider || "none") : (data.entourageDivider || "none")} 
        color={data.mainColor2} 
        id="entourage-cssid" 
        offset={entourageUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.entourageDividerOffset ?? 0)}
        tintColor={entourageUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.entourageDividerTintColor || data.mainColor2)}
        tintOpacity={entourageUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.entourageDividerTintOpacity ?? 100)}
        dividerStyle={entourageUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.entourageDividerStyle || "centered-single")}
        flip={entourageUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.entourageDividerFlip ?? false)}
        spacing={entourageUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.entourageDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={entourageUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.entourageDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={entourageUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.entourageDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={entourageUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.entourageDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={entourageUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.entourageDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={entourageUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.entourageDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (entourageUseDefaultDivider) {
            onChange?.("entourageDividerUseDefault", false);
          }
          onChange?.("entourageDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('entourage-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Entourage Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.entourageDivider && data.entourageDivider !== "none" ? data.entourageDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("entourageDivider", value)}
          tintColor={data.entourageDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("entourageDividerTintColor", value)}
          tintOpacity={data.entourageDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("entourageDividerTintOpacity", value)}
          dividerStyle={data.entourageDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("entourageDividerStyle", value)}
          flip={data.entourageDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("entourageDividerFlip", value)}
          spacing={data.entourageDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("entourageDividerSpacing", value)}
          pullDown={data.entourageDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("entourageDividerPullDown", value)}
          verticalFlip={data.entourageDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("entourageDividerVerticalFlip", value)}
          imageSize={data.entourageDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("entourageDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.entourageDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("entourageDividerCustomImageUrl1", value)}
          customImageUrl2={data.entourageDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("entourageDividerCustomImageUrl2", value)}
          customImageUrl3={data.entourageDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("entourageDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.entourageDivider === "divider-1" ? predefinedDividerImagesCentered : data.entourageDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={entourageUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("entourageDividerUseDefault", value)}
          colorBlend={data.entourageDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("entourageDividerColorBlend", value)}
        />
      )}
      
      {/* Heading area - clickable to open typography panel */}
      <div className="mb-6">
        {/* Top text - outside paper container */}
        <p
          id="entourage-top-text"
          className="text-center mb-1 md:mb-6 uppercase scale-[0.7] lg:scale-100"
          style={{ fontFamily: mergedData.entourageUseMainColor !== false ? data.headingFont : (mergedData.entourageHeadingTypography || data.headingFont), color: mergedData.entourageUseMainColor !== false ? data.neutralColor1 : (mergedData.entourageBottomTextColor || data.neutralColor1), fontSize: `${(mergedData.entourageBottomTextFontSize || 100) / 100}rem` }}
        >
          <span
            className={editMode && !rearrangeMode ? "cursor-pointer" : ""}
            onClick={editMode && !rearrangeMode ? () => setShowTypographyPanel(true) : undefined}
          >
            {renderTitle(`Those who stand with ${data.hisName || "Groom"} & ${data.herName || "Bride"}`, mergedEntourage.topTextCustom)}
          </span>
        </p>

        {/* Header - outside paper container */}
        <h2
          className="text-xl mb-1 md:mb-6 lg:mb-6 text-center font-bold uppercase whitespace-nowrap scale-[0.55] lg:scale-100"
          style={{ fontFamily: mergedData.entourageUseMainColor !== false ? data.headingFont : (mergedData.entourageHeadingTypography || data.headingFont), color: mergedData.entourageUseMainColor !== false ? data.mainColor2 : (mergedData.entourageHeadingColor || data.mainColor2), fontSize: `${(mergedData.entourageHeadingFontSize || 100) * 3}%`, lineHeight: '1.2' }}
        >
          <span
            className={editMode && !rearrangeMode ? "cursor-pointer" : ""}
            onClick={editMode && !rearrangeMode ? () => setShowTypographyPanel(true) : undefined}
          >
            {mergedData.entourageHeading || "Wedding Entourage"}
          </span>
        </h2>

        {/* Bottom text - outside paper container */}
        <p
          className="text-center text-sm mb-2 md:mb-6 scale-[0.7] lg:scale-100"
          style={{ fontFamily: mergedData.entourageUseMainColor !== false ? data.bodyFont : (mergedData.entourageBottomTextTypography || data.bodyFont), color: mergedData.entourageUseMainColor !== false ? data.neutralColor1 : (mergedData.entourageBottomTextColor || data.neutralColor1), fontSize: `${(mergedData.entourageBottomTextFontSize || 100) / 100 * 0.85}rem` }}
        >
          <span
            className={editMode && !rearrangeMode ? "cursor-pointer" : ""}
            onClick={editMode && !rearrangeMode ? () => setShowTypographyPanel(true) : undefined}
          >
            {renderTitle("Honoring those who share in our joy", mergedEntourage.bottomTextCustom)}
          </span>
        </p>
      </div>

      {/* Paper container - only show page 1 when currentPage is 1 */}
      {currentPage === 1 && renderPaperContainer(
        <div ref={page1Ref}>
        {renderDivider()}

        {rearrangeMode ? (
          // Dynamic rendering based on tempSectionOrder
          <>
            {/* Always render couple at the top */}
            {sectionRenderers.couple?.()}
            {renderDivider()}
            
            {/* Always render parents section after couple (fixed position) */}
            {tempSectionOrder.includes('groomParents') && tempSectionOrder.includes('brideParents') && autoVisibleSections?.groomParents && autoVisibleSections?.brideParents && (
              <div className="relative flex justify-between mb-6">
                {renderDragHandle("groomParents")}
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("GROOM'S PARENTS", entourage.groomParents?.titleCustom)}
                  </h3>
                  <p className="text-sm font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.groomParents?.fatherName || ""}</p>
                  <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                    {renderTitle("FATHER", entourage.groomParents?.fatherTitleCustom)}
                  </p>
                  <p className="text-sm mt-2 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.groomParents?.motherName || ""}</p>
                  <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                    {renderTitle("MOTHER", entourage.groomParents?.motherTitleCustom)}
                  </p>
                </div>
                <div className="text-left flex-1 pl-4">
                  <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("BRIDE'S PARENTS", entourage.brideParents?.titleCustom)}
                  </h3>
                  <p className="text-sm font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.brideParents?.fatherName || ""}</p>
                  <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                    {renderTitle("FATHER", entourage.brideParents?.fatherTitleCustom)}
                  </p>
                  <p className="text-sm mt-2 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.brideParents?.motherName || ""}</p>
                  <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                    {renderTitle("MOTHER", entourage.brideParents?.motherTitleCustom)}
                  </p>
                </div>
              </div>
            )}
            {!(autoVisibleSections?.groomParents && autoVisibleSections?.brideParents) && (
              <div className="flex justify-between mb-6">
                {autoVisibleSections?.groomParents && sectionRenderers.groomParents?.()}
                {autoVisibleSections?.brideParents && sectionRenderers.brideParents?.()}
              </div>
            )}
            
            {/* Render other sections in order (excluding couple and parents) */}
            {tempSectionOrder.filter(id => id !== 'couple' && id !== 'groomParents' && id !== 'brideParents' && (id === 'page2' || id === 'page3' || effectiveVisibleSections?.[id as keyof typeof effectiveVisibleSections] || autoVisibleSections?.[id as keyof typeof autoVisibleSections])).map((sectionId, index) => {
              // Render PAGE 2 divider
              if (sectionId === 'page2') {
                return (
                  <div 
                    key="page2"
                    className={`relative mb-6 transition-all duration-200 ${draggedSection === 'page2' ? 'opacity-50 scale-95' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedSection('page2');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedSection(null)}
                    onDragOver={(e) => handleDragOver(e, "page2")}
                  >
                    {renderDragHandle("page2")}
                    <div className="flex items-center justify-center my-6" style={{ transform: `scale(${(mergedEntourage.titlesFontSize || 100) / 100})` }}>
                      <div className="w-3/4 flex items-center gap-2">
                        <div className="flex-1 border-t-2 border-dashed border-gray-400" style={{ borderSpacing: '8px' }} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>Page 2</span>
                        <div className="flex-1 border-t-2 border-dashed border-gray-400" style={{ borderSpacing: '8px' }} />
                      </div>
                    </div>
                  </div>
                );
              }

              // Render PAGE 3 divider
              if (sectionId === 'page3') {
                return (
                  <div 
                    key="page3"
                    className={`relative mb-6 transition-all duration-200 ${draggedSection === 'page3' ? 'opacity-50 scale-95' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedSection('page3');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedSection(null)}
                    onDragOver={(e) => handleDragOver(e, "page3")}
                  >
                    {renderDragHandle("page3")}
                    <div className="flex items-center justify-center my-6" style={{ transform: `scale(${(mergedEntourage.titlesFontSize || 100) / 100})` }}>
                      <div className="w-3/4 flex items-center gap-2">
                        <div className="flex-1 border-t-2 border-dashed border-gray-400" style={{ borderSpacing: '8px' }} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>Page 3</span>
                        <div className="flex-1 border-t-2 border-dashed border-gray-400" style={{ borderSpacing: '8px' }} />
                      </div>
                    </div>
                  </div>
                );
              }

              const sectionRenderer = sectionRenderers[sectionId];
              if (!sectionRenderer) return null;
              
              // Handle paired sections - bestMan and maidOfHonor
              if (sectionId === 'bestMan' && tempSectionOrder.includes('maidOfHonor')) {
                const maidIndex = tempSectionOrder.indexOf('maidOfHonor');
                const bestIndex = tempSectionOrder.indexOf('bestMan');
                if (maidIndex > bestIndex) {
                  return (
                    <div 
                      key="bestManMaid" 
                      className={`relative mb-6 transition-all duration-200 ${draggedSection === 'bestMan' ? 'opacity-50 scale-95' : ''}`}
                      onDragOver={(e) => handleDragOver(e, "bestMan")}
                    >
                      {renderDragHandle("bestMan")}
                      {renderDivider()}
                      <div className="flex justify-between">
                        <div className="text-right flex-1 pr-4">
                          <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                          </h3>
                          {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                        </div>
                        <div className="text-left flex-1 pl-4">
                          <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                          </h3>
                          {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                        </div>
                      </div>
                      {renderDivider()}
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'maidOfHonor' && tempSectionOrder.includes('bestMan')) {
                const bestIndex = tempSectionOrder.indexOf('bestMan');
                const maidIndex = tempSectionOrder.indexOf('maidOfHonor');
                if (bestIndex < maidIndex) {
                  return null;
                }
                return (
                  <div 
                    key="bestManMaid" 
                    className={`relative mb-6 transition-all duration-200 ${draggedSection === 'bestMan' ? 'opacity-50 scale-95' : ''}`}
                    onDragOver={(e) => handleDragOver(e, "bestMan")}
                  >
                    {renderDragHandle("bestMan")}
                    {renderDivider()}
                    <div className="flex justify-between">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                        </h3>
                        {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                        </h3>
                        {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                      </div>
                    </div>
                    {renderDivider()}
                  </div>
                );
              }
              
              // Handle paired sections - ushers and usherettes
              if (sectionId === 'ushers' && tempSectionOrder.includes('usherettes')) {
                const usheretteIndex = tempSectionOrder.indexOf('usherettes');
                const usherIndex = tempSectionOrder.indexOf('ushers');
                if (usheretteIndex > usherIndex) {
                  return (
                    <div 
                      key="ushersUsherettes" 
                      className={`relative mb-6 transition-all duration-200 ${draggedSection === 'ushers' ? 'opacity-50 scale-95' : ''}`}
                      onDragOver={(e) => handleDragOver(e, "ushers")}
                    >
                      {renderDragHandle("ushers")}
                      <div className="flex justify-between">
                        <div className="text-right flex-1 pr-4">
                          <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                          </h3>
                          {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                            <div key={i} className="mb-1">
                              {renderPersonName(name, i, "entourage.ushers.names", false)}
                            </div>
                          ))}
                        </div>
                        <div className="text-left flex-1 pl-4">
                          <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                          </h3>
                          {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                            <div key={i} className="mb-1">
                              {renderPersonName(name, i, "entourage.usherettes.names", false)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'usherettes' && tempSectionOrder.includes('ushers')) {
                const usherIndex = tempSectionOrder.indexOf('ushers');
                const usheretteIndex = tempSectionOrder.indexOf('usherettes');
                if (usherIndex < usheretteIndex) {
                  return null;
                }
                return (
                  <div 
                    key="ushersUsherettes" 
                    className={`relative mb-6 transition-all duration-200 ${draggedSection === 'ushers' ? 'opacity-50 scale-95' : ''}`}
                    onDragOver={(e) => handleDragOver(e, "ushers")}
                  >
                    {renderDragHandle("ushers")}
                    <div className="flex justify-between">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                        </h3>
                        {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.ushers.names", false)}
                          </div>
                        ))}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                        </h3>
                        {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.usherettes.names", false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Handle paired sections - groomsmen and bridesmaids
              if (sectionId === 'groomsmen' && tempSectionOrder.includes('bridesmaids')) {
                const bridesmaidIndex = tempSectionOrder.indexOf('bridesmaids');
                const groomsmanIndex = tempSectionOrder.indexOf('groomsmen');
                if (bridesmaidIndex > groomsmanIndex) {
                  return (
                    <div 
                      key="groomsmenBridesmaids" 
                      className={`relative mb-6 transition-all duration-200 ${draggedSection === 'groomsmen' ? 'opacity-50 scale-95' : ''}`}
                      onDragOver={(e) => handleDragOver(e, "groomsmen")}
                    >
                      {renderDragHandle("groomsmen")}
                      <div className="flex justify-between">
                        <div className="text-right flex-1 pr-4">
                          <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                          </h3>
                          {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                            <div key={i} className="mb-1">
                              {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                            </div>
                          ))}
                        </div>
                        <div className="text-left flex-1 pl-4">
                          <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                          </h3>
                          {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                            <div key={i} className="mb-1">
                              {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'bridesmaids' && tempSectionOrder.includes('groomsmen')) {
                const groomsmanIndex = tempSectionOrder.indexOf('groomsmen');
                const bridesmaidIndex = tempSectionOrder.indexOf('bridesmaids');
                if (groomsmanIndex < bridesmaidIndex) {
                  return null;
                }
                return (
                  <div 
                    key="groomsmenBridesmaids" 
                    className={`relative mb-6 transition-all duration-200 ${draggedSection === 'groomsmen' ? 'opacity-50 scale-95' : ''}`}
                    onDragOver={(e) => handleDragOver(e, "groomsmen")}
                  >
                    {renderDragHandle("groomsmen")}
                    <div className="flex justify-between">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                        </h3>
                        {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                          </div>
                        ))}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                        </h3>
                        {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Handle paired sections - jr groomsmen and jr bridesmaids
              if (sectionId === 'jrGroomsmen' && tempSectionOrder.includes('jrBridesmaid')) {
                const jrBridesmaidIndex = tempSectionOrder.indexOf('jrBridesmaid');
                const jrGroomsmanIndex = tempSectionOrder.indexOf('jrGroomsmen');
                if (jrBridesmaidIndex > jrGroomsmanIndex) {
                  return (
                    <div 
                      key="jrGroomsmenJrBridesmaids" 
                      className={`relative mb-6 transition-all duration-200 ${draggedSection === 'jrGroomsmen' ? 'opacity-50 scale-95' : ''}`}
                      onDragOver={(e) => handleDragOver(e, "jrGroomsmen")}
                    >
                      {renderDragHandle("jrGroomsmen")}
                      <div className="flex justify-between">
                        <div className="text-right flex-1 pr-4">
                          <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                          </h3>
                          {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                            <div key={i} className="mb-1">
                              {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                            </div>
                          ))}
                        </div>
                        <div className="text-left flex-1 pl-4">
                          <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                          </h3>
                          {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                            <div key={i} className="mb-1">
                              {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'jrBridesmaid' && tempSectionOrder.includes('jrGroomsmen')) {
                const jrGroomsmanIndex = tempSectionOrder.indexOf('jrGroomsmen');
                const jrBridesmaidIndex = tempSectionOrder.indexOf('jrBridesmaid');
                if (jrGroomsmanIndex < jrBridesmaidIndex) {
                  return null;
                }
                return (
                  <div 
                    key="jrGroomsmenJrBridesmaids" 
                    className={`relative mb-6 transition-all duration-200 ${draggedSection === 'jrGroomsmen' ? 'opacity-50 scale-95' : ''}`}
                    onDragOver={(e) => handleDragOver(e, "jrGroomsmen")}
                  >
                    {renderDragHandle("jrGroomsmen")}
                    <div className="flex justify-between">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                        </h3>
                        {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                          </div>
                        ))}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                        </h3>
                        {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Single sections - remove divider from witnesses
              if (sectionId === 'witnesses') {
                return (
                  <div 
                    key={sectionId}
                    className={`transition-all duration-200 ${draggedSection === sectionId ? 'opacity-50 scale-95' : ''}`}
                    onDragOver={(e) => handleDragOver(e, sectionId)}
                  >
                    {sectionRenderer()}
                  </div>
                );
              }
              
              // Single sections
              return (
                <div 
                  key={sectionId}
                  className={`transition-all duration-200 ${draggedSection === sectionId ? 'opacity-50 scale-95' : ''}`}
                  onDragOver={(e) => handleDragOver(e, sectionId)}
                >
                  {sectionRenderer()}
                </div>
              );
            })}
          </>
        ) : (
          // Use saved section order if available, otherwise use original hardcoded rendering
          (() => {
            const currentOrder = entourage.sectionOrder || [
              "marriageTalkSpeaker",
              "chairman",
              "officiatingMinister",
              "witnesses",
              "bestMan",
              "maidOfHonor",
              "directorOfCeremony",
              "directorOfFeast",
              "ushers",
              "usherettes"
            ];
            
            const visibleSections = currentOrder.filter(id => entourage.visibleSections?.[id as keyof typeof entourage.visibleSections]);
            
            // Split sections based on page2Position and page3Position (same logic as main rendering)
            const page2Pos = entourage.page2Position !== undefined ? entourage.page2Position : -1;
            const page3Pos = entourage.page3Position !== undefined ? entourage.page3Position : -1;
            console.log('page2Pos:', page2Pos, 'page3Pos:', page3Pos, 'visibleSections:', visibleSections);
            const page1Sections = page2Pos >= 0 ? visibleSections.slice(0, page2Pos) : visibleSections;
            const page2Sections = page2Pos >= 0 && page3Pos >= 0 && page3Pos > page2Pos 
              ? visibleSections.slice(page2Pos, page3Pos) 
              : page2Pos >= 0 && page3Pos < 0
              ? visibleSections.slice(page2Pos)
              : [];
            const page3Sections = page3Pos >= 0 && page2Pos >= 0 ? visibleSections.slice(page3Pos) : [];
            console.log('page1Sections:', page1Sections, 'page2Sections:', page2Sections, 'page3Sections:', page3Sections);
            const hasPage2 = page2Sections.length > 0;
            
            const renderSection = (sectionId: string) => {
              const sectionRenderer = sectionRenderers[sectionId];
              if (!sectionRenderer) return null;
              
              // Handle paired sections - bestMan and maidOfHonor
              if (sectionId === 'bestMan' && currentOrder.includes('maidOfHonor')) {
                const maidIndex = currentOrder.indexOf('maidOfHonor');
                const bestIndex = currentOrder.indexOf('bestMan');
                
                if (maidIndex > bestIndex) {
                  return (
                    <Fragment key={sectionId}>
                      {renderDivider()}
                      <div key="bestManMaid" className="flex justify-between mb-6">
                        <div className="text-right flex-1 pr-4">
                          <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                          </h3>
                          {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                        </div>
                        <div className="text-left flex-1 pl-4">
                          <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                            {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                          </h3>
                          {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                        </div>
                      </div>
                      {renderDivider()}
                    </Fragment>
                  );
                }
                return null;
              }
              if (sectionId === 'maidOfHonor' && currentOrder.includes('bestMan')) {
                const bestIndex = currentOrder.indexOf('bestMan');
                const maidIndex = currentOrder.indexOf('maidOfHonor');
                
                if (bestIndex < maidIndex) {
                  return null;
                }
                return (
                  <Fragment key={sectionId}>
                    {renderDivider()}
                    <div key="bestManMaid" className="flex justify-between mb-6">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                        </h3>
                        {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                        </h3>
                        {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                      </div>
                    </div>
                    {renderDivider()}
                  </Fragment>
                );
              }
              
              // Handle paired sections - ushers and usherettes
              if (sectionId === 'ushers' && currentOrder.includes('usherettes')) {
                const usheretteIndex = currentOrder.indexOf('usherettes');
                const usherIndex = currentOrder.indexOf('ushers');
                
                if (usheretteIndex > usherIndex) {
                  return (
                    <div key="ushersUsherettes" className="flex justify-between mb-6">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                        </h3>
                        {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.ushers.names", false)}
                          </div>
                        ))}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                        </h3>
                        {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.usherettes.names", false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'usherettes' && currentOrder.includes('ushers')) {
                const usherIndex = currentOrder.indexOf('ushers');
                const usheretteIndex = currentOrder.indexOf('usherettes');
                
                if (usherIndex < usheretteIndex) {
                  return null;
                }
                return (
                  <div key="ushersUsherettes" className="flex justify-between mb-6">
                    <div className="text-right flex-1 pr-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                      </h3>
                      {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.ushers.names", false)}
                        </div>
                      ))}
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                      </h3>
                      {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.usherettes.names", false)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // Handle paired sections - groomsmen and bridesmaids
              if (sectionId === 'groomsmen' && currentOrder.includes('bridesmaids')) {
                const bridesmaidIndex = currentOrder.indexOf('bridesmaids');
                const groomsmanIndex = currentOrder.indexOf('groomsmen');
                
                if (bridesmaidIndex > groomsmanIndex) {
                  return (
                    <div key="groomsmenBridesmaids" className="flex justify-between mb-6">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                        </h3>
                        {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                          </div>
                        ))}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                        </h3>
                        {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'bridesmaids' && currentOrder.includes('groomsmen')) {
                const groomsmanIndex = currentOrder.indexOf('groomsmen');
                const bridesmaidIndex = currentOrder.indexOf('bridesmaids');
                
                if (groomsmanIndex < bridesmaidIndex) {
                  return null;
                }
                return (
                  <div key="groomsmenBridesmaids" className="flex justify-between mb-6">
                    <div className="text-right flex-1 pr-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                      </h3>
                      {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                        </div>
                      ))}
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                      </h3>
                      {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // Handle paired sections - jr groomsmen and jr bridesmaids
              if (sectionId === 'jrGroomsmen' && currentOrder.includes('jrBridesmaid')) {
                const jrBridesmaidIndex = currentOrder.indexOf('jrBridesmaid');
                const jrGroomsmanIndex = currentOrder.indexOf('jrGroomsmen');
                
                if (jrBridesmaidIndex > jrGroomsmanIndex) {
                  return (
                    <div key="jrGroomsmenJrBridesmaids" className="flex justify-between mb-6">
                      <div className="text-right flex-1 pr-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                        </h3>
                        {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                          </div>
                        ))}
                      </div>
                      <div className="text-left flex-1 pl-4">
                        <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                          {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                        </h3>
                        {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                          <div key={i} className="mb-1">
                            {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }
              if (sectionId === 'jrBridesmaid' && currentOrder.includes('jrGroomsmen')) {
                const jrGroomsmanIndex = currentOrder.indexOf('jrGroomsmen');
                const jrBridesmaidIndex = currentOrder.indexOf('jrBridesmaid');
                
                if (jrGroomsmanIndex < jrBridesmaidIndex) {
                  return null;
                }
                return (
                  <div key="jrGroomsmenJrBridesmaids" className="flex justify-between mb-6">
                    <div className="text-right flex-1 pr-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                      </h3>
                      {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                        </div>
                      ))}
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                      </h3>
                      {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // Single sections - remove divider from witnesses
              if (sectionId === 'witnesses') {
                return <div key={sectionId}>{sectionRenderer()}</div>;
              }
              
              // Single sections
              return <div key={sectionId}>{sectionRenderer()}</div>;
            };
            
            return (
              <>
                {/* Page 1 */}
                <div className="relative" onDragOver={(e) => handleDragOver(e, "couple")}>
                  {renderDragHandle("couple")}
                  <h3 className="text-center mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("THE COUPLE", entourage.couple?.titleCustom)}
                  </h3>
                </div>
                <div className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <p className="text-sm font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.couple?.groomName || ""}</p>
                    <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                      {renderTitle("GROOM", entourage.couple?.groomTitleCustom)}
                    </p>
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <p className="text-sm font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.couple?.brideName || ""}</p>
                    <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                      {renderTitle("BRIDE", entourage.couple?.brideTitleCustom)}
                    </p>
                  </div>
                </div>

                {renderDivider()}

                {/* Render parents section in fixed position */}
                {entourage.visibleSections?.groomParents && entourage.visibleSections?.brideParents && (
                  <div className="relative flex justify-between mb-6">
                    {renderDragHandle("groomParents")}
                    <div className="text-right flex-1 pr-4">
                      <h3 className="mb-2 text-right whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("GROOM'S PARENTS", entourage.groomParents?.titleCustom)}
                      </h3>
                      <p className="text-sm font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.groomParents?.fatherName || ""}</p>
                      <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                        {renderTitle("FATHER", entourage.groomParents?.fatherTitleCustom)}
                      </p>
                      <p className="text-sm mt-2 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.groomParents?.motherName || ""}</p>
                      <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                        {renderTitle("MOTHER", entourage.groomParents?.motherTitleCustom)}
                      </p>
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 text-left whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("BRIDE'S PARENTS", entourage.brideParents?.titleCustom)}
                      </h3>
                      <p className="text-sm font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.brideParents?.fatherName || ""}</p>
                      <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                        {renderTitle("FATHER", entourage.brideParents?.fatherTitleCustom)}
                      </p>
                      <p className="text-sm mt-2 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.7}%` }}>{entourage.brideParents?.motherName || ""}</p>
                      <p className="text-xs text-gray-600 font-bold font-sans" style={{ fontFamily: mergedEntourage.namesTypography || data.bodyFont, color: mergedEntourage.namesColor || data.mainColor2, fontSize: `${(mergedEntourage.namesFontSize || 100) * 0.6}%`, opacity: 0.75 }}>
                        {renderTitle("MOTHER", entourage.brideParents?.motherTitleCustom)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Render page 1 sections */}
                {page1Sections.map(renderSection)}

                {/* Right arrow to go to page 2 - only in edit mode */}
                {editMode && hasPage2 && currentPage === 1 && (
                  <button
                    onClick={() => setCurrentPage(2)}
                    className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Next page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
            </>
          );
        })()
      )}
      </div>,
      1, // page number
      hasPage3 ? 3 : hasPage2 ? 2 : 1 // total pages
      )
      }

      {/* Spacer below paper container */}
      <div style={{ height: '50px' }} />

      {/* Page 2 paper container - only show if there are sections and currentPage is 2 */}
      {currentPage === 2 && (() => {
        const currentOrder = entourage.sectionOrder || [
          "marriageTalkSpeaker",
          "chairman",
          "officiatingMinister",
          "witnesses",
          "bestMan",
          "maidOfHonor",
          "directorOfCeremony",
          "directorOfFeast",
          "ushers",
          "usherettes",
          "groomsmen",
          "bridesmaids",
          "jrGroomsmen",
          "jrBridesmaid",
          "flowerGirls",
          "bibleBearer",
          "ringBearer"
        ];

        const visibleSections = currentOrder.filter(id => entourage.visibleSections?.[id as keyof typeof entourage.visibleSections]);
        const page2Pos = entourage.page2Position !== undefined ? entourage.page2Position : -1;
        const page3Pos = entourage.page3Position !== undefined ? entourage.page3Position : -1;
        const page2Sections = page2Pos >= 0 && page3Pos >= 0 && page3Pos > page2Pos 
          ? visibleSections.slice(page2Pos, page3Pos) 
          : page2Pos >= 0 && page3Pos < 0
          ? visibleSections.slice(page2Pos)
          : [];

        if (page2Sections.length === 0) return null;
        
        const renderSection = (sectionId: string) => {
          const sectionRenderer = sectionRenderers[sectionId];
          if (!sectionRenderer) return null;
          
          // Handle paired sections - bestMan and maidOfHonor
          if (sectionId === 'bestMan' && currentOrder.includes('maidOfHonor')) {
            const maidIndex = currentOrder.indexOf('maidOfHonor');
            const bestIndex = currentOrder.indexOf('bestMan');
            
            if (maidIndex > bestIndex) {
              return (
                <Fragment key={sectionId}>
                  {renderDivider()}
                  <div key="bestManMaid" className="flex justify-between mb-6">
                    <div className="text-right flex-1 pr-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                      </h3>
                      {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                      </h3>
                      {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                    </div>
                  </div>
                  {renderDivider()}
                </Fragment>
              );
            }
            return null;
          }
          if (sectionId === 'maidOfHonor' && currentOrder.includes('bestMan')) {
            const bestIndex = currentOrder.indexOf('bestMan');
            const maidIndex = currentOrder.indexOf('maidOfHonor');
            
            if (bestIndex < maidIndex) {
              return null;
            }
            return (
              <Fragment key={sectionId}>
                {renderDivider()}
                <div key="bestManMaid" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                    </h3>
                    {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                    </h3>
                    {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                  </div>
                </div>
                {renderDivider()}
              </Fragment>
            );
          }
          
          // Handle paired sections - ushers and usherettes
          if (sectionId === 'ushers' && currentOrder.includes('usherettes')) {
            const usheretteIndex = currentOrder.indexOf('usherettes');
            const usherIndex = currentOrder.indexOf('ushers');
            
            if (usheretteIndex > usherIndex) {
              return (
                <div key="ushersUsherettes" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                    </h3>
                    {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.ushers.names", false)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                    </h3>
                    {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.usherettes.names", false)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }
          if (sectionId === 'usherettes' && currentOrder.includes('ushers')) {
            const usherIndex = currentOrder.indexOf('ushers');
            const usheretteIndex = currentOrder.indexOf('usherettes');
            
            if (usherIndex < usheretteIndex) {
              return null;
            }
            return (
              <div key="ushersUsherettes" className="flex justify-between mb-6">
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                  </h3>
                  {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.ushers.names", false)}
                    </div>
                  ))}
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                      </h3>
                      {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                        <div key={i} className="mb-1">
                          {renderPersonName(name, i, "entourage.usherettes.names", false)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
          
          // Handle paired sections - groomsmen and bridesmaids
          if (sectionId === 'groomsmen' && currentOrder.includes('bridesmaids')) {
            const bridesmaidIndex = currentOrder.indexOf('bridesmaids');
            const groomsmanIndex = currentOrder.indexOf('groomsmen');
            
            if (bridesmaidIndex > groomsmanIndex) {
              return (
                <div key="groomsmenBridesmaids" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                    </h3>
                    {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                    </h3>
                    {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }
          if (sectionId === 'bridesmaids' && currentOrder.includes('groomsmen')) {
            const groomsmanIndex = currentOrder.indexOf('groomsmen');
            const bridesmaidIndex = currentOrder.indexOf('bridesmaids');
            
            if (groomsmanIndex < bridesmaidIndex) {
              return null;
            }
            return (
              <div key="groomsmenBridesmaids" className="flex justify-between mb-6">
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                  </h3>
                  {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                    </div>
                  ))}
                </div>
                <div className="text-left flex-1 pl-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                  </h3>
                  {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          // Handle paired sections - jr groomsmen and jr bridesmaids
          if (sectionId === 'jrGroomsmen' && currentOrder.includes('jrBridesmaid')) {
            const jrBridesmaidIndex = currentOrder.indexOf('jrBridesmaid');
            const jrGroomsmanIndex = currentOrder.indexOf('jrGroomsmen');
            
            if (jrBridesmaidIndex > jrGroomsmanIndex) {
              return (
                <div key="jrGroomsmenJrBridesmaids" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                    </h3>
                    {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                    </h3>
                    {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }
          if (sectionId === 'jrBridesmaid' && currentOrder.includes('jrGroomsmen')) {
            const jrGroomsmanIndex = currentOrder.indexOf('jrGroomsmen');
            const jrBridesmaidIndex = currentOrder.indexOf('jrBridesmaid');
            
            if (jrGroomsmanIndex < jrBridesmaidIndex) {
              return null;
            }
            return (
              <div key="jrGroomsmenJrBridesmaids" className="flex justify-between mb-6">
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                  </h3>
                  {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                    </div>
                  ))}
                </div>
                <div className="text-left flex-1 pl-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                  </h3>
                  {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          // Single sections - remove divider from witnesses
          if (sectionId === 'witnesses') {
            return <div key={sectionId}>{sectionRenderer()}</div>;
          }
          
          // Single sections
          return <div key={sectionId}>{sectionRenderer()}</div>;
        };
        
        return renderPaperContainer(
          <>
            {renderDivider()}
            {page2Sections.map(renderSection)}

            {/* Left arrow to go to page 1 - only in edit mode */}
            {editMode && (
              <button
                onClick={() => setCurrentPage(1)}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="Previous page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Right arrow to go to page 3 - only in edit mode */}
            {editMode && hasPage3 && (
              <button
                onClick={() => setCurrentPage(3)}
                className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="Next page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </>,
          2, // page number
          hasPage3 ? 3 : hasPage2 ? 2 : 1 // total pages
        );
      })()}

      {/* Spacer below page 2 paper container */}
      {currentPage === 2 && <div style={{ height: '50px' }} />}

      {/* Page 3 paper container - only show if there are sections and currentPage is 3 */}
      {currentPage === 3 && hasPage3 && (() => {
        const currentOrder = entourage.sectionOrder || [
          "marriageTalkSpeaker",
          "chairman",
          "officiatingMinister",
          "witnesses",
          "bestMan",
          "maidOfHonor",
          "directorOfCeremony",
          "directorOfFeast",
          "ushers",
          "usherettes",
          "groomsmen",
          "bridesmaids",
          "jrGroomsmen",
          "jrBridesmaid",
          "flowerGirls",
          "bibleBearer",
          "ringBearer"
        ];
        
        const page3VisibleSections = page3Sections;
        
        const renderSection = (sectionId: string) => {
          const sectionRenderer = sectionRenderers[sectionId];
          if (!sectionRenderer) return null;
          
          // Handle paired sections - bestMan and maidOfHonor
          if (sectionId === 'bestMan' && currentOrder.includes('maidOfHonor')) {
            const maidIndex = currentOrder.indexOf('maidOfHonor');
            const bestIndex = currentOrder.indexOf('bestMan');
            
            if (maidIndex > bestIndex) {
              return (
                <Fragment key={sectionId}>
                  {renderDivider()}
                  <div key="bestManMaid" className="flex justify-between mb-6">
                    <div className="text-right flex-1 pr-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                      </h3>
                      {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                    </div>
                    <div className="text-left flex-1 pl-4">
                      <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                        {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                      </h3>
                      {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                    </div>
                  </div>
                  {renderDivider()}
                </Fragment>
              );
            }
            return null;
          }
          if (sectionId === 'maidOfHonor' && currentOrder.includes('bestMan')) {
            const bestIndex = currentOrder.indexOf('bestMan');
            const maidIndex = currentOrder.indexOf('maidOfHonor');
            
            if (bestIndex < maidIndex) {
              return null;
            }
            return (
              <Fragment key={sectionId}>
                {renderDivider()}
                <div key="bestManMaid" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("BEST MAN", entourage.bestMan?.titleCustom)}
                    </h3>
                    {renderSingleNameField(entourage.bestMan?.name || "", "entourage.bestMan.name")}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("MAID OF HONOR", entourage.maidOfHonor?.titleCustom)}
                    </h3>
                    {renderSingleNameField(entourage.maidOfHonor?.name || "", "entourage.maidOfHonor.name")}
                  </div>
                </div>
                {renderDivider()}
              </Fragment>
            );
          }
          
          // Handle paired sections - ushers and usherettes
          if (sectionId === 'ushers' && currentOrder.includes('usherettes')) {
            const usheretteIndex = currentOrder.indexOf('usherettes');
            const usherIndex = currentOrder.indexOf('ushers');
            
            if (usheretteIndex > usherIndex) {
              return (
                <div key="ushersUsherettes" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                    </h3>
                    {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.ushers.names", false)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                    </h3>
                    {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.usherettes.names", false)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }
          if (sectionId === 'usherettes' && currentOrder.includes('ushers')) {
            const usherIndex = currentOrder.indexOf('ushers');
            const usheretteIndex = currentOrder.indexOf('usherettes');
            
            if (usherIndex < usheretteIndex) {
              return null;
            }
            return (
              <div key="ushersUsherettes" className="flex justify-between mb-6">
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("USHERS", entourage.ushers?.titleCustom)}
                  </h3>
                  {(entourage.ushers?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.ushers.names", false)}
                    </div>
                  ))}
                </div>
                <div className="text-left flex-1 pl-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("USHERETTES", entourage.usherettes?.titleCustom)}
                  </h3>
                  {(entourage.usherettes?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.usherettes.names", false)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          // Handle paired sections - groomsmen and bridesmaids
          if (sectionId === 'groomsmen' && currentOrder.includes('bridesmaids')) {
            const bridesmaidIndex = currentOrder.indexOf('bridesmaids');
            const groomsmanIndex = currentOrder.indexOf('groomsmen');
            
            if (bridesmaidIndex > groomsmanIndex) {
              return (
                <div key="groosmenBridesmaids" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                    </h3>
                    {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                    </h3>
                    {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }
          if (sectionId === 'bridesmaids' && currentOrder.includes('groomsmen')) {
            const groomsmanIndex = currentOrder.indexOf('groomsmen');
            const bridesmaidIndex = currentOrder.indexOf('bridesmaids');
            
            if (groomsmanIndex < bridesmaidIndex) {
              return null;
            }
            return (
              <div key="groosmenBridesmaids" className="flex justify-between mb-6">
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("GROOMSMEN", entourage.groomsmen?.titleCustom)}
                  </h3>
                  {(entourage.groomsmen?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.groomsmen.names", false)}
                    </div>
                  ))}
                </div>
                <div className="text-left flex-1 pl-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("BRIDESMAIDS", entourage.bridesmaids?.titleCustom)}
                  </h3>
                  {(entourage.bridesmaids?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.bridesmaids.names", false)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          // Handle paired sections - jrGroomsmen and jrBridesmaid
          if (sectionId === 'jrGroomsmen' && currentOrder.includes('jrBridesmaid')) {
            const jrBridesmaidIndex = currentOrder.indexOf('jrBridesmaid');
            const jrGroomsmanIndex = currentOrder.indexOf('jrGroomsmen');
            
            if (jrBridesmaidIndex > jrGroomsmanIndex) {
              return (
                <div key="jrGroomsmenJrBridesmaids" className="flex justify-between mb-6">
                  <div className="text-right flex-1 pr-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                    </h3>
                    {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left flex-1 pl-4">
                    <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                      {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                    </h3>
                    {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                      <div key={i} className="mb-1">
                        {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }
          if (sectionId === 'jrBridesmaid' && currentOrder.includes('jrGroomsmen')) {
            const jrGroomsmanIndex = currentOrder.indexOf('jrGroomsmen');
            const jrBridesmaidIndex = currentOrder.indexOf('jrBridesmaid');
            
            if (jrGroomsmanIndex < jrBridesmaidIndex) {
              return null;
            }
            return (
              <div key="jrGroomsmenJrBridesmaids" className="flex justify-between mb-6">
                <div className="text-right flex-1 pr-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("JR GROOMSMEN", entourage.jrGroomsmen?.titleCustom)}
                  </h3>
                  {(entourage.jrGroomsmen?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.jrGroomsmen.names", false)}
                    </div>
                  ))}
                </div>
                <div className="text-left flex-1 pl-4">
                  <h3 className="mb-2 whitespace-nowrap" style={{ fontFamily: mergedEntourage.titlesTypography || data.headingFont, color: mergedEntourage.titlesColor || data.mainColor2, fontSize: `${(mergedEntourage.titlesFontSize || 100)}%` }}>
                    {renderTitle("JR BRIDESMAIDS", entourage.jrBridesmaid?.titleCustom)}
                  </h3>
                  {(entourage.jrBridesmaid?.names || [""]).map((name: string, i: number) => (
                    <div key={i} className="mb-1">
                      {renderPersonName(name, i, "entourage.jrBridesmaid.names", false)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          return (
            <Fragment key={sectionId}>
              {sectionRenderer()}
            </Fragment>
          );
        };
        
        return renderPaperContainer(
          <>
            {renderDivider()}
            {page3VisibleSections.map(renderSection)}

            {/* Left arrow to go to page 2 - only in edit mode */}
            {editMode && (
              <button
                onClick={() => setCurrentPage(2)}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="Previous page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
          </>,
          3, // page number
          3 // total pages (if we're on page 3, there must be 3 pages)
        );
      })()}

      {/* Spacer below page 3 paper container */}
      {currentPage === 3 && <div style={{ height: '50px' }} />}
    </div>

      {/* Entourage List Settings Panel */}
      {showSettingsPanel && (
        <>
          {/* Backdrop */}
          {!isClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleEntourageClosePanel} onWheel={handleEntourageClosePanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
            }`}
            style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh", opacity: isSliderHeld ? 0.1 : 1 }}
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
                Entourage List Settings
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Typography Section */}
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Typography</h4>
                
                {/* Titles Typography */}
                <HybridFontControl
                  label="Titles"
                  value={mergedEntourage.titlesTypography || data.headingFont}
                  onChange={(value) => handleEntourageChange("titlesTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedFonts={predefinedHeadingFonts}
                />
                
                {/* Titles Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Titles Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedEntourage.titlesFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedEntourage.titlesFontSize || 100}
                    onChange={(e) => handleEntourageChange("titlesFontSize", parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedEntourage.titlesFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedEntourage.titlesFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Names Typography */}
                <HybridFontControl
                  label="Names"
                  value={mergedEntourage.namesTypography || data.bodyFont}
                  onChange={(value) => handleEntourageChange("namesTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
                
                {/* Names Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Names Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedEntourage.namesFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedEntourage.namesFontSize || 100}
                    onChange={(e) => handleEntourageChange("namesFontSize", parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedEntourage.namesFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedEntourage.namesFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Colors</h4>
                <ColorControl
                  label="Titles Color"
                  value={mergedEntourage.titlesColor || data.mainColor2}
                  onChange={(value) => handleEntourageChange("titlesColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />
                <ColorControl
                  label="Names Color"
                  value={mergedEntourage.namesColor || data.mainColor2}
                  onChange={(value) => handleEntourageChange("namesColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />
              </div>

              {/* Paper Container */}
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Paper Container</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Paper Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedEntourage.paperHeightAdjustment || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="1"
                    value={mergedEntourage.paperHeightAdjustment || 0}
                    onChange={(e) => handleEntourageChange("paperHeightAdjustment", parseInt(e.target.value))}
                    onMouseDown={() => setIsSliderHeld(true)}
                    onMouseUp={() => setIsSliderHeld(false)}
                    onMouseLeave={() => setIsSliderHeld(false)}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedEntourage.paperHeightAdjustment || 0) + 5) / 10 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedEntourage.paperHeightAdjustment || 0) + 5) / 10 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Paper Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedEntourage.paperColor || "#ffffff"}
                        onChange={(e) => handleEntourageChange("paperColor", e.target.value)}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedEntourage.paperColor || "#ffffff"}
                      onChange={(e) => handleEntourageChange("paperColor", e.target.value)}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Paper Background</label>
                  <select
                    value={entourage.paperBackground || "none"}
                    onChange={(e) => handleEntourageChange("paperBackground", e.target.value as "texture1" | "texture2" | "texture3" | "texture4" | "texture5" | "custom" | "none")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  >
                    <option value="none">None</option>
                    <option value="texture1">Texture 1</option>
                    <option value="texture2">Texture 2</option>
                    <option value="texture3">Texture 3</option>
                    <option value="texture4">Texture 4</option>
                    <option value="texture5">Texture 5</option>
                    <option value="custom">Custom Image</option>
                  </select>
                  {entourage.paperBackground === "custom" && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={entourage.paperBackgroundCustom || ""}
                        onChange={(e) => handleEntourageChange("paperBackgroundCustom", e.target.value)}
                        placeholder="Paste custom image URL here..."
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                      />
                    </div>
                  )}
                  {(entourage.paperBackground && entourage.paperBackground !== "none") && (
                    <>
                      {desktopMode && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Zoom</label>
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedEntourage.paperBackgroundZoom || 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={mergedEntourage.paperBackgroundZoom || 100}
                            onChange={(e) => handleEntourageChange("paperBackgroundZoom", parseInt(e.target.value))}
                            onMouseDown={() => setIsSliderHeld(true)}
                            onMouseUp={() => setIsSliderHeld(false)}
                            onMouseLeave={() => setIsSliderHeld(false)}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                              accentColor: accentColor,
                              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedEntourage.paperBackgroundZoom || 100) - 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedEntourage.paperBackgroundZoom || 100) - 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>BACKGROUND VERTICAL POSITION</label>
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedEntourage.paperBackgroundYPosition || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="150"
                            value={mergedEntourage.paperBackgroundYPosition || 0}
                            onChange={(e) => handleEntourageChange("paperBackgroundYPosition", parseInt(e.target.value))}
                            onMouseDown={() => setIsSliderHeld(true)}
                            onMouseUp={() => setIsSliderHeld(false)}
                            onMouseLeave={() => setIsSliderHeld(false)}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                              accentColor: accentColor,
                              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedEntourage.paperBackgroundYPosition || 0) + 50) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedEntourage.paperBackgroundYPosition || 0) + 50) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                            }}
                          />
                        </div>
                      </>
                    )}
                    </>
                  )}
                </div>
              </div>


              {/* Instruction text - only in desktop mode, inside scrollable area */}
              {desktopMode && (
                <div className="px-5 pt-2 pb-4">
                  <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    You can change the names in Sections tab → Entourage
                  </p>
                </div>
              )}
            </div>

            {/* Instruction text - only in mobile mode, outside scrollable area */}
            {!desktopMode && (
              <div className="px-5 pt-2 pb-4 shrink-0">
                <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  You can change the names in Sections tab → Entourage
                </p>
              </div>
            )}

            {/* Close button - outside scrollable area */}
            <div className="px-5 py-3 shrink-0 border-t flex items-center justify-end" style={{ borderColor: isDarkMode ? "#374151" : "#F3F4F6" }}>
              <button
                onClick={handleEntourageClosePanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:brightness-90"
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

      {/* Entourage Section Design Typography Panel */}
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
                Entourage - Section Design
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
                      value={mergedData.entourageHeading ?? ""}
                      onChange={(e) => handleChange("entourageHeading", e.target.value)}
                      placeholder="Wedding Entourage"
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedHeadings = [
                          "Wedding Entourage",
                          "Our Wedding Party",
                          "The Wedding Party",
                          "Our Entourage",
                          "Bridal Party",
                          "Wedding Party",
                          "Our Special People"
                        ];
                        const currentIndex = predefinedHeadings.indexOf(mergedData.entourageHeading ?? "");
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                        handleChange("entourageHeading", predefinedHeadings[nextIndex]);
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
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Top Text</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedEntourage.topTextCustom ?? ""}
                      onChange={(e) => handleEntourageChange("topTextCustom", e.target.value)}
                      placeholder={`Those who stand with ${data.hisName || "Groom"} & ${data.herName || "Bride"}`}
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedTexts = [
                          `Those who stand with ${data.hisName || "Groom"} & ${data.herName || "Bride"}`,
                          "With Love, From Our Closest Friends",
                          "The Ones Who Brought Us Together",
                          "The Marriage Attendants",
                          "Gathered in Love by Our Side",
                          "The Foundation of Our Circle",
                          "The Co-Stars of Our Day",
                          "The Hearts Behind the Vows",
                          `${data.hisName || "Groom"} & ${data.herName || "Bride"}'s Wedding Squad`,
                          `The I Do Crew of ${data.hisName || "Groom"} & ${data.herName || "Bride"}`
                        ];
                        const currentText = mergedEntourage.topTextCustom || predefinedTexts[0];
                        const currentIndex = predefinedTexts.indexOf(currentText);
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedTexts.length - 1 ? 0 : currentIndex + 1;
                        handleEntourageChange("topTextCustom", predefinedTexts[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Generate text"
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
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE (Heading)</label>
                  <HybridFontControl
                    label=""
                    value={mergedData.entourageHeadingTypography || data.headingFont}
                    onChange={(value) => handleChange("entourageHeadingTypography", value)}
                    type="heading"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.entourageUseMainColor !== false}
                    predefinedFonts={predefinedHeadingFonts}
                  />
                </div>
                
                {/* Heading Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.entourageHeadingFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.entourageHeadingFontSize || 100}
                    onChange={(e) => handleChange("entourageHeadingFontSize", parseInt(e.target.value))}
                    disabled={mergedData.entourageUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.entourageHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.entourageHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Heading Color */}
                <ColorControl
                  label="Heading Color"
                  value={mergedData.entourageHeadingColor || data.mainColor2}
                  onChange={(value) => handleChange("entourageHeadingColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={data.entourageUseMainColor !== false}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

              {/* Message Section */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
                
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Bottom Text</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedEntourage.bottomTextCustom ?? ""}
                      onChange={(e) => handleEntourageChange("bottomTextCustom", e.target.value)}
                      placeholder="Honoring those who share in our joy"
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedTexts = [
                          "Honoring those who share in our joy",
                          "Forever grateful for your love and guidance",
                          "Our biggest inspirations and guides",
                          "With us for a lifetime",
                          "Rooted in love and friendship",
                          "For your endless support and laughter",
                          "Celebrating the love that surrounds us",
                          "With deepest gratitude for your presence",
                          "Our ultimate support system",
                          "The anchors of our lives"
                        ];
                        const currentText = mergedEntourage.bottomTextCustom || predefinedTexts[0];
                        const currentIndex = predefinedTexts.indexOf(currentText);
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedTexts.length - 1 ? 0 : currentIndex + 1;
                        handleEntourageChange("bottomTextCustom", predefinedTexts[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Generate text"
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
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE (Bottom Text)</label>
                  <HybridFontControl
                    label=""
                    value={mergedData.entourageBottomTextTypography || data.bodyFont}
                    onChange={(value) => handleChange("entourageBottomTextTypography", value)}
                    type="body"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.entourageUseMainColor !== false}
                    predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                  />
                </div>
                
                {/* Message Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.entourageBottomTextFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.entourageBottomTextFontSize || 100}
                    onChange={(e) => handleChange("entourageBottomTextFontSize", parseInt(e.target.value))}
                    disabled={mergedData.entourageUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.entourageBottomTextFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.entourageBottomTextFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Message Color */}
                <ColorControl
                  label="Message Color"
                  value={mergedData.entourageBottomTextColor || data.mainColor2}
                  onChange={(value) => handleChange("entourageBottomTextColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={data.entourageUseMainColor !== false}
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
                    value={mergedData.entourageBackgroundType || "color"}
                    onChange={(e) => handleChange("entourageBackgroundType", e.target.value)}
                    disabled={mergedData.entourageUseMainColor !== false}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="color">Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                {/* Gradient Overlay */}
                {(mergedData.entourageBackgroundType === "image" || mergedData.entourageBackgroundType === "video") && (
                  <div className="space-y-4">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={mergedData.entourageGradient?.firstColor || "#ffffff"}
                              onChange={(e) => handleChange("entourageGradient", { ...mergedData.entourageGradient, firstColor: e.target.value })}
                              disabled={mergedData.entourageUseMainColor !== false}
                              className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                          </div>
                          <input
                            type="text"
                            value={mergedData.entourageGradient?.firstColor || "#ffffff"}
                            onChange={(e) => {
                              let value = e.target.value;
                              if (value && !value.startsWith('#')) {
                                value = '#' + value;
                              }
                              handleChange("entourageGradient", { ...mergedData.entourageGradient, firstColor: value });
                            }}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="#000000"
                            maxLength={7}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={mergedData.entourageGradient?.firstOpacity || 50}
                            onChange={(e) => handleChange("entourageGradient", { ...mergedData.entourageGradient, firstOpacity: parseInt(e.target.value) })}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            style={{
                              accentColor: accentColor,
                              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.entourageGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.entourageGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                            }}
                          />
                          <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.entourageGradient?.firstOpacity || 50}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={mergedData.entourageGradient?.secondColor || "#ffffff"}
                              onChange={(e) => handleChange("entourageGradient", { ...mergedData.entourageGradient, secondColor: e.target.value })}
                              disabled={mergedData.entourageUseMainColor !== false}
                              className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                          </div>
                          <input
                            type="text"
                            value={mergedData.entourageGradient?.secondColor || "#ffffff"}
                            onChange={(e) => {
                              let value = e.target.value;
                              if (value && !value.startsWith('#')) {
                                value = '#' + value;
                              }
                              handleChange("entourageGradient", { ...mergedData.entourageGradient, secondColor: value });
                            }}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="#000000"
                            maxLength={7}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={mergedData.entourageGradient?.secondOpacity || 50}
                            onChange={(e) => handleChange("entourageGradient", { ...mergedData.entourageGradient, secondOpacity: parseInt(e.target.value) })}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            style={{
                              accentColor: accentColor,
                              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.entourageGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.entourageGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                            }}
                          />
                          <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.entourageGradient?.secondOpacity || 50}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Option */}
                {mergedData.entourageBackgroundType === "color" && (
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.entourageBackgroundColor || "#ffffff"}
                          onChange={(e) => handleChange("entourageBackgroundColor", e.target.value)}
                          disabled={mergedData.entourageUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.entourageBackgroundColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("entourageBackgroundColor", value);
                        }}
                        disabled={mergedData.entourageUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                )}

                {/* Gradient Option */}
                {mergedData.entourageBackgroundType === "gradient" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.entourageGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("entourageGradient", { ...mergedData.entourageGradient, firstColor: e.target.value })}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.entourageGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("entourageGradient", { ...mergedData.entourageGradient, firstColor: value });
                          }}
                          disabled={mergedData.entourageUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                            value={mergedData.entourageGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("entourageGradient", { ...mergedData.entourageGradient, secondColor: e.target.value })}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.entourageGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("entourageGradient", { ...mergedData.entourageGradient, secondColor: value });
                          }}
                          disabled={mergedData.entourageUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Option */}
                {mergedData.entourageBackgroundType === "image" && (
                  <div className="space-y-3">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                    {(mergedData.entourageImage?.urls || [""]).map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...(mergedData.entourageImage?.urls || [""])];
                              newUrls[index] = e.target.value;
                              handleChange("entourageImage", { urls: newUrls });
                            }}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="https://example.com/image.jpg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                              setPredefinedImageIndex(nextIndex);
                              const newUrls = [...(mergedData.entourageImage?.urls || [""])];
                              newUrls[index] = predefinedImages[nextIndex]?.value || "";
                              handleChange("entourageImage", { urls: newUrls });
                            }}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                        {(mergedData.entourageImage?.urls?.length || 1) > 1 && (
                          <button
                            onClick={() => {
                              const newUrls = mergedData.entourageImage?.urls.filter((_, i) => i !== index) || [];
                              handleChange("entourageImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                            }}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        {index === (mergedData.entourageImage?.urls?.length || 1) - 1 && (mergedData.entourageImage?.urls?.length || 1) < 5 && (
                          <button
                            onClick={() => {
                              const newUrls = [...(mergedData.entourageImage?.urls || [""]), ""];
                              handleChange("entourageImage", { urls: newUrls });
                            }}
                            disabled={mergedData.entourageUseMainColor !== false}
                            className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                {mergedData.entourageBackgroundType === "video" && (
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={mergedData.entourageVideo?.url || ""}
                        onChange={(e) => handleChange("entourageVideo", { url: e.target.value })}
                        disabled={mergedData.entourageUseMainColor !== false}
                        className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="https://example.com/video.mp4"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                          setPredefinedVideoIndex(nextIndex);
                          handleChange("entourageVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                        }}
                        disabled={mergedData.entourageUseMainColor !== false}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.entourageUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    id="entourageUseMainColor"
                    checked={mergedData.entourageUseMainColor !== false}
                    onChange={(e) => handleChange("entourageUseMainColor", e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => handleChange("entourageUseMainColor", !(mergedData.entourageUseMainColor !== false))}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${ mergedData.entourageUseMainColor !== false ? "border-[currentColor] bg-[currentColor]" : "border-gray-300 bg-white" }`}
                    style={{
                      color: accentColor
                    }}
                  >
                    {mergedData.entourageUseMainColor !== false && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <label htmlFor="entourageUseMainColor" className={`text-sm cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
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

      {/* Print Settings Panel - only show in non-builder mode */}
      {!editMode && showPrintSettings && (
        <>
          {/* Backdrop */}
          {!isPrintSettingsClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleClosePrintSettings} onWheel={handleClosePrintSettings} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col backdrop-blur-xl bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-700/20 ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isPrintSettingsClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isPrintSettingsClosing ? "animate-slide-down" : "animate-slide-up"}`
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
                Pre-print Settings
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Remove Round Corners Toggle */}
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Remove Round Corners
                </label>
                <button
                  onClick={() => setRemoveRoundCorners(!removeRoundCorners)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ removeRoundCorners ? "bg-[#B88A78]" : (isDarkMode ? "bg-gray-600" : "bg-gray-200") }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ removeRoundCorners ? "translate-x-6" : "translate-x-1" }`}
                  />
                </button>
              </div>


              {/* Remove Shadows Toggle */}
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Remove Shadows
                </label>
                <button
                  onClick={() => setRemoveShadows(!removeShadows)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ removeShadows ? "bg-[#B88A78]" : (isDarkMode ? "bg-gray-600" : "bg-gray-200") }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ removeShadows ? "translate-x-6" : "translate-x-1" }`}
                  />
                </button>
              </div>


              {/* Remove Page Number Toggle */}
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Remove Page Number
                </label>
                <button
                  onClick={() => {
                  console.log('Toggle removePageNumber from', removePageNumber, 'to', !removePageNumber);
                  setRemovePageNumber(!removePageNumber);
                }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ removePageNumber ? "bg-[#B88A78]" : (isDarkMode ? "bg-gray-600" : "bg-gray-200") }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ removePageNumber ? "translate-x-6" : "translate-x-1" }`}
                  />
                </button>
              </div>


              {/* Temporary Resize Text Slider */}
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  <span>Temporary Resize Text:</span>
                  <span>{tempTextResize}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={tempTextResize}
                  onChange={(e) => setTempTextResize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  style={{ 
                    accentColor: "#B88A78",
                    background: `linear-gradient(to right, #B88A78 0%, #B88A78 ${(tempTextResize - 20) / 180 * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} ${(tempTextResize - 20) / 180 * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} 100%)`
                  }}
                />
              </div>

              {/* Temporary Background Zoom Slider */}
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  <span>Temporary Background Zoom:</span>
                  <span>{tempBackgroundZoom}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={tempBackgroundZoom}
                  onChange={(e) => setTempBackgroundZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  style={{ 
                    accentColor: "#B88A78",
                    background: `linear-gradient(to right, #B88A78 0%, #B88A78 ${(tempBackgroundZoom - 50) / 100 * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} ${(tempBackgroundZoom - 50) / 100 * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} 100%)`
                  }}
                />
              </div>

              {/* Temporary Background Y-Position Slider */}
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  <span>Temporary Background Y-Position:</span>
                  <span>{tempBackgroundYPosition}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="150"
                  value={tempBackgroundYPosition}
                  onChange={(e) => setTempBackgroundYPosition(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  style={{ 
                    accentColor: "#B88A78",
                    background: `linear-gradient(to right, #B88A78 0%, #B88A78 ${(tempBackgroundYPosition + 50) / 200 * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} ${(tempBackgroundYPosition + 50) / 200 * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} 100%)`
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelPrint}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBeginPrinting}
                  className="flex-1 px-4 py-3 rounded-lg transition-colors bg-[#B88A78] text-white hover:bg-[#9a7666]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Begin Printing
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default EntourageSection;
