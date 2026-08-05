import type { InvitationData } from "@/lib/types/invitation";

/**
 * Returns the list of fields (values) that contribute to Wedding Details progress.
 *
 * For couple type: hisName, andText, herName
 * For event type: coupleName
 * Common: date, time, timezone, venueName, venueAddress,
 *          receptionVenueName, receptionVenueAddress,
 *          heroMessage, heroClosingSentiment
 */
function getWeddingDetailsFields(data: InvitationData): (string | undefined)[] {
  const nameType = data.nameType ?? "couple";
  const fields: (string | undefined)[] = [];

  if (nameType === "couple") {
    fields.push(data.hisName, data.andText, data.herName);
  } else {
    fields.push(data.coupleName);
  }

  fields.push(
    data.date,
    data.time,
    data.timezone,
    data.venueName,
    data.venueAddress,
  );

  if (!data.oneVenueOnly) {
    fields.push(data.receptionVenueName, data.receptionVenueAddress);
  }

  fields.push(
    data.heroMessage,
    data.heroClosingSentiment
  );

  return fields;
}

/**
 * Returns filled and total fields for Wedding Details.
 */
export function getWeddingDetailsProgressData(data: InvitationData): { filled: number; total: number } {
  const fields = getWeddingDetailsFields(data);
  const filled = fields.filter((v) => v && v.trim() !== "").length;
  return { filled, total: fields.length };
}

/**
 * Calculates the completion percentage for Wedding Details fields.
 */
