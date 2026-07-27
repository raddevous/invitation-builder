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
    icon: "",
    elements: [],
  },
  {
    id: "full-envelope",
    label: "Full Envelope",
    description: "A large envelope spanning the full screen with dramatic lid opening",
    icon: "",
    elements: [],
  },
  {
    id: "curtain",
    label: "Curtain",
    description: "Two fabric curtains slide apart to reveal the invitation",
    icon: "",
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
  def: WelcomeElementDef | undefined
): Required<Omit<WelcomeElementSettings, "src">> & { src: string } {
  const key = `${screenType}.${elementId}`;
  const overrides = welcomeElements?.[key] ?? {};
  const defaults = def?.defaults ?? {
    src: "",
    text: "",
    scale: 1,
    rotation: 0,
    visible: true,
    zIndex: 0,
    alignment: "center" as const,
  };
  return { ...defaults, ...overrides } as Required<Omit<WelcomeElementSettings, "src">> & { src: string };
}
