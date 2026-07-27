"use client";

import { useState, useCallback, useEffect, Fragment } from "react";
import type { InvitationData } from "@/lib/types/invitation";

interface Props {
  data: InvitationData;
  onOpen: () => void;
}

const FLAP_DURATION_MS = 4000;

export default function FullEnvelope({ data, onOpen }: Props) {
  const [flapOpen, setFlapOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showStdImage, setShowStdImage] = useState(false);
  const [showTopMessage, setShowTopMessage] = useState(true);
  const [messageReady, setMessageReady] = useState(false);

  const envelopeColor = data.welcomeEnvelopeColor || data.mainColor1;
  const envTexture = data.welcomeEnvelopeTexture || "envA";
  const stdIndex = Math.max(1, Math.min(6, data.welcomeFullEnvelopeStdImage ?? 1));

  // Letter fade-in effect for top message
  const message = data.welcomeTopMessage || "";
  const letters = Array.from(message);
  const letterDelay = 120;
  const totalDuration = letters.length * letterDelay;

  useEffect(() => {
    if (!data.welcomeTopMessage) {
      setMessageReady(true);
      return;
    }
    const timer = setTimeout(() => setMessageReady(true), totalDuration + 300 + 1000);
    return () => clearTimeout(timer);
  }, [data.welcomeTopMessage, totalDuration]);

  const hisInitial = data.hisName?.charAt(0).toUpperCase() || "";
  const herInitial = data.herName?.charAt(0).toUpperCase() || "";
  const stampText =
    data.nameType === "couple"
      ? hisInitial && herInitial
        ? `${hisInitial}&${herInitial}`
        : hisInitial || herInitial
      : data.coupleName?.charAt(0).toUpperCase() || hisInitial;

  const handleTap = useCallback(() => {
    if (flapOpen || !messageReady) return;
    setShowTopMessage(false);
    setTimeout(() => {
      setFlapOpen(true);
      setTimeout(() => setShowStdImage(true), 800);
      setTimeout(() => setExiting(true), Math.round(FLAP_DURATION_MS * 0.5) + 1000);
      setTimeout(() => onOpen(), FLAP_DURATION_MS + 800);
    }, 300);
  }, [flapOpen, onOpen, messageReady]);

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-40 flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        height: '100dvh',
        backgroundColor: envelopeColor || data.mainColor1 || '#5c4a3a',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${Math.round(FLAP_DURATION_MS * 0.5 + 800)}ms ease`,
      }}
      onClick={handleTap}
    >
      {/* Background */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 right-0 bottom-0"
          style={{
            backgroundImage: `url(/assets/${data.welcomeBackgroundImage?.urls?.[0] || "texturebg1"}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 bottom-0"
          style={{ backgroundColor: envelopeColor, mixBlendMode: "color" }}
        />
      </div>

      {/* Envelope + content */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="relative h-[100dvh] lg:h-auto lg:w-screen max-h-[100dvh] aspect-[7/5]"
          style={{
            filter: "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.18))",
            animation: flapOpen ? "none" : "float 3s ease-in-out infinite",
          }}
        >
          {/* STD image (letter behind envelope) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
            style={{ zIndex: 2 }}
          >
            <div
              className={`relative select-none w-[40%] h-[40%] sm:w-[50%] sm:h-[50%] md:w-[60%] md:h-[60%] lg:w-[70%] lg:h-[70%] ${showStdImage ? "std-image-fade-in" : ""}`}
              style={{ opacity: showStdImage ? undefined : 0 }}
            >
              <img
                src={`/assets/std/std-${stdIndex}.png`}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
              />
              {envelopeColor && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: envelopeColor,
                    mixBlendMode: "hue",
                    WebkitMaskImage: `url(/assets/std/std-${stdIndex}.png)`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: `url(/assets/std/std-${stdIndex}.png)`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                />
              )}
            </div>
          </div>

          {/* Layer 1: envelope mid */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              flapOpen ? "slide-envf-2" : ""
            }`}
            style={{ zIndex: 3 }}
          >
            <img
              src={`/assets/${envTexture}/envf-2.png`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: envelopeColor,
                mixBlendMode: "color",
                WebkitMaskImage: `url(/assets/${envTexture}/envf-2.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(/assets/${envTexture}/envf-2.png)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          </div>

          {/* Layer 4: flap top + wax seal */}
          <div
            className={`absolute left-1 right-1 bottom-1 pointer-events-none select-none ${
              flapOpen ? "flap-full-env4" : ""
            }`}
            style={{
              top: '-5%',
              zIndex: 5,
              transformOrigin: "top center",
              filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))",
            }}
          >
            <img
              src={`/assets/${envTexture}/envf-3.png`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: envelopeColor,
                mixBlendMode: "color",
                WebkitMaskImage: `url(/assets/${envTexture}/envf-3.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(/assets/${envTexture}/envf-3.png)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />

            {/* Wax seal stamp — lifts with the flap */}
            <div
              className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[17%] aspect-square flex items-center justify-center cursor-pointer"
              style={{
                containerType: "inline-size",
              }}
              onClick={handleTap}
            >
              <div
                className="absolute inset-0"
                style={{ filter: "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.3))" }}
              >
                <img
                  src="/assets/weddir-env-stamp.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain select-none"
                />
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundColor: envelopeColor || "#897843",
                    mixBlendMode: "color",
                    WebkitMaskImage: "url(/assets/weddir-env-stamp.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/assets/weddir-env-stamp.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                />
              </div>
              <span
                className="absolute inset-0 flex items-center justify-center font-bold select-none"
                style={{
                  fontSize: "clamp(12px, 26cqw, 56px)",
                  color: `color-mix(in srgb, ${envelopeColor || "#897843"} 80%, transparent)`,
                  mixBlendMode: "luminosity",
                  textShadow: "-0.6px -0.6px 0 rgba(255, 255, 255, 0.5), 1px 1px 3px rgba(0, 0, 0, 0.55)",
                  fontFamily: "Cinzel, serif",
                }}
              >
                {stampText.split("&").map((part, index, arr) => (
                  <Fragment key={index}>
                    {part}
                    {index < arr.length - 1 && (
                      <span style={{ fontSize: "0.6em" }}>&</span>
                    )}
                  </Fragment>
                ))}
              </span>
            </div>

          </div>

          {/* Top message below wax seal */}
          {data.welcomeTopMessage && (
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none select-none"
              style={{
                top: "calc(55% + 16%)",
                width: "80%",
                color: data.welcomeTopMessageColor || envelopeColor || data.mainColor1 || "#5c4a3a",
                fontFamily: data.welcomeTopMessageFont || "Playfair Display, serif",
                fontSize: "clamp(28px, 8vmin, 60px)",
                textShadow: "-0.5px -0.5px 0 rgba(255, 255, 255, 0.4), 0.5px 0.5px 0 rgba(0, 0, 0, 0.5)",
                letterSpacing: "0.05em",
                opacity: showTopMessage ? 1 : 0,
                transition: "opacity 1000ms ease",
                zIndex: 6,
              }}
            >
              {letters.map((char, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: 0,
                    animation: `letterFadeIn 0.8s ease-out forwards`,
                    animationDelay: `${i * letterDelay + 1000}ms`,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
