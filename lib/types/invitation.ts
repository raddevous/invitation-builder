export interface InvitationSections {
  eventdetails: boolean;
  gallery: boolean;
  map: boolean;
  rsvp: boolean;
  timeline: boolean;
  countdown: boolean;
  dresscode: boolean;
  giftguide: boolean;
  footer: boolean;
  entourage: boolean;
  weddingdirectory: boolean;
}

export type WelcomeScreenType =
  | "classic-envelope"
  | "full-envelope"
  | "curtain"
  | "bloom"
  | "none";

export type DividerType = "none" | "divider-1" | "divider-2" | "divider-3" | "divider-4";

export type DividerStyle = "centered-single" | "split-horizontal" | "mirrored-corners";

export type BackgroundType = "color" | "gradient" | "image" | "video" | "animation";

export interface GradientBackground {
  firstColor: string;
  secondColor: string;
  firstOpacity?: number;
  secondOpacity?: number;
}

export interface ImageBackground {
  urls: string[];
}

export interface VideoBackground {
  url: string;
}

export interface WelcomeElementSettings {
  src?: string;
  text?: string;
  scale?: number;
  rotation?: number;
  visible?: boolean;
  zIndex?: number;
  alignment?: "left" | "center" | "right";
}

export interface ImageTransform {
  scale: number;
  rotation: number;
  alignment: "left" | "center" | "right";
  objectPosition: string;
}

