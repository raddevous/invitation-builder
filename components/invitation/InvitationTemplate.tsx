"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Invitation, InvitationData } from "@/lib/types/invitation";
import WelcomeScreenManager from "./welcome-screens/WelcomeScreenManager";
import HeroSection from "./sections/HeroSection";
import DetailsSection from "./sections/DetailsSection";
import GallerySection from "./sections/GallerySection";
import MapSection from "./sections/MapSection";
import RSVPSection from "./sections/RSVPSection";
import CountdownSection from "./sections/CountdownSection";
import DressCodeSection from "./sections/DressCodeSection";
import TimelineSection from "./sections/TimelineSection";
import GiftGuideSection from "./sections/GiftGuideSection";
import EntourageSection from "./sections/EntourageSection";
import FooterSection from "./sections/FooterSection";
import WeddingDirectorySection from "./sections/WeddingDirectorySection";
import MusicPlayer from "./MusicPlayer";
import { MusicProvider } from "./MusicContext";
import CustomFontLoader from "./CustomFontLoader";
import { ThemeProvider } from "./ThemeContext";

interface InvitationTemplateProps {
  invitation: Invitation;
  previewMode?: boolean;
  editMode?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  onChange?: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  printResizeScale?: number;
  prePrintActive?: boolean;
  tempRemoveBackground?: boolean;
  tempBackgroundImage?: string | null;
  tempBackgroundYPosition?: number;
  tempBackgroundXPosition?: number;
  tempBackgroundZoom?: number;
  tempColorOverlayEnabled?: boolean;
  tempOverlayType?: "solid" | "gradient";
  tempOverlayColor1?: string | null;
  tempOverlayColor2?: string | null;
  tempOverlayOpacity1?: number;
  tempOverlayOpacity2?: number;
  tempTextColor?: string | null;
  tempLogoTransparency?: number;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
  onSectionPanelOpen?: () => void;
  onSectionPanelClose?: () => void;
  onPrePrintPanelChange?: (open: boolean) => void;
  pendingEntourageChanges?: any;
  localVisibleSections?: Record<string, boolean>;
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onPendingChangesChange?: (changes: Partial<InvitationData>) => void;
  onHeroHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onHeroPendingChangesChange?: (changes: Partial<InvitationData>) => void;
}

