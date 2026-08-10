import type { InvitationData } from "@/lib/types/invitation";

export interface EntourageGuest {
  name: string;
  title: string;
  role?: string; // entourage section key (e.g. "flowerGirls", "ringBearer", "bibleBearer")
}

/**
 * Extracts guest names from the entourage that should be auto-added to the guest list,
 * excluding the couple, groom's parents, and bride's parents.
 * Only includes names from roles that are visible (checked in visibility mode) and have non-empty names.
 */
export function getEntourageGuestNames(entourage: InvitationData["entourage"] | undefined): EntourageGuest[] {
  if (!entourage) return [];
  const guests: EntourageGuest[] = [];
  const pushIfNonEmpty = (n?: string, title?: string, role?: string) => {
    if (n && n.trim() && title) guests.push({ name: n.trim(), title, role });
  };

  const visibleSections = entourage.visibleSections;
  const isVisible = (section?: boolean) => section !== false; // true if undefined (default visible) or true

  if (isVisible(visibleSections?.marriageTalkSpeaker)) {
    pushIfNonEmpty(entourage.marriageTalkSpeaker?.name, entourage.marriageTalkSpeaker?.titleCustom || "Marriage Talk Speaker", "marriageTalkSpeaker");
  }
  if (isVisible(visibleSections?.officiatingMinister)) {
    pushIfNonEmpty(entourage.officiatingMinister?.name, entourage.officiatingMinister?.titleCustom || "Officiating Minister", "officiatingMinister");
  }
  if (isVisible(visibleSections?.witnesses)) {
    (entourage.witnesses?.names || []).forEach(n => pushIfNonEmpty(n, entourage.witnesses?.titleCustom || "Witness", "witnesses"));
  }
  if (isVisible(visibleSections?.bestMan)) {
    pushIfNonEmpty(entourage.bestMan?.name, entourage.bestMan?.titleCustom || "Best Man", "bestMan");
  }
  if (isVisible(visibleSections?.maidOfHonor)) {
    pushIfNonEmpty(entourage.maidOfHonor?.name, entourage.maidOfHonor?.titleCustom || "Maid of Honor", "maidOfHonor");
  }
  if (isVisible(visibleSections?.directorOfCeremony)) {
    (entourage.directorOfCeremony?.names || []).forEach(n => pushIfNonEmpty(n, entourage.directorOfCeremony?.titleCustom || "Director of the Ceremony", "directorOfCeremony"));
  }
  if (isVisible(visibleSections?.directorOfFeast)) {
    (entourage.directorOfFeast?.names || []).forEach(n => pushIfNonEmpty(n, entourage.directorOfFeast?.titleCustom || "Director of the Feast", "directorOfFeast"));
  }
  if (isVisible(visibleSections?.ushers)) {
    (entourage.ushers?.names || []).forEach(n => pushIfNonEmpty(n, entourage.ushers?.titleCustom || "Ushers", "ushers"));
  }
  if (isVisible(visibleSections?.usherettes)) {
    (entourage.usherettes?.names || []).forEach(n => pushIfNonEmpty(n, entourage.usherettes?.titleCustom || "Usherettes", "usherettes"));
  }
  if (isVisible(visibleSections?.chairman)) {
    pushIfNonEmpty(entourage.chairman?.name, entourage.chairman?.titleCustom || "Chairman", "chairman");
  }
  if (isVisible(visibleSections?.groomsmen)) {
    (entourage.groomsmen?.names || []).forEach(n => pushIfNonEmpty(n, entourage.groomsmen?.titleCustom || "Groomsmen", "groomsmen"));
  }
  if (isVisible(visibleSections?.bridesmaids)) {
    (entourage.bridesmaids?.names || []).forEach(n => pushIfNonEmpty(n, entourage.bridesmaids?.titleCustom || "Bridesmaids", "bridesmaids"));
  }
  if (isVisible(visibleSections?.jrGroomsmen)) {
    (entourage.jrGroomsmen?.names || []).forEach(n => pushIfNonEmpty(n, entourage.jrGroomsmen?.titleCustom || "Jr Groomsmen", "jrGroomsmen"));
  }
  if (isVisible(visibleSections?.jrBridesmaid)) {
    (entourage.jrBridesmaid?.names || []).forEach(n => pushIfNonEmpty(n, entourage.jrBridesmaid?.titleCustom || "Jr Bridesmaid", "jrBridesmaid"));
  }
  if (isVisible(visibleSections?.flowerGirls)) {
    (entourage.flowerGirls?.names || []).forEach(n => pushIfNonEmpty(n, entourage.flowerGirls?.titleCustom || "Flower Girls", "flowerGirls"));
  }
  if (isVisible(visibleSections?.bibleBearer)) {
    pushIfNonEmpty(entourage.bibleBearer?.name, entourage.bibleBearer?.titleCustom || "Bible Bearer", "bibleBearer");
  }
  if (isVisible(visibleSections?.ringBearer)) {
    pushIfNonEmpty(entourage.ringBearer?.name, entourage.ringBearer?.titleCustom || "Ring Bearer", "ringBearer");
  }

  return guests;
}

/**
 * Extracts the "special" guest names: the couple and both sets of parents.
 * These are displayed in the guest editor (read-only) but excluded from RSVP search on the live page.
 */
export function getSpecialGuestNames(data: InvitationData): EntourageGuest[] {
  const guests: EntourageGuest[] = [];
  const pushIfNonEmpty = (n?: string, title?: string) => {
    if (n && n.trim() && title) guests.push({ name: n.trim(), title });
  };

  const ent = data.entourage;
  if (ent?.couple?.groomName?.trim()) pushIfNonEmpty(ent.couple.groomName, "The Groom");
  if (ent?.couple?.brideName?.trim()) pushIfNonEmpty(ent.couple.brideName, "The Bride");
  if (ent?.groomParents?.fatherName?.trim()) pushIfNonEmpty(ent.groomParents.fatherName, "The Groom's Parents");
  if (ent?.groomParents?.motherName?.trim()) pushIfNonEmpty(ent.groomParents.motherName, "The Groom's Parents");
  if (ent?.brideParents?.fatherName?.trim()) pushIfNonEmpty(ent.brideParents.fatherName, "The Bride's Parents");
  if (ent?.brideParents?.motherName?.trim()) pushIfNonEmpty(ent.brideParents.motherName, "The Bride's Parents");

  return guests;
}

/**
 * Normalizes a guest name for matching: strips honorific prefixes (Mr., Ms., Mrs., M.),
 * trims whitespace, and lowercases.
 * Used to match RSVP responses against guest list entries regardless of title format.
 */
export function normalizeGuestName(name: string): string {
  return name
    .replace(/^(Mr\.|Ms\.|Mrs\.|M\.)\s+/i, "")
    .trim()
    .toLowerCase();
}