export function getWeddingDetailsProgress(data: InvitationData): number {
  const { filled, total } = getWeddingDetailsProgressData(data);
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Returns the "weight" (number of required fields) for Wedding Details.
 * Used to proportionally size this category on the segmented gauge.
 */
export function getWeddingDetailsWeight(data: InvitationData): number {
  return getWeddingDetailsFields(data).length;
}

/** Number of items required to reach 100% for each Media sub-item. */
const MEDIA_REQUIREMENTS: Record<string, number> = {
  background: 2,
  logo: 1,
  gallery: 5,
  venue: 1,
};

/**
 * Calculates the completion percentage for the Media section.
 *
 * - Logo: 100% if heroIcon exists, 0% otherwise
 * - Gallery: up to 5 photos = 100%, capped at 100%
 * - Fonts and Music are excluded from progress calculation
 */
export function getMediaItemProgress(data: InvitationData, itemId: string): number | null {
  switch (itemId) {
    case "background":
      return ((data.heroBackgroundImages?.length ?? 0) >= 1 ? 50 : 0) + ((data.heroBackgroundImagesMobile?.length ?? 0) >= 1 ? 50 : 0);
    case "logo":
      return data.heroIcon && data.heroIcon.trim() !== "" ? 100 : 0;
    case "gallery":
      return Math.min(100, Math.round(((data.galleryImages?.length ?? 0) / MEDIA_REQUIREMENTS.gallery) * 100));
    case "venue":
      if (data.oneVenueOnly) {
        return (data.venueImages?.length ?? 0) >= 1 ? 100 : 0;
      } else {
        const ceremonyProgress = (data.venueImages?.length ?? 0) >= 1 ? 50 : 0;
        const receptionProgress = (data.receptionVenueImages?.length ?? 0) >= 1 ? 50 : 0;
        return ceremonyProgress + receptionProgress;
      }
    default:
      return null;
  }
}

export function getMediaItemProgressData(data: InvitationData, itemId: string): { filled: number; total: number } | null {
  switch (itemId) {
    case "background":
      return { filled: ((data.heroBackgroundImages?.length ?? 0) >= 1 ? 1 : 0) + ((data.heroBackgroundImagesMobile?.length ?? 0) >= 1 ? 1 : 0), total: MEDIA_REQUIREMENTS.background };
    case "logo":
      return { filled: data.heroIcon && data.heroIcon.trim() !== "" ? 1 : 0, total: MEDIA_REQUIREMENTS.logo };
    case "gallery":
      return { filled: Math.min(data.galleryImages?.length ?? 0, MEDIA_REQUIREMENTS.gallery), total: MEDIA_REQUIREMENTS.gallery };
    case "venue":
      if (data.oneVenueOnly) {
        return { filled: (data.venueImages?.length ?? 0) >= 1 ? 1 : 0, total: MEDIA_REQUIREMENTS.venue };
      } else {
        return {
          filled: ((data.venueImages?.length ?? 0) >= 1 ? 1 : 0) + ((data.receptionVenueImages?.length ?? 0) >= 1 ? 1 : 0),
          total: 2,
        };
      }
    default:
      return null;
  }
}

/**
 * Returns filled and total items for Media category.
 * logo: 0/1, gallery: min(count,5)/5, venue: 0/1
 */
export function getMediaProgressData(data: InvitationData): { filled: number; total: number } {
  let filled = 0;
  let total = 0;

  // Background (1 desktop + 1 mobile = 2)
  total += MEDIA_REQUIREMENTS.background;
  if ((data.heroBackgroundImages?.length ?? 0) >= 1) filled += 1;
  if ((data.heroBackgroundImagesMobile?.length ?? 0) >= 1) filled += 1;

  // Logo
  total += MEDIA_REQUIREMENTS.logo;
  if (data.heroIcon && data.heroIcon.trim() !== "") filled += MEDIA_REQUIREMENTS.logo;

  // Gallery
  total += MEDIA_REQUIREMENTS.gallery;
  filled += Math.min(data.galleryImages?.length ?? 0, MEDIA_REQUIREMENTS.gallery);

  // Venue
  if (data.oneVenueOnly) {
    total += MEDIA_REQUIREMENTS.venue;
    if ((data.venueImages?.length ?? 0) >= 1) filled += MEDIA_REQUIREMENTS.venue;
  } else {
    total += 2;
    if ((data.venueImages?.length ?? 0) >= 1) filled += 1;
    if ((data.receptionVenueImages?.length ?? 0) >= 1) filled += 1;
  }

  return { filled, total };
}

/**
 * Calculates the overall Media progress by averaging items that have progress.
 */
export function getMediaOverallProgress(data: InvitationData): number {
  const items = ["background", "logo", "gallery", "venue"];
  const progresses = items
    .map((id) => getMediaItemProgress(data, id))
    .filter((p): p is number => p !== null);

  if (progresses.length === 0) return 0;
  return Math.round(progresses.reduce((sum, p) => sum + p, 0) / progresses.length);
}

/**
 * Returns the "weight" (sum of required items) for the Media category.
 * Used to proportionally size this category on the segmented gauge.
 */
export function getMediaWeight(): number {
  return Object.values(MEDIA_REQUIREMENTS).reduce((sum, n) => sum + n, 0);
}

/**
 * Calculates entourage progress by visible sections.
 * Each visible section = 1 unit. A section is "filled" if it has at least 1 non-empty name.
 */
export function getEntourageProgress(data: InvitationData): number {
  const { filled, total } = getEntourageProgressData(data);
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Returns filled and total visible sections for entourage.
 * A section counts as filled if at least 1 name in it is non-empty.
 */
export function getEntourageProgressData(data: InvitationData): { filled: number; total: number } {
  if (!data.entourage) return { filled: 0, total: 0 };
  const ent = data.entourage;
  const vs = ent.visibleSections;
  const isVisible = (section?: boolean) => section !== false;

  let filled = 0;
  let total = 0;

  const checkSection = (hasName: boolean) => {
    total++;
    if (hasName) filled++;
  };

  const hasAny = (names?: string[]) => (names || []).some(n => n && n.trim());

  if (isVisible(vs?.couple)) {
    checkSection(!!ent.couple?.groomName?.trim());
    checkSection(!!ent.couple?.brideName?.trim());
  }
  if (isVisible(vs?.groomParents)) {
    checkSection(!!ent.groomParents?.fatherName?.trim());
    checkSection(!!ent.groomParents?.motherName?.trim());
  }
  if (isVisible(vs?.brideParents)) {
    checkSection(!!ent.brideParents?.fatherName?.trim());
    checkSection(!!ent.brideParents?.motherName?.trim());
  }
  if (isVisible(vs?.marriageTalkSpeaker)) checkSection(!!ent.marriageTalkSpeaker?.name?.trim());
  if (isVisible(vs?.officiatingMinister)) checkSection(!!ent.officiatingMinister?.name?.trim());
  if (isVisible(vs?.witnesses)) checkSection(hasAny(ent.witnesses?.names));
  if (isVisible(vs?.bestMan)) checkSection(!!ent.bestMan?.name?.trim());
  if (isVisible(vs?.maidOfHonor)) checkSection(!!ent.maidOfHonor?.name?.trim());
  if (isVisible(vs?.directorOfCeremony)) checkSection(hasAny(ent.directorOfCeremony?.names));
  if (isVisible(vs?.directorOfFeast)) checkSection(hasAny(ent.directorOfFeast?.names));
  if (isVisible(vs?.ushers)) checkSection(hasAny(ent.ushers?.names));
  if (isVisible(vs?.usherettes)) checkSection(hasAny(ent.usherettes?.names));
  if (isVisible(vs?.chairman)) checkSection(!!ent.chairman?.name?.trim());
  if (isVisible(vs?.groomsmen)) checkSection(hasAny(ent.groomsmen?.names));
  if (isVisible(vs?.bridesmaids)) checkSection(hasAny(ent.bridesmaids?.names));
  if (isVisible(vs?.jrGroomsmen)) checkSection(hasAny(ent.jrGroomsmen?.names));
  if (isVisible(vs?.jrBridesmaid)) checkSection(hasAny(ent.jrBridesmaid?.names));
  if (isVisible(vs?.flowerGirls)) checkSection(hasAny(ent.flowerGirls?.names));
  if (isVisible(vs?.bibleBearer)) checkSection(!!ent.bibleBearer?.name?.trim());
  if (isVisible(vs?.ringBearer)) checkSection(!!ent.ringBearer?.name?.trim());

  return { filled, total };
}

/**
 * Returns the weight (total visible sections) for the Entourage category.
 */
export function getEntourageWeight(data: InvitationData): number {
  return getEntourageProgressData(data).total;
}

/**
 * Calculates Story Timeline progress.
 * Each item has 4 fields: title, date, description, photoUrl.
 */
const STORY_TIMELINE_TARGET_ITEMS = 3;

/**
 * Returns filled and total items for Story Timeline.
 */
export function getStoryTimelineProgressData(data: InvitationData): { filled: number; total: number } {
  const count = Math.min(data.storyTimeline?.length ?? 0, STORY_TIMELINE_TARGET_ITEMS);
  return { filled: count, total: STORY_TIMELINE_TARGET_ITEMS };
}

export function getStoryTimelineProgress(data: InvitationData): number {
  const { filled, total } = getStoryTimelineProgressData(data);
  if (total === 0) return 0;
  return Math.min(100, Math.round((filled / total) * 100));
}

/**
 * Returns the weight for Story Timeline (items * 4 fields, min 1).
 */
export function getStoryTimelineWeight(): number {
  return STORY_TIMELINE_TARGET_ITEMS;
}

/**
 * Calculates Wedding Program progress.
 * Each item has 4 fields: name, eventDetails, place, time.
 */
const WEDDING_PROGRAM_TARGET_ITEMS = 3;

/**
 * Returns filled and total items for Wedding Program.
 */
export function getWeddingProgramProgressData(data: InvitationData): { filled: number; total: number } {
  const count = Math.min(data.weddingProgram?.length ?? 0, WEDDING_PROGRAM_TARGET_ITEMS);
  return { filled: count, total: WEDDING_PROGRAM_TARGET_ITEMS };
}

export function getWeddingProgramProgress(data: InvitationData): number {
  const { filled, total } = getWeddingProgramProgressData(data);
  if (total === 0) return 0;
  return Math.min(100, Math.round((filled / total) * 100));
}

/**
 * Returns the weight for Wedding Program (items * 4 fields, min 1).
 */
export function getWeddingProgramWeight(): number {
  return WEDDING_PROGRAM_TARGET_ITEMS;
}

/**
 * Generic weighted progress calculation from an array of segments.
 * Used by the HalfCircleGauge to compute overall progress from included tiles.
 */
export function getWeightedProgress(segments: { percentage: number; weight: number }[]): number {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(segments.reduce((sum, s) => sum + s.percentage * s.weight, 0) / totalWeight);
}

