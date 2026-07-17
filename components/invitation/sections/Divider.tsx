import { useRef } from "react";
import type { DividerType, DividerStyle } from "@/lib/types/invitation";

interface DividerProps {
  type: DividerType;
  color?: string;
  className?: string;
  id?: string;
  offset?: number;
  onClick?: (newType: DividerType) => void;
  onLongPress?: () => void;
  tintColor?: string;
  tintOpacity?: number;
  dividerStyle?: DividerStyle;
  flip?: boolean;
  spacing?: number;
  pullDown?: number;
  verticalFlip?: boolean;
  imageSize?: number;
  baseHeight?: number;
  horizontalMargin?: number;
  customImageUrl1?: string;
  customImageUrl2?: string;
  customImageUrl3?: string;
  colorBlend?: boolean;
}

const DIVIDER_TYPES: DividerType[] = ["divider-1", "divider-2", "divider-3", "divider-4"];

// Migration: convert old divider values to new ones
const normalizeDividerType = (dividerType: DividerType): DividerType => {
  const migrationMap: Record<string, DividerType> = {
    "floral-1": "divider-1",
    "floral-2": "divider-2",
    "floral-3": "divider-3",
    "floral-4": "divider-4",
  };
  return migrationMap[dividerType] || dividerType;
};

const getNextDividerType = (currentType: DividerType): DividerType => {
  if (currentType === "none") return "divider-1";
  const currentIndex = DIVIDER_TYPES.indexOf(currentType);
  if (currentIndex === -1) return "divider-1";
  const nextIndex = (currentIndex + 1) % DIVIDER_TYPES.length;
  return DIVIDER_TYPES[nextIndex];
};

const LONG_PRESS_DURATION = 500;

const IMAGE_DIVIDER_ASSETS: Partial<Record<DividerType, string>> = {
  "divider-1": "/assets/divdr-1.png",
  "divider-2": "/assets/divdr-2.png",
};

