"use client";

import { useEffect, useState, use } from "react";
import type { Invitation, InvitationData } from "@/lib/types/invitation";
import { supabase } from "@/lib/supabase/client";
import InvitationTemplate from "@/components/invitation/InvitationTemplate";

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
    const checkDesktop = () => setDesktopMode(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invitation/${slug}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setInvitation(data.invitation);
      setLoading(false);
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

  // Subscribe to realtime changes so the public page updates live
  useEffect(() => {
    if (!invitation?.id) return;

    const channel = supabase
      .channel(`public-invite:${invitation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "invitations",
          filter: `id=eq.${invitation.id}`,
        },
        (payload) => {
          if (payload.new) {
            setInvitation((prev) =>
              prev ? { ...prev, data: payload.new.data as InvitationData } : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invitation?.id]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: document.title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#fff8f3" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#e8cfc3", borderTopColor: "#b88a78" }}
          />
          <p
            className="text-sm italic"
            style={{ color: "#b88a78", fontFamily: "Cormorant Garamond, serif" }}
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
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: "#fff8f3" }}
      >
        <p
          className="text-3xl mb-3"
          style={{ fontFamily: "Playfair Display, serif", color: "#b88a78" }}
        >
          Invitation Not Found
        </p>
        <p
          className="text-sm"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          This invitation link may be invalid or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
        style={{ border: "1px solid #e8cfc3" }}
        aria-label="Share invitation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b88a78" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
      <InvitationTemplate invitation={invitation} editMode={false} desktopMode={desktopMode} />
    </div>
  );
}
