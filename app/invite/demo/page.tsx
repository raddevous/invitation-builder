import Link from "next/link";

export default function DemoInvitePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#fff8f3" }}
    >
      <div className="max-w-md space-y-6">
        <p
          className="text-sm tracking-[0.3em] uppercase"
          style={{ color: "#b88a78", fontFamily: "Cormorant Garamond, serif" }}
        >
          Demo Preview
        </p>
        <h1
          className="text-3xl md:text-4xl"
          style={{ fontFamily: "Playfair Display, serif", color: "#5c4a3a" }}
        >
          This is a Demo Invitation
        </h1>
        <p
          className="text-base md:text-lg"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          Demo invitations cannot be shared through a public link — they are only
          stored in your browser. To create your own beautiful, shareable
          invitation, sign up and get your personal builder access.
        </p>
        <p
          className="text-base"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          Already started designing in the demo? Your progress is saved locally,
          and you can continue exactly where you left off once you sign up.
        </p>
        <div className="flex flex-col gap-4 items-center pt-4">
          <Link
            href="/signup"
            className="w-full max-w-xs py-3 px-6 rounded-full text-white font-medium tracking-wide transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: "#b88a78",
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.1rem",
            }}
          >
            Create Your Invitation
          </Link>
          <Link
            href="/demo"
            className="w-full max-w-xs py-3 px-6 rounded-full font-medium tracking-wide transition-all hover:opacity-90 active:scale-95 border-2"
            style={{
              borderColor: "#b88a78",
              color: "#b88a78",
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.1rem",
            }}
          >
            Continue Designing Demo
          </Link>
        </div>
      </div>
    </main>
  );
}