export default function Divider({
  type,
  color = "#b88a78",
  className = "",
  id,
  offset = 0,
  onClick,
  onLongPress,
  tintColor,
  tintOpacity = 100,
  dividerStyle = "centered-single",
  flip = false,
  spacing = -80,
  pullDown = 0,
  verticalFlip = false,
  imageSize = 100,
  baseHeight = 200,
  horizontalMargin = 20,
  customImageUrl1,
  customImageUrl2,
  customImageUrl3,
  colorBlend = false,
}: DividerProps) {
  const marginTop = offset;
  const marginTopClass = `mt-[${marginTop}px]`;
  const normalizedType = normalizeDividerType(type);
  
  // Force divider-1 to always use centered-single style
  // Force divider-2 to always use split-horizontal style
  // Force divider-3 to always use mirrored-corners style
  const effectiveDividerStyle = normalizedType === "divider-1" ? "centered-single" : 
                                  normalizedType === "divider-2" ? "split-horizontal" : 
                                  normalizedType === "divider-3" ? "mirrored-corners" : dividerStyle;

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const startPress = () => {
    longPressTriggered.current = false;
    if (onClick) {
      pressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        const newType = getNextDividerType(normalizedType);
        onClick(newType);
      }, LONG_PRESS_DURATION);
    }
  };

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (onLongPress) {
      onLongPress();
    }
  };

  if (normalizedType === "none") {
    return <div id={id} className={`h-[120px] -mb-[50px] ${marginTopClass} ${className}`} style={{ marginTop: `${marginTop}px` }} />;
  }

  const effectiveTintColor = tintColor || color;
  const effectiveTintOpacity = tintOpacity ?? 100;

  // Use customImageUrl1 for divider-1 (Centered Single), customImageUrl2 for divider-2 (Floral Corner), and customImageUrl3 for divider-3 (Custom Divider), otherwise use imageAsset
  const imageAsset = normalizedType === "divider-1" && customImageUrl1 
    ? customImageUrl1 
    : normalizedType === "divider-2" && customImageUrl2 
    ? customImageUrl2 
    : normalizedType === "divider-3" && customImageUrl3 
    ? customImageUrl3 
    : IMAGE_DIVIDER_ASSETS[normalizedType];

  // Renders a single instance of an image-based divider, optionally mirrored
  const renderImageDividerUnit = (imagePath: string, mirrorH: boolean, mirrorV: boolean, key?: string, imageSize?: number) => {
    const transformParts: string[] = [];
    if (flip) transformParts.push("scaleX(-1)");
    if (mirrorH) transformParts.push("scaleX(-1)");
    if (mirrorV) transformParts.push("scaleY(-1)");
    const scale = imageSize ? imageSize / 100 : 1;
    transformParts.push(`scale(${scale})`);
    const transform = transformParts.join(" ");
    return (
      <div key={key} style={{ position: "relative", height: `${baseHeight}px`, display: "inline-block", ...(transform ? { transform } : {}) }}>
        <img
          src={imagePath}
          alt="Divider"
          className="w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
          style={{ height: `${baseHeight}px`, userSelect: "none", display: "block" }}
          draggable={false}
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={clearPress}
          onMouseLeave={clearPress}
          onTouchStart={startPress}
          onTouchEnd={clearPress}
        />
        {effectiveTintColor && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: effectiveTintColor,
              opacity: effectiveTintOpacity / 100,
              mixBlendMode: colorBlend ? "color" : "normal",
              WebkitMaskImage: `url(${imagePath})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: `url(${imagePath})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            } as React.CSSProperties}
          />
        )}
      </div>
    );
  };

  if (imageAsset) {
    const marginBottom = baseHeight * 0.8; // 80% of baseHeight for negative margin

    if (effectiveDividerStyle === "split-horizontal") {
      return (
        <div
          id={id}
          className={`flex items-center justify-between ${className}`}
          style={{ height: `${baseHeight}px`, marginTop: `${marginTop}px`, marginLeft: `-${horizontalMargin}px`, marginRight: `-${horizontalMargin}px`, marginBottom: `0px`, transform: `translateY(-50%) translateY(${pullDown}%) scaleY(${verticalFlip ? -1 : 1})` }}
        >
          {renderImageDividerUnit(imageAsset, false, false, "left", imageSize)}
          {renderImageDividerUnit(imageAsset, true, false, "right", imageSize)}
        </div>
      );
    }

    if (effectiveDividerStyle === "mirrored-corners") {
      return (
        <div
          id={id}
          className={`flex flex-col items-center justify-center gap-0 ${className}`}
          style={{ height: `${baseHeight}px`, marginTop: `${marginTop}px`, marginBottom: `0px`, marginLeft: '-32px', marginRight: '-32px', transform: 'translateY(-50%)' }}
        >
          <div className="flex items-center justify-between w-full">
            {renderImageDividerUnit(imageAsset, false, false, "tl", imageSize)}
            {renderImageDividerUnit(imageAsset, true, false, "tr", imageSize)}
          </div>
          <div className="flex items-center justify-between w-full" style={{ marginTop: `${spacing}%` }}>
            {renderImageDividerUnit(imageAsset, false, true, "bl", imageSize)}
            {renderImageDividerUnit(imageAsset, true, true, "br", imageSize)}
          </div>
        </div>
      );
    }

    // centered-single (default)
    return (
      <div
        id={id}
        className={`flex items-center justify-center py-4 ${className}`}
        style={{ height: `${baseHeight}px`, marginTop: `${marginTop}px`, marginBottom: `0px`, transform: 'translateY(-50%)' }}
      >
        {renderImageDividerUnit(imageAsset, false, false, undefined, imageSize)}
      </div>
    );
  }

  const dividers: Record<DividerType, JSX.Element> = {
    "none": <></>,
    "divider-1": <></>,
    "divider-2": <></>,
    "divider-3": (
      <div
        id={id}
        className={`h-[120px] flex items-center justify-center gap-3 py-4 ${marginTopClass} ${className}`}
        style={{ transform: 'translateY(-50%)', marginTop: `${marginTop}px`, marginBottom: '-50px', zIndex: 50 }}
      >
        <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
        <svg
          width="70"
          height="22"
          viewBox="0 0 70 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={clearPress}
          onMouseLeave={clearPress}
          onTouchStart={startPress}
          onTouchEnd={clearPress}
        >
          <path d="M35 11 C30 7 22 5 18 9 C14 13 18 19 22 17 C26 15 30 11 35 11" fill={color} opacity="0.55" />
          <path d="M35 11 C40 7 48 5 52 9 C56 13 52 19 48 17 C44 15 40 11 35 11" fill={color} opacity="0.55" />
          <circle cx="35" cy="11" r="2.8" fill={color} opacity="0.75" />
          <circle cx="35" cy="11" r="1.4" fill={color} />
          <circle cx="18" cy="9" r="1.8" fill={color} opacity="0.45" />
          <circle cx="52" cy="9" r="1.8" fill={color} opacity="0.45" />
          <circle cx="26" cy="13" r="1.2" fill={color} opacity="0.35" />
          <circle cx="44" cy="13" r="1.2" fill={color} opacity="0.35" />
        </svg>
        <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
      </div>
    ),
    "divider-4": (
      <div
        id={id}
        className={`h-[120px] flex items-center justify-center gap-3 py-4 -mb-[50px] ${marginTopClass} ${className}`}
        style={{ transform: 'translateY(-50%)', marginTop: `${marginTop}px`, zIndex: 50 }}
      >
        <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
        <svg
          width="90"
          height="26"
          viewBox="0 0 90 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={clearPress}
          onMouseLeave={clearPress}
          onTouchStart={startPress}
          onTouchEnd={clearPress}
        >
          <path d="M45 13 C38 9 28 7 22 11 C16 15 22 22 28 20 C34 18 40 13 45 13" fill={color} opacity="0.45" />
          <path d="M45 13 C52 9 62 7 68 11 C74 15 68 22 62 20 C56 18 50 13 45 13" fill={color} opacity="0.45" />
          <circle cx="45" cy="13" r="3.2" fill={color} opacity="0.65" />
          <circle cx="45" cy="13" r="1.6" fill={color} />
          <circle cx="22" cy="11" r="2.2" fill={color} opacity="0.35" />
          <circle cx="68" cy="11" r="2.2" fill={color} opacity="0.35" />
          <circle cx="33" cy="15" r="1.4" fill={color} opacity="0.25" />
          <circle cx="57" cy="15" r="1.4" fill={color} opacity="0.25" />
          <circle cx="39" cy="17" r="0.8" fill={color} opacity="0.2" />
          <circle cx="51" cy="17" r="0.8" fill={color} opacity="0.2" />
        </svg>
        <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
      </div>
    ),
  };

  return dividers[normalizedType];
}