export interface InvitationData {
  nameType: "couple" | "event";
  coupleName: string;
  hisName: string;
  andText: string;
  herName: string;
  subtitle: string;
  date: string;
  time: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  venueImages?: string[];
  receptionVenueName?: string;
  receptionVenueAddress?: string;
  headingFont: string;
  bodyFont: string;
  mainColor1: string;
  mainColor2: string;
  neutralColor1: string;
  neutralColor2: string;
  accentColor: string;
  isDarkMode?: boolean;
  editorPanelPosition?: "left" | "right";
  editorPanelExpanded?: boolean;
  baseFontSize: number;
  welcomeEnvelope: string;
  flowerDecoration: string;
  heroBackgroundImages?: string[];
  heroBackgroundImagesCrop?: Array<{ x: number; y: number; zoom: number } | null>;
  heroBackgroundImagesMobile?: string[];
  heroBackgroundImagesMobileCrop?: Array<{ x: number; y: number; zoom: number } | null>;
  backgroundImage: string;
  galleryImages: string[];
  musicEnabled: boolean;
  musicTrack: string;
  musicVolume: number;
  backgroundMusic?: string[];
  backgroundMusicFileNames?: string[];
  customHeadingFont?: string;
  customBodyFont?: string;
  sections: InvitationSections;
  sectionOrder: string[];
  heroMessage?: string;
  heroClosingSentiment?: string;
  heroIcon?: string;
  heroIconType?: "image" | "initial" | "none";
  heroIconColorTint?: string;
  heroIconColorTintOpacity?: number;
  heroIconMarginAdjustment?: number;
  heroIconSize?: number;
  heroIconTypography?: string;
  heroIconTextColor?: string;
  heroIconName2First?: boolean;
  heroIconAddAmpersand?: boolean;
  heroIconAmpersandOnSecondLine?: boolean;
  heroAmpersandPosition?: "default" | "first-line" | "middle-line" | "second-line";
  heroDisplayNameTypography?: string;
  heroAmpersandTypography?: string;
  heroDateStructure?: "default" | "alternative" | "icon" | "elegant" | "modern" | "huge";
  heroDateStructureSize?: number;
  heroDateStructureSpacing?: number;
  heroVenueStructure?: "default" | "icon";
  heroHostLineImage?: "hostline-00" | "hostline-01" | "hostline-02" | "hostline-03" | "hostline-04" | "hostline-05" | "hostline-06" | "hostline-07" | "hostline-08" | "hostline-09";
  heroHostLineImageOpacity?: number;
  heroClosingSentimentImage?: "fsentiment-00" | "fsentiment-01" | "fsentiment-02" | "fsentiment-03" | "fsentiment-04" | "fsentiment-05" | "fsentiment-06" | "fsentiment-07";
  heroClosingSentimentImageOpacity?: number;
  heroOthersTextSize?: number;
  heroTextShadowOpacity?: number;
  heroNameSize?: number;
  heroAmpersandSize?: number;
  heroAmpersandOpacity?: number;
  heroOthersColor?: string;
  heroOthersTypography?: string;
  collapsedSections?: string[];
  heroBackgroundOverlay?: "solid" | "gradient";
  heroOverlayColor1?: string;
  heroOverlayColor2?: string;
  heroOverlayOpacity1?: number;
  heroOverlayOpacity2?: number;
  eventDetailsHeading?: string;
  eventDetailsMessage?: string;
  eventDetailsHeadingTypography?: string;
  eventDetailsHeadingFontSize?: number;
  eventDetailsMessageTypography?: string;
  eventDetailsMessageFontSize?: number;
  eventDetailsHeadingColor?: string;
  eventDetailsMessageColor?: string;
  eventDetailsUseMainColor?: boolean;
  eventDetailsBackgroundColor?: string;
  eventDetailsBackgroundType?: BackgroundType;
  eventDetailsGradient?: GradientBackground;
  eventDetailsImage?: ImageBackground;
  eventDetailsVideo?: VideoBackground;
  eventDetailsDivider?: DividerType;
  eventDetailsDividerOffset?: number;
  eventDetailsDividerTintColor?: string;
  eventDetailsDividerTintOpacity?: number;
  eventDetailsDividerStyle?: DividerStyle;
  eventDetailsDividerFlip?: boolean;
  eventDetailsDividerSpacing?: number;
  eventDetailsDividerPullDown?: number;
  eventDetailsDividerVerticalFlip?: boolean;
  eventDetailsDividerImageSize?: number;
  eventDetailsDividerUseDefault?: boolean;
  eventDetailsDividerCustomImageUrl1?: string;
  eventDetailsDividerCustomImageUrl2?: string;
  eventDetailsDividerCustomImageUrl3?: string;
  eventDetailsDividerColorBlend?: boolean;
  eventDetailsTimelineAccentMode?: number;
  eventDetailsTimelineScale?: number;
  galleryHeading?: string;
  galleryMessage?: string;
  galleryHeadingTypography?: string;
  galleryHeadingFontSize?: number;
  galleryMessageTypography?: string;
  galleryMessageFontSize?: number;
  galleryHeadingColor?: string;
  galleryMessageColor?: string;
  galleryUseMainColor?: boolean;
  galleryBackgroundColor?: string;
  galleryBackgroundType?: BackgroundType;
  galleryGradient?: GradientBackground;
  galleryImage?: ImageBackground;
  galleryVideo?: VideoBackground;
  galleryDivider?: DividerType;
  galleryDividerOffset?: number;
  galleryDividerTintColor?: string;
  galleryDividerTintOpacity?: number;
  galleryDividerStyle?: DividerStyle;
  galleryDividerFlip?: boolean;
  galleryDividerSpacing?: number;
  galleryDividerPullDown?: number;
  galleryDividerVerticalFlip?: boolean;
  galleryDividerImageSize?: number;
  galleryDividerUseDefault?: boolean;
  galleryDividerCustomImageUrl1?: string;
  galleryDividerCustomImageUrl2?: string;
  galleryDividerCustomImageUrl3?: string;
  galleryDividerColorBlend?: boolean;
  galleryGridLayout?: string;
  galleryButtonColor?: string;
  mapHeading?: string;
  mapMessage?: string;
  mapHeadingTypography?: string;
  mapHeadingFontSize?: number;
  mapMessageTypography?: string;
  mapMessageFontSize?: number;
  mapHeadingColor?: string;
  mapMessageColor?: string;
  mapUseMainColor?: boolean;
  mapBackgroundColor?: string;
  mapBackgroundType?: BackgroundType;
  mapGradient?: GradientBackground;
  mapImage?: ImageBackground;
  mapVideo?: VideoBackground;
  mapDivider?: DividerType;
  mapDividerOffset?: number;
  mapDividerTintColor?: string;
  mapDividerTintOpacity?: number;
  mapDividerStyle?: DividerStyle;
  mapDividerFlip?: boolean;
  mapDividerSpacing?: number;
  mapDividerPullDown?: number;
  mapDividerVerticalFlip?: boolean;
  mapDividerImageSize?: number;
  mapDividerUseDefault?: boolean;
  mapDividerCustomImageUrl1?: string;
  mapDividerCustomImageUrl2?: string;
  mapDividerCustomImageUrl3?: string;
  mapDividerColorBlend?: boolean;
  rsvpHeading?: string;
  rsvpDivider?: DividerType;
  rsvpDividerOffset?: number;
  rsvpDividerTintColor?: string;
  rsvpDividerTintOpacity?: number;
  rsvpDividerStyle?: DividerStyle;
  rsvpDividerFlip?: boolean;
  rsvpDividerSpacing?: number;
  rsvpDividerPullDown?: number;
  rsvpDividerVerticalFlip?: boolean;
  rsvpDividerImageSize?: number;
  rsvpDividerUseDefault?: boolean;
  rsvpDividerCustomImageUrl1?: string;
  rsvpDividerCustomImageUrl2?: string;
  rsvpDividerCustomImageUrl3?: string;
  rsvpDividerColorBlend?: boolean;
  timelineHeading?: string;
  timelineMessage?: string;
  timelineHeadingTypography?: string;
  timelineHeadingFontSize?: number;
  timelineMessageTypography?: string;
  timelineMessageFontSize?: number;
  timelineHeadingColor?: string;
  timelineMessageColor?: string;
  timelineUseMainColor?: boolean;
  timelineBackgroundColor?: string;
  timelineBackgroundType?: BackgroundType;
  timelineGradient?: GradientBackground;
  timelineImage?: ImageBackground;
  timelineVideo?: VideoBackground;
  timelineDivider?: DividerType;
  timelineDividerOffset?: number;
  timelineDividerTintColor?: string;
  timelineDividerTintOpacity?: number;
  timelineDividerStyle?: DividerStyle;
  timelineDividerFlip?: boolean;
  timelineDividerSpacing?: number;
  timelineDividerPullDown?: number;
  timelineDividerVerticalFlip?: boolean;
  timelineDividerImageSize?: number;
  timelineDividerUseDefault?: boolean;
  timelineDividerCustomImageUrl1?: string;
  timelineDividerCustomImageUrl2?: string;
  timelineDividerCustomImageUrl3?: string;
  timelineDividerColorBlend?: boolean;
  countdownHeading?: string;
  countdownMessage?: string;
  countdownHeadingTypography?: string;
  countdownHeadingFontSize?: number;
  countdownMessageTypography?: string;
  countdownMessageFontSize?: number;
  countdownHeadingColor?: string;
  countdownMessageColor?: string;
  countdownUseMainColor?: boolean;
  countdownBackgroundColor?: string;
  countdownBackgroundType?: BackgroundType;
  countdownGradient?: GradientBackground;
  countdownImage?: ImageBackground;
  countdownVideo?: VideoBackground;
  countdownDivider?: DividerType;
  countdownDividerOffset?: number;
  countdownDividerTintColor?: string;
  countdownDividerTintOpacity?: number;
  countdownDividerStyle?: DividerStyle;
  countdownDividerFlip?: boolean;
  countdownDividerSpacing?: number;
  countdownDividerPullDown?: number;
  countdownDividerVerticalFlip?: boolean;
  countdownDividerImageSize?: number;
  countdownDividerUseDefault?: boolean;
  countdownDividerCustomImageUrl1?: string;
  countdownDividerCustomImageUrl2?: string;
  countdownDividerCustomImageUrl3?: string;
  countdownDividerColorBlend?: boolean;
  countdownShowDate?: boolean;
  countdownCrystalColor?: string;
  countdownDateStructure?: "default" | "alternative" | "icon" | "elegant" | "modern";
  dresscodeHeading?: string;
  dresscodeDivider?: DividerType;
  dresscodeDividerOffset?: number;
  dresscodeDividerTintColor?: string;
  dresscodeDividerTintOpacity?: number;
  dresscodeDividerStyle?: DividerStyle;
  dresscodeDividerFlip?: boolean;
  dresscodeDividerSpacing?: number;
  dresscodeDividerPullDown?: number;
  dresscodeDividerVerticalFlip?: boolean;
  dresscodeDividerImageSize?: number;
  dresscodeDividerUseDefault?: boolean;
  dresscodeDividerCustomImageUrl1?: string;
  dresscodeDividerCustomImageUrl2?: string;
  dresscodeDividerCustomImageUrl3?: string;
  dresscodeDividerColorBlend?: boolean;
  dresscodeBody?: string;
  dresscodeHeadingColor?: string;
  dresscodeBodyColor?: string;
  dresscodeUseMainColor?: boolean;
  dresscodeBackgroundColor?: string;
  dresscodeBackgroundType?: BackgroundType;
  dresscodeGradient?: GradientBackground;
  dresscodeImage?: ImageBackground;
  dresscodeVideo?: VideoBackground;
  dresscodeTitlesTypography?: string;
  dresscodeTitlesFontSize?: number;
  dresscodeBodyTypography?: string;
  dresscodeBodyFontSize?: number;
  giftguideHeading?: string;
  weddingDirectoryHeading?: string;
  weddingDirectoryMessage?: string;
  weddingDirectoryHeadingTypography?: string;
  weddingDirectoryHeadingFontSize?: number;
  weddingDirectoryMessageTypography?: string;
  weddingDirectoryMessageFontSize?: number;
  weddingDirectoryHeadingColor?: string;
  weddingDirectoryMessageColor?: string;
  weddingDirectoryUseMainColor?: boolean;
  weddingDirectoryBackgroundColor?: string;
  weddingDirectoryBackgroundType?: BackgroundType;
  weddingDirectoryGradient?: GradientBackground;
  weddingDirectoryImage?: ImageBackground;
  weddingDirectoryVideo?: VideoBackground;
  weddingDirectoryDivider?: DividerType;
  weddingDirectoryDividerOffset?: number;
  weddingDirectoryDividerTintColor?: string;
  weddingDirectoryDividerTintOpacity?: number;
  weddingDirectoryDividerStyle?: DividerStyle;
  weddingDirectoryDividerFlip?: boolean;
  weddingDirectoryDividerSpacing?: number;
  weddingDirectoryDividerPullDown?: number;
  weddingDirectoryDividerVerticalFlip?: boolean;
  weddingDirectoryDividerImageSize?: number;
  weddingDirectoryDividerUseDefault?: boolean;
  weddingDirectoryDividerCustomImageUrl1?: string;
  weddingDirectoryDividerCustomImageUrl2?: string;
  weddingDirectoryDividerCustomImageUrl3?: string;
  weddingDirectoryDividerColorBlend?: boolean;
  weddingDirectoryItems?: WeddingDirectoryItem[];
  weddingDirectoryDraftShadowEnabled?: boolean;
  weddingDirectoryDraftShadowVisibility?: number;
  weddingDirectoryDraftShadowBlur?: number;
  weddingDirectoryDraftShadowOffsetX?: number;
  weddingDirectoryDraftShadowOffsetY?: number;
  giftguideDivider?: DividerType;
  giftguideDividerOffset?: number;
  giftguideDividerTintColor?: string;
  giftguideDividerTintOpacity?: number;
  giftguideDividerStyle?: DividerStyle;
  giftguideDividerFlip?: boolean;
  giftguideDividerSpacing?: number;
  giftguideDividerPullDown?: number;
  giftguideDividerVerticalFlip?: boolean;
  giftguideDividerImageSize?: number;
  giftguideDividerUseDefault?: boolean;
  giftguideDividerCustomImageUrl1?: string;
  giftguideDividerCustomImageUrl2?: string;
  giftguideDividerCustomImageUrl3?: string;
  giftguideDividerColorBlend?: boolean;
  giftguideHeadingTypography?: string;
  giftguideHeadingFontSize?: number;
  giftguideMessageTypography?: string;
  giftguideMessageFontSize?: number;
  giftguideHeadingColor?: string;
  giftguideMessageColor?: string;
  giftguideUseMainColor?: boolean;
  giftguideBackgroundColor?: string;
  giftguideBackgroundType?: BackgroundType;
  giftguideGradient?: GradientBackground;
  giftguideImage?: ImageBackground;
  giftguideVideo?: VideoBackground;
  giftguideCrystalStructure?: 1 | 2 | 3;
  giftguideCrystalColor?: string;
  entourageHeading?: string;
  entourageHeadingTypography?: string;
  entourageHeadingFontSize?: number;
  entourageHeadingColor?: string;
  entourageTopTextTypography?: string;
  entourageTopTextFontSize?: number;
  entourageTopTextColor?: string;
  entourageBottomTextTypography?: string;
  entourageBottomTextFontSize?: number;
  entourageBottomTextColor?: string;
  entourageUseMainColor?: boolean;
  entourageBackgroundColor?: string;
  entourageBackgroundType?: BackgroundType;
  entourageGradient?: GradientBackground;
  entourageImage?: ImageBackground;
  entourageVideo?: VideoBackground;
  entourageDivider?: DividerType;
  entourageDividerOffset?: number;
  entourageDividerTintColor?: string;
  entourageDividerTintOpacity?: number;
  entourageDividerStyle?: DividerStyle;
  entourageDividerFlip?: boolean;
  entourageDividerSpacing?: number;
  entourageDividerPullDown?: number;
  entourageDividerVerticalFlip?: boolean;
  entourageDividerImageSize?: number;
  entourageDividerUseDefault?: boolean;
  entourageDividerCustomImageUrl1?: string;
  entourageDividerCustomImageUrl2?: string;
  entourageDividerCustomImageUrl3?: string;
  entourageDividerColorBlend?: boolean;
  footerDivider?: DividerType;
  footerDividerOffset?: number;
  footerDividerTintColor?: string;
  footerDividerTintOpacity?: number;
  footerDividerStyle?: DividerStyle;
  footerDividerFlip?: boolean;
  footerDividerSpacing?: number;
  footerDividerPullDown?: number;
  footerDividerVerticalFlip?: boolean;
  footerDividerImageSize?: number;
  footerDividerCustomImageUrl1?: string;
  footerDividerCustomImageUrl2?: string;
  footerDividerCustomImageUrl3?: string;
  footerDividerUseDefault?: boolean;
  footerDividerColorBlend?: boolean;
  universalDivider?: DividerType;
  universalDividerOffset?: number;
  universalDividerTintColor?: string;
  universalDividerTintOpacity?: number;
  universalDividerStyle?: DividerStyle;
  universalDividerFlip?: boolean;
  universalDividerSpacing?: number;
  universalDividerPullDown?: number;
  universalDividerVerticalFlip?: boolean;
  universalDividerImageSize?: number;
  universalDividerCustomImageUrl1?: string;
  universalDividerCustomImageUrl2?: string;
  universalDividerCustomImageUrl3?: string;
  universalDividerColorBlend?: boolean;
  giftMessage?: string;
  giftThankYouMessage?: string;
  giftBank?: {
    name: string;
    account1: { qrCode: string; maskedName: string };
    account2: { qrCode: string; maskedName: string };
  };
  giftWallet?: {
    name: string;
    account1: { qrCode: string; maskedName: string };
    account2: { qrCode: string; maskedName: string };
  };
  rsvpDeadline?: string;
  rsvpGuestField?: boolean;
  rsvpMessageField?: boolean;
  rsvpInvitees?: Array<string | { name: string; title: "M" | "Mr." | "Ms." | "Mrs." }>;
  rsvpUseMainColor?: boolean;
  rsvpCrystalColor?: string;
  rsvpTopText?: string;
  rsvpTopTextCustom?: string;
  rsvpHeader?: string;
  rsvpHeaderCustom?: string;
  rsvpBottomText?: string;
  rsvpBottomTextCustom?: string;
  rsvpTopTextTypography?: string;
  rsvpTopTextFontSize?: number;
  rsvpTopTextColor?: string;
  rsvpHeaderTypography?: string;
  rsvpHeaderFontSize?: number;
  rsvpHeaderColor?: string;
  rsvpBottomTextTypography?: string;
  rsvpBottomTextFontSize?: number;
  rsvpBottomTextColor?: string;
  rsvpBackgroundColor?: string;
  rsvpBackgroundType?: BackgroundType;
  rsvpGradient?: GradientBackground;
  rsvpImage?: ImageBackground;
  rsvpVideo?: VideoBackground;
  rsvpPaperHeadingFont?: string;
  rsvpPaperBodyFont?: string;
  rsvpPaperTextColor?: string;
  rsvpPaperColor?: string;
  rsvpPaperBackground?: "texture1" | "texture2" | "texture3" | "texture4" | "texture5" | "none";
  rsvpPaperBackgroundZoom?: number;
  rsvpPaperBackgroundYPosition?: number;
  rsvpCardHeadingText?: string;
  rsvpDeadlineText?: string;
  rsvpAttendanceText?: string;
  rsvpGuestNameStyle?: number; // 0: underline+honorific, 1: underline+no-honorific, 2: no-underline+honorific, 3: no-underline+no-honorific
  rsvpReservedText?: string;
  rsvpAttendingThankYouText?: string; // Custom thank you text for attending guests
  rsvpNotAttendingThankYouText?: string; // Custom thank you text for not attending guests
  rsvpNotAttendingWithMessageThankYouText?: string; // Custom thank you text for not attending guests with message
  rsvpTitleSpecificMessages?: Record<string, string>; // Custom messages for each entourage title
  rsvpEntourageHonorifics?: Record<string, "M" | "Mr." | "Ms." | "Mrs.">; // Honorifics for entourage-derived guests, keyed by guest name
  rsvpEntourageGuestDetails?: Record<string, { plusOne: string; tableNumber: string }>; // Additional details for entourage guests, keyed by guest name
  rsvpGuestDetails?: Record<number, { plusOne: string; tableNumber: string }>; // Additional details for normal guests, keyed by index
  venueLayout?: {
    baseShape: 'rectangle' | 'circle' | 'square';
    dimensions: { width: number; height: number };
    cutouts: Array<{ x: number; y: number; width: number; height: number; shape: 'rectangle' | 'circle' }>;
    doors: Array<{
      id: string;
      type: 'entrance' | 'exit';
      position: { x: number; y: number };
      rotation: number;
      label?: string;
    }>;
    tables: Array<{
      id: string;
      type: 'round' | 'rectangular' | 'square' | 'dance-floor' | 'buffet' | 'other-table' | 'dessert-display' | 'stage' | 'entrance' | 'door';
      name: string;
      position: { x: number; y: number };
      dimensions: { width: number; height: number };
      rotation: number;
      chairCount: number;
      chairType?: 'chair-1' | 'chair-2' | 'chair-3' | 'chair-4' | 'chair-5' | 'chair-6';
      hasHeadOfTable?: boolean;
      imageUrl?: string;
      guestAssignments?: string[];
      locked?: boolean;
      doorColorMode?: 0 | 1 | 2 | 3;
      roundedCorners?: boolean;
      flipVertically?: boolean;
      flipHorizontally?: boolean;
    }>;
    isLocked?: boolean;
    gridDensity?: number;
    floorColor?: string;
    gridColor?: string;
    tableColor?: string;
    tableTextColor?: string;
    chairColor?: string;
    outlineColor?: string;
    tableScale?: number;
    doorColorMode?: 0 | 1;
  };
  dressCodeCategories?: Array<{
    label: string;
    imageUrl?: string;
    colors: string[] | Record<string, string>;
    imageSet?: string;
    tip?: string;
  }>;
  timelineEvents?: Array<{ title: string; description: string }>;
  imageTransforms?: Record<string, ImageTransform>;
  welcomeScreenType?: WelcomeScreenType;
  welcomeElements?: Record<string, WelcomeElementSettings>;
  entourage?: {
    topText?: string;
    topTextCustom?: string;
    header?: string;
    headerCustom?: string;
    bottomText?: string;
    bottomTextCustom?: string;
    titlesTypography?: string;
    namesTypography?: string;
    titlesColor?: string;
    namesColor?: string;
    titlesFontSize?: number;
    namesFontSize?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
    paperColor?: string;
    paperOpacity?: number;
    paperBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
    paperBackground?: "none" | "texture1" | "texture2" | "texture3" | "texture4" | "texture5" | "custom";
    paperBackgroundCustom?: string;
    paperBackgroundZoom?: number;
    paperBackgroundYPosition?: number;
    sectionOrder?: string[];
    page2Position?: number;
    page3Position?: number;
    visibleSections?: {
      couple?: boolean;
      groomParents?: boolean;
      brideParents?: boolean;
      marriageTalkSpeaker?: boolean;
      officiatingMinister?: boolean;
      witnesses?: boolean;
      bestMan?: boolean;
      maidOfHonor?: boolean;
      directorOfCeremony?: boolean;
      directorOfFeast?: boolean;
      ushers?: boolean;
      usherettes?: boolean;
      chairman?: boolean;
      groomsmen?: boolean;
      bridesmaids?: boolean;
      jrGroomsmen?: boolean;
      jrBridesmaid?: boolean;
      flowerGirls?: boolean;
      bibleBearer?: boolean;
      ringBearer?: boolean;
    };
    couple?: {
      title?: string;
      titleCustom?: string;
      groomName?: string;
      groomTitle?: string;
      groomTitleCustom?: string;
      brideName?: string;
      brideTitle?: string;
      brideTitleCustom?: string;
    };
    groomParents?: {
      title?: string;
      titleCustom?: string;
      fatherName?: string;
      fatherTitle?: string;
      fatherTitleCustom?: string;
      motherName?: string;
      motherTitle?: string;
      motherTitleCustom?: string;
    };
    brideParents?: {
      title?: string;
      titleCustom?: string;
      fatherName?: string;
      fatherTitle?: string;
      fatherTitleCustom?: string;
      motherName?: string;
      motherTitle?: string;
      motherTitleCustom?: string;
    };
    officiatingMinister?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
    marriageTalkSpeaker?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
    witnesses?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    bestMan?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
    maidOfHonor?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
    ushers?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    usherettes?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    directorOfCeremony?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    directorOfFeast?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    chairman?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
    groomsmen?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    bridesmaids?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    jrGroomsmen?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    jrBridesmaid?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    flowerGirls?: {
      title?: string;
      titleCustom?: string;
      names: string[];
    };
    bibleBearer?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
    ringBearer?: {
      title?: string;
      titleCustom?: string;
      name?: string;
    };
  };
}

