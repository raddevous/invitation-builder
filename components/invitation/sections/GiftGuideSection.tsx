"use client";

import { useState, useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import Divider from "./Divider";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface GiftGuideSectionProps {
  data: InvitationData;
  onChange?: (key: keyof InvitationData, value: any) => void;
  panelPosition?: "left" | "right";
  desktopMode?: boolean;
  editMode?: boolean;
}

type TabType = "bank" | "wallet";
type AccountType = "account1" | "account2";

export default function GiftGuideSection({ data, onChange, panelPosition = "left", desktopMode = false, editMode = false }: GiftGuideSectionProps) {
  if (!data.sections.giftguide) return null;

  const { isDarkMode, accentColor } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("bank");
  const [selectedAccount, setSelectedAccount] = useState<AccountType>("account1");
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [isTypographyClosing, setIsTypographyClosing] = useState(false);
  const [showGiftGuideSettingsPanel, setShowGiftGuideSettingsPanel] = useState(false);
  const [isGiftGuideSettingsClosing, setIsGiftGuideSettingsClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [predefinedVideoIndex, setPredefinedVideoIndex] = useState(0);
  const [predefinedImageIndex, setPredefinedImageIndex] = useState(0);
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
  const { options: predefinedVideos } = usePredefinedOptions('background_videos');
  const { options: predefinedImages } = usePredefinedOptions('background_images');
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');
  const { options: predefinedDividerImagesCentered } = usePredefinedOptions('dividers_centeredsingle');
  const { options: predefinedDividerImagesSplit } = usePredefinedOptions('dividers_splithorizontal');
  const { options: predefinedDividerImagesMirrored } = usePredefinedOptions('dividers_mirroredcorners');

  // Helper function to get crystal colors based on structure
  const getCrystalColors = (currentData: InvitationData) => {
    const crystalColors = {
      bg15: '',
      bg10: '',
      bg20: '',
      bg30: '',
      bg40: '',
      bg5: '',
      borderWhite20: '',
      borderWhite30: '',
      borderWhite40: '',
      textWhite: '',
      textWhite50: '',
      textWhite60: '',
      textWhite70: '',
      textWhite80: '',
      // For inline styles
      bg15Style: '',
      bg10Style: '',
      bg20Style: '',
      bg30Style: '',
      bg40Style: '',
      bg5Style: '',
      borderWhite20Style: '',
      borderWhite30Style: '',
      borderWhite40Style: ''
    };

    // Check if custom crystal color is set
    const customCrystalColor = currentData.giftguideCrystalColor;
    if (customCrystalColor) {
      return {
        ...crystalColors,
        bg15Style: hexToRgba(customCrystalColor, 0.15),
        bg10Style: hexToRgba(customCrystalColor, 0.10),
        bg20Style: hexToRgba(customCrystalColor, 0.20),
        bg30Style: hexToRgba(customCrystalColor, 0.30),
        bg40Style: hexToRgba(customCrystalColor, 0.40),
        bg5Style: hexToRgba(customCrystalColor, 0.05),
        borderWhite20Style: hexToRgba(customCrystalColor, 0.20),
        borderWhite30Style: hexToRgba(customCrystalColor, 0.30),
        borderWhite40Style: hexToRgba(customCrystalColor, 0.40),
        textWhite: 'text-white',
        textWhite50: 'text-white/50',
        textWhite60: 'text-white/60',
        textWhite70: 'text-white/70',
        textWhite80: 'text-white/80'
      };
    }

    // Default white crystal (only structure)
    return {
      ...crystalColors,
      bg15: 'bg-white/15',
      bg10: 'bg-white/10',
      bg20: 'bg-white/20',
      bg30: 'bg-white/30',
      bg40: 'bg-white/40',
      bg5: 'bg-white/5',
      borderWhite20: 'border-white/20',
      borderWhite30: 'border-white/30',
      borderWhite40: 'border-white/40',
      textWhite: 'text-white',
      textWhite50: 'text-white/50',
      textWhite60: 'text-white/60',
      textWhite70: 'text-white/70',
      textWhite80: 'text-white/80'
    };
  };

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

  const handleCloseGiftGuideSettingsPanel = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
    setIsGiftGuideSettingsClosing(true);
    setTimeout(() => {
      setShowGiftGuideSettingsPanel(false);
      setIsGiftGuideSettingsClosing(false);
    }, 300);
  };

  const handleChange = (key: keyof InvitationData, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    onChange?.(key, value);
  };

  
  // Merge original data with pending changes for display
  const mergedData = { ...data, ...pendingChanges };

  // Get crystal colors based on current structure
  const crystalColors = getCrystalColors(mergedData);

  
  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.giftguideBackgroundType === "color" && !mergedData.giftguideBackgroundColor) {
      handleChange("giftguideBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.giftguideBackgroundType === "gradient" && !mergedData.giftguideGradient) {
      handleChange("giftguideGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.giftguideBackgroundType === "image" && !mergedData.giftguideImage) {
      handleChange("giftguideImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("giftguideGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.giftguideBackgroundType === "video" && !mergedData.giftguideVideo) {
      handleChange("giftguideVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("giftguideGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.giftguideBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  // Slideshow effect for image background
  useEffect(() => {
    if (mergedData.giftguideBackgroundType === "image" && mergedData.giftguideImage?.urls && mergedData.giftguideImage.urls.length > 1) {
      const validUrls = mergedData.giftguideImage.urls.filter(url => url.trim() !== "");
      if (validUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % validUrls.length);
        }, 15000); // Change image every 15 seconds
        return () => clearInterval(interval);
      }
    }
  }, [mergedData.giftguideBackgroundType, mergedData.giftguideImage?.urls]);

  const bank = data.giftBank || {
    name: "Bank",
    account1: { qrCode: "", maskedName: "" },
    account2: { qrCode: "", maskedName: "" },
  };

  const wallet = data.giftWallet || {
    name: "Wallet",
    account1: { qrCode: "", maskedName: "" },
    account2: { qrCode: "", maskedName: "" },
  };

  const currentData = activeTab === "bank" ? bank : wallet;
  const currentAccount = currentData[selectedAccount];

  // Only show tabs if at least one account has a QR code
  const hasBankAccounts = bank.account1.qrCode || bank.account2.qrCode;
  const hasWalletAccounts = wallet.account1.qrCode || wallet.account2.qrCode;

  if (!hasBankAccounts && !hasWalletAccounts) return null;

  // If current tab has no accounts, switch to the other
  if (activeTab === "bank" && !hasBankAccounts && hasWalletAccounts) {
    setActiveTab("wallet");
  } else if (activeTab === "wallet" && !hasWalletAccounts && hasBankAccounts) {
    setActiveTab("bank");
  }

  // Get available accounts for current tab
  const availableAccounts: AccountType[] = [];
  if (currentData.account1.qrCode) availableAccounts.push("account1");
  if (currentData.account2.qrCode) availableAccounts.push("account2");

  // If selected account has no QR code, select first available
  if (!currentAccount.qrCode && availableAccounts.length > 0) {
    setSelectedAccount(availableAccounts[0]);
  }

  const displayAccount = selectedAccount && currentData[selectedAccount].qrCode
    ? currentData[selectedAccount]
    : currentData[availableAccounts[0]];

  const giftguideUseDefaultDivider = data.giftguideDividerUseDefault ?? true;
  const effectivePullDown = giftguideUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.giftguideDividerPullDown ?? 0);
  const effectiveVerticalFlip = giftguideUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.giftguideDividerVerticalFlip ?? false);

  return (
    <section className="pt-0 pb-8 px-8 relative min-h-[200px]" style={{
      backgroundColor: mergedData.giftguideUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.giftguideBackgroundType === "gradient"
          ? undefined
          : mergedData.giftguideBackgroundType === "image"
            ? undefined
            : mergedData.giftguideBackgroundType === "video"
              ? undefined
              : (mergedData.giftguideBackgroundColor || "transparent"),
      background: mergedData.giftguideUseMainColor !== false
        ? (data.mainColor1 || "transparent")
        : mergedData.giftguideBackgroundType === "gradient" && mergedData.giftguideGradient
          ? `linear-gradient(135deg, ${mergedData.giftguideGradient.firstColor || "#ffffff"}, ${mergedData.giftguideGradient.secondColor || "#ffffff"})`
          : undefined,
      ...(mergedData.giftguideBackgroundType === "image" && mergedData.giftguideImage?.urls && mergedData.giftguideImage.urls.length > 0 ? {
        backgroundImage: `url(${mergedData.giftguideImage.urls.filter(url => url.trim() !== "")[currentImageIndex]})`,
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      } : {}),
      transition: 'background 1s ease-in-out'
    }}>
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.giftguideBackgroundType === "image" || mergedData.giftguideBackgroundType === "video") && mergedData.giftguideGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.giftguideGradient.firstColor || "#ffffff", (mergedData.giftguideGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.giftguideGradient.secondColor || "#ffffff", (mergedData.giftguideGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.giftguideBackgroundType === "video" && mergedData.giftguideVideo?.url && (
        <video
          src={normalizeVideoUrl(mergedData.giftguideVideo.url)}
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
        type={giftguideUseDefaultDivider ? (data.universalDivider || "none") : (data.giftguideDivider || "none")} 
        color={data.mainColor2} 
        id="gift-guide-cssid" 
        offset={giftguideUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.giftguideDividerOffset ?? 0)}
        tintColor={giftguideUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.giftguideDividerTintColor || data.mainColor2)}
        tintOpacity={giftguideUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.giftguideDividerTintOpacity ?? 100)}
        dividerStyle={giftguideUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.giftguideDividerStyle || "centered-single")}
        flip={giftguideUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.giftguideDividerFlip ?? false)}
        spacing={giftguideUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.giftguideDividerSpacing ?? 0)}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={giftguideUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.giftguideDividerImageSize ?? 100)}
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={giftguideUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.giftguideDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={giftguideUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.giftguideDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={giftguideUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.giftguideDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={giftguideUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.giftguideDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (giftguideUseDefaultDivider) {
            onChange?.("giftguideDividerUseDefault", false);
          }
          onChange?.("giftguideDivider", newType);
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('gift-guide-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Gift Guide Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.giftguideDivider && data.giftguideDivider !== "none" ? data.giftguideDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("giftguideDivider", value)}
          tintColor={data.giftguideDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("giftguideDividerTintColor", value)}
          tintOpacity={data.giftguideDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("giftguideDividerTintOpacity", value)}
          dividerStyle={data.giftguideDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("giftguideDividerStyle", value)}
          flip={data.giftguideDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("giftguideDividerFlip", value)}
          spacing={data.giftguideDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("giftguideDividerSpacing", value)}
          pullDown={data.giftguideDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("giftguideDividerPullDown", value)}
          verticalFlip={data.giftguideDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("giftguideDividerVerticalFlip", value)}
          imageSize={data.giftguideDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("giftguideDividerImageSize", value)}
          useDefault={giftguideUseDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("giftguideDividerUseDefault", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.giftguideDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("giftguideDividerCustomImageUrl1", value)}
          customImageUrl2={data.giftguideDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("giftguideDividerCustomImageUrl2", value)}
          customImageUrl3={data.giftguideDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("giftguideDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.giftguideDivider === "divider-1" ? predefinedDividerImagesCentered : data.giftguideDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          colorBlend={data.giftguideDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("giftguideDividerColorBlend", value)}
        />
      )}
      
            <h2
        className="text-2xl mb-1 md:mb-8 text-center font-bold uppercase scale-[0.55] md:scale-100"
        style={{
          color: mergedData.giftguideUseMainColor !== false ? data.mainColor2 : (mergedData.giftguideHeadingColor || data.mainColor2),
          fontFamily: mergedData.giftguideUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.giftguideHeadingTypography || data.headingFont, "heading"),
          fontSize: `${(mergedData.giftguideHeadingFontSize || 100) * 3}%`,
          lineHeight: '1.2'
        }}
      >
        <span
          className={editMode ? "cursor-pointer" : ""}
          onClick={editMode ? () => {
          setShowTypographyPanel(true);
          const element = document.getElementById('gift-guide-cssid');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } : undefined}
      >
        {mergedData.giftguideHeading || "Gift Guide"}
        </span>
      </h2>

      <div className="max-w-2xl mx-auto">
        <p
          className="text-center mb-10 leading-relaxed scale-[0.7] md:scale-100"
          style={{
            color: mergedData.giftguideUseMainColor !== false ? data.neutralColor1 : (mergedData.giftguideMessageColor || data.neutralColor1),
            fontFamily: mergedData.giftguideUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.giftguideMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.giftguideMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.giftMessage || "Your love, presence, and prayers mean the world to us. Should you wish to honor us with a gift, a contribution toward our future together would be warmly appreciated and forever cherished."}
        </p>

        {/* Gift Guide Container */}
        <div className="max-w-2xl mx-auto">
          <div className="p-6">
            
            {/* Bank/Wallet tabs container */}
            <div className="flex justify-center mb-8">
              <div 
                className={`backdrop-blur-lg ${crystalColors.bg15} rounded-full p-1.5 inline-flex border ${crystalColors.borderWhite20} shadow-xl relative overflow-hidden`}
                style={{
                  backgroundColor: crystalColors.bg15Style || undefined,
                  borderColor: crystalColors.borderWhite20Style || undefined
                }}
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full"
                  style={{
                    backgroundColor: crystalColors.bg5Style || undefined
                  }}
                ></div>
              {hasBankAccounts && (
                <button
                  onClick={() => {
                    setActiveTab("bank");
                    setSelectedAccount("account1");
                  }}
                  className={`px-6 py-2.5 text-sm font-medium transition-all duration-300 relative ${
                    activeTab === "bank"
                      ? `bg-gradient-to-r from-white/40 to-white/20 ${crystalColors.textWhite} shadow-lg rounded-l-full border ${crystalColors.borderWhite30} backdrop-blur-md`
                      : `bg-white/10 ${crystalColors.textWhite50} hover:bg-white/20 hover:${crystalColors.textWhite80} rounded-l-full border ${crystalColors.borderWhite20}`
                  }`}
                  style={{
                    background: activeTab === "bank" 
                      ? `linear-gradient(to right, ${crystalColors.bg40Style || 'rgba(255,255,255,0.4)'}, ${crystalColors.bg20Style || 'rgba(255,255,255,0.2)'})`
                      : crystalColors.bg10Style || undefined,
                    borderColor: activeTab === "bank" 
                      ? crystalColors.borderWhite30Style || undefined
                      : crystalColors.borderWhite20Style || undefined,
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  {activeTab === "bank" && (
                    <span className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-l-full"></span>
                  )}
                  <span className="relative z-10">{bank.name || "Bank"}</span>
                </button>
              )}
              {hasWalletAccounts && (
                <button
                  onClick={() => {
                    setActiveTab("wallet");
                    setSelectedAccount("account1");
                  }}
                  className={`px-6 py-2.5 text-sm font-medium transition-all duration-300 relative ${
                    activeTab === "wallet"
                      ? `bg-gradient-to-l from-white/40 to-white/20 ${crystalColors.textWhite} shadow-lg rounded-r-full border ${crystalColors.borderWhite30} backdrop-blur-md`
                      : `bg-white/10 ${crystalColors.textWhite50} hover:bg-white/20 hover:${crystalColors.textWhite80} rounded-r-full border ${crystalColors.borderWhite20}`
                  }`}
                  style={{
                    background: activeTab === "wallet" 
                      ? `linear-gradient(to left, ${crystalColors.bg40Style || 'rgba(255,255,255,0.4)'}, ${crystalColors.bg20Style || 'rgba(255,255,255,0.2)'})`
                      : crystalColors.bg10Style || undefined,
                    borderColor: activeTab === "wallet" 
                      ? crystalColors.borderWhite30Style || undefined
                      : crystalColors.borderWhite20Style || undefined,
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  {activeTab === "wallet" && (
                    <span className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent rounded-r-full"></span>
                  )}
                  <span className="relative z-10">{wallet.name || "Wallet"}</span>
                </button>
              )}
              </div>
            </div>

            {/* Account selector */}
            {availableAccounts.length > 1 && (
              <div className="flex justify-center gap-2 mb-8">
                {availableAccounts.map((accountKey) => (
                  <button
                    key={accountKey}
                    onClick={() => setSelectedAccount(accountKey)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all backdrop-blur-sm ${
                      selectedAccount === accountKey
                        ? `bg-white/30 ${crystalColors.textWhite} border ${crystalColors.borderWhite40} shadow-lg`
                        : `bg-white/10 ${crystalColors.textWhite70} border ${crystalColors.borderWhite20} hover:bg-white/20`
                    }`}
                    style={{
                      backgroundColor: selectedAccount === accountKey 
                        ? crystalColors.bg30Style || undefined
                        : crystalColors.bg10Style || undefined,
                      borderColor: selectedAccount === accountKey 
                        ? crystalColors.borderWhite40Style || undefined
                        : crystalColors.borderWhite20Style || undefined,
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    Account {accountKey === "account1" ? "1" : "2"}
                  </button>
                ))}
              </div>
            )}

            {/* Account Info Container with Glass Effect */}
            <div 
                className={`backdrop-blur-md ${crystalColors.bg10} rounded-2xl p-6 border ${crystalColors.borderWhite20} shadow-xl relative overflow-hidden w-64 mx-auto`}
                style={{
                  backgroundColor: crystalColors.bg10Style || undefined,
                  borderColor: crystalColors.borderWhite20Style || undefined
                }}
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"
                  style={{
                    backgroundColor: crystalColors.bg5Style || undefined
                  }}
                ></div>
              
              {/* QR Code display - NO glass effect */}
              <div className="flex flex-col items-center relative z-10">
                {displayAccount?.qrCode && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                      setShowGiftGuideSettingsPanel(true);
                      const element = document.getElementById('gift-guide-cssid');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}>
                    <img
                      src={displayAccount.qrCode}
                      alt={`QR Code for ${displayAccount.maskedName}`}
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                )}
                <p 
                  className="text-[10px] text-white/60 mb-2 text-center px-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Make sure the account information on display matches on your mobile bank or wallet app.
                </p>
                <p
                  className="text-sm font-medium text-white"
                  style={{
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  {displayAccount?.maskedName || `Account ${selectedAccount === "account1" ? "1" : "2"}`}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      </div>

      {/* Spacer below QR code crystal container */}
      <div style={{ height: '50px' }} />

      {/* Thank You Message below QR code container */}
      {mergedData.giftThankYouMessage && (
        <p
          className="text-center max-w-2xl mx-auto px-4 leading-relaxed scale-[0.7] md:scale-100"
          style={{
            position: 'relative',
            zIndex: 2,
            color: mergedData.giftguideUseMainColor !== false ? data.neutralColor1 : (mergedData.giftguideMessageColor || data.neutralColor1),
            fontFamily: mergedData.giftguideUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.giftguideMessageTypography || data.bodyFont, "body"),
            fontSize: `${mergedData.giftguideMessageFontSize || 100}%`,
            opacity: 0.85
          }}
        >
          {mergedData.giftThankYouMessage}
        </p>
      )}

      {/* Spacer below thank you message */}
      <div style={{ height: '50px' }} />

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
                Gift Guide - Section Design
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
                      value={mergedData.giftguideHeading ?? ""}
                      onChange={(e) => handleChange("giftguideHeading", e.target.value)}
                      placeholder="Gift Guide"
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedHeadings = [
                          "Gift Guide",
                          "For Those Who Wish",
                          "Gifting Information",
                          "Our Future Together",
                          "Our Registry",
                          "Registry & Gifts",
                          "With Gratitude"
                        ];
                        const currentIndex = predefinedHeadings.indexOf(mergedData.giftguideHeading ?? "");
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                        handleChange("giftguideHeading", predefinedHeadings[nextIndex]);
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
                    value={mergedData.giftguideHeadingTypography || data.headingFont}
                    onChange={(value) => handleChange("giftguideHeadingTypography", value)}
                    type="heading"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.giftguideUseMainColor !== false}
                    predefinedFonts={predefinedHeadingFonts}
                  />
                </div>
                
                {/* Heading Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.giftguideHeadingFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.giftguideHeadingFontSize || 100}
                    onChange={(e) => handleChange("giftguideHeadingFontSize", parseInt(e.target.value))}
                    disabled={mergedData.giftguideUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.giftguideHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.giftguideHeadingFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Heading Color */}
                <ColorControl
                  label="Heading Color"
                  value={mergedData.giftguideHeadingColor || data.mainColor2}
                  onChange={(value) => handleChange("giftguideHeadingColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={data.accentColor}
                  disabled={data.giftguideUseMainColor !== false}
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
                      value={mergedData.giftMessage ?? ""}
                      onChange={(e) => handleChange("giftMessage", e.target.value)}
                      placeholder="Your love, presence, and prayers mean the world to us..."
                      rows={3}
                      className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors resize-none ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedMessages = [
                          "Your love and support are the greatest gifts we could ever receive. If you would like to honor us with a gift, a contribution toward building our new life together would be sincerely appreciated and deeply cherished.",
                          "As we begin this beautiful new chapter, your presence and blessings mean everything to us. Should you wish to bless us with a gift, a contribution toward our future home and dreams would be most warmly appreciated.",
                          "Celebrating our wedding day with you is our highest joy. For those who wish to honor us with a token of love, a contribution toward our journey ahead would be a wonderful blessing to our new family.",
                          "We are so blessed to already have a home filled with love and everyday essentials. In lieu of traditional gifts, a contribution toward our future together would help us create memories that last a lifetime.",
                          "Your presence, prayers, and laughter on our big day are all we truly ask for. However, if you are looking to honor us with a gift, a monetary contribution toward our future would be received with absolute gratitude.",
                          "The love you show us is the best gift of all. If it is your wish to give something more, we would be incredibly grateful for a contribution toward our future together as husband and wife.",
                          "Your presence at our wedding is the greatest gift we could ask for. Should you wish to honor us further, a contribution toward our future together would be warmly and deeply appreciated.",
                          "Having you celebrate with us is what matters most. For guests wishing to give a gift, we are gratefully accepting contributions toward our next chapter and future dreams.",
                          "Your love and prayers mean the world to us as we marry. If you would like to honor us with a gift, a contribution toward our honeymoon and setting up our future home would be a beautiful blessing.",
                          "We are incredibly grateful for the love that surrounds us. If you wish to bless us with a gift, we kindly ask for a contribution toward our future goals, helping us build a foundation for the life ahead."
                        ];
                        const currentIndex = predefinedMessages.indexOf(mergedData.giftMessage ?? "");
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedMessages.length - 1 ? 0 : currentIndex + 1;
                        handleChange("giftMessage", predefinedMessages[nextIndex]);
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
                    value={mergedData.giftguideMessageTypography || data.bodyFont}
                    onChange={(value) => handleChange("giftguideMessageTypography", value)}
                    type="body"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.giftguideUseMainColor !== false}
                    predefinedFonts={predefinedBodyFonts.map(f => f.value)}
                  />
                </div>
                
                {/* Message Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Message Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.giftguideMessageFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.giftguideMessageFontSize || 100}
                    onChange={(e) => handleChange("giftguideMessageFontSize", parseInt(e.target.value))}
                    disabled={mergedData.giftguideUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.giftguideMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.giftguideMessageFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Message Color */}
                <ColorControl
                  label="Message Color"
                  value={mergedData.giftguideMessageColor || data.neutralColor1}
                  onChange={(value) => handleChange("giftguideMessageColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={data.accentColor}
                  disabled={data.giftguideUseMainColor !== false}
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
                  value={mergedData.giftguideBackgroundType || "color"}
                  onChange={(e) => handleChange("giftguideBackgroundType", e.target.value)}
                  disabled={mergedData.giftguideUseMainColor !== false}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="color">Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Gradient Overlay */}
              {(mergedData.giftguideBackgroundType === "image" || mergedData.giftguideBackgroundType === "video") && (
                <div className="space-y-4">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.giftguideGradient?.firstColor || "#ffffff"}
                            onChange={(e) => handleChange("giftguideGradient", { ...mergedData.giftguideGradient, firstColor: e.target.value })}
                            disabled={mergedData.giftguideUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.giftguideGradient?.firstColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("giftguideGradient", { ...mergedData.giftguideGradient, firstColor: value });
                          }}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.giftguideGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("giftguideGradient", { ...mergedData.giftguideGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.giftguideGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.giftguideGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.giftguideGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.giftguideGradient?.secondColor || "#ffffff"}
                            onChange={(e) => handleChange("giftguideGradient", { ...mergedData.giftguideGradient, secondColor: e.target.value })}
                            disabled={mergedData.giftguideUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.giftguideGradient?.secondColor || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("giftguideGradient", { ...mergedData.giftguideGradient, secondColor: value });
                          }}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.giftguideGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("giftguideGradient", { ...mergedData.giftguideGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.giftguideGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.giftguideGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.giftguideGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Option */}
              {mergedData.giftguideBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={mergedData.giftguideBackgroundColor || "#ffffff"}
                        onChange={(e) => handleChange("giftguideBackgroundColor", e.target.value)}
                        disabled={mergedData.giftguideUseMainColor !== false}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.giftguideBackgroundColor || "#ffffff"}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        handleChange("giftguideBackgroundColor", value);
                      }}
                      disabled={mergedData.giftguideUseMainColor !== false}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Gradient Option */}
              {mergedData.giftguideBackgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>First Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.giftguideGradient?.firstColor || "#ffffff"}
                          onChange={(e) => handleChange("giftguideGradient", { ...mergedData.giftguideGradient, firstColor: e.target.value })}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.giftguideGradient?.firstColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("giftguideGradient", { ...mergedData.giftguideGradient, firstColor: value });
                        }}
                        disabled={mergedData.giftguideUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          value={mergedData.giftguideGradient?.secondColor || "#ffffff"}
                          onChange={(e) => handleChange("giftguideGradient", { ...mergedData.giftguideGradient, secondColor: e.target.value })}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.giftguideGradient?.secondColor || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("giftguideGradient", { ...mergedData.giftguideGradient, secondColor: value });
                        }}
                        disabled={mergedData.giftguideUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Option */}
              {mergedData.giftguideBackgroundType === "image" && (
                <div className="space-y-3">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URLs</label>
                  {(mergedData.giftguideImage?.urls || [""]).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...(mergedData.giftguideImage?.urls || [""])];
                            newUrls[index] = e.target.value;
                            handleChange("giftguideImage", { urls: newUrls });
                          }}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                            setPredefinedImageIndex(nextIndex);
                            const newUrls = [...(mergedData.giftguideImage?.urls || [""])];
                            newUrls[index] = predefinedImages[nextIndex]?.value || "";
                            handleChange("giftguideImage", { urls: newUrls });
                          }}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      {(mergedData.giftguideImage?.urls?.length || 1) > 1 && (
                        <button
                          onClick={() => {
                            const newUrls = mergedData.giftguideImage?.urls.filter((_, i) => i !== index) || [];
                            handleChange("giftguideImage", { urls: newUrls.length > 0 ? newUrls : [""] });
                          }}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {index === (mergedData.giftguideImage?.urls?.length || 1) - 1 && (mergedData.giftguideImage?.urls?.length || 1) < 5 && (
                        <button
                          onClick={() => {
                            const newUrls = [...(mergedData.giftguideImage?.urls || [""]), ""];
                            handleChange("giftguideImage", { urls: newUrls });
                          }}
                          disabled={mergedData.giftguideUseMainColor !== false}
                          className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {mergedData.giftguideBackgroundType === "video" && (
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.giftguideVideo?.url || ""}
                      onChange={(e) => handleChange("giftguideVideo", { url: e.target.value })}
                      disabled={mergedData.giftguideUseMainColor !== false}
                      className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="https://example.com/video.mp4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                        setPredefinedVideoIndex(nextIndex);
                        handleChange("giftguideVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                      }}
                      disabled={mergedData.giftguideUseMainColor !== false}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${mergedData.giftguideUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  checked={mergedData.giftguideUseMainColor !== false}
                  onChange={(e) => handleChange("giftguideUseMainColor", e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => handleChange("giftguideUseMainColor", !(mergedData.giftguideUseMainColor !== false))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    mergedData.giftguideUseMainColor !== false
                      ? "border-[currentColor] bg-[currentColor]"
                      : "border-gray-300 bg-white"
                  }`}
                  style={{
                    color: accentColor
                  }}
                >
                  {mergedData.giftguideUseMainColor !== false && (
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

      {/* Gift Guide Settings panel */}
      {showGiftGuideSettingsPanel && (
        <>
          {/* Backdrop */}
          {!isGiftGuideSettingsClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseGiftGuideSettingsPanel} onWheel={handleCloseGiftGuideSettingsPanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isGiftGuideSettingsClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isGiftGuideSettingsClosing ? "animate-slide-down" : "animate-slide-up"}`
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
                Gift Guide - Section Design
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Thank You Message Section */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
                
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Thank You Message</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.giftThankYouMessage ?? ""}
                      onChange={(e) => handleChange("giftThankYouMessage", e.target.value)}
                      placeholder="Thank you for being part of our story."
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531", fontFamily: "Inter, sans-serif" } : { backgroundColor: "#F3F4F6", fontFamily: "Inter, sans-serif" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedThankYouMessages = [
                          "With all our love and deepest gratitude.",
                          "Thank you for being part of our story.",
                          "Thank you from the bottom of our hearts.",
                          "With love and appreciation, always.",
                          "With sincere thanks and appreciation."
                        ];
                        const currentIndex = predefinedThankYouMessages.indexOf(mergedData.giftThankYouMessage ?? "");
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedThankYouMessages.length - 1 ? 0 : currentIndex + 1;
                        handleChange("giftThankYouMessage", predefinedThankYouMessages[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Cycle predefined messages"
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

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

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
                        value={mergedData.giftguideCrystalColor || '#ffffff'}
                        onChange={(e) => handleChange("giftguideCrystalColor", e.target.value)}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={mergedData.giftguideCrystalColor || ''}
                      onChange={(e) => {
                        let color = e.target.value.trim();
                        // Add # if not present and it's a valid hex code
                        if (color && !color.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(color)) {
                          color = '#' + color;
                        }
                        handleChange("giftguideCrystalColor", color);
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
                        onClick={() => handleChange("giftguideCrystalColor", color.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90`}
                        style={{
                          backgroundColor: color.value,
                          borderColor: mergedData.giftguideCrystalColor === color.value ? data.accentColor : "transparent",
                          boxShadow: mergedData.giftguideCrystalColor === color.value ? `0 0 0 1px ${data.accentColor}` : "0 1px 3px rgba(0,0,0,0.15)",
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-end" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <button
                type="button"
                onClick={handleCloseGiftGuideSettingsPanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                style={{
                  backgroundColor: data.accentColor,
                  fontFamily: "Inter, sans-serif"
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
