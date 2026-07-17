"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import type { InvitationData, WeddingDirectoryItem } from "@/lib/types/invitation";
import Divider from "./Divider";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import HybridDropdown from "@/components/shared/HybridDropdown";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";
import { HOST_LINE_MESSAGES, CLOSING_SENTIMENT_MESSAGES, CUSTOM_CARD_MESSAGES, resolveCustomCardMessage, getNextMessage } from "@/lib/constants/heroMessages";

const STAMP_TEXT_BLEND_MODES = [
  { name: "Normal", value: "normal" },
  { name: "Multiply", value: "multiply" },
  { name: "Screen", value: "screen" },
  { name: "Overlay", value: "overlay" },
  { name: "Soft Light", value: "soft-light" },
  { name: "Hard Light", value: "hard-light" },
  { name: "Color Dodge", value: "color-dodge" },
  { name: "Color Burn", value: "color-burn" },
  { name: "Difference", value: "difference" },
  { name: "Exclusion", value: "exclusion" },
  { name: "Hue", value: "hue" },
  { name: "Saturation", value: "saturation" },
  { name: "Color", value: "color" },
  { name: "Luminosity", value: "luminosity" },
];

const BUILDER_INSTRUCTIONS = [
  "Tap the feather to add, browse designs, and assign a navigation target.",
  "Press and hold any design to delete it.",
  "You can also tap the feather icon below to remove items.",
  "Tap different parts of a design to customize them.",
  "For example: Tap the flowers to change",
  "Tap the envelope itself to change the entire style.",
  "Tap on text parts like the wax, celebrant name, or custom text to open options like changing text color.",
  "Tap the photo slot to change from the media.",
  "Tap the cards to try out a new look.",
  "Make your page truly yours in just a few clicks!",
];

interface WeddingDirectorySectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
  editMode?: boolean;
}

