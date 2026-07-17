/**
 * Get the actual font family name to use for CSS
 * Handles custom fonts with fallbacks to default fonts
 */
export function getFontFamily(fontValue: string, type: "heading" | "body"): string {
  if (fontValue === "custom-heading-font") {
    return "'CustomHeadingFont', 'Playfair Display', serif";
  }
  if (fontValue === "custom-body-font") {
    return "'CustomBodyFont', 'Inter', sans-serif";
  }
  return fontValue;
}

/**
 * Check if a font value is a custom font
 */
export function isCustomFont(fontValue: string): boolean {
  return fontValue === "custom-heading-font" || fontValue === "custom-body-font";
}
