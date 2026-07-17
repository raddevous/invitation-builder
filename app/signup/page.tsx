import Link from "next/link";

export default function SignupPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#fff8f3" }}
    >
      <div className="max-w-md space-y-6">
        <h1
          className="text-3xl md:text-4xl"
          style={{ fontFamily: "Playfair Display, serif", color: "#5c4a3a" }}
        >
          Create Your Invitation
        </h1>
        <p
          className="text-base"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          Sign up is coming soon. In the meantime, you can explore the demo or
          return to the homepage.
        </p>
        <Link
          href="/"
          className="inline-block w-full max-w-xs py-3 px-6 rounded-full text-white font-medium tracking-wide transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: "#b88a78",
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "1.1rem",
          }}
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