export default function WeddingDirectorySection({ data, onChange, panelPosition = "left", desktopMode = false, editMode = false }: WeddingDirectorySectionProps) {
  if (!data.sections.weddingdirectory) return null;

  const { isDarkMode, accentColor } = useTheme();
  const { options: headingFonts } = usePredefinedOptions("heading_fonts");
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [showDraftDesignPanel, setShowDraftDesignPanel] = useState(false);
  const [isDraftDesignPanelClosing, setIsDraftDesignPanelClosing] = useState(false);
  const [expandedDraftItemId, setExpandedDraftItemId] = useState<string | null>(null);
  const [draftShadowEnabled, setDraftShadowEnabled] = useState(data.weddingDirectoryDraftShadowEnabled ?? true);
  const [draftShadowExpanded, setDraftShadowExpanded] = useState(false);
  const [draftShadowVisibility, setDraftShadowVisibility] = useState(data.weddingDirectoryDraftShadowVisibility ?? 50);
  const [draftShadowBlur, setDraftShadowBlur] = useState(data.weddingDirectoryDraftShadowBlur ?? 10);
  const [draftShadowOffsetX, setDraftShadowOffsetX] = useState(data.weddingDirectoryDraftShadowOffsetX ?? 0);
  const [draftShadowOffsetY, setDraftShadowOffsetY] = useState(data.weddingDirectoryDraftShadowOffsetY ?? 5);
  const [scaleMode, setScaleMode] = useState<"mobile" | "desktop">("mobile");
  const [positionMode, setPositionMode] = useState<"mobile" | "desktop">("mobile");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);
  const [directoryItems, setDirectoryItems] = useState<WeddingDirectoryItem[]>(data.weddingDirectoryItems || []);
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
  const imageObserverRef = useRef<IntersectionObserver | null>(null);
  const observedImagesRef = useRef<Set<Element>>(new Set());
  const [showItemSettingsPanel, setShowItemSettingsPanel] = useState(false);
  const [isItemSettingsClosing, setIsItemSettingsClosing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isEditingMobileScale, setIsEditingMobileScale] = useState(true);
  const [flowerVariantCount, setFlowerVariantCount] = useState<number>(1);
  const [outlineVariantCount, setOutlineVariantCount] = useState<number>(1);
  const [cardVariantCount, setCardVariantCount] = useState<number>(1);
  const [squareCardVariantCount, setSquareCardVariantCount] = useState<number>(1);
  const [photoPickerItemId, setPhotoPickerItemId] = useState<string | null>(null);
  const [isPhotoPickerClosing, setIsPhotoPickerClosing] = useState(false);
  const [builderInstructionIndex, setBuilderInstructionIndex] = useState(0);
  const [hideInstructions, setHideInstructions] = useState(false);

  useEffect(() => {
    const loadHideInstructions = () => {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setHideInstructions(parsed.hideInstructions ?? false);
        } catch {}
      }
    };
    loadHideInstructions();
    window.addEventListener('storage', loadHideInstructions);
    return () => window.removeEventListener('storage', loadHideInstructions);
  }, []);
  const [itemAnimStates, setItemAnimStates] = useState<Record<string, {
    nameBlur: number;
    nameGlow: number;
    typewriterFirstName: string;
    typewriterSecondName: string;
    typewriterCustomText: string;
    fadeSlideOpacity: number;
    fadeSlideTranslateY: number;
    cardOpacity: number;
    cardTranslateY: number;
    paper1Opacity: number;
    paper1TranslateY: number;
    paper2Opacity: number;
    paper2TranslateY: number;
  }>>({});
  const animationCancelRef = useRef<Record<string, { cancelled: boolean }>>({});
  const prevVisibleImageIdsRef = useRef<Set<string>>(new Set());
  const prevShowItemSettingsPanelRef = useRef(false);
  const prevDataRef = useRef(data);
  const prevDirectoryItemsRef = useRef(directoryItems);
  const longPressRef = useRef<Record<string, { timer: ReturnType<typeof setTimeout> | null; triggered: boolean }>>({});
  const DEFAULT_ANIM_STATE = {
    nameBlur: 20,
    nameGlow: 30,
    typewriterFirstName: "",
    typewriterSecondName: "",
    typewriterCustomText: "",
    fadeSlideOpacity: 0,
    fadeSlideTranslateY: 20,
    cardOpacity: 0,
    cardTranslateY: 30,
    paper1Opacity: 0,
    paper1TranslateY: 30,
    paper2Opacity: 0,
    paper2TranslateY: 30,
  };
  const getAnimState = (id: string) => itemAnimStates[id] || { ...DEFAULT_ANIM_STATE, paper1Opacity: 0, paper1TranslateY: 30, paper2Opacity: 0, paper2TranslateY: 30 };

  const getFinalAnimState = (item: WeddingDirectoryItem) => {
    const isCustomCard = item.draftDesignType === "custom-card" || item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square";
    const firstName = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
    const secondName = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");
    return {
      nameBlur: 0,
      nameGlow: 0,
      typewriterFirstName: isCustomCard ? "" : firstName,
      typewriterSecondName: isCustomCard ? "" : secondName,
      typewriterCustomText: isCustomCard ? (item.customText || "Your custom text here") : "",
      fadeSlideOpacity: 1,
      fadeSlideTranslateY: 0,
      cardOpacity: 1,
      cardTranslateY: 0,
      paper1Opacity: 1,
      paper1TranslateY: 0,
      paper2Opacity: 1,
      paper2TranslateY: 0,
    };
  };

  const scrollToTargetSection = (item: WeddingDirectoryItem) => {
    if (!item.targetSection || item.targetSection === "no-target") return;
    const sectionId = item.targetSection === "event-details" ? "event-details-cssid"
      : item.targetSection === "rsvp" ? "rsvp-cssid"
      : item.targetSection === "gallery" ? "gallery-cssid"
      : item.targetSection === "map" ? "map-cssid"
      : item.targetSection === "timeline" ? "timeline-cssid"
      : item.targetSection === "countdown" ? "countdown-cssid"
      : item.targetSection === "dresscode" ? "dresscode-cssid"
      : item.targetSection === "giftguide" ? "gift-guide-cssid"
      : item.targetSection === "entourage" ? "entourage-cssid"
      : null;
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClosePhotoPicker = () => {
    setIsPhotoPickerClosing(true);
    setTimeout(() => {
      setPhotoPickerItemId(null);
      setIsPhotoPickerClosing(false);
    }, 300);
  };

  const resolveGalleryUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/")) return url;
    return `/stock/gallery/${url}`;
  };

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const [flowerCount, outlineCount, cardCount, squareCardCount] = await Promise.all([detectFlowerVariantCount(), detectOutlineVariantCount(), detectCardVariantCount(), detectSquareCardVariantCount()]);
      if (!cancelled) {
        setFlowerVariantCount(flowerCount);
        setOutlineVariantCount(outlineCount);
        setCardVariantCount(cardCount);
        setSquareCardVariantCount(squareCardCount);
      }
    };
    detect();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBuilderInstructionIndex(prev => (prev + 1) % BUILDER_INSTRUCTIONS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dataChanged = prevDataRef.current !== data;
    const directoryItemsChanged = prevDirectoryItemsRef.current !== directoryItems;
    const prevShowItemSettingsPanel = prevShowItemSettingsPanelRef.current;

    // When the settings panel closes, treat all currently visible items as newly visible
    // so they animate when returning from the static editing state.
    if (prevShowItemSettingsPanel && !showItemSettingsPanel) {
      prevVisibleImageIdsRef.current = new Set();
    }

    const invitationItems = directoryItems.filter(item => item.draftDesignType === "envelope" || item.draftDesignType === "invitation" || item.draftDesignType === "invitation-landscape" || item.draftDesignType === "custom-card" || item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square" || item.draftDesignType === "photo-papers");

    invitationItems.forEach((item) => {
      const itemId = item.id;
      const isVisible = visibleImageIds.has(itemId);
      const animationType = item.textAnimation || "blur-glow";
      const isNewlyVisible = isVisible && !prevVisibleImageIdsRef.current.has(itemId);

      const updateAnim = (partial: Partial<typeof DEFAULT_ANIM_STATE>) => {
        setItemAnimStates(prev => ({
          ...prev,
          [itemId]: { ...(prev[itemId] || DEFAULT_ANIM_STATE), ...partial }
        }));
      };

      const cancelExisting = () => {
        if (animationCancelRef.current[itemId]) {
          animationCancelRef.current[itemId].cancelled = true;
        }
      };

      if (!isVisible) {
        cancelExisting();
        updateAnim({ ...DEFAULT_ANIM_STATE });
        return;
      }

      if (showItemSettingsPanel || showDraftDesignPanel || expandedDraftItemId) {
        cancelExisting();
        const finalState = getFinalAnimState(item);
        const currentState = getAnimState(itemId);
        const hasChanged = (Object.keys(finalState) as Array<keyof typeof DEFAULT_ANIM_STATE>).some(
          (key) => currentState[key] !== finalState[key]
        );
        if (hasChanged) updateAnim(finalState);
        return;
      }

      if (isNewlyVisible) {
        cancelExisting();
        const flag = { cancelled: false };
        animationCancelRef.current[itemId] = flag;

        // Card-level animation - slide up + fade in
        let cardTranslateYVal = 30;
        const animateCard = () => {
          if (flag.cancelled) return;
          if (cardTranslateYVal > 0) {
            cardTranslateYVal -= 0.8;
            const cardOpacity = Math.min(1, Math.max(0, 1 - cardTranslateYVal / 30));
            updateAnim({ cardOpacity, cardTranslateY: cardTranslateYVal });
            requestAnimationFrame(animateCard);
          } else {
            updateAnim({ cardOpacity: 1, cardTranslateY: 0 });
          }
        };
        updateAnim({ cardOpacity: 0, cardTranslateY: 30 });
        animateCard();

        // Separate photo-paper animations with stagger
        if (item.draftDesignType === "photo-papers") {
          let paper1TranslateYVal = 30;
          let paper2TranslateYVal = 30;

          const animatePaper1 = () => {
            if (flag.cancelled) return;
            if (paper1TranslateYVal > 0) {
              paper1TranslateYVal -= 0.6;
              const paper1Opacity = Math.min(1, Math.max(0, 1 - paper1TranslateYVal / 30));
              updateAnim({ paper1Opacity, paper1TranslateY: paper1TranslateYVal });
              requestAnimationFrame(animatePaper1);
            } else {
              updateAnim({ paper1Opacity: 1, paper1TranslateY: 0 });
            }
          };

          const animatePaper2 = () => {
            if (flag.cancelled) return;
            if (paper2TranslateYVal > 0) {
              paper2TranslateYVal -= 0.6;
              const paper2Opacity = Math.min(1, Math.max(0, 1 - paper2TranslateYVal / 30));
              updateAnim({ paper2Opacity, paper2TranslateY: paper2TranslateYVal });
              requestAnimationFrame(animatePaper2);
            } else {
              updateAnim({ paper2Opacity: 1, paper2TranslateY: 0 });
            }
          };

          updateAnim({ paper1Opacity: 0, paper1TranslateY: 30, paper2Opacity: 0, paper2TranslateY: 30 });
          setTimeout(() => { if (!flag.cancelled) animatePaper1(); }, 200);
          setTimeout(() => { if (!flag.cancelled) animatePaper2(); }, 500);
        }

        if (animationType === "blur-glow") {
          let blur = 20;
          let glow = 30;
          const animateBlur = () => {
            if (flag.cancelled) return;
            if (blur > 0 || glow > 0) {
              if (blur > 0) blur -= 1.0;
              if (glow > 0) glow -= 1.5;
              updateAnim({ nameBlur: blur, nameGlow: glow });
              requestAnimationFrame(animateBlur);
            } else {
              updateAnim({ nameBlur: 0, nameGlow: 0 });
            }
          };
          setTimeout(() => { if (!flag.cancelled) animateBlur(); }, 300);
        } else if (animationType === "typewriter") {
          if (item.draftDesignType === "custom-card" || item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square") {
            const customText = item.customText || "Your custom text here";
            updateAnim({ typewriterCustomText: "" });
            let textIndex = 0;

            const animateCustomText = () => {
              if (flag.cancelled) return;
              if (textIndex < customText.length) {
                textIndex++;
                updateAnim({ typewriterCustomText: customText.slice(0, textIndex) });
                setTimeout(() => requestAnimationFrame(animateCustomText), 50);
              }
            };

            setTimeout(() => { if (!flag.cancelled) animateCustomText(); }, 300);
          } else {
            const firstName = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
            const secondName = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");

            // Start with empty strings for typewriter effect
            updateAnim({ typewriterFirstName: "", typewriterSecondName: "" });
            let firstIndex = 0;
            let secondIndex = 0;

            const animateSecondName = () => {
              if (flag.cancelled) return;
              if (secondIndex < secondName.length) {
                secondIndex++;
                updateAnim({ typewriterSecondName: secondName.slice(0, secondIndex) });
                setTimeout(() => requestAnimationFrame(animateSecondName), 50);
              }
            };

            const animateFirstName = () => {
              if (flag.cancelled) return;
              if (firstIndex < firstName.length) {
                firstIndex++;
                updateAnim({ typewriterFirstName: firstName.slice(0, firstIndex) });
                setTimeout(() => requestAnimationFrame(animateFirstName), 50);
              } else {
                setTimeout(() => requestAnimationFrame(animateSecondName), 200);
              }
            };

            setTimeout(() => { if (!flag.cancelled) animateFirstName(); }, 300);
          }
        } else if (animationType === "fade-slide") {
          // Slide only, no fade
          updateAnim({ fadeSlideOpacity: 1, fadeSlideTranslateY: 20 });
          let translateY = 20;
          const animateFadeSlide = () => {
            if (flag.cancelled) return;
            if (translateY > 0) {
              translateY -= 0.5;
              updateAnim({ fadeSlideOpacity: 1, fadeSlideTranslateY: translateY });
              requestAnimationFrame(animateFadeSlide);
            } else {
              updateAnim({ fadeSlideOpacity: 1, fadeSlideTranslateY: 0 });
            }
          };
          animateFadeSlide();
        }
        return;
      }

      if (dataChanged || directoryItemsChanged) {
        cancelExisting();
        const finalState = getFinalAnimState(item);
        const currentState = getAnimState(itemId);
        const hasChanged = (Object.keys(finalState) as Array<keyof typeof DEFAULT_ANIM_STATE>).some(
          (key) => currentState[key] !== finalState[key]
        );
        if (hasChanged) updateAnim(finalState);
        return;
      }
    });

    // Update prev refs for next run
    prevVisibleImageIdsRef.current = new Set(visibleImageIds);
    prevDataRef.current = data;
    prevDirectoryItemsRef.current = directoryItems;
    prevShowItemSettingsPanelRef.current = showItemSettingsPanel;
  }, [directoryItems, visibleImageIds, data, showItemSettingsPanel]);

  useEffect(() => {
    return () => {
      Object.values(animationCancelRef.current).forEach((flag) => { flag.cancelled = true; });
    };
  }, []);

  useEffect(() => {
    imageObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-wedding-dir-image") || entry.target.getAttribute("data-wedding-dir-flowers");
          if (!id) return;
          setVisibleImageIds((prev) => {
            const isVisible = prev.has(id);
            if (entry.isIntersecting === isVisible) return prev;
            const next = new Set(prev);
            if (entry.isIntersecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
            return next;
          });
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    return () => {
      imageObserverRef.current?.disconnect();
      imageObserverRef.current = null;
      observedImagesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const observer = imageObserverRef.current;
    if (!observer) return;
    document.querySelectorAll("[data-wedding-dir-image], [data-wedding-dir-flowers]").forEach((el) => {
      if (!observedImagesRef.current.has(el)) {
        observer.observe(el);
        observedImagesRef.current.add(el);
      }
    });
  }, [directoryItems]);

  // Keep local directoryItems in sync with external data changes (undo/redo, saved data load, etc.)
  // while avoiding unnecessary re-renders when the array reference is the same.
  const lastExternalItemsRef = useRef(data.weddingDirectoryItems);
  const isUpdatingFromExternalRef = useRef(false);
  useEffect(() => {
    const externalItems = data.weddingDirectoryItems;
    if (externalItems !== lastExternalItemsRef.current && !isUpdatingFromExternalRef.current) {
      lastExternalItemsRef.current = externalItems;
      // Only update if the external items are actually different (deep comparison)
      const currentItems = directoryItems;
      const external = externalItems || [];
      
      // Check if arrays have different lengths or different IDs
      if (currentItems.length !== external.length) {
        setDirectoryItems(external);
        return;
      }
      
      // Check if any item has different ID or key properties
      // When Draft Design panel is open, exclude transform/position/scale from comparison
      // to prevent external data from overriding user's slider changes
      const itemsChanged = currentItems.some((item, index) => {
        const extItem = external[index];
        if (!extItem || item.id !== extItem.id) return true;
        
        // If Draft Design panel is open, only compare structural properties
        if (showDraftDesignPanel) {
          return (
            item.draftDesignType !== extItem.draftDesignType ||
            item.targetSection !== extItem.targetSection ||
            item.pattern !== extItem.pattern ||
            item.flowerVariant !== extItem.flowerVariant ||
            item.cardVariant !== extItem.cardVariant ||
            item.imageUrl !== extItem.imageUrl ||
            item.coloredTextEnabled !== extItem.coloredTextEnabled ||
            item.coloredTextColor !== extItem.coloredTextColor
          );
        }
        
        // Otherwise, compare all properties including transform/position
        return (
          item.positionXMobile !== extItem.positionXMobile ||
          item.positionXDesktop !== extItem.positionXDesktop ||
          item.positionYMobile !== extItem.positionYMobile ||
          item.positionYDesktop !== extItem.positionYDesktop ||
          item.scaleMobile !== extItem.scaleMobile ||
          item.scaleDesktop !== extItem.scaleDesktop ||
          item.rotate !== extItem.rotate ||
          item.zIndex !== extItem.zIndex ||
          item.draftDesignType !== extItem.draftDesignType ||
          item.targetSection !== extItem.targetSection ||
          item.pattern !== extItem.pattern ||
          item.flowerVariant !== extItem.flowerVariant ||
          item.cardVariant !== extItem.cardVariant ||
          item.imageUrl !== extItem.imageUrl ||
          item.coloredTextEnabled !== extItem.coloredTextEnabled ||
          item.coloredTextColor !== extItem.coloredTextColor
        );
      });
      
      if (itemsChanged) {
        setDirectoryItems(external);
      }
    }
  }, [data.weddingDirectoryItems, directoryItems, showDraftDesignPanel]);

  const handleAddDirectoryItem = () => {
    const currentItems = directoryItems;
    if (currentItems.length >= 7) return;

    const newItem: WeddingDirectoryItem = {
      id: `weddir-item-${Date.now()}`,
      draftDesignType: "envelope",
      targetSection: "event-details",
      imageUrl: "",
      zIndex: currentItems.length + 1,
      rotate: 0,
      scaleMobile: 1,
      scaleDesktop: 1,
      pattern: "1",
      flowerVariant: 0,
      positionX: 0,
      positionY: 0,
      positionXMobile: 0,
      positionXDesktop: 0,
      positionYMobile: 0,
      positionYDesktop: 0,
      shadow: {
        enabled: false,
        color: "#000000",
        blur: 10,
        offsetX: 0,
        offsetY: 4,
      },
      layers: [
        { id: "body-1", designId: "default", tint: data.mainColor1, zIndex: 1 },
        { id: "body-2", designId: "default", tint: data.mainColor1, zIndex: 2 },
        { id: "outline", designId: "default", tint: data.mainColor1, zIndex: 3 },
      ],
      stampTint: data.mainColor1,
      stampTextColor: data.mainColor1,
      stampTextBlendMode: "screen",
      swapPhotoAndFlowers: false,
      cardVariant: 0,
      nameTextSize: 1,
      excludeTexts: false,
      hostLineText: HOST_LINE_MESSAGES[1],
      finalSentimentText: CLOSING_SENTIMENT_MESSAGES[1],
      textAnimation: "blur-glow",
      photoPapersText1: "",
      photoPapersText2: "",
      photoPapersTextColor: "#333333",
      photoPapersFontType: data.headingFont || "Playfair Display",
      photoPapersImage1: "",
      photoPapersImage2: "",
      animation: {
        type: "none",
        scrollTrigger: 50,
      },
    };

    const updatedItems = [...currentItems, newItem];
    setDirectoryItems(updatedItems);
    onChange?.("weddingDirectoryItems", updatedItems);
  };

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  const handleOpenItemSettings = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowItemSettingsPanel(true);
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
      itemElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCloseItemSettingsPanel = () => {
    setIsItemSettingsClosing(true);
    setTimeout(() => {
      setShowItemSettingsPanel(false);
      setIsItemSettingsClosing(false);
      setSelectedItemId(null);
    }, 300);
  };

  const handleItemChange = (itemId: string, key: keyof WeddingDirectoryItem, value: any) => {
    isUpdatingFromExternalRef.current = true;
    const currentItems = directoryItems;
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, [key]: value } : item
    );
    setDirectoryItems(updatedItems);
    onChange?.("weddingDirectoryItems", updatedItems);
    // Reset flag after a short delay to allow onChange to propagate
    setTimeout(() => {
      isUpdatingFromExternalRef.current = false;
    }, 100);
  };

  const handleDraftDesignTypeChange = (itemId: string, value: string | number) => {
    const currentItems = directoryItems;
    const newType = String(value);
    const isCustomCard = newType === "custom-card" || newType === "custom-card-portrait" || newType === "custom-card-square";
    const updatedItems = currentItems.map(item => {
      if (item.id !== itemId) return item;
      const wasCustomCard = item.draftDesignType === "custom-card" || item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square";
      const updates: Partial<WeddingDirectoryItem> = { draftDesignType: newType, cardVariant: 0 };
      if (isCustomCard && !wasCustomCard) updates.excludeTexts = false;
      return { ...item, ...updates };
    });
    setDirectoryItems(updatedItems);
    onChange?.("weddingDirectoryItems", updatedItems);
  };

  const handleUniversalColorChange = (itemId: string, color: string) => {
    const currentItems = directoryItems;
    const updatedItems = currentItems.map(item => {
      if (item.id !== itemId) return item;
      const updatedLayers = [...item.layers];
      updatedLayers[0] = { ...updatedLayers[0], tint: color };
      return { ...item, layers: updatedLayers, stampTint: color, stampTextColor: color };
    });
    setDirectoryItems(updatedItems);
    onChange?.("weddingDirectoryItems", updatedItems);
  };

  const handleResetItemTransform = (itemId: string) => {
    const currentItems = directoryItems;
    const updatedItems = currentItems.map(item =>
      item.id === itemId ? { ...item, rotate: 0, scaleMobile: 1, scaleDesktop: 1, positionX: 0, positionY: 0 } : item
    );
    setDirectoryItems(updatedItems);
    onChange?.("weddingDirectoryItems", updatedItems);
  };

  const handleDeleteItem = (itemId: string) => {
    const currentItems = directoryItems;
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    setDirectoryItems(updatedItems);
    onChange?.("weddingDirectoryItems", updatedItems);
    handleCloseItemSettingsPanel();
  };

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

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const normalizeVideoUrl = (url: string) => {
    if (!url) return url;
    if (url.includes('pexels.com/download/video/')) return url;
    const pexelsMatch = url.match(/pexels\.com\/video\/(\d+)/);
    if (pexelsMatch) return `https://www.pexels.com/download/video/${pexelsMatch[1]}/`;
    return url;
  };

  const getFlowerSrc = (variant: number) => {
    return variant === 0 ? "/assets/weddir-env-flowrs.png" : `/assets/weddir-env-flowrs${variant + 1}.png`;
  };

  const getOutlineSrc = (variant: number) => {
    return variant === 1 ? "/assets/weddir-env-outline.png" : `/assets/weddir-env-outline-${variant}.png`;
  };

  const getCardSrc = (variant: number, draftDesignType: string = "custom-card") => {
    if (draftDesignType === "custom-card-square") {
      return `/assets/weddir-card-sq-${variant + 1}.png`;
    }
    return variant === 0 ? "/assets/weddir-card-1.png" : `/assets/weddir-card-${variant + 1}.png`;
  };

  const detectCardVariantCount = async (): Promise<number> => {
    let count = 0;
    for (let i = 0; i < 20; i++) {
      const exists = await imageExists(getCardSrc(i, "custom-card"));
      if (exists) {
        count = i + 1;
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  };

  const detectSquareCardVariantCount = async (): Promise<number> => {
    let count = 0;
    for (let i = 0; i < 20; i++) {
      const exists = await imageExists(getCardSrc(i, "custom-card-square"));
      if (exists) {
        count = i + 1;
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  };

  const getCardVariantCount = (draftDesignType: string) => draftDesignType === "custom-card-square" ? squareCardVariantCount : cardVariantCount;

  const detectOutlineVariantCount = async (): Promise<number> => {
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      const exists = await imageExists(getOutlineSrc(i));
      if (exists) {
        count = i;
      } else {
        break;
      }
    }
    // Fallback to at least 2 so weddir-env-outline and weddir-env-outline-2 always cycle
    return Math.max(count, 2);
  };

  const imageExists = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const detectFlowerVariantCount = async (): Promise<number> => {
    let count = 0;
    for (let i = 0; i < 20; i++) {
      const exists = await imageExists(getFlowerSrc(i));
      if (exists) {
        count = i + 1;
      } else {
        break;
      }
    }
    // Fallback to at least 2 so weddir-env-flowrs and weddir-env-flowrs2 always cycle
    return Math.max(count, 2);
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

  const handleOpenDraftDesignPanel = () => {
    setShowDraftDesignPanel(true);
    const element = document.getElementById('wedding-directory-cssid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCloseDraftDesignPanel = () => {
    setIsDraftDesignPanelClosing(true);
    setExpandedDraftItemId(null);
    setDraftShadowExpanded(false);
    setTimeout(() => {
      setShowDraftDesignPanel(false);
      setIsDraftDesignPanelClosing(false);
    }, 300);
  };

  const handleChange = (key: keyof InvitationData, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    onChange?.(key, value);
  };

  const mergedData = { ...data, ...pendingChanges };

  const hisInitial = mergedData.hisName?.charAt(0).toUpperCase() || "";
  const herInitial = mergedData.herName?.charAt(0).toUpperCase() || "";
  const eventInitial = mergedData.coupleName?.charAt(0).toUpperCase() || hisInitial;
  const stampText =
    mergedData.nameType === "couple"
      ? hisInitial && herInitial
        ? `${hisInitial}&${herInitial}`
        : hisInitial || herInitial || "M&R"
      : eventInitial || "M&R";

  useEffect(() => {
    if (mergedData.weddingDirectoryBackgroundType === "color" && !mergedData.weddingDirectoryBackgroundColor) {
      handleChange("weddingDirectoryBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.weddingDirectoryBackgroundType === "gradient" && !mergedData.weddingDirectoryGradient) {
      handleChange("weddingDirectoryGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.weddingDirectoryBackgroundType === "image" && !mergedData.weddingDirectoryImage) {
      handleChange("weddingDirectoryImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("weddingDirectoryGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.weddingDirectoryBackgroundType === "video" && !mergedData.weddingDirectoryVideo) {
      handleChange("weddingDirectoryVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("weddingDirectoryGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.weddingDirectoryBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  useEffect(() => {
    if (mergedData.weddingDirectoryBackgroundType === "image" && mergedData.weddingDirectoryImage?.urls && mergedData.weddingDirectoryImage.urls.length > 1) {
      const validUrls = mergedData.weddingDirectoryImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000);
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.weddingDirectoryBackgroundType, mergedData.weddingDirectoryImage?.urls]);

  const weddingDirectoryUseDefaultDivider = data.weddingDirectoryDividerUseDefault ?? true;
  const effectivePullDown = weddingDirectoryUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.weddingDirectoryDividerPullDown ?? 0);
  const effectiveVerticalFlip = weddingDirectoryUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.weddingDirectoryDividerVerticalFlip ?? false);

  return (
    <>
      <section
        className="pt-0 pb-8 px-8 text-center relative min-h-[200px]"
        style={{
          backgroundColor: mergedData.weddingDirectoryUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.weddingDirectoryBackgroundType === "gradient"
              ? undefined
              : mergedData.weddingDirectoryBackgroundType === "image"
                ? undefined
                : mergedData.weddingDirectoryBackgroundType === "video"
                  ? undefined
                  : (mergedData.weddingDirectoryBackgroundColor || "transparent"),
          background: mergedData.weddingDirectoryUseMainColor !== false
            ? (data.mainColor1 || "transparent")
            : mergedData.weddingDirectoryBackgroundType === "gradient" && mergedData.weddingDirectoryGradient
              ? `linear-gradient(135deg, ${mergedData.weddingDirectoryGradient.firstColor || "#ffffff"}, ${mergedData.weddingDirectoryGradient.secondColor || "#ffffff"})`
              : undefined,
          ...(mergedData.weddingDirectoryBackgroundType === "image" && mergedData.weddingDirectoryImage?.urls && mergedData.weddingDirectoryImage.urls.length > 0 ? {
            backgroundImage: `url(${mergedData.weddingDirectoryImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          } : {}),
          transition: 'background 1s ease-in-out'
        }}
      >
      {(mergedData.weddingDirectoryBackgroundType === "image" || mergedData.weddingDirectoryBackgroundType === "video") && mergedData.weddingDirectoryGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.weddingDirectoryGradient.firstColor || "#ffffff", (mergedData.weddingDirectoryGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.weddingDirectoryGradient.secondColor || "#ffffff", (mergedData.weddingDirectoryGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {mergedData.weddingDirectoryBackgroundType === "video" && mergedData.weddingDirectoryVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.weddingDirectoryVideo.url)}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 2 }}>
      <Divider
        type={weddingDirectoryUseDefaultDivider ? (data.universalDivider || "none") : (data.weddingDirectoryDivider || "none")}
        color={data.mainColor2}
        id="wedding-directory-cssid"
        offset={weddingDirectoryUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.weddingDirectoryDividerOffset ?? 0)}
        tintColor={weddingDirectoryUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.weddingDirectoryDividerTintColor || data.mainColor2)}
        tintOpacity={weddingDirectoryUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.weddingDirectoryDividerTintOpacity ?? 100)}
        dividerStyle={weddingDirectoryUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.weddingDirectoryDividerStyle || "centered-single")}
        flip={weddingDirectoryUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.weddingDirectoryDividerFlip ?? false)}
        spacing={weddingDirectoryUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.weddingDirectoryDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={weddingDirectoryUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.weddingDirectoryDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={weddingDirectoryUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.weddingDirectoryDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={weddingDirectoryUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.weddingDirectoryDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={weddingDirectoryUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.weddingDirectoryDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={weddingDirectoryUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.weddingDirectoryDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (weddingDirectoryUseDefaultDivider) {
            onChange?.("weddingDirectoryDividerUseDefault", false);
          }
          onChange?.("weddingDirectoryDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('wedding-directory-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Wedding Directory Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.weddingDirectoryDivider && data.weddingDirectoryDivider !== "none" ? data.weddingDirectoryDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("weddingDirectoryDivider", value)}
          tintColor={data.weddingDirectoryDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("weddingDirectoryDividerTintColor", value)}
          tintOpacity={data.weddingDirectoryDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("weddingDirectoryDividerTintOpacity", value)}
          dividerStyle={data.weddingDirectoryDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("weddingDirectoryDividerStyle", value)}
          flip={data.weddingDirectoryDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("weddingDirectoryDividerFlip", value)}
          spacing={data.weddingDirectoryDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("weddingDirectoryDividerSpacing", value)}
          pullDown={data.weddingDirectoryDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("weddingDirectoryDividerPullDown", value)}
          verticalFlip={data.weddingDirectoryDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("weddingDirectoryDividerVerticalFlip", value)}
          imageSize={data.weddingDirectoryDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("weddingDirectoryDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.weddingDirectoryDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("weddingDirectoryDividerCustomImageUrl1", value)}
          customImageUrl2={data.weddingDirectoryDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("weddingDirectoryDividerCustomImageUrl2", value)}
          customImageUrl3={data.weddingDirectoryDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("weddingDirectoryDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.weddingDirectoryDivider === "divider-1" ? predefinedDividerImagesCentered : data.weddingDirectoryDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={weddingDirectoryUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("weddingDirectoryDividerUseDefault", value)}
          colorBlend={data.weddingDirectoryDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("weddingDirectoryDividerColorBlend", value)}
        />
      )}
      {showItemSettingsPanel && selectedItemId && (() => {
        const selectedItem = directoryItems.find(i => i.id === selectedItemId);
        if (!selectedItem) return null;
        return createPortal(
          <>
            {!isItemSettingsClosing && <div className="fixed inset-0 bg-transparent z-[9998]" onMouseDown={handleCloseItemSettingsPanel} onWheel={handleCloseItemSettingsPanel} />}
            <div
              className={`fixed z-[9999] shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
                desktopMode
                  ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isItemSettingsClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                  : `bottom-0 left-0 right-0 rounded-t-3xl ${isItemSettingsClosing ? "animate-slide-down" : "animate-slide-up"}`
              }`}
              style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
            >
              {!desktopMode && (
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
                </div>
              )}
              <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Directory Item Settings
                </h3>
                <button
                  type="button"
                  onClick={() => handleResetItemTransform(selectedItemId)}
                  className="p-1.5 rounded-md transition-colors hover:opacity-80"
                  title="Reset Transform"
                >
                  <img src="/assets/ico-mapping-default.PNG" alt="Reset Transform" className="w-5 h-5 object-contain" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
                <div className="space-y-6">
                  <h4 className={`text-sm font-medium text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>DRAFT DESIGN</h4>
                  <HybridDropdown
                    value={selectedItem.draftDesignType}
                    onChange={(value) => {
                      const currentItems = directoryItems;
                      const newType = String(value);
                      const isCustomCard = newType === "custom-card" || newType === "custom-card-portrait" || newType === "custom-card-square";
                      const wasCustomCard = selectedItem.draftDesignType === "custom-card" || selectedItem.draftDesignType === "custom-card-portrait" || selectedItem.draftDesignType === "custom-card-square";
                      const updatedItems = currentItems.map(item => {
                        if (item.id !== selectedItemId) return item;
                        const updates: Partial<WeddingDirectoryItem> = { draftDesignType: newType, cardVariant: 0 };
                        if (isCustomCard && !wasCustomCard) updates.excludeTexts = false;
                        return { ...item, ...updates };
                      });
                      setDirectoryItems(updatedItems);
                      onChange?.("weddingDirectoryItems", updatedItems);
                    }}
                    options={[
                      { name: "Envelope", value: "envelope" },
                      { name: "Itinerary Cards", value: "itinerary" },
                      { name: "Invitation (Portrait)", value: "invitation" },
                      { name: "Invitation (Landscape)", value: "invitation-landscape" },
                      { name: "Custom Card(Landscape)", value: "custom-card" },
                      { name: "Custom Card(Portrait)", value: "custom-card-portrait" },
                      { name: "Custom Card(Square)", value: "custom-card-square" },
                      { name: "RSVP", value: "rsvp" },
                      { name: "Details on Paper", value: "details" },
                      { name: "Photo Papers", value: "photo-papers" },
                    ]}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                  />
                  {selectedItem.draftDesignType !== "envelope" && selectedItem.draftDesignType !== "photo-papers" && selectedItem.draftDesignType !== "invitation" && selectedItem.draftDesignType !== "invitation-landscape" && selectedItem.draftDesignType !== "custom-card" && selectedItem.draftDesignType !== "custom-card-portrait" && selectedItem.draftDesignType !== "custom-card-square" && (
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>COLORED TEXT</label>
                        <div
                          className="relative inline-block w-11 h-6 cursor-pointer"
                          onClick={() => handleItemChange(selectedItemId, "coloredTextEnabled", !selectedItem.coloredTextEnabled)}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedItem.coloredTextEnabled}
                            onChange={(e) => handleItemChange(selectedItemId, "coloredTextEnabled", e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-11 h-6 rounded-full transition-colors ${selectedItem.coloredTextEnabled ? "" : "bg-gray-200"}`}
                            style={{ backgroundColor: selectedItem.coloredTextEnabled ? accentColor : undefined }}
                          />
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedItem.coloredTextEnabled ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                      </div>
                      {selectedItem.coloredTextEnabled && (
                        <div className="space-y-1">
                          <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Color</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={selectedItem.coloredTextColor || data.mainColor1}
                                onChange={(e) => handleItemChange(selectedItemId, "coloredTextColor", e.target.value)}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={selectedItem.coloredTextColor || data.mainColor1}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleItemChange(selectedItemId, "coloredTextColor", value);
                              }}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                              placeholder={data.mainColor1}
                              maxLength={7}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {(selectedItem.draftDesignType === "invitation" || selectedItem.draftDesignType === "invitation-landscape") && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
                    <div className="space-y-1">
                      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Host Line</label>
                      <div className="relative">
                        <textarea
                          value={selectedItem.hostLineText ?? ""}
                          onChange={(e) => handleItemChange(selectedItemId, "hostLineText", e.target.value)}
                          placeholder="Please join us as we celebrate our love and commitment"
                          rows={2}
                          className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ fontFamily: "Inter, sans-serif", ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentIndex = HOST_LINE_MESSAGES.findIndex(m => m === (selectedItem.hostLineText || ""));
                            const { message } = getNextMessage(HOST_LINE_MESSAGES, currentIndex);
                            handleItemChange(selectedItemId, "hostLineText", message);
                          }}
                          className={`absolute right-2 top-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                          title="Next message"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Final Sentiment</label>
                      <div className="relative">
                        <textarea
                          value={selectedItem.finalSentimentText ?? ""}
                          onChange={(e) => handleItemChange(selectedItemId, "finalSentimentText", e.target.value)}
                          placeholder="We can't wait to celebrate with you!"
                          rows={2}
                          className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ fontFamily: "Inter, sans-serif", ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentIndex = CLOSING_SENTIMENT_MESSAGES.findIndex(m => m === (selectedItem.finalSentimentText || ""));
                            const { message } = getNextMessage(CLOSING_SENTIMENT_MESSAGES, currentIndex);
                            handleItemChange(selectedItemId, "finalSentimentText", message);
                          }}
                          className={`absolute right-2 top-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                          title="Next sentiment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {(selectedItem.draftDesignType === "invitation" || selectedItem.draftDesignType === "invitation-landscape") && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>TEXT SIZE</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Name Size</label>
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{Math.round((selectedItem.nameTextSize ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="1"
                        value={(selectedItem.nameTextSize ?? 1) * 100}
                        onChange={(e) => handleItemChange(selectedItemId, "nameTextSize", parseFloat(e.target.value) / 100)}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          accentColor: accentColor,
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selectedItem.nameTextSize ?? 1) * 100 - 50) / 50 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((selectedItem.nameTextSize ?? 1) * 100 - 50) / 50 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}
                {(selectedItem.draftDesignType === "invitation" || selectedItem.draftDesignType === "invitation-landscape") && (
                  <div className="space-y-6">
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>COLORED TEXT</label>
                        <div
                          className="relative inline-block w-11 h-6 cursor-pointer"
                          onClick={() => handleItemChange(selectedItemId, "coloredTextEnabled", !selectedItem.coloredTextEnabled)}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedItem.coloredTextEnabled}
                            onChange={(e) => handleItemChange(selectedItemId, "coloredTextEnabled", e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-11 h-6 rounded-full transition-colors ${selectedItem.coloredTextEnabled ? "" : "bg-gray-200"}`}
                            style={{ backgroundColor: selectedItem.coloredTextEnabled ? accentColor : undefined }}
                          />
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedItem.coloredTextEnabled ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                      </div>
                      {selectedItem.coloredTextEnabled && (
                        <div className="space-y-1">
                          <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Color</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={selectedItem.coloredTextColor || data.mainColor1}
                                onChange={(e) => handleItemChange(selectedItemId, "coloredTextColor", e.target.value)}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={selectedItem.coloredTextColor || data.mainColor1}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleItemChange(selectedItemId, "coloredTextColor", value);
                              }}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                              placeholder={data.mainColor1}
                              maxLength={7}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>ANIMATION</h4>
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Animation</label>
                      <HybridDropdown
                        value={selectedItem.textAnimation || "blur-glow"}
                        onChange={(value) => handleItemChange(selectedItemId, "textAnimation", value as "blur-glow" | "typewriter" | "fade-slide")}
                        options={[
                          { name: "Blur + Glow", value: "blur-glow" },
                          { name: "Typewriter", value: "typewriter" },
                          { name: "Fade + Slide", value: "fade-slide" },
                        ]}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                      />
                    </div>
                  </div>
                )}
                {(selectedItem.draftDesignType === "custom-card" || selectedItem.draftDesignType === "custom-card-portrait" || selectedItem.draftDesignType === "custom-card-square") && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>TEXT SIZE</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Size</label>
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{Math.round((selectedItem.nameTextSize ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="1"
                        value={(selectedItem.nameTextSize ?? 1) * 100}
                        onChange={(e) => handleItemChange(selectedItemId, "nameTextSize", parseFloat(e.target.value) / 100)}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          accentColor: accentColor,
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((selectedItem.nameTextSize ?? 1) * 100 - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((selectedItem.nameTextSize ?? 1) * 100 - 50) / 150 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}
                {(selectedItem.draftDesignType === "custom-card" || selectedItem.draftDesignType === "custom-card-portrait" || selectedItem.draftDesignType === "custom-card-square") && (
                  <div className="space-y-6">
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>COLORED TEXT</label>
                        <div
                          className="relative inline-block w-11 h-6 cursor-pointer"
                          onClick={() => handleItemChange(selectedItemId, "coloredTextEnabled", !selectedItem.coloredTextEnabled)}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedItem.coloredTextEnabled}
                            onChange={(e) => handleItemChange(selectedItemId, "coloredTextEnabled", e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-11 h-6 rounded-full transition-colors ${selectedItem.coloredTextEnabled ? "" : "bg-gray-200"}`}
                            style={{ backgroundColor: selectedItem.coloredTextEnabled ? accentColor : undefined }}
                          />
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedItem.coloredTextEnabled ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                      </div>
                      {selectedItem.coloredTextEnabled && (
                        <div className="space-y-1">
                          <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Color</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={selectedItem.coloredTextColor || data.mainColor1}
                                onChange={(e) => handleItemChange(selectedItemId, "coloredTextColor", e.target.value)}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={selectedItem.coloredTextColor || data.mainColor1}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleItemChange(selectedItemId, "coloredTextColor", value);
                              }}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                              placeholder={data.mainColor1}
                              maxLength={7}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
                    <div className="space-y-1">
                      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={resolveCustomCardMessage(selectedItem.customCardMessage ?? "", data.rsvpDeadline)}
                          onChange={(e) => handleItemChange(selectedItemId, "customCardMessage", e.target.value)}
                          className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ fontFamily: "Inter, sans-serif", ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) }}
                          placeholder="Enter your message..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentIndex = CUSTOM_CARD_MESSAGES.findIndex(m => m === (selectedItem.customCardMessage || ""));
                            const { message } = getNextMessage(CUSTOM_CARD_MESSAGES, currentIndex);
                            handleItemChange(selectedItemId, "customCardMessage", message);
                          }}
                          className={`absolute right-2 top-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                          title="Next message"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Custom Text</label>
                      <textarea
                        value={selectedItem.customText || ""}
                        onChange={(e) => handleItemChange(selectedItemId, "customText", e.target.value)}
                        className={`w-full px-3 py-2 rounded-md text-sm resize-none ${isDarkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"} border`}
                        style={{ fontFamily: "Inter, sans-serif", minHeight: "80px" }}
                        placeholder="Enter your custom text..."
                      />
                    </div>
                  </div>
                )}
                {(selectedItem.draftDesignType === "custom-card" || selectedItem.draftDesignType === "custom-card-portrait" || selectedItem.draftDesignType === "custom-card-square") && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>ANIMATION</h4>
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Text Animation</label>
                      <HybridDropdown
                        value={selectedItem.textAnimation || "blur-glow"}
                        onChange={(value) => handleItemChange(selectedItemId, "textAnimation", value as "blur-glow" | "typewriter" | "fade-slide")}
                        options={[
                          { name: "Blur + Glow", value: "blur-glow" },
                          { name: "Typewriter", value: "typewriter" },
                          { name: "Fade + Slide", value: "fade-slide" },
                        ]}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                      />
                    </div>
                  </div>
                )}
                {selectedItem.draftDesignType === "photo-papers" && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>CUSTOM TEXTS</h4>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>PHOTO PAPER 1</label>
                        <input
                          type="text"
                          value={selectedItem.photoPapersText1 || ""}
                          onChange={(e) => handleItemChange(selectedItemId, "photoPapersText1", e.target.value)}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ fontFamily: "Inter, sans-serif", ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) }}
                          placeholder="Enter text for photo paper 1..."
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>PHOTO PAPER 2</label>
                        <input
                          type="text"
                          value={selectedItem.photoPapersText2 || ""}
                          onChange={(e) => handleItemChange(selectedItemId, "photoPapersText2", e.target.value)}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                          style={{ fontFamily: "Inter, sans-serif", ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) }}
                          placeholder="Enter text for photo paper 2..."
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>TEXT COLOR</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedItem.photoPapersTextColor || "#333333"}
                            onChange={(e) => handleItemChange(selectedItemId, "photoPapersTextColor", e.target.value)}
                            className="w-10 h-10 rounded border-2 cursor-pointer"
                            style={{ borderColor: isDarkMode ? "#4B5563" : "#E5E7EB" }}
                          />
                          <input
                            type="text"
                            value={selectedItem.photoPapersTextColor || "#333333"}
                            onChange={(e) => handleItemChange(selectedItemId, "photoPapersTextColor", e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                            style={{ fontFamily: "Inter, sans-serif", ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }) }}
                            placeholder="#333333"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {selectedItem.draftDesignType === "photo-papers" && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>TYPOGRAPHY</h4>
                    <div className="space-y-4">
                      <HybridFontControl
                        label="FONT TYPE"
                        value={selectedItem.photoPapersFontType || data.headingFont || "Playfair Display"}
                        onChange={(value) => handleItemChange(selectedItemId, "photoPapersFontType", value)}
                        type="heading"
                        showPreview={false}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                        useInterFont={true}
                        predefinedFonts={headingFonts}
                      />
                    </div>
                  </div>
                )}
                {(selectedItem.draftDesignType === "invitation" || selectedItem.draftDesignType === "invitation-landscape" || selectedItem.draftDesignType === "custom-card" || selectedItem.draftDesignType === "custom-card-portrait" || selectedItem.draftDesignType === "custom-card-square") && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>CARD COLOR</h4>
                    <ColorControl
                      label="Card Tint"
                      value={selectedItem.layers[0]?.tint || data.mainColor1}
                      onChange={(value) => {
                        const updatedLayers = [...(selectedItem.layers || [])];
                        if (updatedLayers.length === 0) {
                          updatedLayers.push({ id: "card", designId: "default", tint: value, zIndex: 1 });
                        } else {
                          updatedLayers[0] = { ...updatedLayers[0], tint: value };
                        }
                        handleItemChange(selectedItemId, "layers", updatedLayers);
                      }}
                      isDarkMode={isDarkMode}
                      accentColor={accentColor}
                    />
                  </div>
                )}
                {selectedItem.draftDesignType === "envelope" && (
                  <div className="space-y-6">
                    <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>COLOR</h4>
                    <div className="space-y-1">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        UNIVERSAL COLOR
                      </label>
                      <ColorControl
                        label=""
                        value={selectedItem.stampTint || data.mainColor1}
                        onChange={(value) => handleUniversalColorChange(selectedItemId, value)}
                        predefinedColors={predefinedSectionColors.map(c => c.value)}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                      />
                    </div>
                  </div>
                )}
                {selectedItem.draftDesignType === "envelope" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="swapPhotoAndFlowers"
                        className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        SWAP PHOTO AND FLOWERS
                      </label>
                      <div
                        className="relative inline-block w-11 h-6 cursor-pointer"
                        onClick={() => handleItemChange(selectedItemId, "swapPhotoAndFlowers", !selectedItem.swapPhotoAndFlowers)}
                      >
                        <input
                          type="checkbox"
                          id="swapPhotoAndFlowers"
                          checked={!!selectedItem.swapPhotoAndFlowers}
                          onChange={(e) => handleItemChange(selectedItemId, "swapPhotoAndFlowers", e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-11 h-6 rounded-full transition-colors ${selectedItem.swapPhotoAndFlowers ? "" : "bg-gray-200"}`}
                          style={{ backgroundColor: selectedItem.swapPhotoAndFlowers ? accentColor : undefined }}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedItem.swapPhotoAndFlowers ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body
        );
      })()}
      <style>{`
        @keyframes weddir-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.7)); }
          50% { filter: drop-shadow(0 0 18px rgba(255, 255, 255, 0.9)); }
        }
        .wd-no-anim * {
          transition: none !important;
          animation: none !important;
        }
      `}</style>
      <h2
        className="text-2xl font-bold uppercase mb-1 md:mb-8 scale-[0.55] md:scale-100"
        style={{
          color: mergedData.weddingDirectoryUseMainColor !== false ? data.mainColor2 : (mergedData.weddingDirectoryHeadingColor || data.mainColor2),
          fontFamily: mergedData.weddingDirectoryUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.weddingDirectoryHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.weddingDirectoryHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2',
          marginTop: '-60px'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
            setShowTypographyPanel(true);
            const element = document.getElementById('wedding-directory-cssid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } : undefined}
        >
          {mergedData.weddingDirectoryHeading || "Wedding Directory"}
        </span>
      </h2>

      {mergedData.weddingDirectoryMessage && (
        <p
          className="text-center mb-2 md:mb-8 leading-relaxed scale-[0.7] md:scale-100"
          style={{
            color: mergedData.weddingDirectoryUseMainColor !== false ? data.neutralColor1 : (mergedData.weddingDirectoryMessageColor || data.neutralColor1),
            fontFamily: mergedData.weddingDirectoryUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.weddingDirectoryMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.weddingDirectoryMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.weddingDirectoryMessage}
        </p>
      )}

      {/* Directory Items Container */}
      <div className={`grid grid-cols-2 gap-2 md:gap-4 ${showItemSettingsPanel || showDraftDesignPanel ? 'wd-no-anim' : ''}`}>
        {directoryItems.map((item, index) => (
          <div
            key={item.id}
            data-item-id={item.id}
            className={`relative ${index === 0 ? "col-span-2 justify-self-center" : index % 2 === 1 ? "justify-self-end" : "justify-self-start"}`}
            style={{
              zIndex: item.zIndex,
              transform: `translate(${item.positionXMobile}%, ${item.positionYMobile}%) rotate(${item.rotate}deg) scale(${item.scaleMobile})`,
              filter: draftShadowEnabled
                ? `drop-shadow(${draftShadowOffsetX}px ${draftShadowOffsetY}px ${draftShadowBlur}px rgba(0, 0, 0, ${draftShadowVisibility / 100}))`
                : ((showItemSettingsPanel && selectedItemId === item.id) || expandedDraftItemId === item.id ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))' : undefined),
            } as React.CSSProperties}
            onMouseDown={() => {
              if (!editMode) return;
              const lp = longPressRef.current[item.id] || (longPressRef.current[item.id] = { timer: null, triggered: false });
              if (lp.timer) { clearTimeout(lp.timer); lp.timer = null; }
              lp.triggered = false;
              lp.timer = setTimeout(() => {
                lp.timer = null;
                lp.triggered = true;
                handleDeleteItem(item.id);
              }, 700);
            }}
            onMouseUp={() => {
              const lp = longPressRef.current[item.id];
              if (!lp) return;
              if (lp.timer) { clearTimeout(lp.timer); lp.timer = null; lp.triggered = false; }
            }}
            onMouseLeave={() => {
              const lp = longPressRef.current[item.id];
              if (!lp) return;
              if (lp.timer) { clearTimeout(lp.timer); lp.timer = null; lp.triggered = false; }
            }}
            onTouchStart={() => {
              if (!editMode) return;
              const lp = longPressRef.current[item.id] || (longPressRef.current[item.id] = { timer: null, triggered: false });
              if (lp.timer) { clearTimeout(lp.timer); lp.timer = null; }
              lp.triggered = false;
              lp.timer = setTimeout(() => {
                lp.timer = null;
                lp.triggered = true;
                handleDeleteItem(item.id);
              }, 700);
            }}
            onTouchEnd={() => {
              const lp = longPressRef.current[item.id];
              if (!lp) return;
              if (lp.timer) { clearTimeout(lp.timer); lp.timer = null; lp.triggered = false; }
            }}
            onTouchCancel={() => {
              const lp = longPressRef.current[item.id];
              if (!lp) return;
              if (lp.timer) { clearTimeout(lp.timer); lp.timer = null; lp.triggered = false; }
            }}
            onClickCapture={(e) => {
              const lp = longPressRef.current[item.id];
              if (lp?.triggered) {
                e.stopPropagation();
                lp.triggered = false;
              }
            }}
          >
            <style>{`
              @media (min-width: 768px) {
                [data-item-id="${item.id}"] {
                  transform: translate(${item.positionXDesktop}%, ${item.positionYDesktop}%) rotate(${item.rotate}deg) scale(${item.scaleDesktop}) !important;
                }
              }
            `}</style>
            {item.draftDesignType === "envelope" && (
              <div
                className={`relative overflow-visible w-[150px] h-[180px] md:w-[280px] md:h-[336px] lg:w-[350px] lg:h-[420px] ${editMode || item.targetSection !== "no-target" ? "cursor-pointer" : ""}`}
                style={{
                  clipPath: 'polygon(-20% -20%, 120% -20%, 120% 100%, -20% 100%)',
                  opacity: getAnimState(item.id).cardOpacity,
                  transform: `translateY(${getAnimState(item.id).cardTranslateY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                }}
                onClick={(e) => {
                  if (editMode && outlineVariantCount > 1) {
                    e.stopPropagation();
                    const currentPattern = parseInt(item.pattern || "1", 10);
                    const nextPattern = (currentPattern % outlineVariantCount) + 1;
                    handleItemChange(item.id, "pattern", String(nextPattern));
                  } else if (!editMode && item.targetSection !== "no-target") {
                    e.stopPropagation();
                    scrollToTargetSection(item);
                  }
                }}
              >
                {/* Layer 1: Bottom body */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: item.layers[0]?.zIndex || 1 }}>
                  <img
                    src="/assets/weddir-env-body-1.png"
                    alt="Envelope body bottom"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {item.layers[0]?.tint && (
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        backgroundColor: item.layers[0].tint,
                        mixBlendMode: 'color',
                        WebkitMaskImage: 'url(/assets/weddir-env-body-1.png)',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: 'url(/assets/weddir-env-body-1.png)',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                      }}
                    />
                  )}
                </div>
                {/* Layer 3: Body top */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: item.layers[2]?.zIndex || 3 }}>
                  <img
                    src="/assets/weddir-env-body-2.png"
                    alt="Envelope body top"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {item.layers[0]?.tint && (
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        backgroundColor: item.layers[0].tint,
                        mixBlendMode: 'color',
                        WebkitMaskImage: 'url(/assets/weddir-env-body-2.png)',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: 'url(/assets/weddir-env-body-2.png)',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                      }}
                    />
                  )}
                </div>
                {/* Layer 4: Top outline */}
                <img
                  src={getOutlineSrc(parseInt(item.pattern || "1", 10))}
                  alt="Envelope outline"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    zIndex: item.layers[3]?.zIndex || 4,
                  }}
                />
                {/* Stamp */}
                <div
                  className={`absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center ${editMode || item.targetSection !== "no-target" ? "cursor-pointer" : "cursor-default"}`}
                  style={{ zIndex: 5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editMode) {
                      handleOpenItemSettings(item.id);
                    } else {
                      scrollToTargetSection(item);
                    }
                  }}
                >
                  <img
                    src="/assets/weddir-env-stamp.png"
                    alt="Envelope stamp"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {(item.stampTint || "#897843") && (
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        backgroundColor: item.stampTint || "#897843",
                        mixBlendMode: 'color',
                        WebkitMaskImage: 'url(/assets/weddir-env-stamp.png)',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: 'url(/assets/weddir-env-stamp.png)',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                      }}
                    />
                  )}
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[10px] md:text-sm font-bold"
                    style={{
                      color: `color-mix(in srgb, ${item.stampTextColor || item.stampTint || "#897843"} 35%, transparent)`,
                      mixBlendMode: "luminosity",
                      textShadow: '-0.2px -0.2px rgba(255, 255, 255, 0.3), 0.2px 0.2px 0 rgba(0, 0, 0, 0.53)',
                      fontFamily: "Cinzel, serif"
                    }}
                  >
                    {stampText.split("&").map((part, index, arr) => (
                      <Fragment key={index}>
                        {part}
                        {index < arr.length - 1 && (
                          <span style={{ fontSize: '0.6em' }}>&</span>
                        )}
                      </Fragment>
                    ))}
                  </span>
                </div>
                {(() => {
                  const photoUrl = resolveGalleryUrl(item.imageUrl || "") || (data.galleryImages || []).map(resolveGalleryUrl).find(Boolean) || "";
                  if (!photoUrl) return null;
                  return (
                    <div
                      data-wedding-dir-image={item.id}
                      className={`absolute ${item.swapPhotoAndFlowers ? "top-[37%] left-[36%]" : "top-[39%] left-[62%]"} -translate-x-1/2 -translate-y-1/2 w-[60%] bg-white pt-2 px-2 pb-5 md:pt-3 md:px-3 md:pb-8 overflow-hidden shadow-lg transition-all duration-[4000ms] ease-out delay-100 ${editMode ? "cursor-pointer" : "pointer-events-none"}`}
                      style={{
                        zIndex: 2,
                        opacity: visibleImageIds.has(item.id) ? 1 : 0,
                        transform: visibleImageIds.has(item.id)
                          ? `translate(-50%, -50%) rotate(${item.swapPhotoAndFlowers ? -5 : 20}deg) translate(0, 0)`
                          : `translate(-50%, -50%) rotate(${item.swapPhotoAndFlowers ? -5 : 20}deg) translate(0, 50px)`,
                      }}
                      onClick={(e) => {
                        if (!editMode) return;
                        e.stopPropagation();
                        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
                        if (itemElement) {
                          itemElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        setPhotoPickerItemId(item.id);
                      }}
                    >
                      <img
                        src={photoUrl}
                        alt="User photo"
                        className="w-full h-auto aspect-square object-cover"
                      />
                    </div>
                  );
                })()}
                <div
                  data-wedding-dir-flowers={item.id}
                  className={`absolute ${item.swapPhotoAndFlowers ? "top-[39%] left-[78%]" : "top-[37%] left-[20%]"} -translate-x-1/2 -translate-y-1/2 w-[60%] overflow-hidden transition-all duration-[1000ms] ease-out delay-100 ${editMode && flowerVariantCount > 1 ? "cursor-pointer" : ""}`}
                  style={{
                    zIndex: 2,
                    opacity: visibleImageIds.has(item.id) ? 1 : 0,
                    transform: visibleImageIds.has(item.id)
                      ? `translate(-50%, -50%) rotate(${item.swapPhotoAndFlowers ? 20 : -5}deg) translate(0, 0)`
                      : `translate(-50%, -50%) rotate(${item.swapPhotoAndFlowers ? 20 : -5}deg) translate(0, 50px)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editMode && flowerVariantCount > 1) {
                      const currentVariant = item.flowerVariant || 0;
                      const nextVariant = (currentVariant + 1) % flowerVariantCount;
                      handleItemChange(item.id, "flowerVariant", nextVariant);
                    }
                  }}
                >
                  <img
                    src={getFlowerSrc(item.flowerVariant || 0)}
                    alt="Envelope flowers"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
            {item.draftDesignType === "invitation" && (
              <div
                data-wedding-dir-image={item.id}
                className={`relative w-[180px] h-[216px] md:w-[280px] md:h-[336px] lg:w-[350px] lg:h-[420px] ${editMode || item.targetSection !== "no-target" ? "cursor-pointer" : ""}`}
                style={{
                  opacity: getAnimState(item.id).cardOpacity,
                  transform: `translateY(${getAnimState(item.id).cardTranslateY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                  boxShadow: item.shadow?.enabled 
                    ? `${item.shadow.offsetX ?? 0}px ${item.shadow.offsetY ?? 5}px ${item.shadow.blur ?? 10}px ${item.shadow.color || "rgba(0, 0, 0, 0.3)"}`
                    : 'none',
                }}
                onClick={(e) => {
                  if (editMode) {
                    e.stopPropagation();
                    if (getCardVariantCount(item.draftDesignType) > 1) {
                      const currentVariant = item.cardVariant || 0;
                      const nextVariant = (currentVariant + 1) % getCardVariantCount(item.draftDesignType);
                      handleItemChange(item.id, "cardVariant", nextVariant);
                    }
                  } else if (item.targetSection !== "no-target") {
                    e.stopPropagation();
                    scrollToTargetSection(item);
                  }
                }}
              >
                <img
                  src={getCardSrc(item.cardVariant || 0, item.draftDesignType)}
                  alt="Invitation card"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {item.layers[0]?.tint && (
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: item.layers[0].tint,
                      mixBlendMode: 'color',
                      WebkitMaskImage: `url(${getCardSrc(item.cardVariant || 0, item.draftDesignType)})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(${getCardSrc(item.cardVariant || 0, item.draftDesignType)})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center px-4 py-4 text-center pointer-events-none"
                  style={{ maxWidth: '75%', margin: '0 auto' }}
                  onClick={(e) => {
                    if (!editMode) return;
                    e.stopPropagation();
                    handleOpenItemSettings(item.id);
                  }}
                >
                  <p
                    className="text-[4px] md:text-[8px] lg:text-[10px] tracking-[0.2em] uppercase leading-relaxed mb-2 md:mb-4"
                    style={{
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      fontFamily: getFontFamily(data.heroOthersTypography || data.bodyFont, "body"),
                      fontSize: `${(desktopMode ? 0.6 : 0.3) * (data.heroOthersTextSize ?? 1) * 100}%`,
                      pointerEvents: 'none',
                      cursor: 'default'
                    }}
                  >
                    {item.hostLineText || "Please join us as we celebrate our love and commitment"}
                  </p>
                  <h3
                    className="text-[12px] md:text-xl lg:text-2xl leading-tight my-2 md:my-4"
                    style={{
                      fontFamily: getFontFamily(data.heroDisplayNameTypography || data.headingFont, "heading"),
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      whiteSpace: data.heroAmpersandPosition === "default" ? "nowrap" : "pre-line",
                      textShadow: item.textAnimation === "blur-glow" ? `0 0 ${getAnimState(item.id).nameGlow}px ${item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1)}, 0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})` : `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                      transform: `scale(${(data.heroNameSize || 100) / 100 * 1.1 * (item.nameTextSize || 1)})${item.textAnimation === "fade-slide" ? ` translateY(${getAnimState(item.id).fadeSlideTranslateY}px)` : ''}`,
                      filter: item.textAnimation === "blur-glow" ? `blur(${getAnimState(item.id).nameBlur}px)` : 'none',
                      opacity: item.textAnimation === "fade-slide" ? getAnimState(item.id).fadeSlideOpacity : 1,
                      pointerEvents: editMode ? 'auto' : 'none',
                      cursor: editMode ? 'pointer' : 'default',
                      transition: 'filter 0.1s ease-out, text-shadow 0.1s ease-out, opacity 0.1s ease-out, transform 0.1s ease-out',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const animationType = item.textAnimation || "blur-glow";
                        if (animationType === "typewriter" && data.nameType === "couple") {
                          const firstName = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                          const secondName = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                          const andText = data.andText || "&";
                          const ampersandScale = (data.heroAmpersandSize || 100) / 100;
                          const ampersandOpacity = (data.heroAmpersandOpacity || 100) / 100;

                          // Use typewriter state length for animation
                          const firstNameLength = getAnimState(item.id).typewriterFirstName?.length || 0;
                          const secondNameLength = getAnimState(item.id).typewriterSecondName?.length || 0;
                          
                          // Create spans with opacity for each character to maintain fixed width
                          const firstNameSpans = firstName.split('').map((char, i) => 
                            `<span style="opacity: ${i < firstNameLength ? 1 : 0}; transition: opacity 0.15s ease-out;">${char}</span>`
                          ).join('');
                          const secondNameSpans = secondName.split('').map((char, i) => 
                            `<span style="opacity: ${i < secondNameLength ? 1 : 0}; transition: opacity 0.15s ease-out;">${char}</span>`
                          ).join('');

                          const ampersandSpan = `<span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span>`;

                          // Force same line for typewriter animation (3 individual elements)
                          return `${firstNameSpans} ${ampersandSpan} ${secondNameSpans}`.trim();
                        }
                        if (data.nameType === "couple") {
                          const name1 = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                          const name2 = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                          const andText = data.andText || "&";
                          const ampersandScale = (data.heroAmpersandSize || 100) / 100;
                          const ampersandOpacity = (data.heroAmpersandOpacity || 100) / 100;
                          switch (data.heroAmpersandPosition) {
                            case "first-line":
                              return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                            case "middle-line":
                              return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                            case "second-line":
                              return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                            case "default":
                            default:
                              return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                          }
                        }
                        return data.coupleName || "";
                      })()
                    }}
                  />
                  <p
                    className="text-[4px] md:text-[8px] lg:text-[10px] tracking-[0.2em] uppercase leading-relaxed mt-2 md:mt-4"
                    style={{
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      fontFamily: getFontFamily(data.heroOthersTypography || data.bodyFont, "body"),
                      fontSize: `${(desktopMode ? 0.6 : 0.3) * (data.heroOthersTextSize ?? 1) * 100}%`,
                      pointerEvents: 'none',
                      cursor: 'default'
                    }}
                  >
                    {item.finalSentimentText || "We can't wait to celebrate with you!"}
                  </p>
                </div>
              </div>
            )}
            {item.draftDesignType === "invitation-landscape" && (
              <div
                data-wedding-dir-image={item.id}
                className={`relative w-[216px] h-[180px] md:w-[336px] md:h-[280px] lg:w-[420px] lg:h-[350px] ${editMode || item.targetSection !== "no-target" ? "cursor-pointer" : ""}`}
                style={{
                  opacity: getAnimState(item.id).cardOpacity,
                  transform: `translateY(${getAnimState(item.id).cardTranslateY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                  boxShadow: item.shadow?.enabled 
                    ? `${item.shadow.offsetX ?? 0}px ${item.shadow.offsetY ?? 5}px ${item.shadow.blur ?? 10}px ${item.shadow.color || "rgba(0, 0, 0, 0.3)"}`
                    : 'none',
                }}
                onClick={(e) => {
                  if (editMode) {
                    e.stopPropagation();
                    if (getCardVariantCount(item.draftDesignType) > 1) {
                      const currentVariant = item.cardVariant || 0;
                      const nextVariant = (currentVariant + 1) % getCardVariantCount(item.draftDesignType);
                      handleItemChange(item.id, "cardVariant", nextVariant);
                    }
                  } else if (item.targetSection !== "no-target") {
                    e.stopPropagation();
                    scrollToTargetSection(item);
                  }
                }}
              >
                <img
                  src={getCardSrc(item.cardVariant || 0, item.draftDesignType)}
                  alt="Invitation card"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ transform: 'rotate(90deg)' }}
                />
                {item.layers[0]?.tint && (
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: item.layers[0].tint,
                      mixBlendMode: 'color',
                      WebkitMaskImage: `url(${getCardSrc(item.cardVariant || 0, item.draftDesignType)})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(${getCardSrc(item.cardVariant || 0, item.draftDesignType)})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      transform: 'rotate(90deg)',
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center px-4 py-4 text-center pointer-events-none"
                  style={{ maxWidth: '75%', margin: '0 auto' }}
                  onClick={(e) => {
                    if (!editMode) return;
                    e.stopPropagation();
                    handleOpenItemSettings(item.id);
                  }}
                >
                  <p
                    className="text-[3px] md:text-[7px] lg:text-[9px] tracking-[0.2em] uppercase leading-relaxed mb-1"
                    style={{
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      fontFamily: getFontFamily(data.heroOthersTypography || data.bodyFont, "body"),
                      fontSize: `${(desktopMode ? 0.5 : 0.2) * (data.heroOthersTextSize ?? 1) * 100}%`,
                      pointerEvents: 'none',
                      cursor: 'default'
                    }}
                  >
                    {item.hostLineText || "Please join us as we celebrate our love and commitment"}
                  </p>
                  <h3
                    className="text-[10px] md:text-lg lg:text-xl leading-tight my-2"
                    style={{
                      fontFamily: getFontFamily(data.heroDisplayNameTypography || data.headingFont, "heading"),
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      whiteSpace: data.heroAmpersandPosition === "default" ? "nowrap" : "pre-line",
                      textShadow: item.textAnimation === "blur-glow" ? `0 0 ${getAnimState(item.id).nameGlow}px ${item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1)}, 0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})` : `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                      transform: `scale(${(data.heroNameSize || 100) / 100 * 1.1 * (item.nameTextSize || 1)})${item.textAnimation === "fade-slide" ? ` translateY(${getAnimState(item.id).fadeSlideTranslateY}px)` : ''}`,
                      filter: item.textAnimation === "blur-glow" ? `blur(${getAnimState(item.id).nameBlur}px)` : 'none',
                      opacity: item.textAnimation === "fade-slide" ? getAnimState(item.id).fadeSlideOpacity : 1,
                      pointerEvents: editMode ? 'auto' : 'none',
                      cursor: editMode ? 'pointer' : 'default',
                      transition: 'filter 0.1s ease-out, text-shadow 0.1s ease-out, opacity 0.1s ease-out, transform 0.1s ease-out',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const animationType = item.textAnimation || "blur-glow";
                        if (animationType === "typewriter" && data.nameType === "couple") {
                          const firstName = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                          const secondName = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                          const andText = data.andText || "&";
                          const ampersandScale = (data.heroAmpersandSize || 100) / 100;
                          const ampersandOpacity = (data.heroAmpersandOpacity || 100) / 100;

                          // Use typewriter state length for animation
                          const firstNameLength = getAnimState(item.id).typewriterFirstName?.length || 0;
                          const secondNameLength = getAnimState(item.id).typewriterSecondName?.length || 0;
                          
                          // Create spans with opacity for each character to maintain fixed width
                          const firstNameSpans = firstName.split('').map((char, i) => 
                            `<span style="opacity: ${i < firstNameLength ? 1 : 0}; transition: opacity 0.15s ease-out;">${char}</span>`
                          ).join('');
                          const secondNameSpans = secondName.split('').map((char, i) => 
                            `<span style="opacity: ${i < secondNameLength ? 1 : 0}; transition: opacity 0.15s ease-out;">${char}</span>`
                          ).join('');

                          const ampersandSpan = `<span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span>`;

                          // Force same line for typewriter animation (3 individual elements)
                          return `${firstNameSpans} ${ampersandSpan} ${secondNameSpans}`.trim();
                        }
                        if (data.nameType === "couple") {
                          const name1 = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                          const name2 = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                          const andText = data.andText || "&";
                          const ampersandScale = (data.heroAmpersandSize || 100) / 100;
                          const ampersandOpacity = (data.heroAmpersandOpacity || 100) / 100;
                          switch (data.heroAmpersandPosition) {
                            case "first-line":
                              return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                            case "middle-line":
                              return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                            case "second-line":
                              return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                            case "default":
                            default:
                              return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                          }
                        }
                        return data.coupleName || "";
                      })()
                    }}
                  />
                  <p
                    className="text-[3px] md:text-[7px] lg:text-[9px] tracking-[0.2em] uppercase leading-relaxed mt-1"
                    style={{
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      fontFamily: getFontFamily(data.heroOthersTypography || data.bodyFont, "body"),
                      fontSize: `${(desktopMode ? 0.5 : 0.2) * (data.heroOthersTextSize ?? 1) * 100}%`,
                      pointerEvents: 'none',
                      cursor: 'default'
                    }}
                  >
                    {item.finalSentimentText || "We can't wait to celebrate with you!"}
                  </p>
                </div>
              </div>
            )}
            {(item.draftDesignType === "custom-card" || item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square") && (
              <div
                data-wedding-dir-image={item.id}
                className={`relative ${item.draftDesignType === "custom-card-portrait" ? "w-[180px] h-[216px] md:w-[280px] md:h-[336px] lg:w-[350px] lg:h-[420px]" : item.draftDesignType === "custom-card-square" ? "w-[180px] h-[180px] md:w-[280px] md:h-[280px] lg:w-[350px] lg:h-[350px]" : "w-[216px] h-[180px] md:w-[336px] md:h-[280px] lg:w-[420px] lg:h-[350px]"} ${editMode || item.targetSection !== "no-target" ? "cursor-pointer" : ""}`}
                style={{
                  opacity: getAnimState(item.id).cardOpacity,
                  transform: `translateY(${getAnimState(item.id).cardTranslateY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                  boxShadow: item.shadow?.enabled 
                    ? `${item.shadow.offsetX ?? 0}px ${item.shadow.offsetY ?? 5}px ${item.shadow.blur ?? 10}px ${item.shadow.color || "rgba(0, 0, 0, 0.3)"}`
                    : 'none',
                }}
                onClick={(e) => {
                  if (editMode) {
                    e.stopPropagation();
                    if (getCardVariantCount(item.draftDesignType) > 1) {
                      const currentVariant = item.cardVariant || 0;
                      const nextVariant = (currentVariant + 1) % getCardVariantCount(item.draftDesignType);
                      handleItemChange(item.id, "cardVariant", nextVariant);
                    }
                  } else if (item.targetSection !== "no-target") {
                    e.stopPropagation();
                    scrollToTargetSection(item);
                  }
                }}
              >
                <img
                  src={getCardSrc(item.cardVariant || 0, item.draftDesignType)}
                  alt="Custom card"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ transform: item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square" ? 'rotate(0deg)' : 'rotate(90deg)' }}
                />
                {item.layers[0]?.tint && (
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: item.layers[0].tint,
                      mixBlendMode: 'color',
                      WebkitMaskImage: `url(${getCardSrc(item.cardVariant || 0, item.draftDesignType)})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(${getCardSrc(item.cardVariant || 0, item.draftDesignType)})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      transform: item.draftDesignType === "custom-card-portrait" || item.draftDesignType === "custom-card-square" ? 'rotate(0deg)' : 'rotate(90deg)',
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center px-4 py-4 text-center pointer-events-none"
                  style={{ maxWidth: '65%', margin: '0 auto', transform: item.excludeTexts ? `rotate(-${item.rotate}deg)` : undefined, transition: 'transform 0.1s ease-out' }}
                  onClick={(e) => {
                    if (!editMode) return;
                    e.stopPropagation();
                    handleOpenItemSettings(item.id);
                  }}
                >
                  {item.customCardMessage && (
                    <p
                      className="text-[8px] md:text-sm lg:text-base leading-tight mb-3 break-words whitespace-normal max-w-full"
                      style={{
                        fontFamily: getFontFamily(data.bodyFont, "body"),
                        color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                        transform: `scale(${(data.heroNameSize || 100) / 100 * 1.1 * (item.nameTextSize || 1)})`,
                        pointerEvents: editMode ? 'auto' : 'none',
                        cursor: editMode ? 'pointer' : 'default',
                      }}
                    >
                      {resolveCustomCardMessage(item.customCardMessage, data.rsvpDeadline)}
                    </p>
                  )}
                  <h3
                    className="text-[10px] md:text-lg lg:text-xl leading-tight break-words whitespace-normal max-w-full"
                    style={{
                      fontFamily: getFontFamily(data.heroDisplayNameTypography || data.headingFont, "heading"),
                      color: item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1),
                      textShadow: item.textAnimation === "blur-glow" ? `0 0 ${getAnimState(item.id).nameGlow}px ${item.coloredTextEnabled ? (item.coloredTextColor || data.mainColor1) : (data.heroIconTextColor || data.mainColor1)}, 0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})` : `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                      transform: `scale(${(data.heroNameSize || 100) / 100 * 1.1 * (item.nameTextSize || 1)})${item.textAnimation === "fade-slide" ? ` translateY(${getAnimState(item.id).fadeSlideTranslateY}px)` : ''}`,
                      filter: item.textAnimation === "blur-glow" ? `blur(${getAnimState(item.id).nameBlur}px)` : 'none',
                      opacity: item.textAnimation === "fade-slide" ? getAnimState(item.id).fadeSlideOpacity : 1,
                      pointerEvents: editMode ? 'auto' : 'none',
                      cursor: editMode ? 'pointer' : 'default',
                      transition: 'filter 0.1s ease-out, text-shadow 0.1s ease-out, opacity 0.1s ease-out, transform 0.1s ease-out',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const animationType = item.textAnimation || "blur-glow";
                        const customText = item.customText || "Your custom text here";
                        
                        if (animationType === "typewriter") {
                          const textLength = getAnimState(item.id).typewriterCustomText?.length || 0;
                          const textSpans = customText.split('').map((char, i) => 
                            `<span style="opacity: ${i < textLength ? 1 : 0}; transition: opacity 0.15s ease-out;">${char}</span>`
                          ).join('');
                          return textSpans;
                        }
                        
                        return customText;
                      })()
                    }}
                  />
                </div>
              </div>
            )}
            {item.draftDesignType === "photo-papers" && (
              <div
                data-wedding-dir-image={item.id}
                className={`relative w-[200px] h-[240px] md:w-[320px] md:h-[384px] lg:w-[400px] lg:h-[480px] ${editMode || item.targetSection !== "no-target" ? "cursor-pointer" : ""}`}
                onClick={(e) => {
                  if (editMode) {
                    e.stopPropagation();
                    handleOpenItemSettings(item.id);
                  } else if (item.targetSection !== "no-target") {
                    e.stopPropagation();
                    scrollToTargetSection(item);
                  }
                }}
              >
                {/* Photo Paper 2 (Right, behind) */}
                <div
                  className="absolute top-[10%] right-[25%] w-[45%] bg-white pt-2 px-2 pb-4 md:pt-3 md:px-3 md:pb-6 shadow-lg overflow-hidden flex flex-col justify-center"
                  style={{
                    transform: `rotate(-5deg) translateY(${getAnimState(item.id).paper2TranslateY}px)`,
                    opacity: getAnimState(item.id).paper2Opacity,
                    zIndex: 1,
                    transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                  }}
                >
                  {(() => {
                    const photoUrl = resolveGalleryUrl(item.photoPapersImage2 || "") || (data.galleryImages || []).map(resolveGalleryUrl).find(Boolean) || "";
                    if (photoUrl) {
                      return (
                        <img
                          src={photoUrl}
                          alt="Photo paper 2"
                          className="w-full h-auto aspect-[3/4] object-cover cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editMode) {
                              setPhotoPickerItemId(item.id + "-paper2");
                            } else if (item.targetSection !== "no-target") {
                              scrollToTargetSection(item);
                            }
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                  <p
                    className="text-[8px] md:text-xs lg:text-sm leading-tight mt-2 whitespace-nowrap text-center"
                    style={{
                      fontFamily: getFontFamily(item.photoPapersFontType || data.headingFont, "heading"),
                      color: item.photoPapersTextColor || "#333333",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.photoPapersText2 || ""}
                  </p>
                </div>
                {/* Photo Paper 1 (Left, overlapping) */}
                <div
                  className="absolute top-0 left-0 w-[45%] bg-white pt-2 px-2 pb-4 md:pt-3 md:px-3 md:pb-6 shadow-lg overflow-hidden flex flex-col justify-center"
                  style={{
                    transform: `rotate(5deg) translateY(${getAnimState(item.id).paper1TranslateY}px)`,
                    opacity: getAnimState(item.id).paper1Opacity,
                    zIndex: 2,
                    transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                  }}
                >
                  {(() => {
                    const photoUrl = resolveGalleryUrl(item.photoPapersImage1 || "") || (data.galleryImages || []).map(resolveGalleryUrl).find(Boolean) || "";
                    if (photoUrl) {
                      return (
                        <img
                          src={photoUrl}
                          alt="Photo paper 1"
                          className="w-full h-auto aspect-[3/4] object-cover cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editMode) {
                              setPhotoPickerItemId(item.id + "-paper1");
                            } else if (item.targetSection !== "no-target") {
                              scrollToTargetSection(item);
                            }
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                  <p
                    className="text-[8px] md:text-xs lg:text-sm leading-tight mt-2 whitespace-nowrap text-center"
                    style={{
                      fontFamily: getFontFamily(item.photoPapersFontType || data.headingFont, "heading"),
                      color: item.photoPapersTextColor || "#333333",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.photoPapersText1 || ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {editMode && (
        <div className="flex flex-col items-center" style={{ marginTop: 100, marginBottom: 100 }}>
          {!hideInstructions && (
            <div className={`text-center text-xs px-4 mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {BUILDER_INSTRUCTIONS[builderInstructionIndex]}
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenDraftDesignPanel}
            className="mx-auto w-20 h-20 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
            aria-label="Add directory item"
            style={{ backgroundColor: accentColor }}
          >
            <img
              src="/assets/ico-feather.png"
              alt=""
              className="w-12 h-12 object-contain pointer-events-none"
            />
          </button>
        </div>
      )}
      </div>
    </section>

    {showTypographyPanel && (
      <>
        {!isTypographyClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseTypographyPanel} onWheel={handleCloseTypographyPanel} />}

        <div
          className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
            desktopMode
              ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isTypographyClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
              : `bottom-0 left-0 right-0 rounded-t-3xl ${isTypographyClosing ? "animate-slide-down" : "animate-slide-up"}`
          }`}
          style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", height: "50vh" }}
        >
          {!desktopMode && (
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            </div>
          )}

          <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Wedding Directory - Section Design
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>SECTION HEADING</h4>

              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Text</label>
                <div className="relative">
                  <input
                    type="text"
                    value={mergedData.weddingDirectoryHeading ?? ""}
                    onChange={(e) => handleChange("weddingDirectoryHeading", e.target.value)}
                    placeholder="Wedding Directory"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Wedding Directory",
                        "Wedding Party",
                        "Our Directory",
                        "The People",
                        "Meet the Family"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.weddingDirectoryHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleChange("weddingDirectoryHeading", predefinedHeadings[nextIndex]);
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
                  value={mergedData.weddingDirectoryHeadingTypography || data.headingFont}
                  onChange={(value) => handleChange("weddingDirectoryHeadingTypography", value)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.weddingDirectoryUseMainColor !== false}
                  predefinedFonts={predefinedHeadingFonts}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.weddingDirectoryHeadingFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.weddingDirectoryHeadingFontSize || 100}
                  onChange={(e) => handleChange("weddingDirectoryHeadingFontSize", parseInt(e.target.value))}
                  disabled={mergedData.weddingDirectoryUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.weddingDirectoryHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.weddingDirectoryHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              <ColorControl
                label="Heading Color"
                value={mergedData.weddingDirectoryHeadingColor || data.mainColor2}
                onChange={(value) => handleChange("weddingDirectoryHeadingColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.weddingDirectoryUseMainColor !== false}
                predefinedColors={predefinedSectionColors.map(c => c.value)}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>

              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Text</label>
                <div className="relative">
                  <textarea
                    value={mergedData.weddingDirectoryMessage ?? ""}
                    onChange={(e) => handleChange("weddingDirectoryMessage", e.target.value)}
                    placeholder="A special place for our wedding details and contacts..."
                    rows={3}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedMessages = [
                        "A special place for our wedding details and contacts...",
                        "Welcome to our wedding directory. Find everything you need here.",
                        "Our favorite people and moments, all in one place.",
                        "We're so happy to share this directory with you.",
                        "A guide to the people and details that make our day special."
                      ];
                      const currentIndex = predefinedMessages.indexOf(mergedData.weddingDirectoryMessage ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                      handleChange("weddingDirectoryMessage", predefinedMessages[nextIndex]);
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
                  value={mergedData.weddingDirectoryMessageTypography || data.bodyFont}
                  onChange={(value) => handleChange("weddingDirectoryMessageTypography", value)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.weddingDirectoryUseMainColor !== false}
                  predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.weddingDirectoryMessageFontSize || 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={mergedData.weddingDirectoryMessageFontSize || 100}
                  onChange={(e) => handleChange("weddingDirectoryMessageFontSize", parseInt(e.target.value))}
                  disabled={mergedData.weddingDirectoryUseMainColor !== false}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.weddingDirectoryMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.weddingDirectoryMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                  }}
                />
              </div>

              <ColorControl
                label="Message Color"
                value={mergedData.weddingDirectoryMessageColor || data.neutralColor1}
                onChange={(value) => handleChange("weddingDirectoryMessageColor", value)}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                disabled={data.weddingDirectoryUseMainColor !== false}
                predefinedColors={predefinedSectionColors.map(c => c.value)}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>BACKGROUND</h4>
              <div className="space-y-2">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Type</label>
                <select
                  value={mergedData.weddingDirectoryBackgroundType || "color"}
                  onChange={(e) => handleChange("weddingDirectoryBackgroundType", e.target.value)}
                  disabled={mergedData.weddingDirectoryUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {(mergedData.weddingDirectoryBackgroundType === "image" || mergedData.weddingDirectoryBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.weddingDirectoryGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, firstColor: e.target.value })}
                            disabled={mergedData.weddingDirectoryUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.weddingDirectoryGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, firstColor: value });
                          }}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.weddingDirectoryGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.weddingDirectoryGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.weddingDirectoryGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.weddingDirectoryGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.weddingDirectoryGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, secondColor: e.target.value })}
                            disabled={mergedData.weddingDirectoryUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.weddingDirectoryGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, secondColor: value });
                          }}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.weddingDirectoryGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.weddingDirectoryGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.weddingDirectoryGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.weddingDirectoryGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mergedData.weddingDirectoryBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.weddingDirectoryBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("weddingDirectoryBackgroundColor", e.target.value)}
                        disabled={mergedData.weddingDirectoryUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.weddingDirectoryBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("weddingDirectoryBackgroundColor", value);
                      }}
                      disabled={mergedData.weddingDirectoryUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {mergedData.weddingDirectoryBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.weddingDirectoryGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, firstColor: e.target.value })}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.weddingDirectoryGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, firstColor: value });
                        }}
                        disabled={mergedData.weddingDirectoryUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.weddingDirectoryGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, secondColor: e.target.value })}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.weddingDirectoryGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("weddingDirectoryGradient", { ...mergedData.weddingDirectoryGradient, secondColor: value });
                        }}
                        disabled={mergedData.weddingDirectoryUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {mergedData.weddingDirectoryBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.weddingDirectoryImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.weddingDirectoryImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("weddingDirectoryImage", { urls: newUrls });
                          }}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.weddingDirectoryImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("weddingDirectoryImage", { urls: newUrls });
                          }}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.weddingDirectoryImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.weddingDirectoryImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("weddingDirectoryImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.weddingDirectoryImage?.urls?.length || 1) - 1 && (mergedData.weddingDirectoryImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.weddingDirectoryImage?.urls || [""]), ""];
                            handleChange("weddingDirectoryImage", { urls: newUrls });
                          }}
                          disabled={mergedData.weddingDirectoryUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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

              {mergedData.weddingDirectoryBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.weddingDirectoryVideo?.url || ""}
                      onChange={(e) => handleChange("weddingDirectoryVideo", { url: e.target.value })}
                      disabled={mergedData.weddingDirectoryUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("weddingDirectoryVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.weddingDirectoryUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.weddingDirectoryUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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

          <div className="px-5 py-4 shrink-0 border-t flex items-center justify-between" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  id="weddingDirectoryUseMainColor"
                  checked={mergedData.weddingDirectoryUseMainColor !== false}
                  onChange={(e) => handleChange("weddingDirectoryUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("weddingDirectoryUseMainColor", !(mergedData.weddingDirectoryUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.weddingDirectoryUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{ color: accentColor }}
                >
                  {mergedData.weddingDirectoryUseMainColor !== false && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <label htmlFor="weddingDirectoryUseMainColor" className={`text-sm cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
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

    {showDraftDesignPanel && (
      <>
        {!isDraftDesignPanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseDraftDesignPanel} onWheel={handleCloseDraftDesignPanel} />}

        <div
          className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
            desktopMode
              ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isDraftDesignPanelClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
              : `bottom-0 left-0 right-0 rounded-t-3xl ${isDraftDesignPanelClosing ? "animate-slide-down" : "animate-slide-up"}`
          }`}
          style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", height: "50vh" }}
        >
          {!desktopMode && (
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            </div>
          )}

          <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Wedding Directory - Draft Designs
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
            <div className="space-y-6">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>SECTION HEADING</h4>

              <div className="space-y-1">
                <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Text</label>
                <div className="relative">
                  <input
                    type="text"
                    value={mergedData.weddingDirectoryHeading ?? ""}
                    onChange={(e) => handleChange("weddingDirectoryHeading", e.target.value)}
                    placeholder="Wedding Directory"
                    className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const predefinedHeadings = [
                        "Wedding Directory",
                        "Wedding Party",
                        "Our Directory",
                        "The People",
                        "Meet the Family"
                      ];
                      const currentIndex = predefinedHeadings.indexOf(mergedData.weddingDirectoryHeading ?? "");
                      const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                      handleChange("weddingDirectoryHeading", predefinedHeadings[nextIndex]);
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
            </div>

            <div className="space-y-4">
              <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>DRAFT DESIGN LIST</h4>

              {directoryItems.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`flex-1 flex flex-col px-4 py-3 rounded-lg border ${expandedDraftItemId === item.id ? "ring-2" : ""} ${isDarkMode ? "border-gray-700 bg-gray-700/30" : "border-gray-200 bg-gray-50"} ${expandedDraftItemId === item.id ? "gap-4" : ""}`}
                      style={expandedDraftItemId === item.id ? { borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}20` } : undefined}
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          const isExpanding = expandedDraftItemId !== item.id;
                          setExpandedDraftItemId(isExpanding ? item.id : null);
                          if (isExpanding) {
                            const element = document.querySelector(`[data-item-id="${item.id}"]`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }
                        }}
                      >
                        <span
                          className={`py-2 text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {(() => {
                            const designNames: Record<string, string> = {
                              "envelope": "Envelope",
                              "itinerary": "Itinerary Cards",
                              "invitation": "Invitation (Portrait)",
                              "invitation-landscape": "Invitation (Landscape)",
                              "custom-card": "Custom Card (Landscape)",
                              "custom-card-portrait": "Custom Card (Portrait)",
                              "custom-card-square": "Custom Card (Square)",
                              "rsvp": "RSVP",
                              "details": "Details on Paper",
                              "photo-papers": "Photo Papers",
                            };
                            return designNames[item.draftDesignType] || item.draftDesignType;
                          })()}
                        </span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          style={{ transform: expandedDraftItemId === item.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: expandedDraftItemId === item.id ? '2000px' : '0px',
                          opacity: expandedDraftItemId === item.id ? '1' : '0'
                        }}
                      >
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <h5 className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>NAVIGATION</h5>
                            <div className="space-y-1">
                              <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Target Section</label>
                              <select
                                value={item.targetSection}
                                onChange={(e) => handleItemChange(item.id, "targetSection", e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none appearance-none ${isDarkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white text-gray-800"}`}
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                <option value="no-target">No Target</option>
                                <option value="countdown">Countdown</option>
                                <option value="dresscode">Dress Code</option>
                                <option value="entourage">Entourage</option>
                                <option value="event-details">Event Details</option>
                                <option value="map">Event Location</option>
                                <option value="giftguide">Gift Guide</option>
                                <option value="timeline">Our Story</option>
                                <option value="gallery">Photo Gallery</option>
                                <option value="rsvp">RSVP</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h5 className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>POSITION</h5>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>MOVE LEFT - RIGHT</label>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setPositionMode("mobile")}
                                      className={`p-1.5 rounded-lg transition-colors ${positionMode === "mobile" ? "bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-75"}`}
                                      title="Mobile position"
                                    >
                                      <img src="/assets/ico-mobile.png" alt="Mobile" width="16" height="16" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPositionMode("desktop")}
                                      className={`p-1.5 rounded-lg transition-colors ${positionMode === "desktop" ? "bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-75"}`}
                                      title="Desktop position"
                                    >
                                      <img src="/assets/ico-desktop.png" alt="Desktop" width="16" height="16" />
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min="-100"
                                  max="100"
                                  value={positionMode === "mobile" ? (item.positionXMobile || 0) : (item.positionXDesktop || 0)}
                                  onChange={(e) => handleItemChange(item.id, positionMode === "mobile" ? "positionXMobile" : "positionXDesktop", parseInt(e.target.value))}
                                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    accentColor: accentColor,
                                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((positionMode === "mobile" ? (item.positionXMobile || 0) : (item.positionXDesktop || 0)) + 100) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((positionMode === "mobile" ? (item.positionXMobile || 0) : (item.positionXDesktop || 0)) + 100) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>MOVE UP - DOWN</label>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setPositionMode("mobile")}
                                      className={`p-1.5 rounded-lg transition-colors ${positionMode === "mobile" ? "bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-75"}`}
                                      title="Mobile position"
                                    >
                                      <img src="/assets/ico-mobile.png" alt="Mobile" width="16" height="16" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPositionMode("desktop")}
                                      className={`p-1.5 rounded-lg transition-colors ${positionMode === "desktop" ? "bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-75"}`}
                                      title="Desktop position"
                                    >
                                      <img src="/assets/ico-desktop.png" alt="Desktop" width="16" height="16" />
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min="-100"
                                  max="100"
                                  value={positionMode === "mobile" ? (item.positionYMobile || 0) : (item.positionYDesktop || 0)}
                                  onChange={(e) => handleItemChange(item.id, positionMode === "mobile" ? "positionYMobile" : "positionYDesktop", parseInt(e.target.value))}
                                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    accentColor: accentColor,
                                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((positionMode === "mobile" ? (item.positionYMobile || 0) : (item.positionYDesktop || 0)) + 100) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((positionMode === "mobile" ? (item.positionYMobile || 0) : (item.positionYDesktop || 0)) + 100) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>STACKING ORDER</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  value={item.zIndex || 0}
                                  onChange={(e) => handleItemChange(item.id, "zIndex", parseInt(e.target.value))}
                                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    accentColor: accentColor,
                                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(item.zIndex || 0) / 10 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(item.zIndex || 0) / 10 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h5 className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>TRANSFORM</h5>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>SCALE</label>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setScaleMode("mobile")}
                                      className={`p-1.5 rounded-lg transition-colors ${scaleMode === "mobile" ? "bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-75"}`}
                                      title="Mobile scale"
                                    >
                                      <img src="/assets/ico-mobile.png" alt="Mobile" width="16" height="16" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setScaleMode("desktop")}
                                      className={`p-1.5 rounded-lg transition-colors ${scaleMode === "desktop" ? "bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-75"}`}
                                      title="Desktop scale"
                                    >
                                      <img src="/assets/ico-desktop.png" alt="Desktop" width="16" height="16" />
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2"
                                  step="0.1"
                                  value={scaleMode === "mobile" ? (item.scaleMobile || 1) : (item.scaleDesktop || 1)}
                                  onChange={(e) => handleItemChange(item.id, scaleMode === "mobile" ? "scaleMobile" : "scaleDesktop", parseFloat(e.target.value))}
                                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    accentColor: accentColor,
                                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((scaleMode === "mobile" ? (item.scaleMobile || 1) : (item.scaleDesktop || 1)) - 0.5) / 1.5 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((scaleMode === "mobile" ? (item.scaleMobile || 1) : (item.scaleDesktop || 1)) - 0.5) / 1.5 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={`block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>ROTATE (DEGREES)</label>
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={item.rotate || 0}
                                  onChange={(e) => handleItemChange(item.id, "rotate", parseInt(e.target.value))}
                                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    accentColor: accentColor,
                                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((item.rotate || 0) + 180) / 360 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((item.rotate || 0) + 180) / 360 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                                  }}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                              style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#ef4444" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#dc2626"
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#ef4444"
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                              DELETE DESIGN
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  handleAddDirectoryItem();
                  if (directoryItems.length >= 6) {
                    handleCloseDraftDesignPanel();
                  }
                }}
                disabled={directoryItems.length >= 7}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                  directoryItems.length >= 7
                    ? "opacity-50 cursor-not-allowed bg-gray-300"
                    : "text-white hover:brightness-90"
                }`}
                style={{ fontFamily: "Inter, sans-serif", backgroundColor: directoryItems.length >= 7 ? undefined : accentColor }}
              >
                + ADD DESIGN
              </button>

              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 flex flex-col px-4 py-3 rounded-lg border ${draftShadowExpanded ? "ring-2" : ""} ${isDarkMode ? "border-gray-700 bg-gray-700/30" : "border-gray-200 bg-gray-50"} ${draftShadowExpanded ? "gap-4" : ""}`}
                  style={draftShadowExpanded ? { borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}20` } : undefined}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraftShadowExpanded(!draftShadowExpanded);
                    }}
                  >
                    <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>DRAFT SHADOW</label>
                    <div
                      className="relative inline-block w-11 h-6 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = !draftShadowEnabled;
                        setDraftShadowEnabled(newValue);
                        onChange?.("weddingDirectoryDraftShadowEnabled", newValue);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={draftShadowEnabled}
                        onChange={(e) => {
                          setDraftShadowEnabled(e.target.checked);
                          onChange?.("weddingDirectoryDraftShadowEnabled", e.target.checked);
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${draftShadowEnabled ? "" : "bg-gray-200"}`}
                        style={{ backgroundColor: draftShadowEnabled ? accentColor : undefined }}
                      />
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${draftShadowEnabled ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                  </div>

                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: draftShadowExpanded ? '500px' : '0px',
                      opacity: draftShadowExpanded ? '1' : '0'
                    }}
                  >
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>VISIBILITY</label>
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{draftShadowVisibility}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={draftShadowVisibility}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            setDraftShadowVisibility(newValue);
                            onChange?.("weddingDirectoryDraftShadowVisibility", newValue);
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${draftShadowVisibility}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${draftShadowVisibility}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>BLUR</label>
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{draftShadowBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={draftShadowBlur}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            setDraftShadowBlur(newValue);
                            onChange?.("weddingDirectoryDraftShadowBlur", newValue);
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${draftShadowBlur / 50 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${draftShadowBlur / 50 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>ADJUST LEFT TO RIGHT</label>
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{draftShadowOffsetX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={draftShadowOffsetX}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            setDraftShadowOffsetX(newValue);
                            onChange?.("weddingDirectoryDraftShadowOffsetX", newValue);
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((draftShadowOffsetX + 30) / 60) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((draftShadowOffsetX + 30) / 60) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>ADJUST TOP TO BOTTOM</label>
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{draftShadowOffsetY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={draftShadowOffsetY}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            setDraftShadowOffsetY(newValue);
                            onChange?.("weddingDirectoryDraftShadowOffsetY", newValue);
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((draftShadowOffsetY + 30) / 60) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((draftShadowOffsetY + 30) / 60) * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 shrink-0 border-t flex items-center justify-end" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <button
              type="button"
              onClick={handleCloseDraftDesignPanel}
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

    {photoPickerItemId && createPortal(
      <PhotoGalleryPicker
        galleryImages={data.galleryImages || []}
        selectedUrl={(() => {
          const [baseId, paperType] = photoPickerItemId.split("-paper");
          const item = directoryItems.find((i) => i.id === baseId);
          if (!item) return "";
          if (paperType === "1") return item.photoPapersImage1 || "";
          if (paperType === "2") return item.photoPapersImage2 || "";
          return item.imageUrl || "";
        })()}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        desktopMode={desktopMode}
        panelPosition={panelPosition}
        isClosing={isPhotoPickerClosing}
        onSelect={(url) => {
          const [baseId, paperType] = photoPickerItemId.split("-paper");
          if (paperType === "1") {
            handleItemChange(baseId, "photoPapersImage1", url);
          } else if (paperType === "2") {
            handleItemChange(baseId, "photoPapersImage2", url);
          } else {
            handleItemChange(photoPickerItemId, "imageUrl", url);
          }
          handleClosePhotoPicker();
        }}
        onClose={handleClosePhotoPicker}
      />,
      document.body
    )}
    </>
  );
}

function PhotoGalleryPicker({
  galleryImages,
  selectedUrl,
  isDarkMode,
  accentColor,
  desktopMode,
  panelPosition,
  isClosing,
  onSelect,
  onClose,
}: {
  galleryImages: string[];
  selectedUrl: string;
  isDarkMode: boolean;
  accentColor: string;
  desktopMode: boolean;
  panelPosition: "left" | "right";
  isClosing: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      selectedRef.current.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, []);

  const resolvedImages = galleryImages.map((url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/")) return url;
    return `/stock/gallery/${url}`;
  }).filter(Boolean);

  return (
    <>
      {!isClosing && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onMouseDown={onClose}
          onWheel={onClose}
        />
      )}
      <div
        className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
          desktopMode
            ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
            : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
        }`}
        style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
      >
        {!desktopMode && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
          </div>
        )}
        <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h3
            className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Choose Photo
          </h3>
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onSelect("")}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                !selectedUrl
                  ? "border-[#b88a78] bg-[#fff0e8]"
                  : `${isDarkMode ? "border-gray-600 bg-gray-700 hover:border-gray-500" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`
              }`}
              style={!selectedUrl ? { borderColor: accentColor, backgroundColor: `${accentColor}15` } : undefined}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "#9ca3af" : "#aaa"} strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>Auto</span>
            </button>
            {resolvedImages.map((url, idx) => (
              <button
                key={idx}
                ref={selectedUrl === galleryImages[idx] ? selectedRef : undefined}
                onClick={() => onSelect(galleryImages[idx])}
                className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all active:scale-95 ${
                  selectedUrl === galleryImages[idx]
                    ? "ring-2 ring-[#b88a78]/30"
                    : `${isDarkMode ? "border-transparent hover:border-gray-600" : "border-transparent hover:border-gray-200"}`
                }`}
              >
                <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {resolvedImages.length === 0 && (
              <div className={`col-span-3 text-center py-8 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>
                No gallery images. Add photos in Tools &gt; Media &gt; Photo Gallery.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
