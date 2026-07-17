import type { WelcomeScreenType, WelcomeElementSettings, AssetCategory } from "./types/invitation";

export interface WelcomeElementDef {
  id: string;
  label: string;
  type: "image" | "text";
  category?: AssetCategory;
  defaults: Required<Omit<WelcomeElementSettings, "src">> & { src: string };
  constraints: {
    minScale: number;
    maxScale: number;
    minRotation: number;
    maxRotation: number;
  };
}

export interface WelcomeScreenDef {
  id: WelcomeScreenType;
  label: string;
  description: string;
  icon: string;
  elements: WelcomeElementDef[];
}

export const WELCOME_SCREENS: WelcomeScreenDef[] = [
  {
    id: "classic-envelope",
    label: "Classic Envelope",
    description: "A small floating envelope with a 3D lid that opens on tap",
    icon: "✉️",
    elements: [
      {
        id: "envelope",
        label: "Envelope Style",
        type: "image",
        category: "envelopes",
        defaults: { src: "", text: "", scale: 1, rotation: 0, visible: true, zIndex: 2, alignment: "center" },
        constraints: { minScale: 0.6, maxScale: 1.4, minRotation: -15, maxRotation: 15 },
      },
      {
        id: "decoration",
        label: "Flower Decoration",
        type: "image",
        category: "flowers",
        defaults: { src: "", text: "", scale: 1, rotation: 0, visible: true, zIndex: 1, alignment: "center" },
        constraints: { minScale: 0.5, maxScale: 1.5, minRotation: -30, maxRotation: 30 },
      },
      {
        id: "tapText",
        label: "Tap Prompt",
        type: "text",
        defaults: { src: "", text: "Tap to open", scale: 1, rotation: 0, visible: true, zIndex: 1, alignment: "center" },
        constraints: { minScale: 0.7, maxScale: 1.3, minRotation: -10, maxRotation: 10 },
      },
    ],
  },
  {
    id: "full-envelope",
    label: "Full Envelope",
    description: "A large envelope spanning the full screen with dramatic lid opening",
    icon: "📬",
    elements: [
      {
        id: "decoration",
        label: "Wax Seal Decoration",
        type: "image",
        category: "flowers",
        defaults: { src: "", text: "", scale: 1, rotation: 0, visible: true, zIndex: 2, alignment: "center" },
        constraints: { minScale: 0.5, maxScale: 1.5, minRotation: -30, maxRotation: 30 },
      },
      {
        id: "tapText",
        label: "Tap Prompt",
        type: "text",
        defaults: { src: "", text: "Tap to reveal", scale: 1, rotation: 0, visible: true, zIndex: 1, alignment: "center" },
        constraints: { minScale: 0.7, maxScale: 1.3, minRotation: -10, maxRotation: 10 },
      },
    ],
  },
  {
    id: "curtain",
    label: "Curtain",
    description: "Two fabric curtains slide apart to reveal the invitation",
    icon: "🎭",
    elements: [
      {
        id: "centerDecoration",
        label: "Center Decoration",
        type: "image",
        category: "flowers",
        defaults: { src: "", text: "", scale: 1, rotation: 0, visible: true, zIndex: 3, alignment: "center" },
        constraints: { minScale: 0.5, maxScale: 1.5, minRotation: -20, maxRotation: 20 },
      },
      {
        id: "titleText",
        label: "Center Text",
        type: "text",
        defaults: { src: "", text: "You are invited", scale: 1, rotation: 0, visible: true, zIndex: 2, alignment: "center" },
        constraints: { minScale: 0.7, maxScale: 1.3, minRotation: -10, maxRotation: 10 },
      },
    ],
  },
  {
    id: "bloom",
    label: "Flower Bloom",
    description: "Flowers bloom and fly outward to reveal the invitation",
    icon: "🌸",
    elements: [
      {
        id: "flower",
        label: "Flower Type",
        type: "image",
        category: "flowers",
        defaults: { src: "", text: "", scale: 1, rotation: 0, visible: true, zIndex: 2, alignment: "center" },
        constraints: { minScale: 0.5, maxScale: 1.5, minRotation: -45, maxRotation: 45 },
      },
      {
        id: "subtitle",
        label: "Subtitle Text",
        type: "text",
        defaults: { src: "", text: "Open our invitation", scale: 1, rotation: 0, visible: true, zIndex: 1, alignment: "center" },
        constraints: { minScale: 0.7, maxScale: 1.3, minRotation: 0, maxRotation: 0 },
      },
    ],
  },
  {
    id: "none",
    label: "No Welcome Screen",
    description: "Skip the welcome screen and go directly to the invitation",
    icon: "⚡",
    elements: [],
  },
];

export function getScreenDef(type: WelcomeScreenType): WelcomeScreenDef {
  return WELCOME_SCREENS.find((s) => s.id === type) ?? WELCOME_SCREENS[0];
}

export function getElement(
  screenType: WelcomeScreenType,
  elementId: string,
  welcomeElements: Record<string, WelcomeElementSettings> | undefined,
  def: WelcomeElementDef
): Required<Omit<WelcomeElementSettings, "src">> & { src: string } {
  const key = `${screenType}.${elementId}`;
  const overrides = welcomeElements?.[key] ?? {};
  return { ...def.defaults, ...overrides };
}
