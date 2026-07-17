"use client";

import { useEffect } from "react";

interface CustomFontLoaderProps {
  customHeadingFont?: string;
  customBodyFont?: string;
}

export default function CustomFontLoader({ customHeadingFont, customBodyFont }: CustomFontLoaderProps) {
  useEffect(() => {
    // Load custom heading font
    if (customHeadingFont) {
      const styleId = "custom-heading-font-style";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = `
        @font-face {
          font-family: 'CustomHeadingFont';
          src: url('${customHeadingFont}') format('woff2'),
               url('${customHeadingFont.replace('.woff2', '.woff')}') format('woff'),
               url('${customHeadingFont.replace('.woff2', '.ttf')}') format('truetype'),
               url('${customHeadingFont.replace('.woff2', '.otf')}') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    }

    // Load custom body font
    if (customBodyFont) {
      const styleId = "custom-body-font-style";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = `
        @font-face {
          font-family: 'CustomBodyFont';
          src: url('${customBodyFont}') format('woff2'),
               url('${customBodyFont.replace('.woff2', '.woff')}') format('woff'),
               url('${customBodyFont.replace('.woff2', '.ttf')}') format('truetype'),
               url('${customBodyFont.replace('.woff2', '.otf')}') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    }
  }, [customHeadingFont, customBodyFont]);

  return null;
}
