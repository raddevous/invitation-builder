import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";

async function getInvitationMeta(slug: string) {
  const { data } = await supabaseAdmin
    .from("invitations")
    .select("data")
    .eq("slug", slug)
    .single();

  return data?.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const inviteData = await getInvitationMeta(slug);

  if (!inviteData) {
    return {
      title: "Invitation | Instavow",
      description: "You're invited!",
    };
  }

  let title = "You're Invited | Instavow";
  if (inviteData.nameType === "couple") {
    const name1 = inviteData.hisName || "";
    const andText = inviteData.andText || "&";
    const name2 = inviteData.herName || "";
    title = `${name1} ${andText} ${name2} Invite You`;
  } else {
    title = `${inviteData.coupleName || "Event"} Invitation`;
  }

  const description = inviteData.countdownMessage || "You're invited! Join us for our special day.";

  const images = inviteData.heroIcon
    ? [{ url: inviteData.heroIcon, width: 1200, height: 630, alt: title }]
    : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Instavow",
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length > 0 ? images.map((img) => img.url) : undefined,
    },
  };
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
