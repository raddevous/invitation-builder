import { useState } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface FooterSectionProps {
  data: InvitationData;
  editMode?: boolean;
  onChange?: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
}

export default function FooterSection({ data, editMode = false, onChange, desktopMode = false, panelPosition = "right" }: FooterSectionProps) {
  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);
  const { isDarkMode, accentColor } = useTheme();
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedDividerImagesCentered } = usePredefinedOptions('dividers_centeredsingle');
  const { options: predefinedDividerImagesSplit } = usePredefinedOptions('dividers_splithorizontal');
  const { options: predefinedDividerImagesMirrored } = usePredefinedOptions('dividers_mirroredcorners');

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  if (!data.sections.footer) return null;

  const getOrdinalSuffix = (day: string): string => {
    const num = parseInt(day, 10);
    if (isNaN(num)) return "";
    const lastTwo = num % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return "th";
    const lastOne = num % 10;
    if (lastOne === 1) return "st";
    if (lastOne === 2) return "nd";
    if (lastOne === 3) return "rd";
    return "th";
  };

  const parseDateComponents = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return {
        month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        monthFull: date.toLocaleString('en-US', { month: 'long' }),
        day: date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
        dayFull: date.toLocaleString('en-US', { weekday: 'long' }),
        date: date.getDate(),
        year: date.getFullYear()
      };
    } catch {
      return null;
    }
  };

  const dateComponents = parseDateComponents(data.date);
  const footerDateColor = data.mainColor2;
  const footerDateFont = getFontFamily(data.heroOthersTypography || data.bodyFont, "body");

  const displayNameHtml = data.nameType === "couple"
    ? (() => {
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
      })()
    : data.coupleName;

  const useDefaultDivider = data.footerDividerUseDefault ?? true;
  const effectiveDividerType = useDefaultDivider ? (data.universalDivider || "none") : (data.footerDivider || "none");
  const effectiveOffset = useDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.footerDividerOffset ?? 0);
  const effectiveTintColor = useDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.footerDividerTintColor || data.mainColor2);
  const effectiveTintOpacity = useDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.footerDividerTintOpacity ?? 100);
  const effectiveDividerStyle = useDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.footerDividerStyle || "centered-single");
  const effectiveFlip = useDefaultDivider ? (data.universalDividerFlip ?? false) : (data.footerDividerFlip ?? false);
  const effectiveSpacing = useDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.footerDividerSpacing ?? 0);
  const effectivePullDown = useDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.footerDividerPullDown ?? 0);
  const effectiveVerticalFlip = useDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.footerDividerVerticalFlip ?? false);
  const effectiveImageSize = useDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.footerDividerImageSize ?? 100);

  return (
    <footer
      className="px-8 pt-0 pb-8 text-center"
      style={{ backgroundColor: data.mainColor1, position: 'relative', zIndex: 10 }}
    >
      <Divider
        type={effectiveDividerType}
        color={data.mainColor2}
        id="footer-cssid"
        offset={effectiveOffset}
        tintColor={effectiveTintColor}
        tintOpacity={effectiveTintOpacity}
        dividerStyle={effectiveDividerStyle}
        flip={effectiveFlip}
        spacing={effectiveSpacing}
        pullDown={effectivePullDown}
        verticalFlip={effectiveVerticalFlip}
        imageSize={effectiveImageSize}
        baseHeight={desktopMode ? 150 : 100}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={useDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.footerDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={useDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.footerDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={useDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.footerDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={useDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.footerDividerColorBlend ?? false)}
        predefinedImages={(useDefaultDivider ? data.universalDivider : data.footerDivider) === "divider-1" ? predefinedDividerImagesCentered : (useDefaultDivider ? data.universalDivider : data.footerDivider) === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
        onImageCycle={editMode ? (newImageUrl: string) => {
          const currentType = useDefaultDivider ? (data.universalDivider || "divider-1") : (data.footerDivider || "divider-1");
          if (useDefaultDivider) {
            onChange?.("footerDividerUseDefault", false);
            onChange?.("footerDivider", currentType);
          }
          if (currentType === "divider-1") {
            onChange?.("footerDividerCustomImageUrl1", newImageUrl);
          } else if (currentType === "divider-2") {
            onChange?.("footerDividerCustomImageUrl2", newImageUrl);
          } else {
            onChange?.("footerDividerCustomImageUrl3", newImageUrl);
          }
        } : undefined}
        onLongPress={editMode ? () => {
          setShowDividerSettingsPanel(true);
          const element = document.getElementById('footer-cssid');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      />
      {showDividerSettingsPanel && (
        <DividerSettingsPanel
          title="Footer Divider Settings"
          isClosing={isDividerSettingsClosing}
          onClose={handleCloseDividerSettingsPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={data.footerDivider && data.footerDivider !== "none" ? data.footerDivider : "divider-1"}
          onDividerTypeChange={(value) => onChange?.("footerDivider", value)}
          tintColor={data.footerDividerTintColor || data.mainColor2}
          onTintColorChange={(value) => onChange?.("footerDividerTintColor", value)}
          tintOpacity={data.footerDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => onChange?.("footerDividerTintOpacity", value)}
          dividerStyle={data.footerDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => onChange?.("footerDividerStyle", value)}
          flip={data.footerDividerFlip ?? false}
          onFlipChange={(value) => onChange?.("footerDividerFlip", value)}
          spacing={data.footerDividerSpacing ?? -80}
          onSpacingChange={(value) => onChange?.("footerDividerSpacing", value)}
          pullDown={data.footerDividerPullDown ?? 0}
          onPullDownChange={(value) => onChange?.("footerDividerPullDown", value)}
          verticalFlip={data.footerDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => onChange?.("footerDividerVerticalFlip", value)}
          imageSize={data.footerDividerImageSize ?? 100}
          onImageSizeChange={(value) => onChange?.("footerDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          customImageUrl1={data.footerDividerCustomImageUrl1 || "/assets/divdr-1.png"}
          onCustomImageUrl1Change={(value) => onChange?.("footerDividerCustomImageUrl1", value)}
          customImageUrl2={data.footerDividerCustomImageUrl2 || "/assets/divdr-2.png"}
          onCustomImageUrl2Change={(value) => onChange?.("footerDividerCustomImageUrl2", value)}
          customImageUrl3={data.footerDividerCustomImageUrl3 || "/assets/divdr-3.png"}
          onCustomImageUrl3Change={(value) => onChange?.("footerDividerCustomImageUrl3", value)}
          predefinedDividerImages={data.footerDivider === "divider-1" ? predefinedDividerImagesCentered : data.footerDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
          useDefault={useDefaultDivider}
          onUseDefaultChange={(value) => onChange?.("footerDividerUseDefault", value)}
          colorBlend={data.footerDividerColorBlend ?? false}
          onColorBlendChange={(value) => onChange?.("footerDividerColorBlend", value)}
        />
      )}
      <div className="mt-8 md:mt-12">
        <h2
          className="text-3xl mb-1"
          style={{ color: data.mainColor2, fontFamily: getFontFamily(data.headingFont, "heading"), whiteSpace: data.heroAmpersandPosition === "default" ? "nowrap" : "pre-line" }}
          dangerouslySetInnerHTML={{ __html: displayNameHtml }}
        >
        </h2>
        {/* Date - Box Layout (Default Structure) */}
        {dateComponents && data.heroDateStructure !== "alternative" && data.heroDateStructure !== "icon" && data.heroDateStructure !== "elegant" && data.heroDateStructure !== "modern" && data.heroDateStructure !== "huge" && (
          <div
            className="flex flex-col items-center gap-1 font-sans mb-2"
            style={{ color: footerDateColor, transform: 'scale(0.5)', transformOrigin: 'center' }}
          >
            <div
              className="text-[clamp(0.625rem,2.5vw,0.75rem)] md:text-sm tracking-[0.2em] uppercase font-bold text-center"
              style={{ fontFamily: footerDateFont }}
            >
              {dateComponents.month}
            </div>
            <div className="flex items-center gap-0 w-full max-w-sm">
              <div className="flex items-center justify-end shrink-0 w-[clamp(80px,25vw,128px)] md:w-32">
                <div className="flex-1 min-w-0 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" />
                <div
                  className="text-[clamp(0.5rem,2.5vw,0.75rem)] md:text-xs whitespace-nowrap shrink-0 tracking-[0.2em] uppercase text-right"
                  style={{ fontFamily: footerDateFont }}
                >
                  {dateComponents.day}
                </div>
              </div>
              <div className="flex justify-center shrink-0">
                <div className="w-[clamp(8px,2.5vw,16px)] md:w-4 h-[1px] bg-current opacity-50" />
              </div>
              <div className="flex-1 flex items-center justify-center text-[clamp(1rem,5vw,1.5rem)] md:text-4xl font-bold tracking-[0.1em]">
                {dateComponents.date}
              </div>
              <div className="flex justify-center shrink-0">
                <div className="w-[clamp(8px,2.5vw,16px)] md:w-4 h-[1px] bg-current opacity-50" />
              </div>
              <div className="flex items-center justify-start shrink-0 w-[clamp(80px,25vw,128px)] md:w-32">
                <div
                  className="text-[clamp(0.5rem,2.5vw,0.75rem)] md:text-xs whitespace-nowrap shrink-0 tracking-[0.2em] uppercase text-left"
                  style={{ fontFamily: footerDateFont }}
                >
                  {data.time || "4:00 PM"}
                </div>
                <div className="flex-1 min-w-0 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" />
              </div>
            </div>
            <div
              className="text-[clamp(0.625rem,2.5vw,0.75rem)] md:text-sm tracking-[0.2em] uppercase font-bold text-center"
              style={{ fontFamily: footerDateFont }}
            >
              {dateComponents.year}
            </div>
          </div>
        )}

        {/* Date - Alternative Structure */}
        {dateComponents && data.heroDateStructure === "alternative" && (
          <div
            className="flex flex-col items-center gap-1 font-sans text-center mb-2"
            style={{ color: footerDateColor, transform: 'scale(0.5)', transformOrigin: 'center' }}
          >
            <div
              className="text-sm tracking-[0.1em]"
              style={{ fontFamily: footerDateFont }}
            >
              On the {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
            </div>
            <div
              className="text-xs tracking-[0.1em]"
              style={{ fontFamily: footerDateFont }}
            >
              {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
            </div>
          </div>
        )}

        {/* Date - Icon Structure */}
        {dateComponents && data.heroDateStructure === "icon" && (
          <div
            className="flex flex-col items-center gap-1 font-sans text-center mb-2"
            style={{ color: footerDateColor, transform: 'scale(0.5)', transformOrigin: 'center' }}
          >
            <div
              className="w-6 h-6"
              style={{
                backgroundColor: footerDateColor,
                WebkitMaskImage: "url(/assets/date.svg)",
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: "url(/assets/date.svg)",
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat"
              }}
            />
            <div
              className="text-sm tracking-[0.1em]"
              style={{ fontFamily: footerDateFont }}
            >
              The {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
            </div>
            <div
              className="text-xs tracking-[0.1em]"
              style={{ fontFamily: footerDateFont }}
            >
              {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
            </div>
          </div>
        )}

        {/* Date - Elegant Structure */}
        {dateComponents && data.heroDateStructure === "elegant" && (
          <div
            className="flex items-center gap-0 font-sans text-center mb-2"
            style={{ color: footerDateColor, transform: 'scale(0.5)', transformOrigin: 'center' }}
          >
            <div
              className="flex-1 text-right pr-2 text-sm tracking-[0.2em] uppercase font-light"
              style={{ fontFamily: footerDateFont }}
            >
              {dateComponents.month}
            </div>
            <div className="text-xs font-light">|</div>
            <div className="flex-1 text-center px-2 text-3xl font-light tracking-[0.1em]">
              {String(dateComponents.date).padStart(2, '0')}
            </div>
            <div className="text-xs font-light">|</div>
            <div
              className="flex-1 text-left pl-2 text-sm tracking-[0.2em] uppercase font-light"
              style={{ fontFamily: footerDateFont }}
            >
              {dateComponents.year}
            </div>
          </div>
        )}

        {/* Date - Modern Structure */}
        {dateComponents && data.heroDateStructure === "modern" && (
          <div
            className="flex items-center justify-center gap-0 font-sans text-center mb-2 w-auto"
            style={{ color: footerDateColor, transform: 'scale(0.5)', transformOrigin: 'center' }}
          >
            <div className="text-right pr-2 flex flex-col items-end gap-0 shrink-0">
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{ fontFamily: footerDateFont }}
              >
                {dateComponents.dayFull || dateComponents.day}
              </div>
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{ fontFamily: footerDateFont }}
              >
                {data.time ? data.time.split(' ')[0] : "2:00"}
              </div>
            </div>
            <div className="text-lg font-light opacity-50 shrink-0">|</div>
            <div className="text-center px-2 text-3xl font-bold tracking-[0.1em] shrink-0">
              {dateComponents.date}
            </div>
            <div className="text-lg font-light opacity-50 shrink-0">|</div>
            <div className="text-left pl-2 flex flex-col items-start gap-0 shrink-0">
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{ fontFamily: footerDateFont }}
              >
                {dateComponents.monthFull || dateComponents.month}
              </div>
              <div
                className="text-xs tracking-[0.2em] uppercase font-light"
                style={{ fontFamily: footerDateFont }}
              >
                {dateComponents.year}
              </div>
            </div>
          </div>
        )}

        {/* Date - Huge Structure */}
        {dateComponents && data.heroDateStructure === "huge" && (
          <div
            className="flex flex-col items-center gap-3 font-sans mb-2"
            style={{ color: footerDateColor, transform: 'scale(0.5)', transformOrigin: 'center' }}
          >
            <div className="flex items-center gap-0 w-auto">
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              <div
                className="flex-1 text-center tracking-[0.2em] uppercase font-bold"
                style={{ fontFamily: footerDateFont, fontSize: '0.875em' }}
              >
                {dateComponents.month}
              </div>
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
            </div>
            <div className="flex items-center gap-0 w-auto">
              <div className="flex items-center justify-end shrink-0 w-20 md:w-32 lg:w-40">
                <div className="w-16 md:w-24 lg:w-32 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" />
                <div
                  className="text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase text-right"
                  style={{ fontFamily: footerDateFont }}
                >
                  {dateComponents.day}
                </div>
              </div>
              <div className="flex justify-center shrink-0">
                <div className="w-4 md:w-6 h-[1px] bg-current opacity-50" />
              </div>
              <div
                className="flex-1 flex items-center justify-center text-4xl md:text-6xl lg:text-8xl xl:text-9xl tracking-[0.1em]"
                style={{ fontFamily: '"Yeseva One", "Croissant One", serif', fontWeight: 400 }}
              >
                {dateComponents.date}
              </div>
              <div className="flex justify-center shrink-0">
                <div className="w-4 md:w-6 h-[1px] bg-current opacity-50" />
              </div>
              <div className="flex items-center justify-start shrink-0 w-20 md:w-32 lg:w-40">
                <div
                  className="text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase text-left whitespace-nowrap"
                  style={{ fontFamily: footerDateFont }}
                >
                  {data.time || "4:00 PM"}
                </div>
                <div className="w-16 md:w-24 lg:w-32 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" />
              </div>
            </div>
            <div className="flex items-center gap-0 w-auto">
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              <div
                className="flex-1 text-center tracking-[0.2em] uppercase font-bold"
                style={{ fontFamily: footerDateFont, fontSize: '0.875em' }}
              >
                {dateComponents.year}
              </div>
              <div className="shrink-0 w-4 md:w-6 lg:w-8" />
              <div className="shrink-0 w-20 md:w-32 lg:w-40" />
            </div>
          </div>
        )}

        {/* Fallback if date can't be parsed */}
        {!dateComponents && (
          <p
            className="text-sm italic mb-2"
            style={{ color: data.neutralColor1, opacity: 0.6, fontFamily: getFontFamily(data.bodyFont, "body") }}
          >
            {data.date} &bull; {data.time}
          </p>
        )}
        <p
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: data.neutralColor2, opacity: 0.5, fontFamily: getFontFamily(data.bodyFont, "body") }}
        >
          {data.venueName}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: data.neutralColor2, opacity: 0.4, fontFamily: getFontFamily(data.bodyFont, "body") }}
        >
          {data.venueAddress}
        </p>
      </div>
    </footer>
  );
}
