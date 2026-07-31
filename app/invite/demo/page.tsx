"use client";

import { useEffect, useState } from "react";
import { loadDemoInvitation } from "@/lib/demo/demo-data";
import InvitationTemplate from "@/components/invitation/InvitationTemplate";
import DemoProtection from "@/components/demo/DemoProtection";
import { useBackHandler } from "@/lib/hooks/useBackHandler";

export default function DemoInvitePage() {
  const [invitation, setInvitation] = useState<ReturnType<typeof loadDemoInvitation> | null>(null);
  const [desktopMode, setDesktopMode] = useState(false);

  useBackHandler(true, () => {
    window.history.back();
  });

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    setInvitation(loadDemoInvitation());
  }, []);

  useEffect(() => {
    const checkDesktop = () => setDesktopMode(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (!invitation?.data) return;
    const { data } = invitation;
    let title = "";
    if (data.nameType === "couple") {
      const name1 = data.hisName || "";
      const andText = data.andText || "&";
      const name2 = data.herName || "";
      title = `${name1} ${andText} ${name2} - Demo Invitation`;
    } else {
      title = `${data.coupleName || "Event"} - Demo Invitation`;
    }
    document.title = title;
  }, [invitation?.data]);

  if (!invitation) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1B3B5F" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#6998EE", borderTopColor: "transparent" }}
          />
          <p
            className="text-sm italic"
            style={{ color: "#6998EE", fontFamily: "Inter, sans-serif" }}
          >
            Opening your invitation…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DemoProtection />
      <div
        className="relative"
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <InvitationTemplate
          invitation={invitation}
          editMode={false}
          desktopMode={desktopMode}
        />
      </div>
    </>
  );
}
