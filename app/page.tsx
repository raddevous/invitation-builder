import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-rose-blush px-6 text-center"
      style={{ backgroundColor: "#fff8f3" }}>
      <div className="max-w-md">
        <p className="text-sm tracking-[0.3em] uppercase mb-4" style={{ color: "#b88a78", fontFamily: "Cormorant Garamond, serif" }}>
          Digital Invitations
        </p>
        <h1 className="text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "#5c4a3a" }}>
          Invitation Builder
        </h1>
        <p className="mb-10 text-lg" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8a6252" }}>
          Beautiful, personalised wedding invitations — shared in a link.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/tools"
            className="w-full max-w-xs py-3 px-6 rounded-full text-white font-medium tracking-wide transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#b88a78", fontFamily: "Cormorant Garamond, serif", fontSize: "1.1rem" }}
          >
            Edit My Invitation
          </Link>
          <Link
            href="/demo"
            className="w-full max-w-xs py-3 px-6 rounded-full font-medium tracking-wide transition-all hover:opacity-90 active:scale-95 border-2"
            style={{ borderColor: "#b88a78", color: "#b88a78", fontFamily: "Cormorant Garamond, serif", fontSize: "1.1rem" }}
          >
            Try Demo
          </Link>
        </div>
      </div>
    </main>
  );
}
