"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { InvitationData, WelcomeScreenType } from "@/lib/types/invitation";
import { demoInvitationData } from "@/lib/demo/demo-data";
import WelcomeScreenManager from "@/components/invitation/welcome-screens/WelcomeScreenManager";
import HomeEnvelopeCard from "./HomeEnvelopeCard";
import HomeDraftDesign from "./HomeDraftDesign";
import FeatureText from "./FeatureText";
import { useSystemTheme, getThemeColors, type ThemeMode } from "@/lib/hooks/useSystemTheme";

interface HomePreviewStageProps {
  externalMode?: ThemeMode;
  externalToggle?: () => void;
}

const WELCOME_SCREENS: WelcomeScreenType[] = ["classic-envelope", "full-envelope", "curtain"];
const TOP_MESSAGES = [
  "You are cordially invited",
  "Together with our families",
  "We invite you to celebrate",
  "Join us for our wedding",
  "Please join us",
  "Celebrate with us",
  "We are getting married",
  "You are invited",
  "With love, we invite you",
];
const HEADING_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Lora",
  "Merriweather",
  "Libre Baskerville",
  "Cinzel",
  "Bodoni Moda",
  "Italiana",
  "Style Script",
  "Miss Fajardose",
  "Rouge Script",
  "Engagement",
  "Gwendolyn",
  "Ole Script Swash Caps",
  "Lily Script One",
  "Praise",
];

const DRAFT_DESIGNS = [
  "envelope",
  "dress-code-card",
  "photo-papers",
  "invitation",
  "rsvp",
  "gift-guide-card",
  "now-playing",
  "countdown-card",
  "event-details-card",
  "date-time-card",
  "story-card",
];

const COLOR_CYCLE = [
  "#4079ba",
  "#B76E79",
  "#9CAF88",
  "#1B3B5F",
  "#722F37",
  "#F7E7CE",
  "#DE5D83",
  "#8BA3B8",
];

const ENVELOPE_SKINS = ["envA", "envB", "envC"];
const ENVELOPE_TAPS = ENVELOPE_SKINS.length;

const DESIGN_FEATURES: Record<string, string[]> = {
  envelope: [
    "Change design, color, and style in just a tap",
    "Start from a library of elegant templates",
    "Make it uniquely yours in seconds",
    "Every detail, perfectly in your control",
    "Design that speaks your love story",
  ],
  "now-playing": [
    "Curate your wedding playlist",
    "Tap the disc to pause background music",
    "A spinning disc of your favorite songs",
    "Let guests enjoy background music",
  ],
  "photo-papers": [
    "Showcase up to 25+ cherished photos",
    "A gallery of your most precious moments",
    "Relive your journey in beautiful layouts",
  ],
  rsvp: [
    "RSVP with real-time notifications",
    "Effortless RSVP for your guests",
    "Track attendance with grace",
    "Gather responses in one place",
  ],
  "event-details-card": [
    "Share every detail of your celebration",
    "Guide your guests with essential information",
    "From venue to dress code, all in view",
  ],
  "dress-code-card": [
    "Choose from a variety of elegant attire sets",
    "Customize colors individually for each outfit",
    "Guide your guests on what to wear with ease",
    "Visual illustrations for every dress code",
    "From traditional formal to modern chic",
    "Coordinate your wedding palette with attire",
  ],
  "gift-guide-card": [
    "Add QR codes for your gift registry",
    "Make gifting effortless for your guests",
    "Share your wishes with a simple scan",
  ],
  "date-time-card": [
    "Mark the moment you say \"I do\"",
    "Count down to your special day",
    "Time, place, and date beautifully displayed",
  ],
  "story-card": [
    "Tell your love story with photos",
    "Share the journey that brought you together",
    "A narrative of moments, beautifully woven",
  ],
  invitation: [
    "An invitation as unique as your love",
    "Personalize every word and detail",
    "Set the stage for your celebration",
  ],
  "custom-card-portrait": [
    "A portrait of your love story",
    "Customize with elegant typography",
    "Your names, beautifully displayed",
  ],
  "countdown-card": [
    "Count down to your special day",
    "A live timer for your wedding moment",
    "Build anticipation with every second",
    "Beautiful countdown styles to choose from",
  ],
};