export default function InvitationTemplate({
  invitation,
  previewMode = false,
  editMode = false,
  isDarkMode = false,
  accentColor = "#6998EE",
  onChange,
  printResizeScale = 100,
  prePrintActive = false,
  tempRemoveBackground = false,
  tempBackgroundImage = null,
  tempBackgroundYPosition = 0,
  tempBackgroundXPosition = 0,
  tempBackgroundZoom = 0,
  tempColorOverlayEnabled = false,
  tempOverlayType = "solid",
  tempOverlayColor1 = null,
  tempOverlayColor2 = null,
  tempOverlayOpacity1 = 0.7,
  tempOverlayOpacity2 = 0.7,
  tempTextColor = null,
  tempLogoTransparency = 100,
  desktopMode = false,
  panelPosition = "left",
  onSectionPanelOpen = () => {},
  onSectionPanelClose = () => {},
  onPrePrintPanelChange = () => {},
  pendingEntourageChanges,
  localVisibleSections,
  onHasUnsavedChangesChange,
  onPendingChangesChange,
  onHeroHasUnsavedChangesChange,
  onHeroPendingChangesChange,
}: InvitationTemplateProps) {
  const [opened, setOpened] = useState(previewMode);
  const [musicAutoPlay, setMusicAutoPlay] = useState(previewMode && !editMode);
  const normalizeData = (data: InvitationData | undefined | null): InvitationData => {
    if (!data || typeof data !== "object") return {} as InvitationData;
    const { sections, ...rest } = data;
    return { ...rest, sections: sections ?? {} };
  };

  const [localData, setLocalData] = useState(() => normalizeData(invitation.data));
  const { data } = invitation;

  // Use the merged data directly since it's already merged in LiveEditView
  const mergedData = localData;

  // Sync localData with invitation.data when it changes
  useEffect(() => {
    setLocalData(normalizeData(invitation.data));
  }, [invitation.data]);

  const handleOpen = useCallback(() => {
    setOpened(true);
    setMusicAutoPlay(true);
  }, []);

  // Lock scrolling while the welcome screen is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    if (!opened) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [opened]);

  // Ensure music auto-plays when opened and music is enabled
  useEffect(() => {
    if (opened && localData.musicEnabled && musicAutoPlay) {
      // MusicPlayer will handle auto-play when autoPlay prop is true
    }
  }, [opened, localData.musicEnabled, musicAutoPlay]);

  const handleUpdateHeroNameSize = useCallback((size: number) => {
    setLocalData(prev => ({ ...prev, heroNameSize: size }));
    onChange?.("heroNameSize", size);
  }, [onChange]);

  const handleUpdateHeroAmpersandSize = useCallback((size: number) => {
    setLocalData(prev => ({ ...prev, heroAmpersandSize: size }));
    onChange?.("heroAmpersandSize", size);
  }, [onChange]);

  const handleUpdateHeroAmpersandOpacity = useCallback((opacity: number) => {
    setLocalData(prev => ({ ...prev, heroAmpersandOpacity: opacity }));
    onChange?.("heroAmpersandOpacity", opacity);
  }, [onChange]);

  const handleUpdateHeroOthersColor = useCallback((color: string) => {
    setLocalData(prev => ({ ...prev, heroOthersColor: color }));
    onChange?.("heroOthersColor", color);
  }, [onChange]);

  const handleUpdateHeroOthersTextSize = useCallback((size: number) => {
    setLocalData(prev => ({ ...prev, heroOthersTextSize: size }));
    onChange?.("heroOthersTextSize", size);
  }, [onChange]);

  const handleUpdateHeroHostLineImageOpacity = useCallback((opacity: number) => {
    setLocalData(prev => ({ ...prev, heroHostLineImageOpacity: opacity }));
    onChange?.("heroHostLineImageOpacity", opacity);
  }, [onChange]);

  const handleUpdateHeroClosingSentimentImageOpacity = useCallback((opacity: number) => {
    setLocalData(prev => ({ ...prev, heroClosingSentimentImageOpacity: opacity }));
    onChange?.("heroClosingSentimentImageOpacity", opacity);
  }, [onChange]);

  const handleUpdateHeroIconName2First = useCallback((value: boolean) => {
    setLocalData(prev => ({ ...prev, heroIconName2First: value }));
    onChange?.("heroIconName2First", value);
  }, [onChange]);

  const handleUpdateHeroAmpersandPosition = useCallback((value: "default" | "first-line" | "middle-line" | "second-line") => {
    setLocalData(prev => ({ ...prev, heroAmpersandPosition: value }));
    onChange?.("heroAmpersandPosition", value);
  }, [onChange]);

  const handleUpdateHeroDisplayNameTypography = useCallback((value: string) => {
    setLocalData(prev => ({ ...prev, heroDisplayNameTypography: value }));
    onChange?.("heroDisplayNameTypography", value);
  }, [onChange]);

  const handleUpdateHeroAmpersandTypography = useCallback((value: string) => {
    setLocalData(prev => ({ ...prev, heroAmpersandTypography: value }));
    onChange?.("heroAmpersandTypography", value);
  }, [onChange]);

  const handleUpdateHeroIconTextColor = useCallback((value: string) => {
    setLocalData(prev => ({ ...prev, heroIconTextColor: value }));
    onChange?.("heroIconTextColor", value);
  }, [onChange]);

  const handleUpdateHeroTextShadowOpacity = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroTextShadowOpacity: value }));
    onChange?.("heroTextShadowOpacity", value);
  }, [onChange]);

  const handleUpdateHeroDateStructure = useCallback((value: "default" | "alternative" | "icon" | "elegant" | "modern" | "huge") => {
    setLocalData(prev => ({ ...prev, heroDateStructure: value }));
    onChange?.("heroDateStructure", value);
  }, [onChange]);

  const handleUpdateHeroDateStructureSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroDateStructureSize: value }));
    onChange?.("heroDateStructureSize", value);
  }, [onChange]);

  const handleUpdateHeroDateStructureSpacing = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroDateStructureSpacing: value }));
    onChange?.("heroDateStructureSpacing", value);
  }, [onChange]);

  const handleUpdateHeroVenueStructure = useCallback((value: "default" | "icon") => {
    setLocalData(prev => ({ ...prev, heroVenueStructure: value }));
    onChange?.("heroVenueStructure", value);
  }, [onChange]);

  const handleUpdateHeroVenueSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroVenueSize: value }));
    onChange?.("heroVenueSize", value);
  }, [onChange]);

  const handleUpdateHeroVenueSpacing = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroVenueSpacing: value }));
    onChange?.("heroVenueSpacing", value);
  }, [onChange]);

  const handleUpdateHeroHostLineImage = useCallback((value: "hostline-00" | "hostline-01" | "hostline-02" | "hostline-03" | "hostline-04" | "hostline-05" | "hostline-06" | "hostline-07" | "hostline-08" | "hostline-09") => {
    setLocalData(prev => ({ ...prev, heroHostLineImage: value }));
    onChange?.("heroHostLineImage", value);
  }, [onChange]);

  const handleUpdateHeroHostLineImageSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroHostLineImageSize: value }));
    onChange?.("heroHostLineImageSize", value);
  }, [onChange]);

  const handleUpdateHeroHostLineImageSpacing = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroHostLineImageSpacing: value }));
    onChange?.("heroHostLineImageSpacing", value);
  }, [onChange]);

  const handleUpdateHeroHostLineTextSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroHostLineTextSize: value }));
    onChange?.("heroHostLineTextSize", value);
  }, [onChange]);

  const handleUpdateHeroHostLineTextSpacing = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroHostLineTextSpacing: value }));
    onChange?.("heroHostLineTextSpacing", value);
  }, [onChange]);

  const handleUpdateHeroClosingSentimentImage = useCallback((value: "fsentiment-00" | "fsentiment-01" | "fsentiment-02" | "fsentiment-03" | "fsentiment-04" | "fsentiment-05" | "fsentiment-06" | "fsentiment-07") => {
    setLocalData(prev => ({ ...prev, heroClosingSentimentImage: value }));
    onChange?.("heroClosingSentimentImage", value);
  }, [onChange]);

  const handleUpdateHeroClosingSentimentImageSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroClosingSentimentImageSize: value }));
    onChange?.("heroClosingSentimentImageSize", value);
  }, [onChange]);

  const handleUpdateHeroClosingSentimentImageSpacing = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroClosingSentimentImageSpacing: value }));
    onChange?.("heroClosingSentimentImageSpacing", value);
  }, [onChange]);

  const handleUpdateHeroClosingSentimentTextSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroClosingSentimentTextSize: value }));
    onChange?.("heroClosingSentimentTextSize", value);
  }, [onChange]);

  const handleUpdateHeroClosingSentimentTextSpacing = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroClosingSentimentTextSpacing: value }));
    onChange?.("heroClosingSentimentTextSpacing", value);
  }, [onChange]);

  const handleUpdateHeroIconType = useCallback((value: "image" | "initial" | "none") => {
    setLocalData(prev => ({ ...prev, heroIconType: value }));
    onChange?.("heroIconType", value);
  }, [onChange]);

  const handleUpdateHeroIcon = useCallback((value: string) => {
    setLocalData(prev => ({ ...prev, heroIcon: value }));
    onChange?.("heroIcon", value);
  }, [onChange]);

  const handleUpdateHeroIconTypography = useCallback((value: string) => {
    setLocalData(prev => ({ ...prev, heroIconTypography: value }));
    onChange?.("heroIconTypography", value);
  }, [onChange]);

  const handleUpdateHeroIconAddAmpersand = useCallback((value: boolean) => {
    setLocalData(prev => ({ ...prev, heroIconAddAmpersand: value }));
    onChange?.("heroIconAddAmpersand", value);
  }, [onChange]);

  const handleUpdateHeroIconMarginAdjustment = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroIconMarginAdjustment: value }));
    onChange?.("heroIconMarginAdjustment", value);
  }, [onChange]);

  const handleUpdateHeroIconSize = useCallback((value: number) => {
    setLocalData(prev => ({ ...prev, heroIconSize: value }));
    onChange?.("heroIconSize", value);
  }, [onChange]);

  const defaultSectionOrder = ["hero", "event-details", "gallery", "map", "rsvp", "timeline", "countdown", "dresscode", "giftguide", "wedding-directory", "entourage"];
  const sectionOrder = Array.from(new Set([...(localData.sectionOrder || []), ...defaultSectionOrder, "footer"]));

  // Set CSS variable for scrollbar color using mainColor1
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', localData.mainColor1 || accentColor);
  }, [localData.mainColor1, accentColor]);

  return (
    <ThemeProvider isDarkMode={isDarkMode} accentColor={accentColor}>
      <MusicProvider>
      <div
        className="invitation-wrapper relative w-full"
        style={{
          backgroundColor: "#ffffff",
          fontSize: `${localData.baseFontSize || 16}px`,
        }}
      >
      {/* Custom font loader */}
      <CustomFontLoader 
        customHeadingFont={localData.customHeadingFont}
        customBodyFont={localData.customBodyFont}
      />

      {/* Welcome screen overlay */}
      {!opened && (
        <WelcomeScreenManager data={localData} onOpen={handleOpen} />
      )}

      {/* Main invitation content */}
      <div
        className={`transition-opacity duration-700 ${opened ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <HeroSection 
          data={localData} 
          editMode={editMode}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
          printResizeScale={printResizeScale}
          prePrintActive={prePrintActive}
          tempRemoveBackground={tempRemoveBackground}
          tempBackgroundImage={tempBackgroundImage}
          tempBackgroundYPosition={tempBackgroundYPosition}
          tempBackgroundXPosition={tempBackgroundXPosition}
          tempBackgroundZoom={tempBackgroundZoom}
          tempColorOverlayEnabled={tempColorOverlayEnabled}
          tempOverlayType={tempOverlayType}
          tempOverlayColor1={tempOverlayColor1}
          tempOverlayColor2={tempOverlayColor2}
          tempOverlayOpacity1={tempOverlayOpacity1}
          tempOverlayOpacity2={tempOverlayOpacity2}
          tempTextColor={tempTextColor}
          tempLogoTransparency={tempLogoTransparency}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          onUpdateHeroNameSize={handleUpdateHeroNameSize}
          onUpdateHeroAmpersandSize={handleUpdateHeroAmpersandSize}
          onUpdateHeroAmpersandOpacity={handleUpdateHeroAmpersandOpacity}
          onUpdateHeroIconName2First={handleUpdateHeroIconName2First}
          onUpdateHeroAmpersandPosition={handleUpdateHeroAmpersandPosition}
          onUpdateHeroDisplayNameTypography={handleUpdateHeroDisplayNameTypography}
          onUpdateHeroAmpersandTypography={handleUpdateHeroAmpersandTypography}
          onUpdateHeroIconTextColor={handleUpdateHeroIconTextColor}
          onUpdateHeroOthersColor={handleUpdateHeroOthersColor}
          onUpdateHeroOthersTextSize={handleUpdateHeroOthersTextSize}
          onUpdateHeroTextShadowOpacity={handleUpdateHeroTextShadowOpacity}
          onUpdateHeroDateStructure={handleUpdateHeroDateStructure}
          onUpdateHeroDateStructureSize={handleUpdateHeroDateStructureSize}
          onUpdateHeroDateStructureSpacing={handleUpdateHeroDateStructureSpacing}
          onUpdateHeroVenueStructure={handleUpdateHeroVenueStructure}
          onUpdateHeroVenueSize={handleUpdateHeroVenueSize}
          onUpdateHeroVenueSpacing={handleUpdateHeroVenueSpacing}
          onUpdateHeroHostLineImage={handleUpdateHeroHostLineImage}
          onUpdateHeroHostLineImageOpacity={handleUpdateHeroHostLineImageOpacity}
          onUpdateHeroHostLineImageSize={handleUpdateHeroHostLineImageSize}
          onUpdateHeroHostLineImageSpacing={handleUpdateHeroHostLineImageSpacing}
          onUpdateHeroHostLineTextSize={handleUpdateHeroHostLineTextSize}
          onUpdateHeroHostLineTextSpacing={handleUpdateHeroHostLineTextSpacing}
          onUpdateHeroClosingSentimentImage={handleUpdateHeroClosingSentimentImage}
          onUpdateHeroClosingSentimentImageOpacity={handleUpdateHeroClosingSentimentImageOpacity}
          onUpdateHeroClosingSentimentImageSize={handleUpdateHeroClosingSentimentImageSize}
          onUpdateHeroClosingSentimentImageSpacing={handleUpdateHeroClosingSentimentImageSpacing}
          onUpdateHeroClosingSentimentTextSize={handleUpdateHeroClosingSentimentTextSize}
          onUpdateHeroClosingSentimentTextSpacing={handleUpdateHeroClosingSentimentTextSpacing}
          onChange={onChange}
          onHasUnsavedChangesChange={onHeroHasUnsavedChangesChange}
          onPendingChangesChange={onHeroPendingChangesChange}
        />

        <div className="w-full">
          {/* Render sections in custom order */}
          {sectionOrder.map((sectionId) => {
            if (sectionId === "event-details" && localData.sections.eventdetails) {
              return <DetailsSection key="event-details" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} />;
            }
            if (sectionId === "gallery" && localData.sections.gallery) {
              return <GallerySection key="gallery" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} />;
            }
            if (sectionId === "map" && localData.sections.map) {
              return <MapSection key="map" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} />;
            }
            if (sectionId === "rsvp" && localData.sections.rsvp) {
              return <RSVPSection key="rsvp" data={localData} invitationId={invitation.id} editMode={editMode} onChange={onChange} desktopMode={desktopMode} panelPosition={panelPosition} onPanelOpen={onSectionPanelOpen} onPanelClose={onSectionPanelClose} onPrePrintPanelChange={onPrePrintPanelChange} />;
            }
            if (sectionId === "timeline" && localData.sections.timeline) {
              return <TimelineSection key="timeline" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} />;
            }
            if (sectionId === "countdown" && localData.sections.countdown) {
              return <CountdownSection key="countdown" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} onHasUnsavedChangesChange={onHasUnsavedChangesChange} onPendingChangesChange={onPendingChangesChange} />;
            }
            if (sectionId === "dresscode" && localData.sections.dresscode) {
              return <DressCodeSection key="dresscode" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} />;
            }
            if (sectionId === "giftguide" && localData.sections.giftguide) {
              return <GiftGuideSection key="giftguide" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} />;
            }
            if (sectionId === "wedding-directory" && (localData.sections.weddingdirectory ?? false)) {
              return <WeddingDirectorySection key="wedding-directory" data={localData} desktopMode={desktopMode} panelPosition={panelPosition} onChange={onChange} editMode={editMode} />;
            }
            if (sectionId === "entourage" && (localData.sections.entourage ?? true)) {
              return <EntourageSection key="entourage" data={mergedData} editMode={editMode} onChange={onChange} desktopMode={desktopMode} panelPosition={panelPosition} onPanelOpen={onSectionPanelOpen} onPanelClose={onSectionPanelClose} onPrePrintPanelChange={onPrePrintPanelChange} localVisibleSections={localVisibleSections} />;
            }
            if (sectionId === "footer" && (localData.sections.footer ?? true)) {
              return <FooterSection key="footer" data={localData} editMode={editMode} onChange={onChange} desktopMode={desktopMode} panelPosition={panelPosition} />;
            }
            return null;
          })}

          {/* Credit line always rendered at the end */}
          <div
            className="px-8 py-0.5 text-center no-print flex items-center justify-center"
            style={{ backgroundColor: localData.mainColor1 + "F2", position: "relative", zIndex: 11, minHeight: "24px" }}
          >
            <p
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ color: "rgba(255, 255, 255, 0.85)", fontFamily: `${localData.bodyFont}, serif` }}
            >
              <a href={typeof window !== "undefined" ? (() => {
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const port = window.location.port ? `:${window.location.port}` : "";
                const parts = hostname.split(".");
                const apex = parts.length > 2 ? parts.slice(1).join(".") : hostname;
                return `${protocol}//${apex}${port}`;
              })() : "/"} className="underline">INSTAVOW.COM</a>
            </p>
          </div>
        </div>
      </div>

      {/* Background music */}
      <div className="no-print">
        <MusicPlayer data={localData} autoPlay={musicAutoPlay} />
      </div>

      {/* Floating Wedding Directory bubble - hidden in mobile edit mode */}
      {opened && sectionOrder.includes("wedding-directory") && localData.sections.weddingdirectory && !(editMode && !desktopMode) && (
        <button
          type="button"
          onClick={() => {
            const element = document.getElementById('wedding-directory-cssid');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
          className="no-print fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg flex items-center justify-center p-3 transition-transform hover:scale-110 focus:outline-none"
          aria-label="Go to Wedding Directory"
          style={{ backgroundColor: localData.mainColor1 || accentColor }}
        >
          <img src="/assets/ico-dir.png" alt="Directory" className="w-7 h-7 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      )}
    </div>
    </MusicProvider>
    </ThemeProvider>
  );
}
