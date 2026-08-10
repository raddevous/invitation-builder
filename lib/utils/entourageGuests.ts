import type { InvitationData } from "@/lib/types/invitation";

export interface EntourageGuest {
  name: string;
  title: string;
}

/**
 * Extracts guest names from the entourage that should be auto-added to the guest list,
 * excluding the couple, groom's parents, and bride's parents.
 * Only includes names from roles that are visible (checked in visibility mode) and have non-empty names.
 */
export function getEntourageGuestNames(entourage: InvitationData["entourage"] | undefined): EntourageGuest[] {
  if (!entourage) return [];
  const guests: EntourageGuest[] = [];
  const pushIfNonEmpty = (n?: string, title?: string) => {
    if (n && n.trim() && title) guests.push({ name: n.trim(), title });
  };

  const visibleSections = entourage.visibleSections;
  const isVisible = (section?: boolean) => section !== false; // true if undefined (default visible) or true

  if (isVisible(visibleSections?.marriageTalkSpeaker)) {
    pushIfNonEmpty(entourage.marriageTalkSpeaker?.name, entourage.marriageTalkSpeaker?.titleCustom || "Marriage Talk Speaker");
  }
  if (isVisible(visibleSections?.officiatingMinister)) {
    pushIfNonEmpty(entourage.officiatingMinister?.name, entourage.officiatingMinister?.titleCustom || "Officiating Minister");
  }
  if (isVisible(visibleSections?.witnesses)) {
    (entourage.witnesses?.names || []).forEach(n => pushIfNonEmpty(n, entourage.witnesses?.titleCustom || "Witness"));
  }
  if (isVisible(visibleSections?.bestMan)) {
    pushIfNonEmpty(entourage.bestMan?.name, entourage.bestMan?.titleCustom || "Best Man");
  }
  if (isVisible(visibleSections?.maidOfHonor)) {
    pushIfNonEmpty(entourage.maidOfHonor?.name, entourage.maidOfHonor?.titleCustom || "Maid of Honor");
  }
  if (isVisible(visibleSections?.directorOfCeremony)) {
    (entourage.directorOfCeremony?.names || []).forEach(n => pushIfNonEmpty(n, entourage.directorOfCeremony?.titleCustom || "Director of the Ceremony"));
  }
  if (isVisible(visibleSections?.directorOfFeast)) {
    (entourage.directorOfFeast?.names || []).forEach(n => pushIfNonEmpty(n, entourage.directorOfFeast?.titleCustom || "Director of the Feast"));
  }
  if (isVisible(visibleSections?.ushers)) {
    (entourage.ushers?.names || []).forEach(n => pushIfNonEmpty(n, entourage.ushers?.titleCustom || "Ushers"));
  }
  if (isVisible(visibleSections?.usherettes)) {
    (entourage.usherettes?.names || []).forEach(n => pushIfNonEmpty(n, entourage.usherettes?.titleCustom || "Usherettes"));
  }
  if (isVisible(visibleSections?.chairman)) {
    pushIfNonEmpty(entourage.chairman?.name, entourage.chairman?.titleCustom || "Chairman");
  }
  if (isVisible(visibleSections?.groomsmen)) {
    (entourage.groomsmen?.names || []).forEach(n => pushIfNonEmpty(n, entourage.groomsmen?.titleCustom || "Groomsmen"));
  }
  if (isVisible(visibleSections?.bridesmaids)) {
    (entourage.bridesmaids?.names || []).forEach(n => pushIfNonEmpty(n, entourage.bridesmaids?.titleCustom || "Bridesmaids"));
  }
  if (isVisible(visibleSections?.jrGroomsmen)) {
    (entourage.jrGroomsmen?.names || []).forEach(n => pushIfNonEmpty(n, entourage.jrGroomsmen?.titleCustom || "Jr Groomsmen"));
  }
  if (isVisible(visibleSections?.jrBridesmaid)) {
    (entourage.jrBridesmaid?.names || []).forEach(n => pushIfNonEmpty(n, entourage.jrBridesmaid?.titleCustom || "Jr Bridesmaid"));
  }
  if (isVisible(visibleSections?.flowerGirls)) {
    (entourage.flowerGirls?.names || []).forEach(n => pushIfNonEmpty(n, entourage.flowerGirls?.titleCustom || "Flower Girls"));
  }
  if (isVisible(visibleSections?.bibleBearer)) {
    pushIfNonEmpty(entourage.bibleBearer?.name, entourage.bibleBearer?.titleCustom || "Bible Bearer");
  }
  if (isVisible(visibleSections?.ringBearer)) {
    pushIfNonEmpty(entourage.ringBearer?.name, entourage.ringBearer?.titleCustom || "Ring Bearer");
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

  if (data.nameType === "event" && data.coupleName?.trim()) {
    pushIfNonEmpty(data.coupleName, "The Couple");
  }
  if (data.nameType === "couple") {
    pushIfNonEmpty(data.hisName, "The Groom");
    pushIfNonEmpty(data.herName, "The Bride");
  }
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
