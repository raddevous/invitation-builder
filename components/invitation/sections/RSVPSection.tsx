"use client";

import { useState, useEffect, useMemo } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import Divider from "./Divider";
import HybridFontControl from "@/components/shared/HybridFontControl";
import ColorControl from "@/components/shared/ColorControl";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";
import { getEntourageGuestNames, type EntourageGuest } from "@/lib/utils/entourageGuests";
import { getFontFamily } from "@/lib/utils/fonts";
import { useTheme } from "../ThemeContext";

interface RSVPSectionProps {
  data: InvitationData;
  invitationId: string;
  editMode?: boolean;
  onChange?: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
  onPanelOpen?: () => void;
  onPanelClose?: () => void;
}

type AttendanceValue = "attending" | "not-attending" | "maybe";

export default function RSVPSection({ data, invitationId, editMode = false, onChange = () => {}, desktopMode = false, panelPosition = "left", onPanelOpen = () => {}, onPanelClose = () => {} }: RSVPSectionProps) {
  const { isDarkMode, accentColor } = useTheme();
  const [guestName, setGuestName] = useState("");
  const [attendance, setAttendance] = useState<AttendanceValue | "">("");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showRsvpSettingsPanel, setShowRsvpSettingsPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const [hasUnsavedRsvpSettingsChanges, setHasUnsavedRsvpSettingsChanges] = useState(false);
  const [pendingRsvpSettingsChanges, setPendingRsvpSettingsChanges] = useState<Partial<InvitationData>>({});
  const [predefinedImageIndex, setPredefinedImageIndex] = useState(0);
  const [predefinedVideoIndex, setPredefinedVideoIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<{ name: string; title: "M" | "Mr." | "Ms." | "Mrs." } | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [existingResponse, setExistingResponse] = useState<{ attendance: string; message: string | null } | null>(null);
  const [previewCardIndex, setPreviewCardIndex] = useState(0);

  const predefinedRsvpHeadings = ["RSVP", "Kindly Reply", "Please Respond", "Save Our Date"];
  const predefinedDeadlineTexts = [
    { prefix: "RSVP by", hasLineBreak: false },
    { prefix: "Kindly reply by", hasLineBreak: true },
    { prefix: "Please respond by", hasLineBreak: true },
    { prefix: "Please reply by", hasLineBreak: true }
  ];
  const predefinedAttendanceTexts = [
    { attending: "Can't Wait to Celebrate", notAttending: "Will Toast from Afar" },
    { attending: "Accepts with pleasure", notAttending: "Declines with regret" },
    { attending: "Excited to come!", notAttending: "Sorry, can't make it!" },
    { attending: "I'd love to", notAttending: "Sorry I can't make it" },
    { attending: "Will attend", notAttending: "Will not attend" },
    { attending: "Accepts", notAttending: "Declines" },
    { attending: "Delighted to Attend", notAttending: "Regretfully Decline" }
  ];

  const predefinedReservedTexts = [
    "We have reserve {guestnumber} seat{s} in your honor.",
    "Your presence is requested and {guestnumber} seat{s} is reserved.",
    "We've got {guestnumber} seat{s} with your name on it!",
    "We kept {guestnumber} seat{s} just for you."
  ];

  const predefinedAttendingThankYouTexts = [
    "Thank you for attending!",
    "Thank you for your response; we look forward to celebrating with you.",
    "We are honored by your acceptance and look forward to your presence.",
    "Thank you for accepting our invitation. Your presence is our greatest joy.",
    "We appreciate your reply and look forward to sharing our special day with you.",
    "Thank you! We can't wait to celebrate this special day with you.",
    "We are so happy you can make it! See you at the celebration."
  ];

  const predefinedNotAttendingThankYouTexts = [
    "Thank you for letting us know.",
    "Thank you for your response. You will be deeply missed.",
    "We appreciate your reply and will miss your presence on our special day.",
    "Thank you for letting us know. We send you our warmest wishes.",
    "We are sorry you cannot join us, but we appreciate your kind response.",
    "We are so sorry you can't make it! We will miss you terribly.",
    "We're sad we won't see you there, but we send you all our love."
  ];

  const predefinedNotAttendingWithMessageThankYouTexts = [
    "Thank you so much for your beautiful message! We will miss you terribly, but your kind words mean the world to us.",
    "We are so sad you can't make it, but your lovely note brought us so much joy. Thank you for celebrating with us from afar!",
    "Thank you for the wonderful message and wishes. You will be deeply missed on our big day, but we feel your love completely.",
    "We'll miss you so much at the wedding, but your sweet message made our day. Thank you for sending so much love!",
    "Thank you for your response and for your thoughtful message. Your kind wishes are deeply appreciated, and you will be missed.",
    "We are sorry you cannot join us, but we are incredibly grateful for your beautiful note and blessings.",
    "Thank you for letting us know and for sharing such kind words with us. Your presence will be missed, but your wishes are cherished."
  ];

  // Title-specific reserved text messages for entourage roles
  const titleSpecificReservedTexts: Record<string, string> = {
    "Witness": "Will you be our witness?",
    "Chairman": "Will you be our Chairman?",
    "Best Man": "Will you be my Best Man?",
    "Maid of Honor": "Will you be my Maid of Honor?",
    "Director of the Ceremony": "Will you be our Director of the Ceremony?",
    "Officiating Minister": "Will you be our Officiating Minister?",
    "Marriage Talk Speaker": "Will you be our Marriage Talk Speaker?",
    "Director of the Feast": "Will you be our Director of the Feast?",
    "Ushers": "Will you be one of our Ushers?",
    "Usherettes": "Will you be one of our Usherettes?",
    "Groomsmen": "Will you be one of my Groomsmen?",
    "Bridesmaids": "Will you be one of my Bridesmaids?",
    "Jr Groomsmen": "Will you be one of my Jr Groomsmen?",
    "Jr Bridesmaid": "Will you be one of my Jr Bridesmaids?",
    "flower girls": "Will you be our flower girl?",
    "Bible Bearer": "Will you be our Bible Bearer?",
    "Ring Bearer": "Will you be our Ring Bearer?"
  };

  // Predefined message options for each entourage title (for cycling)
  // Use {TITLE} placeholder which will be replaced with custom title when displayed
  const titleMessageOptions: Record<string, string[]> = {
    "Witness": ["We promise to keep the ceremony short if you promise to sign the paperwork!", "We need your signature! Will you be our official {TITLE}?", "Help us make it legal! Will you be our {TITLE}?", "We want our favorite people to make it official. Will you be one of our {TITLE}s?", "Will you stand with us and sign as our {TITLE}s?", "We need two incredible people to sign the lines. Will you be one of our {TITLE}s?"],
    "Chairman": ["We request the honor of your guidance as our Wedding {TITLE}.", "We would be deeply honored if you would serve as the {TITLE}", "Your wisdom means everything to us. Will you do us the honor of being our Wedding {TITLE}?", "Will you do us the honor of serving as our {TITLE}"],
    "Best Man": ["Time to suit up. Will you be my {TITLE}?", "Will you stand by my side as my {TITLE}?", "I can't imagine getting married without you there. Will you be my {TITLE}?", "There is no one else I'd rather have by my side. Will you do me the honor of being my {TITLE}?", "I found the girl, now I just need my {TITLE}."],
    "Maid of Honor": ["Will you stand by my side as my {TITLE}?", "I can't say 'I do' without you. {TITLE}?", "Found the guy, now I need my {TITLE}.", "You've been there through everything. Will you do me the honor of being my {TITLE}?", "I cannot imagine my wedding day without you by my side. Will you be my {TITLE}?", "There is no one else I'd rather have holding my bouquet. Will you be my {TITLE}?", "Best friend, sister, and my future {TITLE}? Say yes!", "Help me plan, keep me sane, and be my {TITLE}!"],
    "Director of the Ceremony": ["Will you direct our ceremony?", "{TITLE}. Are you ready to lead?", "We request the honor of your guidance as our {TITLE}.", "Your exceptional leadership means everything to us. Will you direct our ceremony?", "We invite you to bless our union by serving as our official {TITLE}.", "We trust you completely with our big day. Will you do us the honor of being our {TITLE}?", "We cannot think of a better person to keep us on track. Will you be the {TITLE} of our ceremony?", "You've always been our rock. Will you guide us down the aisle as our {TITLE}?"],
    "Officiating Minister": ["We request the honor of your leadership as our {TITLE}.", "We would be deeply honored if you would serve as the {TITLE} for our wedding.", "We invite you to bless our union and lead our marriage ceremony as our {TITLE}.", "We request the honor of your presence and guidance as our {TITLE}.", "Your spiritual guidance means the world to us. Will you do us the honor of officiating our wedding?", "As we take this sacred step, we would be deeply blessed to have you as our {TITLE}.", "We cannot imagine anyone else marrying us. Will you guide us through our vows as our {TITLE}?"],
    "Marriage Talk Speaker": ["We request the honor of your wisdom as our {TITLE}.", "We would be deeply honored if you would share your insights as our {TITLE}.", "We invite you to bless our marriage with your guidance as our official {TITLE}.", "We request the honor of your presence and your inspiring words as our {TITLE}.", "Your perspective on love and commitment means the world to us. Will you be our {TITLE}?", "We want to start our next chapter with the best advice. Will you do us the honor of speaking at our wedding?", "We invite you to guide us and our guests with an inspirational talk as we begin our marriage."],
    "Director of the Feast": ["We request the honor of your leadership as our {TITLE}.", "We would be deeply honored if you would serve as the {TITLE} for our wedding reception.", "We invite you to oversee our celebration and hospitality as our official {TITLE}.", "We request the honor of your presence and guidance as our {TITLE}.", "You always know how to bring people together. Will you do us the honor of being our {TITLE}?", "We cannot think of a better person to lead our wedding feast. Will you serve as our {TITLE}?", "We trust your taste and vision completely. Will you guide our reception as our {TITLE}?"],
    "Ushers": ["Time to suit up. Will you be an {TITLE}?", "Help people find their seats. {TITLE}?", "We request the honor of your assistance as one of our Wedding {TITLE}s.", "We would be deeply honored if you would serve as an {TITLE} for our ceremony.", "Your presence and help mean everything to us. Will you do us the honor of being one of our {TITLE}s?", "We invite you to welcome our guests and lead them by serving as one of our {TITLE}", "Will you help us keep the ceremony running smoothly? Be our {TITLE}!", "We need some sharp-dressed people to guide our guests. Will you be our {TITLE}", "Can you make sure my grandma gets to the right seat? {TITLE}?"],
    "Usherettes": ["Time to dress up. Will you be an {TITLE}?", "Help people find their seats. {TITLE}?", "We request the honor of your assistance as our Wedding {TITLE}", "We would be deeply honored if you would serve as an {TITLE} for our ceremony.", "Your presence and help mean everything to us. Will you do us the honor of being our {TITLE}?", "Will you help us keep the ceremony running smoothly? Be our {TITLE}!", "We need some lovely people to guide our guests. Will you be one of our {TITLE}s?", "Your presence and help mean everything to us. Will you do us the honor of being one of our {TITLE}s?"],
    "Groomsmen": ["Will you stand by my side as my {TITLE}?", "Time to suit up. Will you be a {TITLE}?", "I found the girl, now I need my {TITLE}.", "I can't imagine getting married without you there. Will you be one of my {TITLE}?"],
    "Bridesmaids": ["Will you stand by my side as my {TITLE}?", "Time to dress up. Will you be a {TITLE}?", "I found the guy, now I need my {TITLE}.", "I can't imagine getting married without you there. Will you be my {TITLE}?", "There is no one else I'd rather have by my side. Will you do me the honor of being my {TITLE}?", "Sisters by blood or choice. Will you stand with me as my {TITLE}?", "Will you hold my bouquet, drink the champagne, and make sure I don't trip on my dress?"],
    "Jr Groomsmen": ["Will you stand by my side as my {TITLE}?", "Time to suit up! Will you be a {TITLE}?", "I need a sharp-dressed guy by my side. {TITLE}?", "It means so much to have family by my side. Will you be my {TITLE}?", "You are growing into an amazing young man. Will you do me the honor of being my {TITLE}?", "I can't imagine taking this big step without you there. Will you stand with me as my {TITLE}?"],
    "Jr Bridesmaid": ["Will you stand by my side as my {TITLE}?", "Time to dress up! Will you be a {TITLE}?", "I need a lovely young lady by my side. {TITLE}?", "It means so much to have family by my side. Will you be my {TITLE}?", "You are growing into an amazing young lady. Will you do me the honor of being my {TITLE}?", "I can't imagine taking this big step without you there. Will you stand with me as my {TITLE}?"],
    "flower girls": ["I need a pretty princess by my side. {TITLE}?", "Time to dress up! Will you be my {TITLE}?", "You are so special to us. Will you do us the honor of being our {TITLE}?", "I can't wait to walk down the aisle, but first, I need you! {TITLE}?", "We want our favorite little girl to lead the way. Will you be our {TITLE}?", "Are you ready to wear a pretty dress and throw petals? Be my {TITLE}!"],
    "Bible Bearer": ["We need a special helper to carry our Bible. Are you in?", "Our sacred day would not be complete without you. Will you be our {TITLE}?", "We want the people we love most to lead the way. Will you be our {TITLE}?", "We would be so blessed to have you carry the holy book down the aisle. {TITLE}?"],
    "Ring Bearer": ["Our big day won't be complete without you. Will you be our {TITLE}?", "We want our favorite little guy to lead the way. Will you be our {TITLE}?", "We would be so happy to have you carry our rings down the aisle. {TITLE}?", "Are you ready to look sharper than the Groom and carry the rings? Be our {TITLE}!", "You are so special to us. Will you do us the honor of being our {TITLE}?"]
  };

  // Function to get all entourage titles with their custom titles
  const getAllEntourageTitles = (data: InvitationData): Array<{ key: string; title: string; defaultTitle: string; message: string }> => {
    const entourage = data.entourage;
    if (!entourage) return [];

    const sections = [
      { key: "witnesses", title: entourage.witnesses?.title, titleCustom: entourage.witnesses?.titleCustom },
      { key: "chairman", title: entourage.chairman?.title, titleCustom: entourage.chairman?.titleCustom },
      { key: "bestMan", title: entourage.bestMan?.title, titleCustom: entourage.bestMan?.titleCustom },
      { key: "maidOfHonor", title: entourage.maidOfHonor?.title, titleCustom: entourage.maidOfHonor?.titleCustom },
      { key: "directorOfCeremony", title: entourage.directorOfCeremony?.title, titleCustom: entourage.directorOfCeremony?.titleCustom },
      { key: "officiatingMinister", title: entourage.officiatingMinister?.title, titleCustom: entourage.officiatingMinister?.titleCustom },
      { key: "marriageTalkSpeaker", title: entourage.marriageTalkSpeaker?.title, titleCustom: entourage.marriageTalkSpeaker?.titleCustom },
      { key: "directorOfFeast", title: entourage.directorOfFeast?.title, titleCustom: entourage.directorOfFeast?.titleCustom },
      { key: "ushers", title: entourage.ushers?.title, titleCustom: entourage.ushers?.titleCustom },
      { key: "usherettes", title: entourage.usherettes?.title, titleCustom: entourage.usherettes?.titleCustom },
      { key: "groomsmen", title: entourage.groomsmen?.title, titleCustom: entourage.groomsmen?.titleCustom },
      { key: "bridesmaids", title: entourage.bridesmaids?.title, titleCustom: entourage.bridesmaids?.titleCustom },
      { key: "jrGroomsmen", title: entourage.jrGroomsmen?.title, titleCustom: entourage.jrGroomsmen?.titleCustom },
      { key: "jrBridesmaid", title: entourage.jrBridesmaid?.title, titleCustom: entourage.jrBridesmaid?.titleCustom },
      { key: "flowerGirls", title: entourage.flowerGirls?.title, titleCustom: entourage.flowerGirls?.titleCustom },
      { key: "bibleBearer", title: entourage.bibleBearer?.title, titleCustom: entourage.bibleBearer?.titleCustom },
      { key: "ringBearer", title: entourage.ringBearer?.title, titleCustom: entourage.ringBearer?.titleCustom }
    ];

    // Map section keys to default titles
    const sectionKeyToTitle: Record<string, string> = {
      "witnesses": "Witness",
      "chairman": "Chairman",
      "bestMan": "Best Man",
      "maidOfHonor": "Maid of Honor",
      "directorOfCeremony": "Director of the Ceremony",
      "officiatingMinister": "Officiating Minister",
      "marriageTalkSpeaker": "Marriage Talk Speaker",
      "directorOfFeast": "Director of the Feast",
      "ushers": "Ushers",
      "usherettes": "Usherettes",
      "groomsmen": "Groomsmen",
      "bridesmaids": "Bridesmaids",
      "jrGroomsmen": "Jr Groomsmen",
      "jrBridesmaid": "Jr Bridesmaid",
      "flowerGirls": "flower girls",
      "bibleBearer": "Bible Bearer",
      "ringBearer": "Ring Bearer"
    };

    return sections
      .map(section => {
        const displayTitle = section.titleCustom || section.title || sectionKeyToTitle[section.key];
        const defaultTitle = sectionKeyToTitle[section.key];
        if (!displayTitle || !defaultTitle) return null;
        const message = data.rsvpTitleSpecificMessages?.[defaultTitle] || titleSpecificReservedTexts[defaultTitle] || "";
        return { key: section.key, title: displayTitle, defaultTitle, message };
      })
      .filter(Boolean) as Array<{ key: string; title: string; defaultTitle: string; message: string }>;
  };

  // Function to replace {TITLE} placeholder with custom title in message
  const replaceTitlePlaceholder = (message: string, customTitle: string): string => {
    return message.replace(/{TITLE}/g, customTitle);
  };

  // Function to cycle through predefined messages for a title
  const cycleTitleMessage = (title: string, data: InvitationData, onChange: (key: keyof InvitationData, value: any) => void) => {
    const currentMessage = data.rsvpTitleSpecificMessages?.[title] || titleSpecificReservedTexts[title] || "";
    const options = titleMessageOptions[title] || [titleSpecificReservedTexts[title] || ""];
    const currentIndex = options.indexOf(currentMessage);
    const nextIndex = (currentIndex + 1) % options.length;
    const newMessage = options[nextIndex];

    const updatedMessages = data.rsvpTitleSpecificMessages || {};
    updatedMessages[title] = newMessage;
    onChange("rsvpTitleSpecificMessages", updatedMessages);
  };

  // Function to get default title from display title (for message storage)
  const getDefaultTitleFromDisplay = (displayTitle: string): string | null => {
    const sectionKeyToTitle: Record<string, string> = {
      "witnesses": "Witness",
      "chairman": "Chairman",
      "bestMan": "Best Man",
      "maidOfHonor": "Maid of Honor",
      "directorOfCeremony": "Director of the Ceremony",
      "officiatingMinister": "Officiating Minister",
      "marriageTalkSpeaker": "Marriage Talk Speaker",
      "directorOfFeast": "Director of the Feast",
      "ushers": "Ushers",
      "usherettes": "Usherettes",
      "groomsmen": "Groomsmen",
      "bridesmaids": "Bridesmaids",
      "jrGroomsmen": "Jr Groomsmen",
      "jrBridesmaid": "Jr Bridesmaid",
      "flowerGirls": "flower girls",
      "bibleBearer": "Bible Bearer",
      "ringBearer": "Ring Bearer"
    };
    
    // Check if displayTitle matches any default title
    for (const [key, defaultTitle] of Object.entries(sectionKeyToTitle)) {
      if (defaultTitle === displayTitle) return defaultTitle;
    }
    
    // If not found, it might be a custom title - return null
    return null;
  };

  // Function to get reserved text based on guest's entourage title
  const getReservedTextForGuest = (guestName: string): string => {
    const entourage = data.entourage;
    if (!entourage) return data.rsvpReservedText || "We have reserve a seat in your honor.";

    // Strip honorific from guest name for matching (e.g., "Mr. John Doe" -> "John Doe")
    const cleanGuestName = guestName.replace(/^(Mr\.|Ms\.|Mrs\.|M\.)\s+/i, "").trim().toLowerCase();

    // Fetch guest number from guest details
    let guestNumber = 1; // default to 1
    const normalGuests = data.rsvpInvitees || [];
    const guestDetails = data.rsvpGuestDetails || {};
    const entourageGuestDetails = data.rsvpEntourageGuestDetails || {};
    const entourageGuestNames = getEntourageGuestNames(data.entourage);
    
    // Check if guest is in normal guests list
    for (let i = 0; i < normalGuests.length; i++) {
      const guestItem = normalGuests[i];
      const guest = typeof guestItem === 'string' ? { name: guestItem, title: "M" as const } : guestItem;
      const cleanName = guest.name.replace(/^(Mr\.|Ms\.|Mrs\.|M\.)\s+/i, "").trim().toLowerCase();
      if (cleanName === cleanGuestName) {
        const details = guestDetails[i];
        if (details && details.plusOne) {
          const num = parseInt(details.plusOne);
          if (!isNaN(num) && num > 0) {
            guestNumber = num;
          }
        }
        break;
      }
    }

    // Check if guest is in entourage guests (from entourage list)
    if (guestNumber === 1) {
      for (const entourageGuest of entourageGuestNames) {
        const cleanEntourageName = entourageGuest.name.replace(/^(Mr\.|Ms\.|Mrs\.|M\.)\s+/i, "").trim().toLowerCase();
        if (cleanEntourageName === cleanGuestName) {
          // Try to find details by full name first, then by clean name
          let details = entourageGuestDetails[entourageGuest.name];
          if (!details) {
            // Try with different honorific variations
            const honorifics = ['Mr.', 'Ms.', 'Mrs.', 'M'];
            for (const honorific of honorifics) {
              const fullName = `${honorific} ${entourageGuest.name}`;
              details = entourageGuestDetails[fullName];
              if (details) break;
            }
          }
          if (details && details.plusOne) {
            const num = parseInt(details.plusOne);
            if (!isNaN(num) && num > 0) {
              guestNumber = num;
            }
          }
          break;
        }
      }
    }

    // Check all entourage sections for matching guest name
    // Include section key as fallback title
    const allSections = [
      { sectionKey: "couple", title: entourage.couple?.title, titleCustom: entourage.couple?.titleCustom, names: [entourage.couple?.groomName, entourage.couple?.brideName].filter(Boolean) },
      { sectionKey: "groomParents", title: entourage.groomParents?.title, titleCustom: entourage.groomParents?.titleCustom, names: [entourage.groomParents?.fatherName, entourage.groomParents?.motherName].filter(Boolean) },
      { sectionKey: "brideParents", title: entourage.brideParents?.title, titleCustom: entourage.brideParents?.titleCustom, names: [entourage.brideParents?.fatherName, entourage.brideParents?.motherName].filter(Boolean) },
      { sectionKey: "officiatingMinister", title: entourage.officiatingMinister?.title, titleCustom: entourage.officiatingMinister?.titleCustom, names: [entourage.officiatingMinister?.name].filter(Boolean) },
      { sectionKey: "marriageTalkSpeaker", title: entourage.marriageTalkSpeaker?.title, titleCustom: entourage.marriageTalkSpeaker?.titleCustom, names: [entourage.marriageTalkSpeaker?.name].filter(Boolean) },
      { sectionKey: "witnesses", title: entourage.witnesses?.title, titleCustom: entourage.witnesses?.titleCustom, names: entourage.witnesses?.names || [] },
      { sectionKey: "bestMan", title: entourage.bestMan?.title, titleCustom: entourage.bestMan?.titleCustom, names: [entourage.bestMan?.name].filter(Boolean) },
      { sectionKey: "maidOfHonor", title: entourage.maidOfHonor?.title, titleCustom: entourage.maidOfHonor?.titleCustom, names: [entourage.maidOfHonor?.name].filter(Boolean) },
      { sectionKey: "ushers", title: entourage.ushers?.title, titleCustom: entourage.ushers?.titleCustom, names: entourage.ushers?.names || [] },
      { sectionKey: "usherettes", title: entourage.usherettes?.title, titleCustom: entourage.usherettes?.titleCustom, names: entourage.usherettes?.names || [] },
      { sectionKey: "directorOfCeremony", title: entourage.directorOfCeremony?.title, titleCustom: entourage.directorOfCeremony?.titleCustom, names: entourage.directorOfCeremony?.names || [] },
      { sectionKey: "directorOfFeast", title: entourage.directorOfFeast?.title, titleCustom: entourage.directorOfFeast?.titleCustom, names: entourage.directorOfFeast?.names || [] },
      { sectionKey: "chairman", title: entourage.chairman?.title, titleCustom: entourage.chairman?.titleCustom, names: [entourage.chairman?.name].filter(Boolean) }
    ];

    // Map section keys to default titles
    const sectionKeyToTitle: Record<string, string> = {
      "witnesses": "Witness",
      "chairman": "Chairman",
      "bestMan": "Best Man",
      "maidOfHonor": "Maid of Honor",
      "directorOfCeremony": "Director of the Ceremony",
      "officiatingMinister": "Officiating Minister",
      "marriageTalkSpeaker": "Marriage Talk Speaker",
      "directorOfFeast": "Director of the Feast",
      "ushers": "Ushers",
      "usherettes": "Usherettes",
      "groomsmen": "Groomsmen",
      "bridesmaids": "Bridesmaids",
      "jrGroomsmen": "Jr Groomsmen",
      "jrBridesmaid": "Jr Bridesmaid",
      "flowerGirls": "flower girls",
      "bibleBearer": "Bible Bearer",
      "ringBearer": "Ring Bearer"
    };

    for (const section of allSections) {
      const cleanNames = section.names.map(n => n?.trim().toLowerCase()).filter(Boolean);
      if (cleanNames.includes(cleanGuestName)) {
        const displayTitle = section.titleCustom || section.title || sectionKeyToTitle[section.sectionKey];
        const defaultTitle = sectionKeyToTitle[section.sectionKey];
        const defaultMessage = data.rsvpReservedText || "We have reserve a seat in your honor.";
        
        // Check for custom message using default title first (so it persists when title is renamed)
        let titleSpecificMessage = "";
        if (defaultTitle && data.rsvpTitleSpecificMessages?.[defaultTitle]) {
          titleSpecificMessage = data.rsvpTitleSpecificMessages[defaultTitle];
        } else if (displayTitle && data.rsvpTitleSpecificMessages?.[displayTitle]) {
          titleSpecificMessage = data.rsvpTitleSpecificMessages[displayTitle];
        } else if (defaultTitle && titleSpecificReservedTexts[defaultTitle]) {
          titleSpecificMessage = titleSpecificReservedTexts[defaultTitle];
        } else if (displayTitle && titleSpecificReservedTexts[displayTitle]) {
          titleSpecificMessage = titleSpecificReservedTexts[displayTitle];
        }
        
        // Append title-specific message to default message with line break
        if (titleSpecificMessage) {
          const messageWithPlaceholder = replaceTitlePlaceholder(titleSpecificMessage, displayTitle);
          
          // Apply placeholder replacement to default message
          let processedDefaultMessage = defaultMessage;
          if (!processedDefaultMessage.includes('{guestnumber}')) {
            processedDefaultMessage = predefinedReservedTexts[0];
          }
          const plural = guestNumber > 1 ? "s" : "";
          processedDefaultMessage = processedDefaultMessage
            .replace(/{guestnumber}/g, `<strong style="border-bottom: 1px solid currentColor; display: inline-block;">${guestNumber}</strong>`)
            .replace(/{s}/g, plural);
          
          return `${messageWithPlaceholder}\n${processedDefaultMessage}`;
        }
      }
    }

    // Replace placeholders with guest number and pluralize
    let reservedText = data.rsvpReservedText || predefinedReservedTexts[0];
    
    // If custom text doesn't have placeholders, use predefined text
    if (!reservedText.includes('{guestnumber}')) {
      reservedText = predefinedReservedTexts[0];
    }
    
    const plural = guestNumber > 1 ? "s" : "";
    return reservedText
      .replace(/{guestnumber}/g, `<strong style="border-bottom: 1px solid currentColor; display: inline-block;">${guestNumber}</strong>`)
      .replace(/{s}/g, plural);
  };

  const handleLightboxSubmit = async () => {
    if (!selectedGuest || !selectedAttendance) {
      setSubmitError("Please select an attendance option");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Map attendance to Yes/No
      const response = selectedAttendance === 'celebrate' ? 'Yes' : 'No';
      
      // Format guest name with honorific
      const guestName = selectedGuest.title === 'M' 
        ? selectedGuest.name 
        : `${selectedGuest.title} ${selectedGuest.name}`;

      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationId,
          guestName,
          attendance: selectedAttendance === 'celebrate' ? 'attending' : 'not-attending',
          guestCount: 1,
          message: guestMessage.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit RSVP');
      }

      setSubmitSuccess(true);
      // Close lightbox after successful submission
      setTimeout(() => {
        setShowLightbox(false);
        setSubmitSuccess(false);
        setSelectedGuest(null);
        setSelectedAttendance(null);
        setGuestMessage("");
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent body scroll when lightbox or settings panel is open
  useEffect(() => {
    if (showLightbox || showRsvpSettingsPanel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLightbox, showRsvpSettingsPanel]);

  // Fetch existing guest response when guest is selected
  useEffect(() => {
    if (selectedGuest && invitationId) {
      const fetchGuestResponse = async () => {
        try {
          const guestName = selectedGuest.title === 'M' 
            ? selectedGuest.name 
            : `${selectedGuest.title} ${selectedGuest.name}`;
          
          const res = await fetch(`/api/rsvp?invitationId=${invitationId}`);
          const data = await res.json();
          
          if (res.ok && data.responses) {
            const guestResponse = data.responses.find(
              (r: any) => r.guest_name === guestName
            );
            if (guestResponse) {
              setExistingResponse({
                attendance: guestResponse.attendance,
                message: guestResponse.message
              });
            } else {
              setExistingResponse(null);
            }
          }
        } catch (error) {
          console.error('Failed to fetch guest response:', error);
          setExistingResponse(null);
        }
      };
      
      fetchGuestResponse();
    } else {
      setExistingResponse(null);
    }
  }, [selectedGuest, invitationId]);

  // Fetch predefined options
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedImages } = usePredefinedOptions('background_images');
  const { options: predefinedVideos } = usePredefinedOptions('background_videos');
  const { options: predefinedDividerImagesCentered } = usePredefinedOptions('dividers_centeredsingle');
  const { options: predefinedDividerImagesSplit } = usePredefinedOptions('dividers_splithorizontal');
  const { options: predefinedDividerImagesMirrored } = usePredefinedOptions('dividers_mirroredcorners');

  if (!data.sections.rsvp) return null;

  const mergedData = { ...data, ...pendingChanges };

  // Set default values when background type changes
  useEffect(() => {
    if (mergedData.rsvpBackgroundType === "color" && !mergedData.rsvpBackgroundColor) {
      handleChange("rsvpBackgroundColor", data.mainColor1 || "#ffffff");
    } else if (mergedData.rsvpBackgroundType === "gradient" && !mergedData.rsvpGradient) {
      handleChange("rsvpGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.rsvpBackgroundType === "image" && !mergedData.rsvpImage) {
      handleChange("rsvpImage", {
        urls: [predefinedImages[0]?.value || "https://images.pexels.com/photos/48804/gift-package-loop-made-48804.jpeg"]
      });
      handleChange("rsvpGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    } else if (mergedData.rsvpBackgroundType === "video" && !mergedData.rsvpVideo) {
      handleChange("rsvpVideo", {
        url: predefinedVideos[0]?.value || "https://www.pexels.com/download/video/15200538/"
      });
      handleChange("rsvpGradient", {
        firstColor: data.mainColor1 || "#ffffff",
        secondColor: data.neutralColor2 || "#000000",
        firstOpacity: 65,
        secondOpacity: 65
      });
    }
  }, [mergedData.rsvpBackgroundType, data.mainColor1, data.neutralColor2, predefinedImages, predefinedVideos]);

  const handleClosePanel = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
    setIsClosing(true);
    setTimeout(() => {
      setShowSettingsPanel(false);
      setIsClosing(false);
    }, 300);
  };

  const handleCloseRsvpSettingsPanel = () => {
    setPendingRsvpSettingsChanges({});
    setHasUnsavedRsvpSettingsChanges(false);
    setIsClosing(true);
    setTimeout(() => {
      setShowRsvpSettingsPanel(false);
      setIsClosing(false);
    }, 300);
  };

  const handleChange = (key: keyof InvitationData, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    onChange(key, value);
  };

  const handleRsvpSettingsChange = (key: keyof InvitationData, value: any) => {
    setPendingRsvpSettingsChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedRsvpSettingsChanges(true);
    onChange(key, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !attendance) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId,
          guestName: guestName.trim(),
          attendance,
          guestCount: data.rsvpGuestField ? guestCount : 1,
          message: data.rsvpMessageField ? message.trim() : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const attendanceOptions: { value: AttendanceValue; label: string }[] = [
    { value: "attending", label: "Joyfully Accept" },
    { value: "not-attending", label: "Regretfully Decline" },
    { value: "maybe", label: "Will Try to Attend" },
  ];

  const getTopText = () => mergedData.rsvpTopTextCustom || mergedData.rsvpTopText || "";
  const getHeader = () => mergedData.rsvpHeaderCustom || mergedData.rsvpHeader || "RSVP";
  const getBottomText = () => mergedData.rsvpBottomTextCustom || mergedData.rsvpBottomText || (data.rsvpDeadline ? `Please respond by ${data.rsvpDeadline}` : "We look forward to your response");

  const [showDividerSettingsPanel, setShowDividerSettingsPanel] = useState(false);
  const [isDividerSettingsClosing, setIsDividerSettingsClosing] = useState(false);

  const handleCloseDividerSettingsPanel = () => {
    setIsDividerSettingsClosing(true);
    setTimeout(() => {
      setShowDividerSettingsPanel(false);
      setIsDividerSettingsClosing(false);
    }, 300);
  };

  // Auto-added guests from the Entourage list (excludes couple, groom's parents, bride's parents)
  const entourageGuestNames = useMemo(() => getEntourageGuestNames(data.entourage), [data.entourage]);

  // Combine entourage names (first, deduped) with manually added RSVP invitees
  const combinedGuests = useMemo(() => {
    const manualInvitees = data.rsvpInvitees || [];
    const dedupedManual = manualInvitees.filter((invitee) => {
      const name = typeof invitee === 'string' ? invitee : invitee.name;
      return !entourageGuestNames.some((n) => n.name.toLowerCase() === name.toLowerCase());
    });
    // Convert entourage guests to objects with honorifics (name only, no title in parentheses)
    const entourageWithHonorifics = entourageGuestNames.map((guest) => ({
      name: guest.name,
      title: data.rsvpEntourageHonorifics?.[guest.name] || "M",
    }));
    return [...entourageWithHonorifics, ...dedupedManual];
  }, [entourageGuestNames, data.rsvpInvitees, data.rsvpEntourageHonorifics]);

  // Filter guests based on search query
  const filteredGuests = combinedGuests.filter(guest => {
    const guestName = typeof guest === 'string' ? guest : guest.name;
    return guestName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper function to get crystal colors
  const getCrystalColors = () => {
    const crystalColors = {
      bg15: '',
      bg10: '',
      bg20: '',
      bg30: '',
      bg40: '',
      bg5: '',
      borderWhite20: '',
      borderWhite30: '',
      borderWhite40: '',
      textWhite: '',
      textWhite50: '',
      textWhite60: '',
      textWhite70: '',
      textWhite80: '',
      // For inline styles
      bg15Style: '',
      bg10Style: '',
      bg20Style: '',
      bg30Style: '',
      bg40Style: '',
      bg5Style: '',
      borderWhite20Style: '',
      borderWhite30Style: '',
      borderWhite40Style: ''
    };

    // Check if custom crystal color is set
    const customCrystalColor = mergedData.rsvpCrystalColor;
    if (customCrystalColor) {
      return {
        ...crystalColors,
        bg15Style: hexToRgba(customCrystalColor, 0.15),
        bg10Style: hexToRgba(customCrystalColor, 0.10),
        bg20Style: hexToRgba(customCrystalColor, 0.20),
        bg30Style: hexToRgba(customCrystalColor, 0.30),
        bg40Style: hexToRgba(customCrystalColor, 0.40),
        bg5Style: hexToRgba(customCrystalColor, 0.05),
        borderWhite20Style: hexToRgba(customCrystalColor, 0.20),
        borderWhite30Style: hexToRgba(customCrystalColor, 0.30),
        borderWhite40Style: hexToRgba(customCrystalColor, 0.40),
        textWhite: 'text-white',
        textWhite50: 'text-white/50',
        textWhite60: 'text-white/60',
        textWhite70: 'text-white/70',
        textWhite80: 'text-white/80'
      };
    }

    // Default white crystal (only structure)
    return {
      ...crystalColors,
      bg15: 'bg-white/15',
      bg10: 'bg-white/10',
      bg20: 'bg-white/20',
      bg30: 'bg-white/30',
      bg40: 'bg-white/40',
      bg5: 'bg-white/5',
      borderWhite20: 'border-white/20',
      borderWhite30: 'border-white/30',
      borderWhite40: 'border-white/40',
      textWhite: 'text-white',
      textWhite50: 'text-white/50',
      textWhite60: 'text-white/60',
      textWhite70: 'text-white/70',
      textWhite80: 'text-white/80'
    };
  };

  const crystalColors = getCrystalColors();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const rsvpUseDefaultDivider = data.rsvpDividerUseDefault ?? true;
  const effectivePullDown = rsvpUseDefaultDivider ? (data.universalDividerPullDown ?? 0) : (data.rsvpDividerPullDown ?? 0);
  const effectiveVerticalFlip = rsvpUseDefaultDivider ? (data.universalDividerVerticalFlip ?? false) : (data.rsvpDividerVerticalFlip ?? false);

  return (
    <section
      className="px-6 pt-0 pb-8 text-center relative"
      style={{
        backgroundColor: mergedData.rsvpUseMainColor !== false
          ? (data.mainColor1 || "transparent")
          : mergedData.rsvpBackgroundType === "gradient"
            ? undefined
            : mergedData.rsvpBackgroundType === "image"
              ? undefined
              : mergedData.rsvpBackgroundType === "video"
                ? undefined
                : (mergedData.rsvpBackgroundColor || data.mainColor1 || "transparent"),
        background: mergedData.rsvpUseMainColor !== false
          ? (data.mainColor1 || "transparent")
          : mergedData.rsvpBackgroundType === "gradient" && mergedData.rsvpGradient
            ? `linear-gradient(135deg, ${mergedData.rsvpGradient.firstColor || "#ffffff"}, ${mergedData.rsvpGradient.secondColor || "#ffffff"})`
            : undefined,
        ...(mergedData.rsvpBackgroundType === "image" && mergedData.rsvpImage?.urls && mergedData.rsvpImage.urls.length > 0 ? {
          backgroundImage: `url(${mergedData.rsvpImage.urls[0]})`,
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        } : {}),
        ...(mergedData.rsvpBackgroundType === "video" && mergedData.rsvpVideo?.url ? {
          backgroundImage: `url(${mergedData.rsvpVideo.url})`,
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        } : {}),
        transition: 'background 1s ease-in-out'
      }}
    >
      {/* Gradient Overlay - positioned behind content */}
      {(mergedData.rsvpBackgroundType === "image" || mergedData.rsvpBackgroundType === "video") && mergedData.rsvpGradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(135deg, ${hexToRgba(mergedData.rsvpGradient.firstColor || "#ffffff", (mergedData.rsvpGradient.firstOpacity || 50) / 100)}, ${hexToRgba(mergedData.rsvpGradient.secondColor || "#ffffff", (mergedData.rsvpGradient.secondOpacity || 50) / 100)})`,
          opacity: 1,
          zIndex: 1
        }} />
      )}

      {/* Background Video */}
      {mergedData.rsvpBackgroundType === "video" && mergedData.rsvpVideo?.url && (
        <video
          src={mergedData.rsvpVideo.url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      )}

      {/* Content Wrapper - positioned above gradient overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Divider 
          type={rsvpUseDefaultDivider ? (data.universalDivider || "none") : (data.rsvpDivider || "none")} 
          color={data.mainColor2} 
          id="rsvp-cssid" 
          offset={rsvpUseDefaultDivider ? (data.universalDividerOffset ?? 0) : (data.rsvpDividerOffset ?? 0)}
          tintColor={rsvpUseDefaultDivider ? (data.universalDividerTintColor || data.mainColor2) : (data.rsvpDividerTintColor || data.mainColor2)}
          tintOpacity={rsvpUseDefaultDivider ? (data.universalDividerTintOpacity ?? 100) : (data.rsvpDividerTintOpacity ?? 100)}
          dividerStyle={rsvpUseDefaultDivider ? (data.universalDividerStyle || "centered-single") : (data.rsvpDividerStyle || "centered-single")}
          flip={rsvpUseDefaultDivider ? (data.universalDividerFlip ?? false) : (data.rsvpDividerFlip ?? false)}
          spacing={rsvpUseDefaultDivider ? (data.universalDividerSpacing ?? 0) : (data.rsvpDividerSpacing ?? 0)}
          pullDown={effectivePullDown}
          verticalFlip={effectiveVerticalFlip}
          imageSize={rsvpUseDefaultDivider ? (data.universalDividerImageSize ?? 100) : (data.rsvpDividerImageSize ?? 100)}
          baseHeight={desktopMode ? 200 : 120}
          horizontalMargin={desktopMode ? 80 : 48}
          customImageUrl1={rsvpUseDefaultDivider ? (data.universalDividerCustomImageUrl1 || "/assets/divdr-1.png") : (data.rsvpDividerCustomImageUrl1 || "/assets/divdr-1.png")}
          customImageUrl2={rsvpUseDefaultDivider ? (data.universalDividerCustomImageUrl2 || "/assets/divdr-2.png") : (data.rsvpDividerCustomImageUrl2 || "/assets/divdr-2.png")}
          customImageUrl3={rsvpUseDefaultDivider ? (data.universalDividerCustomImageUrl3 || "/assets/divdr-3.png") : (data.rsvpDividerCustomImageUrl3 || "/assets/divdr-3.png")}
          colorBlend={rsvpUseDefaultDivider ? (data.universalDividerColorBlend ?? false) : (data.rsvpDividerColorBlend ?? false)}
          onClick={editMode ? (newType) => {
            if (rsvpUseDefaultDivider) {
              onChange?.("rsvpDividerUseDefault", false);
            }
            onChange?.("rsvpDivider", newType);
          } : undefined}
          onLongPress={editMode ? () => {
            setShowDividerSettingsPanel(true);
            const element = document.getElementById('rsvp-cssid');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          } : undefined}
        />
        {showDividerSettingsPanel && (
          <DividerSettingsPanel
            title="RSVP Divider Settings"
            isClosing={isDividerSettingsClosing}
            onClose={handleCloseDividerSettingsPanel}
            isDarkMode={isDarkMode}
            desktopMode={desktopMode}
            panelPosition={panelPosition}
            dividerType={data.rsvpDivider && data.rsvpDivider !== "none" ? data.rsvpDivider : "divider-1"}
            onDividerTypeChange={(value) => onChange?.("rsvpDivider", value)}
            tintColor={data.rsvpDividerTintColor || data.mainColor2}
            onTintColorChange={(value) => onChange?.("rsvpDividerTintColor", value)}
            tintOpacity={data.rsvpDividerTintOpacity ?? 100}
            onTintOpacityChange={(value) => onChange?.("rsvpDividerTintOpacity", value)}
            dividerStyle={data.rsvpDividerStyle || "centered-single"}
            onDividerStyleChange={(value) => onChange?.("rsvpDividerStyle", value)}
            flip={data.rsvpDividerFlip ?? false}
            onFlipChange={(value) => onChange?.("rsvpDividerFlip", value)}
            spacing={data.rsvpDividerSpacing ?? -80}
            onSpacingChange={(value) => onChange?.("rsvpDividerSpacing", value)}
            pullDown={data.rsvpDividerPullDown ?? 0}
            onPullDownChange={(value) => onChange?.("rsvpDividerPullDown", value)}
            verticalFlip={data.rsvpDividerVerticalFlip ?? false}
            onVerticalFlipChange={(value) => onChange?.("rsvpDividerVerticalFlip", value)}
            imageSize={data.rsvpDividerImageSize ?? 100}
            onImageSizeChange={(value) => onChange?.("rsvpDividerImageSize", value)}
            predefinedColors={predefinedSectionColors.map(c => c.value)}
            accentColor={accentColor}
            customImageUrl1={data.rsvpDividerCustomImageUrl1 || "/assets/divdr-1.png"}
            onCustomImageUrl1Change={(value) => onChange?.("rsvpDividerCustomImageUrl1", value)}
            customImageUrl2={data.rsvpDividerCustomImageUrl2 || "/assets/divdr-2.png"}
            onCustomImageUrl2Change={(value) => onChange?.("rsvpDividerCustomImageUrl2", value)}
            customImageUrl3={data.rsvpDividerCustomImageUrl3 || "/assets/divdr-3.png"}
            onCustomImageUrl3Change={(value) => onChange?.("rsvpDividerCustomImageUrl3", value)}
            predefinedDividerImages={data.rsvpDivider === "divider-1" ? predefinedDividerImagesCentered : data.rsvpDivider === "divider-2" ? predefinedDividerImagesSplit : predefinedDividerImagesMirrored}
            useDefault={rsvpUseDefaultDivider}
            onUseDefaultChange={(value) => onChange?.("rsvpDividerUseDefault", value)}
            colorBlend={data.rsvpDividerColorBlend ?? false}
            onColorBlendChange={(value) => onChange?.("rsvpDividerColorBlend", value)}
          />
        )}
      
      {/* Section heading - clickable in edit mode */}
      <div>
        {getTopText() && (
          <p
            className="text-center mb-1 md:mb-6 uppercase scale-[0.7] md:scale-100"
            style={{ 
              color: mergedData.rsvpUseMainColor !== false ? data.neutralColor1 : (mergedData.rsvpBottomTextColor || data.neutralColor1), 
              fontFamily: mergedData.rsvpUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.rsvpTopTextTypography || data.headingFont, "heading"),
              fontSize: `${(mergedData.rsvpTopTextFontSize || 100) / 100}rem`
            }}
          >
            <span
              className={editMode ? "cursor-pointer" : ""}
              onClick={() => editMode && setShowSettingsPanel(true)}
            >
              {getTopText()}
            </span>
          </p>
        )}
        
        <h2
          className="text-xl mb-1 md:mb-6 text-center font-bold uppercase scale-[0.55] md:scale-100"
          style={{ 
            color: mergedData.rsvpUseMainColor !== false ? data.mainColor2 : (mergedData.rsvpHeaderColor || data.mainColor2), 
            fontFamily: mergedData.rsvpUseMainColor !== false ? getFontFamily(data.headingFont, "heading") : getFontFamily(mergedData.rsvpHeaderTypography || data.headingFont, "heading"),
            fontSize: `${(mergedData.rsvpHeaderFontSize || 100) * 3}%`,
            lineHeight: '1.2'
          }}
        >
          <span
            className={editMode ? "cursor-pointer" : ""}
            onClick={() => editMode && setShowSettingsPanel(true)}
          >
            {getHeader()}
          </span>
        </h2>

        {getBottomText() && (
          <p
            className="text-center text-sm mb-2 md:mb-6 scale-[0.7] md:scale-100"
            style={{ 
              color: mergedData.rsvpUseMainColor !== false ? data.neutralColor1 : (mergedData.rsvpBottomTextColor || data.neutralColor1), 
              opacity: 0.7, 
              fontFamily: mergedData.rsvpUseMainColor !== false ? getFontFamily(data.bodyFont, "body") : getFontFamily(mergedData.rsvpBottomTextTypography || data.bodyFont, "body"),
              fontSize: `${(mergedData.rsvpBottomTextFontSize || 100) / 100 * 0.85}rem`
            }}
          >
            <span
              className={editMode ? "cursor-pointer" : ""}
              onClick={() => editMode && setShowSettingsPanel(true)}
            >
              {getBottomText()}
            </span>
          </p>
        )}
      </div>

      {submitted ? (
        <div className="py-8 flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={data.mainColor2} strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3
            className="text-2xl"
            style={{ color: data.mainColor2, fontFamily: getFontFamily(data.headingFont, "heading") }}
          >
            Thank you!
          </h3>
          <p
            className="text-sm"
            style={{ color: data.neutralColor1, opacity: 0.7, fontFamily: getFontFamily(data.bodyFont, "body") }}
          >
            Your response has been received.
          </p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          {/* Crystal Container */}
          <div 
            className={`backdrop-blur-md ${crystalColors.bg10} rounded-2xl p-6 border ${crystalColors.borderWhite20} shadow-xl relative overflow-hidden w-96 mx-auto ${editMode ? 'cursor-pointer' : ''}`}
            style={{
              backgroundColor: crystalColors.bg10Style || undefined,
              borderColor: crystalColors.borderWhite20Style || undefined
            }}
            onClick={() => editMode && setShowRsvpSettingsPanel(true)}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"
              style={{
                backgroundColor: crystalColors.bg5Style || undefined
              }}
            ></div>
          
            <div className="relative z-10 space-y-3">
              {/* Search box */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={data.mainColor2} strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <h3
                    className="text-lg"
                    style={{ color: data.mainColor2, fontFamily: `${data.headingFont}, serif` }}
                  >
                    Find Your Name
                  </h3>
                </div>
                <p
                  className="text-sm"
                  style={{ color: data.neutralColor1, opacity: 0.7, fontFamily: `${data.bodyFont}, serif` }}
                >
                  Type as you see instant results
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type your name..."
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors text-sm"
                    style={{
                      borderColor: crystalColors.borderWhite20Style || 'rgba(255, 255, 255, 0.2)',
                      color: data.mainColor2,
                      fontFamily: `${data.bodyFont}, serif`,
                      backgroundColor: crystalColors.bg10Style || 'rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search results - outside crystal container */}
          {searchQuery && (
            <div 
              className={`backdrop-blur-md ${crystalColors.bg10} rounded-2xl border ${crystalColors.borderWhite20} shadow-xl relative overflow-hidden w-96 mx-auto`}
              style={{
                backgroundColor: crystalColors.bg10Style || undefined,
                borderColor: crystalColors.borderWhite20Style || undefined
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"
                style={{
                  backgroundColor: crystalColors.bg5Style || undefined
                }}
              ></div>
              
              <div className="relative z-10">
                {filteredGuests.length > 0 ? (
                  <ul 
                    className="space-y-0 max-h-[220px] overflow-y-auto rsvp-search-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {filteredGuests.map((guest, index) => (
                      <li key={index}>
                        <div
                          onClick={() => {
                            const guestName = typeof guest === 'string' ? guest : guest.name;
                            const guestTitle = typeof guest === 'string' ? "M" : guest.title;
                            setSelectedGuest({ name: guestName, title: guestTitle });
                            setSelectedAttendance(null);
                            setShowLightbox(true);
                            setSearchQuery("");
                          }}
                          className="text-sm text-left cursor-pointer hover:opacity-80 transition-opacity px-4 py-2 flex items-center gap-3"
                          style={{
                            color: data.mainColor2,
                            fontFamily: `${data.bodyFont}, serif`
                          }}
                        >
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: accentColor + '33' || 'rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          {typeof guest === 'string' ? guest : guest.name}
                        </div>
                        {index < filteredGuests.length - 1 && (
                          <div
                            className="w-full"
                            style={{
                              height: '1px',
                              backgroundColor: crystalColors.borderWhite20Style || 'rgba(255, 255, 255, 0.2)'
                            }}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className="text-sm text-center px-4 py-2"
                    style={{ color: data.neutralColor1, opacity: 0.7, fontFamily: `${data.bodyFont}, serif` }}
                  >
                    No matching names found
                  </p>
                )}
              </div>
            </div>
          )}

          <style>{`
            .rsvp-search-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .rsvp-search-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
            }
            .rsvp-search-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 3px;
            }
            .rsvp-search-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          `}</style>

          {/* Spacer */}
          <div style={{ height: '50px' }}></div>
        </div>
      )}
      </div>

      {/* RSVP Lightbox */}
      {showLightbox && selectedGuest && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50"
            style={{ backgroundColor: data.mainColor1 ? data.mainColor1 + 'CC' : 'rgba(255, 255, 255, 0.8)' }}
            onClick={() => setShowLightbox(false)}
          />
          
          {/* Lightbox Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="pointer-events-auto shadow-2xl relative overflow-hidden"
              style={{
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '3/4',
                borderRadius: '8px',
                isolation: 'isolate',
                ...(data.rsvpPaperBackground && data.rsvpPaperBackground !== 'none' ? {
                  backgroundImage: `url(/assets/texturebg${data.rsvpPaperBackground.replace('texture', '')}.jpg)`,
                  backgroundSize: `${data.rsvpPaperBackgroundZoom || 100}%`,
                  backgroundPosition: `center ${data.rsvpPaperBackgroundYPosition || 0}%`,
                  backgroundRepeat: 'no-repeat'
                } : {})
              }}
            >
              {/* Paper color layer with hue blend - inside container with rounded edges */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: data.rsvpPaperColor || '#ffffff',
                  mixBlendMode: 'hue'
                }}
              />
              {/* Paper Container Content */}
              <div className="h-full flex flex-col items-center justify-start p-8 space-y-6 relative z-10">
                {/* RSVP Heading */}
                <h2
                  className="text-3xl font-bold text-center"
                  style={{ 
                    color: data.rsvpPaperTextColor || data.mainColor2,
                    fontFamily: `${data.rsvpPaperHeadingFont || data.headingFont}, serif`
                  }}
                >
                  {data.rsvpCardHeadingText || "RSVP"}
                </h2>
                
                {/* Deadline */}
                {data.rsvpDeadline && (() => {
                  const deadlineFormat = predefinedDeadlineTexts.find(
                    dt => dt.prefix === (data.rsvpDeadlineText || "RSVP by")
                  ) || predefinedDeadlineTexts[0];
                  if (deadlineFormat.hasLineBreak) {
                    return (
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ 
                            color: data.rsvpPaperTextColor || data.mainColor2,
                            opacity: 0.7,
                            fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                          }}
                        >
                          {deadlineFormat.prefix}
                        </p>
                        <p
                          className="text-xs"
                          style={{ 
                            color: data.rsvpPaperTextColor || data.mainColor2,
                            opacity: 0.7,
                            fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                          }}
                        >
                          {data.rsvpDeadline}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <p
                        className="text-sm text-center"
                        style={{ 
                          color: data.rsvpPaperTextColor || data.mainColor2,
                          opacity: 0.7,
                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                        }}
                      >
                        {deadlineFormat.prefix} {data.rsvpDeadline}
                      </p>
                    );
                  }
                })()}
                
                <div className="h-4" />
                
                {/* Guest Name */}
                <div className="w-full justify-center">
                  <span
                    className={`text-sm block text-center ${(data.rsvpGuestNameStyle || 0) < 2 ? 'underline' : ''}`}
                    style={{
                      color: data.rsvpPaperTextColor || data.mainColor2,
                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                    }}
                  >
                    {(() => {
                      const style = data.rsvpGuestNameStyle || 0;
                      const showHonorific = style === 0 || style === 2;
                      if (showHonorific) {
                        return selectedGuest?.title === 'M' ? selectedGuest.name : `${selectedGuest?.title} ${selectedGuest?.name}`;
                      } else {
                        return selectedGuest?.name;
                      }
                    })()}
                  </span>
                </div>
                
                {/* Reserved Text */}
                <p
                  className="text-center text-sm"
                  style={{
                    color: data.rsvpPaperTextColor || data.mainColor2,
                    fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`,
                    whiteSpace: 'pre-wrap'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: getReservedTextForGuest(selectedGuest?.name || "")
                  }}
                />
                
                {/* Response Display or Form */}
                {existingResponse ? (
                  /* Guest has already responded - show thank you message */
                  <div className="mt-6 flex flex-col items-center gap-4">
                    {/* Icon in circle */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: data.rsvpPaperTextColor || data.mainColor2
                      }}
                    >
                      <img
                        src="/assets/ico-sent.png"
                        alt="Sent"
                        style={{
                          width: '24px',
                          height: '24px',
                          filter: 'brightness(0) invert(1)'
                        }}
                      />
                    </div>
                    <p
                      className="text-center text-sm"
                      style={{
                        color: data.rsvpPaperTextColor || data.mainColor2,
                        fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                      }}
                    >
                      {existingResponse.attendance === 'attending' 
                        ? (data.rsvpAttendingThankYouText || "Thank you for attending!")
                        : existingResponse.message 
                          ? (data.rsvpNotAttendingWithMessageThankYouText || "Thank You For Your Well Wishes")
                          : (data.rsvpNotAttendingThankYouText || "Thank you for letting us know.")
                      }
                    </p>
                  </div>
                ) : (
                  /* Guest has not responded - show form */
                  <>
                    {/* Attendance Options */}
                    <div className="flex flex-col items-start gap-4">
                      <div
                        onClick={() => setSelectedAttendance('celebrate')}
                        className="flex items-center gap-3 cursor-pointer"
                        style={{
                          opacity: selectedAttendance === 'celebrate' ? 1 : 0.5
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: data.rsvpPaperTextColor || data.mainColor2,
                            backgroundColor: selectedAttendance === 'celebrate' ? (data.rsvpPaperTextColor || data.mainColor2) : 'transparent'
                          }}
                        >
                          {selectedAttendance === 'celebrate' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-xs"
                          style={{
                            color: data.rsvpPaperTextColor || data.mainColor2,
                            fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                          }}
                        >
                          {(() => {
                            const attendanceText = predefinedAttendanceTexts.find(
                              at => at.attending === (data.rsvpAttendanceText || "CAN'T WAIT TO CELEBRATE")
                            ) || predefinedAttendanceTexts[0];
                            return attendanceText.attending;
                          })()}
                        </span>
                      </div>
                      
                      <div
                        onClick={() => setSelectedAttendance('toast')}
                        className="flex items-center gap-3 cursor-pointer"
                        style={{
                          opacity: selectedAttendance === 'toast' ? 1 : 0.5
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: data.rsvpPaperTextColor || data.mainColor2,
                            backgroundColor: selectedAttendance === 'toast' ? (data.rsvpPaperTextColor || data.mainColor2) : 'transparent'
                          }}
                        >
                          {selectedAttendance === 'toast' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-xs"
                          style={{
                            color: data.rsvpPaperTextColor || data.mainColor2,
                            fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                          }}
                        >
                          {(() => {
                            const attendanceText = predefinedAttendanceTexts.find(
                              at => at.attending === (data.rsvpAttendanceText || "CAN'T WAIT TO CELEBRATE")
                            ) || predefinedAttendanceTexts[0];
                            return attendanceText.notAttending;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="w-3/4 mx-auto relative">
                      <textarea
                        id="rsvp-message-input"
                        value={guestMessage}
                        onChange={(e) => setGuestMessage(e.target.value.slice(0, 160))}
                        placeholder="Add a message (optional)"
                        className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
                        style={{
                          backgroundColor: `${data.rsvpPaperTextColor || data.mainColor2}15`,
                          color: data.rsvpPaperTextColor || data.mainColor2,
                          fontFamily: `${data.bodyFont}, serif`,
                          border: `1px solid ${data.rsvpPaperTextColor || data.mainColor2}33`
                        }}
                        rows={4}
                        maxLength={160}
                      />
                      <span 
                        className="absolute bottom-2 right-3 pointer-events-none"
                        style={{ 
                          color: `${data.rsvpPaperTextColor || data.mainColor2}99`,
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '9px',
                          opacity: 0.7
                        }}
                      >
                        {guestMessage.length}/160
                      </span>
                    </div>
                    <style>{`
                      #rsvp-message-input::placeholder {
                        color: ${data.rsvpPaperTextColor || data.mainColor2}99;
                        opacity: 0.6;
                        font-size: 11px;
                        font-family: 'Inter', sans-serif;
                      }
                    `}</style>

                    {/* Submit Button */}
                    <button
                      onClick={handleLightboxSubmit}
                      disabled={isSubmitting || submitSuccess || !selectedAttendance}
                      className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: data.rsvpPaperTextColor || data.mainColor2,
                        color: '#ffffff',
                        fontFamily: `${data.bodyFont}, serif`,
                        opacity: (isSubmitting || submitSuccess || !selectedAttendance) ? 0.7 : 1
                      }}
                    >
                      {isSubmitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* RSVP Settings Panel */}
      {showRsvpSettingsPanel && (
        <>
          {/* Backdrop */}
          {!isClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseRsvpSettingsPanel} onWheel={handleCloseRsvpSettingsPanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
            }`}
            style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          >
            {/* Handle bar - only show in mobile mode */}
            {!desktopMode && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                RSVP Settings
              </h3>
              <button
                type="button"
                onClick={handleCloseRsvpSettingsPanel}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Typography */}
              <div className="space-y-4">
                <h4 className={`text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Typography
                </h4>
                
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Heading
                  </label>
                  <HybridFontControl
                    label=""
                    value={pendingRsvpSettingsChanges.rsvpPaperHeadingFont !== undefined ? pendingRsvpSettingsChanges.rsvpPaperHeadingFont : (data.rsvpPaperHeadingFont || data.headingFont)}
                    onChange={(value) => handleRsvpSettingsChange("rsvpPaperHeadingFont", value)}
                    type="heading"
                    predefinedFonts={predefinedHeadingFonts.map(opt => opt.value)}
                    isDarkMode={isDarkMode}
                    showPreview={false}
                    accentColor={accentColor}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Body
                  </label>
                  <HybridFontControl
                    label=""
                    value={pendingRsvpSettingsChanges.rsvpPaperBodyFont !== undefined ? pendingRsvpSettingsChanges.rsvpPaperBodyFont : (data.rsvpPaperBodyFont || data.bodyFont)}
                    onChange={(value) => handleRsvpSettingsChange("rsvpPaperBodyFont", value)}
                    type="body"
                    predefinedFonts={predefinedBodyFonts.map(opt => opt.value)}
                    isDarkMode={isDarkMode}
                    showPreview={false}
                    accentColor={accentColor}
                  />
                </div>
              </div>

              {/* Color */}
              <div className="space-y-4">
                <h4 className={`text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Color
                </h4>
                <ColorControl
                  label=""
                  value={pendingRsvpSettingsChanges.rsvpPaperTextColor !== undefined ? pendingRsvpSettingsChanges.rsvpPaperTextColor : (data.rsvpPaperTextColor || data.mainColor2)}
                  onChange={(value) => handleRsvpSettingsChange("rsvpPaperTextColor", value)}
                  predefinedColors={predefinedSectionColors.map(opt => opt.value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                />
              </div>

              {/* Paper Container */}
              <div className="space-y-4">
                <h4 className={`text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Paper Container
                </h4>

                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Paper Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={pendingRsvpSettingsChanges.rsvpPaperColor !== undefined ? pendingRsvpSettingsChanges.rsvpPaperColor : (data.rsvpPaperColor || "#ffffff")}
                        onChange={(e) => handleRsvpSettingsChange("rsvpPaperColor", e.target.value)}
                        className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={pendingRsvpSettingsChanges.rsvpPaperColor !== undefined ? pendingRsvpSettingsChanges.rsvpPaperColor : (data.rsvpPaperColor || "#ffffff")}
                      onChange={(e) => handleRsvpSettingsChange("rsvpPaperColor", e.target.value)}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                    Paper Background
                  </label>
                  <select
                    value={pendingRsvpSettingsChanges.rsvpPaperBackground !== undefined ? pendingRsvpSettingsChanges.rsvpPaperBackground : (data.rsvpPaperBackground || "none")}
                    onChange={(e) => handleRsvpSettingsChange("rsvpPaperBackground", e.target.value as "texture1" | "texture2" | "texture3" | "texture4" | "texture5" | "none")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                    style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                  >
                    <option value="none">None</option>
                    <option value="texture1">Texture 1</option>
                    <option value="texture2">Texture 2</option>
                    <option value="texture3">Texture 3</option>
                    <option value="texture4">Texture 4</option>
                    <option value="texture5">Texture 5</option>
                  </select>
                </div>

                {data.rsvpPaperBackground && data.rsvpPaperBackground !== "none" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          Background Zoom
                        </label>
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {data.rsvpPaperBackgroundZoom || 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={pendingRsvpSettingsChanges.rsvpPaperBackgroundZoom !== undefined ? pendingRsvpSettingsChanges.rsvpPaperBackgroundZoom : (data.rsvpPaperBackgroundZoom || 100)}
                        onChange={(e) => handleRsvpSettingsChange("rsvpPaperBackgroundZoom", parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          accentColor: accentColor,
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((data.rsvpPaperBackgroundZoom || 100) - 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((data.rsvpPaperBackgroundZoom || 100) - 50) / 100 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          BACKGROUND VERTICAL POSITION
                        </label>
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {data.rsvpPaperBackgroundYPosition || 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="150"
                        value={pendingRsvpSettingsChanges.rsvpPaperBackgroundYPosition !== undefined ? pendingRsvpSettingsChanges.rsvpPaperBackgroundYPosition : (data.rsvpPaperBackgroundYPosition || 0)}
                        onChange={(e) => handleRsvpSettingsChange("rsvpPaperBackgroundYPosition", parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          accentColor: accentColor,
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((data.rsvpPaperBackgroundYPosition || 0) + 50) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((data.rsvpPaperBackgroundYPosition || 0) + 50) / 200 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h4 className={`text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  PREVIEW ({previewCardIndex === 0 ? 'DEFAULT' : previewCardIndex === 1 ? 'ATTENDING' : previewCardIndex === 2 ? 'NOT ATTENDING' : previewCardIndex === 3 ? 'ATTENDING + MESSAGE' : 'SPECIAL GUEST MESSAGE'})
                </h4>
                <div className="w-full flex justify-center p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1C2531' : '#F3F4F6' }}>
                  <div className="w-full" style={{ maxWidth: '350px' }}>
                    {/* Swipeable Card Container */}
                    <div
                      className="relative overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
                      style={{ aspectRatio: '3/4' }}
                      onMouseDown={(e) => {
                        (e.currentTarget as HTMLElement).dataset.startX = String(e.clientX);
                        (e.currentTarget as HTMLElement).dataset.isDragging = 'true';
                      }}
                      onMouseUp={(e) => {
                        const isDragging = (e.currentTarget as HTMLElement).dataset.isDragging === 'true';
                        if (!isDragging) return;
                        (e.currentTarget as HTMLElement).dataset.isDragging = 'false';
                        const startX = parseFloat((e.currentTarget as HTMLElement).dataset.startX || '0');
                        const diff = e.clientX - startX;
                        if (Math.abs(diff) > 50) {
                          if (diff > 0 && previewCardIndex > 0) {
                            setPreviewCardIndex(previewCardIndex - 1);
                          } else if (diff < 0 && previewCardIndex < 4) {
                            setPreviewCardIndex(previewCardIndex + 1);
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).dataset.isDragging = 'false';
                      }}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
                      }}
                      onTouchMove={(e) => {
                        // Prevent scrolling while swiping
                        e.preventDefault();
                      }}
                      onTouchEnd={(e) => {
                        const touch = e.changedTouches[0];
                        const startX = parseFloat((e.currentTarget as HTMLElement).dataset.startX || '0');
                        const diff = touch.clientX - startX;
                        if (Math.abs(diff) > 50) {
                          if (diff > 0 && previewCardIndex > 0) {
                            setPreviewCardIndex(previewCardIndex - 1);
                          } else if (diff < 0 && previewCardIndex < 4) {
                            setPreviewCardIndex(previewCardIndex + 1);
                          }
                        }
                      }}
                    >
                      {/* Cards */}
                      <div
                        className="flex transition-transform duration-300 ease-in-out h-full"
                        style={{ transform: `translateX(-${previewCardIndex * 100}%)` }}
                      >
                      {((data: InvitationData, onChange: (key: keyof InvitationData, value: any) => void) => (
                      <>
                        {/* Card 0: Default (Form) */}
                        <div className="w-full flex-shrink-0 h-full">
                          <div 
                            className="shadow-2xl relative overflow-hidden h-full"
                            style={{
                              borderRadius: '8px',
                              isolation: 'isolate',
                              ...(data.rsvpPaperBackground && data.rsvpPaperBackground !== 'none' ? {
                                backgroundImage: `url(/assets/texturebg${data.rsvpPaperBackground.replace('texture', '')}.jpg)`,
                                backgroundSize: `${data.rsvpPaperBackgroundZoom || 100}%`,
                                backgroundPosition: `center ${data.rsvpPaperBackgroundYPosition || 0}%`,
                                backgroundRepeat: 'no-repeat'
                              } : {})
                            }}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundColor: data.rsvpPaperColor || '#ffffff',
                                mixBlendMode: 'hue'
                              }}
                            />
                            <div className="h-full flex flex-col items-center justify-center p-4 space-y-3 relative z-10">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentIndex = predefinedRsvpHeadings.indexOf(data.rsvpCardHeadingText || "RSVP");
                                  const nextIndex = (currentIndex + 1) % predefinedRsvpHeadings.length;
                                  onChange("rsvpCardHeadingText", predefinedRsvpHeadings[nextIndex]);
                                }}
                                className="flex items-center gap-1 group"
                              >
                                <h2
                                  className="text-3xl font-bold text-center"
                                  style={{ 
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    fontFamily: `${data.rsvpPaperHeadingFont || data.headingFont}, serif`
                                  }}
                                >
                                  {data.rsvpCardHeadingText || "RSVP"}
                                </h2>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    opacity: 0.6
                                  }}
                                >
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                              </button>
                              {data.rsvpDeadline && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIndex = predefinedDeadlineTexts.findIndex(
                                      dt => dt.prefix === (data.rsvpDeadlineText || "RSVP by")
                                    );
                                    const nextIndex = (currentIndex + 1) % predefinedDeadlineTexts.length;
                                    onChange("rsvpDeadlineText", predefinedDeadlineTexts[nextIndex].prefix);
                                  }}
                                  className="flex items-center gap-1 group"
                                >
                                  {(() => {
                                    const deadlineFormat = predefinedDeadlineTexts.find(
                                      dt => dt.prefix === (data.rsvpDeadlineText || "RSVP by")
                                    ) || predefinedDeadlineTexts[0];
                                    if (deadlineFormat.hasLineBreak) {
                                      return (
                                        <div className="text-center">
                                          <p
                                            className="text-xs"
                                            style={{ 
                                              color: data.rsvpPaperTextColor || data.mainColor2,
                                              opacity: 0.7,
                                              fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                            }}
                                          >
                                            {deadlineFormat.prefix}
                                          </p>
                                          <p
                                            className="text-xs"
                                            style={{ 
                                              color: data.rsvpPaperTextColor || data.mainColor2,
                                              opacity: 0.7,
                                              fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                            }}
                                          >
                                            {data.rsvpDeadline}
                                          </p>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <p
                                          className="text-xs text-center"
                                          style={{ 
                                            color: data.rsvpPaperTextColor || data.mainColor2,
                                            opacity: 0.7,
                                            fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                          }}
                                        >
                                          {deadlineFormat.prefix} {data.rsvpDeadline}
                                        </p>
                                      );
                                    }
                                  })()}
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      opacity: 0.6
                                    }}
                                  >
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                  </svg>
                                </button>
                              )}
                              <div className="h-8" />
                              <div className="w-full flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentStyle = data.rsvpGuestNameStyle || 0;
                                    const nextStyle = (currentStyle + 1) % 4;
                                    onChange("rsvpGuestNameStyle", nextStyle);
                                  }}
                                  className="flex items-center gap-1 group"
                                >
                                  <span
                                    className={`text-sm block text-center ${(data.rsvpGuestNameStyle || 0) < 2 ? 'underline' : ''}`}
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                    }}
                                  >
                                    {(() => {
                                      const style = data.rsvpGuestNameStyle || 0;
                                      const showHonorific = style === 0 || style === 2;
                                      return showHonorific ? "M. " : "";
                                    })()}Guest Name
                                  </span>
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      opacity: 0.6
                                    }}
                                  >
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                  </svg>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentIndex = predefinedReservedTexts.indexOf(data.rsvpReservedText || "We have reserve a seat in your honor.");
                                  const nextIndex = (currentIndex + 1) % predefinedReservedTexts.length;
                                  onChange("rsvpReservedText", predefinedReservedTexts[nextIndex]);
                                }}
                                className="flex items-center gap-1 group"
                              >
                                <p
                                  className="text-center text-sm"
                                  style={{
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`,
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {data.rsvpReservedText || "We have reserve a seat in your honor."}
                                </p>
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    opacity: 0.6
                                  }}
                                >
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                              </button>
                              <div className="w-full flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIndex = predefinedAttendanceTexts.findIndex(
                                      at => at.attending === (data.rsvpAttendanceText || "Can't Wait to Celebrate")
                                    );
                                    const nextIndex = (currentIndex + 1) % predefinedAttendanceTexts.length;
                                    onChange("rsvpAttendanceText", predefinedAttendanceTexts[nextIndex].attending);
                                  }}
                                  className="flex flex-col items-center justify-center gap-2"
                                >
                                <div className="flex items-center justify-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                    style={{
                                      borderColor: accentColor,
                                      backgroundColor: accentColor
                                    }}
                                  >
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                  </div>
                                  <span
                                    className="text-xs"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                    }}
                                  >
                                    {(() => {
                                      const attendanceText = predefinedAttendanceTexts.find(
                                        at => at.attending === (data.rsvpAttendanceText || "Can't Wait to Celebrate")
                                      ) || predefinedAttendanceTexts[0];
                                      return attendanceText.attending;
                                    })()}
                                  </span>
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      opacity: 0.6
                                    }}
                                  >
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                  </svg>
                                </div>
                                <div className="flex items-center justify-center gap-2 opacity-50">
                                  <div
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{
                                      borderColor: data.rsvpPaperTextColor || data.mainColor2
                                    }}
                                  />
                                  <span
                                    className="text-xs"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                    }}
                                  >
                                    {(() => {
                                      const attendanceText = predefinedAttendanceTexts.find(
                                        at => at.attending === (data.rsvpAttendanceText || "Can't Wait to Celebrate")
                                      ) || predefinedAttendanceTexts[0];
                                      return attendanceText.notAttending;
                                    })()}
                                  </span>
                                </div>
                              </button>
                              </div>
                              <button
                                className="px-4 py-1.5 rounded text-xs font-medium transition-colors"
                                style={{
                                  backgroundColor: data.rsvpPaperTextColor || data.mainColor2,
                                  color: '#ffffff',
                                  fontFamily: `${data.bodyFont}, serif`
                                }}
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card 1: Attending */}
                        <div className="w-full flex-shrink-0 h-full">
                          <div 
                            className="shadow-2xl relative overflow-hidden h-full"
                            style={{
                              borderRadius: '8px',
                              isolation: 'isolate',
                              ...(data.rsvpPaperBackground && data.rsvpPaperBackground !== 'none' ? {
                                backgroundImage: `url(/assets/texturebg${data.rsvpPaperBackground.replace('texture', '')}.jpg)`,
                                backgroundSize: `${data.rsvpPaperBackgroundZoom || 100}%`,
                                backgroundPosition: `center ${data.rsvpPaperBackgroundYPosition || 0}%`,
                                backgroundRepeat: 'no-repeat'
                              } : {})
                            }}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundColor: data.rsvpPaperColor || '#ffffff',
                                mixBlendMode: 'hue'
                              }}
                            />
                            <div className="h-full flex flex-col items-center justify-center p-4 space-y-3 relative z-10">
                              <h2
                                className="text-3xl font-bold text-center"
                                style={{ 
                                  color: data.rsvpPaperTextColor || data.mainColor2,
                                  fontFamily: `${data.rsvpPaperHeadingFont || data.headingFont}, serif`
                                }}
                              >
                                {data.rsvpCardHeadingText || "RSVP"}
                              </h2>
                              {data.rsvpDeadline && (() => {
                                const deadlineFormat = predefinedDeadlineTexts.find(
                                  dt => dt.prefix === (data.rsvpDeadlineText || "RSVP by")
                                ) || predefinedDeadlineTexts[0];
                                if (deadlineFormat.hasLineBreak) {
                                  return (
                                    <div className="text-center">
                                      <p
                                        className="text-xs"
                                        style={{ 
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          opacity: 0.7,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {deadlineFormat.prefix}
                                      </p>
                                      <p
                                        className="text-xs"
                                        style={{ 
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          opacity: 0.7,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {data.rsvpDeadline}
                                      </p>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <p
                                      className="text-xs text-center"
                                      style={{ 
                                        color: data.rsvpPaperTextColor || data.mainColor2,
                                        opacity: 0.7,
                                        fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                      }}
                                    >
                                      {deadlineFormat.prefix} {data.rsvpDeadline}
                                    </p>
                                  );
                                }
                              })()}
                              <div className="h-8" />
                              <div className="w-full flex justify-center">
                                <span
                                  className={`text-sm block text-center ${(data.rsvpGuestNameStyle || 0) < 2 ? 'underline' : ''}`}
                                  style={{
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                  }}
                                >
                                  {(() => {
                                    const style = data.rsvpGuestNameStyle || 0;
                                    const showHonorific = style === 0 || style === 2;
                                    return showHonorific ? "M. " : "";
                                  })()}Guest Name
                                </span>
                              </div>
                              <p
                                className="text-center text-sm"
                                style={{
                                  color: data.rsvpPaperTextColor || data.mainColor2,
                                  fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                }}
                              >
                                {data.rsvpReservedText || "We have reserve a seat in your honor."}
                              </p>
                              <div className="mt-6 flex flex-col items-center gap-4">
                                <div
                                  className="flex items-center justify-center"
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: data.rsvpPaperTextColor || data.mainColor2
                                  }}
                                >
                                  <img
                                    src="/assets/ico-sent.png"
                                    alt="Sent"
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      filter: 'brightness(0) invert(1)'
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIndex = predefinedAttendingThankYouTexts.indexOf(data.rsvpAttendingThankYouText || "Thank you for attending!");
                                    const nextIndex = (currentIndex + 1) % predefinedAttendingThankYouTexts.length;
                                    onChange("rsvpAttendingThankYouText", predefinedAttendingThankYouTexts[nextIndex]);
                                  }}
                                  className="flex items-center gap-1 group"
                                >
                                  <p
                                    className="text-center text-sm"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                    }}
                                  >
                                    {data.rsvpAttendingThankYouText || "Thank you for attending!"}
                                  </p>
                                  <svg
                                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: data.rsvpPaperTextColor || data.mainColor2 }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Not Attending */}
                        <div className="w-full flex-shrink-0 h-full">
                          <div 
                            className="shadow-2xl relative overflow-hidden h-full"
                            style={{
                              borderRadius: '8px',
                              isolation: 'isolate',
                              ...(data.rsvpPaperBackground && data.rsvpPaperBackground !== 'none' ? {
                                backgroundImage: `url(/assets/texturebg${data.rsvpPaperBackground.replace('texture', '')}.jpg)`,
                                backgroundSize: `${data.rsvpPaperBackgroundZoom || 100}%`,
                                backgroundPosition: `center ${data.rsvpPaperBackgroundYPosition || 0}%`,
                                backgroundRepeat: 'no-repeat'
                              } : {})
                            }}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundColor: data.rsvpPaperColor || '#ffffff',
                                mixBlendMode: 'hue'
                              }}
                            />
                            <div className="h-full flex flex-col items-center justify-center p-4 space-y-3 relative z-10">
                              <h2
                                className="text-3xl font-bold text-center"
                                style={{ 
                                  color: data.rsvpPaperTextColor || data.mainColor2,
                                  fontFamily: `${data.rsvpPaperHeadingFont || data.headingFont}, serif`
                                }}
                              >
                                {data.rsvpCardHeadingText || "RSVP"}
                              </h2>
                              {data.rsvpDeadline && (() => {
                                const deadlineFormat = predefinedDeadlineTexts.find(
                                  dt => dt.prefix === (data.rsvpDeadlineText || "RSVP by")
                                ) || predefinedDeadlineTexts[0];
                                if (deadlineFormat.hasLineBreak) {
                                  return (
                                    <div className="text-center">
                                      <p
                                        className="text-xs"
                                        style={{ 
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          opacity: 0.7,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {deadlineFormat.prefix}
                                      </p>
                                      <p
                                        className="text-xs"
                                        style={{ 
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          opacity: 0.7,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {data.rsvpDeadline}
                                      </p>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <p
                                      className="text-xs text-center"
                                      style={{ 
                                        color: data.rsvpPaperTextColor || data.mainColor2,
                                        opacity: 0.7,
                                        fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                      }}
                                    >
                                      {deadlineFormat.prefix} {data.rsvpDeadline}
                                    </p>
                                  );
                                }
                              })()}
                              <div className="h-8" />
                              <div className="w-full flex justify-center">
                                <span
                                  className={`text-sm block text-center ${(data.rsvpGuestNameStyle || 0) < 2 ? 'underline' : ''}`}
                                  style={{
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                  }}
                                >
                                  {(() => {
                                    const style = data.rsvpGuestNameStyle || 0;
                                    const showHonorific = style === 0 || style === 2;
                                    return showHonorific ? "M. " : "";
                                  })()}Guest Name
                                </span>
                              </div>
                              <p
                                className="text-center text-sm"
                                style={{
                                  color: data.rsvpPaperTextColor || data.mainColor2,
                                  fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                }}
                              >
                                {data.rsvpReservedText || "We have reserve a seat in your honor."}
                              </p>
                              <div className="mt-6 flex flex-col items-center gap-4">
                                <div
                                  className="flex items-center justify-center"
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: data.rsvpPaperTextColor || data.mainColor2
                                  }}
                                >
                                  <img
                                    src="/assets/ico-sent.png"
                                    alt="Sent"
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      filter: 'brightness(0) invert(1)'
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIndex = predefinedNotAttendingThankYouTexts.indexOf(data.rsvpNotAttendingThankYouText || "Thank you for letting us know.");
                                    const nextIndex = (currentIndex + 1) % predefinedNotAttendingThankYouTexts.length;
                                    onChange("rsvpNotAttendingThankYouText", predefinedNotAttendingThankYouTexts[nextIndex]);
                                  }}
                                  className="flex items-center gap-1 group"
                                >
                                  <p
                                    className="text-center text-sm"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                    }}
                                  >
                                    {data.rsvpNotAttendingThankYouText || "Thank you for letting us know."}
                                  </p>
                                  <svg
                                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: data.rsvpPaperTextColor || data.mainColor2 }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Attending with Message */}
                        <div className="w-full flex-shrink-0 h-full">
                          <div 
                            className="shadow-2xl relative overflow-hidden h-full"
                            style={{
                              borderRadius: '8px',
                              isolation: 'isolate',
                              ...(data.rsvpPaperBackground && data.rsvpPaperBackground !== 'none' ? {
                                backgroundImage: `url(/assets/texturebg${data.rsvpPaperBackground.replace('texture', '')}.jpg)`,
                                backgroundSize: `${data.rsvpPaperBackgroundZoom || 100}%`,
                                backgroundPosition: `center ${data.rsvpPaperBackgroundYPosition || 0}%`,
                                backgroundRepeat: 'no-repeat'
                              } : {})
                            }}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundColor: data.rsvpPaperColor || '#ffffff',
                                mixBlendMode: 'hue'
                              }}
                            />
                            <div className="h-full flex flex-col items-center justify-center p-4 space-y-3 relative z-10">
                              <h2
                                className="text-3xl font-bold text-center"
                                style={{ 
                                  color: data.rsvpPaperTextColor || data.mainColor2,
                                  fontFamily: `${data.rsvpPaperHeadingFont || data.headingFont}, serif`
                                }}
                              >
                                {data.rsvpCardHeadingText || "RSVP"}
                              </h2>
                              {data.rsvpDeadline && (() => {
                                const deadlineFormat = predefinedDeadlineTexts.find(
                                  dt => dt.prefix === (data.rsvpDeadlineText || "RSVP by")
                                ) || predefinedDeadlineTexts[0];
                                if (deadlineFormat.hasLineBreak) {
                                  return (
                                    <div className="text-center">
                                      <p
                                        className="text-xs"
                                        style={{ 
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          opacity: 0.7,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {deadlineFormat.prefix}
                                      </p>
                                      <p
                                        className="text-xs"
                                        style={{ 
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          opacity: 0.7,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {data.rsvpDeadline}
                                      </p>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <p
                                      className="text-xs text-center"
                                      style={{ 
                                        color: data.rsvpPaperTextColor || data.mainColor2,
                                        opacity: 0.7,
                                        fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                      }}
                                    >
                                      {deadlineFormat.prefix} {data.rsvpDeadline}
                                    </p>
                                  );
                                }
                              })()}
                              <div className="h-8" />
                              <div className="w-full flex justify-center">
                                <span
                                  className={`text-sm block text-center ${(data.rsvpGuestNameStyle || 0) < 2 ? 'underline' : ''}`}
                                  style={{
                                    color: data.rsvpPaperTextColor || data.mainColor2,
                                    fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                  }}
                                >
                                  {(() => {
                                    const style = data.rsvpGuestNameStyle || 0;
                                    const showHonorific = style === 0 || style === 2;
                                    return showHonorific ? "M. " : "";
                                  })()}Guest Name
                                </span>
                              </div>
                              <p
                                className="text-center text-sm"
                                style={{
                                  color: data.rsvpPaperTextColor || data.mainColor2,
                                  fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                }}
                              >
                                {data.rsvpReservedText || "We have reserve a seat in your honor."}
                              </p>
                              <div className="mt-6 flex flex-col items-center gap-4">
                                <div
                                  className="flex items-center justify-center"
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: data.rsvpPaperTextColor || data.mainColor2
                                  }}
                                >
                                  <img
                                    src="/assets/ico-sent.png"
                                    alt="Sent"
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      filter: 'brightness(0) invert(1)'
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIndex = predefinedNotAttendingWithMessageThankYouTexts.indexOf(data.rsvpNotAttendingWithMessageThankYouText || "Thank You For Your Well Wishes");
                                    const nextIndex = (currentIndex + 1) % predefinedNotAttendingWithMessageThankYouTexts.length;
                                    onChange("rsvpNotAttendingWithMessageThankYouText", predefinedNotAttendingWithMessageThankYouTexts[nextIndex]);
                                  }}
                                  className="flex items-center gap-1 group"
                                >
                                  <p
                                    className="text-center text-sm"
                                    style={{
                                      color: data.rsvpPaperTextColor || data.mainColor2,
                                      fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                    }}
                                  >
                                    {data.rsvpNotAttendingWithMessageThankYouText || "Thank You For Your Well Wishes"}
                                  </p>
                                  <svg
                                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: data.rsvpPaperTextColor || data.mainColor2 }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 4: Special Guest Message */}
                        <div className="w-full flex-shrink-0 h-full">
                          <div 
                            className="shadow-2xl relative overflow-hidden h-full"
                            style={{
                              borderRadius: '8px',
                              isolation: 'isolate',
                              ...(data.rsvpPaperBackground && data.rsvpPaperBackground !== 'none' ? {
                                backgroundImage: `url(/assets/texturebg${data.rsvpPaperBackground.replace('texture', '')}.jpg)`,
                                backgroundSize: `${data.rsvpPaperBackgroundZoom || 100}%`,
                                backgroundPosition: `center ${data.rsvpPaperBackgroundYPosition || 0}%`,
                                backgroundRepeat: 'no-repeat'
                              } : {})
                            }}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundColor: data.rsvpPaperColor || '#ffffff',
                                mixBlendMode: 'hue'
                              }}
                            />
                            <div className="h-full flex flex-col p-4 relative z-10">
                              <style>{`
                                .hide-scrollbar::-webkit-scrollbar {
                                  display: none;
                                }
                                .hide-scrollbar {
                                  -ms-overflow-style: none;
                                  scrollbar-width: none;
                                }
                              `}</style>
                              <div className="overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                                {getAllEntourageTitles(data).map((item) => (
                                  <div key={item.key} className="flex flex-col gap-1">
                                    <p
                                      className="font-bold uppercase text-sm"
                                      style={{
                                        color: data.rsvpPaperTextColor || data.mainColor2,
                                        fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                      }}
                                    >
                                      {item.title}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => cycleTitleMessage(item.defaultTitle, data, onChange)}
                                      className="flex items-center justify-center gap-1 group text-center"
                                    >
                                      <p
                                        className="text-sm"
                                        style={{
                                          color: data.rsvpPaperTextColor || data.mainColor2,
                                          fontFamily: `${data.rsvpPaperBodyFont || data.bodyFont}, serif`
                                        }}
                                      >
                                        {replaceTitlePlaceholder(item.message, item.title)}
                                      </p>
                                      <svg
                                        className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ color: data.rsvpPaperTextColor || data.mainColor2 }}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                      ))({ ...data, ...pendingRsvpSettingsChanges } as InvitationData, handleRsvpSettingsChange)}
                      </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2 mt-4">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPreviewCardIndex(index)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: index === previewCardIndex 
                              ? accentColor
                              : (isDarkMode ? '#4B5563' : '#D1D5DB'),
                            width: index === previewCardIndex ? '16px' : '8px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Close button - outside scrollable area */}
            <div className={`px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-end ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <button
                type="button"
                onClick={handleCloseRsvpSettingsPanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: accentColor
                }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Section Design Panel */}
      {showSettingsPanel && (
        <>
          {/* Backdrop */}
          {!isClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleClosePanel} onWheel={handleClosePanel} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode 
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
            }`}
            style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          >
            {/* Handle bar - only show in mobile mode */}
            {!desktopMode && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                RSVP - Section Design
              </h3>
              <button
                type="button"
                onClick={() => {
                  handleChange("rsvpTopTextCustom", undefined);
                  handleChange("rsvpHeaderCustom", undefined);
                  handleChange("rsvpBottomTextCustom", undefined);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Reset
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Section Heading */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>SECTION HEADING</h4>
                
                {/* Heading Text */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Text</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.rsvpHeaderCustom ?? ""}
                      onChange={(e) => handleChange("rsvpHeaderCustom", e.target.value)}
                      placeholder="RSVP"
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedHeadings = ["RSVP", "Kindly reply", "Please respond", "Your response", "RSVP request"];
                        const currentText = mergedData.rsvpHeaderCustom || "";
                        const currentIndex = predefinedHeadings.indexOf(currentText);
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedHeadings.length - 1 ? 0 : currentIndex + 1;
                        handleChange("rsvpHeaderCustom", predefinedHeadings[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Generate heading"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.0 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.0 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Top Text */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Top Text</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.rsvpTopTextCustom ?? ""}
                      onChange={(e) => handleChange("rsvpTopTextCustom", e.target.value)}
                      placeholder="Confirm your attendance"
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const predefinedTexts = [
                          "Confirm your attendance",
                          "Reserve your spot",
                          "Lock in your seat",
                          "Verify your attendance",
                          "Secure your invitation",
                          "Register for this event",
                          "Claim your ticket",
                          "Let us know you're coming"
                        ];
                        const currentText = mergedData.rsvpTopTextCustom || "";
                        const currentIndex = predefinedTexts.indexOf(currentText);
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedTexts.length - 1 ? 0 : currentIndex + 1;
                        handleChange("rsvpTopTextCustom", predefinedTexts[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Generate text"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.0 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.0 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Font Type (Heading) */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE (Heading)</label>
                  <HybridFontControl
                    label=""
                    value={mergedData.rsvpHeaderTypography || data.headingFont}
                    onChange={(value) => handleChange("rsvpHeaderTypography", value)}
                    type="heading"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.rsvpUseMainColor !== false}
                    predefinedFonts={predefinedHeadingFonts}
                  />
                </div>
                
                {/* Heading Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Heading Size</label>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{mergedData.rsvpHeaderFontSize || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={mergedData.rsvpHeaderFontSize || 100}
                    onChange={(e) => handleChange("rsvpHeaderFontSize", parseInt(e.target.value))}
                    disabled={mergedData.rsvpUseMainColor !== false}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      accentColor: accentColor,
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((mergedData.rsvpHeaderFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${((mergedData.rsvpHeaderFontSize || 100) - 20) / 130 * 100}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                    }}
                  />
                </div>

                {/* Heading Color */}
                <ColorControl
                  label="Heading Color"
                  value={mergedData.rsvpHeaderColor || data.mainColor2}
                  onChange={(value) => handleChange("rsvpHeaderColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.rsvpUseMainColor !== false}
                  predefinedColors={predefinedSectionColors?.map(c => c.value)}
                />
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} pt-6`}></div>

              {/* Message Section */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>MESSAGE</h4>
                
                {/* Bottom Text */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Bottom Text</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mergedData.rsvpBottomTextCustom ?? ""}
                      onChange={(e) => handleChange("rsvpBottomTextCustom", e.target.value)}
                      placeholder={`Please respond by ${data.rsvpDeadline || "date"}`}
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                      style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const deadline = data.rsvpDeadline || "November 30, 2026";
                        const predefinedTexts = [
                          `Kindly reply by ${deadline}`,
                          `RSVP requested by ${deadline}`,
                          `Please respond by ${deadline}`,
                          `Kindly confirm by ${deadline}`,
                          `Responses due by ${deadline}`,
                          `Please RSVP by ${deadline}`,
                          `Kindly advise by ${deadline}`,
                          `Reply requested: ${deadline}`,
                          `Confirm attendance by ${deadline}`
                        ];
                        const currentText = mergedData.rsvpBottomTextCustom || "";
                        const currentIndex = predefinedTexts.indexOf(currentText);
                        const nextIndex = currentIndex === -1 || currentIndex === predefinedTexts.length - 1 ? 0 : currentIndex + 1;
                        handleChange("rsvpBottomTextCustom", predefinedTexts[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Generate text"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.0 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.0 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bottom Text Font */}
                <div className="space-y-1">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>FONT TYPE (Bottom Text)</label>
                  <HybridFontControl
                    label=""
                    value={mergedData.rsvpBottomTextTypography || data.bodyFont}
                    onChange={(value) => handleChange("rsvpBottomTextTypography", value)}
                    type="body"
                    showPreview={false}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    disabled={mergedData.rsvpUseMainColor !== false}
                    predefinedFonts={predefinedBodyFonts?.map(f => f.value)}
                  />
                </div>

                {/* Bottom Text Color */}
                <ColorControl
                  label="Message Color"
                  value={mergedData.rsvpBottomTextColor || data.neutralColor1}
                  onChange={(value) => handleChange("rsvpBottomTextColor", value)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  disabled={mergedData.rsvpUseMainColor !== false}
                  predefinedColors={predefinedSectionColors?.map(c => c.value)}
                />
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} pt-6`}></div>

              {/* Background Section */}
              <div className="space-y-6">
                <h4 className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>BACKGROUND</h4>
                <div className="space-y-2">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Type</label>
                  <select
                    value={mergedData.rsvpBackgroundType || "color"}
                    onChange={(e) => handleChange("rsvpBackgroundType", e.target.value)}
                    disabled={mergedData.rsvpUseMainColor !== false}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="color">Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                {/* Background Color */}
                {mergedData.rsvpBackgroundType === "color" && (
                  <div className="space-y-2">
                    <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Background Color</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={mergedData.rsvpBackgroundColor || data.mainColor1 || "#ffffff"}
                          onChange={(e) => handleChange("rsvpBackgroundColor", e.target.value)}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <input
                        type="text"
                        value={mergedData.rsvpBackgroundColor || data.mainColor1 || "#ffffff"}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('#')) {
                            value = '#' + value;
                          }
                          handleChange("rsvpBackgroundColor", value);
                        }}
                        disabled={mergedData.rsvpUseMainColor !== false}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                )}

                {/* Gradient */}
                {mergedData.rsvpBackgroundType === "gradient" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.rsvpGradient?.firstColor || data.mainColor1 || "#ffffff"}
                            onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstColor: e.target.value })}
                            disabled={mergedData.rsvpUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.rsvpGradient?.firstColor || data.mainColor1 || "#ffffff"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstColor: value });
                          }}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.rsvpGradient?.firstOpacity || 50}
                          onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.rsvpGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.rsvpGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.rsvpGradient?.firstOpacity || 50}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={mergedData.rsvpGradient?.secondColor || data.neutralColor2 || "#000000"}
                            onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondColor: e.target.value })}
                            disabled={mergedData.rsvpUseMainColor !== false}
                            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <input
                          type="text"
                          value={mergedData.rsvpGradient?.secondColor || data.neutralColor2 || "#000000"}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondColor: value });
                          }}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mergedData.rsvpGradient?.secondOpacity || 50}
                          onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondOpacity: parseInt(e.target.value) })}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={{
                            accentColor: accentColor,
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.rsvpGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.rsvpGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                          }}
                        />
                        <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.rsvpGradient?.secondOpacity || 50}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image */}
                {mergedData.rsvpBackgroundType === "image" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Image URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={mergedData.rsvpImage?.urls?.[0] || ""}
                          onChange={(e) => handleChange("rsvpImage", { urls: [e.target.value] })}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-16 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/image.jpg"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const nextIndex = (predefinedImageIndex + 1) % (predefinedImages.length || 1);
                              setPredefinedImageIndex(nextIndex);
                              handleChange("rsvpImage", { urls: [predefinedImages[nextIndex]?.value || ""] });
                            }}
                            disabled={mergedData.rsvpUseMainColor !== false}
                            className={`p-1 ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            style={{ color: accentColor }}
                            title="Cycle predefined images"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.0 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.0 0 0 0 6.74-2.74L21 16" />
                              <path d="M16 16h5v5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Gradient Overlay for Image */}
                    <div className="space-y-4">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={mergedData.rsvpGradient?.firstColor || data.mainColor1 || "#ffffff"}
                                onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstColor: e.target.value })}
                                disabled={mergedData.rsvpUseMainColor !== false}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={mergedData.rsvpGradient?.firstColor || data.mainColor1 || "#ffffff"}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstColor: value });
                              }}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              placeholder="#000000"
                              maxLength={7}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={mergedData.rsvpGradient?.firstOpacity || 50}
                              onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstOpacity: parseInt(e.target.value) })}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              style={{
                                accentColor: accentColor,
                                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.rsvpGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.rsvpGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                              }}
                            />
                            <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.rsvpGradient?.firstOpacity || 50}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={mergedData.rsvpGradient?.secondColor || data.neutralColor2 || "#000000"}
                                onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondColor: e.target.value })}
                                disabled={mergedData.rsvpUseMainColor !== false}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={mergedData.rsvpGradient?.secondColor || data.neutralColor2 || "#000000"}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondColor: value });
                              }}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              placeholder="#000000"
                              maxLength={7}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={mergedData.rsvpGradient?.secondOpacity || 50}
                              onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondOpacity: parseInt(e.target.value) })}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              style={{
                                accentColor: accentColor,
                                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.rsvpGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.rsvpGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                              }}
                            />
                            <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.rsvpGradient?.secondOpacity || 50}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video */}
                {mergedData.rsvpBackgroundType === "video" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Video URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={mergedData.rsvpVideo?.url || ""}
                          onChange={(e) => handleChange("rsvpVideo", { url: e.target.value })}
                          disabled={mergedData.rsvpUseMainColor !== false}
                          className={`w-full px-3 py-2 pr-16 text-sm border rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                          placeholder="https://example.com/video.mp4"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const nextIndex = (predefinedVideoIndex + 1) % (predefinedVideos.length || 1);
                              setPredefinedVideoIndex(nextIndex);
                              handleChange("rsvpVideo", { url: predefinedVideos[nextIndex]?.value || "" });
                            }}
                            disabled={mergedData.rsvpUseMainColor !== false}
                            className={`p-1 ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                            style={{ color: accentColor }}
                            title="Cycle predefined videos"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.0 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.0 0 0 0 6.74-2.74L21 16" />
                              <path d="M16 16h5v5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Gradient Overlay for Video */}
                    <div className="space-y-4">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Gradient Overlay</label>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 1</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={mergedData.rsvpGradient?.firstColor || data.mainColor1 || "#ffffff"}
                                onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstColor: e.target.value })}
                                disabled={mergedData.rsvpUseMainColor !== false}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={mergedData.rsvpGradient?.firstColor || data.mainColor1 || "#ffffff"}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstColor: value });
                              }}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              placeholder="#000000"
                              maxLength={7}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={mergedData.rsvpGradient?.firstOpacity || 50}
                              onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, firstOpacity: parseInt(e.target.value) })}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              style={{
                                accentColor: accentColor,
                                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.rsvpGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.rsvpGradient?.firstOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                              }}
                            />
                            <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.rsvpGradient?.firstOpacity || 50}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={`block text-xs text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color 2</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="color"
                                value={mergedData.rsvpGradient?.secondColor || data.neutralColor2 || "#000000"}
                                onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondColor: e.target.value })}
                                disabled={mergedData.rsvpUseMainColor !== false}
                                className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={mergedData.rsvpGradient?.secondColor || data.neutralColor2 || "#000000"}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value;
                                }
                                handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondColor: value });
                              }}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"} ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              placeholder="#000000"
                              maxLength={7}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={mergedData.rsvpGradient?.secondOpacity || 50}
                              onChange={(e) => handleChange("rsvpGradient", { ...mergedData.rsvpGradient, secondOpacity: parseInt(e.target.value) })}
                              disabled={mergedData.rsvpUseMainColor !== false}
                              className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${mergedData.rsvpUseMainColor !== false ? "opacity-50 cursor-not-allowed" : ""}`}
                              style={{
                                accentColor: accentColor,
                                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(mergedData.rsvpGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} ${(mergedData.rsvpGradient?.secondOpacity || 50)}%, ${isDarkMode ? "#4B5563" : "#E5E7EB"} 100%)`
                              }}
                            />
                            <span className={`text-xs w-12 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{mergedData.rsvpGradient?.secondOpacity || 50}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Apply button */}
            <div className="px-5 pt-4 pb-4 shrink-0 border-t flex items-center justify-between" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              {/* Apply Default Design Checkbox */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="rsvp-use-main-color"
                    checked={mergedData.rsvpUseMainColor !== false}
                    onChange={(e) => handleChange("rsvpUseMainColor", e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => {
                      const newValue = mergedData.rsvpUseMainColor === false;
                      handleChange("rsvpUseMainColor", newValue);
                    }}
                    className={`w-5 h-5 rounded border-2 cursor-pointer transition-colors flex items-center justify-center ${
                      mergedData.rsvpUseMainColor !== false
                        ? "border-transparent"
                        : isDarkMode
                          ? "border-gray-600 hover:border-gray-500"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{
                      backgroundColor: mergedData.rsvpUseMainColor !== false ? accentColor : "transparent"
                    }}
                  >
                    {mergedData.rsvpUseMainColor !== false && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <label
                  className={`text-sm cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                  onClick={() => {
                    const newValue = mergedData.rsvpUseMainColor === false;
                    handleChange("rsvpUseMainColor", newValue);
                  }}
                >
                  Apply default design
                </label>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClosePanel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: accentColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(0.9)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
