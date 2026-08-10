"use client";

import { useEffect, useState, use } from "react";
import type { Invitation } from "@/lib/types/invitation";
import { updateFavicon } from "@/lib/utils";
import InvitationTemplate from "@/components/invitation/InvitationTemplate";
import { apiUrl } from "@/lib/utils/api";
import { cacheInvitation, getCachedInvitation, isOnline } from "@/lib/utils/offline-cache";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ slug: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { slug } = use(params);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const checkDesktop = () => setDesktopMode(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl(`/api/invitation/${slug}`));
        if (!res.ok) {
          // Try cache before showing not found
          const cached = await getCachedInvitation(slug);
          if (cached) {
            setInvitation(cached);
            setLoading(false);
            return;
          }
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const inv = data.invitation as Invitation;
        await cacheInvitation(slug, inv);
        setInvitation(inv);
        setLoading(false);
      } catch {
        // Network error — try cache
        const cached = await getCachedInvitation(slug);
        if (cached) {
          setInvitation(cached);
          setLoading(false);
          return;
        }
        setNotFound(true);
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Update page title based on invitation data
  useEffect(() => {
    if (!invitation?.data) return;

    const { data } = invitation;
    let title = "";

    if (data.nameType === "couple") {
      const name1 = data.hisName || "";
      const andText = data.andText || "&";
      const name2 = data.herName || "";
      title = `${name1} ${andText} ${name2} Invite You`;
    } else {
      title = `${data.coupleName || "Event"} Invitation`;
    }

    document.title = title;
  }, [invitation?.data]);

  // Use the user-defined display logo as the page favicon
  useEffect(() => {
    updateFavicon(invitation?.data?.heroIcon);
  }, [invitation?.data?.heroIcon]);

  // Content protection for guest mode
  useEffect(() => {
    if (!invitation) return;

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();

    const preventDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'A') {
        e.preventDefault();
      }
    };

    const preventKeyShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'u' || e.key === 'p')) {
        e.preventDefault();
      }
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('keydown', preventKeyShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('keydown', preventKeyShortcuts);
    };
  }, [invitation]);

  if (loading) {
    const mc1 = invitation?.data?.mainColor1 || "#1B3B5F";
    const mc2 = invitation?.data?.mainColor2 || "#6998EE";
    return (
      <div
        className="min-h-screen flex items-center justify-center safe-area"
        style={{ backgroundColor: mc1 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: mc2, borderTopColor: "transparent" }}
          />
          <p
            className="text-sm italic"
            style={{ color: mc2, fontFamily: "Inter, sans-serif" }}
          >
            Opening your invitation…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !invitation) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center safe-area"
        style={{ backgroundColor: "#fff8f3" }}
      >
        <p
          className="text-3xl mb-3"
          style={{ fontFamily: "Playfair Display, serif", color: "#6998EE" }}
        >
          Invitation Not Found
        </p>
        <p
          className="text-sm"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          This invitation link may be invalid or has been removed.
        </p>
        <button
          onClick={() => { window.location.href = "https://instavow.com"; }}
          className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: "#6998EE", color: "white", fontFamily: "Inter, sans-serif" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="relative" style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}>
      <InvitationTemplate invitation={invitation} editMode={false} desktopMode={desktopMode} />
    </div>
  );
}
