"use client";

import { useMemo, useState, useEffect } from "react";
import QRCode from "qrcode";
import type { InvitationData } from "@/lib/types/invitation";

const DEFAULT_PHOTO_URL = "https://images.pexels.com/photos/17241434/pexels-photo-17241434.jpeg";

function getFontFamily(font: string | undefined, type: "heading" | "body"): string {
  if (!font) return type === "heading" ? "Playfair Display, serif" : "Inter, sans-serif";
  if (font === "Inter") return "Inter, sans-serif";
  return `'${font}', serif`;
}

function GiftQRCode() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL("https://instavow.com", {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  if (!qrDataUrl) return <div style={{ width: "100%", aspectRatio: "1" }} />;
  return (
    <img
      src={qrDataUrl}
      alt="Sample QR Code"
      className="w-full h-auto object-contain"
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

interface Props {
  designType: string;
  data: InvitationData;
  accentColor: string;
  dressCodeVariant?: number;
  dressCodeColors?: Record<string, string>;
  nowPlayingPaused?: boolean;
  tieVariant?: number;
  countdownStructure?: number;
}

const DRESS_CODE_SETS = [
  {
    name: "Traditional Formal",
    images: [
      { id: "d", filename: "dcode-d.png", tintable: false, colorKey: null },
      { id: "m1", filename: "dcode-m1.png", tintable: true, colorKey: "male1" },
      { id: "w1", filename: "dcode-w1.png", tintable: true, colorKey: "female1" },
      { id: "m2", filename: "dcode-m2.png", tintable: true, colorKey: "male2" },
      { id: "w2", filename: "dcode-w2.png", tintable: true, colorKey: "female2" },
      { id: "o", filename: "dcode-o.png", tintable: false, colorKey: null },
    ],
  },
  {
    name: "Shirt Dress & Barong",
    images: [
      { id: "d", filename: "dcode8-d.png", tintable: false, colorKey: null },
      { id: "m1", filename: "dcode8-m1.png", tintable: true, colorKey: "male1" },
      { id: "w1", filename: "dcode8-w1.png", tintable: true, colorKey: "female1" },
      { id: "m2", filename: "dcode8-m2.png", tintable: true, colorKey: "male2" },
      { id: "w2", filename: "dcode8-w2.png", tintable: true, colorKey: "female2" },
      { id: "a", filename: "dcode8-a1.png", tintable: false, colorKey: null },
      { id: "o", filename: "dcode8-o.png", tintable: false, colorKey: null },
    ],
  },
  {
    name: "Shirt Dress (Pair of 2)",
    images: [
      { id: "d", filename: "dcode9-d.png", tintable: false, colorKey: null },
      { id: "m1", filename: "dcode9-m1.png", tintable: true, colorKey: "male1" },
      { id: "w1", filename: "dcode9-w1.png", tintable: true, colorKey: "female1" },
      { id: "m2", filename: "dcode9-m2.png", tintable: true, colorKey: "male2" },
      { id: "w2", filename: "dcode9-w2.png", tintable: true, colorKey: "female2" },
      { id: "o", filename: "dcode9-o.png", tintable: false, colorKey: null },
    ],
    accentImages: [
      { variant: "a1", label: "Neck Tie", filename: "dcode9-a1.png" },
      { variant: "a2", label: "Bow Tie", filename: "dcode9-a2.png" },
    ],
  },
];

export default function HomeDraftDesign({ designType, data, accentColor, dressCodeVariant = 0, dressCodeColors, nowPlayingPaused = false, tieVariant = 0, countdownStructure = 0 }: Props) {
  const textColor = "#ffffff";
  const headingFont = getFontFamily("Playfair Display", "heading");
  const bodyFont = getFontFamily("Inter", "body");

  const dateComponents = useMemo(() => {
    const dateStr = data.date || "2027-01-13";
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return {
          month: parsed.toLocaleString("en-US", { month: "long" }),
          date: parsed.getDate(),
          year: parsed.getFullYear(),
          day: parsed.toLocaleString("en-US", { weekday: "long" }),
        };
      }
    } catch {}
    return { month: "January", date: 13, year: 2027, day: "Wednesday" };
  }, [data.date]);

  if (designType === "now-playing") {
    const name1 = data.hisName || "Alexander";
    const name2 = data.herName || "Isabella";
    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 80;
    const fontSize = 14;
    const heartSize = 20;
    return (
      <div className="relative w-[200px] h-[200px] cursor-pointer">
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        {/* Music/Mute indicator - rendered in HomePreviewStage to avoid slide animation */}
        <div className="w-full h-full" style={{ animation: "spin 6s linear infinite", animationPlayState: nowPlayingPaused ? "paused" : "running", transformOrigin: "center" }}>
          <img src="/assets/weddir-nplay.png" alt="Now Playing" className="w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
          <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <path id="arc-top-np" d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} />
              <path id="arc-bottom-np" d={`M ${cx + radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx - radius} ${cy}`} />
            </defs>
            <text fill="#878787" fontSize={fontSize} fontFamily={headingFont} textAnchor="middle">
              <textPath href="#arc-top-np" xlinkHref="#arc-top-np" startOffset="50%">{name1}</textPath>
            </text>
            <text fill="#878787" fontSize={fontSize} fontFamily={headingFont} textAnchor="middle">
              <textPath href="#arc-bottom-np" xlinkHref="#arc-bottom-np" startOffset="50%">{name2}</textPath>
            </text>
            <text x={cx - radius} y={cy} fill="#878787" fontSize={heartSize} textAnchor="middle" dominantBaseline="central" transform={`rotate(-90 ${cx - radius} ${cy})`}>{"\u2665"}</text>
            <text x={cx + radius} y={cy} fill="#878787" fontSize={heartSize} textAnchor="middle" dominantBaseline="central" transform={`rotate(90 ${cx + radius} ${cy})`}>{"\u2665"}</text>
          </svg>
        </div>
      </div>
    );
  }

  if (designType === "rsvp") {
    return (
      <div className="relative w-[200px] h-[240px]">
        <img src="/assets/envA/envrsvp.png" alt="RSVP" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: accentColor,
          mixBlendMode: "color",
          WebkitMaskImage: "url(/assets/envA/envrsvp.png)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: "url(/assets/envA/envrsvp.png)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl" style={{
            fontFamily: headingFont,
            color: "#ffffff",
            letterSpacing: "0.1em",
          }}>
            R.S.V.P.
          </span>
        </div>
      </div>
    );
  }

  if (designType === "event-details-card") {
    return (
      <div className="relative w-[200px] h-[200px]">
        <img src="/assets/weddir-card-sq-1.png" alt="Event Details" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: accentColor,
          mixBlendMode: "color",
          WebkitMaskImage: "url(/assets/weddir-card-sq-1.png)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: "url(/assets/weddir-card-sq-1.png)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }} />
        <div className="absolute flex items-center justify-center text-center overflow-hidden" style={{ top: "28%", bottom: "28%", left: "15%", right: "15%", zIndex: 2 }}>
          <h3 className="w-full leading-tight break-words" style={{
            fontFamily: headingFont,
            color: textColor,
            fontSize: "16px",
          }}>
            Event Details
          </h3>
        </div>
      </div>
    );
  }

  if (designType === "dress-code-card") {
    const dressSet = DRESS_CODE_SETS[dressCodeVariant % DRESS_CODE_SETS.length];
    const accentImg = dressSet.accentImages ? dressSet.accentImages[tieVariant % dressSet.accentImages.length] : null;
    return (
      <div className="relative w-[240px] h-[300px]">
        {dressSet.images.map((img) => {
          const imgColor = (img.colorKey && dressCodeColors && dressCodeColors[img.colorKey]) || accentColor;
          return (
          <div key={img.id} className="absolute inset-0 w-full h-full">
            <img
              src={`/assets/${img.filename}`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
            {img.tintable && (
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  backgroundColor: imgColor,
                  WebkitMaskImage: `url(/assets/${img.filename})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: `url(/assets/${img.filename})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              />
            )}
          </div>
          );
        })}
        {accentImg && (
          <div key={accentImg.variant} className="absolute inset-0 w-full h-full">
            <img
              src={`/assets/${accentImg.filename}`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}
      </div>
    );
  }

  if (designType === "gift-guide-card") {
    return (
      <div className="relative w-[240px] h-[240px] flex flex-col items-center justify-center">
        <div className="backdrop-blur-md rounded-lg shadow-sm border border-white/20 flex flex-col items-center justify-start p-5" style={{ width: 200, minHeight: 220, backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
          <div className="bg-white p-3 rounded-lg" style={{ paddingBottom: "24px" }}>
            <GiftQRCode />
          </div>
          <p className="text-center mt-3" style={{
            fontFamily: "Inter, sans-serif",
            color: textColor,
            fontSize: "12px",
            letterSpacing: "0.05em",
          }}>
            Inst*v*w
          </p>
        </div>
      </div>
    );
  }

  if (designType === "date-time-card") {
    const baseFontSize = 19;
    return (
      <div className="relative w-[280px] h-[280px]">
        <img src="/assets/weddir-card-1.png" alt="Date & Time" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: accentColor,
          mixBlendMode: "color",
          WebkitMaskImage: "url(/assets/weddir-card-1.png)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: "url(/assets/weddir-card-1.png)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }} />
        <div className="absolute flex flex-col items-center justify-center text-center overflow-hidden" style={{ top: "15%", bottom: "15%", left: "15%", right: "15%", zIndex: 2 }}>
          <span style={{ fontFamily: headingFont, color: accentColor, fontSize: `${baseFontSize * 0.7}px`, lineHeight: 1.4 }}>
            {dateComponents.day}
          </span>
          <span style={{ fontFamily: headingFont, color: accentColor, fontSize: `${baseFontSize * 2.5}px`, lineHeight: 1.1, margin: "0.1em 0" }}>
            {dateComponents.date}
          </span>
          <span style={{ fontFamily: headingFont, color: accentColor, fontSize: `${baseFontSize * 0.5}px`, lineHeight: 1.4 }}>
            {dateComponents.month} {dateComponents.year}, at {data.time || "4:00 PM"}
          </span>
          <div style={{ width: "30%", height: "1px", backgroundColor: accentColor, opacity: 0.5, marginTop: "1em", marginBottom: "1em" }} />
          <span style={{ fontFamily: headingFont, color: accentColor, fontSize: `${baseFontSize * 0.5}px`, lineHeight: 1.4 }}>
            {data.venueName || "The Grand Ballroom"}
          </span>
        </div>
      </div>
    );
  }

  if (designType === "story-card") {
    return (
      <div className="relative w-[200px] h-[200px]">
        <img src="/assets/weddir-card-sq-1.png" alt="Story" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: accentColor,
          mixBlendMode: "color",
          WebkitMaskImage: "url(/assets/weddir-card-sq-1.png)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: "url(/assets/weddir-card-sq-1.png)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }} />
        <div className="absolute flex flex-col items-center justify-center text-center overflow-hidden" style={{ top: "28%", bottom: "28%", left: "10%", right: "10%", zIndex: 2 }}>
          <h3 className="w-full leading-tight break-words" style={{
            fontFamily: headingFont,
            color: textColor,
            fontSize: "16px",
          }}>
            Our Story
          </h3>
        </div>
      </div>
    );
  }

  if (designType === "countdown-card") {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 42);
    const diff = targetDate.getTime() - Date.now();
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
    const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
    const seconds = Math.max(0, Math.floor((diff / 1000) % 60));
    const items = [
      { value: days, label: "Days" },
      { value: hours, label: "Hours" },
      { value: minutes, label: "Minutes" },
      { value: seconds, label: "Seconds" },
    ];
    const struct = countdownStructure % 9;
    return (
      <div className="relative w-[300px] h-[260px] flex flex-col items-center justify-center">
        <h3 className="mb-4" style={{
          fontFamily: headingFont,
          color: textColor,
          fontSize: "18px",
          letterSpacing: "0.05em",
        }}>
          Counting Down To Forever
        </h3>
        {/* Structure 0: Classic Glass Cards */}
        {struct === 0 && (
          <div className="flex justify-center gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center w-16 shrink-0">
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl mb-2 backdrop-blur-xl" style={{ backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}33`, color: textColor, fontFamily: headingFont }}>
                  <span className="text-2xl font-bold">{String(item.value).padStart(2, "0")}</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-center w-full" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Structure 1: Circular Pills */}
        {struct === 1 && (
          <div className="flex justify-center gap-2">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 flex items-center justify-center mb-1 backdrop-blur-xl" style={{ backgroundColor: `${accentColor}26`, border: `2px solid ${accentColor}4d`, color: textColor, fontFamily: headingFont, borderRadius: "50%" }}>
                  <span className="text-lg font-bold">{String(item.value).padStart(2, "0")}</span>
                </div>
                <span className="text-[7px] uppercase tracking-wider text-center w-full" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Structure 2: Minimalist Lines */}
        {struct === 2 && (
          <div className="flex justify-center items-center gap-2">
            {items.map((item, i) => (
              <div key={item.label} className="flex flex-col items-center shrink-0">
                <span className="text-2xl font-bold" style={{ color: textColor, fontFamily: headingFont }}>{String(item.value).padStart(2, "0")}</span>
                <span className="text-[7px] uppercase tracking-wider" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
                {i < items.length - 1 && <span className="text-xl mx-1" style={{ color: textColor, opacity: 0.3 }}>·</span>}
              </div>
            ))}
          </div>
        )}
        {/* Structure 3: Stacked Cards */}
        {struct === 3 && (
          <div className="flex justify-center gap-1">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center w-11 shrink-0">
                <div className="w-11 h-14 flex items-center justify-center rounded-xl mb-1 backdrop-blur-xl" style={{ backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}33`, color: textColor, fontFamily: headingFont }}>
                  <span className="text-lg font-bold">{String(item.value).padStart(2, "0")}</span>
                </div>
                <span className="text-[7px] uppercase tracking-wider text-center w-full" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Structure 4: Diamond Shape */}
        {struct === 4 && (
          <div className="flex justify-center gap-2">
            {items.map((item, i) => (
              <div key={item.label} className="flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 flex items-center justify-center mb-1 backdrop-blur-xl" style={{ backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}33`, color: textColor, fontFamily: headingFont, transform: "rotate(45deg)" }}>
                  <span className="text-lg font-bold" style={{ transform: "rotate(-45deg)" }}>{String(item.value).padStart(2, "0")}</span>
                </div>
                <span className="text-[7px] uppercase tracking-wider text-center w-full" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Structure 5: Elegant Framed */}
        {struct === 5 && (
          <div className="flex justify-center gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 flex items-center justify-center mb-1" style={{ border: `2px solid ${accentColor}66`, color: textColor, fontFamily: headingFont }}>
                  <span className="text-xl font-bold">{String(item.value).padStart(2, "0")}</span>
                </div>
                <span className="text-[7px] uppercase tracking-wider text-center w-full" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Structure 6: Clock-like Columns */}
        {struct === 6 && (
          <div className="backdrop-blur-xl px-8 py-6 rounded-2xl" style={{ backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}33` }}>
            <div className="flex justify-center gap-5">
              {items.map((item) => (
                <div key={item.label} className="flex flex-col items-center shrink-0">
                  <span className="text-3xl font-bold" style={{ color: textColor, fontFamily: headingFont }}>{String(item.value).padStart(2, "0")}</span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Structure 7: Transparent Container */}
        {struct === 7 && (
          <div className="px-6 py-4 rounded-2xl" style={{ border: `1px solid ${accentColor}33` }}>
            <div className="flex justify-center gap-3">
              {items.map((item) => (
                <div key={item.label} className="flex flex-col items-center shrink-0">
                  <span className="text-2xl font-bold" style={{ color: textColor, fontFamily: headingFont }}>{String(item.value).padStart(2, "0")}</span>
                  <span className="text-[7px] uppercase tracking-wider" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Structure 8: Individual Digit Containers */}
        {struct === 8 && (
          <div className="flex items-center justify-center gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center shrink-0">
                <div className="flex gap-1 mb-2">
                  {String(item.value).padStart(2, "0").split("").map((digit, di) => (
                    <div key={di} className="w-7 h-10 flex items-center justify-center rounded backdrop-blur-xl" style={{ backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}33`, color: textColor, fontFamily: headingFont }}>
                      <span className="text-lg font-bold">{digit}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[9px] uppercase tracking-wider text-center" style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (designType === "invitation") {
    const name1 = data.hisName || "Alexander";
    const name2 = data.herName || "Isabella";
    const andText = data.andText || "&";
    return (
      <div className="relative w-[200px] h-[240px]">
        <img src="/assets/weddir-card-2.png" alt="Invitation" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: accentColor,
          mixBlendMode: "color",
          WebkitMaskImage: "url(/assets/weddir-card-2.png)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: "url(/assets/weddir-card-2.png)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none" style={{ maxWidth: "75%", margin: "0 auto" }}>
          {/* Hostline image */}
          <div className="w-24 h-8 mb-2" style={{
            backgroundColor: textColor,
            WebkitMaskImage: "url(/assets/hostline-01.png)",
            WebkitMaskSize: "contain",
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskImage: "url(/assets/hostline-01.png)",
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
          }} />
          <p className="text-[5px] tracking-[0.2em] uppercase leading-relaxed mb-2" style={{
            color: textColor,
            fontFamily: bodyFont,
          }}>
            Please join us as we celebrate our love and commitment
          </p>
          <h3 className="text-lg leading-tight my-1" style={{
            fontFamily: headingFont,
            color: textColor,
            whiteSpace: "pre-line",
          }}>
            {name1} <span style={{ fontSize: "2em", lineHeight: 1, opacity: 0.2 }}>{andText}</span>{"\n"}{name2}
          </h3>
          {/* Fsentiment text */}
          <p className="text-[5px] tracking-[0.2em] uppercase leading-relaxed mt-2" style={{
            color: textColor,
            fontFamily: bodyFont,
          }}>
            We can't wait to celebrate with you!
          </p>
          {/* Fsentiment image */}
          <div className="w-24 h-8 mt-2" style={{
            backgroundColor: textColor,
            WebkitMaskImage: "url(/assets/fsentiment-01.png)",
            WebkitMaskSize: "contain",
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskImage: "url(/assets/fsentiment-01.png)",
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
          }} />
        </div>
      </div>
    );
  }

  if (designType === "custom-card-portrait") {
    const name1 = data.hisName || "Alexander";
    const name2 = data.herName || "Isabella";
    const andText = data.andText || "&";
    return (
      <div className="relative w-[200px] h-[240px]">
        <img src="/assets/weddir-card-1.png" alt="Portrait Card" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: accentColor,
          mixBlendMode: "color",
          WebkitMaskImage: "url(/assets/weddir-card-1.png)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: "url(/assets/weddir-card-1.png)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none" style={{ maxWidth: "65%", margin: "0 auto" }}>
          <p className="text-[6px] tracking-[0.2em] uppercase leading-relaxed mb-2" style={{
            color: textColor,
            fontFamily: bodyFont,
          }}>
            Please join us as we celebrate our love and commitment
          </p>
          <h3 className="leading-tight my-1" style={{
            fontFamily: headingFont,
            color: textColor,
            whiteSpace: "pre-line",
            transform: "scale(2)",
            fontSize: "10px",
          }}>
            {name1}{"\n"}<span style={{ fontSize: "2em", opacity: 0.2 }}>{andText}</span>{"\n"}{name2}
          </h3>
          <p className="text-[6px] tracking-[0.2em] uppercase leading-relaxed mt-2" style={{
            color: textColor,
            fontFamily: bodyFont,
          }}>
            We can't wait to celebrate with you!
          </p>
        </div>
      </div>
    );
  }

  if (designType === "photo-papers") {
    return (
      <div className="relative" style={{ width: 280, height: 300, transform: "translateY(15px)" }}>
        <style>{`
          @keyframes photoSlideUp {
            from { opacity: 0; transform: var(--rot) translateY(60px); }
            to { opacity: 1; transform: var(--rot) translateY(0); }
          }
        `}</style>
        <div
          className="absolute top-[10%] right-[15%] w-[45%] bg-white pt-2 px-2 pb-4 shadow-lg"
          style={{
            transform: "rotate(-5deg)",
            zIndex: 1,
            animation: "photoSlideUp 800ms ease-out 600ms both",
            ['--rot' as string]: 'rotate(-5deg)',
          }}
        >
          <img src="https://images.pexels.com/photos/17241431/pexels-photo-17241431.jpeg" alt="" className="w-full aspect-[3/4] object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        </div>
        <div
          className="absolute top-0 left-0 w-[45%] bg-white pt-2 px-2 pb-4 shadow-lg"
          style={{
            transform: "rotate(5deg)",
            zIndex: 2,
            animation: "photoSlideUp 800ms ease-out both",
            ['--rot' as string]: 'rotate(5deg)',
          }}
        >
          <img src={DEFAULT_PHOTO_URL} alt="" className="w-full aspect-[3/4] object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        </div>
      </div>
    );
  }

  return null;
}