export interface Invitation {
  id: string;
  slug: string;
  accessCode: string;
  templateId: string;
  eventType: string;
  clientName: string;
  data: InvitationData;
  createdAt?: string;
  updatedAt?: string;
}

export interface RsvpResponse {
  id?: string;
  invitationId: string;
  guestName: string;
  attendance: "attending" | "not-attending" | "maybe";
  guestCount: number;
  message?: string;
  submittedAt?: string;
}

export interface StockAsset {
  id: string;
  label: string;
  url: string;
  thumbnail: string;
  preview?: string;
}

export type AssetCategory =
  | "envelopes"
  | "flowers"
  | "backgrounds"
  | "frames"
  | "dividers"
  | "music"
  | "icons";

export interface WeddingDirectoryItem {
  id: string;
  draftDesignType: string;
  targetSection: string;
  zIndex: number;
  rotate: number;
  scaleMobile: number;
  scaleDesktop: number;
  pattern: string;
  flowerVariant?: number;
  imageUrl?: string;
  positionX: number;
  positionY: number;
  positionXMobile: number;
  positionXDesktop: number;
  positionYMobile: number;
  positionYDesktop: number;
  shadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  layers: Array<{
    id: string;
    designId: string;
    tint: string;
    zIndex: number;
  }>;
  stampTint?: string;
  stampTextColor?: string;
  stampTextBlendMode?: string;
  swapPhotoAndFlowers?: boolean;
  cardVariant?: number;
  hostLineText?: string;
  finalSentimentText?: string;
  customText?: string;
  customCardMessage?: string;
  textAnimation?: "blur-glow" | "typewriter" | "fade-slide";
  nameTextSize?: number;
  excludeTexts?: boolean;
  coloredTextEnabled?: boolean;
  coloredTextColor?: string;
  photoPapersText1?: string;
  photoPapersText2?: string;
  photoPapersTextColor?: string;
  photoPapersFontType?: string;
  photoPapersImage1?: string;
  photoPapersImage2?: string;
  textOverlay?: {
    content: string;
    color: string;
    typography: string;
    fontSize: number;
  };
  animation?: {
    type: "envelope-open" | "fade-in" | "slide-up" | "none";
    scrollTrigger: number;
  };
  nowPlayingName1?: string;
  nowPlayingName2?: string;
  nowPlayingNameFont?: string;
  nowPlayingNameSize?: number;
  nowPlayingArcRadius?: number;
  nowPlayingHeartsEnabled?: boolean;
  nowPlayingHeartSize?: number;
}
