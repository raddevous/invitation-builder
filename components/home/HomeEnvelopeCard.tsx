"use client";

import { Fragment, useState, useEffect } from "react";
import type { InvitationData } from "@/lib/types/invitation";

const ENVELOPE_SKINS = ["envA", "envB", "envC"];
const FLOWER_COUNT = 3;
const DEFAULT_PHOTO_URL = "https://images.pexels.com/photos/17241434/pexels-photo-17241434.jpeg";

interface HomeEnvelopeCardProps {
  data: InvitationData;
  skinIndex: number;
  flowerVariant: number;
  onTap: () => void;
  fading?: boolean;
  swapPhotoAndFlowers?: boolean;
}

function getFlowerSrc(variant: number) {
  return variant === 0 ? "/assets/weddir-env-flowrs.png" : `/assets/weddir-env-flowrs${variant + 1}.png`;
}

export default function HomeEnvelopeCard({ data, skinIndex, flowerVariant, onTap, fading = false, swapPhotoAndFlowers = false }: HomeEnvelopeCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (swapPhotoAndFlowers) {
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [swapPhotoAndFlowers]);

  const skin = ENVELOPE_SKINS[skinIndex % ENVELOPE_SKINS.length];
  const flower = flowerVariant % FLOWER_COUNT;
  const tint = data.welcomeEnvelopeColor || data.mainColor1 || "#5c4a3a";

  const hisInitial = data.hisName?.charAt(0).toUpperCase() || "";
  const herInitial = data.herName?.charAt(0).toUpperCase() || "";
  const stampText =
    data.nameType === "couple"
      ? hisInitial && herInitial
        ? `${hisInitial}&${herInitial}`
        : hisInitial || herInitial
      : data.coupleName?.charAt(0).toUpperCase() || hisInitial;

  const photoUrl = (data.galleryImages || []).find(Boolean) || DEFAULT_PHOTO_URL;

  return (
    <div
      className="relative flex flex-col items-center gap-6 cursor-pointer select-none"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 1400ms ease",
      }}
      onClick={onTap}
    >
      <div
        className="relative overflow-visible w-[220px] h-[264px] sm:w-[260px] sm:h-[312px] md:w-[300px] md:h-[360px]"
        style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.22))" }}
      >
        {/* Layer 1: Bottom body */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <img
            src="/assets/weddir-env-body-1.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backgroundColor: tint,
              mixBlendMode: "color",
              WebkitMaskImage: "url(/assets/weddir-env-body-1.png)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/assets/weddir-env-body-1.png)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          />
        </div>

        {/* Photo peeking out */}
        <div
          className={`absolute ${swapPhotoAndFlowers ? "top-[37%] left-[36%]" : "top-[39%] left-[62%]"} -translate-x-1/2 -translate-y-1/2 w-[62%] bg-white pt-2 px-2 pb-6 shadow-lg transition-all ease-out`}
          style={{
            zIndex: 2,
            opacity: visible ? 1 : 0,
            transform: visible
              ? `translate(-50%, -50%) rotate(${swapPhotoAndFlowers ? -5 : 20}deg) translate(0, 0)`
              : `translate(-50%, -50%) rotate(${swapPhotoAndFlowers ? -5 : 20}deg) translate(0, 50px)`,
            transitionDuration: swapPhotoAndFlowers ? "1000ms" : "4000ms",
          }}
        >
          <img src={photoUrl} alt="" className="w-full h-auto aspect-square object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        </div>

        {/* Flowers peeking out */}
        <div
          className={`absolute ${swapPhotoAndFlowers ? "top-[39%] left-[78%]" : "top-[37%] left-[20%]"} -translate-x-1/2 -translate-y-1/2 w-[62%] transition-all ease-out`}
          style={{
            zIndex: 2,
            opacity: visible ? 1 : 0,
            transform: visible
              ? `translate(-50%, -50%) rotate(${swapPhotoAndFlowers ? 20 : -5}deg) translate(0, 0)`
              : `translate(-50%, -50%) rotate(${swapPhotoAndFlowers ? 20 : -5}deg) translate(0, 50px)`,
            transitionDuration: "1000ms",
          }}
        >
          <img src={getFlowerSrc(flower)} alt="" className="w-full h-auto" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        </div>

        {/* Layer 3: Body top (skin-dependent) */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
          <img
            src={`/assets/${skin}/weddir-env-body-2.png`}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backgroundColor: tint,
              mixBlendMode: "color",
              WebkitMaskImage: `url(/assets/${skin}/weddir-env-body-2.png)`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: `url(/assets/${skin}/weddir-env-body-2.png)`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          />
        </div>

        {/* Stamp */}
        <div
          className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"
          style={{ zIndex: 5 }}
        >
          <img src="/assets/weddir-env-stamp.png" alt="" className="absolute inset-0 w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backgroundColor: tint,
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
            className="absolute inset-0 flex items-center justify-center text-sm md:text-base font-bold"
            style={{
              color: "color-mix(in srgb, " + tint + " 35%, transparent)",
              mixBlendMode: "luminosity",
              textShadow: "-0.2px -0.2px rgba(255,255,255,0.3), 0.2px 0.2px 0 rgba(0,0,0,0.53)",
              fontFamily: "Cinzel, serif",
            }}
          >
            {stampText.split("&").map((part, index, arr) => (
              <Fragment key={index}>
                {part}
                {index < arr.length - 1 && <span style={{ fontSize: "0.6em" }}>&</span>}
              </Fragment>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