const ENVELOPE_TEXTURES = ["envA", "envB", "envC"];
const STD_IMAGES = [1, 2, 3, 4, 5, 6];
const BACKGROUND_IMAGES = ["texturebg1", "texturebg2", "texturebg3", "texturebg4", "texturebg5"];

function pickRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let welcomeScreenIndex = Math.floor(Math.random() * WELCOME_SCREENS.length);
let topMessageIndex = Math.floor(Math.random() * TOP_MESSAGES.length);
let topFontIndex = Math.floor(Math.random() * HEADING_FONTS.length);
let colorIndex = 0;

function pickNextScreen(): WelcomeScreenType {
  const screen = WELCOME_SCREENS[welcomeScreenIndex % WELCOME_SCREENS.length];
  welcomeScreenIndex++;
  return screen;
}

function pickNextTopMessage(): string {
  const msg = TOP_MESSAGES[topMessageIndex % TOP_MESSAGES.length];
  topMessageIndex++;
  return msg;
}

function pickNextTopFont(): string {
  const font = HEADING_FONTS[topFontIndex % HEADING_FONTS.length];
  topFontIndex++;
  return font;
}

function pickRandomColor(): string {
  return COLOR_CYCLE[Math.floor(Math.random() * COLOR_CYCLE.length)];
}

function generateDressCodeColors(): Record<string, string> {
  return {
    male1: pickRandomColor(),
    female1: pickRandomColor(),
    male2: pickRandomColor(),
    female2: pickRandomColor(),
  };
}

function pickNextColor(): string {
  const color = COLOR_CYCLE[colorIndex % COLOR_CYCLE.length];
  colorIndex++;
  return color;
}

const INITIAL_OPTIONS = [
  { phase: "welcome" as const, designIndex: 0 },
  { phase: "draft" as const, designIndex: 0 },
  { phase: "draft" as const, designIndex: 1 },
  { phase: "draft" as const, designIndex: 2 },
];

