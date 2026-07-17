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

  const displayName = data.nameType === "couple"
    ? `${data.hisName || ""} ${data.andText || "&"} ${data.herName || ""}`.trim()
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
        baseHeight={desktopMode ? 200 : 120}
        horizontalMargin={desktopMode ? 80 : 48}
        customImageUrl1={useDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.footerDividerCustomImageUrl1 || "/assets/divdr-1.png")}
        customImageUrl2={useDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.footerDividerCustomImageUrl2 || "/assets/divdr-2.png")}
        customImageUrl3={useDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.footerDividerCustomImageUrl3 || "/assets/divdr-3.png")}
        colorBlend={useDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.footerDividerColorBlend ?? false)}
        onClick={editMode ? (newType) => {
          if (useDefaultDivider) {
            onChange?.("footerDividerUseDefault", false);
          }
          onChange?.("footerDivider", newType);
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
      <div className="my-8">
        <h2
          className="text-3xl mb-3"
          style={{ color: data.mainColor2, fontFamily: getFontFamily(data.headingFont, "heading") }}
        >
          {displayName}
        </h2>
        <p
          className="text-sm italic mb-6"
          style={{ color: data.neutralColor1, opacity: 0.6, fontFamily: getFontFamily(data.bodyFont, "body") }}
        >
          {data.date} &bull; {data.time}
        </p>
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
