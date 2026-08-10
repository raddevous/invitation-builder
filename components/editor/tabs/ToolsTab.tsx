import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { useBackHandler } from "@/lib/hooks/useBackHandler";
import { clearPendingMediaOperations } from "@/lib/utils/media-cache";
import EntourageEditor from "./EntourageEditor";
import GuestEditor from "./GuestEditor";
import MediaEditor from "./MediaEditor";
import SettingsEditor from "./SettingsEditor";
import EventDetailsTab from "./EventDetailsTab";
import ChecklistEditor from "./ChecklistEditor";
import BudgetEditor from "./BudgetEditor";
import TableMapEditor from "./TableMapEditor";
import WeddingProgramEditor from "./WeddingProgramEditor";
import StoryTimelineEditor from "./StoryTimelineEditor";
import { getFontFamily } from "@/lib/utils/fonts";
import { buildInviteUrl } from "@/lib/utils";
import { getEntourageGuestNames, getSpecialGuestNames } from "@/lib/utils/entourageGuests";
import ProgressCircle from "@/components/editor/shared/ProgressCircle";
import ProgressBar from "@/components/editor/shared/ProgressBar";
import HalfCircleGauge from "@/components/editor/shared/HalfCircleGauge";
import { getWeddingDetailsProgress, getWeddingDetailsWeight, getWeddingDetailsProgressData, getMediaOverallProgress, getMediaWeight, getMediaProgressData, getEntourageProgress, getEntourageWeight, getEntourageProgressData, getStoryTimelineProgress, getStoryTimelineWeight, getStoryTimelineProgressData, getWeddingProgramProgress, getWeddingProgramWeight, getWeddingProgramProgressData, getWeightedProgress } from "@/lib/utils/progressCalculator";
import SaveConfirmationDialog from "@/components/shared/SaveConfirmationDialog";

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface AccountInfo {
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

interface ToolsTabProps {
  data: InvitationData;
  slug: string;
  invitationId: string;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onOpenEditor?: () => void;
  onSettingsChange?: (settings: { isDarkMode: boolean; accentColor: string; hideInstructions?: boolean; showScreenDimensions?: boolean; isPreviewDetached?: boolean }) => void;
  onSave?: (updatedData: InvitationData) => Promise<void>;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
  isPreviewDetached?: boolean;
  isDemoMode?: boolean;
  accountInfo?: AccountInfo | null;
  isExpired?: boolean;
}

interface ToolTileProps {
  icon: string;
  label: string;
  onClick: () => void;
  isDarkMode?: boolean;
  accentColor?: string;
}

function ToolTile({ icon, label, onClick, isDarkMode = false, accentColor = "#6998EE" }: ToolTileProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`aspect-square flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all duration-200 ${
        isDarkMode
          ? "bg-gray-900 hover:bg-gray-800"
          : "bg-gray-50 hover:bg-gray-100"
      }`}
      style={{ border: `1px solid ${hovered ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3)}` }}
    >
      <div className="w-12 h-12" style={{
        backgroundColor: accentColor,
        WebkitMaskImage: `url(${icon})`,
        WebkitMaskSize: "contain",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskImage: `url(${icon})`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat"
      }} />
      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
    </button>
  );
}

type ToolsNavTab = "dashboard" | "list" | "website" | "settings";

// Maps each data field to the section it belongs to. Used to track which
// sections the user has *actually* modified (vs. automatic transformations
// like media cache resolution on native that swap remote URLs for local URIs).
const FIELD_TO_SECTION: Record<string, string> = {
  entourage: "Entourage",
  rsvpInvitees: "Guest List", rsvpEntourageHonorifics: "Guest List", rsvpEntourageGuestDetails: "Guest List", rsvpGuestDetails: "Guest List", rsvpExcludeFromCount: "Guest List",
  heroIcon: "Media", heroBackgroundImages: "Media", heroBackgroundImagesMobile: "Media", galleryImages: "Media", photosAndImages: "Media", venueImages: "Media", receptionVenueImages: "Media", customHeadingFont: "Media", customBodyFont: "Media", backgroundMusic: "Media", backgroundMusicFileNames: "Media",
  hisName: "Wedding Details", herName: "Wedding Details", andText: "Wedding Details", coupleName: "Wedding Details", nameType: "Wedding Details", date: "Wedding Details", time: "Wedding Details", timezone: "Wedding Details", venueName: "Wedding Details", venueAddress: "Wedding Details", receptionVenueName: "Wedding Details", receptionVenueAddress: "Wedding Details", oneVenueOnly: "Wedding Details", heroMessage: "Wedding Details", heroClosingSentiment: "Wedding Details", eventDetailsHeading: "Wedding Details", eventDetailsMessage: "Wedding Details",
  weddingProgram: "Wedding Program",
  storyTimeline: "Story Timeline",
  venueLayout: "Table Map",
  budgetData: "Budget",
  checklistData: "Checklist",
  musicEnabled: "Settings", musicTrack: "Settings", musicVolume: "Settings", rsvpEnabled: "Settings", rsvpDeadline: "Settings", rsvpAllowPlusOne: "Settings", rsvpAskPlusOneName: "Settings", rsvpAllowKids: "Settings", rsvpAskMealPreference: "Settings", rsvpMealOptions: "Settings", rsvpCustomQuestions: "Settings", rsvpCollectPhone: "Settings", rsvpCollectAddress: "Settings", rsvpShowGuestCount: "Settings", rsvpButtonText: "Settings", rsvpSubmitMessage: "Settings", rsvpClosedMessage: "Settings",
};

const TOOLS_NAV_TABS: { id: ToolsNavTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "/assets/ico-dash.png" },
  { id: "list", label: "List", icon: "/assets/ico-guest.png" },
  { id: "website", label: "Website", icon: "/assets/ico-mail.png" },
  { id: "settings", label: "Settings", icon: "/assets/ico-settings.png" },
];