export default function HomePreviewStage({ externalMode, externalToggle }: HomePreviewStageProps = {}) {
  const { mode: localMode, toggle: localToggle } = useSystemTheme();
  const mode = externalMode ?? localMode;
  const toggle = externalToggle ?? localToggle;
  const t = getThemeColors(mode);
  const [initialOption] = useState(() => INITIAL_OPTIONS[Math.floor(Math.random() * INITIAL_OPTIONS.length)]);
  const [phase, setPhase] = useState<"welcome" | "draft">(initialOption.phase);
  const [welcomeType, setWelcomeType] = useState<WelcomeScreenType>(() => WELCOME_SCREENS[welcomeScreenIndex % WELCOME_SCREENS.length]);
  const [topFont, setTopFont] = useState<string>(() => HEADING_FONTS[0]);
  const [accentColor, setAccentColor] = useState<string>(() => COLOR_CYCLE[colorIndex]);
  const [cycleId, setCycleId] = useState(0);
  const [designIndex, setDesignIndex] = useState(initialOption.designIndex);
  const [skinIndex, setSkinIndex] = useState(0);
  const [flowerVariant, setFlowerVariant] = useState(0);
  const [envelopeTapCount, setEnvelopeTapCount] = useState(0);
  const [swapPhotoAndFlowers, setSwapPhotoAndFlowers] = useState(false);
  const [welcomeFading, setWelcomeFading] = useState(false);
  const [slideLeft, setSlideLeft] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [featureFading, setFeatureFading] = useState(false);
  const [dressCodeVariant, setDressCodeVariant] = useState(0);
  const [dressCodeTapCount, setDressCodeTapCount] = useState(0);
  const [dressCodeSliding, setDressCodeSliding] = useState(false);
  const [dressCodeSlideDir, setDressCodeSlideDir] = useState<"left" | "right">("right");
  const [dressCodeColors, setDressCodeColors] = useState<Record<string, string>>(() => generateDressCodeColors());
  const [tieVariant, setTieVariant] = useState(0);
  const [countdownStructure, setCountdownStructure] = useState(() => [0, 6, 8][Math.floor(Math.random() * 3)]);
  const [envTexture, setEnvTexture] = useState(() => pickRandomFromArray(ENVELOPE_TEXTURES));
  const [stdImage, setStdImage] = useState(() => pickRandomFromArray(STD_IMAGES));
  const [bgImage, setBgImage] = useState(() => pickRandomFromArray(BACKGROUND_IMAGES));
  const [nowPlayingPaused, setNowPlayingPaused] = useState(false);
  const DRESS_CODE_TAPS = 3;

  const currentDesign = DRAFT_DESIGNS[designIndex] || "envelope";

  const previewData: InvitationData = useMemo(
    () => ({
      ...demoInvitationData,
      welcomeScreenType: welcomeType,
      welcomeRandomScreen: false,
      welcomeTopMessage: "Tap to unveil your invitation",
      welcomeTopMessageFont: topFont,
      welcomeEnvelopeColor: accentColor,
      welcomeEnvelopeTexture: envTexture,
      welcomeFullEnvelopeStdImage: stdImage,
      welcomeBackgroundImage: { urls: [bgImage] },
      mainColor1: accentColor,
    }),
    [welcomeType, topFont, accentColor, envTexture, stdImage, bgImage]
  );

  const handleEnvelopeOpen = useCallback(() => {
    setWelcomeFading(true);
    setTimeout(() => {
      setDesignIndex(0);
      setSkinIndex(0);
      setFlowerVariant(0);
      setEnvelopeTapCount(0);
      setFeatureIndex(0);
      setDressCodeVariant(0);
      setDressCodeTapCount(0);
      setTieVariant(0);
      setCountdownStructure(() => [0, 6, 8][Math.floor(Math.random() * 3)]);
      setDressCodeColors(generateDressCodeColors());
      setNowPlayingPaused(false);
      setSwapPhotoAndFlowers(false);
      setPhase("draft");
    }, 400);
  }, []);

  const handleDraftTap = useCallback(() => {
    if (currentDesign === "envelope") {
      const nextTap = envelopeTapCount + 1;
      if (nextTap >= ENVELOPE_TAPS) {
        setSlideLeft(true);
        setTimeout(() => {
          const nextColor = pickNextColor();
          setAccentColor(nextColor);
          setEnvelopeTapCount(0);
          setSkinIndex(0);
          setFlowerVariant(0);
          setSwapPhotoAndFlowers(false);
          setDesignIndex((prev) => prev + 1);
          setSlideLeft(false);
          setFeatureIndex(0);
        }, 700);
      } else {
        setAccentColor(pickNextColor());
        if (nextTap === 1) {
          setSwapPhotoAndFlowers(true);
        } else {
          setSwapPhotoAndFlowers(false);
          setSkinIndex((prev) => (prev + 1) % ENVELOPE_SKINS.length);
          setFlowerVariant((prev) => (prev + 1) % 3);
        }
        setEnvelopeTapCount(nextTap);
      }
      return;
    }

    if (currentDesign === "now-playing") {
      if (nowPlayingPaused) {
        setSlideLeft(true);
        setTimeout(() => {
          const nextColor = pickNextColor();
          setAccentColor(nextColor);
          setNowPlayingPaused(false);
          setDesignIndex((prev) => prev + 1);
          setSlideLeft(false);
          setFeatureIndex(0);
        }, 700);
      } else {
        setNowPlayingPaused(true);
      }
      return;
    }

    if (currentDesign === "dress-code-card") {
      const nextTap = dressCodeTapCount + 1;
      if (nextTap >= DRESS_CODE_TAPS) {
        setSlideLeft(true);
        setTimeout(() => {
          const nextColor = pickNextColor();
          setAccentColor(nextColor);
          setDressCodeVariant(0);
          setDressCodeTapCount(0);
          setTieVariant(0);
          setCountdownStructure(() => [0, 6, 8][Math.floor(Math.random() * 3)]);
          setDressCodeSlideDir("right");
          setDesignIndex((prev) => prev + 1);
          setSlideLeft(false);
          setFeatureIndex(0);
        }, 700);
      } else {
        const dir = dressCodeSlideDir === "right" ? "left" : "right";
        setDressCodeSlideDir(dir);
        setDressCodeSliding(true);
        setTimeout(() => {
          setAccentColor(pickNextColor());
          setDressCodeColors(generateDressCodeColors());
          setDressCodeVariant((prev) => (prev + 1) % DRESS_CODE_TAPS);
          setTieVariant(prev => prev + 1);
          setDressCodeSliding(false);
          setDressCodeTapCount(nextTap);
        }, 350);
      }
      return;
    }

    setSlideLeft(true);
    setTimeout(() => {
      if (designIndex >= DRAFT_DESIGNS.length - 1) {
        const next = pickNextScreen();
        const nextFont = pickNextTopFont();
        const nextColor = pickNextColor();
        setWelcomeType(next);
        setTopFont(nextFont);
        setAccentColor(nextColor);
        setEnvTexture(pickRandomFromArray(ENVELOPE_TEXTURES));
        setStdImage(pickRandomFromArray(STD_IMAGES));
        setBgImage(pickRandomFromArray(BACKGROUND_IMAGES));
        setCycleId((c) => c + 1);
        setWelcomeFading(true);
        setPhase("welcome");
        setSlideLeft(false);
        setFeatureIndex(0);
        setDressCodeVariant(0);
        setDressCodeTapCount(0);
        setTieVariant(0);
        setCountdownStructure(() => [0, 6, 8][Math.floor(Math.random() * 3)]);
      } else {
        const nextColor = pickNextColor();
        setAccentColor(nextColor);
        setDesignIndex((prev) => prev + 1);
        setSlideLeft(false);
        setFeatureIndex(0);
        setDressCodeVariant(0);
        setDressCodeTapCount(0);
        setTieVariant(0);
        setCountdownStructure(() => [0, 6, 8][Math.floor(Math.random() * 3)]);
      }
    }, 700);
  }, [currentDesign, designIndex, envelopeTapCount, dressCodeTapCount, dressCodeSlideDir, swapPhotoAndFlowers, nowPlayingPaused]);

  useEffect(() => {
    if (currentDesign !== "dress-code-card" || dressCodeSliding || slideLeft) return;
    const timer = setTimeout(() => {
      setDressCodeColors(generateDressCodeColors());
      setTieVariant(prev => prev + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [currentDesign, dressCodeVariant, dressCodeSliding, slideLeft]);

  useEffect(() => {
    if (currentDesign !== "countdown-card" || slideLeft) return;
    const COUNTDOWN_STRUCTS = [0, 6, 8];
    const timer = setTimeout(() => {
      setCountdownStructure(prev => {
        const remaining = COUNTDOWN_STRUCTS.filter(s => s !== prev);
        return remaining[Math.floor(Math.random() * remaining.length)];
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentDesign, countdownStructure, slideLeft]);

  useEffect(() => {
    const preventKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "u" || e.key === "c" || e.key === "p")) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", preventKey);
    return () => document.removeEventListener("keydown", preventKey);
  }, []);

  useEffect(() => {
    if (phase !== "welcome") return;
    const frame = requestAnimationFrame(() => setWelcomeFading(false));
    return () => cancelAnimationFrame(frame);
  }, [phase, cycleId]);

  const welcomeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase === "welcome") {
        const clickable = welcomeRef.current?.querySelector("[onclick], .cursor-pointer");
        if (clickable instanceof HTMLElement) {
          clickable.click();
        } else {
          welcomeRef.current?.click();
        }
      } else {
        handleDraftTap();
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [phase, cycleId, designIndex, envelopeTapCount, dressCodeTapCount, dressCodeSlideDir, swapPhotoAndFlowers, skinIndex, flowerVariant, dressCodeVariant, featureIndex, nowPlayingPaused]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        transform: "translateZ(0)",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Theme toggle — mobile only, upper right of animation screen */}
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="sm:hidden absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
        style={{ backgroundColor: "rgba(0,0,0,0.15)", color: t.accent }}
        aria-label="Toggle theme"
      >
        {mode === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      {phase === "welcome" && (
        <div
          ref={welcomeRef}
          key={`welcome-${cycleId}`}
          className="absolute inset-0"
          style={{ opacity: welcomeFading ? 0 : 1, transition: "opacity 1400ms ease" }}
          onClick={(e) => {
            const el = e.currentTarget.querySelector("[onclick], .cursor-pointer, [style*='pointer-events: auto']") as HTMLElement | null;
            if (el) el.click();
          }}
        >
          <WelcomeScreenManager data={previewData} onOpen={handleEnvelopeOpen} envelopeScale={0.7} forceFullEnvelope />
        </div>
      )}

      {phase === "draft" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          style={{
            backgroundColor: `${accentColor}0d`,
          }}
          onClick={handleDraftTap}
        >
          <style>{`
            @keyframes draftSlideIn {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes draftFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes draftSlideOut {
              from { opacity: 1; transform: translateY(0); }
              to { opacity: 0; transform: translateY(-100%); }
            }
            @keyframes draftFadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
            @keyframes dressSlideRight {
              from { opacity: 0; transform: translateX(60px); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes dressSlideLeft {
              from { opacity: 0; transform: translateX(-60px); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes dressSlideRightOut {
              from { opacity: 1; transform: translateX(0); }
              to { opacity: 0; transform: translateX(-60px); }
            }
            @keyframes dressSlideLeftOut {
              from { opacity: 1; transform: translateX(0); }
              to { opacity: 0; transform: translateX(60px); }
            }
          `}</style>

          {currentDesign === "envelope" ? (
            <>
              <div
                key={`design-${designIndex}-${cycleId}`}
                style={{
                  animation: slideLeft
                    ? "draftFadeOut 700ms ease forwards"
                    : undefined,
                }}
              >
                <HomeEnvelopeCard
                  data={previewData}
                  skinIndex={skinIndex}
                  flowerVariant={flowerVariant}
                  onTap={() => {}}
                  fading={false}
                  swapPhotoAndFlowers={swapPhotoAndFlowers}
                />
              </div>
            </>
          ) : (
            <>
              <div className="sm:scale-110 origin-center">
              {currentDesign === "now-playing" && (
                <div className="relative w-full flex justify-center" style={{ height: 0, zIndex: 10 }}>
                  <div className="relative" style={{ width: 200, opacity: slideLeft ? 0 : 1, transition: "opacity 700ms ease" }}>
                    <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center" style={{ opacity: nowPlayingPaused ? 1 : 0.8, transition: "opacity 300ms ease" }}>
                      {nowPlayingPaused ? (
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div
                key={`design-${designIndex}-${cycleId}-${dressCodeVariant}`}
                className="flex flex-col items-center select-none"
                style={{
                  animation: slideLeft
                    ? (currentDesign === "dress-code-card" ? "draftFadeOut 700ms ease forwards" : "draftSlideOut 700ms ease forwards")
                    : currentDesign === "dress-code-card" && dressCodeSliding
                    ? (dressCodeSlideDir === "right" ? "dressSlideRightOut 350ms ease forwards" : "dressSlideLeftOut 350ms ease forwards")
                    : currentDesign === "dress-code-card" && !dressCodeSliding
                    ? (dressCodeSlideDir === "right" ? "dressSlideRight 350ms ease" : "dressSlideLeft 350ms ease")
                    : "draftSlideIn 700ms ease",
                }}
              >
                <HomeDraftDesign designType={currentDesign} data={previewData} accentColor={accentColor} dressCodeVariant={dressCodeVariant} dressCodeColors={dressCodeColors} nowPlayingPaused={nowPlayingPaused} tieVariant={tieVariant} countdownStructure={countdownStructure} />
              </div>
              </div>
            </>
          )}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <FeatureText
              key={`feature-${designIndex}`}
              messages={DESIGN_FEATURES[currentDesign] || ["Tap to explore designs"]}
              index={featureIndex}
              onCycle={() => {}}
              fading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
