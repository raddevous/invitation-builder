"use client";

import { useState, useCallback, useEffect, Fragment } from "react";
import type { InvitationData } from "@/lib/types/invitation";

interface Props {
  data: InvitationData;
  onOpen: () => void;
}

const FLAP_DURATION_MS = 3000;
const SLIDE_PAPER_DELAY_MS = 1200;
const SLIDE_PAPER_DURATION_MS = 2500;

export default function ClassicEnvelope({ data, onOpen }: Props) {
  const [flapOpen, setFlapOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showTopMessage, setShowTopMessage] = useState(true);
  const [messageReady, setMessageReady] = useState(false);

  const envelopeColor = data.welcomeEnvelopeColor || data.mainColor1;
  const envTexture = data.welcomeEnvelopeTexture || "envA";
  const stdIndex = Math.max(1, Math.min(6, data.welcomeFullEnvelopeStdImage ?? 1));

  // Letter fade-in effect for top message
  const message = data.welcomeTopMessage || "";
  const letters = Array.from(message);
  const letterDelay = 120; // ms per letter
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
      setTimeout(() => setExiting(true), SLIDE_PAPER_DELAY_MS + SLIDE_PAPER_DURATION_MS + 250);
      setTimeout(() => onOpen(), SLIDE_PAPER_DELAY_MS + SLIDE_PAPER_DURATION_MS + 250 + Math.round(SLIDE_PAPER_DURATION_MS * 0.5 + 800));
    }, 300);
  }, [flapOpen, onOpen, messageReady]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        opacity: exiting ? 0 : 1,
        transition: `opacity ${Math.round(SLIDE_PAPER_DURATION_MS * 0.5 + 800)}ms ease`,
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(/assets/${data.welcomeBackgroundImage?.urls?.[0] || "texturebg1"}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: envelopeColor, mixBlendMode: "color" }}
        />
      </div>

      {/* Envelope + content */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-full">
        {/* Envelope image stack */}
        <div
          className="relative w-[min(360px,calc(100vw-2rem))] h-[min(257px,calc((100vw-2rem)*257/360))] md:w-[460px] md:h-[329px] lg:w-[540px] lg:h-[386px]"
          style={{
            filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))",
            animation: flapOpen ? "none" : "float 3s ease-in-out infinite",
          }}
        >
          {/* Layer 1: envelope base */}
          <img
            src="/assets/env-1.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ zIndex: 1 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundColor: envelopeColor,
              mixBlendMode: "color",
              WebkitMaskImage: "url(/assets/env-1.png)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/assets/env-1.png)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          />

          {/* Layer 2: sliding paper with std image */}
          <div
            className={`absolute inset-0 pointer-events-none overflow-hidden ${
              flapOpen ? "slide-paper-classic" : ""
            }`}
            style={{ zIndex: 2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative select-none w-[55%] h-[85%] md:w-[65%] md:h-[89%] lg:w-[70%] lg:h-[93%]"
                style={{
                  backgroundColor: "#f5f0e8",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.22)",
                  padding: "8%",
                }}
              >
                <div className="relative w-full h-full">
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
            </div>
          </div>

          {/* Layer 3: envelope mid */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              flapOpen ? "env2-z-boost" : ""
            }`}
            style={{ zIndex: 3 }}
          >
            <img
              src={`/assets/${envTexture}/env-2.png`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: envelopeColor,
                mixBlendMode: "color",
                WebkitMaskImage: `url(/assets/${envTexture}/env-2.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(/assets/${envTexture}/env-2.png)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.1) 30%, transparent 60%)",
                WebkitMaskImage: `url(/assets/${envTexture}/env-2.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(/assets/${envTexture}/env-2.png)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          </div>

          {/* Wax seal stamp — rotates and swaps z-index with the flap */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              flapOpen ? "flap-wax" : "z-[6]"
            }`}
            style={{ transformOrigin: "top center", filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))" }}
          >
            <div
              className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center cursor-pointer"
              style={{ pointerEvents: "auto" }}
              onClick={handleTap}
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
              <span
                className="absolute inset-0 flex items-center justify-center text-lg md:text-xl lg:text-2xl font-bold select-none"
                style={{
                  color: `color-mix(in srgb, ${envelopeColor || "#897843"} 80%, transparent)`,
                  mixBlendMode: "luminosity",
                  textShadow: "-0.5px -0.5px 0 rgba(255, 255, 255, 0.5), 0.5px 0.5px 2px rgba(0, 0, 0, 0.55)",
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

          {/* Layer 4: back flap piece (env-4) */}
          <div
            className={`absolute inset-0 pointer-events-none select-none ${
              flapOpen ? "flap-env3" : ""
            }`}
            style={{ zIndex: 4, transformOrigin: "top center" }}
          >
            <img
              src="/assets/env-4.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: envelopeColor,
                mixBlendMode: "color",
                WebkitMaskImage: "url(/assets/env-4.png)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: "url(/assets/env-4.png)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
            {flapOpen ? (
              <div
                className="absolute inset-0 pointer-events-none env4-inner-shadow"
                style={{
                  background: "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 30%, transparent 60%)",
                  WebkitMaskImage: "url(/assets/env-4.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: "url(/assets/env-4.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              />
            ) : null}
          </div>

          {/* Layer 5: front flap top (env-3) */}
          <div
            className={`absolute inset-0 pointer-events-none select-none ${
              flapOpen ? "flap-env4" : ""
            }`}
            style={{
              zIndex: 5,
              transformOrigin: "top center",
              filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))",
            }}
          >
            <img
              src={`/assets/${envTexture}/env-3.png`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: envelopeColor,
                mixBlendMode: "color",
                WebkitMaskImage: `url(/assets/${envTexture}/env-3.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(/assets/${envTexture}/env-3.png)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
            <div
              className={`absolute inset-0 pointer-events-none ${
                flapOpen ? "env3-inner-shadow" : ""
              }`}
              style={{
                background: "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 30%, transparent 60%)",
                WebkitMaskImage: `url(/assets/${envTexture}/env-3.png)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(/assets/${envTexture}/env-3.png)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          </div>
        </div>

        {/* Message below envelope */}
        {data.welcomeTopMessage && (
          <div
            className="text-center pointer-events-none select-none mt-12"
            style={{
              color: data.welcomeTopMessageColor || envelopeColor || data.mainColor1 || "#5c4a3a",
              fontFamily: data.welcomeTopMessageFont || "Playfair Display, serif",
              fontSize: "clamp(18px, 5.5vmin, 38px)",
              textShadow: "-0.5px -0.5px 0 rgba(255, 255, 255, 0.5), 0.5px 0.5px 0 rgba(0, 0, 0, 0.4)",
              letterSpacing: "0.05em",
              opacity: showTopMessage ? 1 : 0,
              transition: "opacity 1000ms ease",
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
  );
}