export default function ToolsTab({ data, slug, invitationId, onChange, isDarkMode = true, accentColor = "#6998EE", onOpenEditor, onSettingsChange, onSave, hideInstructions, showScreenDimensions, isPreviewDetached = false, isDemoMode = false, accountInfo, isExpired = false }: ToolsTabProps) {
  const [showEntourageEditor, setShowEntourageEditor] = useState(false);
  const [showGuestEditor, setShowGuestEditor] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [showChecklistEditor, setShowChecklistEditor] = useState(false);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  // Track which container to expand when opening Budget/Checklist editor from
  // a reminder tap. Local UI state only — never persisted.
  const [budgetExpandedContainerId, setBudgetExpandedContainerId] = useState<string | null>(null);
  const [checklistExpandedContainerId, setChecklistExpandedContainerId] = useState<string | null>(null);
  const [showTableMapEditor, setShowTableMapEditor] = useState(false);
  const [showWeddingProgramEditor, setShowWeddingProgramEditor] = useState(false);
  const [showStoryTimelineEditor, setShowStoryTimelineEditor] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<ToolsNavTab>("dashboard");

  // Guard onChange when expired — user can still interact with controls
  // but changes won't propagate or save
  const guardedOnChange = useCallback(
    (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
      if (isExpired) return;
      console.log("[ToolsTab] guardedOnChange called:", field, "userChangeOccurred was:", userChangeOccurred.current);
      userChangeOccurred.current = true;
      const section = FIELD_TO_SECTION[field as string];
      if (section) userChangedSections.current.add(section);
      onChange(field, value);
    },
    [isExpired, onChange]
  );
  const [showNumbers, setShowNumbers] = useState(() => {
    try {
      return localStorage.getItem('websiteProgressMode') === 'numbers';
    } catch { return false; }
  });

  const togglePreviewDetached = () => {
    const next = !isPreviewDetached;
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideInstructions, showScreenDimensions, isPreviewDetached: next });
    }
  };

  // Progress calculations
  const weddingDetailsProgress = useMemo(() => {
    return getWeddingDetailsProgress(data);
  }, [data]);

  const mediaProgress = useMemo(() => {
    return getMediaOverallProgress(data);
  }, [data]);

  const websiteGaugeSegments = useMemo(() => {
    const sections = data.sections || {};
    const allSegments = [
      { label: "Wedding Details", percentage: weddingDetailsProgress, weight: getWeddingDetailsWeight(data), color: "#F59E30", onClick: () => handleEventDetailsClick(), excluded: false, ...getWeddingDetailsProgressData(data) },
      { label: "Media Files", percentage: mediaProgress, weight: getMediaWeight(), color: "#A15BA2", onClick: () => handleMediaClick(), excluded: false, ...getMediaProgressData(data) },
      { label: "Entourage List", percentage: getEntourageProgress(data), weight: getEntourageWeight(data), color: "#EE5348", onClick: () => handleEntourageListClick(), excluded: sections.entourage === false, ...getEntourageProgressData(data) },
      { label: "Event Program", percentage: getWeddingProgramProgress(data), weight: getWeddingProgramWeight(), color: "#3ABD98", onClick: () => handleWeddingProgramClick(), excluded: sections.eventdetails === false, ...getWeddingProgramProgressData(data) },
      { label: "Story Timeline", percentage: getStoryTimelineProgress(data), weight: getStoryTimelineWeight(), color: "#3697D4", onClick: () => handleStoryTimelineClick(), excluded: sections.timeline === false, ...getStoryTimelineProgressData(data) },
    ];
    return allSegments.filter(s => !s.excluded);
  }, [data, weddingDetailsProgress, mediaProgress, data.entourage, data.storyTimeline, data.weddingProgram, data.sections]);

  const websiteOverallProgress = useMemo(() => {
    return getWeightedProgress(websiteGaugeSegments);
  }, [websiteGaugeSegments]);

  const entourageProgress = useMemo(() => {
    if (!data.entourage) return { percentage: 0, filled: 0, total: 0 };
    const guests = getEntourageGuestNames(data.entourage);
    const filled = guests.filter(g => g.name.trim()).length;
    const total = guests.length;
    if (total === 0) return { percentage: 0, filled: 0, total: 0 };
    return { percentage: Math.round((filled / total) * 100), filled, total };
  }, [data.entourage]);

  const guestProgress = useMemo(() => {
    const invitees = (data.rsvpInvitees || []).filter(i => {
      const name = typeof i === 'string' ? i : i.name;
      return name && name.trim();
    });
    // Apply the same exclusion rules as the Guest Editor:
    //  - include special guests (couple + parents)
    //  - exclude entourage roles the user opted out of (Flower Girls, Ring Bearers, Bible Bearer)
    const specialGuests = getSpecialGuestNames(data);
    const exclude = data.rsvpExcludeFromCount || {};
    const excludedRoles = new Set<string>();
    if (exclude.flowerGirls) excludedRoles.add("flowerGirls");
    if (exclude.ringBearer) excludedRoles.add("ringBearer");
    if (exclude.bibleBearer) excludedRoles.add("bibleBearer");
    const entourageGuests = getEntourageGuestNames(data.entourage).filter(g => !g.role || !excludedRoles.has(g.role));
    const currentCount = invitees.length + specialGuests.length + entourageGuests.length;
    const target = data.targetGuestCount || 0;
    if (target === 0) return { percentage: 0, current: currentCount, target: 0 };
    return { percentage: Math.min(100, Math.round((currentCount / target) * 100)), current: currentCount, target };
  }, [data.rsvpInvitees, data.targetGuestCount, data.entourage, data.rsvpExcludeFromCount]);

  // Helper: get checklist containers from data prop with localStorage fallback
  const getChecklistContainers = useCallback((): any[] => {
    if (data.checklistData && data.checklistData.length > 0) return data.checklistData;
    try {
      const stored = localStorage.getItem('weddingChecklist');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }, [data.checklistData]);

  // Helper: get budget containers from data prop with localStorage fallback
  const getBudgetContainers = useCallback((): any[] => {
    if (data.budgetData && data.budgetData.length > 0) return data.budgetData;
    try {
      const stored = localStorage.getItem('weddingBudget');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }, [data.budgetData]);

  const checklistProgress = useMemo(() => {
    const containers = getChecklistContainers();
    const allItems = containers.flatMap((c: any) => c.items || []);
    if (allItems.length === 0) return { percentage: 0, completed: 0, total: 0 };
    const checked = allItems.filter((item: any) => item.checked).length;
    return { percentage: Math.round((checked / allItems.length) * 100), completed: checked, total: allItems.length };
  }, [getChecklistContainers]);

  const budgetProgress = useMemo(() => {
    const containers = getBudgetContainers();
    const allItems = containers.flatMap((c: any) => c.items || []);
    const totalBudget = allItems.reduce((sum: number, item: any) => sum + (parseFloat(item.cost) || parseFloat(item.budget) || 0), 0);
    const totalPaid = allItems.reduce((sum: number, item: any) => sum + (parseFloat(item.paid) || 0), 0);
    if (totalBudget === 0) return { percentage: 0, paid: 0, budget: 0 };
    return { percentage: Math.round((totalPaid / totalBudget) * 100), paid: totalPaid, budget: totalBudget };
  }, [getBudgetContainers]);

  // Reminder items: checklist + budget items with deadlines within 1 month, not checked/paid
  interface ReminderItem {
    id: string;
    name: string;
    type: "checklist" | "budget";
    containerId: string;
    containerTitle: string;
    deadline: string;
    daysLeft: number;
  }

  const reminderItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const items: ReminderItem[] = [];

    // Checklist items
    const checklistContainers = getChecklistContainers();
    for (const c of checklistContainers) {
      for (const item of (c.items || [])) {
        if (item.checked || !item.deadline) continue;
        const d = new Date(item.deadline);
        d.setHours(0, 0, 0, 0);
        if (d > oneMonthLater) continue;
        const diffMs = d.getTime() - now.getTime();
        const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
        items.push({
          id: item.id,
          name: item.name,
          type: "checklist",
          containerId: c.id,
          containerTitle: c.title,
          deadline: item.deadline,
          daysLeft,
        });
      }
    }

    // Budget items
    const budgetContainers = getBudgetContainers();
    for (const c of budgetContainers) {
      for (const item of (c.items || [])) {
        const cost = parseFloat(item.cost) || parseFloat(item.budget) || 0;
        const paid = parseFloat(item.paid) || 0;
        if (cost > 0 && paid >= cost) continue; // fully paid
        if (!item.due) continue;
        const d = new Date(item.due);
        d.setHours(0, 0, 0, 0);
        if (d > oneMonthLater) continue;
        const diffMs = d.getTime() - now.getTime();
        const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
        items.push({
          id: item.id,
          name: item.name || c.title,
          type: "budget",
          containerId: c.id,
          containerTitle: c.title,
          deadline: item.due,
          daysLeft,
        });
      }
    }

    // Sort by daysLeft ascending (most overdue first)
    items.sort((a, b) => a.daysLeft - b.daysLeft);

    // Show up to 4 items, max 2 per type
    const checklistItems = items.filter(i => i.type === "checklist");
    const budgetItems = items.filter(i => i.type === "budget");
    const result: ReminderItem[] = [];

    // Fill up to 2 from each, then top up from the other
    const clTake = Math.min(2, checklistItems.length);
    const blTake = Math.min(2, budgetItems.length);
    let clAdded = 0, blAdded = 0;

    // First pass: take up to 2 from each
    for (const item of checklistItems) {
      if (clAdded >= clTake || result.length >= 4) break;
      result.push(item); clAdded++;
    }
    for (const item of budgetItems) {
      if (blAdded >= blTake || result.length >= 4) break;
      result.push(item); blAdded++;
    }

    // Second pass: top up from whichever has more
    if (result.length < 4) {
      for (const item of checklistItems) {
        if (result.length >= 4) break;
        if (result.find(r => r.id === item.id)) continue;
        result.push(item);
      }
      for (const item of budgetItems) {
        if (result.length >= 4) break;
        if (result.find(r => r.id === item.id)) continue;
        result.push(item);
      }
    }

    // Re-sort the final 4 by daysLeft
    result.sort((a, b) => a.daysLeft - b.daysLeft);
    return result;
  }, [getChecklistContainers, getBudgetContainers]);

  const allReminderItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const items: ReminderItem[] = [];

    const checklistContainers = getChecklistContainers();
    for (const c of checklistContainers) {
      for (const item of (c.items || [])) {
        if (item.checked || !item.deadline) continue;
        const d = new Date(item.deadline);
        d.setHours(0, 0, 0, 0);
        if (d > oneMonthLater) continue;
        const diffMs = d.getTime() - now.getTime();
        const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
        items.push({ id: item.id, name: item.name, type: "checklist", containerId: c.id, containerTitle: c.title, deadline: item.deadline, daysLeft });
      }
    }

    const budgetContainers = getBudgetContainers();
    for (const c of budgetContainers) {
      for (const item of (c.items || [])) {
        const cost = parseFloat(item.cost) || parseFloat(item.budget) || 0;
        const paid = parseFloat(item.paid) || 0;
        if (cost > 0 && paid >= cost) continue;
        if (!item.due) continue;
        const d = new Date(item.due);
        d.setHours(0, 0, 0, 0);
        if (d > oneMonthLater) continue;
        const diffMs = d.getTime() - now.getTime();
        const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
        items.push({ id: item.id, name: item.name || c.title, type: "budget", containerId: c.id, containerTitle: c.title, deadline: item.due, daysLeft });
      }
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    return items;
  }, [getChecklistContainers, getBudgetContainers]);

  // Back gesture closes sub-views instead of minimizing app
  useBackHandler(showEntourageEditor, () => setShowEntourageEditor(false));
  useBackHandler(showGuestEditor, () => setShowGuestEditor(false));
  useBackHandler(showMediaEditor, () => setShowMediaEditor(false));
  useBackHandler(showChecklistEditor, () => setShowChecklistEditor(false));
  useBackHandler(showBudgetEditor, () => setShowBudgetEditor(false));
  useBackHandler(showTableMapEditor, () => setShowTableMapEditor(false));
  useBackHandler(showWeddingProgramEditor, () => setShowWeddingProgramEditor(false));
  useBackHandler(showStoryTimelineEditor, () => setShowStoryTimelineEditor(false));
  useBackHandler(showEventDetails, () => setShowEventDetails(false));
  useBackHandler(showAllReminders, () => setShowAllReminders(false));

  // Snapshot of data for change detection at tools level
  const dataSnapshot = useRef(JSON.stringify(data));
  // State version to force recompute of changedSections after save updates the ref
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  // Track whether any user-initiated change has occurred (vs automatic media
  // cache resolution on native, which swaps remote URLs for local URIs and
  // would otherwise falsely trigger the save bubble on every dashboard load)
  const userChangeOccurred = useRef(false);
  // Track which specific sections the user has actually modified. This
  // prevents async media cache resolution from falsely adding "Media" to
  // changedSections after the user modifies a different section (e.g. Budget).
  const userChangedSections = useRef<Set<string>>(new Set());

  // Synchronously sync snapshot to latest data when no user change has
  // occurred. This eliminates the one-render-cycle window where
  // changedSections would be non-empty (because the data effect hasn't
  // run yet) which could falsely trigger the save bubble on native when
  // useMediaCache resolves URLs.
  if (!userChangeOccurred.current && dataSnapshot.current !== JSON.stringify(data)) {
    console.log("[ToolsTab] sync snapshot update (no user change), data length:", JSON.stringify(data).length, "old snapshot length:", dataSnapshot.current.length);
    dataSnapshot.current = JSON.stringify(data);
  }

  // Detect which sections have changed by comparing current data against snapshot.
  // Only sections the user has *actually* modified (tracked via
  // userChangedSections) are reported. This prevents async media cache
  // resolution from falsely adding "Media" to changedSections after the user
  // modifies a different section (e.g. Budget).
  const changedSections = useMemo(() => {
    // Include snapshotVersion in deps so memo recomputes after save
    void snapshotVersion;
    if (!userChangeOccurred.current) return [];
    const snapshot = JSON.parse(dataSnapshot.current);
    const sections: string[] = [];
    const userSections = userChangedSections.current;

    // Entourage
    if (userSections.has("Entourage") && JSON.stringify(data.entourage) !== JSON.stringify(snapshot.entourage)) sections.push("Entourage");
    // Guest List
    if (userSections.has("Guest List") && (
        JSON.stringify(data.rsvpInvitees) !== JSON.stringify(snapshot.rsvpInvitees) ||
        JSON.stringify(data.rsvpEntourageHonorifics) !== JSON.stringify(snapshot.rsvpEntourageHonorifics) ||
        JSON.stringify(data.rsvpEntourageGuestDetails) !== JSON.stringify(snapshot.rsvpEntourageGuestDetails) ||
        JSON.stringify(data.rsvpGuestDetails) !== JSON.stringify(snapshot.rsvpGuestDetails) ||
        JSON.stringify(data.rsvpExcludeFromCount) !== JSON.stringify(snapshot.rsvpExcludeFromCount))) sections.push("Guest List");
    // Media
    if (userSections.has("Media") && (
        data.heroIcon !== snapshot.heroIcon ||
        JSON.stringify(data.heroBackgroundImages) !== JSON.stringify(snapshot.heroBackgroundImages) ||
        JSON.stringify(data.heroBackgroundImagesMobile) !== JSON.stringify(snapshot.heroBackgroundImagesMobile) ||
        JSON.stringify(data.galleryImages) !== JSON.stringify(snapshot.galleryImages) ||
        JSON.stringify(data.photosAndImages) !== JSON.stringify(snapshot.photosAndImages) ||
        JSON.stringify(data.venueImages) !== JSON.stringify(snapshot.venueImages) ||
        JSON.stringify(data.receptionVenueImages) !== JSON.stringify(snapshot.receptionVenueImages) ||
        data.customHeadingFont !== snapshot.customHeadingFont ||
        data.customBodyFont !== snapshot.customBodyFont ||
        JSON.stringify(data.backgroundMusic) !== JSON.stringify(snapshot.backgroundMusic) ||
        JSON.stringify(data.backgroundMusicFileNames) !== JSON.stringify(snapshot.backgroundMusicFileNames))) sections.push("Media");
    // Wedding Details
    if (userSections.has("Wedding Details")) {
      const weddingDetailsFields = ['hisName', 'herName', 'andText', 'coupleName', 'nameType', 'date', 'time', 'timezone', 'venueName', 'venueAddress', 'receptionVenueName', 'receptionVenueAddress', 'oneVenueOnly', 'heroMessage', 'heroClosingSentiment', 'eventDetailsHeading', 'eventDetailsMessage'] as const;
      if (weddingDetailsFields.some(f => JSON.stringify((data as any)[f]) !== JSON.stringify((snapshot as any)[f]))) sections.push("Wedding Details");
    }
    // Wedding Program
    if (userSections.has("Wedding Program") && JSON.stringify(data.weddingProgram) !== JSON.stringify(snapshot.weddingProgram)) sections.push("Wedding Program");
    // Story Timeline
    if (userSections.has("Story Timeline") && JSON.stringify(data.storyTimeline) !== JSON.stringify(snapshot.storyTimeline)) sections.push("Story Timeline");
    // Table Map
    if (userSections.has("Table Map") && JSON.stringify(data.venueLayout) !== JSON.stringify(snapshot.venueLayout)) sections.push("Table Map");
    // Budget
    if (userSections.has("Budget") && JSON.stringify(data.budgetData) !== JSON.stringify(snapshot.budgetData)) sections.push("Budget");
    // Checklist
    if (userSections.has("Checklist") && JSON.stringify(data.checklistData) !== JSON.stringify(snapshot.checklistData)) sections.push("Checklist");
    // Settings (exclude isDarkMode/accentColor which are app settings, not invitation data)
    if (userSections.has("Settings")) {
      const settingsFields = ['musicEnabled', 'musicTrack', 'musicVolume', 'rsvpEnabled', 'rsvpDeadline', 'rsvpAllowPlusOne', 'rsvpAskPlusOneName', 'rsvpAllowKids', 'rsvpAskMealPreference', 'rsvpMealOptions', 'rsvpCustomQuestions', 'rsvpCollectPhone', 'rsvpCollectAddress', 'rsvpShowGuestCount', 'rsvpButtonText', 'rsvpSubmitMessage', 'rsvpClosedMessage'];
      if (settingsFields.some(f => JSON.stringify((data as any)[f]) !== JSON.stringify((snapshot as any)[f]))) sections.push("Settings");
    }

    return sections;
  }, [data, snapshotVersion]);

  const hasUnsavedChanges = changedSections.length > 0 && userChangeOccurred.current;
  if (hasUnsavedChanges) {
    console.log("[ToolsTab] hasUnsavedChanges: TRUE", "changedSections:", changedSections, "userChangeOccurred:", userChangeOccurred.current);
  }
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Reset change tracking when a different invitation is loaded (e.g. after
  // login). Without this, userChangeOccurred could stay true from a prior
  // session or demo mode, causing a false save bubble on the new invitation.
  useEffect(() => {
    console.log("[ToolsTab] invitationId effect running, invitationId:", invitationId, "resetting userChangeOccurred to false");
    userChangeOccurred.current = false;
    userChangedSections.current.clear();
    dataSnapshot.current = JSON.stringify(data);
    setSnapshotVersion(v => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  // On native, media cache resolution swaps remote URLs for local URIs after
  // the initial render. This automatic transformation would falsely trigger
  // the save bubble. Silently update the snapshot when no user change has
  // occurred so the baseline matches the resolved data.
  useEffect(() => {
    if (!userChangeOccurred.current && dataSnapshot.current !== JSON.stringify(data)) {
      console.log("[ToolsTab] data effect: updating snapshot (no user change), data length:", JSON.stringify(data).length);
      dataSnapshot.current = JSON.stringify(data);
      setSnapshotVersion(v => v + 1);
    }
  }, [data]);

  // Handle tools-level save
  const handleToolsSave = async () => {
    if (isExpired) return;
    if (onSave) {
      await onSave(data);
      dataSnapshot.current = JSON.stringify(data);
      setSnapshotVersion(v => v + 1);
      userChangeOccurred.current = false;
      userChangedSections.current.clear();
    }
  };

  // Handle discard - revert all changes back to the saved snapshot
  const handleToolsDiscard = () => {
    clearPendingMediaOperations();
    const snapshot = JSON.parse(dataSnapshot.current);
    // Revert each field that has changed
    if (JSON.stringify(data.entourage) !== JSON.stringify(snapshot.entourage)) {
      onChange("entourage" as keyof InvitationData, snapshot.entourage);
    }
    if (JSON.stringify(data.rsvpInvitees) !== JSON.stringify(snapshot.rsvpInvitees)) {
      onChange("rsvpInvitees" as keyof InvitationData, snapshot.rsvpInvitees);
    }
    if (JSON.stringify(data.rsvpEntourageHonorifics) !== JSON.stringify(snapshot.rsvpEntourageHonorifics)) {
      onChange("rsvpEntourageHonorifics" as keyof InvitationData, snapshot.rsvpEntourageHonorifics);
    }
    if (JSON.stringify(data.rsvpEntourageGuestDetails) !== JSON.stringify(snapshot.rsvpEntourageGuestDetails)) {
      onChange("rsvpEntourageGuestDetails" as keyof InvitationData, snapshot.rsvpEntourageGuestDetails);
    }
    if (JSON.stringify(data.rsvpGuestDetails) !== JSON.stringify(snapshot.rsvpGuestDetails)) {
      onChange("rsvpGuestDetails" as keyof InvitationData, snapshot.rsvpGuestDetails);
    }
    if (JSON.stringify(data.rsvpExcludeFromCount) !== JSON.stringify(snapshot.rsvpExcludeFromCount)) {
      onChange("rsvpExcludeFromCount" as keyof InvitationData, snapshot.rsvpExcludeFromCount);
    }
    if (data.heroIcon !== snapshot.heroIcon) {
      onChange("heroIcon" as keyof InvitationData, snapshot.heroIcon);
    }
    if (JSON.stringify(data.heroBackgroundImages) !== JSON.stringify(snapshot.heroBackgroundImages)) {
      onChange("heroBackgroundImages" as keyof InvitationData, snapshot.heroBackgroundImages);
    }
    if (JSON.stringify(data.heroBackgroundImagesMobile) !== JSON.stringify(snapshot.heroBackgroundImagesMobile)) {
      onChange("heroBackgroundImagesMobile" as keyof InvitationData, snapshot.heroBackgroundImagesMobile);
    }
    if (JSON.stringify(data.galleryImages) !== JSON.stringify(snapshot.galleryImages)) {
      onChange("galleryImages" as keyof InvitationData, snapshot.galleryImages);
    }
    if (JSON.stringify(data.photosAndImages) !== JSON.stringify(snapshot.photosAndImages)) {
      onChange("photosAndImages" as keyof InvitationData, snapshot.photosAndImages);
    }
    if (JSON.stringify(data.venueImages) !== JSON.stringify(snapshot.venueImages)) {
      onChange("venueImages" as keyof InvitationData, snapshot.venueImages);
    }
    if (JSON.stringify(data.receptionVenueImages) !== JSON.stringify(snapshot.receptionVenueImages)) {
      onChange("receptionVenueImages" as keyof InvitationData, snapshot.receptionVenueImages);
    }
    if (data.customHeadingFont !== snapshot.customHeadingFont) {
      onChange("customHeadingFont" as keyof InvitationData, snapshot.customHeadingFont);
    }
    if (data.customBodyFont !== snapshot.customBodyFont) {
      onChange("customBodyFont" as keyof InvitationData, snapshot.customBodyFont);
    }
    if (JSON.stringify(data.backgroundMusic) !== JSON.stringify(snapshot.backgroundMusic)) {
      onChange("backgroundMusic" as keyof InvitationData, snapshot.backgroundMusic);
    }
    if (JSON.stringify(data.backgroundMusicFileNames) !== JSON.stringify(snapshot.backgroundMusicFileNames)) {
      onChange("backgroundMusicFileNames" as keyof InvitationData, snapshot.backgroundMusicFileNames);
    }
    if (JSON.stringify(data.weddingProgram) !== JSON.stringify(snapshot.weddingProgram)) {
      onChange("weddingProgram" as keyof InvitationData, snapshot.weddingProgram);
    }
    if (JSON.stringify(data.storyTimeline) !== JSON.stringify(snapshot.storyTimeline)) {
      onChange("storyTimeline" as keyof InvitationData, snapshot.storyTimeline);
    }
    if (JSON.stringify(data.venueLayout) !== JSON.stringify(snapshot.venueLayout)) {
      onChange("venueLayout" as keyof InvitationData, snapshot.venueLayout);
    }
    // Wedding Details fields
    const weddingDetailsFields = ['hisName', 'herName', 'andText', 'coupleName', 'nameType', 'date', 'time', 'timezone', 'venueName', 'venueAddress', 'receptionVenueName', 'receptionVenueAddress', 'oneVenueOnly', 'heroMessage', 'heroClosingSentiment', 'eventDetailsHeading', 'eventDetailsMessage'] as const;
    weddingDetailsFields.forEach(f => {
      if (JSON.stringify((data as any)[f]) !== JSON.stringify((snapshot as any)[f])) {
        onChange(f as keyof InvitationData, (snapshot as any)[f]);
      }
    });
    // Settings fields
    const settingsFields = ['musicEnabled', 'musicTrack', 'musicVolume', 'rsvpEnabled', 'rsvpDeadline', 'rsvpAllowPlusOne', 'rsvpAskPlusOneName', 'rsvpAllowKids', 'rsvpAskMealPreference', 'rsvpMealOptions', 'rsvpCustomQuestions', 'rsvpCollectPhone', 'rsvpCollectAddress', 'rsvpShowGuestCount', 'rsvpButtonText', 'rsvpSubmitMessage', 'rsvpClosedMessage'] as const;
    settingsFields.forEach(f => {
      if (JSON.stringify((data as any)[f]) !== JSON.stringify((snapshot as any)[f])) {
        onChange(f as keyof InvitationData, (snapshot as any)[f]);
      }
    });
    userChangeOccurred.current = false;
    userChangedSections.current.clear();
  };

  // Handle save bubble click - show confirmation dialog
  const handleSaveBubbleClick = () => {
    setShowSaveConfirmation(true);
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate time remaining for countdown
  const getTimeLeft = () => {
    if (!data.date) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const weddingDate = new Date(data.date);
    const now = new Date();
    const diff = weddingDate.getTime() - now.getTime();
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  // Parse date components for date display
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

  // Deadline comment for reminder items
  const getDeadlineComment = (daysLeft: number): string => {
    if (daysLeft === 0) return "Due today — act now!";
    if (daysLeft > 0) return `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
    return `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`;
  };

  // Format deadline date for display (M/D/YY)
  const formatReminderDate = (deadline: string): string => {
    if (!deadline) return "";
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return "";
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(2)}`;
  };

  // Handle reminder item tap - open checklist or budget editor
  const handleReminderTap = (item: ReminderItem) => {
    setShowAllReminders(false);
    setHighlightItemId(item.id);
    if (item.type === "checklist") {
      setChecklistExpandedContainerId(item.containerId);
      setShowChecklistEditor(true);
    } else {
      setBudgetExpandedContainerId(item.containerId);
      setShowBudgetEditor(true);
    }
  };

  const getOrdinalSuffix = (n: string) => {
    const num = parseInt(n);
    if (num > 3 && num < 21) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const dateComponents = parseDateComponents(data.date);

  // Check if celebrant names are missing
  const hasCelebrantNames = data.nameType === "couple" 
    ? (data.hisName && data.hisName.trim() !== "") || (data.herName && data.herName.trim() !== "")
    : (data.coupleName && data.coupleName.trim() !== "");

  // Determine if countdown should be shown
  // Show countdown if names are available (even if countdown section is disabled)
  const showCountdown = hasCelebrantNames && data.date;

  // Update countdown every second
  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [data.date]);

  const handleEntourageListClick = () => {
    setShowEntourageEditor(true);
  };

  const handleGuestListClick = () => {
    setShowGuestEditor(true);
  };

  const handleMediaClick = () => {
    setShowMediaEditor(true);
  };

  const handleWeddingWebsiteClick = () => {
    if (onOpenEditor) {
      onOpenEditor();
    }
  };

  const handleChecklistClick = () => {
    setShowChecklistEditor(true);
  };

  const handleBudgetClick = () => {
    setShowBudgetEditor(true);
  };

  const handleTableMapClick = () => {
    setShowTableMapEditor(true);
  };

  const handleWeddingProgramClick = () => {
    setShowWeddingProgramEditor(true);
  };

  const handleStoryTimelineClick = () => {
    setShowStoryTimelineEditor(true);
  };

  const handleEventDetailsClick = () => {
    setShowEventDetails(true);
  };

  if (showEventDetails) {
    return (
      <div className={`w-full ${isDemoMode ? "h-full" : "h-dvh"} rounded-2xl flex flex-col overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <button
            onClick={() => setShowEventDetails(false)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
              Wedding Details
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Fill in the important wedding information
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
          <EventDetailsTab data={data} onChange={guardedOnChange} isDarkMode={isDarkMode} accentColor={accentColor} />
        </div>
      </div>
    );
  }

  if (showEntourageEditor) {
    return (
      <EntourageEditor
        data={data}
        onChange={guardedOnChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowEntourageEditor(false)}
        onSave={onSave}
      />
    );
  }

  if (showGuestEditor) {
    return (
      <GuestEditor
        data={data}
        invitationId={invitationId}
        onChange={guardedOnChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowGuestEditor(false)}
        onSave={onSave}
      />
    );
  }

  if (showMediaEditor) {
    return (
      <MediaEditor
        data={data}
        onChange={guardedOnChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowMediaEditor(false)}
        invitationId={invitationId}
        onSave={onSave}
        isDemoMode={isDemoMode}
        showNumbers={showNumbers}
      />
    );
  }

  if (showAllReminders) {
    const checklistReminders = allReminderItems.filter(i => i.type === "checklist");
    const budgetReminders = allReminderItems.filter(i => i.type === "budget");
    return (
      <div className={`w-full h-dvh rounded-2xl flex flex-col overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        {/* Header */}
        <div className={`flex items-center gap-3 p-4 shrink-0 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <button
            onClick={() => setShowAllReminders(false)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
            All Reminders
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ fontFamily: "Inter, sans-serif" }}>
          {allReminderItems.length === 0 ? (
            <p className={`text-sm text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              No reminders
            </p>
          ) : (
            <>
              {/* CHECKLIST section */}
              {checklistReminders.length > 0 && (
                <div>
                  <h3 className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Checklist
                  </h3>
                  <div className="space-y-2">
                    {checklistReminders.map((item) => (
                      <div
                        key={`cl-${item.id}`}
                        onClick={() => handleReminderTap(item)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors"
                        style={{ backgroundColor: isDarkMode ? "#253143" : "white" }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: hexToRgba(accentColor, 0.15) }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                            {item.name}
                          </p>
                          <p className={`text-xs ${item.daysLeft < 0 ? "text-red-500" : item.daysLeft === 0 ? "text-orange-500" : isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {getDeadlineComment(item.daysLeft)} • {formatReminderDate(item.deadline)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BUDGETLIST section */}
              {budgetReminders.length > 0 && (
                <div>
                  <h3 className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Budget List
                  </h3>
                  <div className="space-y-2">
                    {budgetReminders.map((item) => (
                      <div
                        key={`bl-${item.id}`}
                        onClick={() => handleReminderTap(item)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors"
                        style={{ backgroundColor: isDarkMode ? "#253143" : "white" }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: hexToRgba("#F59E0B", 0.15) }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                            {item.name}
                          </p>
                          <p className={`text-xs ${item.daysLeft < 0 ? "text-red-500" : item.daysLeft === 0 ? "text-orange-500" : isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {getDeadlineComment(item.daysLeft)} • {formatReminderDate(item.deadline)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="h-8"></div>
        </div>
      </div>
    );
  }

  if (showChecklistEditor) {
    return (
      <ChecklistEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        showNumbers={showNumbers}
        highlightItemId={highlightItemId}
        initialExpandedContainerId={checklistExpandedContainerId}
        initialData={data.checklistData}
        onChange={(newData) => guardedOnChange('checklistData', newData)}
        onClose={() => { setShowChecklistEditor(false); setHighlightItemId(null); setChecklistExpandedContainerId(null); }}
      />
    );
  }

  if (showBudgetEditor) {
    return (
      <BudgetEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        showNumbers={showNumbers}
        highlightItemId={highlightItemId}
        initialExpandedContainerId={budgetExpandedContainerId}
        initialData={data.budgetData}
        onChange={(newData) => guardedOnChange('budgetData', newData)}
        onClose={() => { setShowBudgetEditor(false); setHighlightItemId(null); setBudgetExpandedContainerId(null); }}
      />
    );
  }

  if (showTableMapEditor) {
    return (
      <TableMapEditor
        data={data}
        onChange={guardedOnChange}
        onImmediateSave={onSave}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowTableMapEditor(false)}
      />
    );
  }

  if (showWeddingProgramEditor) {
    return (
      <WeddingProgramEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowWeddingProgramEditor(false)}
        data={data}
        onChange={guardedOnChange}
        onSave={onSave}
      />
    );
  }

  if (showStoryTimelineEditor) {
    return (
      <StoryTimelineEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowStoryTimelineEditor(false)}
        galleryImages={data.photosAndImages || []}
        data={data}
        onChange={guardedOnChange}
        onSave={onSave}
      />
    );
  }

  return (
    <div className={`flex flex-col ${isDemoMode ? "h-full" : "h-dvh"} lg:h-full overflow-hidden`}>
      {/* Save bubble - shows when there are unsaved changes at tools level (hidden when expired) */}
      {hasUnsavedChanges && !isExpired && (
        <button
          onClick={handleSaveBubbleClick}
          aria-label={`Save ${changedSections.length} unsaved change${changedSections.length === 1 ? "" : "s"}`}
          title={`Save changes (${changedSections.join(", ")})`}
          className="fixed top-4 right-4 z-[70] no-print p-4 rounded-full shadow-lg transition-opacity backdrop-blur-sm"
          style={{ backgroundColor: accentColor }}
        >
          <div className="relative">
            <img
              src="/assets/ico-sav.png"
              alt="Save"
              className="w-7 h-7"
            />
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-white/80 border"
              style={{ color: accentColor, borderColor: accentColor, fontFamily: "Inter, sans-serif" }}
            >
              {changedSections.length}
            </span>
          </div>
        </button>
      )}

      {/* Custom Hero Preview - fixed, no scroll - only on dashboard */}
      {activeNavTab === "dashboard" && (
      <div className={`relative h-[22vh] overflow-hidden w-full shrink-0 ${isPreviewDetached ? "p-4" : ""}`}>
        <div className={`relative h-full overflow-hidden w-full ${isPreviewDetached ? "rounded-2xl" : ""}`}>
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: data.mainColor1,
            backgroundImage: (() => {
              const imagesToUse = isMobile ? data.heroBackgroundImagesMobile : data.heroBackgroundImages;
              // Find the last non-empty image in the array
              if (imagesToUse && imagesToUse.length > 0) {
                const lastImage = [...imagesToUse].reverse().find(img => img && img.trim() !== '');
                if (lastImage) {
                  return `url(${lastImage})`;
                }
              }
              return undefined;
            })(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundColor: data.mainColor1
              ? `${data.mainColor1}${Math.round((data.heroOverlayOpacity1 ?? 0.5) * 255).toString(16).padStart(2, '0')}`
              : undefined 
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-0 px-4" style={{ transform: 'scale(0.51)', transformOrigin: 'center' }}>
          {/* Couple Name */}
          {hasCelebrantNames ? (
            <h1 
              className="text-3xl md:text-5xl lg:text-6xl leading-tight text-center mb-8"
              style={{
                fontFamily: getFontFamily(data.heroDisplayNameTypography || data.headingFont, "heading"),
                color: data.heroIconTextColor || "white",
                whiteSpace: data.heroAmpersandPosition === "default" ? "nowrap" : "pre-line",
                textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
              }}
              dangerouslySetInnerHTML={{
                __html: (() => {
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
          ) : (
            <div className="text-center flex flex-col items-center gap-0">
              <div className="flex flex-col items-center gap-0">
                <h1 
                  className="text-4xl md:text-6xl lg:text-7xl leading-none m-0"
                  style={{
                    fontFamily: "Praise, cursive",
                    color: data.heroIconTextColor || "white",
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                  }}
                >
                  Your
                </h1>
                <h1 
                  className="text-4xl md:text-6xl lg:text-7xl leading-none m-0"
                  style={{
                    fontFamily: "Praise, cursive",
                    color: data.heroIconTextColor || "white",
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                  }}
                >
                  All-in-One
                </h1>
                <h1 
                  className="text-4xl md:text-6xl lg:text-7xl leading-none m-0 mb-[-20px]"
                  style={{
                    fontFamily: "Praise, cursive",
                    color: data.heroIconTextColor || "white",
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                  }}
                >
                  Event Planner
                </h1>
              </div>
              <div 
                className="w-48 h-48 md:w-56 md:h-56 m-0 mt-[-20px]"
                style={{
                  backgroundColor: data.heroIconTextColor || "white",
                  WebkitMaskImage: "url(/assets/fsentiment-01.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: "url(/assets/fsentiment-01.png)",
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat",
                }}
              />
            </div>
          )}

          {/* Countdown */}
          {showCountdown && data.date && (
            <div className="flex justify-center gap-2 md:gap-4 mt-8">
              {[
                { value: timeLeft.days, label: "D" },
                { value: timeLeft.hours, label: "H" },
                { value: timeLeft.minutes, label: "M" },
                { value: timeLeft.seconds, label: "S" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center min-w-[40px] md:min-w-[50px]"
                >
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg mb-1"
                    style={{
                      backgroundColor: `${data.countdownCrystalColor || data.mainColor2}20`,
                      border: `1px solid ${data.countdownCrystalColor || data.mainColor2}40`,
                      color: data.countdownCrystalColor || data.mainColor2,
                      fontFamily: data.headingFont,
                    }}
                  >
                    <span className="text-lg md:text-xl font-bold">
                      {String(item.value).padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{
                      color: data.heroIconTextColor || "white",
                      opacity: 0.7,
                      fontFamily: data.bodyFont,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Date Display */}
          {showCountdown && data.countdownShowDate && dateComponents && (
            <div className="mt-4">
              {/* Default Structure - Box Layout */}
              {data.countdownDateStructure !== "alternative" && data.countdownDateStructure !== "icon" && data.countdownDateStructure !== "elegant" && data.countdownDateStructure !== "modern" && (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-sm md:text-base tracking-[0.2em] uppercase font-bold text-center" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.month}
                  </div>
                  <div className="flex items-center gap-0 w-full max-w-[350px]">
                    <div className="flex items-center justify-end shrink-0 w-28">
                      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                      <div className="text-sm tracking-[0.2em] uppercase text-right" style={{ color: data.heroIconTextColor || "white" }}>
                        {dateComponents.day}
                      </div>
                    </div>
                    <div className="flex justify-center shrink-0">
                      <div className="w-5 h-[1px] bg-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                    </div>
                    <div className="flex-1 flex items-center justify-center text-4xl md:text-5xl font-bold tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.date}
                    </div>
                    <div className="flex justify-center shrink-0">
                      <div className="w-5 h-[1px] bg-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                    </div>
                    <div className="flex items-center justify-start shrink-0 w-28">
                      <div className="text-sm tracking-[0.2em] uppercase text-left whitespace-nowrap" style={{ color: data.heroIconTextColor || "white" }}>
                        {data.time || "4:00 PM"}
                      </div>
                      <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                    </div>
                  </div>
                  <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-center" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.year}
                  </div>
                </div>
              )}

              {/* Alternative Structure */}
              {data.countdownDateStructure === "alternative" && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="text-xs md:text-sm tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    On the {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
                  </div>
                  <div className="text-[10px] md:text-xs tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
                  </div>
                </div>
              )}

              {/* Icon Structure */}
              {data.countdownDateStructure === "icon" && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <div
                    className="w-6 h-6"
                    style={{
                      backgroundColor: data.heroIconTextColor || "white",
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
                  <div className="text-xs md:text-sm tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    The {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
                  </div>
                  <div className="text-[10px] md:text-xs tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
                  </div>
                </div>
              )}

              {/* Elegant Structure */}
              {data.countdownDateStructure === "elegant" && (
                <div className="inline-flex items-center text-center p-4">
                  <div className="text-right text-xs md:text-sm tracking-[0.2em] uppercase font-light" style={{ width: '2.5rem', color: data.heroIconTextColor || "white" }}>
                    {dateComponents.month}
                  </div>
                  <div className="text-xs md:text-sm font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-center text-2xl md:text-3xl font-light tracking-[0.1em]" style={{ width: '3rem', color: data.heroIconTextColor || "white" }}>
                    {String(dateComponents.date).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-left text-xs md:text-sm tracking-[0.2em] uppercase font-light" style={{ width: '2.5rem', color: data.heroIconTextColor || "white" }}>
                    {dateComponents.year}
                  </div>
                </div>
              )}

              {/* Modern Structure */}
              {data.countdownDateStructure === "modern" && (
                <div className="inline-flex items-center text-center p-4">
                  <div className="text-right flex flex-col items-end gap-0" style={{ width: '3rem' }}>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.dayFull || dateComponents.day}
                    </div>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {data.time ? data.time.split(' ')[0] : "2:00"}
                    </div>
                  </div>
                  <div className="text-[8px] md:text-[10px] font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-center text-xl md:text-2xl font-light tracking-[0.1em]" style={{ width: '3rem', color: data.heroIconTextColor || "white" }}>
                    {String(dateComponents.date).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] md:text-[10px] font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-left flex flex-col items-start gap-0" style={{ width: '3rem' }}>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.month}
                    </div>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.year}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
      )}

      {/* Progress container - overlaps hero preview slightly - only on dashboard */}
      {activeNavTab === "dashboard" && (
        <div className={`relative z-20 ${isPreviewDetached ? "mt-3 mx-4" : "-mt-6 mx-3"} rounded-2xl p-4 shadow-lg ${isDarkMode ? "bg-[#253143]" : "bg-white"}`}>
          <div className="flex items-center justify-around">
            <ProgressCircle
              percentage={budgetProgress.percentage}
              label="Budget"
              sublabel={budgetProgress.budget > 0 ? budgetProgress.budget.toLocaleString() : "No items"}
              accentColor={accentColor}
              isDarkMode={isDarkMode}
              onClick={() => handleBudgetClick()}
            />
            <ProgressCircle
              percentage={checklistProgress.percentage}
              label="Checklist"
              sublabel={checklistProgress.total > 0 ? `${checklistProgress.completed}/${checklistProgress.total}` : "No tasks"}
              accentColor={accentColor}
              isDarkMode={isDarkMode}
              onClick={() => handleChecklistClick()}
            />
            <ProgressCircle
              percentage={guestProgress.percentage}
              label="Guests"
              sublabel={guestProgress.target > 0 ? `${guestProgress.current}/${guestProgress.target}` : "Set target"}
              accentColor={accentColor}
              isDarkMode={isDarkMode}
              onClick={() => handleGuestListClick()}
            />
          </div>
        </div>
      )}

      <div className="px-4 pb-4 mt-3 flex-1 overflow-y-auto" style={{ paddingTop: 0 }}>
        {/* Reminder section - only on dashboard */}
        {activeNavTab === "dashboard" && reminderItems.length > 0 && (
          <div className="mb-4">
            {/* REMINDER label button + SHOW ALL */}
            <div className="flex items-center justify-between mb-2">
              <button
                className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide transition-colors ${isDarkMode ? "bg-[#1e2a3a] text-gray-400 hover:text-gray-200" : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Reminder
              </button>
              {allReminderItems.length > 4 && (
                <button
                  onClick={() => setShowAllReminders(true)}
                  className="text-[10px] font-medium uppercase tracking-wide transition-colors"
                  style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}
                >
                  Show All
                </button>
              )}
            </div>
            {/* Reminder items */}
            <div className="space-y-1.5">
              {reminderItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleReminderTap(item)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isDarkMode ? "#253143" : "white",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.type === "checklist" ? hexToRgba(accentColor, 0.15) : hexToRgba("#F59E0B", 0.15) }}
                  >
                    {item.type === "checklist" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {item.name}
                    </p>
                    <p className={`text-[10px] ${item.daysLeft < 0 ? "text-red-500" : item.daysLeft === 0 ? "text-orange-500" : isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                      {getDeadlineComment(item.daysLeft)} • {formatReminderDate(item.deadline)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Website progress gauge - segmented by included tiles - only on dashboard */}
        {activeNavTab === "dashboard" && (
          <div className={`relative z-20 mb-4 rounded-2xl p-4 shadow-lg flex flex-col items-center ${isDarkMode ? "bg-[#253143]" : "bg-white"}`}>
            <HalfCircleGauge
              segments={websiteGaugeSegments}
              overallPercentage={websiteOverallProgress}
              accentColor={accentColor}
              isDarkMode={isDarkMode}
              centerLabel="Overall"
              onDesignWebsite={handleWeddingWebsiteClick}
              showNumbers={showNumbers}
              onToggleNumbers={() => {
                const next = !showNumbers;
                setShowNumbers(next);
                try { localStorage.setItem('websiteProgressMode', next ? 'numbers' : 'percentage'); } catch {}
              }}
            />
          </div>
        )}
        {activeNavTab === "list" && (
          <div className="grid grid-cols-2 gap-4">
            <ToolTile
              icon="/assets/ico-entourage.png"
              label="Entourage List"
              onClick={handleEntourageListClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-guest.png"
              label="Guest List"
              onClick={handleGuestListClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-event.png"
              label="Checklist"
              onClick={handleChecklistClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-budget.png"
              label="Budget List"
              onClick={handleBudgetClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
          </div>
        )}

        {activeNavTab === "website" && (
          <div className="grid grid-cols-2 gap-4">
            <ToolTile
              icon="/assets/ico-inf.png"
              label="Wedding Details"
              onClick={handleEventDetailsClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-med.png"
              label="Media Files"
              onClick={handleMediaClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-table.png"
              label="Table Map"
              onClick={handleTableMapClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-event.png"
              label="Event Program"
              onClick={handleWeddingProgramClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
            <ToolTile
              icon="/assets/ico-event.png"
              label="Story Timeline"
              onClick={handleStoryTimelineClick}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
          </div>
        )}

        {activeNavTab === "settings" && (
          <SettingsEditor
            data={data}
            onChange={guardedOnChange}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            onClose={() => setActiveNavTab("dashboard")}
            onSettingsChange={onSettingsChange}
            hideInstructions={hideInstructions}
            showScreenDimensions={showScreenDimensions}
            isPreviewDetached={isPreviewDetached}
            invitationId={invitationId}
            isDemoMode={isDemoMode}
            slug={slug}
            accountInfo={accountInfo}
          />
        )}
      </div>

      {/* Bottom navigation tabs */}
      <nav className={`shrink-0 border-t ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="flex">
          {TOOLS_NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveNavTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition-colors ${
                activeNavTab === tab.id ? "text-[#6998EE]" : (isDarkMode ? "text-gray-400" : "text-gray-400")
              }`}
              style={{ color: activeNavTab === tab.id ? accentColor : undefined }}
            >
              <div className="w-5 h-5" style={{
                backgroundColor: activeNavTab === tab.id ? accentColor : (isDarkMode ? "#9ca3af" : "#9ca3af"),
                WebkitMaskImage: `url(${tab.icon})`,
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url(${tab.icon})`,
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat"
              }} />
              <span className="text-[10px] font-sans">{tab.label}</span>
              {activeNavTab === tab.id && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: accentColor }} />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Save confirmation dialog */}
      <SaveConfirmationDialog
        isOpen={showSaveConfirmation}
        pendingChangesCount={changedSections.length}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onSave={handleToolsSave}
        onDiscard={handleToolsDiscard}
        onClose={() => setShowSaveConfirmation(false)}
      />
    </div>
  );
}
