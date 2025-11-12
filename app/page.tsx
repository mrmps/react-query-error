import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Homepage</h1>
      <p>
        Clicking the link below will navigate to a page that uses `useQuery`.
        In development with Strict Mode, this will trigger an `AbortError`
        overlay.
      </p>
      <Link
        href="/problem-page"
        style={{ color: "blue", textDecoration: "underline" }}
      >
        Go to Problem Page
      </Link>
    </main>
  );
}

