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

export const getNextMessage = (messages: string[], currentIndex: number): { message: string; nextIndex: number } => {
  const nextIndex = (currentIndex + 1) % messages.length;
  return { message: messages[nextIndex], nextIndex };
};
