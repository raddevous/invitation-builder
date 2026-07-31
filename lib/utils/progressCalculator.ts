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
    data.receptionVenueName,
    data.receptionVenueAddress,
    data.heroMessage,
    data.heroClosingSentiment
  );

  return fields;
}

/**
 * Calculates the completion percentage for Wedding Details fields.
 */
export function getWeddingDetailsProgress(data: InvitationData): number {
  const fields = getWeddingDetailsFields(data);
  const filled = fields.filter((v) => v && v.trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
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
    case "logo":
      return data.heroIcon && data.heroIcon.trim() !== "" ? 100 : 0;
    case "gallery":
      return Math.min(100, Math.round(((data.galleryImages?.length ?? 0) / MEDIA_REQUIREMENTS.gallery) * 100));
    case "venue":
      return (data.venueImages?.length ?? 0) >= 1 ? 100 : 0;
    default:
      return null;
  }
}

/**
 * Calculates the overall Media progress by averaging items that have progress.
 */
export function getMediaOverallProgress(data: InvitationData): number {
  const items = ["logo", "gallery", "venue"];
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

export function getStoryTimelineProgress(data: InvitationData): number {
  const count = data.storyTimeline?.length ?? 0;
  if (count === 0) return 0;
  return Math.min(100, Math.round((count / STORY_TIMELINE_TARGET_ITEMS) * 100));
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

export function getWeddingProgramProgress(data: InvitationData): number {
  const count = data.weddingProgram?.length ?? 0;
  if (count === 0) return 0;
  return Math.min(100, Math.round((count / WEDDING_PROGRAM_TARGET_ITEMS) * 100));
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

