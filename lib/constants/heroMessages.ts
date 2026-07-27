export const HOST_LINE_MESSAGES = [
  "Together with our families, we invite you to celebrate our marriage",
  "Please join us as we celebrate our love and commitment",
  "As we take the first step into our forever, we request the pleasure of your company",
  "You are joyfully invited to the marriage of",
  "We're getting hitched! Come celebrate with us",
  "Two hearts, one love, one forever begins",
  "Love is in the air, and we want you there",
  "Join us for the wedding of"
];

export const CLOSING_SENTIMENT_MESSAGES = [
  "Your presence and blessings are the greatest gifts we could receive.",
  "With all our love, we look forward to celebrating with you.",
  "We look forward to celebrating this beautiful beginning with you.",
  "Your presence on our special day would mean the world to us.",
  "We hope you can share our special day with us.",
  "We can't wait to celebrate with you!",
  "Your presence is our present."
];

export const CUSTOM_CARD_MESSAGES = [
  "LET US KNOW YOU'RE COMING",
  "Kindly reply by (deadline found in sections tab - rsvp form rsvp deadline)",
  "We look forward to celebrating with you at this beautiful venue.",
  "Please see our attire guide below.",
  "Each milestone in our journey has been a step toward forever. Here's our story.",
  "See our collection of our favorite moments together."
];

export const RSVP_DEADLINE_PLACEHOLDER = "(deadline found in sections tab - rsvp form rsvp deadline)";

export const resolveCustomCardMessage = (message: string, rsvpDeadline?: string) => {
  if (message.includes(RSVP_DEADLINE_PLACEHOLDER)) {
    const deadline = rsvpDeadline || "";
    const resolved = message.split(RSVP_DEADLINE_PLACEHOLDER).join(deadline);
    return !deadline ? resolved.trimEnd() : resolved;
  }
  return message;
};

export const EVENT_DETAILS_EMPTY_MESSAGES = [
  "We're putting the finishing touches on our special day. Check back soon!",
  "We are still ironing out the details! Check back soon for updates.",
  "Full schedule and accommodation details will be shared here shortly.",
  "Details pending. Stay tuned!",
  "The complete programme of events will be published here in due course.",
  "We're still planning the fun! Details coming soon — promise!",
  "More details coming soon.",
];

export const TIMELINE_EMPTY_MESSAGES = [
  "Memories in the making! We will share our story here soon.",
  "Our journey together will be shared here shortly.",
  "Story coming soon!",
  "The chapters of our love story will unfold here soon.",
  "We are busy making memories! Check back shortly for the full story.",
  "Our history together, coming soon.",
  "Countless memories, one love story. Shared here soon.",
  "The countdown is on, and our story is loading...",
  "From how we met to the big 'Yes!'—details coming soon.",
  "Our story. Coming soon.",
];

export const USHER_INSTRUCTIONS = [
  "As one of the Ushers, may you please help us with the parking space?",
  "As one of the Ushers, may you please assist guests to their seats?",
  "As one of the Ushers, may you please help distribute the wedding programs at the entrance?",
  "As one of the Ushers, may you please guide guests to the reception area after the ceremony?",
  "As one of the Ushers, may you please help manage the gift table and direct guests to it?",
  "As one of the Ushers, may you please assist elderly guests to their seats?",
  "As one of the Ushers, may you please help with crowd control at the entrance?",
  "As one of the Ushers, may you please assist in directing guests to the restrooms?",
  "As one of the Ushers, may you please help with the seating arrangement for VIP guests?",
  "As one of the Ushers, may you please assist with parking and valet coordination?",
  "As one of the Ushers, may you please help usher guests out after the ceremony?",
  "As one of the Ushers, may you please assist with the unity candle or ceremony items?",
];

export const USHERETTE_INSTRUCTIONS = [
  "As one of the Usherettes, may you please guide our guests to their seats?",
  "As one of the Usherettes, may you please help distribute the wedding programs at the entrance?",
  "As one of the Usherettes, may you please assist guests at the registration table?",
  "As one of the Usherettes, may you please help guide guests to the reception area?",
  "As one of the Usherettes, may you please assist with the guestbook and encourage sign-ins?",
  "As one of the Usherettes, may you please help with the flower arrangement distribution?",
  "As one of the Usherettes, may you please assist in guiding the bridal party during the procession?",
  "As one of the Usherettes, may you please help manage the gift table?",
  "As one of the Usherettes, may you please assist with the pew cards and reserved seating signs?",
  "As one of the Usherettes, may you please help welcome guests at the entrance and provide directions?",
  "As one of the Usherettes, may you please assist with the ring or coin bearer coordination?",
  "As one of the Usherettes, may you please help with the send-off and distribute confetti or bubbles?",
];

export const getNextMessage = (messages: string[], currentIndex: number): { message: string; nextIndex: number } => {
  const nextIndex = (currentIndex + 1) % messages.length;
  return { message: messages[nextIndex], nextIndex };
};
